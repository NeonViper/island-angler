// ============================================================
// art.js — pixel-art drawing primitives used by every sprite
// generator (fish, character, environment, icons).
// ============================================================

var ART = FG.art = {};

ART.cache = {};

ART.get = function (key, builder) {
  if (ART.cache[key]) return ART.cache[key];
  var c = builder();
  ART.cache[key] = c;
  return c;
};

// pixel circle (integer coords)
ART.circle = function (ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (var y = -r; y <= r; y++) {
    var w = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
};

ART.ellipse = function (ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  ry = Math.max(ry, 1); rx = Math.max(rx, 0.5);
  for (var y = -ry; y <= ry; y++) {
    var t = y / ry;
    var w = rx * Math.sqrt(Math.max(0, 1 - t * t));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), Math.max(1, Math.round(w * 2)), 1);
  }
};

// scanline polygon fill, points: [[x,y],...]
ART.poly = function (ctx, pts, color) {
  if (pts.length < 3) return;
  var minY = 1e9, maxY = -1e9, i;
  for (i = 0; i < pts.length; i++) {
    if (pts[i][1] < minY) minY = pts[i][1];
    if (pts[i][1] > maxY) maxY = pts[i][1];
  }
  ctx.fillStyle = color;
  for (var y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    var xs = [];
    for (i = 0; i < pts.length; i++) {
      var p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      if ((p1[1] <= y && p2[1] > y) || (p2[1] <= y && p1[1] > y)) {
        var t = (y - p1[1]) / (p2[1] - p1[1]);
        xs.push(p1[0] + t * (p2[0] - p1[0]));
      }
    }
    xs.sort(function (a, b) { return a - b; });
    for (var k = 0; k + 1 < xs.length; k += 2) {
      var x0 = Math.round(xs[k]), x1 = Math.round(xs[k + 1]);
      if (x1 >= x0) ctx.fillRect(x0, y, x1 - x0 + 1, 1);
    }
  }
};

ART.line = function (ctx, x0, y0, x1, y1, color) {
  ctx.fillStyle = color;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  var err = dx - dy, x = x0, y = y0;
  while (true) {
    ctx.fillRect(x, y, 1, 1);
    if (x === x1 && y === y1) break;
    var e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
};

ART.thickLine = function (ctx, x0, y0, x1, y1, w, color) {
  var steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  steps = Math.max(steps, 1);
  ctx.fillStyle = color;
  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    ctx.fillRect(Math.round(FG.lerp(x0, x1, t)), Math.round(FG.lerp(y0, y1, t)), w, w);
  }
};

// quadratic bezier pixel line
ART.bezier = function (ctx, x0, y0, cx, cy, x1, y1, color) {
  var n = Math.max(4, Math.round(FG.dist(x0, y0, x1, y1)));
  var px = x0, py = y0;
  for (var i = 1; i <= n; i++) {
    var t = i / n, mt = 1 - t;
    var x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    var y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    ART.line(ctx, px, py, Math.round(x), Math.round(y), color);
    px = Math.round(x); py = Math.round(y);
  }
};

// Draw shape twice: outline color drawn at 4 offset positions, then fill on top.
// Gives a clean 1px pixel outline around any fill-based shape.
ART.outlined = function (ctx, outlineColor, drawFn) {
  var offs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];
  for (var i = 0; i < offs.length; i++) {
    ctx.save();
    ctx.translate(offs[i][0], offs[i][1]);
    drawFn(outlineColor);
    ctx.restore();
  }
  drawFn(null); // null => use normal palette
};

// Build a sprite canvas and run fn with smoothing off
ART.sprite = function (w, h, fn) {
  var c = FG.makeCanvas(w, h);
  fn(c.getContext("2d"), w, h);
  return c;
};

// deterministic dither sprinkle inside rect
ART.dither = function (ctx, x, y, w, h, rng, color, density) {
  ctx.fillStyle = color;
  for (var yy = y; yy < y + h; yy++) {
    for (var xx = x; xx < x + w; xx++) {
      if (rng() < density) ctx.fillRect(xx, yy, 1, 1);
    }
  }
};

// 1-px dashed checker line (for plank seams etc.)
ART.checkerRow = function (ctx, x, y, w, c1, c2, rng) {
  ctx.fillStyle = c1;
  for (var i = 0; i < w; i++) {
    if (i % 2 === 0) ctx.fillRect(x + i, y, 1, 1);
  }
};

// gradient vertical band (stepped colors for pixel look)
ART.vgrad = function (ctx, x, y, w, h, cTop, cBottom, steps) {
  steps = steps || 12;
  for (var i = 0; i < steps; i++) {
    var t = i / (steps - 1);
    var col = FG.mix(cTop, cBottom, t);
    ctx.fillStyle = FG.rgb(col.r, col.g, col.b);
    var yy = y + Math.round(i * h / steps);
    var hh = Math.round((i + 1) * h / steps) - Math.round(i * h / steps);
    ctx.fillRect(x, yy, w, hh);
  }
};

// soft radial glow (pixel style: concentric circles with decreasing alpha)
ART.glow = function (ctx, cx, cy, r, colorHex, alpha, rings) {
  rings = rings || 6;
  var c = FG.hexToRgb(colorHex);
  for (var i = rings; i >= 1; i--) {
    var t = i / rings;
    var a = alpha * Math.pow(t, 1.6);
    ctx.fillStyle = FG.rgb(c.r, c.g, c.b, a * (1 / rings));
    ART.circle(ctx, cx, cy, Math.round(r * t), FG.rgb(c.r, c.g, c.b, a * 0.55 / rings));
  }
};
