(function () {
  "use strict";

  var state = IFAStorage.load();
  var tab = "halls";
  var layout = localStorage.getItem("ifa-layout") || "list";
  var query = "";
  var activeHallId = null;
  var draft = null;

  var els = {
    main: document.getElementById("main"),
    progress: document.getElementById("progressCard"),
    title: document.getElementById("screenTitle"),
    actions: document.getElementById("topbarActions"),
    dialog: document.getElementById("detailDialog"),
    detailTitle: document.getElementById("detailTitle"),
    detailBody: document.getElementById("detailBody"),
    detailSave: document.getElementById("detailSave"),
    detailClose: document.getElementById("detailClose")
  };

  function hallById(id) {
    return window.IFA_HALLS.find(function (h) { return h.id === id; });
  }

  function hallState(id) {
    return state.halls[id];
  }

  function persist() {
    IFAStorage.save(state);
  }

  function formatTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
  }

  function formatClock(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }

  function progressInfo() {
    var total = window.IFA_HALLS.length;
    var visited = window.IFA_HALLS.filter(function (h) { return hallState(h.id).visited; }).length;
    var pct = total ? Math.round((visited / total) * 100) : 0;
    return { total: total, visited: visited, pct: pct };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  function filteredHalls() {
    var q = query.trim().toLowerCase();
    return window.IFA_HALLS
      .slice()
      .sort(function (a, b) { return a.sortOrder - b.sortOrder; })
      .filter(function (h) {
        if (!q) return true;
        var s = hallState(h.id);
        return (
          h.name.toLowerCase().indexOf(q) !== -1 ||
          h.shortCode.toLowerCase().indexOf(q) !== -1 ||
          h.area.toLowerCase().indexOf(q) !== -1 ||
          String(s.manufacturers || "").toLowerCase().indexOf(q) !== -1 ||
          String(s.notes || "").toLowerCase().indexOf(q) !== -1
        );
      });
  }

  function toggleCheckIn(id, event) {
    if (event) event.stopPropagation();
    var h = hallById(id);
    var s = hallState(id);
    if (s.visited) {
      s.visited = false;
      s.checkedInAt = null;
      IFAStorage.addEvent(state, id, h.name, "checkOut");
    } else {
      s.visited = true;
      s.checkedInAt = new Date().toISOString();
      IFAStorage.addEvent(state, id, h.name, "checkIn");
    }
    persist();
    render();
  }

  function openDetail(id) {
    activeHallId = id;
    var h = hallById(id);
    var s = hallState(id);
    draft = {
      manufacturers: s.manufacturers || "",
      notes: s.notes || "",
      photos: (s.photos || []).slice()
    };
    els.detailTitle.textContent = h.name;
    renderDetailBody();
    if (typeof els.dialog.showModal === "function") els.dialog.showModal();
    else els.dialog.setAttribute("open", "open");
  }

  function closeDetail() {
    if (typeof els.dialog.close === "function") els.dialog.close();
    else els.dialog.removeAttribute("open");
  }

  function compressImage(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var maxSide = 1280;
          var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          var w = Math.round(img.width * scale);
          var h = Math.round(img.height * scale);
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = function () { resolve(null); };
        img.src = reader.result;
      };
      reader.onerror = function () { resolve(null); };
      reader.readAsDataURL(file);
    });
  }

  function renderDetailBody() {
    var s = hallState(activeHallId);
    var photos = draft.photos.map(function (src, i) {
      return '<div class="photo"><img src="' + src + '" alt="Foto ' + (i + 1) +
        '" /><button type="button" data-photo-del="' + i + '" aria-label="Foto löschen">×</button></div>';
    }).join("");

    els.detailBody.innerHTML =
      '<div class="status-pill ' + (s.visited ? "on" : "") + '">' +
      (s.visited ? "Besucht" : "Nicht besucht") +
      (s.checkedInAt ? " · " + formatTime(s.checkedInAt) : "") +
      "</div>" +
      '<button type="button" class="' + (s.visited ? "danger-btn" : "primary-btn") + '" id="detailCheck">' +
      (s.visited ? "Check-in zurücksetzen" : "Jetzt einchecken") +
      "</button>" +
      '<div class="field" style="margin-top:14px"><label for="mfr">Stände / Hersteller</label>' +
      '<input id="mfr" value="' + escapeAttr(draft.manufacturers) + '" placeholder="Samsung, Sony, LG…" /></div>' +
      '<div class="field"><label for="notes">Notizen</label>' +
      '<textarea id="notes" rows="5" placeholder="Was war interessant?">' + escapeHtml(draft.notes) + "</textarea></div>" +
      '<div class="field"><label for="photoInput">Fotos (lokal)</label>' +
      '<input id="photoInput" type="file" accept="image/*" multiple capture="environment" />' +
      '<div class="photos" style="margin-top:10px">' +
      (photos || '<span class="muted">Noch keine Fotos</span>') +
      "</div></div>";

    els.detailBody.querySelector("#detailCheck").onclick = function () {
      toggleCheckIn(activeHallId);
      renderDetailBody();
    };
    els.detailBody.querySelector("#mfr").oninput = function (e) { draft.manufacturers = e.target.value; };
    els.detailBody.querySelector("#notes").oninput = function (e) { draft.notes = e.target.value; };
    els.detailBody.querySelector("#photoInput").onchange = function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      Promise.all(files.slice(0, 6).map(compressImage)).then(function (urls) {
        urls.forEach(function (u) { if (u) draft.photos.push(u); });
        renderDetailBody();
      });
    };
    els.detailBody.querySelectorAll("[data-photo-del]").forEach(function (btn) {
      btn.onclick = function () {
        draft.photos.splice(Number(btn.getAttribute("data-photo-del")), 1);
        renderDetailBody();
      };
    });
  }

  function saveDetail() {
    if (!activeHallId || !draft) return;
    var h = hallById(activeHallId);
    var s = hallState(activeHallId);
    var prevNotes = s.notes;
    s.manufacturers = draft.manufacturers.trim();
    s.notes = draft.notes.trim();
    s.photos = draft.photos.slice(0, 12);
    if (!s.visited && (s.manufacturers || s.notes || s.photos.length)) {
      s.visited = true;
      s.checkedInAt = s.checkedInAt || new Date().toISOString();
      IFAStorage.addEvent(state, activeHallId, h.name, "checkIn");
    } else if (s.notes && s.notes !== prevNotes) {
      IFAStorage.addEvent(state, activeHallId, h.name, "noteUpdate");
    }
    persist();
    closeDetail();
    render();
  }

  function renderProgress() {
    var p = progressInfo();
    els.progress.innerHTML =
      '<div class="label"><span>Fortschritt</span><span>' + p.visited + "/" + p.total + "</span></div>" +
      '<div class="bar"><span style="width:' + p.pct + '%"></span></div>' +
      '<p class="muted" style="margin:8px 0 0">' + p.pct + "% der Hallen besucht</p>";
  }

  function bindSearchAndOpen() {
    var search = els.main.querySelector("#search");
    if (search) {
      search.oninput = function (e) {
        query = e.target.value;
        render();
        var again = document.getElementById("search");
        if (again) {
          again.focus();
          again.setSelectionRange(query.length, query.length);
        }
      };
    }
    els.main.querySelectorAll("[data-open]").forEach(function (el) {
      el.onclick = function (e) {
        e.preventDefault();
        openDetail(el.getAttribute("data-open"));
      };
    });
    els.main.querySelectorAll("[data-check]").forEach(function (el) {
      el.onclick = function (e) { toggleCheckIn(el.getAttribute("data-check"), e); };
    });
  }

  function renderHalls() {
    els.title.textContent = "Hallen";
    els.actions.innerHTML =
      '<div class="seg" role="group" aria-label="Ansicht">' +
      '<button type="button" data-layout="list" class="' + (layout === "list" ? "active" : "") + '">Liste</button>' +
      '<button type="button" data-layout="map" class="' + (layout === "map" ? "active" : "") + '">Grundriss</button></div>';

    els.actions.querySelectorAll("[data-layout]").forEach(function (btn) {
      btn.onclick = function () {
        layout = btn.getAttribute("data-layout");
        localStorage.setItem("ifa-layout", layout);
        render();
      };
    });

    var halls = filteredHalls();
    var html = '<input class="search" id="search" placeholder="Halle, Hersteller, Notiz…" value="' + escapeAttr(query) + '" />';

    if (layout === "map") {
      html += '<div class="legend"><span><i class="on"></i>Besucht</span><span><i></i>Offen</span></div><div class="map-grid">';
      html += halls.map(function (h) {
        var s = hallState(h.id);
        return '<button type="button" class="map-cell ' + (s.visited ? "visited" : "") + '" data-open="' + h.id + '">' +
          escapeHtml(h.shortCode) + "<small>" +
          (s.visited && s.checkedInAt ? formatClock(s.checkedInAt) : escapeHtml(h.area)) +
          "</small></button>";
      }).join("");
      html += '</div><p class="muted" style="margin-top:10px">Tipp: Tippen öffnet Details. Check-in dort oder in der Liste.</p>';
    } else {
      var areas = window.IFA_AREA_ORDER.filter(function (a) {
        return halls.some(function (h) { return h.area === a; });
      });
      html += areas.map(function (area) {
        var rows = halls.filter(function (h) { return h.area === area; }).map(function (h) {
          var s = hallState(h.id);
          var makers = String(s.manufacturers || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 3).join(", ");
          return '<div class="hall-row">' +
            '<button type="button" class="hall-main" data-open="' + h.id + '">' +
            '<span class="hall-code ' + (s.visited ? "visited" : "") + '">' + escapeHtml(h.shortCode) + "</span>" +
            '<span class="hall-meta"><strong>' + escapeHtml(h.name) + "</strong><span>" +
            escapeHtml(h.area) +
            (s.visited && s.checkedInAt ? " · " + formatClock(s.checkedInAt) : "") +
            (makers ? " · " + escapeHtml(makers) : "") +
            "</span></span></button>" +
            '<button type="button" class="check-btn" data-check="' + h.id + '" aria-label="Check-in">' +
            (s.visited ? "✓" : "+") + "</button></div>";
        }).join("");
        return '<h2 class="section-title">' + escapeHtml(area) + '</h2><div class="hall-list">' + rows + "</div>";
      }).join("");
    }

    els.main.innerHTML = html || '<div class="empty">Keine Hallen gefunden</div>';
    bindSearchAndOpen();
  }

  function renderStats() {
    els.title.textContent = "Verlauf";
    els.actions.innerHTML = "";
    var p = progressInfo();
    var makers = {};
    var notes = [];

    window.IFA_HALLS.forEach(function (h) {
      var s = hallState(h.id);
      String(s.manufacturers || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (m) {
        makers[m] = true;
      });
      if ((s.notes && s.notes.trim()) || (s.manufacturers && s.manufacturers.trim())) {
        notes.push({ id: h.id, name: h.name, s: s });
      }
    });

    var q = query.trim().toLowerCase();
    var filteredNotes = notes.filter(function (n) {
      if (!q) return true;
      return n.name.toLowerCase().indexOf(q) !== -1 ||
        String(n.s.notes || "").toLowerCase().indexOf(q) !== -1 ||
        String(n.s.manufacturers || "").toLowerCase().indexOf(q) !== -1;
    });

    var makerList = Object.keys(makers).sort(function (a, b) { return a.localeCompare(b, "de"); });
    var filteredMakers = makerList.filter(function (m) { return !q || m.toLowerCase().indexOf(q) !== -1; });
    var kindLabel = { checkIn: "Check-in", checkOut: "Zurückgesetzt", noteUpdate: "Notiz" };

    var eventsHtml = '<div class="empty">Noch keine Besuche</div>';
    if (state.events.length) {
      eventsHtml = state.events.slice(0, 80).map(function (ev) {
        return '<button type="button" class="event-row" data-open="' + ev.hallId + '"><strong>' +
          escapeHtml(ev.hallName) + '</strong><span class="muted">' +
          (kindLabel[ev.kind] || ev.kind) + " · " + formatTime(ev.timestamp) +
          "</span></button>";
      }).join("");
    }

    els.main.innerHTML =
      '<input class="search" id="search" placeholder="Notizen & Hersteller suchen…" value="' + escapeAttr(query) + '" />' +
      '<div class="stats-block"><strong>' + p.visited + " von " + p.total + " Hallen besucht (" + p.pct +
      '%)</strong><div class="bar" style="margin-top:10px"><span style="width:' + p.pct + '%"></span></div></div>' +
      '<div class="stats-block"><h2 class="section-title" style="margin-top:0">Verlauf</h2>' + eventsHtml + "</div>" +
      '<div class="stats-block"><h2 class="section-title" style="margin-top:0">Hersteller (' + filteredMakers.length +
      ')</h2><div class="chips">' +
      (filteredMakers.length ? filteredMakers.map(function (m) { return '<span class="chip">' + escapeHtml(m) + "</span>"; }).join("") : '<span class="muted">Noch keine Hersteller</span>') +
      "</div></div>" +
      '<div class="stats-block"><h2 class="section-title" style="margin-top:0">Notizen & Stände</h2>' +
      (filteredNotes.length ? filteredNotes.map(function (n) {
        return '<button type="button" class="note-row" data-open="' + n.id + '"><strong>' + escapeHtml(n.name) + "</strong>" +
          (n.s.manufacturers ? '<span style="color:var(--accent);font-size:0.85rem">' + escapeHtml(n.s.manufacturers) + "</span>" : "") +
          (n.s.notes ? '<span class="muted">' + escapeHtml(n.s.notes) + "</span>" : "") +
          "</button>";
      }).join("") : '<div class="empty">Keine Notizen</div>') +
      "</div>";

    bindSearchAndOpen();
  }

  function render() {
    renderProgress();
    if (tab === "halls") renderHalls();
    else renderStats();
  }

  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      query = "";
      render();
    });
  });

  els.detailSave.addEventListener("click", saveDetail);
  els.detailClose.addEventListener("click", closeDetail);

  render();
})();
