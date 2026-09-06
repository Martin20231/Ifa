(function () {
  function hallById(id) {
    return (window.IFA_HALLS || []).find(function (h) { return h.id === id; });
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

  function renderSiteMap(opts) {
    opts = opts || {};
    var selectedId = opts.selectedId || null;
    var pathIds = opts.pathIds || [];
    var visited = opts.visited || {};
    var pathSet = {};
    pathIds.forEach(function (id) { pathSet[id] = true; });

    var svg =
      '<svg class="site-map" viewBox="0 0 100 100" role="img" aria-label="IFA Lageplan">' +
      '<rect x="0" y="0" width="100" height="100" fill="#0f1714" rx="2"></rect>' +
      '<text x="50" y="3.5" text-anchor="middle" fill="#64748b" font-size="2.2">Schematischer IFA-Lageplan</text>';

    // path lines first
    for (var p = 0; p < pathIds.length - 1; p++) {
      var a = hallById(pathIds[p]);
      var b = hallById(pathIds[p + 1]);
      if (!a || !b) continue;
      var ax = a.x + a.w / 2;
      var ay = a.y + a.h / 2;
      var bx = b.x + b.w / 2;
      var by = b.y + b.h / 2;
      svg +=
        '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by +
        '" stroke="#2dd4bf" stroke-width="1.2" stroke-linecap="round" opacity="0.9"></line>';
    }

    (window.IFA_HALLS || []).forEach(function (h) {
      var isSel = h.id === selectedId;
      var isPath = !!pathSet[h.id];
      var isVisited = !!visited[h.id];
      var fill = isVisited ? "#14b8a6" : h.color || "#334155";
      var stroke = isSel ? "#f8fafc" : isPath ? "#2dd4bf" : "rgba(255,255,255,0.15)";
      var sw = isSel || isPath ? 0.7 : 0.25;
      svg +=
        '<g class="hall-node" data-hall="' + h.id + '" style="cursor:pointer">' +
        '<rect x="' + h.x + '" y="' + h.y + '" width="' + h.w + '" height="' + h.h +
        '" rx="1.2" fill="' + fill + '" fill-opacity="' + (isVisited ? "0.95" : "0.55") +
        '" stroke="' + stroke + '" stroke-width="' + sw + '"></rect>' +
        '<text x="' + (h.x + h.w / 2) + '" y="' + (h.y + h.h / 2 + 0.8) +
        '" text-anchor="middle" fill="#ecfeff" font-size="2.4" font-weight="700">' +
        h.shortCode +
        "</text></g>";
    });

    svg += "</svg>";
    return svg;
  }

  function renderHallFloor(hallId, stands, visits) {
    var hall = hallById(hallId);
    if (!hall) return "";
    var list = (stands || []).filter(function (s) { return s.hallId === hallId; });
    var svg =
      '<svg class="hall-floor" viewBox="0 0 100 100" role="img" aria-label="Grundriss ' + hall.name + '">' +
      '<rect width="100" height="100" fill="#121a17" rx="2"></rect>' +
      '<text x="50" y="6" text-anchor="middle" fill="#64748b" font-size="3">' + hall.name + "</text>";

    // aisle guides
    svg += '<rect x="4" y="46" width="92" height="8" fill="rgba(148,163,184,0.12)"></rect>';
    svg += '<rect x="46" y="10" width="8" height="80" fill="rgba(148,163,184,0.12)"></rect>';

    list.forEach(function (s, idx) {
      var x = typeof s.x === "number" ? s.x : 10 + (idx % 4) * 22;
      var y = typeof s.y === "number" ? s.y : 14 + Math.floor(idx / 4) * 22;
      var visited = visits && visits[s.id] && visits[s.id].visited;
      var fill = visited ? "#14b8a6" : "#1e293b";
      var stroke = visited ? "#5eead4" : "#475569";
      svg +=
        '<g class="stand-node" data-stand="' + s.id + '" style="cursor:pointer">' +
        '<rect x="' + x + '" y="' + y + '" width="18" height="14" rx="1.5" fill="' + fill +
        '" stroke="' + stroke + '" stroke-width="0.6"></rect>' +
        '<text x="' + (x + 9) + '" y="' + (y + 8.2) + '" text-anchor="middle" fill="#e2e8f0" font-size="2.3" font-weight="700">' +
        String(s.name).slice(0, 10) +
        "</text></g>";
    });

    svg += "</svg>";
    return svg;
  }

  window.IFAMap = {
    hallById: hallById,
    findPath: findPath,
    renderSiteMap: renderSiteMap,
    renderHallFloor: renderHallFloor
  };
})();
