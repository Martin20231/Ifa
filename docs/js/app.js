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
      '<button type="button" class="primary-btn" id="btnNav">Route zum Stand</button>' +
      '<button type="button" class="secondary-btn" id="btnHallNav">In Halle zeigen</button>' +
      '<button type="button" class="secondary-btn" id="btnQr">QR-Code scannen</button>' +
      '<button type="button" class="secondary-btn" id="btnManual">Manuell eintragen (ohne QR)</button>' +
      '<button type="button" class="secondary-btn" id="btnBook">' +
      (state.bookmarks[standId] ? "Von Merkliste nehmen" : "Auf Merkliste") + "</button>" +
      (visit.visited ? '<button type="button" class="danger-btn" id="btnReset">Besuch löschen</button>' : "");

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
      "</div>";

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
    else if (tab === "search") renderSearch();
    else renderHistory();
  }

  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var t = btn.getAttribute("data-tab");
      if (t === "search") {
        goSearch(true);
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
      render();
      try { window.scrollTo(0, 0); } catch (e) {}
    });
  });

  els.detailClose.addEventListener("click", closeDialog);
  els.detailSave.addEventListener("click", saveForm);
  els.detailSave.classList.add("hidden");

  render();
})();
