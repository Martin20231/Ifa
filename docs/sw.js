/* IFA Tagebuch – Offline-Cache für Messegelände ohne Netz */
var CACHE = "ifa-tagebuch-20260906f";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/jsQR.min.js",
  "./js/site.js",
  "./js/food.js",
  "./js/storage.js",
  "./js/map.js",
  "./js/gps.js",
  "./js/scanner.js",
  "./js/app.js"
];

function stripSearch(request) {
  try {
    var url = new URL(request.url);
    url.search = "";
    url.hash = "";
    return url.href;
  } catch (e) {
    return request.url;
  }
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return caches.match(stripSearch(request)).then(function (byPath) {
        if (byPath) return byPath;
        return fetch(request).then(function (response) {
          if (!response || !response.ok) return response;
          if (request.url.indexOf(self.location.origin) !== 0) return response;
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(request, copy);
            cache.put(stripSearch(request), response.clone());
          });
          return response;
        }).catch(function () {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return caches.match(stripSearch(request));
        });
      });
    })
  );
});
