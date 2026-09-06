(function () {
  "use strict";

  var state = IFAStorage.load();
  if (!Array.isArray(state.geoTrail)) state.geoTrail = [];
  var tab = "map";
  var selectedHallId = null;
  var navFrom = "";
  var navTo = "";
  var pathIds = [];
  var query = "";
  var categoryFilter = "";
  var floorFilter = 0; // 0 = alle, 1 = EG, 2 = OG
  var unvisitedOnly = false;
  var offlineReady = false;
  var foodQuery = "";
  var foodZone = "all"; // all | hall | outdoor
  var foodTag = ""; // coffee|drinks|beer|veg|vegan|halal
  var foodLevel = "all"; // all | 1 | 2 | ZE1
  var draft = null;
  var geoPos = null;
  var geoStatus = "";
  var geoSaveTimer = null;
  var routeHint = "";
  var focusStandId = null;

  var CAT_ORDER = [
    "appliances", "smartHome", "connectivity", "computing", "audio", "beauty",
    "entertainment", "content", "next", "mobility", "global", "outdoor"
  ];
  var CAT_LABELS = {
    appliances: "Hausgeräte",
    smartHome: "Smart Home",
    connectivity: "Kommunikation",
    computing: "Computing",
    audio: "Audio",
    beauty: "Beauty Tech",
    entertainment: "Entertainment",
    content: "Content",
    next: "IFA Next",
    mobility: "Mobility",
    global: "Global Markets",
    outdoor: "Outdoor"
  };

  var els = {
    title: document.getElementById("screenTitle"),
    actions: document.getElementById("topbarActions"),
    progress: document.getElementById("progressCard"),
    main: document.getElementById("main"),
    dialog: document.getElementById("detailDialog"),
    detailTitle: document.getElementById("detailTitle"),
    detailBody: document.getElementById("detailBody"),
    detailSave: document.getElementById("detailSave"),
    detailClose: document.getElementById("detailClose")
  };

  function persist() { IFAStorage.save(state); }

  function ensureVisit(standId) {
    if (!state.standVisits[standId]) {
      state.standVisits[standId] = {
        visited: false,
        notes: "",
        photos: [],
        via: "",
        checkedInAt: null
      };
    }
    if (!Array.isArray(state.standVisits[standId].photos)) {
      state.standVisits[standId].photos = [];
    }
    return state.standVisits[standId];
  }

  function compressImage(file, done) {
    var reader = new FileReader();
    reader.onerror = function () { done(null); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { done(null); };
      img.onload = function () {
        var max = 960;
        var scale = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((img.width || 1) * scale));
        canvas.height = Math.max(1, Math.round((img.height || 1) * scale));
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          done(canvas.toDataURL("image/jpeg", 0.72));
        } catch (e) {
          done(null);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 500);
  }

  function csvEscape(value) {
    var s = String(value == null ? "" : value);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function buildExportRows() {
    var rows = [];
    stands().forEach(function (s) {
      var v = state.standVisits[s.id] || {};
      var book = !!state.bookmarks[s.id];
      if (!v.visited && !book && !(v.notes || (v.photos && v.photos.length))) return;
      var h = hall(s.hallId) || {};
      rows.push({
        name: s.name,
        booth: s.booth || "",
        hall: h.name || s.hallId,
        hallCode: h.shortCode || "",
        visited: v.visited ? "ja" : "nein",
        bookmarked: book ? "ja" : "nein",
        checkedInAt: v.checkedInAt || "",
        via: v.via || "",
        notes: v.notes || "",
        photos: Array.isArray(v.photos) ? v.photos.length : 0
      });
    });
    rows.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), "de");
    });
    return rows;
  }

  function exportDiary(format) {
    var rows = buildExportRows();
    var stamp = new Date().toISOString().slice(0, 10);
    if (!rows.length) {
      alert("Noch nichts zum Exportieren (Merkliste, Besuche oder Notizen).");
      return;
    }
    if (format === "csv") {
      var header = ["Name", "Standnr", "Halle", "Hallen-Code", "Besucht", "Gemerkt", "Check-in", "Via", "Notizen", "Fotos"];
      var lines = [header.join(",")].concat(rows.map(function (r) {
        return [
          csvEscape(r.name), csvEscape(r.booth), csvEscape(r.hall), csvEscape(r.hallCode),
          csvEscape(r.visited), csvEscape(r.bookmarked), csvEscape(r.checkedInAt),
          csvEscape(r.via), csvEscape(r.notes), csvEscape(r.photos)
        ].join(",");
      }));
      downloadText("ifa-tagebuch-" + stamp + ".csv", lines.join("\n"), "text/csv;charset=utf-8");
      return;
    }
    var text = "IFA Tagebuch Export (" + stamp + ")\n" +
      "====================================\n\n";
    rows.forEach(function (r) {
      text += r.name + "\n";
      text += "  Halle: " + r.hall + (r.hallCode ? " (" + r.hallCode + ")" : "") + "\n";
      if (r.booth) text += "  Stand: " + r.booth + "\n";
      text += "  Besucht: " + r.visited + " · Gemerkt: " + r.bookmarked + "\n";
      if (r.checkedInAt) text += "  Check-in: " + r.checkedInAt + (r.via ? " (" + r.via + ")" : "") + "\n";
      if (r.notes) text += "  Notiz: " + r.notes + "\n";
      if (r.photos) text += "  Fotos: " + r.photos + "\n";
      text += "\n";
    });
    var events = state.events || [];
    if (events.length) {
      text += "Timeline\n--------\n";
      events.slice(0, 100).forEach(function (ev) {
        text += (ev.timestamp || "") + " · " + (ev.kind || "") + " · " +
          (ev.standName || ev.hallName || "") + "\n";
      });
    }
    downloadText("ifa-tagebuch-" + stamp + ".txt", text, "text/plain;charset=utf-8");
  }


  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(s) { return esc(s).replace(/"/g, "&quot;"); }

  function fmt(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
  }

  function halls() { return window.IFA_HALLS || []; }
  function stands() { return IFAStorage.allStands(state); }
  function foodList() { return window.IFA_FOOD || []; }

  function foodById(id) {
    return foodList().find(function (f) { return f.id === id; });
  }

  function foodLevelLabel(level) {
    if (level === "1") return "Ebene 1";
    if (level === "2") return "Ebene 2";
    if (level === "ZE1") return "Zwischenebene";
    return level || "";
  }

  function foodTagLabel(tag) {
    return ({
      coffee: "Kaffee",
      drinks: "Getränke",
      beer: "Bier",
      veg: "Vegetarisch",
      vegan: "Vegan",
      halal: "Halal"
    })[tag] || tag;
  }

  function filteredFood() {
    var q = norm(foodQuery.trim());
    return foodList().filter(function (f) {
      if (foodZone === "hall" && f.zone !== "hall") return false;
      if (foodZone === "outdoor" && f.zone !== "outdoor") return false;
      if (foodLevel !== "all" && f.level !== foodLevel) return false;
      if (foodTag && (f.tags || []).indexOf(foodTag) === -1) return false;
      if (!q) return true;
      var hay = [f.id, f.name, f.type, f.level, f.zone, foodLevelLabel(f.level)]
        .concat(f.tags || []).concat((f.tags || []).map(foodTagLabel))
        .map(norm).join(" ");
      return q.split(/\s+/).every(function (part) {
        return part && hay.indexOf(part) !== -1;
      });
    });
  }

  function openFoodSheet(foodId) {
    var f = foodById(foodId);
    if (!f) return;
    draft = null;
    els.detailTitle.textContent = f.name;
    els.detailSave.classList.add("hidden");
    els.detailBody.innerHTML =
      '<div class="status-pill on">Nr. ' + esc(f.id) + "</div>" +
      '<p class="muted">' + esc(f.type) + "</p>" +
      '<p><strong>' + (f.zone === "outdoor" ? "Outdoor / Freigelände" : "In den Hallen") +
      "</strong> · " + esc(foodLevelLabel(f.level)) + "</p>" +
      '<div class="food-tags">' +
      (f.tags || []).map(function (tag) {
        return '<span class="food-tag ' + tag + '">' + esc(foodTagLabel(tag)) + "</span>";
      }).join("") +
      "</div>" +
      '<p class="muted">Nummer am Messe-Cateringplan. Outdoor-Stände liegen im Freigelände / Sommergarten-Bereich.</p>' +
      (f.zone === "outdoor"
        ? '<button type="button" class="primary-btn" id="btnFoodMap">Sommergarten auf Plan</button>'
        : '<button type="button" class="secondary-btn" id="btnFoodClose">Schließen</button>');
    var mapBtn = els.detailBody.querySelector("#btnFoodMap");
    if (mapBtn) mapBtn.onclick = function () {
      closeDialog();
      selectedHallId = "sg";
      tab = "map";
      document.querySelectorAll(".tab").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-tab") === "halls");
      });
      pathIds = [];
      routeHint = "Essen Outdoor · " + f.name;
      render();
    };
    var closeBtn = els.detailBody.querySelector("#btnFoodClose");
    if (closeBtn) closeBtn.onclick = function () { closeDialog(); };
    openDialog();
  }


  function hall(id) { return IFAMap.hallById(id); }
  function stand(id) {
    return stands().find(function (s) { return s.id === id; });
  }

  function visitedHallMap() {
    var map = {};
    Object.keys(state.hallVisits || {}).forEach(function (id) {
      if (state.hallVisits[id] && state.hallVisits[id].visited) map[id] = true;
    });
    stands().forEach(function (s) {
      var v = state.standVisits[s.id];
      if (v && v.visited) map[s.hallId] = true;
    });
    return map;
  }

  function markHall(hallId) {
    if (!hallId) return;
    if (!state.hallVisits[hallId]) state.hallVisits[hallId] = {};
    var hv = state.hallVisits[hallId];
    if (hv.visited) return;
    hv.visited = true;
    hv.checkedInAt = new Date().toISOString();
    var h = hall(hallId);
    IFAStorage.addEvent(state, {
      kind: "hallCheckIn",
      hallId: hallId,
      hallName: h ? h.name : hallId
    });
  }

  function progress() {
    var totalH = halls().length;
    var visH = Object.keys(visitedHallMap()).length;
    var totalS = stands().length;
    var visS = Object.keys(state.standVisits || {}).filter(function (id) {
      return state.standVisits[id] && state.standVisits[id].visited;
    }).length;
    return {
      totalH: totalH, visH: visH,
      pct: totalH ? Math.round((visH / totalH) * 100) : 0,
      totalS: totalS, visS: visS
    };
  }

  function renderProgress() {
    var p = progress();
    els.progress.innerHTML =
      '<div class="label"><span>Fortschritt</span><span>' + p.visH + "/" + p.totalH + " Hallen</span></div>" +
      '<div class="bar"><span style="width:' + p.pct + '%"></span></div>' +
      '<p class="muted" style="margin:8px 0 0">' + p.visS + " Stände · QR oder manuell</p>";
  }

  function openDialog() {
    if (els.dialog.showModal) els.dialog.showModal();
    else els.dialog.setAttribute("open", "open");
  }
  function closeDialog() {
    IFAScanner.stop();
    if (els.dialog.close) els.dialog.close();
    else els.dialog.removeAttribute("open");
    draft = null;
    els.detailSave.classList.add("hidden");
  }

  function hallOptions(selected) {
    return halls().map(function (h) {
      return '<option value="' + h.id + '"' + (h.id === selected ? " selected" : "") + ">" + esc(h.name) + "</option>";
    }).join("");
  }

  function setPlanTabActive() {
    document.querySelectorAll(".tab").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === "halls");
    });
  }

  function nearestHallId() {
    if (!geoPos || typeof geoPos.x !== "number" || typeof geoPos.y !== "number") return "";
    var best = "";
    var bestD = Infinity;
    halls().forEach(function (h) {
      if (!h || h.mapRole === "park") return;
      var cx = Number(h.x) + Number(h.w || 0) / 2;
      var cy = Number(h.y) + Number(h.h || 0) / 2;
      var dx = cx - geoPos.x;
      var dy = cy - geoPos.y;
      var d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = h.id;
      }
    });
    return best;
  }

  function hallLabel(id) {
    var h = hall(id);
    if (!h) return id || "";
    return h.shortCode || h.name || id;
  }

  function navigateToHall(hallId, opts) {
    opts = opts || {};
    var target = hall(hallId);
    if (!target) return;

    var fromId = opts.fromId || navFrom || selectedHallId || nearestHallId() || "";
    if (fromId === hallId) {
      var alt = nearestHallId();
      if (alt && alt !== hallId) fromId = alt;
      else if (navFrom && navFrom !== hallId) fromId = navFrom;
      else fromId = "";
    }

    selectedHallId = hallId;
    navTo = hallId;
    focusStandId = opts.standId || null;
    routeHint = opts.label || (target.name + (target.shortCode ? " (" + target.shortCode + ")" : ""));

    if (fromId && fromId !== hallId) {
      navFrom = fromId;
      pathIds = IFAMap.findPath(fromId, hallId) || [];
    } else {
      pathIds = hallId ? [hallId] : [];
    }

    if (target.floor === 2) IFAMap.setFloor("og");
    else IFAMap.setFloor("eg");

    setPlanTabActive();
    tab = opts.openHall ? "hall" : "map";
    render();
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function clearNavigation() {
    navFrom = "";
    navTo = "";
    pathIds = [];
    routeHint = "";
    focusStandId = null;
  }

  function navigateToStand(standId, openHall) {
    var s = stand(standId);
    if (!s) return;
    var h = hall(s.hallId);
    var label = s.name;
    if (h) label += " · " + (h.shortCode || h.name);
    if (s.booth) label += " · " + s.booth;
    navigateToHall(s.hallId, {
      standId: standId,
      label: label,
      openHall: !!openHall
    });
  }

  function openStandSheet(standId) {
    var s = stand(standId);
    if (!s) return;
    var visit = ensureVisit(standId);
    var h = hall(s.hallId);
    draft = null;
    els.detailTitle.textContent = s.name;
    els.detailSave.classList.add("hidden");
    var photos = visit.photos || [];
    els.detailBody.innerHTML =
      '<div class="status-pill ' + (visit.visited ? "on" : "") + '">' +
      (visit.visited ? "Besucht" : "Nicht besucht") +
      (visit.checkedInAt ? " · " + fmt(visit.checkedInAt) : "") +
      (visit.via === "qr" ? " · QR" : visit.via === "manual" ? " · manuell" : "") +
      "</div>" +
      '<p class="muted">' + esc(h ? h.name : s.hallId) + (s.booth ? " · " + esc(s.booth) : "") + "</p>" +
      (visit.notes ? '<div class="note-block"><p class="section-title" style="margin:0 0 6px">Notiz</p><p>' + esc(visit.notes) + "</p></div>" : "") +
      (photos.length ?
        '<div class="photo-grid">' + photos.map(function (src, idx) {
          return '<button type="button" class="photo-thumb" data-photo="' + idx + '">' +
            '<img src="' + src + '" alt="Foto ' + (idx + 1) + '" /></button>';
        }).join("") + "</div>" : "") +
      '<button type="button" class="primary-btn" id="btnNotes">Notiz & Fotos</button>' +
      '<button type="button" class="secondary-btn" id="btnNav">Route zum Stand</button>' +
      '<button type="button" class="secondary-btn" id="btnHallNav">In Halle zeigen</button>' +
      '<button type="button" class="secondary-btn" id="btnQr">QR-Code scannen</button>' +
      '<button type="button" class="secondary-btn" id="btnManual">Manuell eintragen (ohne QR)</button>' +
      '<button type="button" class="secondary-btn" id="btnBook">' +
      (state.bookmarks[standId] ? "Von Merkliste nehmen" : "Auf Merkliste") + "</button>" +
      (visit.visited ? '<button type="button" class="danger-btn" id="btnReset">Besuch löschen</button>' : "");

    els.detailBody.querySelector("#btnNotes").onclick = function () {
      openForm({
        standId: standId,
        name: s.name,
        booth: s.booth || "",
        hallId: s.hallId,
        via: visit.via || "manual",
        notes: visit.notes || "",
        photos: (visit.photos || []).slice(),
        notesOnly: !visit.visited
      });
    };
    els.detailBody.querySelector("#btnNav").onclick = function () {
      closeDialog();
      navigateToStand(standId, false);
    };
    els.detailBody.querySelector("#btnHallNav").onclick = function () {
      closeDialog();
      navigateToStand(standId, true);
    };
    els.detailBody.querySelector("#btnQr").onclick = function () { startScan(standId); };
    els.detailBody.querySelector("#btnManual").onclick = function () {
      openForm({
        standId: standId,
        name: s.name,
        booth: s.booth || "",
        hallId: s.hallId,
        via: "manual",
        notes: visit.notes || "",
        photos: (visit.photos || []).slice()
      });
    };
    els.detailBody.querySelector("#btnBook").onclick = function () {
      if (state.bookmarks[standId]) delete state.bookmarks[standId];
      else state.bookmarks[standId] = true;
      persist();
      openStandSheet(standId);
    };
    var reset = els.detailBody.querySelector("#btnReset");
    if (reset) reset.onclick = function () {
      delete state.standVisits[standId];
      persist();
      openStandSheet(standId);
      render();
    };
    els.detailBody.querySelectorAll("[data-photo]").forEach(function (btn) {
      btn.onclick = function () {
        var idx = Number(btn.getAttribute("data-photo"));
        var src = photos[idx];
        if (!src) return;
        els.detailTitle.textContent = "Foto";
        els.detailSave.classList.add("hidden");
        els.detailBody.innerHTML =
          '<img class="photo-full" src="' + src + '" alt="Foto" />' +
          '<button type="button" class="secondary-btn" id="btnBackPhoto">Zurück</button>' +
          '<button type="button" class="danger-btn" id="btnDelPhoto">Foto löschen</button>';
        els.detailBody.querySelector("#btnBackPhoto").onclick = function () { openStandSheet(standId); };
        els.detailBody.querySelector("#btnDelPhoto").onclick = function () {
          var v = ensureVisit(standId);
          v.photos.splice(idx, 1);
          persist();
          openStandSheet(standId);
        };
      };
    });
    openDialog();
  }

  function openForm(data) {
    var existing = data.standId ? (state.standVisits[data.standId] || {}) : {};
    draft = {
      standId: data.standId || null,
      name: data.name || "",
      booth: data.booth || "",
      hallId: data.hallId || selectedHallId || "2.1",
      notes: data.notes != null ? data.notes : (existing.notes || ""),
      photos: Array.isArray(data.photos) ? data.photos.slice() : (Array.isArray(existing.photos) ? existing.photos.slice() : []),
      via: data.via || "manual",
      qrPayload: data.qrPayload || "",
      notesOnly: !!data.notesOnly
    };
    els.detailTitle.textContent = draft.notesOnly ? "Notiz & Fotos" : (draft.standId ? "Stand besuchen" : "Neuer Stand");
    els.detailSave.classList.remove("hidden");
    els.detailSave.textContent = "Speichern";
    function paintForm() {
      els.detailBody.innerHTML =
        (draft.qrPayload
          ? '<div class="status-pill on">QR erkannt</div><p class="muted break">' + esc(draft.qrPayload) + "</p>"
          : (draft.notesOnly
            ? '<p class="muted">Notizen und Fotos lokal speichern — auch offline.</p>'
            : '<p class="muted">Kein QR vorhanden? Einfach manuell speichern.</p>')) +
        '<div class="field"><label for="fName">Hersteller / Stand</label>' +
        '<input id="fName" value="' + escAttr(draft.name) + '" placeholder="z. B. Samsung" /></div>' +
        '<div class="field"><label for="fBooth">Standnummer (optional)</label>' +
        '<input id="fBooth" value="' + escAttr(draft.booth) + '" placeholder="H2.1-101" /></div>' +
        '<div class="field"><label for="fHall">Halle</label><select id="fHall">' + hallOptions(draft.hallId) + "</select></div>" +
        '<div class="field"><label for="fNotes">Notiz</label>' +
        '<textarea id="fNotes" rows="4" placeholder="Was war interessant?">' + esc(draft.notes) + "</textarea></div>" +
        '<div class="field"><label>Fotos (max. 4)</label>' +
        '<div class="photo-grid edit">' +
        (draft.photos.map(function (src, idx) {
          return '<div class="photo-thumb"><img src="' + src + '" alt="Foto" />' +
            '<button type="button" class="photo-del" data-del-photo="' + idx + '">×</button></div>';
        }).join("")) +
        (draft.photos.length < 4
          ? '<label class="photo-add">+ Foto<input id="fPhoto" type="file" accept="image/*" capture="environment" hidden /></label>'
          : "") +
        "</div></div>";

      els.detailBody.querySelector("#fName").oninput = function (e) { draft.name = e.target.value; };
      els.detailBody.querySelector("#fBooth").oninput = function (e) { draft.booth = e.target.value; };
      els.detailBody.querySelector("#fHall").onchange = function (e) { draft.hallId = e.target.value; };
      els.detailBody.querySelector("#fNotes").oninput = function (e) { draft.notes = e.target.value; };
      els.detailBody.querySelectorAll("[data-del-photo]").forEach(function (btn) {
        btn.onclick = function () {
          draft.photos.splice(Number(btn.getAttribute("data-del-photo")), 1);
          paintForm();
        };
      });
      var fileInput = els.detailBody.querySelector("#fPhoto");
      if (fileInput) fileInput.onchange = function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        compressImage(file, function (dataUrl) {
          if (!dataUrl) { alert("Foto konnte nicht geladen werden."); return; }
          if (draft.photos.length >= 4) return;
          draft.photos.push(dataUrl);
          paintForm();
        });
      };
    }
    paintForm();
    openDialog();
  }

  function saveForm() {
    if (!draft) return;
    var name = String(draft.name || "").trim();
    if (!name) { alert("Bitte einen Namen eingeben."); return; }

    var id = draft.standId;
    if (!id) {
      id = "custom-" + IFAStorage.uid();
      state.customStands.push({
        id: id,
        hallId: draft.hallId,
        name: name,
        booth: String(draft.booth || "").trim(),
        x: 10 + Math.random() * 70,
        y: 14 + Math.random() * 60,
        custom: true
      });
    } else {
      var custom = state.customStands.find(function (s) { return s.id === id; });
      if (custom) {
        custom.name = name;
        custom.booth = String(draft.booth || "").trim();
        custom.hallId = draft.hallId;
      }
    }

    var prev = state.standVisits[id] || {};
    var nowIso = new Date().toISOString();
    var markVisited = !draft.notesOnly || !!prev.visited;
    state.standVisits[id] = {
      visited: markVisited ? true : !!prev.visited,
      checkedInAt: markVisited ? (prev.checkedInAt || nowIso) : (prev.checkedInAt || null),
      notes: String(draft.notes || "").trim(),
      photos: Array.isArray(draft.photos) ? draft.photos.slice(0, 4) : [],
      via: draft.via || prev.via || "manual",
      qrPayload: draft.qrPayload || prev.qrPayload || ""
    };
    if (markVisited) {
      markHall(draft.hallId);
      if (!prev.visited) {
        IFAStorage.addEvent(state, {
          kind: draft.via === "qr" ? "standQr" : "standManual",
          hallId: draft.hallId,
          hallName: (hall(draft.hallId) || {}).name || draft.hallId,
          standId: id,
          standName: name
        });
      }
    }
    persist();
    selectedHallId = draft.hallId;
    closeDialog();
    if (draft.notesOnly) {
      openStandSheet(id);
      render();
      return;
    }
    tab = "hall";
    render();
  }

  function parseQr(raw) {
    var text = String(raw || "").trim();
    var name = "", booth = "", hallId = selectedHallId || "";
    try {
      if (/^https?:\/\//i.test(text)) {
        var u = new URL(text);
        name = u.searchParams.get("name") || u.searchParams.get("exhibitor") || "";
        booth = u.searchParams.get("booth") || u.searchParams.get("stand") || "";
        hallId = u.searchParams.get("hall") || hallId;
      }
    } catch (e) {}
    if (!name && text.charAt(0) === "{") {
      try {
        var j = JSON.parse(text);
        name = j.name || j.exhibitor || j.company || "";
        booth = j.booth || j.stand || "";
        hallId = j.hall || j.hallId || hallId;
      } catch (e2) {}
    }
    if (!name) {
      var parts = text.split(/[|;]/).map(function (x) { return x.trim(); });
      name = parts[0] || text.slice(0, 60);
      if (parts[1]) booth = parts[1];
      if (parts[2]) hallId = parts[2];
    }
    var known = stands().find(function (s) {
      return s.name.toLowerCase() === String(name).toLowerCase();
    });
    return {
      standId: known ? known.id : null,
      name: known ? known.name : name,
      booth: booth || (known && known.booth) || "",
      hallId: (known && known.hallId) || hallId || "2.1",
      qrPayload: text,
      via: "qr"
    };
  }

  function startScan(standId) {
    closeDialog();
    IFAScanner.open(function (raw) {
      var parsed = parseQr(raw);
      if (standId) {
        var s = stand(standId);
        openForm({
          standId: standId,
          name: (s && s.name) || parsed.name,
          booth: (s && s.booth) || parsed.booth,
          hallId: (s && s.hallId) || parsed.hallId,
          via: "qr",
          qrPayload: raw
        });
      } else {
        openForm(parsed);
      }
    });
  }

  function bind(root) {
    root.querySelectorAll("[data-nav-hall]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var id = el.getAttribute("data-nav-hall");
        var h = hall(id);
        navigateToHall(id, { label: h ? h.name : id });
      });
    });
    root.querySelectorAll("[data-nav-stand]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        navigateToStand(el.getAttribute("data-nav-stand"), false);
      });
    });
    root.querySelectorAll("[data-hall]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        selectedHallId = el.getAttribute("data-hall");
        tab = "hall";
        render();
      });
    });
    root.querySelectorAll("[data-stand]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openStandSheet(el.getAttribute("data-stand"));
      });
    });
  }

  function paintMapCard(card) {
    var fl = IFAMap.getFloor();
    var tracking = !!(window.IFAGps && IFAGps.isTracking());
    card.innerHTML =
      '<div class="floor-toggle seg" role="group" aria-label="Ebene">' +
      '<button type="button" data-floor="eg" class="' + (fl === "eg" ? "active" : "") + '">EG (.1)</button>' +
      '<button type="button" data-floor="og" class="' + (fl === "og" ? "active" : "") + '">OG (.2)</button>' +
      "</div>" +
      '<div class="gps-bar">' +
      '<button type="button" class="secondary-btn gps-btn" id="btnGps">' +
      (tracking ? "GPS aus" : "GPS an") + "</button>" +
      '<button type="button" class="secondary-btn gps-btn" id="btnGpsClear">Spur löschen</button>' +
      "</div>" +
      IFAMap.renderSiteMap({
        selectedId: selectedHallId,
        pathIds: pathIds,
        visited: visitedHallMap(),
        geoTrail: state.geoTrail || [],
        geoPos: geoPos
      }) +
      '<p class="muted map-caption" id="gpsStatus">' +
      esc(geoStatus || "GPS optional · in Hallen oft ungenau · Spur wie beim Sauger") +
      "</p>";
    card.querySelectorAll("[data-floor]").forEach(function (btn) {
      btn.onclick = function () {
        IFAMap.setFloor(btn.getAttribute("data-floor"));
        paintMapCard(card);
        bind(card);
      };
    });
    var gpsBtn = card.querySelector("#btnGps");
    if (gpsBtn) gpsBtn.onclick = function () { toggleGps(card); };
    var clearBtn = card.querySelector("#btnGpsClear");
    if (clearBtn) clearBtn.onclick = function () {
      state.geoTrail = [];
      geoPos = null;
      geoStatus = "Spur gelöscht.";
      persist();
      paintMapCard(card);
      bind(card);
    };
  }

  function scheduleGeoSave() {
    if (geoSaveTimer) clearTimeout(geoSaveTimer);
    geoSaveTimer = setTimeout(function () { persist(); }, 1200);
  }

  function onGpsUpdate(payload) {
    var card = document.getElementById("mapCard");
    if (payload.error) {
      geoStatus = payload.error;
      if (card && tab === "map") {
        var st = card.querySelector("#gpsStatus");
        if (st) st.textContent = geoStatus;
      }
      return;
    }
    var fix = payload.fix;
    if (!fix) return;
    geoPos = { x: fix.x, y: fix.y, accuracy: fix.accuracy };
    if (!fix.onSite) {
      geoStatus = "GPS aktiv, aber außerhalb der Messe-Karte (±" + Math.round(fix.accuracy || 0) + " m)";
    } else {
      geoStatus =
        "GPS ±" + Math.round(fix.accuracy || 0) + " m · " +
        (state.geoTrail ? state.geoTrail.length : 0) + " Spurpunkte";
      if (IFAGps.shouldKeepPoint(state.geoTrail, fix)) {
        state.geoTrail.push({
          lat: fix.lat,
          lng: fix.lng,
          x: fix.x,
          y: fix.y,
          accuracy: fix.accuracy,
          at: fix.at
        });
        if (state.geoTrail.length > 800) state.geoTrail = state.geoTrail.slice(-800);
        scheduleGeoSave();
      }
    }
    if (card && tab === "map") {
      paintMapCard(card);
      bind(card);
    }
  }

  function toggleGps(card) {
    if (!window.IFAGps) {
      alert("GPS-Modul nicht geladen.");
      return;
    }
    if (IFAGps.isTracking()) {
      IFAGps.stop();
      state.geoTracking = false;
      geoStatus = "GPS aus.";
      persist();
      paintMapCard(card);
      bind(card);
      return;
    }
    geoStatus = "GPS wird angefragt…";
    paintMapCard(card);
    bind(card);
    state.geoTracking = true;
    persist();
    IFAGps.start(onGpsUpdate);
  }

  function goSearch(focusInput) {
    tab = "search";
    document.querySelectorAll(".tab").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === "search");
    });
    render();
    try { window.scrollTo(0, 0); } catch (e) {}
    if (focusInput === false) return;
    setTimeout(function () {
      var input = document.getElementById("searchInput");
      if (input) input.focus();
    }, 30);
  }

  function renderMap() {
    els.title.textContent = "Lageplan";
    els.actions.innerHTML =
      '<button type="button" class="icon-chip" id="quickSearch">Suche</button>' +
      '<button type="button" class="icon-chip" id="quickQr">QR</button>';
    els.actions.querySelector("#quickSearch").onclick = function () {
      goSearch(true);
    };
    els.actions.querySelector("#quickQr").onclick = function () { startScan(null); };

    var opts = '<option value="">Halle…</option>' + halls().map(function (h) {
      return '<option value="' + h.id + '">' + esc(h.name) + "</option>";
    }).join("");

    els.main.innerHTML =
      '<div class="map-card" id="mapCard"></div>' +
      '<div class="nav-card"><h2>Navigation</h2>' +
      (routeHint ? '<p class="route-target"><strong>Ziel:</strong> ' + esc(routeHint) + "</p>" : "") +
      '<div class="nav-row"><label>Von</label><select id="navFrom">' + opts + "</select></div>" +
      '<div class="nav-row"><label>Nach</label><select id="navTo">' + opts + "</select></div>" +
      '<button type="button" class="primary-btn" id="btnRoute">Route zeigen</button>' +
      (navTo ? '<button type="button" class="secondary-btn" id="btnOpenTarget">Zielhalle öffnen</button>' : "") +
      (navTo || pathIds.length ? '<button type="button" class="secondary-btn danger-outline" id="btnEndNav">Navigation beenden</button>' : "") +
      '<p class="muted" id="routeInfo"></p></div>' +
      '<button type="button" class="secondary-btn" id="btnNew">+ Stand ohne QR anlegen</button>';

    var card = els.main.querySelector("#mapCard");
    paintMapCard(card);

    var fromSel = els.main.querySelector("#navFrom");
    var toSel = els.main.querySelector("#navTo");
    fromSel.value = navFrom; toSel.value = navTo;
    fromSel.onchange = function () { navFrom = fromSel.value; };
    toSel.onchange = function () { navTo = toSel.value; };

    function paintRouteInfo() {
      var info = els.main.querySelector("#routeInfo");
      if (!info) return;
      if (pathIds.length > 1) {
        info.textContent = "Route: " + pathIds.map(hallLabel).join(" → ");
      } else if (navTo && !navFrom) {
        info.textContent = "Ziel gesetzt — bitte Start (Von) wählen oder GPS anschalten.";
      } else if (navTo && pathIds.length === 1) {
        info.textContent = "Du bist am Ziel / Start = Ziel.";
      } else {
        info.textContent = "";
      }
    }
    paintRouteInfo();

    els.main.querySelector("#btnRoute").onclick = function () {
      navFrom = fromSel.value; navTo = toSel.value;
      if (!navFrom || !navTo) { alert("Start und Ziel wählen."); return; }
      pathIds = IFAMap.findPath(navFrom, navTo) || [];
      focusStandId = focusStandId; // keep
      var target = hall(navTo);
      if (target && target.floor === 2) IFAMap.setFloor("og");
      else if (target && target.floor === 1) IFAMap.setFloor("eg");
      selectedHallId = navTo;
      if (!routeHint) routeHint = (target && target.name) || navTo;
      paintRouteInfo();
      if (!pathIds.length) {
        els.main.querySelector("#routeInfo").textContent = "Keine Route gefunden.";
      }
      paintMapCard(card);
      bind(card);
    };

    var openTarget = els.main.querySelector("#btnOpenTarget");
    if (openTarget) openTarget.onclick = function () {
      if (!navTo) return;
      selectedHallId = navTo;
      tab = "hall";
      render();
    };

    var endNav = els.main.querySelector("#btnEndNav");
    if (endNav) endNav.onclick = function () {
      clearNavigation();
      render();
      try { window.scrollTo(0, 0); } catch (e) {}
    };

    els.main.querySelector("#btnNew").onclick = function () {
      openForm({ hallId: selectedHallId || "2.1", via: "manual" });
    };
    bind(els.main);

    if (state.geoTracking && window.IFAGps && !IFAGps.isTracking()) {
      IFAGps.start(onGpsUpdate);
    }
  }

  function renderHall() {
    var h = hall(selectedHallId);
    if (!h) { tab = "map"; return renderMap(); }
    els.title.textContent = h.name;
    els.actions.innerHTML =
      '<button type="button" class="icon-chip" id="backMap">Plan</button>' +
      ((navTo || focusStandId) ? '<button type="button" class="icon-chip" id="endNavHall">Nav aus</button>' : "");
    els.actions.querySelector("#backMap").onclick = function () { tab = "map"; render(); };
    var endHall = els.actions.querySelector("#endNavHall");
    if (endHall) endHall.onclick = function () {
      clearNavigation();
      tab = "map";
      render();
    };

    var list = stands().filter(function (s) { return s.hallId === h.id; });
    var q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(function (s) {
        return s.name.toLowerCase().indexOf(q) !== -1 ||
          String(s.booth || "").toLowerCase().indexOf(q) !== -1;
      });
    }

    els.main.innerHTML =
      '<input class="search" id="search" placeholder="Stand suchen…" value="' + escAttr(query) + '" />' +
      '<div class="map-card">' + IFAMap.renderHallFloor(h.id, list, state.standVisits, focusStandId) + "</div>" +
      '<div class="chip-row">' +
      '<button type="button" class="chip hint-chip" id="hallQr">QR scannen</button>' +
      '<button type="button" class="chip hint-chip" id="hallManual">Manuell</button>' +
      '<button type="button" class="chip hint-chip" id="hallCheck">' +
      (state.hallVisits[h.id] && state.hallVisits[h.id].visited ? "Halle ✓" : "Halle check-in") +
      "</button></div>" +
      (h.hints ? '<p class="muted">Bekannt u. a.: ' + esc(h.hints) + "</p>" : "") +
      '<h2 class="section-title">Stände (' + list.length + ')</h2><div class="hall-list">' +
      (list.length ? list.map(function (s) {
        var v = state.standVisits[s.id];
        return '<button type="button" class="hall-row' + (focusStandId === s.id ? " focus" : "") + '" data-stand="' + s.id + '">' +
          '<span class="hall-code ' + (v && v.visited ? "visited" : "") + '">' + (v && v.visited ? "✓" : "·") + "</span>" +
          '<span class="hall-meta"><strong>' + esc(s.name) + "</strong><span>" +
          esc(s.booth || "ohne Nr.") + (state.bookmarks[s.id] ? " · gemerkt" : "") +
          "</span></span></button>";
      }).join("") : '<div class="empty">Noch keine Stände – QR scannen oder manuell anlegen</div>') +
      "</div>";

    var search = els.main.querySelector("#search");
    search.oninput = function (e) {
      query = e.target.value;
      renderHall();
      var again = document.getElementById("search");
      if (again) { again.focus(); again.setSelectionRange(query.length, query.length); }
    };
    els.main.querySelector("#hallQr").onclick = function () { startScan(null); };
    els.main.querySelector("#hallManual").onclick = function () {
      openForm({ hallId: h.id, via: "manual" });
    };
    els.main.querySelector("#hallCheck").onclick = function () {
      markHall(h.id); persist(); render();
    };
    bind(els.main);
  }

  function catLabel(id) {
    var cat = (window.IFA_CATEGORIES || {})[id];
    return CAT_LABELS[id] || (cat && cat.name) || id;
  }

  function catColor(id) {
    var cat = (window.IFA_CATEGORIES || {})[id];
    return (cat && cat.color) || "#64748b";
  }

  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  }

  function standMatches(s, h, q) {
    if (!q) return true;
    // Nur Stand + Halle/Code/Kategorie – nicht die Hallen-Hints (sonst matcht z. B. „Edifier“ alle Nachbarn)
    var hay = [
      s.name, s.booth,
      h && h.name, h && h.shortCode, h && h.area,
      h && h.category, h && catLabel(h.category)
    ].map(norm).join(" ");
    return q.split(/\s+/).every(function (part) {
      return part && hay.indexOf(part) !== -1;
    });
  }

  function filteredStands() {
    var q = norm(query.trim());
    return stands().filter(function (s) {
      var h = hall(s.hallId);
      if (!h) return false;
      if (categoryFilter && h.category !== categoryFilter) return false;
      if (floorFilter && h.floor !== floorFilter) return false;
      if (unvisitedOnly) {
        var v = state.standVisits[s.id];
        if (v && v.visited) return false;
      }
      return standMatches(s, h, q);
    }).sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), "de");
    });
  }

  function filteredHalls() {
    var q = norm(query.trim());
    return halls().filter(function (h) {
      if (categoryFilter && h.category !== categoryFilter) return false;
      if (floorFilter && h.floor !== floorFilter) return false;
      if (!q) return !!categoryFilter;
      var hay = [h.name, h.shortCode, h.hints, h.area, h.category, catLabel(h.category)]
        .map(norm).join(" ");
      return q.split(/\s+/).every(function (part) {
        return part && hay.indexOf(part) !== -1;
      });
    }).sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), "de");
    });
  }

  function renderSearch() {
    els.title.textContent = "Suche";
    els.actions.innerHTML = "";

    var list = filteredStands();
    var hallHits = filteredHalls().slice(0, 8);
    var shown = list.slice(0, 80);
    var cats = CAT_ORDER.filter(function (id) {
      return (window.IFA_CATEGORIES || {})[id];
    });

    els.main.innerHTML =
      '<input class="search" id="searchInput" type="search" enterkeyhint="search" ' +
      'placeholder="Aussteller, Standnr., Halle…" value="' + escAttr(query) + '" />' +
      '<div class="cat-scroll" id="catScroll">' +
      '<button type="button" class="cat-chip' + (!categoryFilter ? " active" : "") +
      '" data-cat="">Alle</button>' +
      cats.map(function (id) {
        return '<button type="button" class="cat-chip' + (categoryFilter === id ? " active" : "") +
          '" data-cat="' + id + '" style="color:' + catColor(id) + '">' +
          '<span class="dot"></span>' + esc(catLabel(id)) + "</button>";
      }).join("") +
      "</div>" +
      '<div class="floor-chips">' +
      '<button type="button" class="floor-chip' + (floorFilter === 0 ? " active" : "") +
      '" data-floor="0">Alle Ebenen</button>' +
      '<button type="button" class="floor-chip' + (floorFilter === 1 ? " active" : "") +
      '" data-floor="1">EG</button>' +
      '<button type="button" class="floor-chip' + (floorFilter === 2 ? " active" : "") +
      '" data-floor="2">OG</button>' +
      "</div>" +
      '<div class="visit-chips">' +
      '<button type="button" class="floor-chip' + (!unvisitedOnly ? " active" : "") +
      '" data-visit="all">Alle Stände</button>' +
      '<button type="button" class="floor-chip' + (unvisitedOnly ? " active" : "") +
      '" data-visit="open">Noch nicht besucht</button>' +
      "</div>" +
      '<div class="search-meta"><span>' +
      (list.length ? list.length + (list.length === 1 ? " Aussteller" : " Aussteller") : "Keine Treffer") +
      (list.length > shown.length ? " · Top " + shown.length : "") +
      "</span><span>" +
      (categoryFilter ? esc(catLabel(categoryFilter)) : "Alle Kategorien") +
      "</span></div>" +
      '<p class="muted search-nav-hint">Treffer tippen → Route auf dem Plan</p>' +
      (hallHits.length ?
        '<div class="hall-hit"><p class="section-title">Hallen</p><div class="search-list">' +
        hallHits.map(function (h) {
          return '<button type="button" class="search-row" data-nav-hall="' + h.id + '">' +
            '<span class="rail" style="background:' + escAttr(h.color || catColor(h.category)) + '"></span>' +
            '<span class="search-copy"><strong>' + esc(h.name) + "</strong><span>" +
            esc(catLabel(h.category)) + " · " + (h.floor === 2 ? "OG" : "EG") +
            (h.hints ? " · " + esc(h.hints) : "") +
            "</span></span></button>";
        }).join("") + "</div></div>" : "") +
      '<div class="search-list">' +
      (shown.length ? shown.map(function (s) {
        var h = hall(s.hallId) || {};
        var visited = state.standVisits[s.id] && state.standVisits[s.id].visited;
        return '<button type="button" class="search-row" data-nav-stand="' + s.id + '">' +
          '<span class="rail" style="background:' + escAttr(h.color || catColor(h.category)) + '"></span>' +
          '<span class="search-copy"><strong>' + esc(s.name) + "</strong><span>" +
          esc(h.name || s.hallId) + (s.booth ? " · " + esc(s.booth) : "") +
          (visited ? " · besucht" : "") +
          (state.bookmarks[s.id] ? " · gemerkt" : "") +
          "</span></span>" +
          '<span class="go">Route</span></button>';
      }).join("") :
        '<div class="empty">Tipp: „Audio“, „DJI“ oder „H2.2“ eingeben</div>') +
      "</div>" +
      (function () {
        var fq = norm(query.trim());
        if (!fq) return "";
        var foods = foodList().filter(function (f) {
          var hay = [f.id, f.name, f.type].concat(f.tags || []).map(norm).join(" ");
          return fq.split(/\s+/).every(function (part) { return part && hay.indexOf(part) !== -1; });
        }).slice(0, 12);
        if (!foods.length) return "";
        return '<div class="hall-hit" style="margin-top:14px"><p class="section-title">Essen & Trinken</p><div class="search-list">' +
          foods.map(function (f) {
            return '<button type="button" class="search-row food-row" data-food="' + f.id + '">' +
              '<span class="food-num">' + esc(f.id) + "</span>" +
              '<span class="search-copy"><strong>' + esc(f.name) + "</strong><span>" +
              esc(f.type) + " · " + (f.zone === "outdoor" ? "Outdoor" : "Halle") +
              '</span></span><span class="go">Essen</span></button>';
          }).join("") + "</div></div>";
      })();

    function refreshSearchKeepCaret() {
      renderSearch();
      var again = document.getElementById("searchInput");
      if (again) {
        again.focus();
        var len = again.value.length;
        try { again.setSelectionRange(len, len); } catch (e2) {}
      }
    }

    var input = els.main.querySelector("#searchInput");
    if (input) {
      input.oninput = function (e) {
        query = e.target.value;
        refreshSearchKeepCaret();
      };
      // iOS/Android: Tastatur-Taste „Suche“ feuert search, nicht immer input
      input.addEventListener("search", function () {
        query = input.value;
        refreshSearchKeepCaret();
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          query = input.value;
          refreshSearchKeepCaret();
        }
      });
    }
    els.main.querySelectorAll("[data-cat]").forEach(function (btn) {
      btn.onclick = function () {
        categoryFilter = btn.getAttribute("data-cat") || "";
        renderSearch();
      };
    });
    els.main.querySelectorAll("[data-floor]").forEach(function (btn) {
      btn.onclick = function () {
        floorFilter = Number(btn.getAttribute("data-floor")) || 0;
        renderSearch();
      };
    });
    els.main.querySelectorAll("[data-visit]").forEach(function (btn) {
      btn.onclick = function () {
        unvisitedOnly = btn.getAttribute("data-visit") === "open";
        renderSearch();
      };
    });
    els.main.querySelectorAll("[data-food]").forEach(function (btn) {
      btn.onclick = function () { openFoodSheet(btn.getAttribute("data-food")); };
    });
    bind(els.main);
  }

  function renderHistory() {
    els.title.textContent = "Verlauf";
    els.actions.innerHTML = "";
    var bookmarked = stands().filter(function (s) { return state.bookmarks[s.id]; });
    var events = state.events || [];
    var noted = stands().filter(function (s) {
      var v = state.standVisits[s.id];
      return v && ((v.notes && v.notes.trim()) || (v.photos && v.photos.length));
    });
    els.main.innerHTML =
      '<div class="stats-block"><h2 class="section-title" style="margin-top:0">Export</h2>' +
      '<p class="muted">Merkliste, Besuche und Notizen lokal als Datei sichern.</p>' +
      '<div class="export-row">' +
      '<button type="button" class="secondary-btn" id="btnExportTxt">Als Text</button>' +
      '<button type="button" class="secondary-btn" id="btnExportCsv">Als CSV</button>' +
      "</div>" +
      (offlineReady
        ? '<p class="muted offline-pill on">Offline bereit — Plan & Daten auch ohne Netz</p>'
        : '<p class="muted offline-pill">Offline-Modus wird vorbereitet…</p>') +
      '</div><div class="stats-block"><h2 class="section-title" style="margin-top:0">Merkliste</h2>' +
      (bookmarked.length ? bookmarked.map(function (s) {
        return '<button type="button" class="event-row" data-stand="' + s.id + '"><strong>' + esc(s.name) +
          '</strong><span class="muted">' + esc((hall(s.hallId) || {}).name || "") + "</span></button>";
      }).join("") : '<p class="muted">Noch nichts gemerkt</p>') +
      '</div><div class="stats-block"><h2 class="section-title" style="margin-top:0">Notizen & Fotos</h2>' +
      (noted.length ? noted.map(function (s) {
        var v = state.standVisits[s.id] || {};
        return '<button type="button" class="event-row" data-stand="' + s.id + '"><strong>' + esc(s.name) +
          '</strong><span class="muted">' +
          (v.notes ? esc(v.notes).slice(0, 80) : (v.photos && v.photos.length ? v.photos.length + " Foto(s)" : "")) +
          "</span></button>";
      }).join("") : '<p class="muted">Noch keine Notizen</p>') +
      '</div><div class="stats-block"><h2 class="section-title" style="margin-top:0">Timeline</h2>' +
      (events.length ? events.slice(0, 80).map(function (ev) {
        var label = ev.kind === "standQr" ? "QR-Check-in" :
          ev.kind === "standManual" ? "Manuell" :
          ev.kind === "hallCheckIn" ? "Halle" : ev.kind;
        return '<button type="button" class="event-row" ' +
          (ev.standId ? 'data-stand="' + ev.standId + '"' : 'data-hall="' + (ev.hallId || "") + '"') +
          "><strong>" + esc(ev.standName || ev.hallName || "Eintrag") +
          '</strong><span class="muted">' + label + " · " + fmt(ev.timestamp) + "</span></button>";
      }).join("") : '<div class="empty">Noch keine Besuche</div>') +
      "</div>";
    els.main.querySelector("#btnExportTxt").onclick = function () { exportDiary("txt"); };
    els.main.querySelector("#btnExportCsv").onclick = function () { exportDiary("csv"); };
    bind(els.main);
  }


  function goFood(focusInput) {
    tab = "food";
    document.querySelectorAll(".tab").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === "food");
    });
    render();
    try { window.scrollTo(0, 0); } catch (e) {}
    if (focusInput === false) return;
    setTimeout(function () {
      var input = document.getElementById("foodInput");
      if (input) input.focus();
    }, 30);
  }

  function renderFood() {
    els.title.textContent = "Essen & Trinken";
    els.actions.innerHTML = "";
    var list = filteredFood();
    els.main.innerHTML =
      '<input class="search" id="foodInput" type="search" enterkeyhint="search" ' +
      'placeholder="Pizza, Kaffee, Vegan, Nr.…" value="' + escAttr(foodQuery) + '" />' +
      '<div class="floor-chips">' +
      '<button type="button" class="floor-chip' + (foodZone === "all" ? " active" : "") + '" data-food-zone="all">Alle</button>' +
      '<button type="button" class="floor-chip' + (foodZone === "hall" ? " active" : "") + '" data-food-zone="hall">Hallen</button>' +
      '<button type="button" class="floor-chip' + (foodZone === "outdoor" ? " active" : "") + '" data-food-zone="outdoor">Outdoor</button>' +
      "</div>" +
      '<div class="floor-chips">' +
      '<button type="button" class="floor-chip' + (foodLevel === "all" ? " active" : "") + '" data-food-level="all">Alle Ebenen</button>' +
      '<button type="button" class="floor-chip' + (foodLevel === "1" ? " active" : "") + '" data-food-level="1">Ebene 1</button>' +
      '<button type="button" class="floor-chip' + (foodLevel === "2" ? " active" : "") + '" data-food-level="2">Ebene 2</button>' +
      '<button type="button" class="floor-chip' + (foodLevel === "ZE1" ? " active" : "") + '" data-food-level="ZE1">ZE1</button>' +
      "</div>" +
      '<div class="cat-scroll">' +
      '<button type="button" class="cat-chip' + (!foodTag ? " active" : "") + '" data-food-tag="">Alles</button>' +
      [["coffee","Kaffee"],["drinks","Getränke"],["beer","Bier"],["veg","Vegetarisch"],["vegan","Vegan"]].map(function (pair) {
        return '<button type="button" class="cat-chip' + (foodTag === pair[0] ? " active" : "") +
          '" data-food-tag="' + pair[0] + '">' + pair[1] + "</button>";
      }).join("") +
      "</div>" +
      '<div class="search-meta"><span>' + list.length + " Orte</span><span>" +
      (foodZone === "outdoor" ? "Freigelände" : foodZone === "hall" ? "Hallen" : "Gesamtplan") +
      "</span></div>" +
      '<div class="search-list">' +
      (list.length ? list.map(function (f) {
        return '<button type="button" class="search-row food-row" data-food="' + f.id + '">' +
          '<span class="food-num">' + esc(f.id) + "</span>" +
          '<span class="search-copy"><strong>' + esc(f.name) + "</strong><span>" +
          esc(f.type) + " · " + (f.zone === "outdoor" ? "Outdoor" : "Halle") +
          " · " + esc(foodLevelLabel(f.level)) +
          "</span></span>" +
          '<span class="go">' + ((f.tags || []).indexOf("vegan") !== -1 ? "Vegan" :
            (f.tags || []).indexOf("veg") !== -1 ? "Veg" :
            (f.tags || []).indexOf("coffee") !== -1 ? "☕" : "→") + "</span></button>";
      }).join("") : '<div class="empty">Kein Treffer – Filter lockern</div>') +
      "</div>";

    function refreshFood() {
      renderFood();
      var again = document.getElementById("foodInput");
      if (again) {
        again.focus();
        var len = again.value.length;
        try { again.setSelectionRange(len, len); } catch (e2) {}
      }
    }

    var input = els.main.querySelector("#foodInput");
    if (input) {
      input.oninput = function (e) { foodQuery = e.target.value; refreshFood(); };
      input.addEventListener("search", function () { foodQuery = input.value; refreshFood(); });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); foodQuery = input.value; refreshFood(); }
      });
    }
    els.main.querySelectorAll("[data-food-zone]").forEach(function (btn) {
      btn.onclick = function () { foodZone = btn.getAttribute("data-food-zone") || "all"; renderFood(); };
    });
    els.main.querySelectorAll("[data-food-level]").forEach(function (btn) {
      btn.onclick = function () { foodLevel = btn.getAttribute("data-food-level") || "all"; renderFood(); };
    });
    els.main.querySelectorAll("[data-food-tag]").forEach(function (btn) {
      btn.onclick = function () { foodTag = btn.getAttribute("data-food-tag") || ""; renderFood(); };
    });
    els.main.querySelectorAll("[data-food]").forEach(function (btn) {
      btn.onclick = function () { openFoodSheet(btn.getAttribute("data-food")); };
    });
  }

  function render() {
    renderProgress();
    if (tab === "map") renderMap();
    else if (tab === "hall") renderHall();
    else if (tab === "search") renderSearch();
    else if (tab === "food") renderFood();
    else renderHistory();
  }

  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var t = btn.getAttribute("data-tab");
      if (t === "search") {
        goSearch(true);
        return;
      }
      if (t === "food") {
        goFood(true);
        return;
      }
      if (t === "stats") tab = "history";
      else tab = "map";
      document.querySelectorAll(".tab").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      query = "";
      categoryFilter = "";
      floorFilter = 0;
      unvisitedOnly = false;
      foodQuery = "";
      foodZone = "all";
      foodTag = "";
      foodLevel = "all";
      render();
      try { window.scrollTo(0, 0); } catch (e) {}
    });
  });

  els.detailClose.addEventListener("click", closeDialog);
  els.detailSave.addEventListener("click", saveForm);
  els.detailSave.classList.add("hidden");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(function (reg) {
      offlineReady = true;
      if (tab === "history") render();
      try { reg.update(); } catch (e) {}
    }).catch(function () {
      offlineReady = false;
    });
    if (navigator.serviceWorker.controller) offlineReady = true;
  }

  render();
})();
