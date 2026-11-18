// ============================================================
// fish_art2.js — RARE / EPIC / LEGENDARY / MYTHICAL fish art,
// palettes for every species, and the sprite cache builder.
// ============================================================

(function () {
  var A = FG.fishArt, S = FG.fishArtSize;
  var TAU = Math.PI * 2;
  var fin = A._fin, pec = A._pec, eye = A._eye, gill = A._gill, col = A._col;
  var tail = A._tail, body = A._body;

  function define(key, w, h, fn) { A[key] = fn; S[key] = [w, h]; }

  // =============== RARE ===============
  define("lionfish", 46, 34, function (ctx, t, P, W, H) {
    var cy = 17, bx = 12, len = 17, HH = 6;
    var ph = Math.sin(t * TAU);
    // huge fan pectoral spines (behind body): radiating lines
    for (var i = 0; i < 7; i++) {
      var ang = (-0.9 + i * 0.42) + ph * 0.06;
      var lenR = 14 + (i % 2) * 3;
      var x0 = bx + 4, y0 = cy + 2;
      var x1 = x0 - Math.cos(ang) * lenR, y1 = y0 + Math.sin(ang) * lenR;
      ART.line(ctx, x0, y0, x1, y1, P("finEdge"));
      ART.line(ctx, x0, y0, x1, y1 - 1, P("fin"));
    }
    // tall spiny dorsal
    for (i = 0; i < 6; i++) {
      var dx = bx + 3 + i * 2.4;
      var dh = 8 - Math.abs(i - 2);
      ART.line(ctx, dx, cy - 3, dx, cy - 3 - dh, P("finEdge"));
      ART.line(ctx, dx, cy - 3 - dh, dx, cy - 3 - dh, P("fin"));
    }
    var prof = [[0, 0.4, 0.35], [0.3, 0.95, 0.95], [0.7, 0.85, 0.8], [1, 0.3, 0.3]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    // red/white vertical stripes
    if (!P.sil) {
      for (var x = 1; x < len - 1; x += 3) {
        col(ctx, bx + x, b.top[x], b.bot[x], P("stripe"));
        if (b.top[x + 1] !== undefined) col(ctx, bx + x + 1, b.top[x + 1], b.bot[x + 1], P("stripe2"));
      }
    }
    tail.round(ctx, bx + len - 1, cy, 7, 5, t, P);
    if (!P.sil) { eye(ctx, bx + 2, cy - 2, 2, P); ctx.fillStyle = P("out"); ctx.fillRect(bx, cy + 1, 2, 1); }
  });

  define("mahi", 58, 26, function (ctx, t, P, W, H) {
    var cy = 15, bx = 2, len = 34, HH = 7.5;
    var prof = [[0, 0.35, 0.35], [0.2, 0.85, 0.85], [0.45, 1, 1], [0.75, 0.85, 0.8], [1, 0.3, 0.3]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    // long dorsal from head to tail
    fin(ctx, [
      [bx + 2, b.top[1]], [bx + 5, b.top[2] - 8], [bx + 12, b.top[8] - 9],
      [bx + 22, b.top[17] - 6], [bx + 30, b.top[26] - 3], [bx + 33, b.top[30]]
    ], P);
    // blue spots
    if (!P.sil) {
      var rng = FG.rng(61);
      for (var i = 0; i < 14; i++) {
        var x = bx + 4 + Math.floor(rng() * (len - 8));
        ctx.fillStyle = P("dot");
        ctx.fillRect(x, b.top[x - bx] + 1 + Math.floor(rng() * 4), 1, 1);
      }
    }
    // anal fin
    fin(ctx, [[bx + 20, b.bot[18]], [bx + 24, b.bot[22] + 4], [bx + 28, b.bot[26] + 2]], P);
    tail.fork(ctx, bx + len - 1, cy, 12, 7, t, P);
    pec(ctx, bx + 9, cy + 2, 5, 5, P, t * 0.8);
    if (!P.sil) { eye(ctx, bx + 2, cy - 3, 2, P); gill(ctx, bx + 6, cy - 5, cy + 2, P("out2")); ctx.fillStyle = P("out"); ctx.fillRect(bx, cy + 1, 2, 1); }
  });

  define("tuna", 66, 26, function (ctx, t, P, W, H) {
    var cy = 13, bx = 2, len = 40, HH = 8;
    var prof = [[0, 0.3, 0.35], [0.15, 0.8, 0.85], [0.4, 1, 0.95], [0.75, 0.85, 0.7], [1, 0.22, 0.22]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      // darker back
      for (var x = 3; x < len - 2; x++) col(ctx, bx + x, b.top[x], b.top[x] + 2, P("back"));
    }
    // first dorsal
    fin(ctx, [[bx + 8, b.top[6]], [bx + 12, b.top[9] - 6], [bx + 16, b.top[13] - 5], [bx + 19, b.top[16]]], P);
    // yellow finlets (rows of little triangles)
    for (var i = 0; i < 5; i++) {
      var fx = bx + 26 + i * 3;
      fin(ctx, [[fx, b.top[24 + i * 2] - 2], [fx + 1, b.top[24 + i * 2] - 4], [fx + 2, b.top[24 + i * 2] - 2]], P, undefined);
      fin(ctx, [[fx, b.bot[24 + i * 2] + 2], [fx + 1, b.bot[24 + i * 2] + 4], [fx + 2, b.bot[24 + i * 2] + 2]], P, undefined);
    }
    // yellow second dorsal & anal
    if (!P.sil) { ctx.fillStyle = P("fin"); }
    fin(ctx, [[bx + 22, b.top[20] - 3], [bx + 24, b.top[21] - 5], [bx + 25, b.top[22] - 3]], P);
    fin(ctx, [[bx + 24, b.bot[22] + 3], [bx + 26, b.bot[24] + 5], [bx + 27, b.bot[25] + 3]], P);
    // lunate tail
    tail.lunate(ctx, bx + len - 1, cy, 13, 8.5, t, P);
    pec(ctx, bx + 8, cy + 3, 5, 4, P, t * 0.6);
    if (!P.sil) { eye(ctx, bx + 2, cy - 3, 2, P); gill(ctx, bx + 6, cy - 5, cy + 2, P("out2")); ctx.fillStyle = P("out"); ctx.fillRect(bx, cy + 2, 2, 1); }
  });

  define("barracuda", 70, 16, function (ctx, t, P, W, H) {
    var cy = 8, bx = 2, len = 48, HH = 4.5;
    var prof = [[0, 0.35, 0.55], [0.1, 0.75, 0.95], [0.4, 1, 1], [0.75, 0.8, 0.7], [1, 0.2, 0.2]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      // oblique dark bars
      for (var x = 6; x < len - 6; x += 5) {
        for (var k = 0; k < 4; k++) {
          if (b.bot[x + k] !== undefined) {
            ctx.fillStyle = P("stripe");
            ctx.fillRect(bx + x + k, b.top[x + k] + 1, 1, 1);
          }
        }
      }
      // teeth: underbite jaw
      ctx.fillStyle = P("tooth");
      for (x = 0; x < 4; x++) ctx.fillRect(bx + x, cy + 2 - (x % 2), 1, 1);
      ctx.fillStyle = P("out");
      ctx.fillRect(bx, cy + 1, 5, 1);
    }
    // pointed dorsal + back finlets
    fin(ctx, [[bx + 18, b.top[16]], [bx + 21, b.top[18] - 4], [bx + 24, b.top[21]]], P);
    fin(ctx, [[bx + 30, b.top[28] - 2], [bx + 32, b.top[30] - 3], [bx + 34, b.top[32] - 1]], P);
    tail.fork(ctx, bx + len - 1, cy, 12, 7, t, P);
    pec(ctx, bx + 14, cy + 2, 4, 3, P, t * 0.7);
    if (!P.sil) { eye(ctx, bx + 3, cy - 2, 2, P); ctx.fillStyle = P("out"); ctx.fillRect(bx, cy, 3, 1); }
  });

  define("jack", 50, 22, function (ctx, t, P, W, H) {
    var cy = 11, bx = 2, len = 30, HH = 6.5;
    var prof = [[0, 0.3, 0.35], [0.2, 0.8, 0.85], [0.5, 1, 1], [0.8, 0.8, 0.7], [1, 0.22, 0.22]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      for (var x = 2; x < len - 2; x++) col(ctx, bx + x, b.top[x], b.top[x] + 1, P("stripe"));
      ART.circle(ctx, bx + 4, cy, 2, P("patch")); // heart spot
    }
    fin(ctx, [[bx + 9, b.top[7]], [bx + 12, b.top[10] - 4], [bx + 15, b.top[13] - 3], [bx + 17, b.top[15]]], P);
    fin(ctx, [[bx + 17, b.bot[15]], [bx + 20, b.bot[18] + 2], [bx + 23, b.bot[21] + 1]], P);
    tail.fork(ctx, bx + len - 1, cy, 10, 6.5, t, P);
    pec(ctx, bx + 8, cy + 2, 4, 4, P, t * 0.8);
    if (!P.sil) { eye(ctx, bx + 2, cy - 3, 2, P); gill(ctx, bx + 6, cy - 4, cy + 2, P("out2")); ctx.fillStyle = P("out"); ctx.fillRect(bx, cy + 1, 2, 1); }
  });

  define("ray", 52, 48, function (ctx, t, P, W, H) {
    // top-down glider, swims toward bottom of screen; fins undulate
    var cx = 26, cy = 19;
    var wave = Math.sin(t * TAU);
    // big winged disc
    for (var pass = 0; pass < 2; pass++) {
      var colr = pass === 0 ? (P.sil ? P("#000") : P("out")) : (P.sil ? P("#000") : null);
      if (!colr) ctx.fillStyle = P("mid");
      for (var y = -9; y <= 12; y++) {
        var wing = 0, taper = FG.clamp((y + 9) / 22, 0, 1);
        var base = Math.round(22 * Math.sin(Math.min(1, taper * 1.25)) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, taper))));
        var wob = Math.round(wave * 2 * (0.2 + Math.abs(taper - 0.5)));
        for (var s = -1; s <= 1; s += 2) {
          var x0 = cx + s * (2 + base * 0.4);
          var x1 = cx + s * (2 + base);
          var xa = Math.min(x0, x1), xb = Math.max(x0, x1);
          ctx.fillStyle = colr || (Math.abs(s * 1) && !P.sil && s < 0 ? P("dark") : (colr || P("mid")));
          if (colr) ctx.fillStyle = colr;
          ctx.fillRect(xa + (s > 0 ? wob : -wob), cy + y, Math.max(1, xb - xa), 1);
        }
      }
    }
    if (!P.sil) {
      // mottling + pale top-center ridge
      var rng = FG.rng(71);
      ctx.fillStyle = P("spot");
      for (var i = 0; i < 22; i++) ctx.fillRect(cx - 14 + Math.floor(rng() * 28), cy - 6 + Math.floor(rng() * 20), 1, 1);
      ctx.fillStyle = P("edge");
      ctx.fillRect(cx - 1, cy - 8, 2, 3);
      eye(ctx, cx - 2, cy - 8, 1, P); eye(ctx, cx + 3, cy - 8, 1, P);
      // tail with barb
      ART.line(ctx, cx, cy + 12, cx, cy + 24, P("out"));
      ART.line(ctx, cx - 1, cy + 22, cx, cy + 25, P("finEdge"));
      ART.line(ctx, cx + 1, cy + 22, cx, cy + 25, P("finEdge"));
    } else {
      ART.line(ctx, cx, cy + 12, cx, cy + 26, P("#000"));
    }
  });

  // =============== EPIC ===============
  define("hammerhead", 78, 30, function (ctx, t, P, W, H) {
    var cy = 15, bx = 16, len = 36, HH = 7;
    // hammer head bar first (behind body)
    fin(ctx, [[bx - 11, cy - 3], [bx + 2, cy - 4], [bx + 2, cy + 4], [bx - 11, cy + 3]], P);
    var prof = [[0, 0.4, 0.45], [0.2, 0.8, 0.9], [0.5, 1, 1], [0.8, 0.75, 0.6], [1, 0.2, 0.2]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    // tall dorsal
    fin(ctx, [[bx + 14, b.top[11]], [bx + 17, b.top[14] - 7], [bx + 21, b.top[18] - 4], [bx + 24, b.top[21]]], P);
    fin(ctx, [[bx + 24, b.bot[22] + 1], [bx + 27, b.bot[25] + 3], [bx + 29, b.bot[27] + 2]], P);
    // pecal fin
    pec(ctx, bx + 10, cy + 3, 5, 4, P, t * 0.7);
    tail.crescent(ctx, bx + len - 1, cy, 14, 8.5, t, P);
    if (!P.sil) {
      // eyes at hammer tips
      eye(ctx, bx - 10, cy - 2, 1, P);
      eye(ctx, bx + 1, cy - 3, 2, P);
      gill(ctx, bx + 6, cy - 4, cy + 2, P("out2"));
      ctx.fillStyle = P("mouth");
      ctx.fillRect(bx, cy + 3, 4, 1);
      ctx.fillStyle = P("out");
      ctx.fillRect(bx + 2, cy + 4, 1, 1);
    }
  });

  define("swordfish", 76, 26, function (ctx, t, P, W, H) {
    var cy = 14, bx = 14, len = 34, HH = 5.5;
    // long bill
    ctx.fillStyle = P("out");
    for (var i = 0; i < 13; i++) ctx.fillRect(bx - 13 + i, cy - (i > 6 ? 1 : 0), 1, 1 + (i < 4 ? 0 : 0));
    ctx.fillStyle = P("bill");
    for (i = 1; i < 12; i++) ctx.fillRect(bx - 13 + i, cy, 1, 1);
    var prof = [[0, 0.5, 0.55], [0.25, 0.9, 0.95], [0.55, 1, 1], [0.8, 0.7, 0.6], [1, 0.18, 0.18]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    // sail dorsal
    fin(ctx, [[bx + 5, b.top[4]], [bx + 9, b.top[7] - 11], [bx + 14, b.top[11] - 9], [bx + 18, b.top[15] - 4], [bx + 21, b.top[18]]], P);
    fin(ctx, [[bx + 20, b.bot[18]], [bx + 24, b.bot[22] + 3], [bx + 26, b.bot[24] + 2]], P);
    tail.fork(ctx, bx + len - 1, cy, 12, 7, t, P);
    pec(ctx, bx + 10, cy + 2, 4, 4, P, t * 0.6);
    if (!P.sil) { eye(ctx, bx + 2, cy - 2, 2, P); gill(ctx, bx + 6, cy - 3, cy + 2, P("out2")); }
  });

  define("marlin", 80, 26, function (ctx, t, P, W, H) {
    var cy = 14, bx = 15, len = 38, HH = 5.5;
    // long spear bill
    ctx.fillStyle = P("out");
    for (var i = 0; i < 14; i++) ctx.fillRect(bx - 14 + i, cy - (i > 8 ? 1 : 0), 1, 1);
    ctx.fillStyle = P("bill");
    for (i = 1; i < 13; i++) ctx.fillRect(bx - 14 + i, cy, 1, 1);
    var prof = [[0, 0.5, 0.5], [0.2, 0.9, 0.95], [0.5, 1, 1], [0.75, 0.75, 0.65], [1, 0.18, 0.18]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      for (var x = 3; x < len - 3; x++) col(ctx, bx + x, b.bot[x] - 1, b.bot[x], P("stripe"));
    }
    // full-length sail dorsal
    fin(ctx, [[bx + 3, b.top[2]], [bx + 7, b.top[5] - 9], [bx + 13, b.top[10] - 10], [bx + 20, b.top[17] - 7], [bx + 27, b.top[23] - 3], [bx + 32, b.top[28]]], P);
    // two long anal fins
    fin(ctx, [[bx + 14, b.bot[12] + 1], [bx + 17, b.bot[15] + 6], [bx + 19, b.bot[17] + 1]], P);
    fin(ctx, [[bx + 24, b.bot[21] + 1], [bx + 27, b.bot[24] + 6], [bx + 29, b.bot[26] + 1]], P);
    tail.crescent(ctx, bx + len - 1, cy, 13, 8, t, P);
    pec(ctx, bx + 10, cy + 2, 4, 5, P, t * 0.5);
    if (!P.sil) { eye(ctx, bx + 2, cy - 2, 2, P); gill(ctx, bx + 7, cy - 3, cy + 2, P("out2")); }
  });

  define("grouper", 54, 28, function (ctx, t, P, W, H) {
    var cy = 14, bx = 3, len = 32, HH = 9;
    var prof = [[0, 0.45, 0.45], [0.2, 0.85, 0.9], [0.5, 1, 1], [0.8, 0.85, 0.8], [1, 0.35, 0.35]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      // tiger stripes
      var rng = FG.rng(81);
      ctx.fillStyle = P("stripe");
      for (var i = 0; i < 6; i++) {
        var x = bx + 6 + i * 4 + (i % 2);
        for (var k = 0; k < 5; k++) {
          var yy = b.top[x - bx] + 1 + k + (i % 2);
          if (b.bot[x - bx + k] !== undefined && yy <= b.bot[x - bx]) ctx.fillRect(x + k, yy, 1, 1);
        }
      }
      // big mouth
      ctx.fillStyle = P("out");
      ctx.fillRect(bx, cy + 1, 6, 1);
      ctx.fillStyle = P("mouth");
      ctx.fillRect(bx + 1, cy + 2, 4, 1);
      // spots
      ctx.fillStyle = P("patch");
      for (i = 0; i < 16; i++) ctx.fillRect(bx + 4 + Math.floor(rng() * 24), cy - 6 + Math.floor(rng() * 12), 1, 1);
    }
    fin(ctx, [[bx + 8, b.top[6]], [bx + 14, b.top[10] - 3], [bx + 20, b.top[16] - 3], [bx + 25, b.top[21]]], P);
    fin(ctx, [[bx + 12, b.bot[10]], [bx + 17, b.bot[15] + 3], [bx + 22, b.bot[19] + 2]], P);
    tail.round(ctx, bx + len - 1, cy, 9, 7, t, P);
    pec(ctx, bx + 9, cy + 3, 5, 5, P, t * 0.5);
    if (!P.sil) { eye(ctx, bx + 3, cy - 4, 2, P); gill(ctx, bx + 7, cy - 6, cy + 3, P("out2")); }
  });

  define("lantern", 26, 16, function (ctx, t, P, W, H) {
    var cy = 8, bx = 4, len = 14, HH = 5;
    var prof = [[0, 0.45, 0.5], [0.3, 1, 1], [0.7, 0.85, 0.8], [1, 0.25, 0.25]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    // photophore rows along belly + flank
    if (!P.sil) {
      var glowT = 0.6 + 0.4 * Math.sin(t * TAU * 2);
      ctx.globalAlpha = 0.35;
      ART.circle(ctx, bx + 3, cy + 3, 2, P("glow"));
      ART.circle(ctx, bx + 8, cy + 3, 2, P("glow"));
      ctx.globalAlpha = 1;
      ctx.fillStyle = P("glow");
      for (var x = 2; x < len - 1; x += 2) ctx.fillRect(bx + x, b.bot[x] - 1, 1, 1);
      ctx.fillStyle = P("glow2");
      for (x = 3; x < len - 2; x += 3) ctx.fillRect(bx + x, cy, 1, 1);
      // lure antenna with glowing tip
      ART.line(ctx, bx + 2, cy - 4, bx - 3, cy - 8, P("finEdge"));
      ctx.fillStyle = P("lure");
      ctx.fillRect(bx - 3, cy - 8, 1, 1);
      ctx.globalAlpha = 0.5 * glowT;
      ART.circle(ctx, bx - 3, cy - 8, 2, P("lure"));
      ctx.globalAlpha = 1;
    }
    tail.fork(ctx, bx + len - 1, cy, 6, 4, t, P);
    if (!P.sil) eye(ctx, bx + 2, cy - 2, 2, P);
  });

  // =============== LEGENDARY ===============
  define("koi", 50, 24, function (ctx, t, P, W, H) {
    var cy = 12, bx = 3, len = 30, HH = 6.5;
    // flowing fins behind
    var f = Math.sin(t * TAU) * 2;
    fin(ctx, [[bx + 8, cy - 5], [bx + 4, cy - 11 + f], [bx + 14, cy - 8 - f], [bx + 16, cy - 5]], P);
    fin(ctx, [[bx + 10, cy + 5], [bx + 6, cy + 11 - f], [bx + 16, cy + 9 + f], [bx + 18, cy + 5]], P);
    fin(ctx, [[bx + 26, cy - 3], [bx + 37, cy - 8 + f], [bx + 34, cy + f], [bx + 37, cy + 8 - f], [bx + 26, cy + 3]], P);
    var prof = [[0, 0.4, 0.4], [0.2, 0.8, 0.85], [0.5, 1, 1], [0.8, 0.8, 0.75], [1, 0.28, 0.28]];
    var b = body(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      // red patches with soft edges + a black crown patch
      var patches = [[5, 9, -4, -1], [13, 17, 0, 4], [21, 25, -5, 0]];
      for (var i = 0; i < patches.length; i++) {
        var p = patches[i];
        for (var x = p[0]; x <= p[1]; x++) {
          var y0 = Math.max(b.top[x] + 1, cy + p[2]), y1 = Math.min(b.bot[x] - 1, cy + p[3]);
          ctx.fillStyle = P("patch");
          ctx.fillRect(bx + x, y0, 1, y1 - y0 + 1);
          ctx.fillStyle = P("gold");
          if (b.bot[x] !== undefined && y1 + 1 <= b.bot[x]) ctx.fillRect(bx + x, y1 + 1, 1, 1);
        }
      }
      // whiskers
      ctx.fillStyle = P("whisker");
      ctx.fillRect(bx - 1, cy - 1, 1, 1);
      ctx.fillRect(bx - 1, cy + 2, 1, 1);
      ART.line(ctx, bx - 1, cy - 1, bx - 3, cy - 2, P("whisker"));
      ART.line(ctx, bx - 1, cy + 2, bx - 3, cy + 3, P("whisker"));
    }
    if (!P.sil) eye(ctx, bx + 2, cy - 2, 2, P);
  });

  define("eel", 68, 18, function (ctx, t, P, W, H) {
    // sinuous ribbon drawn along a moving sine wave
    var cy = 9, bx = 4, len = 56, ph = t * TAU;
    function spine(x) { return cy + Math.sin(x * 0.28 + ph) * 3.5; }
    function thick(x) { var hf = 1 - x / len; return Math.max(1, Math.round(3.2 * FG.smo01(hf * 1.4) + (x < 6 ? 1 : 0))); }
    var x;
    // outline
    for (var pass = 0; pass < 2; pass++) {
      var c = pass === 0 ? P("out") : P("mid");
      for (x = 0; x < len; x++) {
        var yy = spine(x), hh = thick(x);
        ctx.fillStyle = c;
        ctx.fillRect(bx + x, Math.round(yy - hh) + (pass ? 0 : -1), 1, hh * 2 + (pass ? 1 : 3));
      }
    }
    // belly sheen + head
    if (!P.sil) {
      for (x = 0; x < len; x++) {
        var y2 = spine(x), h2 = thick(x);
        ctx.fillStyle = P("sheen");
        ctx.fillRect(bx + x, Math.round(y2 + h2), 1, 1);
      }
      // pale head + eye
      ctx.fillStyle = P("belly");
      ctx.fillRect(bx, cy - 2, 4, 5);
      eye(ctx, bx + 1, cy - 1, 1, P);
      ctx.fillStyle = P("out");
      ctx.fillRect(bx - 1, cy + 1, 2, 1);
    }
    // small tail tuft
    ctx.fillStyle = P("fin");
    ctx.fillRect(bx + len - 1, Math.round(spine(len - 1)), 2, 1);
  });

  define("sunfish", 58, 54, function (ctx, t, P, W, H) {
    var cx = 22, cy = 27, R = 15;
    // giant oval body with clipped rear (clavus)
    function rows(c) {
      for (var y = -R; y <= R; y++) {
        var w = Math.round(R * Math.sqrt(Math.max(0, 1 - (y * y) / (R * R))) * 1.15);
        var rear = Math.round(w * (1 - Math.max(0, y / R) * 0.15));
        ctx.fillStyle = c;
        if (R > 8 && y > R - 4) w = Math.min(w, 7); // clavus pinch
        ctx.fillRect(cx - w, cy + y, w * 2 - (y > 6 ? Math.round((y - 6) * 0.7) : 0), 1);
      }
    }
    if (P.sil) {
      rows(P("#000"));
    } else {
      var offs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (var oi = 0; oi < offs.length; oi++) {
        ctx.save(); ctx.translate(offs[oi][0], offs[oi][1]); rows(P("out")); ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      for (y = -R; y <= R; y++) {
        var w2 = Math.round(R * Math.sqrt(Math.max(0, 1 - (y * y) / (R * R))) * 1.15);
        ctx.rect(cx - w2, cy + y, w2 * 2, 1);
      }
      ctx.clip();
      ART.vgrad(ctx, cx - R, cy - R, R * 2, R * 2, P("dark"), P("belly"), 8);
      var rng = FG.rng(91);
      ctx.fillStyle = P("spot");
      for (var i = 0; i < 18; i++) ctx.fillRect(cx - 12 + Math.floor(rng() * 22), cy - 12 + Math.floor(rng() * 24), 1, 1);
      ctx.restore();
    }
    // towering dorsal & anal fins
    var f = Math.sin(t * TAU) * 2;
    fin(ctx, [[cx - 4, cy - R + 2], [cx + 2, cy - R - 12 + f], [cx + 10, cy - R - 8 - f], [cx + 12, cy - R + 2]], P);
    fin(ctx, [[cx - 2, cy + R - 2], [cx + 3, cy + R + 11 - f], [cx + 10, cy + R + 7 + f], [cx + 11, cy + R - 2]], P);
    // clavus tail lobe wobble
    fin(ctx, [[cx + 13, cy + 2], [cx + 18, cy + 6 + f], [cx + 16, cy + 10 - f], [cx + 12, cy + 8]], P);
    if (!P.sil) {
      eye(ctx, cx - 10, cy - 6, 2, P);
      ctx.fillStyle = P("out");
      ctx.fillRect(cx - 16, cy - 3, 2, 1);
    }
  });

  // =============== MYTHICAL ===============
  define("jelly", 48, 56, function (ctx, t, P, W, H) {
    var cx = 20, cy = 15, R = 13, ph = t * TAU, pulse = Math.sin(ph);
    if (P.sil) {
      ctx.fillStyle = P("#000");
      ART.ellipse(ctx, cx, cy, R + pulse, R * 0.8 + pulse * 0.6, P("#000"));
      for (var i = 0; i < 6; i++) {
        var tx = cx - 11 + i * 4.4;
        ART.line(ctx, tx, cy + 8, tx + Math.sin(ph + i) * 3, cy + 30, P("#000"));
      }
      return;
    }
    ctx.globalAlpha = 0.85;
    // bell: dome rows
    for (var y = -R * 0.8; y <= R * 0.7; y++) {
      var w = Math.round(R * Math.sqrt(Math.max(0, 1 - (y * y) / ((R * 0.9) * (R * 0.9)))));
      ctx.fillStyle = y < -2 ? P("dark") : (y > 4 ? P("belly") : P("mid"));
      ctx.fillRect(cx - w, Math.round(cy + y), w * 2 + 1, 1);
    }
    // inner rings
    ctx.fillStyle = P("glow");
    for (var r2 = 0; r2 < 3; r2++) {
      ctx.fillRect(cx - 8 + r2 * 3, cy + 4 - r2, 2, 1);
      ctx.fillRect(cx + 6 - r2 * 3, cy + 4 - r2, 2, 1);
    }
    // rim frill
    ctx.fillStyle = P("fin");
    for (var k = 0; k < 9; k++) {
      var fx = cx - R + Math.round(k * (R * 2 / 8));
      ctx.fillRect(fx, Math.round(cy + R * 0.65 + Math.sin(ph + k) * 1.5), 2, 2);
    }
    // long tentacles
    for (i = 0; i < 6; i++) {
      var tx2 = cx - 10 + i * 4;
      var segs = 4, py = cy + 9;
      for (var s = 0; s < segs; s++) {
        var nx = tx2 + Math.sin(ph + i * 1.3 + s) * (3 + s);
        var ny = py + 6 + s * 5;
        ART.line(ctx, tx2 + Math.sin(ph + i + s) * 2, py, nx, ny, s === segs - 1 ? P("glow") : P("finEdge"));
        py = ny; tx2 = nx;
      }
    }
    // soft glow halo
    ctx.globalAlpha = 0.18 + 0.1 * pulse;
    ART.circle(ctx, cx, cy, R + 5, P("glow"));
    ctx.globalAlpha = 1;
  });

  define("ghostlin", 84, 30, function (ctx, t, P, W, H) {
    var cy = 15, bx = 16, len = 38, HH = 5.5, ph = t * TAU;
    var bill;
    // aurora body: vertical shimmer gradient
    function aurora(x, y0, y1) {
      var h = y1 - y0;
      for (var k = 0; k < h; k++) {
        var tt = k / Math.max(1, h);
        var hue = 0.5 + 0.5 * Math.sin(ph + x * 0.35 + tt * 2.2);
        ctx.fillStyle = FG.mix("#7a5ad0", "#7de8d8", hue);
        ctx.fillRect(bx + x, y0 + k, 1, 1);
      }
    }
    // bill (glowing lance)
    for (var i = 0; i < 15; i++) ctx.fillRect(bx - 15 + i, cy - (i > 9 ? 1 : 0), 1, 1);
    var prof = [[0, 0.5, 0.5], [0.2, 0.9, 0.95], [0.5, 1, 1], [0.75, 0.75, 0.65], [1, 0.18, 0.18]];
    // outline glow pass
    ctx.globalAlpha = 0.45;
    var offs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var oi = 0; oi < offs.length; oi++) {
      ctx.save(); ctx.translate(offs[oi][0], offs[oi][1]);
      ctx.fillStyle = P("glow");
      var tt2 = 0;
      for (var x = 0; x < len; x++) {
        var pr = A._prof(prof, len <= 1 ? 0 : x / (len - 1));
        var yt = Math.round(cy - pr[0] * HH), yb = Math.round(cy + pr[1] * HH);
        ctx.fillRect(bx + x, yt, 1, yb - yt + 1);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 0.8;
    for (x = 0; x < len; x++) {
      var pr2 = A._prof(prof, len <= 1 ? 0 : x / (len - 1));
      aurora(x, Math.round(cy - pr2[0] * HH), Math.round(cy + pr2[1] * HH));
    }
    ctx.globalAlpha = 1;
    // sail dorsal (translucent)
    ctx.globalAlpha = 0.65;
    fin(ctx, [[bx + 4, cy - HH], [bx + 10, cy - HH - 8 + Math.sin(ph) * 1.5], [bx + 20, cy - HH - 7 - Math.sin(ph) * 1.5], [bx + 30, cy - HH - 2]], P);
    tail.crescent(ctx, bx + len - 1, cy, 12, 8, t, P);
    ctx.globalAlpha = 1;
    if (!P.sil) {
      eye(ctx, bx + 2, cy - 2, 2, P);
      ctx.fillStyle = "#eafff8";
      ctx.fillRect(bx - 15, cy - 1, 1, 1); // bill tip spark
    }
  });

  // =============== PALETTES ===============
  FG.FISH_PAL = {
    guppy: { out:"#101a24", dark:"#1b5b7a", mid:"#2f8fb5", belly:"#bfeaf5", fin:"#c23048", finEdge:"#5d1120", accent:"#ffd6e0" },
    tetra: { out:"#0f141e", dark:"#2b3b52", dark2:"#131a26", mid:"#5d7ea8", belly:"#c9dcef", fin:"#2f3d52", finEdge:"#10161f", ember:"#e85b3a" },
    blenny: { out:"#14160f", dark:"#4a5c34", mid:"#74864a", belly:"#d8dcb0", fin:"#8b9a5c", finEdge:"#2c331c", patch:"#3e4c28" },
    goby: { out:"#171410", dark:"#6b5a42", mid:"#a48f6b", belly:"#e8dcbf", fin:"#8a7455", finEdge:"#3a2f1f", patch:"#4e3f2b", accent:"#d8c9a8" },
    darter: { out:"#0d1218", dark:"#3a4d63", dark2:"#22303f", mid:"#8fb8d1", belly:"#e2f1f8", fin:"#4a6278", finEdge:"#1b2530", stripe:"#1d2836" },
    damsel: { out:"#0c1018", dark:"#1d3d6e", mid:"#2e64b8", belly:"#bcd8f5", fin:"#1b3a66", finEdge:"#0a1322", gold:"#f5c542" },
    snapper: { out:"#1a0f0e", dark:"#7a2f28", mid:"#c05a45", belly:"#f0c9a8", fin:"#a34a3a", finEdge:"#401711", patch:"#5c1f18", stripe:"#e8bfa0" },
    clownfish: { out:"#120d08", dark:"#c65a18", mid:"#f07c1f", belly:"#ffb964", fin:"#e8701c", finEdge:"#171208", accent:"#ffdc9a" },
    tang: { out:"#0a1020", dark:"#1432a0", mid:"#2e63e8", belly:"#8fb8ff", fin:"#1c2c5c", finEdge:"#0a1226", mark:"#0d1428", yellow:"#f2c53a" },
    parrotfish: { out:"#0d1414", dark:"#1c7a68", mid:"#37b89a", belly:"#bdf5d8", fin:"#2a9176", finEdge:"#0d3a2e", scale:"#c9f5e0", face:"#e87aa0", beak:"#f5e8c8" },
    angel: { out:"#0a0f18", dark:"#1a3f8f", mid:"#2f66c9", belly:"#a8c8f0", fin:"#18355f", finEdge:"#080e18", gold:"#f5c542", mask:"#0c1016" },
    wrasse: { out:"#0a1410", dark:"#155c3f", dark2:"#0b2e20", mid:"#2ea870", belly:"#bdf5cf", fin:"#1c7a4e", finEdge:"#0a2c1c", sheen:"#86f5c0" },
    puffer: { out:"#171310", dark:"#8a6f45", mid:"#c8ab6e", belly:"#f0e6c3", fin:"#a08558", finEdge:"#40301c", spot:"#6b5230" },
    lionfish: { out:"#180d12", dark:"#7a1f2a", mid:"#c84a54", belly:"#f2d8b0", fin:"#f5e9d8", finEdge:"#7a4055", stripe:"#ffffff", stripe2:"#e85a3a" },
    mahi: { out:"#0c1210", dark:"#1c6e4c", mid:"#3aa06e", belly:"#f2c85a", fin:"#2e86c9", finEdge:"#0d2b40", dot:"#9ae6ff" },
    tuna: { out:"#0a0f18", dark:"#16314f", back:"#0e2440", mid:"#3f6a8f", belly:"#e8eef5", fin:"#e8b71f", finEdge:"#8a6c10" },
    barracuda: { out:"#0d1212", dark:"#3a4a42", mid:"#7a8f80", belly:"#d8e5da", fin:"#5c6e60", finEdge:"#202b24", stripe:"#57695c", tooth:"#f5f2e8" },
    jack: { out:"#10140f", dark:"#5f5f3a", mid:"#9aa06a", belly:"#e8ecc8", fin:"#b5a94a", finEdge:"#4a4320", patch:"#1d2418", stripe:"#455237" },
    ray: { out:"#120f0c", dark:"#584a3c", mid:"#857258", belly:"#cfc4ae", fin:"#685a48", finEdge:"#26201a", spot:"#a89878", edge:"#a89474" },
    hammerhead: { out:"#101216", dark:"#3d4a55", mid:"#6e8293", belly:"#e2eaf0", fin:"#556575", finEdge:"#232c33", mouth:"#e8e0d8" },
    swordfish: { out:"#0a0e1a", dark:"#1c2e4f", mid:"#375a8a", belly:"#cfe0f0", fin:"#2b3f66", finEdge:"#0d1526", bill:"#d8e6f2" },
    marlin: { out:"#0a1018", dark:"#1e3a5f", mid:"#3f7ac2", belly:"#eaf2fa", fin:"#2d5e93", finEdge:"#0f2035", stripe:"#a8c8f0", bill:"#c8d8e8" },
    grouper: { out:"#151008", dark:"#5c452a", mid:"#8f6d45", belly:"#e8d8b0", fin:"#6e5535", finEdge:"#2e2110", stripe:"#42301a", patch:"#a89060", mouth:"#d8a890" },
    lantern: { out:"#080a12", dark:"#161a28", mid:"#262e44", belly:"#3a4560", fin:"#1c2233", finEdge:"#0a0d16", glow:"#7de8d8", glow2:"#5ab8c8", lure:"#eafcf8" },
    koi: { out:"#33241a", dark:"#d8cfc4", mid:"#f5efe6", belly:"#ffffff", fin:"#e8dcc8", finEdge:"#8a7658", patch:"#d94a35", gold:"#e8b71f", whisker:"#c8bfae" },
    eel: { out:"#0c0816", dark:"#2a1e40", mid:"#453663", belly:"#a896c8", fin:"#352750", finEdge:"#160e28", sheen:"#c8b8e8" },
    sunfish: { out:"#12151a", dark:"#5a6a72", mid:"#8ca0a8", belly:"#d8e4ea", fin:"#7a8c94", finEdge:"#3c4a52", spot:"#eef5f8" },
    jelly: { out:"#0d1822", dark:"#2a6a8a", mid:"#7ad8f0", belly:"#d8f8ff", fin:"#9ae8f8", finEdge:"#2a6a8a", glow:"#b8f2ff" },
    ghostlin: { out:"#101020", dark:"#2a2a55", mid:"#5a4a9a", belly:"#a8d8f0", fin:"#7a6ad0", finEdge:"#3a3a6a", glow:"#aef5e8" }
  };

  // =============== SPRITE BUILDER ===============
  FG.FISH_FRAMES = 6;
  FG.fishSprite = function (fishId, frame, sil) {
    var f = FG.FISH_BY_ID[fishId];
    if (!f) return null;
    var key = f.art + "|" + frame + "|" + (sil ? 1 : 0);
    if (ART.cache[key]) return ART.cache[key];
    var dims = S[f.art];
    if (!dims || !A[f.art]) return null;
    var PAD = 4;
    var c = FG.makeCanvas(dims[0] + PAD * 2, dims[1] + PAD * 2);
    var ctx = c.getContext("2d");
    ctx.translate(PAD, PAD);
    var pal = FG.FISH_PAL[f.art] || {};
    var P = FG.makePal(pal, sil);
    try {
      A[f.art](ctx, frame / FG.FISH_FRAMES, P, dims[0], dims[1]);
    } catch (e) {
      console.warn("fish art error", fishId, e);
    }
    ART.cache[key] = c;
    return c;
  };
})();
