// ============================================================
// env_art.js — environment sprites & UI icons, all procedural.
// Palms, hut, dock props, clouds, rocks, flowers, icons, bobber.
// ============================================================

(function () {
  var E = FG.env = {};
  var OUT = "#141b26";

  function px(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function opx(ctx, x, y, w, h) { ctx.fillStyle = OUT; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  // ---------------- palm tree ----------------
  // returns {c:canvas, swayAnchor:[x,y]} base at bottom-center
  E.palm = function (variant) {
    return ART.get("palm" + variant, function () {
      var c = FG.makeCanvas(72, 84), ctx = c.getContext("2d");
      var rng = FG.rng(101 + variant * 7);
      var bx = 28, lean = variant === 0 ? 6 : -4;
      // trunk: curvy (ny must stack from a fixed base - reading the mutated
      // ty here made segments climb off the canvas and left floating blocks)
      var segs = 14, tx = bx, ty = 82;
      for (var i = 0; i < segs; i++) {
        var t = i / segs;
        var nx = bx + lean * t * t + Math.sin(t * 3) * 2;
        var ny = 82 - i * 4;
        px(ctx, nx - 2, ny - 4, 5, 5, "#7a5433");
        px(ctx, nx - 2, ny - 4, 1, 5, "#573a21");
        px(ctx, nx + 3, ny - 4, 1, 5, "#8f653e");
        if (i % 2 === 0) px(ctx, nx - 2, ny - 4, 5, 1, "#5e4026");
        tx = nx; ty = ny - 4;
      }
      // coconut cluster
      px(ctx, tx + 1, ty + 2, 3, 3, "#5a3c22");
      px(ctx, tx - 3, ty + 3, 3, 3, "#6d4926");
      // fronds around the crown
      var cx = tx, cy = ty - 1;
      var dirs = [[-1, -0.35], [-0.7, -0.75], [0, -1], [0.7, -0.75], [1, -0.35], [0.9, 0.25], [-0.9, 0.25]];
      for (var d = 0; d < dirs.length; d++) {
        var dx = dirs[d][0], dy = dirs[d][1];
        var len = 16 + rng() * 8;
        var ex = cx + dx * len, ey = cy + dy * len + 4;
        var midx = cx + dx * len * 0.55, midy = cy + dy * len * 0.4 - 4;
        // frond = thick line + jagged leaflets
        ART.thickLine(ctx, cx, cy, midx, midy, 3, "#2e7d4f");
        ART.thickLine(ctx, midx, midy, ex, ey, 2, "#2e7d4f");
        // leaflet sawteeth
        var steps = 10;
        for (var s = 0; s < steps; s++) {
          var tt = s / steps;
          var lx = FG.lerp(cx, ex, tt), ly = FG.lerp(cy, ey, tt) - Math.sin(tt * Math.PI) * 5;
          var shade = (s % 2 === 0) ? "#38995f" : "#246343";
          px(ctx, lx - 1, ly - 3, 3, 2, shade);
          if (tt > 0.25) px(ctx, lx - 1, ly + 1, 3, 2, shade);
        }
        px(ctx, ex - 1, ey - 1, 2, 2, "#1e5236");
      }
      return { c: c, tipX: tx, tipY: ty };
    });
  };

  // ---------------- shop hut / dockside cabin ----------------
  E.hut = function () {
    return ART.get("hut", function () {
      var c = FG.makeCanvas(96, 78), ctx = c.getContext("2d");
      var rng = FG.rng(7);
      // walls
      px(ctx, 8, 30, 80, 44, "#a8763f");
      px(ctx, 8, 30, 80, 1, "#c99553");
      for (var i = 0; i < 6; i++) px(ctx, 8, 36 + i * 7, 80, 1, "#8a5c2e");
      px(ctx, 8, 73, 80, 1, "#6e4620");
      // roof (stepped shingles)
      var roofW = [96, 88, 80, 72, 64, 56], rx = [0, 4, 8, 12, 16, 20], ry = [26, 20, 14, 8, 3, 0];
      var rc = ["#8f3a2c", "#a34534", "#b9513c", "#a34534", "#8f3a2c", "#7a2f23"];
      for (i = 0; i < roofW.length; i++) {
        px(ctx, rx[i], ry[i], roofW[i], 7, rc[i]);
        px(ctx, rx[i], ry[i], roofW[i], 1, FG.shadeHex(rc[i], 0.18));
      }
      // palm-leaf fringe under roof
      for (i = 0; i < 24; i++) px(ctx, 8 + i * 3.3, 30 + (i % 2), 2, 2, "#2e7d4f");
      // door
      px(ctx, 38, 44, 18, 30, "#5e3b1e");
      px(ctx, 38, 44, 18, 1, "#3d2510");
      px(ctx, 38, 44, 1, 30, "#3d2510");
      px(ctx, 40, 47, 6, 10, "#7a5228"); px(ctx, 40, 59, 6, 12, "#7a5228");
      px(ctx, 52, 58, 2, 2, "#e8c56a"); // knob
      // window with awning
      px(ctx, 62, 46, 16, 14, "#26364d");
      px(ctx, 63, 47, 14, 12, "#3c566f");
      px(ctx, 63, 52, 14, 1, "#26364d"); px(ctx, 70, 47, 1, 12, "#26364d");
      px(ctx, 62, 44, 18, 3, "#c94f3a"); px(ctx, 62, 47, 18, 1, "#8f2f24");
      // sign hanging from roof: fish pictogram
      px(ctx, 16, 22, 1, 8, "#6e4620"); px(ctx, 28, 22, 1, 8, "#6e4620");
      px(ctx, 12, 30, 22, 10, "#c9a05a"); opx(ctx, 12, 30, 22, 1); opx(ctx, 12, 39, 22, 1);
      opx(ctx, 12, 30, 1, 10); opx(ctx, 33, 30, 1, 10);
      // mini fish glyph on the sign
      px(ctx, 17, 34, 7, 3, "#3c566f"); px(ctx, 24, 33, 3, 5, "#3c566f");
      px(ctx, 19, 35, 1, 1, "#fff");
      // lantern beside door
      px(ctx, 34, 40, 4, 6, "#2c2620"); px(ctx, 35, 41, 2, 3, "#ffd97a");
      // flower pots
      px(ctx, 10, 66, 8, 7, "#9c5a33"); px(ctx, 9, 65, 10, 2, "#7c4526");
      px(ctx, 12, 62, 2, 3, "#38995f"); px(ctx, 15, 61, 2, 4, "#38995f");
      px(ctx, 12, 60, 2, 2, "#e86a8a"); px(ctx, 15, 59, 2, 2, "#ffd97a");
      return c;
    });
  };

  // ---------------- rocks, bushes, flowers, grass ----------------
  E.rock = function (i) {
    return ART.get("rock" + i, function () {
      var c = FG.makeCanvas(26, 18), ctx = c.getContext("2d");
      var rng = FG.rng(200 + i);
      var base = ["#5d6b78", "#66737f", "#556270"][i % 3];
      ART.poly(ctx, [[4, 17], [2, 12], [5, 7], [10, 4], [16, 5], [21, 9], [23, 15], [22, 17]], OUT);
      ART.poly(ctx, [[5, 16], [3.5, 12], [6, 8], [10.5, 5.5], [15.5, 6.5], [19.5, 10], [21, 15], [20, 16]], base);
      // facets & specks
      ART.poly(ctx, [[6, 8], [10.5, 5.5], [15.5, 6.5], [12, 10]], FG.shadeHex(base, 0.15));
      for (var s = 0; s < 8; s++) px(ctx, 4 + rng() * 17, 7 + rng() * 8, 1, 1, FG.shadeHex(base, -0.2));
      return c;
    });
  };

  E.bush = function (i) {
    return ART.get("bush" + i, function () {
      var c = FG.makeCanvas(30, 20), ctx = c.getContext("2d");
      var rng = FG.rng(300 + i);
      ART.circle(ctx, 15, 13, 9, OUT);
      ART.circle(ctx, 8, 12, 6, OUT); ART.circle(ctx, 22, 12, 6, OUT);
      ART.circle(ctx, 15, 12, 8, "#2c7448");
      ART.circle(ctx, 8, 11, 5, "#2c7448"); ART.circle(ctx, 22, 11, 5, "#2c7448");
      ART.circle(ctx, 13, 9, 4, "#3a9260");
      for (var s = 0; s < 10; s++) px(ctx, 6 + rng() * 20, 5 + rng() * 12, 1, 1, "#1f5537");
      // berries
      px(ctx, 11, 8, 2, 2, "#d84d4d"); px(ctx, 19, 12, 2, 2, "#d84d4d"); px(ctx, 15, 14, 2, 2, "#e88a3a");
      return c;
    });
  };

  E.flower = function (i) {
    return ART.get("flower" + i, function () {
      var c = FG.makeCanvas(12, 16), ctx = c.getContext("2d");
      var cols = ["#e86a8a", "#ffd97a", "#9db4f8"][i % 3];
      px(ctx, 5, 8, 2, 7, "#2c7448");
      px(ctx, 3, 11, 2, 1, "#3a9260"); px(ctx, 7, 10, 2, 1, "#3a9260");
      px(ctx, 4, 2, 4, 4, cols); px(ctx, 3, 3, 2, 2, cols); px(ctx, 7, 3, 2, 2, cols);
      px(ctx, 5, 3, 2, 2, "#fff6d8"); px(ctx, 4, 1, 4, 1, FG.shadeHex(cols, -0.25));
      return c;
    });
  };

  E.grass = function () {
    return ART.get("grass", function () {
      var c = FG.makeCanvas(14, 10), ctx = c.getContext("2d");
      var rng = FG.rng(404);
      for (var b = 0; b < 4; b++) {
        var x = 1 + b * 3, h = 4 + Math.floor(rng() * 4);
        for (var y = 0; y < h; y++) px(ctx, x + (y > 2 ? 1 : 0), 9 - y, 1, 1, y < 2 ? "#3a9260" : "#2c7448");
      }
      return c;
    });
  };

  // ---------------- clouds (3 puffs, parallax-ready) ----------------
  E.cloud = function (i) {
    return ART.get("cloud" + i, function () {
      var w = [54, 72, 40][i % 3], c = FG.makeCanvas(w, 20), ctx = c.getContext("2d");
      var cx = w / 2;
      var puffs = [[cx, 10, w * 0.28], [cx - w * 0.22, 12, w * 0.18], [cx + w * 0.22, 12, w * 0.17]];
      for (var p = 0; p < puffs.length; p++) ART.circle(ctx, puffs[p][0], puffs[p][1], puffs[p][2], "#eef4fa");
      for (p = 0; p < puffs.length; p++) ART.circle(ctx, puffs[p][0] - 1, puffs[p][1] + 2, puffs[p][2] - 1, "#d8e4ee");
      for (p = 0; p < puffs.length; p++) ART.circle(ctx, puffs[p][0] - 2, puffs[p][1] - 2, puffs[p][2] - 3, "#ffffff");
      return c;
    });
  };

  // ---------------- dock props ----------------
  E.lamp = function () {
    return ART.get("lamp", function () {
      var c = FG.makeCanvas(14, 46), ctx = c.getContext("2d");
      px(ctx, 5, 8, 4, 38, "#5e4026"); px(ctx, 5, 8, 1, 38, "#3d2510");
      px(ctx, 2, 4, 10, 2, "#3d2510");           // cap
      px(ctx, 3, 6, 8, 6, "#2c2620");            // lantern body
      px(ctx, 4, 7, 6, 4, "#ffd97a");
      px(ctx, 5, 7, 2, 4, "#fff2c8");
      px(ctx, 4, 46 - 3, 6, 1, "#3d2510");
      return c;
    });
  };

  E.crate = function () {
    return ART.get("crate", function () {
      var c = FG.makeCanvas(20, 18), ctx = c.getContext("2d");
      px(ctx, 1, 1, 18, 16, "#a8763f");
      px(ctx, 1, 1, 18, 2, "#c99553");
      px(ctx, 1, 8, 18, 2, "#8a5c2e"); px(ctx, 1, 15, 18, 2, "#8a5c2e");
      opx(ctx, 1, 1, 18, 1); opx(ctx, 1, 16, 18, 1); opx(ctx, 1, 1, 1, 16); opx(ctx, 18, 1, 1, 16);
      px(ctx, 2, 2, 3, 14, "#8a5c2e"); px(ctx, 16, 2, 3, 14, "#7c5228");
      return c;
    });
  };

  E.barrel = function () {
    return ART.get("barrel", function () {
      var c = FG.makeCanvas(16, 20), ctx = c.getContext("2d");
      px(ctx, 2, 2, 12, 17, "#8a5c2e");
      px(ctx, 4, 0, 8, 2, "#b98a4e");            // lid
      px(ctx, 1, 5, 14, 2, "#5e4026"); px(ctx, 1, 14, 14, 2, "#5e4026"); // hoops
      px(ctx, 3, 2, 2, 17, "#6e4620"); px(ctx, 11, 2, 2, 17, "#9c6a33");
      return c;
    });
  };

  E.boat = function () {
    return ART.get("boat", function () {
      var c = FG.makeCanvas(72, 30), ctx = c.getContext("2d");
      // hull
      ART.poly(ctx, [[4, 10], [62, 10], [56, 26], [14, 26], [4, 18]], OUT);
      ART.poly(ctx, [[6, 12], [60, 12], [54.5, 24], [15.5, 24], [7, 17.5]], "#8a5c2e");
      ART.poly(ctx, [[6, 12], [60, 12], [59, 15], [7, 16]], "#b98a4e");
      px(ctx, 10, 16, 44, 1, "#6e4620"); px(ctx, 12, 20, 40, 1, "#6e4620");
      // mast stub + folded sail
      px(ctx, 34, 2, 3, 10, "#5e4026");
      px(ctx, 28, 9, 16, 3, "#e8dcc0"); px(ctx, 28, 12, 16, 1, "#c9bd9d");
      // net pile
      px(ctx, 48, 8, 8, 4, "#9aa8b5"); px(ctx, 48, 8, 8, 1, "#c2ced9");
      return c;
    });
  };

  // ---------------- bobber ----------------
  E.bobber = function () {
    return ART.get("bobber", function () {
      var c = FG.makeCanvas(10, 14), ctx = c.getContext("2d");
      px(ctx, 4, 0, 2, 3, "#141b26");           // antenna
      px(ctx, 4, 1, 2, 2, "#e8423f");
      px(ctx, 2, 3, 6, 4, "#e8423f");           // red top
      px(ctx, 2, 7, 6, 4, "#f2eee4");           // white bottom
      px(ctx, 2, 11, 6, 1, "#141b26");
      px(ctx, 4, 12, 2, 2, "#141b26");          // stem
      px(ctx, 3, 4, 1, 2, "#ff8a80"); px(ctx, 3, 8, 1, 2, "#ffffff");
      return c;
    });
  };

  // splash ring frames
  E.splash = function (frame) {
    return ART.get("splash" + frame, function () {
      var c = FG.makeCanvas(26, 14), ctx = c.getContext("2d");
      var r = 4 + frame * 3, t = frame / 3;
      var col = FG.mix("#eaf6ff", "#a9cde4", t);
      // broken ellipse ring
      for (var a = 0; a < 14; a++) {
        var ang = a / 14 * Math.PI * 2;
        var x = 13 + Math.cos(ang) * r, y = 8 + Math.sin(ang) * r * 0.35;
        var h = Math.max(1, Math.round(3 * (1 - t) * Math.abs(Math.sin(ang * 1.7))));
        ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y) - h / 2, 1, h);
      }
      if (frame < 3) {
        ctx.fillStyle = "#ffffff";
        px(ctx, 12, 8 - 6 + frame * 2, 2, 2, "#ffffff");
        if (frame < 2) { px(ctx, 8, 8 - 4 + frame * 2, 1, 1, "#eaf6ff"); px(ctx, 18, 8 - 3 + frame, 1, 1, "#eaf6ff"); }
      }
      return c;
    });
  };

  // sparkle (achievement / shiny)
  E.sparkle = function (frame) {
    return ART.get("sparkle" + frame, function () {
      var c = FG.makeCanvas(10, 10), ctx = c.getContext("2d");
      var s = frame === 0 ? 1 : frame === 1 ? 3 : 4;
      var col = frame === 2 ? "#fff6d8" : "#ffd97a";
      px(ctx, 4, 5 - s, 2, s * 2, col); px(ctx, 5 - s, 4, s * 2, 2, col);
      if (s > 1) { px(ctx, 3, 5 - 1, 4, 2, "#fff"); }
      return c;
    });
  };

  // ---------------- UI icons (16x16) ----------------
  var ICONS = {};     // builders
  var ICONCACHE = {}; // built canvases
  E.icon = function (name) {
    if (ICONCACHE[name]) return ICONCACHE[name];
    if (!ICONS[name]) return null;
    var c = ART.sprite(16, 16, function (ctx) { ICONS[name](ctx); });
    ICONCACHE[name] = c;
    return c;
  };

  ICONS.coin = function (ctx) {
    ART.circle(ctx, 8, 8, 6, "#8a6a1e"); ART.circle(ctx, 8, 8, 5, "#e8b71f");
    ART.circle(ctx, 7, 7, 3, "#ffd94a");
    px(ctx, 7, 4, 2, 8, "#8a6a1e"); px(ctx, 4, 7, 8, 2, "#8a6a1e");
    px(ctx, 6, 4, 1, 8, "#c9951a"); px(ctx, 4, 6, 8, 1, "#c9951a");
  };
  ICONS.rod = function (ctx) {
    ART.thickLine(ctx, 3, 13, 13, 3, 2, "#9a6a3a");
    ART.thickLine(ctx, 3, 13, 13, 3, 1, "#c99553");
    px(ctx, 2, 12, 3, 3, "#2a2119");
    px(ctx, 12, 2, 2, 2, "#141b26");
    px(ctx, 13, 4, 1, 4, "#c2ced9"); px(ctx, 12, 8, 1, 1, "#e8423f");
  };
  ICONS.reel = function (ctx) {
    ART.circle(ctx, 8, 8, 5, "#5e666e"); ART.circle(ctx, 8, 8, 4, "#aab2ba");
    ART.circle(ctx, 8, 8, 2, "#5e666e");
    px(ctx, 12, 4, 3, 2, "#aab2ba"); px(ctx, 14, 3, 2, 1, "#5e666e");
  };
  ICONS.line = function (ctx) {
    ART.bezier(ctx, 2, 3, 8, 10, 14, 6, "#c2ced9");
    px(ctx, 13, 6, 2, 4, "#aab2ba"); px(ctx, 14, 9, 2, 1, "#5e666e");
  };
  ICONS.bait = function (ctx) {
    px(ctx, 4, 5, 8, 10, "#7c5228"); px(ctx, 3, 4, 10, 2, "#b98a4e"); px(ctx, 3, 14, 10, 1, "#6e4620");
    px(ctx, 6, 7, 1, 5, "#e86a8a"); px(ctx, 7, 8, 1, 4, "#d84d6d");
  };
  ICONS.fish = function (ctx) {
    ART.ellipse(ctx, 7, 8, 5, 3, "#3b9dff");
    px(ctx, 12, 6, 2, 5, "#3b9dff"); px(ctx, 13, 5, 1, 1, "#3b9dff"); px(ctx, 13, 10, 1, 1, "#3b9dff");
    px(ctx, 6, 7, 1, 1, "#fff"); px(ctx, 5, 6, 4, 1, "#8fb8ff");
  };
  ICONS.trophy = function (ctx) {
    px(ctx, 4, 2, 8, 5, "#e8b71f"); px(ctx, 3, 1, 10, 1, "#c9951a");
    px(ctx, 3, 3, 1, 3, "#c9951a"); px(ctx, 12, 3, 1, 3, "#c9951a");
    px(ctx, 6, 7, 4, 3, "#c9951a"); px(ctx, 4, 10, 8, 1, "#8a6a1e");
    px(ctx, 3, 11, 10, 2, "#8a6a1e"); px(ctx, 6, 3, 2, 2, "#ffd94a");
  };
  ICONS.vase = function (ctx) {
    px(ctx, 6, 2, 4, 2, "#c2ced9"); px(ctx, 5, 4, 6, 6, "#a9cde4"); px(ctx, 4, 9, 8, 3, "#7fb3cc"); px(ctx, 5, 12, 6, 1, "#5f8aa3");
    px(ctx, 6, 1, 2, 1, "#38995f"); px(ctx, 8, 0, 2, 2, "#e86a8a");
  };
  ICONS.star = function (ctx) {
    px(ctx, 7, 1, 2, 14, "#ffd94a"); px(ctx, 1, 7, 14, 2, "#ffd94a");
    px(ctx, 3, 3, 2, 2, "#ffd94a"); px(ctx, 11, 3, 2, 2, "#ffd94a");
    px(ctx, 3, 11, 2, 2, "#ffd94a"); px(ctx, 11, 11, 2, 2, "#ffd94a");
    px(ctx, 7, 7, 2, 2, "#fff");
  };
  ICONS.lock = function (ctx) {
    px(ctx, 5, 6, 6, 1, "#aab2ba"); px(ctx, 4, 7, 1, 3, "#aab2ba"); px(ctx, 11, 7, 1, 3, "#aab2ba");
    px(ctx, 3, 9, 10, 7, "#8a949c"); px(ctx, 4, 10, 8, 5, "#c2ced9");
    px(ctx, 7, 11, 2, 3, "#5e666e");
  };
  ICONS.sun = function (ctx) {
    ART.circle(ctx, 8, 8, 4, "#ffd94a"); ART.circle(ctx, 7, 7, 2, "#fff6d8");
    px(ctx, 7, 1, 2, 2, "#ffd94a"); px(ctx, 7, 13, 2, 2, "#ffd94a");
    px(ctx, 1, 7, 2, 2, "#ffd94a"); px(ctx, 13, 7, 2, 2, "#ffd94a");
  };
  ICONS.moon = function (ctx) {
    ART.circle(ctx, 8, 8, 5, "#eef4fa"); ART.circle(ctx, 10, 6, 4, "#1c2438");
    px(ctx, 6, 5, 2, 2, "#c9d5e2");
  };
  ICONS.rain = function (ctx) {
    px(ctx, 3, 3, 10, 5, "#8a949c"); px(ctx, 4, 4, 8, 3, "#c2ced9");
    px(ctx, 4, 10, 1, 3, "#8fb8ff"); px(ctx, 8, 10, 1, 4, "#8fb8ff"); px(ctx, 12, 11, 1, 3, "#8fb8ff");
  };
  ICONS.bolt = function (ctx) {
    px(ctx, 8, 1, 4, 4, "#ffd94a"); px(ctx, 6, 5, 4, 3, "#ffd94a");
    px(ctx, 9, 5, 2, 3, "#fff6d8"); px(ctx, 4, 8, 6, 3, "#e8b71f"); px(ctx, 8, 11, 2, 4, "#e8b71f");
  };
  ICONS.journal = function (ctx) {
    px(ctx, 3, 2, 10, 12, "#c9a05a"); px(ctx, 3, 2, 2, 12, "#8a5c2e");
    px(ctx, 12, 3, 1, 10, "#8a5c2e");
    px(ctx, 6, 4, 5, 1, "#5e4026"); px(ctx, 6, 6, 6, 1, "#5e4026"); px(ctx, 6, 8, 4, 1, "#5e4026");
    px(ctx, 5, 10, 8, 1, "#c94f3a");
  };
  ICONS.shirt = function (ctx) { // profile
    px(ctx, 3, 4, 10, 8, "#c94f3a"); px(ctx, 1, 4, 3, 4, "#c94f3a"); px(ctx, 12, 4, 3, 4, "#c94f3a");
    px(ctx, 6, 2, 4, 3, "#c94f3a"); px(ctx, 5, 2, 2, 2, "#f2e2b8"); px(ctx, 9, 2, 2, 2, "#f2e2b8");
    px(ctx, 3, 4, 10, 1, "#8f2f24");
  };
  ICONS.gear = function (ctx) { // settings
    ART.circle(ctx, 8, 8, 5, "#8a949c"); ART.circle(ctx, 8, 8, 3, "#c2ced9");
    ART.circle(ctx, 8, 8, 1, "#5e666e");
    px(ctx, 7, 0, 2, 2, "#8a949c"); px(ctx, 7, 14, 2, 2, "#8a949c");
    px(ctx, 0, 7, 2, 2, "#8a949c"); px(ctx, 14, 7, 2, 2, "#8a949c");
  };
  ICONS.ach = function (ctx) { // ribbon badge
    px(ctx, 6, 1, 4, 3, "#e8423f"); px(ctx, 4, 3, 8, 8, "#e8b71f");
    px(ctx, 5, 4, 6, 6, "#ffd94a"); px(ctx, 7, 6, 2, 2, "#fff");
    px(ctx, 5, 11, 2, 4, "#c94f3a"); px(ctx, 9, 11, 2, 4, "#c94f3a");
  };
  ICONS.cloud = function (ctx) {
    ART.circle(ctx, 6, 9, 4, "#aab2ba"); ART.circle(ctx, 11, 9, 4, "#aab2ba");
    ART.circle(ctx, 8, 7, 4, "#c2ced9"); ART.circle(ctx, 6, 8, 2, "#e2ecf4");
  };
  ICONS.hourglass = function (ctx) {
    px(ctx, 3, 2, 10, 1, "#8a6a1e"); px(ctx, 3, 13, 10, 1, "#8a6a1e");
    px(ctx, 5, 3, 6, 1, "#c2ced9"); px(ctx, 6, 4, 4, 1, "#c2ced9"); px(ctx, 7, 5, 2, 1, "#c2ced9");
    px(ctx, 7, 7, 2, 3, "#e8b71f"); px(ctx, 5, 10, 6, 3, "#e8b71f");
    ART.thickLine(ctx, 5, 3, 8, 8, 1, "#8a6a1e"); ART.thickLine(ctx, 11, 3, 8, 8, 1, "#8a6a1e");
  };
  ICONS.book = ICONS.journal;
  ICONS.rain = ICONS.rain;

  // sun & moon discs for the sky
  E.sun = function () {
    return ART.get("sun", function () {
      var c = FG.makeCanvas(40, 40), ctx = c.getContext("2d");
      ART.circle(ctx, 20, 20, 10, "#ffe48a");
      ART.circle(ctx, 20, 20, 8, "#fff6d8");
      ART.glow(ctx, 20, 20, 18, "#ffd94a", 0.5, 7);
      return c;
    });
  };
  E.moon = function () {
    return ART.get("moon", function () {
      var c = FG.makeCanvas(32, 32), ctx = c.getContext("2d");
      ART.circle(ctx, 16, 16, 8, "#eef4fa");
      ART.circle(ctx, 13, 13, 2, "#c9d5e2"); ART.circle(ctx, 19, 18, 1.5, "#c9d5e2");
      ART.glow(ctx, 16, 16, 15, "#bcd4f0", 0.35, 6);
      return c;
    });
  };

  // distant island strip (background layer tile)
  E.islandStrip = function () {
    return ART.get("islands", function () {
      var c = FG.makeCanvas(FG.W, 40), ctx = c.getContext("2d");
      var rng = FG.rng(911);
      var x = -10;
      while (x < FG.W) {
        var w = 50 + rng() * 90, h = 8 + rng() * 20;
        var pts = [[x, 40]];
        var steps = 6;
        for (var i = 0; i <= steps; i++) {
          var t = i / steps;
          pts.push([x + w * t, 40 - h * Math.sin(t * Math.PI) * (0.7 + rng() * 0.3)]);
        }
        pts.push([x + w, 40]);
        ART.poly(ctx, pts, "#3d5a6e");
        ART.poly(ctx, pts.map(function (p) { return [p[0] + 6, p[1] + 4]; }), "#3d5a6e");
        // palms silhouette on big ones
        if (h > 18) {
          var px2 = x + w * 0.5;
          px(ctx, px2, 40 - h - 4, 1, 5, "#2c4657");
          px(ctx, px2 - 3, 40 - h - 6, 7, 1, "#2c4657");
        }
        x += w + 6 + rng() * 30;
      }
      return c;
    });
  };
})();
