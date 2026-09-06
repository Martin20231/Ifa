/**
 * GPS-Standort für Messe Berlin → schematischer Lageplan.
 * Indoor oft ungenau; Spur + Check-ins ergänzen sich.
 */
window.IFAGps = (function () {
  "use strict";

  // Ungefähre Bounding-Box Messegelände Berlin (IFA)
  var BOUNDS = {
    north: 52.5112,
    south: 52.4988,
    west: 13.2655,
    east: 13.2865
  };

  // Nutzfläche im SVG (ohne Legende rechts)
  var MAP = { x0: 2, y0: 4, x1: 98, y1: 97 };

  var watchId = null;
  var listener = null;
  var lastFix = null;
  var tracking = false;

  function latLngToMap(lat, lng) {
    var nx = (lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west);
    var ny = (BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south);
    var onSite = nx >= -0.08 && nx <= 1.08 && ny >= -0.08 && ny <= 1.08;
    return {
      x: MAP.x0 + Math.max(0, Math.min(1, nx)) * (MAP.x1 - MAP.x0),
      y: MAP.y0 + Math.max(0, Math.min(1, ny)) * (MAP.y1 - MAP.y0),
      nx: nx,
      ny: ny,
      onSite: onSite
    };
  }

  function haversineM(a, b) {
    var R = 6371000;
    var toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad;
    var dLng = (b.lng - a.lng) * toRad;
    var la1 = a.lat * toRad;
    var la2 = b.lat * toRad;
    var h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function notify(payload) {
    lastFix = payload;
    if (typeof listener === "function") listener(payload);
  }

  function shouldKeepPoint(trail, fix) {
    if (!trail.length) return true;
    // Indoor oft 50–120 m – sehr ungenaue Fixes nicht in die Spur
    if (fix.accuracy && fix.accuracy > 150) return false;
    var prev = trail[trail.length - 1];
    var dist = haversineM(prev, fix);
    // Mindestens ~5 m weiter, sonst Rauschen
    if (dist < 5) return false;
    return true;
  }

  function start(onUpdate) {
    if (typeof onUpdate === "function") listener = onUpdate;
    if (!navigator.geolocation) {
      notify({ error: "GPS wird von diesem Gerät/Browser nicht unterstützt." });
      return false;
    }
    if (watchId != null) {
      tracking = true;
      return true;
    }
    tracking = true;
    watchId = navigator.geolocation.watchPosition(
      function (pos) {
        var fix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 0,
          at: new Date().toISOString()
        };
        var mapped = latLngToMap(fix.lat, fix.lng);
        fix.x = mapped.x;
        fix.y = mapped.y;
        fix.onSite = mapped.onSite;
        notify({ fix: fix });
      },
      function (err) {
        var msg = "Standort nicht verfügbar.";
        if (err && err.code === 1) {
          msg = "Standort-Zugriff verweigert. Bitte in den iPhone-Einstellungen erlauben.";
        }
        if (err && err.code === 2) {
          msg = "Position gerade nicht ermittelbar (oft in Hallen).";
        }
        if (err && err.code === 3) {
          msg = "GPS-Timeout – bitte kurz draußen oder am Fenster versuchen.";
        }
        notify({ error: msg, code: err && err.code });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000
      }
    );
    return true;
  }

  function stop() {
    tracking = false;
    if (watchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function isTracking() {
    return tracking && watchId != null;
  }

  function getLast() {
    return lastFix;
  }

  return {
    start: start,
    stop: stop,
    isTracking: isTracking,
    getLast: getLast,
    latLngToMap: latLngToMap,
    shouldKeepPoint: shouldKeepPoint,
    haversineM: haversineM
  };
})();
