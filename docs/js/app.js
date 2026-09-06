(function () {
  "use strict";

  var state = IFAStorage.load();
  var tab = "map";
  var selectedHallId = null;
  var navFrom = "";
  var navTo = "";
  var pathIds = [];
  var query = "";
  var draft = null;

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

  function openStandSheet(standId) {
    var s = stand(standId);
    if (!s) return;
    var visit = state.standVisits[standId] || {};
    var h = hall(s.hallId);
    draft = null;
    els.detailTitle.textContent = s.name;
    els.detailSave.classList.add("hidden");
    els.detailBody.innerHTML =
      '<div class="status-pill ' + (visit.visited ? "on" : "") + '">' +
      (visit.visited ? "Besucht" : "Nicht besucht") +
      (visit.checkedInAt ? " · " + fmt(visit.checkedInAt) : "") +
      (visit.via === "qr" ? " · QR" : visit.via === "manual" ? " · manuell" : "") +
      "</div>" +
      '<p class="muted">' + esc(h ? h.name : s.hallId) + (s.booth ? " · " + esc(s.booth) : "") + "</p>" +
      (visit.notes ? "<p>" + esc(visit.notes) + "</p>" : "") +
      '<button type="button" class="primary-btn" id="btnQr">QR-Code scannen</button>' +
      '<button type="button" class="secondary-btn" id="btnManual">Manuell eintragen (ohne QR)</button>' +
      '<button type="button" class="secondary-btn" id="btnBook">' +
      (state.bookmarks[standId] ? "Von Merkliste nehmen" : "Auf Merkliste") + "</button>" +
      (visit.visited ? '<button type="button" class="danger-btn" id="btnReset">Besuch löschen</button>' : "");

    els.detailBody.querySelector("#btnQr").onclick = function () { startScan(standId); };
    els.detailBody.querySelector("#btnManual").onclick = function () {
      openForm({ standId: standId, name: s.name, booth: s.booth || "", hallId: s.hallId, via: "manual" });
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
    openDialog();
  }

  function openForm(data) {
    draft = {
      standId: data.standId || null,
      name: data.name || "",
      booth: data.booth || "",
      hallId: data.hallId || selectedHallId || "2.1",
      notes: data.notes || "",
      via: data.via || "manual",
      qrPayload: data.qrPayload || ""
    };
    els.detailTitle.textContent = draft.standId ? "Stand besuchen" : "Neuer Stand";
    els.detailSave.classList.remove("hidden");
    els.detailSave.textContent = "Speichern";
    els.detailBody.innerHTML =
      (draft.qrPayload
        ? '<div class="status-pill on">QR erkannt</div><p class="muted break">' + esc(draft.qrPayload) + "</p>"
        : '<p class="muted">Kein QR vorhanden? Einfach manuell speichern.</p>') +
      '<div class="field"><label for="fName">Hersteller / Stand</label>' +
      '<input id="fName" value="' + escAttr(draft.name) + '" placeholder="z. B. Samsung" /></div>' +
      '<div class="field"><label for="fBooth">Standnummer (optional)</label>' +
      '<input id="fBooth" value="' + escAttr(draft.booth) + '" placeholder="H2.1-101" /></div>' +
      '<div class="field"><label for="fHall">Halle</label><select id="fHall">' + hallOptions(draft.hallId) + "</select></div>" +
      '<div class="field"><label for="fNotes">Notiz</label>' +
      '<textarea id="fNotes" rows="4" placeholder="Was war interessant?">' + esc(draft.notes) + "</textarea></div>";

    els.detailBody.querySelector("#fName").oninput = function (e) { draft.name = e.target.value; };
    els.detailBody.querySelector("#fBooth").oninput = function (e) { draft.booth = e.target.value; };
    els.detailBody.querySelector("#fHall").onchange = function (e) { draft.hallId = e.target.value; };
    els.detailBody.querySelector("#fNotes").oninput = function (e) { draft.notes = e.target.value; };
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

    state.standVisits[id] = {
      visited: true,
      checkedInAt: new Date().toISOString(),
      notes: String(draft.notes || "").trim(),
      via: draft.via || "manual",
      qrPayload: draft.qrPayload || ""
    };
    markHall(draft.hallId);
    IFAStorage.addEvent(state, {
      kind: draft.via === "qr" ? "standQr" : "standManual",
      hallId: draft.hallId,
      hallName: (hall(draft.hallId) || {}).name || draft.hallId,
      standId: id,
      standName: name
    });
    persist();
    selectedHallId = draft.hallId;
    closeDialog();
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

  function renderMap() {
    els.title.textContent = "Lageplan";
    els.actions.innerHTML = '<button type="button" class="icon-chip" id="quickQr">QR</button>';
    els.actions.querySelector("#quickQr").onclick = function () { startScan(null); };

    var opts = '<option value="">Halle…</option>' + halls().map(function (h) {
      return '<option value="' + h.id + '">' + esc(h.name) + "</option>";
    }).join("");

    els.main.innerHTML =
      '<div class="map-card" id="mapCard">' +
      IFAMap.renderSiteMap({ selectedId: selectedHallId, pathIds: pathIds, visited: visitedHallMap() }) +
      '<p class="muted map-caption">Halle tippen · Route türkis · Besucht grün</p></div>' +
      '<div class="nav-card"><h2>Navigation</h2>' +
      '<div class="nav-row"><label>Von</label><select id="navFrom">' + opts + "</select></div>" +
      '<div class="nav-row"><label>Nach</label><select id="navTo">' + opts + "</select></div>" +
      '<button type="button" class="primary-btn" id="btnRoute">Route zeigen</button>' +
      '<p class="muted" id="routeInfo"></p></div>' +
      '<button type="button" class="secondary-btn" id="btnNew">+ Stand ohne QR anlegen</button>';

    var fromSel = els.main.querySelector("#navFrom");
    var toSel = els.main.querySelector("#navTo");
    fromSel.value = navFrom; toSel.value = navTo;
    fromSel.onchange = function () { navFrom = fromSel.value; };
    toSel.onchange = function () { navTo = toSel.value; };

    els.main.querySelector("#btnRoute").onclick = function () {
      navFrom = fromSel.value; navTo = toSel.value;
      if (!navFrom || !navTo) { alert("Start und Ziel wählen."); return; }
      pathIds = IFAMap.findPath(navFrom, navTo) || [];
      var info = els.main.querySelector("#routeInfo");
      if (!pathIds.length) info.textContent = "Keine Route gefunden.";
      else {
        info.textContent = "Route: " + pathIds.map(function (id) {
          return (hall(id) || {}).shortCode || id;
        }).join(" → ");
      }
      var card = els.main.querySelector("#mapCard");
      card.innerHTML =
        IFAMap.renderSiteMap({ selectedId: selectedHallId, pathIds: pathIds, visited: visitedHallMap() }) +
        '<p class="muted map-caption">Halle tippen · Route türkis · Besucht grün</p>';
      bind(card);
    };

    els.main.querySelector("#btnNew").onclick = function () {
      openForm({ hallId: selectedHallId || "2.1", via: "manual" });
    };
    bind(els.main);
  }

  function renderHall() {
    var h = hall(selectedHallId);
    if (!h) { tab = "map"; return renderMap(); }
    els.title.textContent = h.name;
    els.actions.innerHTML = '<button type="button" class="icon-chip" id="backMap">Plan</button>';
    els.actions.querySelector("#backMap").onclick = function () { tab = "map"; render(); };

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
      '<div class="map-card">' + IFAMap.renderHallFloor(h.id, list, state.standVisits) + "</div>" +
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
        return '<button type="button" class="hall-row" data-stand="' + s.id + '">' +
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

  function renderHistory() {
    els.title.textContent = "Verlauf";
    els.actions.innerHTML = "";
    var bookmarked = stands().filter(function (s) { return state.bookmarks[s.id]; });
    var events = state.events || [];
    els.main.innerHTML =
      '<div class="stats-block"><h2 class="section-title" style="margin-top:0">Merkliste</h2>' +
      (bookmarked.length ? bookmarked.map(function (s) {
        return '<button type="button" class="event-row" data-stand="' + s.id + '"><strong>' + esc(s.name) +
          '</strong><span class="muted">' + esc((hall(s.hallId) || {}).name || "") + "</span></button>";
      }).join("") : '<p class="muted">Noch nichts gemerkt</p>') +
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
    bind(els.main);
  }

  function render() {
    renderProgress();
    if (tab === "map") renderMap();
    else if (tab === "hall") renderHall();
    else renderHistory();
  }

  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var t = btn.getAttribute("data-tab");
      tab = t === "stats" ? "history" : "map";
      document.querySelectorAll(".tab").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      query = "";
      render();
    });
  });

  els.detailClose.addEventListener("click", closeDialog);
  els.detailSave.addEventListener("click", saveForm);
  els.detailSave.classList.add("hidden");

  render();
})();
