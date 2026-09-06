(function () {
  const KEY = "ifa-tagebuch-v1";

  function emptyState() {
    const halls = {};
    for (const h of window.IFA_HALLS) {
      halls[h.id] = {
        visited: false,
        checkedInAt: null,
        manufacturers: "",
        notes: "",
        photos: []
      };
    }
    return { halls, events: [] };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyState();
      const data = JSON.parse(raw);
      const base = emptyState();
      for (const id of Object.keys(base.halls)) {
        if (data.halls && data.halls[id]) {
          base.halls[id] = Object.assign({}, base.halls[id], data.halls[id]);
        }
      }
      base.events = Array.isArray(data.events) ? data.events : [];
      return base;
    } catch (e) {
      return emptyState();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function addEvent(state, hallId, hallName, kind) {
    state.events.unshift({
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random(),
      hallId: hallId,
      hallName: hallName,
      kind: kind,
      timestamp: new Date().toISOString()
    });
  }

  window.IFAStorage = { load: load, save: save, addEvent: addEvent };
})();
