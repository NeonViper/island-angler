// ============================================================
// util.js — shared helpers, RNG, formatting. Namespace: FG
// ============================================================
window.FG = window.FG || {};

FG.W = 640;   // logical width  (art pixels)
FG.H = 360;   // logical height
FG.HORIZON = 118;  // water line
FG.DOCK_TIP_Y = 196; // fisherman feet stand here

FG.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
FG.lerp = function (a, b, t) { return a + (b - a) * t; };
FG.smo01 = function (t) { t = FG.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
FG.easeOut = function (t) { return 1 - Math.pow(1 - FG.clamp(t, 0, 1), 3); };
FG.easeIn = function (t) { return t * t; };

// seeded RNG (mulberry32) for deterministic art generation
FG.rng = function (seed) {
  var s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

FG.rand = function (a, b) { return a + Math.random() * (b - a); };
FG.randInt = function (a, b) { return Math.floor(FG.rand(a, b + 1)); };
FG.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

// weighted pick: items=[{w:...}]
FG.pickWeighted = function (items) {
  var total = 0, i;
  for (i = 0; i < items.length; i++) total += items[i].w;
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];
  var r = Math.random() * total;
  for (i = 0; i < items.length; i++) {
    r -= items[i].w;
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};

FG.fmtInt = function (n) {
  n = Math.round(n);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
FG.fmtKg = function (kg) {
  if (kg >= 10) return kg.toFixed(1) + " KG";
  if (kg >= 1) return kg.toFixed(2) + " KG";
  return Math.round(kg * 1000) + " G";
};
FG.fmtCm = function (cm) {
  if (cm >= 100) return (cm / 100).toFixed(2) + " M";
  return cm.toFixed(1) + " CM";
};

// color helpers --------------------------------------------------
FG.hexToRgb = function (hex) {
  var h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
};
FG.rgb = function (r, g, b, a) {
  if (a === undefined) a = 1;
  return "rgba(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + "," + a + ")";
};
FG.mix = function (c1, c2, t) {
  var a = typeof c1 === "string" ? FG.hexToRgb(c1) : c1;
  var b = typeof c2 === "string" ? FG.hexToRgb(c2) : c2;
  return { r: FG.lerp(a.r, b.r, t), g: FG.lerp(a.g, b.g, t), b: FG.lerp(a.b, b.b, t) };
};
FG.shade = function (hex, f) { // f<0 darken, f>0 lighten toward white/black
  var c = typeof hex === "string" ? FG.hexToRgb(hex) : hex;
  var r, g, b;
  if (f < 0) { f = 1 + f; r = c.r * f; g = c.g * f; b = c.b * f; }
  else { r = c.r + (255 - c.r) * f * 0.85; g = c.g + (255 - c.g) * f * 0.85; b = c.b + (255 - c.b) * f * 0.85; }
  return FG.rgb(r, g, b);
};
FG.shadeHex = function (hex, f) {
  var c = typeof hex === "string" ? FG.hexToRgb(hex) : hex;
  var r, g, b;
  if (f < 0) { f = 1 + f; r = c.r * f; g = c.g * f; b = c.b * f; }
  else { r = c.r + (255 - c.r) * f * 0.85; g = c.g + (255 - c.g) * f * 0.85; b = c.b + (255 - c.b) * f * 0.85; }
  var to = function (v) { var s = Math.round(FG.clamp(v, 0, 255)).toString(16); return s.length === 1 ? "0" + s : s; };
  return "#" + to(r) + to(g) + to(b);
};

// canvas helpers --------------------------------------------------
FG.makeCanvas = function (w, h) {
  var c = document.createElement("canvas");
  c.width = w; c.height = h;
  var ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return c;
};

// draw a 1px-thick rect outline made of art pixels
FG.rectOutline = function (ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
};

// rounded-ish pixel frame helper (corners notched out by n px)
FG.notchRect = function (ctx, x, y, w, h, n, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x + n, y, w - n * 2, h);
  ctx.fillRect(x, y + n, w, h - n * 2);
};

FG.timeOfDayName = function (phase) {
  if (phase < 0.10) return "DAWN";
  if (phase < 0.42) return "DAY";
  if (phase < 0.52) return "SUNSET";
  if (phase < 0.95) return "NIGHT";
  return "DAWN";
};

// circle distance
FG.dist = function (x1, y1, x2, y2) { var dx = x1 - x2, dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); };
