(function () {
  var KEY = "ifa-tagebuch-v2";

  function emptyState() {
    return {
      hallVisits: {},
      standVisits: {},
      customStands: [],
      bookmarks: {},
      events: [],
      geoTrail: [],
      geoTracking: false
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        // migrate v1 lightly
        var v1 = localStorage.getItem("ifa-tagebuch-v1");
        if (v1) {
          var old = JSON.parse(v1);
          var state = emptyState();
          if (old && old.halls) {
            Object.keys(old.halls).forEach(function (id) {
              var h = old.halls[id];
              if (h.visited) {
                state.hallVisits[id] = {
                  visited: true,
                  checkedInAt: h.checkedInAt || null,
                  notes: h.notes || "",
                  manufacturers: h.manufacturers || "",
                  photos: h.photos || []
                };
              }
            });
          }
          if (Array.isArray(old.events)) state.events = old.events;
          save(state);
          return state;
        }
        return emptyState();
      }
      var data = JSON.parse(raw);
      var base = emptyState();
      return Object.assign(base, data, {
        hallVisits: data.hallVisits || {},
        standVisits: data.standVisits || {},
        customStands: Array.isArray(data.customStands) ? data.customStands : [],
        bookmarks: data.bookmarks || {},
        events: Array.isArray(data.events) ? data.events : [],
        geoTrail: Array.isArray(data.geoTrail) ? data.geoTrail : [],
        geoTracking: !!data.geoTracking
      });
    } catch (e) {
      return emptyState();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function uid() {
    return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function addEvent(state, payload) {
    state.events.unshift(
      Object.assign(
        {
          id: uid(),
          timestamp: new Date().toISOString()
        },
        payload
      )
    );
  }

  function allStands() {
    return (window.IFA_STANDS || []).concat((load().customStands) || []);
  }

  window.IFAStorage = {
    load: load,
    save: save,
    uid: uid,
    addEvent: addEvent,
    allStands: function (state) {
      return (window.IFA_STANDS || []).concat((state && state.customStands) || []);
    }
  };
})();
