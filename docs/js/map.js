/**
 * IFA-Lageplan: Ring um Sommergarten, EG/OG, Legende, Navigation.
 * API: renderSiteMap, renderHallFloor, findPath, hallById, setFloor, getFloor
 */
window.IFAMap = (function () {
  "use strict";

  var floor = "eg"; // eg | og

  function hallById(id) {
    return (window.IFA_HALLS || []).find(function (h) { return h.id === id; });
  }

  function setFloor(next) {
    floor = next === "og" ? "og" : "eg";
  }

  function getFloor() {
    return floor;
  }

  function hasPair(id) {
    return !!(window.IFA_FLOOR_PAIRS && window.IFA_FLOOR_PAIRS[id]);
  }

  /** Sichtbare Hallen: gestapelte nur auf aktiver Ebene, Rest immer */
  function visibleHalls() {
    var want = floor === "og" ? 2 : 1;
    return (window.IFA_HALLS || []).filter(function (h) {
      if (!hasPair(h.id)) return true;
      return h.floor === want;
    });
  }

  function findPath(fromId, toId) {
    if (fromId === toId) return [fromId];
    var queue = [[fromId]];
    var seen = {};
    seen[fromId] = true;
    while (queue.length) {
      var path = queue.shift();
      var last = path[path.length - 1];
      var hall = hallById(last);
      var neighbors = (hall && hall.neighbors) || [];
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        if (seen[n]) continue;
        var next = path.concat([n]);
        if (n === toId) return next;
        seen[n] = true;
        queue.push(next);
      }
    }
    return null;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function legendItems() {
    return [
      ["appliances", "Home Appliances"],
      ["smartHome", "Smart Home"],
      ["connectivity", "Communication"],
      ["computing", "Computing & Gaming"],
      ["audio", "Audio"],
      ["beauty", "Beauty Tech"],
      ["next", "IFA Next"],
      ["content", "Content Creation"],
      ["entertainment", "Home & Entertainment"],
      ["global", "Global Markets"],
      ["mobility", "Mobility"]
    ];
  }

  function renderLegend() {
    var items = legendItems();
    var y = 4.2;
    var html =
      '<g class="map-legend" transform="translate(101, 0)">' +
      '<rect x="0.5" y="0.5" width="22" height="42" rx="1.2" fill="#0b1210" fill-opacity="0.82" stroke="rgba(255,255,255,0.12)" stroke-width="0.2"></rect>' +
      '<text x="1.5" y="3.2" fill="#94a3b8" font-size="1.8" font-weight="700">Bereiche</text>';
    for (var i = 0; i < items.length; i++) {
      var key = items[i][0];
      var label = items[i][1];
      var c = (window.IFA_CATEGORIES[key] && window.IFA_CATEGORIES[key].color) || "#888";
      html +=
        '<rect x="1.5" y="' + y + '" width="2" height="2" rx="0.3" fill="' + c + '"></rect>' +
        '<text x="4.2" y="' + (y + 1.6) + '" fill="#cbd5e1" font-size="1.55">' + esc(label) + "</text>";
      y += 3.3;
    }
    html += "</g>";
    return html;
  }

  function renderGeoOverlay(opts) {
    var trail = opts.geoTrail || [];
    var pos = opts.geoPos || null;
    var html = "";
    if (trail.length > 1) {
      var pts = trail
        .map(function (p) { return Number(p.x).toFixed(2) + "," + Number(p.y).toFixed(2); })
        .join(" ");
      html +=
        '<polyline class="geo-trail" fill="none" stroke="#f8fafc" stroke-width="0.55" ' +
        'stroke-linecap="round" stroke-linejoin="round" opacity="0.55" points="' + pts + '"></polyline>' +
        '<polyline class="geo-trail-accent" fill="none" stroke="#38bdf8" stroke-width="0.35" ' +
        'stroke-linecap="round" stroke-linejoin="round" opacity="0.95" points="' + pts + '"></polyline>';
    }
    if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
      var r = pos.accuracy ? Math.min(8, Math.max(1.2, pos.accuracy / 18)) : 2.2;
      html +=
        '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + r +
        '" fill="#38bdf8" fill-opacity="0.18" stroke="#7dd3fc" stroke-width="0.2"></circle>' +
        '<circle cx="' + pos.x + '" cy="' + pos.y +
        '" r="1.35" fill="#0ea5e9" stroke="#f0f9ff" stroke-width="0.45"></circle>' +
        '<circle cx="' + pos.x + '" cy="' + pos.y +
        '" r="0.45" fill="#ecfeff"></circle>';
    }
    return html;
  }

  function renderSiteMap(opts) {
    opts = opts || {};
    var selectedId = opts.selectedId || null;
    var pathIds = opts.pathIds || [];
    var visited = opts.visited || {};
    var pathSet = {};
    pathIds.forEach(function (id) { pathSet[id] = true; });

    var halls = visibleHalls();
    var svg =
      '<svg class="site-map" viewBox="0 0 124 100" role="img" aria-label="IFA Berlin Lageplan">' +
      '<defs>' +
      '<pattern id="ifaGrass" width="4" height="4" patternUnits="userSpaceOnUse">' +
      '<rect width="4" height="4" fill="#14532d"/>' +
      '<circle cx="1" cy="1.5" r="0.35" fill="#166534" opacity="0.7"/>' +
      '<circle cx="3" cy="3" r="0.3" fill="#15803d" opacity="0.55"/>' +
      "</pattern></defs>" +
      '<rect x="0" y="0" width="124" height="100" fill="#0f1714" rx="2"></rect>' +
      '<rect x="38" y="28" width="32" height="22" rx="2" fill="url(#ifaGrass)" fill-opacity="0.85" stroke="#22c55e" stroke-width="0.25" stroke-opacity="0.35"></rect>' +
      '<text x="54" y="38" text-anchor="middle" fill="#bbf7d0" font-size="2.4" font-weight="700">Sommergarten</text>' +
      '<text x="54" y="42" text-anchor="middle" fill="#86efac" font-size="1.5">Outdoor Cooking · Creator Stage</text>' +
      '<text x="50" y="98.5" text-anchor="middle" fill="#64748b" font-size="1.7">Süd · CityCube · Messe Süd</text>' +
      '<text x="50" y="2.8" text-anchor="middle" fill="#64748b" font-size="1.7">Nord · Theodor-Heuss-Platz</text>';

    for (var p = 0; p < pathIds.length - 1; p++) {
      var a = hallById(pathIds[p]);
      var b = hallById(pathIds[p + 1]);
      if (!a || !b) continue;
      // Wenn Zielhalle auf anderer Ebene liegt, Pair-Fläche für Linie nutzen falls unsichtbar
      var ax = a.x + a.w / 2;
      var ay = a.y + a.h / 2;
      var bx = b.x + b.w / 2;
      var by = b.y + b.h / 2;
      svg +=
        '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by +
        '" stroke="#2dd4bf" stroke-width="1.1" stroke-linecap="round" opacity="0.92"></line>';
    }

    halls.forEach(function (h) {
      if (h.mapRole === "park") return; // Sommergarten als Parkfläche gezeichnet
      var isSel = h.id === selectedId;
      var isPath = !!pathSet[h.id];
      var isVisited = !!visited[h.id];
      var fill = isVisited ? "#14b8a6" : h.color || "#334155";
      var stroke = isSel ? "#f8fafc" : isPath ? "#2dd4bf" : "rgba(255,255,255,0.18)";
      var sw = isSel || isPath ? 0.65 : 0.22;
      var opacity = isVisited ? "0.95" : "0.72";
      var fs = h.shortCode.length > 4 ? 1.9 : h.shortCode.length > 3 ? 2.1 : 2.4;
      svg +=
        '<g class="hall-node" data-hall="' + esc(h.id) + '" style="cursor:pointer">' +
        '<rect x="' + h.x + '" y="' + h.y + '" width="' + h.w + '" height="' + h.h +
        '" rx="1.1" fill="' + fill + '" fill-opacity="' + opacity +
        '" stroke="' + stroke + '" stroke-width="' + sw + '"></rect>' +
        '<text x="' + (h.x + h.w / 2) + '" y="' + (h.y + h.h / 2 + 0.75) +
        '" text-anchor="middle" fill="#ecfeff" font-size="' + fs + '" font-weight="700">' +
        esc(h.shortCode) +
        "</text></g>";
    });

    // Sommergarten als tippbare Fläche (transparent über dem Park)
    var sg = hallById("sg");
    if (sg) {
      var sgSel = sg.id === selectedId;
      var sgVis = !!visited[sg.id];
      svg +=
        '<g class="hall-node" data-hall="sg" style="cursor:pointer">' +
        '<rect x="' + sg.x + '" y="' + sg.y + '" width="' + sg.w + '" height="' + sg.h +
        '" rx="2" fill="' + (sgVis ? "#14b8a6" : "transparent") + '" fill-opacity="' + (sgVis ? "0.35" : "0") +
        '" stroke="' + (sgSel ? "#f8fafc" : "transparent") + '" stroke-width="0.6"></rect></g>';
    }

    svg += renderGeoOverlay(opts);
    svg += renderLegend();
    svg += "</svg>";
    return svg;
  }

  function renderHallFloor(hallId, stands, visits, focusStandId) {
    var hall = hallById(hallId);
    if (!hall) return "";
    var list = (stands || []).filter(function (s) { return s.hallId === hallId; });
    var svg =
      '<svg class="hall-floor" viewBox="0 0 100 80" role="img" aria-label="Stände in ' + esc(hall.name) + '">' +
      '<rect x="0" y="0" width="100" height="80" fill="#0f1714" rx="2"></rect>' +
      '<rect x="4" y="4" width="92" height="72" fill="' + (hall.color || "#334155") +
      '" fill-opacity="0.18" stroke="' + (hall.color || "#334155") +
      '" stroke-opacity="0.45" stroke-width="0.6" rx="2"></rect>' +
      '<text x="50" y="10" text-anchor="middle" fill="#94a3b8" font-size="3.2">' +
      esc(hall.name) + "</text>";

    if (!list.length) {
      svg +=
        '<text x="50" y="42" text-anchor="middle" fill="#64748b" font-size="3.5">' +
        "Noch keine Stände erfasst</text>";
    } else {
      list.forEach(function (s) {
        var v = (visits && visits[s.id]) || {};
        var focused = focusStandId && focusStandId === s.id;
        var x = typeof s.x === "number" ? s.x : 20;
        var y = typeof s.y === "number" ? s.y : 30;
        var fill = focused ? "#f59e0b" : (v.visited ? "#14b8a6" : "#1e293b");
        var stroke = focused ? "#fde68a" : (v.visited ? "#5eead4" : "rgba(255,255,255,0.2)");
        var sw = focused ? "0.9" : "0.4";
        svg +=
          '<g class="stand-node' + (focused ? " focused" : "") + '" data-stand="' + esc(s.id) + '" style="cursor:pointer">' +
          '<rect x="' + x + '" y="' + y + '" width="18" height="12" rx="1.2" fill="' + fill +
          '" stroke="' + stroke + '" stroke-width="' + sw + '"></rect>' +
          (focused ? '<circle cx="' + (x + 9) + '" cy="' + (y - 2) + '" r="1.6" fill="#fbbf24" stroke="#fff7ed" stroke-width="0.35"></circle>' : "") +
          '<text x="' + (x + 9) + '" y="' + (y + 7.2) +
          '" text-anchor="middle" fill="#ecfeff" font-size="2.2" font-weight="700">' +
          esc((s.name || "").slice(0, 8)) +
          "</text></g>";
      });
    }
    svg += "</svg>";
    return svg;
  }

  return {
    hallById: hallById,
    findPath: findPath,
    renderSiteMap: renderSiteMap,
    renderHallFloor: renderHallFloor,
    setFloor: setFloor,
    getFloor: getFloor,
    visibleHalls: visibleHalls
  };
})();
