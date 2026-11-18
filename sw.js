// ============================================================
// sw.js - offline app shell for Island Angler.
// Cache-first for everything bundled; bump VERSION on release.
// ============================================================

var VERSION = "ia-v2";
var CORE = [
  "./",
  "index.html",
  "css/style.css",
  "manifest.webmanifest",
  "js/util.js",
  "js/font.js",
  "js/art.js",
  "js/fish_data.js",
  "js/fish_art.js",
  "js/fish_art2.js",
  "js/char_art.js",
  "js/env_art.js",
  "js/audio.js",
  "js/save.js",
  "js/game.js",
  "js/widgets.js",
  "js/screens.js",
  "js/render.js",
  "js/main.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
  "screenshots/shot-landscape.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      // all-or-nothing on core, then activate immediately
      return cache.addAll(CORE);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== VERSION) caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      // cold miss on a navigation: serve the cached shell so the game
      // still boots offline from any scoped URL
      if (req.mode === "navigate") return caches.match("index.html");
      return fetch(req).then(function (res) {
        // opportunistically cache same-origin GETs
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return caches.match("index.html"); });
    })
  );
});
