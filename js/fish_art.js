// ============================================================
// fish_art.js — original pixel-art fish renderer part 1:
// shared body engine + COMMON & UNCOMMON species.
// Each art fn draws facing LEFT into its own small canvas.
// P(color) resolves through a palette; sil mode = solid shadow.
// ============================================================

FG.fishArt = {};       // art key -> fn(ctx, t, P, W, H)
FG.fishArtSize = {};   // art key -> [w, h]

(function () {
  var A = FG.fishArt, S = FG.fishArtSize;
  var TAU = Math.PI * 2;

  // ---------- palette (callable: P("mid") resolves a color) ----------
  function makePal(map, sil) {
    var P = function (c) {
      if (sil) return "#0a1520";
      var v = map[c];
      return v === undefined ? c : v;
    };
    P.map = map; P.sil = !!sil;
    P.get = P;
    return P;
  }
  FG.makePal = makePal;

  // ---------- profile interpolation ----------
  // prof: [[t, topF, botF], ...]  t 0=nose, 1=tailbase
  function profAt(prof, t) {
    var i;
    if (t <= prof[0][0]) return [prof[0][1], prof[0][2]];
    if (t >= prof[prof.length - 1][0]) return [prof[prof.length - 1][1], prof[prof.length - 1][2]];
    for (i = 1; i < prof.length; i++) {
      if (prof[i][0] >= t) {
        var a = prof[i - 1], b = prof[i];
        var k = (t - a[0]) / (b[0] - a[0]);
        return [FG.lerp(a[1], b[1], k), FG.lerp(a[2], b[2], k)];
      }
    }
    return [prof[0][1], prof[0][2]];
  }

  // Fill a body whose profile is given. Returns {top:[], bot:[]} arrays by x.
  // faceX = nose x, len = body length px, cy = midline
  function fillBody(ctx, faceX, len, cy, H, prof, P, forceColor) {
    var top = [], bot = [], x, i;
    for (x = 0; x < len; x++) {
      var t = len <= 1 ? 0 : x / (len - 1);
      var p = profAt(prof, t);
      top[x] = Math.round(cy - p[0] * H);
      bot[x] = Math.round(cy + p[1] * H);
      if (bot[x] < top[x]) bot[x] = top[x];
    }
    // outline pass
    var out = forceColor || P("out");
    var offs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var oi = 0; oi < offs.length; oi++) {
      ctx.save(); ctx.translate(offs[oi][0], offs[oi][1]);
      ctx.fillStyle = out;
      for (x = 0; x < len; x++) ctx.fillRect(faceX + x, top[x], 1, bot[x] - top[x] + 1);
      ctx.restore();
    }
    // fill: main rows
    for (x = 0; x < len; x++) {
      if (forceColor) {
        ctx.fillStyle = forceColor;
        ctx.fillRect(faceX + x, top[x], 1, bot[x] - top[x] + 1);
      } else {
        // vertical shade: dark top -> mid -> belly
        var h = bot[x] - top[x];
        if (h <= 1) {
          ctx.fillStyle = P("mid");
          ctx.fillRect(faceX + x, top[x], 1, 1);
        } else {
          ctx.fillStyle = P("dark");
          ctx.fillRect(faceX + x, top[x], 1, Math.max(1, Math.floor(h * 0.25)));
          ctx.fillStyle = P("mid");
          var midH = Math.max(1, h - Math.floor(h * 0.25) - Math.max(1, Math.floor(h * 0.22)));
          ctx.fillRect(faceX + x, top[x] + Math.floor(h * 0.25), 1, midH);
          ctx.fillStyle = P("belly");
          ctx.fillRect(faceX + x, bot[x] - Math.max(1, Math.floor(h * 0.22)), 1, Math.max(1, Math.floor(h * 0.22)));
        }
      }
    }
    return { top: top, bot: bot };
  }

  // column helper: fill a full body column at x between top/bot with color
  function colFill(ctx, x, top, bot, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, top, 1, bot - top + 1);
  }

  // outlined polygon with fin fill
  function polyFin(ctx, pts, P, force) {
    var out = force || P("finEdge");
    var offs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var oi = 0; oi < offs.length; oi++) {
      ctx.save(); ctx.translate(offs[oi][0], offs[oi][1]);
      ART.poly(ctx, pts, out);
      ctx.restore();
    }
    if (force) ART.poly(ctx, pts, force);
    else ART.poly(ctx, pts, P("fin"));
  }

  // small pectoral fin (side view): triangle-ish, gentle flap by phase
  function pectoral(ctx, x, y, w, h, P, phase, force) {
    var f = Math.sin(phase * TAU) * (h * 0.25);
    var pts = [[x, y], [x + w, y + h + f], [x + w * 0.35, y + h * 0.65 + f]];
    polyFin(ctx, pts, P, force);
  }

  // eye at (x,y), r size
  function eye(ctx, x, y, r, P) {
    ART.circle(ctx, x, y, r, P("#ffffff"));
    ctx.fillStyle = P("#10141c");
    ctx.fillRect(x, y, 1, 1);
    if (r > 1) {
      ctx.fillStyle = P("#10141c");
      ART.circle(ctx, x, y, 1, P("#10141c"));
    }
  }

  // simple mouth line at nose
  function mouth(ctx, x, y, len, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, len, 1);
  }

  // gill arc: short curved darker line
  function gill(ctx, x, yTop, yBot, color) {
    ctx.fillStyle = color;
    for (var i = 0; i < 3; i++) ctx.fillRect(x + Math.round(i * 0.35), yTop + i, 1, 1);
  }

  // tail shapes. baseX = tail joint x, cy mid, phase 0..1
  var tail = {};
  tail.fork = function (ctx, bx, cy, L, H, ph, P) {
    var s = Math.sin(ph * TAU) * H * 0.45;
    var tip = bx + L;
    polyFin(ctx, [
      [bx, cy - H * 0.25], [tip, cy - H - s], [bx + L * 0.45, cy - s * 0.4],
      [bx + L * 0.45, cy + s * 0.4], [tip, cy + H - s], [bx, cy + H * 0.25]
    ], P);
  };
  tail.fan = function (ctx, bx, cy, L, H, ph, P) {
    var s = Math.sin(ph * TAU) * H * 0.3;
    polyFin(ctx, [
      [bx, cy - H * 0.3], [bx + L, cy - H + s], [bx + L, cy + H + s], [bx, cy + H * 0.3]
    ], P);
  };
  tail.crescent = function (ctx, bx, cy, L, H, ph, P) {
    var s = Math.sin(ph * TAU) * H * 0.35;
    polyFin(ctx, [
      [bx, cy - H * 0.35], [bx + L, cy - H * 1.05 + s], [bx + L * 0.75, cy - H * 0.35 + s],
      [bx + L * 0.75, cy + H * 0.35 + s], [bx + L, cy + H * 1.05 + s], [bx, cy + H * 0.35]
    ], P);
  };
  tail.lunate = function (ctx, bx, cy, L, H, ph, P) {
    var s = Math.sin(ph * TAU) * H * 0.3;
    polyFin(ctx, [
      [bx, cy - H * 0.45], [bx + L, cy - H + s], [bx + L * 0.5, cy + s],
      [bx + L, cy + H + s], [bx, cy + H * 0.45]
    ], P);
  };
  tail.round = function (ctx, bx, cy, L, H, ph, P) {
    var s = Math.sin(ph * TAU) * H * 0.25;
    polyFin(ctx, [
      [bx, cy - H * 0.5], [bx + L * 0.8, cy - H * 0.85 + s], [bx + L, cy - H * 0.4 + s],
      [bx + L, cy + H * 0.4 + s], [bx + L * 0.8, cy + H * 0.85 + s], [bx, cy + H * 0.5]
    ], P);
  };
  A._tail = tail;
  A._body = fillBody;
  A._fin = polyFin;
  A._pec = pectoral;
  A._eye = eye;
  A._mouth = mouth;
  A._gill = gill;
  A._col = colFill;
  A._prof = profAt;

  function define(key, w, h, fn) {
    A[key] = fn; S[key] = [w, h];
  }

  // =============== COMMON ===============
  define("guppy", 20, 12, function (ctx, t, P, W, H) {
    var cy = 6, bx = 2, len = 10, HH = 3;
    var prof = [[0, 0.35, 0.4], [0.35, 0.95, 0.9], [0.75, 0.8, 0.75], [1, 0.28, 0.28]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    // pearl dots
    if (!P.sil) { ART.dither(ctx, bx + 1, b.top[4], len - 3, 4, FG.rng(7), "rgba(255,255,255,0.6)", 0.15); }
    // big flowing tail
    var ph = t, s = Math.sin(ph * TAU) * 2;
    polyFin(ctx, [
      [bx + len - 1, cy - 2], [bx + len + 6, cy - 5 + s], [bx + len + 5, cy - 1 + s],
      [bx + len + 6, cy + 4 + s], [bx + len + 4, cy + 5 + s], [bx + len - 1, cy + 2]
    ], P);
    // tail inner color stripe
    if (!P.sil) {
      ctx.fillStyle = P("accent");
      ctx.fillRect(bx + len + 2, cy - 3 + s, 2, 1);
      ctx.fillRect(bx + len + 2, cy + 1 + s, 2, 1);
    }
    pectoral(ctx, bx + 4, cy + 1, 3, 3, P, t * 0.7);
    if (!P.sil) eye(ctx, bx + 1, cy - 1, 1, P);
    mouth(ctx, bx, cy, 1, P("out"));
  });

  define("tetra", 17, 11, function (ctx, t, P, W, H) {
    var cy = 6, bx = 1, len = 10, HH = 3;
    var prof = [[0, 0.4, 0.45], [0.3, 1, 0.9], [0.7, 0.8, 0.7], [1, 0.2, 0.2]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    // dark top wedge + ember stripe
    if (!P.sil) {
      for (var x = 2; x < len - 2; x++) colFill(ctx, bx + x, b.top[x], b.top[x] + 1, P("dark2"));
      for (x = 3; x < len; x++) colFill(ctx, bx + x, cy, cy + 1, P("ember"));
    }
    tail.fork(ctx, bx + len - 1, cy, 6, 3, t, P);
    if (!P.sil) eye(ctx, bx + 1, cy - 1, 1, P);
    mouth(ctx, bx, cy + 1, 1, P("out"));
  });

  define("blenny", 22, 13, function (ctx, t, P, W, H) {
    var cy = 8, bx = 1, len = 15, HH = 4;
    var prof = [[0, 0.45, 0.6], [0.25, 0.95, 0.95], [0.6, 0.9, 0.85], [1, 0.3, 0.3]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    // frilled crest
    for (var i = 0; i < 7; i++) {
      var x = bx + 3 + i * 1.6;
      if (Math.round(x) >= bx + len - 1) break;
      ctx.fillStyle = P("finEdge");
      ctx.fillRect(Math.round(x), b.top[Math.round(x) - bx] - 2, 1, 2);
      ctx.fillStyle = P("fin");
      ctx.fillRect(Math.round(x), b.top[Math.round(x) - bx] - 2, 1, 1);
    }
    // mottled patches
    if (!P.sil) {
      var rng = FG.rng(21);
      for (i = 0; i < 6; i++) {
        var mx = bx + 2 + Math.floor(rng() * (len - 5));
        ctx.fillStyle = P("patch");
        ctx.fillRect(mx, cy - 1 + Math.floor(rng() * 3), 2, 1);
      }
    }
    tail.round(ctx, bx + len - 1, cy, 5, 3, t, P);
    pectoral(ctx, bx + 5, cy + 1, 4, 3, P, t * 0.6);
    if (!P.sil) eye(ctx, bx + 2, cy - 2, 2, P);
    // blunt lips
    ctx.fillStyle = P("fin");
    ctx.fillRect(bx, cy, 1, 2);
  });

  define("goby", 17, 12, function (ctx, t, P, W, H) {
    var cy = 7, bx = 1, len = 10, HH = 4;
    var prof = [[0, 0.5, 0.55], [0.25, 1, 1], [0.7, 0.8, 0.75], [1, 0.25, 0.25]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      var rng = FG.rng(31);
      for (var i = 0; i < 8; i++) {
        var x = bx + 1 + Math.floor(rng() * (len - 2));
        ctx.fillStyle = P("patch");
        ctx.fillRect(x, b.top[x - bx] + 1 + Math.floor(rng() * 4), 1, 1);
      }
    }
    // two dorsal bumps
    ctx.fillStyle = P("fin");
    ctx.fillRect(bx + 3, b.top[2] - 2, 2, 2);
    ctx.fillRect(bx + 6, b.top[5] - 2, 2, 2);
    tail.round(ctx, bx + len - 1, cy, 5, 3, t, P);
    if (!P.sil) { eye(ctx, bx + 2, cy - 2, 2, P); ART.circle(ctx, bx + 4, cy - 2, 2, P("#ffffff")); }
    // fused ventral fin (sucker look)
    if (!P.sil) ctx.fillStyle = P("accent");
    if (!P.sil) ctx.fillRect(bx + 4, cy + 3, 3, 1);
    mouth(ctx, bx, cy + 1, 1, P("out"));
  });

  define("darter", 26, 10, function (ctx, t, P, W, H) {
    var cy = 5, bx = 1, len = 18, HH = 3;
    var prof = [[0, 0.35, 0.4], [0.2, 0.9, 1], [0.7, 0.7, 0.6], [1, 0.15, 0.15]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      for (var x = 1; x < len - 1; x++) colFill(ctx, bx + x, b.top[x], b.top[x] + 1, P("dark2"));
      for (x = 2; x < len - 2; x++) colFill(ctx, bx + x, cy + 1, cy + 1, P("stripe"));
    }
    // pointed dorsal
    A._fin(ctx, [[bx + 4, b.top[3]], [bx + 7, b.top[3] - 2], [bx + 10, b.top[9]]], P);
    tail.fork(ctx, bx + len - 1, cy, 7, 4, t, P);
    pectoral(ctx, bx + 5, cy + 1, 3, 2, P, t * 0.8);
    if (!P.sil) eye(ctx, bx + 1, cy - 1, 1, P);
    ctx.fillStyle = P("out"); ctx.fillRect(bx, cy, 2, 1); // sharp jaw
  });

  define("damsel", 18, 14, function (ctx, t, P, W, H) {
    var cy = 7, bx = 1, len = 11, HH = 5;
    var prof = [[0, 0.4, 0.35], [0.3, 0.95, 0.85], [0.7, 0.85, 0.75], [1, 0.2, 0.2]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    // gold band behind head
    if (!P.sil) {
      for (var x = 2; x < 4; x++) colFill(ctx, bx + x, b.top[x], b.bot[x], P("gold"));
      colFill(ctx, bx + 2, b.top[2] - 1, b.top[2], P("gold")); // over outline
    }
    // tall dorsal
    A._fin(ctx, [[bx + 3, b.top[2]], [bx + 5, b.top[2] - 3], [bx + 8, b.top[7]]], P);
    A._fin(ctx, [[bx + 5, b.bot[4]], [bx + 7, b.bot[6] + 2], [bx + 9, b.bot[8]]], P);
    tail.fork(ctx, bx + len - 1, cy, 6, 3.5, t, P);
    pectoral(ctx, bx + 5, cy + 1, 3, 3, P, t * 0.9);
    if (!P.sil) eye(ctx, bx + 2, cy - 1, 2, P);
  });

  define("snapper", 36, 19, function (ctx, t, P, W, H) {
    var cy = 9, bx = 1, len = 24, HH = 6.5;
    var prof = [[0, 0.35, 0.3], [0.22, 0.8, 0.8], [0.5, 1, 1], [0.8, 0.85, 0.8], [1, 0.3, 0.3]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      // pale diagonal bars
      for (var i = 0; i < 4; i++) {
        var x = bx + 5 + i * 4;
        for (var k = 0; k < 4; k++) {
          if (b.bot[x - bx + k] !== undefined) {
            ctx.fillStyle = P("stripe");
            ctx.fillRect(x + k, b.top[x - bx + k] + 1, 1, 1);
          }
        }
      }
      // dark tail-base blotch
      ART.circle(ctx, bx + len - 4, cy - 1, 2, P("patch"));
    }
    // spiny dorsal: sawtooth
    A._fin(ctx, [[bx + 4, b.top[3]], [bx + 6, b.top[3] - 3], [bx + 8, b.top[7] - 4], [bx + 11, b.top[10] - 5], [bx + 15, b.top[14] - 2], [bx + 17, b.top[16]]], P);
    A._fin(ctx, [[bx + 10, b.bot[9]], [bx + 12, b.bot[11] + 2], [bx + 14, b.bot[13] + 1]], P);
    tail.fork(ctx, bx + len - 1, cy, 9, 6, t, P);
    pectoral(ctx, bx + 7, cy + 2, 4, 4, P, t * 0.7);
    if (!P.sil) eye(ctx, bx + 3, cy - 3, 2, P);
    gill(ctx, bx + 5, cy - 4, cy + 2, P("out2"));
    ctx.fillStyle = P("out"); ctx.fillRect(bx, cy + 1, 2, 1);
  });

  // =============== UNCOMMON ===============
  define("clownfish", 30, 18, function (ctx, t, P, W, H) {
    var cy = 9, bx = 1, len = 19, HH = 6;
    var prof = [[0, 0.4, 0.35], [0.3, 0.95, 0.95], [0.7, 0.9, 0.85], [1, 0.3, 0.3]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    // 3 white bands, black-edged
    if (!P.sil) {
      var bands = [[2, 4], [8, 10], [15, 17]];
      for (var bi = 0; bi < bands.length; bi++) {
        var x0 = bands[bi][0], x1 = bands[bi][1];
        for (var x = x0; x <= x1; x++) {
          ctx.fillStyle = P("#0d0d12");
          ctx.fillRect(bx + x - 1, b.top[x], 1, b.bot[x] - b.top[x] + 1);
          ctx.fillStyle = P("#ffffff");
          ctx.fillRect(bx + x, b.top[x] - 1, 1, b.bot[x] - b.top[x] + 2);
        }
      }
    }
    // rounded dorsal
    A._fin(ctx, [[bx + 3, b.top[2]], [bx + 5, b.top[2] - 3], [bx + 9, b.top[6] - 3], [bx + 12, b.top[9]]], P);
    A._fin(ctx, [[bx + 9, b.bot[8]], [bx + 11, b.bot[11] + 2], [bx + 13, b.bot[13] + 1]], P);
    tail.round(ctx, bx + len - 1, cy, 8, 5, t, P);
    pectoral(ctx, bx + 7, cy + 1, 4, 4, P, t * 0.8);
    if (!P.sil) eye(ctx, bx + 2, cy - 2, 2, P);
    gill(ctx, bx + 5, cy - 4, cy + 2, P("out2"));
  });

  define("tang", 34, 23, function (ctx, t, P, W, H) {
    var cy = 11, bx = 1, len = 21, HH = 9.5;
    var prof = [[0, 0.25, 0.3], [0.2, 0.7, 0.7], [0.45, 0.98, 0.95], [0.75, 0.9, 0.9], [1, 0.2, 0.2]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    // black painter's brush: sweeps from dorsal down
    if (!P.sil) {
      for (var x = 4; x < len - 4; x++) {
        var depth = 2 + Math.round(3 * Math.sin((x / len) * Math.PI));
        for (var k = 0; k < depth; k++) colFill(ctx, bx + x, b.top[x], b.top[x] + k, P("mark"));
      }
      // black spine near tail + white mark
      ART.circle(ctx, bx + len - 3, cy - 3, 1, P("#ffffff"));
    }
    // yellow wedge into tail
    if (!P.sil) {
      for (x = len - 4; x < len; x++) colFill(ctx, bx + x, b.top[x], b.bot[x], P("yellow"));
    }
    // yellow lunate tail
    var s = Math.sin(t * TAU) * 2;
    var tailPts = [
      [bx + len - 1, cy - 2], [bx + len + 8, cy - 6 + s], [bx + len + 4, cy + s],
      [bx + len + 8, cy + 6 + s], [bx + len - 1, cy + 2]
    ];
    polyFin(ctx, tailPts, P);
    if (!P.sil) ART.poly(ctx, tailPts, P("yellow"));
    pectoral(ctx, bx + 8, cy + 2, 4, 4, P, t * 0.5);
    if (!P.sil) eye(ctx, bx + 2, cy - 2, 2, P);
  });

  define("parrotfish", 44, 21, function (ctx, t, P, W, H) {
    var cy = 10, bx = 1, len = 30, HH = 7.5;
    var prof = [[0, 0.5, 0.5], [0.15, 0.75, 0.7], [0.5, 1, 1], [0.8, 0.8, 0.8], [1, 0.3, 0.3]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    // big overlapping scale arcs
    if (!P.sil) {
      ctx.fillStyle = P("scale");
      for (var row = 0; row < 3; row++) {
        for (var x = 5; x < len - 3; x += 3) {
          var yy = b.top[x] + 1 + row * 3;
          if (yy < b.bot[x]) ctx.fillRect(bx + x, yy, 2, 1);
        }
      }
      // pink face
      for (x = 0; x < 4; x++) colFill(ctx, bx + x, b.top[x], b.bot[x], P("face"));
    }
    // blunt beak
    ctx.fillStyle = P("beak");
    ctx.fillRect(bx - 1, cy - 1, 2, 3);
    ctx.fillStyle = P("out");
    ctx.fillRect(bx - 1, cy, 2, 1);
    // long dorsal
    A._fin(ctx, [[bx + 5, b.top[4]], [bx + 12, b.top[10] - 2], [bx + 20, b.top[19] - 2], [bx + 24, b.top[23]]], P);
    tail.fork(ctx, bx + len - 1, cy, 10, 6, t, P);
    pectoral(ctx, bx + 9, cy + 2, 5, 5, P, t * 0.6);
    if (!P.sil) { eye(ctx, bx + 2, cy - 3, 2, P); gill(ctx, bx + 6, cy - 5, cy + 2, P("out2")); }
  });

  define("angel", 30, 26, function (ctx, t, P, W, H) {
    var cy = 13, bx = 2, len = 17, HH = 9;
    var prof = [[0, 0.3, 0.3], [0.25, 0.85, 0.8], [0.5, 1, 1], [0.8, 0.8, 0.85], [1, 0.2, 0.2]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    // vertical gold bands
    if (!P.sil) {
      for (var i = 0; i < 3; i++) {
        for (var xx = bx + 4 + i * 4; xx < bx + 6 + i * 4; xx++) {
          var idx = xx - bx;
          if (b.top[idx] !== undefined) colFill(ctx, xx, b.top[idx], b.bot[idx], P("gold"));
        }
      }
      // black head mask
      for (var x = 0; x < 3; x++) colFill(ctx, bx + x, b.top[x], b.bot[x], P("mask"));
    }
    // tall pointed dorsal & anal sails
    A._fin(ctx, [[bx + 4, b.top[3]], [bx + 7, b.top[5] - 8], [bx + 10, b.top[8] - 2], [bx + 12, b.top[10]]], P);
    A._fin(ctx, [[bx + 5, b.bot[5]], [bx + 8, b.bot[7] + 8], [bx + 11, b.bot[10] + 2]], P);
    tail.fan(ctx, bx + len - 1, cy, 6, 4, t, P);
    if (!P.sil) {
      eye(ctx, bx + 2, cy - 4, 2, P);
      ctx.fillStyle = P("fin");
      ctx.fillRect(bx + len, cy - 6, 2, 4); // trailing filament hint
    }
    // yellow pectoral
    pectoral(ctx, bx + 6, cy + 1, 4, 3, P, t * 0.5);
  });

  define("wrasse", 32, 13, function (ctx, t, P, W, H) {
    var cy = 6, bx = 1, len = 22, HH = 4;
    var prof = [[0, 0.45, 0.5], [0.2, 0.9, 0.95], [0.6, 0.85, 0.8], [1, 0.18, 0.18]];
    var b = fillBody(ctx, bx, len, cy, HH, prof, P);
    if (!P.sil) {
      // dark thin stripe + sheen
      for (var x = 2; x < len - 2; x++) colFill(ctx, bx + x, b.top[x], b.top[x], P("dark2"));
      for (x = 3; x < len - 3; x += 2) colFill(ctx, bx + x, cy + 1, cy + 1, P("sheen"));
    }
    A._fin(ctx, [[bx + 4, b.top[3]], [bx + 8, b.top[7] - 2], [bx + 13, b.top[12] - 2], [bx + 16, b.top[15]]], P);
    // forked bright tail
    var s = Math.sin(t * TAU) * 2;
    polyFin(ctx, [
      [bx + len - 1, cy - 1], [bx + len + 7, cy - 4 + s], [bx + len + 3, cy + s], [bx + len + 7, cy + 4 + s]
    ], P);
    pectoral(ctx, bx + 7, cy + 1, 3, 3, P, t * 0.9);
    if (!P.sil) { eye(ctx, bx + 2, cy - 1, 1, P); gill(ctx, bx + 4, cy - 3, cy + 1, P("out2")); }
  });

  define("puffer", 30, 26, function (ctx, t, P, W, H) {
    var cy = 13, cx = 14, R = 9;
    // round body via ellipse rows (outline pass included manually)
    function bodyRows(color) {
      ctx.fillStyle = color;
      for (var y = -R; y <= R; y++) {
        var w = Math.round(R * Math.sqrt(Math.max(0, 1 - (y * y) / (R * R))));
        var wr = Math.round(w * (1 - 0.35 * Math.max(0, y / R))); // taper bottom a bit
        ctx.fillRect(cx - w, cy + y, w + wr, 1);
      }
    }
    if (P.sil) {
      bodyRows(P("#000000"));
    } else {
      var offs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (var oi = 0; oi < offs.length; oi++) {
        ctx.save(); ctx.translate(offs[oi][0], offs[oi][1]);
        bodyRows(P("out"));
        ctx.restore();
      }
      // shade: dark top, light belly
      ctx.save();
      ctx.beginPath();
      for (var y = -R; y <= R; y++) {
        var w = Math.round(R * Math.sqrt(Math.max(0, 1 - (y * y) / (R * R))));
        ctx.rect(cx - w, cy + y, w * 2 + 1, 1);
      }
      ctx.clip();
      ART.vgrad(ctx, cx - R, cy - R, R * 2, R * 2, P("dark"), P("belly"), 6);
      ctx.restore();
    }
    // spike nubs around the outline
    var n = 16;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * TAU;
      var bx = Math.round(cx + Math.cos(a) * (R - 1));
      var by = Math.round(cy + Math.sin(a) * (R - 1));
      ctx.fillStyle = P("fin");
      ctx.fillRect(bx, by, 1, 1);
      if (Math.abs(Math.sin(a)) > 0.5) ctx.fillRect(bx, by - 1, 1, 1);
    }
    if (!P.sil) {
      var rng = FG.rng(51);
      for (i = 0; i < 10; i++) {
        ctx.fillStyle = P("spot");
        ctx.fillRect(cx - 6 + Math.floor(rng() * 12), cy - 6 + Math.floor(rng() * 12), 1, 1);
      }
      eye(ctx, cx - 5, cy - 3, 3, P);
      ctx.fillStyle = P("out");
      ctx.fillRect(cx - 12, cy + 2, 2, 1);
      gill(ctx, cx - 8, cy - 1, cy + 3, P("out2"));
    }
    // tiny translucent fins flap
    var f = Math.sin(t * TAU);
    polyFin(ctx, [[cx + 5, cy - 4], [cx + 11, cy - 7 + f], [cx + 10, cy - 2 + f]], P);
    polyFin(ctx, [[cx + 6, cy + 4], [cx + 12, cy + 7 - f], [cx + 10, cy + 5 - f]], P);
    polyFin(ctx, [[cx - 4, cy + 4], [cx - 9, cy + 6 - f], [cx - 8, cy + 3 - f]], P);
  });

})();
