// ============================================================
// render.js - the island scene: sky, ocean, beach, dock,
// fisherman, particles, HUD, fight meters, catch panel.
// ============================================================

(function () {
  var R = FG.render = {};
  var G = FG.game, U = FG.ui, F = FG.font, S = FG.save, ART = FG.art;
  var FMT = FG.fmtInt, KG = FG.fmtKg, CM = FG.fmtCm;
  var TAU = Math.PI * 2;

  // ---------------- particles ----------------
  var P = FG.particles = { list: [] };
  P.add = function (o) { P.list.push(o); if (P.list.length > 240) P.list.shift(); };
  P.splash = function (x, y, size) {
    var n = [4, 8, 14][size] || 6;
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + FG.rand(-0.9, 0.9);
      var v = FG.rand(18, 48) * (1 + size * 0.3);
      P.add({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 160,
        life: 0, max: FG.rand(0.3, 0.6), c: "#cfe8f8", r: 1 + (Math.random() < 0.3 ? 1 : 0) });
    }
    P.add({ ring: true, x: x, y: y, life: 0, max: 0.5, size: size });
  };
  P.sparkleBurst = function (x, y, c) {
    for (var i = 0; i < 12; i++) {
      var a = Math.random() * TAU, v = FG.rand(10, 42);
      P.add({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: -20,
        life: 0, max: FG.rand(0.4, 0.9), c: c || "#ffd97a", spark: true, r: 1 });
    }
  };
  P.update = function (dt) {
    for (var i = P.list.length - 1; i >= 0; i--) {
      var p = P.list[i];
      p.life += dt;
      if (p.life >= p.max) { P.list.splice(i, 1); continue; }
      if (p.ring) continue;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
    }
  };
  P.draw = function (ctx) {
    for (var i = 0; i < P.list.length; i++) {
      var p = P.list[i], k = p.life / p.max;
      if (p.ring) {
        var fr = Math.min(3, Math.floor(k * 4));
        ctx.globalAlpha = 1 - k;
        ctx.drawImage(FG.env.splash(fr), p.x - 13, p.y - 7);
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.globalAlpha = 1 - k * 0.8;
      if (p.spark) ctx.drawImage(FG.env.sparkle(Math.floor(p.life * 12) % 3), p.x - 5, p.y - 5);
      else { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.r, p.r); }
    }
    ctx.globalAlpha = 1;
  };

  // ---------------- sky palettes ----------------
  // keyframes: [phase, top, mid, horizonGlow, waterTop, waterDeep]
  var SKY = [
    [0.00, "#1b2444", "#3a3a66", "#c96a4a", "#25496b", "#14293f"], // dawn
    [0.12, "#3f6fae", "#7fb3d5", "#e8c98e", "#3f7fa5", "#1e4568"], // morning
    [0.30, "#4a86c8", "#86c0e0", "#cfe5f2", "#4588b0", "#20507a"], // midday
    [0.46, "#4a6f9e", "#c97a5a", "#ff9a5a", "#3d6f96", "#1d3f5f"], // sunset
    [0.55, "#161f38", "#242e4a", "#3a3f5e", "#1f3d5a", "#10233a"], // dusk
    [0.75, "#0b1226", "#141c34", "#20283e", "#152c44", "#0a1828"], // night
    [0.95, "#1b2444", "#3a3a66", "#c96a4a", "#25496b", "#14293f"]  // pre-dawn
  ];
  function skyAt(phase) {
    var a = SKY[SKY.length - 1], b = SKY[0];
    for (var i = 0; i < SKY.length - 1; i++) {
      if (phase >= SKY[i][0] && phase <= SKY[i + 1][0]) { a = SKY[i]; b = SKY[i + 1]; break; }
    }
    var t = (phase - a[0]) / Math.max(0.001, b[0] - a[0]);
    return {
      top: FG.mix(a[1], b[1], t), mid: FG.mix(a[2], b[2], t), glow: FG.mix(a[3], b[3], t),
      wTop: FG.mix(a[4], b[4], t), wDeep: FG.mix(a[5], b[5], t)
    };
  }
  function darkness(phase) {
    if (phase < 0.05) return 0.7;
    if (phase < 0.15) return FG.lerp(0.7, 0, (phase - 0.05) / 0.1);
    if (phase < 0.45) return 0;
    if (phase < 0.58) return FG.lerp(0, 0.6, (phase - 0.45) / 0.13);
    if (phase < 0.95) return 0.6;
    return FG.lerp(0.6, 0.7, (phase - 0.95) / 0.05);
  }

  // ---------------- scene ----------------
  var stars = null, clouds = null;
  function initScene() {
    if (stars) return;
    var rng = FG.rng(77);
    stars = [];
    for (var i = 0; i < 70; i++)
      stars.push({ x: rng() * FG.W, y: rng() * (FG.HORIZON - 6), p: rng(), tw: FG.rand(0.5, 2) });
    var crng = FG.rng(31);
    clouds = [];
    for (i = 0; i < 6; i++)
      clouds.push({ img: FG.env.cloud(i % 3), x: crng() * (FG.W + 100) - 80, y: 14 + crng() * 70, sp: 4 + crng() * 8 });
  }

  function skyLayer(ctx, t) {
    var ph = G.time.phase, sky = skyAt(ph);
    var g = ctx.createLinearGradient(0, 0, 0, FG.HORIZON);
    g.addColorStop(0, FG.rgb(sky.top.r, sky.top.g, sky.top.b));
    g.addColorStop(0.7, FG.rgb(sky.mid.r, sky.mid.g, sky.mid.b));
    g.addColorStop(1, FG.rgb(sky.glow.r, sky.glow.g, sky.glow.b));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FG.W, FG.HORIZON);

    // stars
    var dark = darkness(ph);
    if (dark > 0.02) {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = dark * (0.4 + 0.6 * Math.abs(Math.sin(t * s.tw + s.p * 9)));
        ctx.fillStyle = FG.rgb(235, 244, 255, a);
        ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      }
    }
    // sun / moon arcs
    var dayP = ph < 0.52 ? ph / 0.52 : null;
    if (dayP !== null) {
      var sx = 40 + dayP * 560, sy = FG.HORIZON - 12 - Math.sin(dayP * Math.PI) * 82;
      ctx.drawImage(FG.env.sun(), sx - 20, sy - 20);
    } else {
      var nP = (ph - 0.52) / 0.48;
      var mx = 580 - nP * 540, my = FG.HORIZON - 8 - Math.sin(nP * Math.PI) * 76;
      ctx.drawImage(FG.env.moon(), mx - 16, my - 16);
    }
    // clouds
    for (i = 0; i < clouds.length; i++) {
      var cl = clouds[i];
      var cx = ((cl.x + t * cl.sp) % (FG.W + 160)) - 80;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(cl.img, Math.round(cx), cl.y);
      ctx.globalAlpha = 1;
    }
  }

  function oceanLayer(ctx, t) {
    var ph = G.time.phase, sky = skyAt(ph);
    var g = ctx.createLinearGradient(0, FG.HORIZON, 0, 300);
    g.addColorStop(0, FG.rgb(sky.wTop.r, sky.wTop.g, sky.wTop.b));
    g.addColorStop(1, FG.rgb(sky.wDeep.r, sky.wDeep.g, sky.wDeep.b));
    ctx.fillStyle = g;
    ctx.fillRect(0, FG.HORIZON, FG.W, 300 - FG.HORIZON + 2);
    // deep foreground water to the bottom edge - the whole canvas must be repainted every frame
    ctx.fillStyle = FG.rgb(sky.wDeep.r * 0.42, sky.wDeep.g * 0.42, sky.wDeep.b * 0.45);
    ctx.fillRect(0, 300, FG.W, FG.H - 300);
    // distant islands
    ctx.globalAlpha = 0.85;
    ctx.drawImage(FG.env.islandStrip(), 0, FG.HORIZON - 26);
    ctx.globalAlpha = 1;
    // sun/moon glitter column
    var lightX = ph < 0.52 ? 40 + (ph / 0.52) * 560 : 580 - ((ph - 0.52) / 0.48) * 540;
    for (var yy = FG.HORIZON + 4; yy < 260; yy += 4) {
      var dy = yy - FG.HORIZON;
      var w = 10 + dy * 0.25 + Math.sin(t * 1.6 + dy * 0.35) * 6;
      var a = (0.18 + 0.1 * Math.sin(t * 2.4 + dy * 0.55)) * (1 - dy / 115);
      ctx.fillStyle = ph < 0.52 ? FG.rgb(255, 220, 140, a) : FG.rgb(190, 220, 255, a * 0.8);
      ctx.fillRect(Math.round(lightX - w / 2), yy, Math.round(w), 2);
    }
    // shimmer dashes
    for (var row = 0; row < 22; row++) {
      var ry = FG.HORIZON + 8 + row * 7;
      var n = 5 + row;
      for (var d = 0; d < n; d++) {
        var dx = (d * 137 + row * 61 + Math.floor(t * (1 + row * 0.15) * 3) * 23) % FG.W;
        ctx.fillStyle = FG.rgb(220, 240, 255, 0.05 + 0.05 * Math.sin(d + row));
        ctx.fillRect(Math.round(dx), ry, 3 + (d % 3), 1);
      }
    }
    // foam horizon line
    for (d = 0; d < FG.W; d += 3) {
      var fh = 0.5 + 0.5 * Math.sin(d * 0.08 + t * 2);
      ctx.fillStyle = FG.rgb(235, 248, 255, 0.22 * fh);
      ctx.fillRect(d, FG.HORIZON - 1 + (fh > 0.7 ? -1 : 0), 2, 1);
    }
  }

  function beachLayer(ctx, t) {
    var ph = G.time.phase;
    // sand
    ctx.fillStyle = "#e4c285";
    ctx.beginPath();
    ctx.moveTo(0, 222); ctx.lineTo(150, 226); ctx.lineTo(200, 268); ctx.lineTo(230, 360); ctx.lineTo(0, 360);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#cfab6c";
    ctx.beginPath();
    ctx.moveTo(0, 244); ctx.lineTo(140, 250); ctx.lineTo(185, 300); ctx.lineTo(200, 360); ctx.lineTo(0, 360);
    ctx.closePath(); ctx.fill();
    // shoreline foam
    ctx.fillStyle = FG.rgb(245, 250, 255, 0.5);
    ART.thickLine(ctx, 148, 227, 200, 268, 2, FG.rgb(240, 250, 255, 0.55));
    for (var i = 0; i < 10; i++) {
      var tt = i / 10;
      var fx = FG.lerp(148, 202, tt) + Math.sin(t * 2 + i) * 1.5;
      ctx.fillStyle = FG.rgb(255, 255, 255, 0.5 + 0.3 * Math.sin(t * 3 + i * 2));
      ctx.fillRect(Math.round(fx), Math.round(FG.lerp(227, 268, tt)), 2, 1);
    }
    // wet sand shadow
    ART.thickLine(ctx, 149, 229, 203, 270, 3, FG.shadeHex("#cfab6c", -0.25));

    // palms behind (drawn before the hut so the cabin occludes their trunks)
    var p1 = FG.env.palm(0), p2 = FG.env.palm(1);
    ctx.save();
    ctx.translate(96, 156); ctx.rotate(Math.sin(t * 0.9) * 0.015);
    ctx.drawImage(p1.c, -32, -46);
    ctx.restore();
    ctx.save();
    ctx.translate(142, 172); ctx.rotate(-Math.sin(t * 0.7 + 1) * 0.015);
    ctx.drawImage(p2.c, -32, -29);
    ctx.restore();
    // hut
    ctx.drawImage(FG.env.hut(), 10, 148);
    // props
    ctx.drawImage(FG.env.crate(), 88, 206);
    ctx.drawImage(FG.env.barrel(), 108, 208);
    ctx.drawImage(FG.env.rock(0), 156, 220);
    ctx.drawImage(FG.env.rock(1), 122, 238);
    ctx.drawImage(FG.env.bush(0), 66, 224);
    ctx.drawImage(FG.env.bush(1), 132, 250);
    ctx.drawImage(FG.env.flower(0), 100, 212);
    ctx.drawImage(FG.env.flower(1), 144, 236);
    ctx.drawImage(FG.env.flower(2), 82, 232);
    ctx.drawImage(FG.env.grass(), 118, 214);
    ctx.drawImage(FG.env.grass(), 150, 244);
    ctx.drawImage(FG.env.grass(), 170, 278);
    // boat on water near beach
    ctx.save();
    ctx.translate(230, 258);
    ctx.rotate(Math.sin(t * 1.2) * 0.02);
    ctx.drawImage(FG.env.boat(), -36, -14);
    ctx.restore();
  }

  var DOCK_Y = 196;
  function dockLayer(ctx, t) {
    // piles
    for (var x = 168; x < 640; x += 84) {
      ctx.fillStyle = "#5e3f1e";
      ctx.fillRect(x, DOCK_Y + 6, 6, 26);
      ctx.fillStyle = "#3d2510";
      ctx.fillRect(x, DOCK_Y + 6, 2, 26);
      // water lap at pile
      var a = 0.4 + 0.3 * Math.sin(t * 3 + x);
      ctx.fillStyle = FG.rgb(235, 248, 255, a);
      ctx.fillRect(x - 2, DOCK_Y + 30, 10, 1);
    }
    // deck
    ctx.fillStyle = "#6e4a26";
    ctx.fillRect(140, DOCK_Y - 2, 500, 8);
    ctx.fillStyle = "#8a5c2e";
    ctx.fillRect(140, DOCK_Y - 2, 500, 3);
    ctx.fillStyle = "#573a1d";
    ctx.fillRect(140, DOCK_Y + 5, 500, 1);
    for (var px = 142; px < 640; px += 17) {
      ctx.fillStyle = "rgba(60,38,18,0.8)";
      ctx.fillRect(px, DOCK_Y - 2, 1, 7);
    }
    // highlight
    ctx.fillStyle = "rgba(255,220,160,0.10)";
    ctx.fillRect(140, DOCK_Y - 2, 500, 1);
    // lamp at dock start
    ctx.drawImage(FG.env.lamp(), 148, DOCK_Y - 42);
    if (darkness(G.time.phase) > 0.3) {
      ART.glow(ctx, 155, DOCK_Y - 34, 20, "#ffd97a", 0.3, 6);
    }
    // sign
    ctx.fillStyle = "#5e4026";
    ctx.fillRect(134, DOCK_Y - 30, 2, 30);
  }

  // ---------------- fisherman + line + bobber ----------------
  function charPose() {
    var st = G.fish.state, t = G.fish.t;
    switch (st) {
      case "idle": return { state: "idle", t: FG.tGlobal };
      case "charging": return { state: "cast", ct: 0.08 + 0.3 * G.cast.power };
      case "flying": return { state: "cast", ct: 0.75 + 0.2 * Math.min(1, t / 0.55) };
      case "waiting": return { state: "wait", t: FG.tGlobal };
      case "bite": return { state: "bite", t: FG.tGlobal };
      case "hooking": return { state: "hook", ht: t / 0.35 };
      case "fighting": return { state: "reel", t: FG.tGlobal, tension: G.fight.tension };
      case "caught": return { state: "caught", t: FG.tGlobal };
      case "lost":
      case "result": return { state: G.fish.state === "lost" ? "sad" : (G.result && !G.result.lost ? "caught" : "sad"), t: FG.tGlobal };
    }
    return { state: "idle", t: FG.tGlobal };
  }

  var CHAR_X = 252;
  function characterLayer(ctx, t) {
    var pose = charPose();
    var r = FG.char.draw(ctx, CHAR_X, DOCK_Y - 2, pose);
    var b = G.bobber, st = G.fish.state;
    // rod tip
    if (["waiting", "bite", "hooking", "fighting"].indexOf(st) >= 0) {
      var dipY = b.y;
      if (st === "bite") dipY += Math.sin(t * 24) * 3 + 2;
      var sag = st === "fighting" ? (0.15 - G.fight.tension * 0.1) : 0.35;
      var midX = (r.rodTip.x + b.x) / 2, midY = (r.rodTip.y + dipY) / 2 + 26 * sag + (st === "fighting" ? Math.sin(t * 18) * 2 : 0);
      ART.bezier(ctx, r.rodTip.x, r.rodTip.y, midX, midY, b.x, dipY, "rgba(235,245,255,0.75)");
      // bobber
      ctx.drawImage(FG.env.bobber(), Math.round(b.x - 5), Math.round(dipY - 12) + Math.round(Math.sin(t * 2.2) * 1.5));
      if (st === "bite") {
        F.draw(ctx, "!", Math.round(b.x), Math.round(dipY - 20) + Math.round(Math.sin(t * 12) * 2), "#ffd94a", 2, { align: "center", shadow: true });
      }
    } else if (st === "flying") {
      // line trailing the flying bobber
      ART.bezier(ctx, r.rodTip.x, r.rodTip.y, (r.rodTip.x + b.x) / 2, Math.min(r.rodTip.y, b.y) + 8, b.x, b.y, "rgba(235,245,255,0.6)");
      ctx.save();
      ctx.translate(Math.round(b.x), Math.round(b.y));
      ctx.rotate((b.x - b.sx) * 0.004);
      ctx.drawImage(FG.env.bobber(), -5, -7);
      ctx.restore();
    }

    // fight extras: fish shadow + surface disturbance
    if (st === "fighting" || (st === "hooking" && G.hookOk)) {
      var fx = b.x + Math.sin(t * 1.4) * 10 + (G.fight ? G.fight.fishX : 0);
      var fy = b.y + 14 + Math.sin(t * 2) * 3;
      ctx.fillStyle = "rgba(8,16,26,0.5)";
      ART.ellipse(ctx, fx, fy, 8, 4, "rgba(8,16,26,0.5)");
      if (Math.random() < 0.08) P.splash(b.x + FG.rand(-8, 8), b.y + 2, 0);
    }
    // caught: lift fish beside character
    if ((st === "caught" || st === "result") && G.result && !G.result.lost) {
      var f = G.result.fish;
      var fr = Math.floor(t * 10) % FG.FISH_FRAMES;
      var sp = FG.fishSprite(f.id, fr, false);
      if (sp) {
        var lift = Math.min(1, G.fish.t * 2) * 20;
        ctx.save();
        ctx.translate(CHAR_X + 26, 170 - lift);
        ctx.scale(-1, 1); // fish art faces left; flip to face right toward view
        ctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
        ctx.restore();
        if (Math.random() < 0.12) P.add({ x: CHAR_X + 26 + FG.rand(-6, 6), y: 150, vx: 0, vy: 20, g: 120, life: 0, max: 0.5, c: "#bfe0f4", r: 1 });
      }
    }
  }

  // ---------------- weather & grade ----------------
  function weatherLayer(ctx, t) {
    var ph = G.time.phase, dark = darkness(ph);
    // cloud cover
    if (G.weather.kind === "cloudy" || G.weather.kind === "rainy" || G.weather.kind === "storm") {
      var n = G.weather.kind === "storm" ? 8 : 5;
      for (var i = 0; i < n; i++) {
        var x = ((i * 173 + t * 6) % (FG.W + 120)) - 90;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(FG.env.cloud(i % 3), Math.round(x), 10 + (i * 29) % 40);
        ctx.globalAlpha = 1;
      }
    }
    var raining = G.weather.kind === "rainy" || G.weather.kind === "storm";
    if (raining) {
      var rng = FG.rng(12);
      ctx.fillStyle = "rgba(180,210,255,0.45)";
      var speed = G.weather.kind === "storm" ? 460 : 320;
      for (i = 0; i < 70; i++) {
        var rx = (rng() * FG.W + (t * (speed * 0.25))) % FG.W;
        var ry = (rng() * 400 + t * speed) % 400;
        ctx.fillRect(Math.round(rx), Math.round(ry), 1, 4);
      }
      // water hits
      if (Math.random() < 0.3) {
        var hx = rng() * FG.W, hy = FG.HORIZON + 10 + rng() * 140;
        P.add({ ring: true, x: hx, y: hy, life: 0, max: 0.35, size: 0 });
      }
    }
    // storm dim + lightning
    if (G.weather.kind === "storm") { ctx.fillStyle = "rgba(10,16,28,0.35)"; ctx.fillRect(0, 0, FG.W, FG.H); }
    if (G.weather.flash > 0) {
      ctx.fillStyle = FG.rgb(255, 255, 255, Math.min(0.55, G.weather.flash * 4));
      ctx.fillRect(0, 0, FG.W, FG.H);
    }
    // time-of-day grade
    if (dark > 0) { ctx.fillStyle = FG.rgb(16, 26, 52, dark * 0.35); ctx.fillRect(0, 0, FG.W, FG.H); }
    else if (ph < 0.12) { ctx.fillStyle = FG.rgb(255, 150, 90, 0.10); ctx.fillRect(0, 0, FG.W, FG.H); }
    else if (ph > 0.44 && ph < 0.55) { ctx.fillStyle = FG.rgb(255, 120, 60, 0.14); ctx.fillRect(0, 0, FG.W, FG.H); }
    // vignette
    var vg = ctx.createRadialGradient(FG.W / 2, FG.H / 2, 200, FG.W / 2, FG.H / 2, 420);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(2,4,10,0.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, FG.W, FG.H);
  }

  // ---------------- HUD ----------------
  function hudLayer(ctx) {
    // portrait chip
    ctx.fillStyle = "rgba(10,16,26,0.75)";
    ctx.fillRect(8, 8, 150, 34);
    FG.rectOutline(ctx, 8, 8, 150, 34, "rgba(90,130,170,0.6)");
    ctx.drawImage(FG.char.portrait(), 12, 11);
    F.draw(ctx, "LV " + S.state.level, 46, 12, "#ffd97a", 1);
    var need = FG.xpForLevel(S.state.level);
    U.meter(ctx, 46, 24, 84, 7, S.state.xp / need, "#a865f6");
    ctx.drawImage(FG.env.icon("coin"), 118, 22);
    F.draw(ctx, FMT(S.state.coins), 115, 24, "#ffe48a", 1, { align: "right" });
    // rank line
    F.draw(ctx, FG.RANKS[S.rankIndex()].name, 46, 33, "#8fa8c2", 1);

    // clock / weather chip (right)
    ctx.fillStyle = "rgba(10,16,26,0.75)";
    ctx.fillRect(FG.W - 148, 8, 140, 30);
    FG.rectOutline(ctx, FG.W - 148, 8, 140, 30, "rgba(90,130,170,0.6)");
    var we = G.WEATHERS.filter(function (w) { return w.kind === G.weather.kind; })[0];
    ctx.drawImage(FG.env.icon(we.icon), FG.W - 142, 12);
    F.draw(ctx, G.timeName(), FG.W - 122, 14, "#e8f0f8", 1);
    F.draw(ctx, "DAY " + G.time.day, FG.W - 8, 14, "#8fa8c2", 1, { align: "right" });
    F.draw(ctx, we.name, FG.W - 122, 26, "#c2ced9", 1);
    // clock dots
    for (var i = 0; i < 8; i++) {
      ctx.fillStyle = i / 8 < G.time.phase ? "#ffd94a" : "rgba(120,140,160,0.35)";
      ctx.fillRect(FG.W - 66 + i * 6, 28, 4, 4);
    }

    // bait chip
    ctx.fillStyle = "rgba(10,16,26,0.75)";
    ctx.fillRect(8, 46, 120, 16);
    FG.rectOutline(ctx, 8, 46, 120, 16, "rgba(90,130,170,0.5)");
    ctx.drawImage(FG.env.icon("bait"), 11, 47);
    var bait = S.getBait();
    var cnt = bait.id === "worm" ? "MAX" : (S.state.bait[bait.id] | 0);
    F.draw(ctx, bait.name.replace("BASIC ", "").replace(" BAIT", "").replace(" LURE", "") + " " + cnt, 29, 50, "#c2ced9", 1);

    // hint
    if (G.hint && !G.fishingActive()) {
      F.draw(ctx, G.hint, FG.W / 2, FG.H - 34, "rgba(220,235,248,0.85)", 1, { align: "center", shadow: true });
    }

    // cast power bar
    if (G.fish.state === "charging") {
      var bx = FG.W / 2 - 90, bw = 180;
      ctx.fillStyle = "rgba(8,14,22,0.85)";
      ctx.fillRect(bx - 6, FG.H - 62, bw + 12, 22);
      FG.rectOutline(ctx, bx - 6, FG.H - 62, bw + 12, 22, "#5d87b0");
      ART.vgrad(ctx, bx, FG.H - 56, bw, 10, "#1f5537", "#4ec26b", 4);
      // green zone
      ctx.fillStyle = "rgba(255,217,122,0.85)";
      ctx.fillRect(bx + bw * 0.68, FG.H - 58, bw * 0.16, 14);
      ctx.fillStyle = "rgba(232,66,63,0.5)";
      ctx.fillRect(bx + bw * 0.84, FG.H - 58, bw * 0.16, 14);
      // marker
      var mx = bx + bw * G.cast.power;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.round(mx), FG.H - 60, 2, 18);
      F.draw(ctx, "CAST POWER", FG.W / 2, FG.H - 74, "#c2ced9", 1, { align: "center" });
    }
  }

  function fightLayer(ctx) {
    var ft = G.fight, f = G.current;
    if (!ft) return;
    var cx = FG.W / 2;
    // name banner - identity/rarity stay hidden until the fish is actually landed
    ctx.fillStyle = "rgba(10,16,26,0.8)";
    ctx.fillRect(cx - 110, 48, 220, 15);
    FG.rectOutline(ctx, cx - 110, 48, 220, 15, "#5d87b0");
    F.draw(ctx, "SOMETHING BIG ON THE LINE", cx, 52, "#e8f0f8", 1, { align: "center" });

    // progress (catch) bar top
    U.meter(ctx, cx - 140, 68, 280, 12, ft.progress / 100, "#4ec26b");
    ctx.fillStyle = "rgba(10,16,26,0.7)";
    ctx.fillRect(cx - 144, 82, 58, 12);
    ctx.fillRect(cx + 96, 82, 48, 12);
    F.draw(ctx, "REEL IN", cx - 140, 84, "#8fa8c2", 1);
    F.draw(ctx, Math.floor(ft.progress) + "%", cx + 140, 84, "#c2ced9", 1, { align: "right" });

    // tension bar bottom, with red zone
    var tx = cx - 120, tw = 240, ty = FG.H - 46;
    ctx.fillStyle = "rgba(8,14,22,0.85)";
    ctx.fillRect(tx - 4, ty - 4, tw + 8, 22);
    FG.rectOutline(ctx, tx - 4, ty - 4, tw + 8, 22, ft.tension > 0.85 ? "#e8423f" : "#5d87b0");
    // zones
    ctx.fillStyle = "rgba(78,194,107,0.30)";
    ctx.fillRect(tx + 2, ty, tw * 0.6, 14);
    ctx.fillStyle = "rgba(232,183,31,0.35)";
    ctx.fillRect(tx + tw * 0.6, ty, tw * 0.32, 14);
    ctx.fillStyle = "rgba(232,66,63,0.35)";
    ctx.fillRect(tx + tw * 0.92, ty, tw * 0.08, 14);
    // fill
    var tc = ft.tension > 0.92 ? "#e8423f" : ft.tension > 0.6 ? "#e8b71f" : "#4ec26b";
    ctx.fillStyle = tc;
    ctx.fillRect(tx + 2, ty + 1, Math.max(1, (tw - 4) * ft.tension), 12);
    if (ft.tension > 0.85) ctx.globalAlpha = 0.3 + 0.2 * Math.sin(FG.tGlobal * 20);
    ctx.fillStyle = FG.shadeHex(tc, 0.3);
    ctx.fillRect(tx + 2, ty + 1, Math.max(1, (tw - 4) * ft.tension), 2);
    ctx.globalAlpha = 1;
    F.draw(ctx, "LINE TENSION", tx, ty - 14, "#8fa8c2", 1);
    if (ft.warnT > 0) F.draw(ctx, "! LINE STRAINING !", tx + tw, ty - 14, "#e8423f", 1, { align: "right", shadow: true });

    // stamina mini bar right of tension
    U.meter(ctx, tx + tw + 12, ty, 46, 14, FT_stam(ft), "#3b9dff");
    F.draw(ctx, ft.exhausted ? "TIRED" : "STAM", tx + tw + 12, ty - 12, "#8fa8c2", 1);
    // fish struggle arrow
    if (ft.run > 0) F.draw(ctx, "RUNNING!", tx - 8, ty + 2, "#ffd94a", 1, { align: "right" });
  }
  function FT_stam(ft) {
    var f = G.current;
    var max = 36 + f.difficulty * 7 + f.speed * 0.15;
    return FG.clamp(ft.stamina / max, 0, 1);
  }

  // ---------------- result panel ----------------
  var resT = 0;
  function resultLayer(ctx, dt) {
    if (G.fish.state !== "result") { resT = 0; return; }
    resT += dt;
    var res = G.result;
    ctx.fillStyle = "rgba(4,8,14,0.55)";
    ctx.fillRect(0, 0, FG.W, FG.H);
    var w = 400, h = 190, x = FG.W / 2 - w / 2, y = 70;
    U.panel(ctx, x, y, w, h, {
      title: res.lost ? "IT GOT AWAY" : (res.first ? "NEW SPECIES!" : "LAND IT!"),
      accent: res.lost ? "#e87a6e" : FG.rarityColor(res.fish.rarity)
    });
    var f = res.fish;
    if (res.lost) {
      var sp = FG.fishSprite(f.id, Math.floor(FG.tGlobal * 4) % FG.FISH_FRAMES, true);
      if (sp) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(sp, FG.W / 2 - sp.width / 2, y + 34);
        ctx.globalAlpha = 1;
      }
      F.draw(ctx, "A " + FG.rarityName(f.rarity).toLowerCase() + " SHADOW SLIPPED THE HOOK", FG.W / 2, y + 120, "#8fa8c2", 1, { align: "center" });
      F.drawWrapped(ctx, res.reason, FG.W / 2, y + 140, "#c2ced9", 1, w - 60, 1, { align: "center" });
    } else {
      var fr = Math.floor(FG.tGlobal * 8) % FG.FISH_FRAMES;
      var sp2 = FG.fishSprite(f.id, fr, false);
      var appear = FG.easeOut(FG.clamp(resT * 2, 0, 1));
      if (sp2) {
        ctx.save();
        ctx.translate(FG.W / 2, y + 62);
        ctx.scale((0.6 + 0.4 * appear), (0.6 + 0.4 * appear));
        ctx.drawImage(sp2, -sp2.width / 2, -sp2.height / 2);
        ctx.restore();
        if (FG.rarityIdx[f.rarity] >= 2 && resT < 1.2) P.sparkleBurst(FG.W / 2, y + 62, FG.rarityColor(f.rarity));
      }
      F.draw(ctx, f.name, FG.W / 2, y + 98, "#e8f0f8", 2, { align: "center", shadow: true });
      F.draw(ctx, FG.rarityName(f.rarity), FG.W / 2, y + 122, FG.rarityColor(f.rarity), 1, { align: "center" });
      F.draw(ctx, KG(res.kg) + "   -   " + CM(res.cm), FG.W / 2 - 60, y + 138, "#c2ced9", 1, { align: "center" });
      F.draw(ctx, res.quality.name + " QUALITY", FG.W / 2 + 80, y + 138, res.quality.color, 1, { align: "center" });
      if (res.isBest) F.draw(ctx, "NEW PERSONAL BEST!", FG.W / 2, y + 149, "#ffd94a", 1, { align: "center" });
      ctx.drawImage(FG.env.icon("coin"), x + 24, y + 132);
      F.draw(ctx, "+" + FMT(res.coins), x + 22, y + 134, "#ffe48a", 1, { align: "right" });
      F.draw(ctx, "+" + res.xp + " XP", x + w - 24, y + 134, "#c58ef8", 1, { align: "right" });
    }
    // buttons
    var mountable = !res.lost && (res.first || res.isBest) &&
      S.state.trophies.filter(function (t2) { return t2.id === f.id; }).length === 0 &&
      S.state.trophies.length < 18;
    U.btn(ctx, x + 20, y + h - 30, 130, 22, "CONTINUE", { style: "green", cb: function () { G.toIdle(); } });
    if (mountable) {
      U.btn(ctx, x + w - 160, y + h - 30, 140, 22, "MOUNT IT", { style: "gold", cb: function () {
        if (G.keepTrophy(res)) G.toIdle();
      } });
    } else {
      U.btn(ctx, x + w - 160, y + h - 30, 140, 22, "RELEASE", { cb: function () {
        G.toIdle();
        if (!res.lost) FG.ui.toast("THROWN BACK TO THE TIDE", "#4ec26b");
      } });
    }
  }

  // ---------------- main scene entry ----------------
  R.scene = function (ctx, dt) {
    initScene();
    var t = FG.tGlobal;
    // hard clear: nothing may survive between frames (screen shake leaves 1px gaps otherwise)
    ctx.fillStyle = "#0a1420";
    ctx.fillRect(0, 0, FG.W, FG.H);
    // screen shake
    var shake = S.state && S.state.settings.shake && ((G.fight && G.fight.tension > 0.85) || G.weather.flash > 0.05);
    ctx.save();
    if (shake) ctx.translate(Math.round(FG.rand(-1, 1)), Math.round(FG.rand(-1, 1)));
    skyLayer(ctx, t);
    oceanLayer(ctx, t);
    beachLayer(ctx, t);
    dockLayer(ctx, t);
    characterLayer(ctx, t);
    weatherLayer(ctx, t);
    P.draw(ctx);
    if (G.fish.state === "fighting") fightLayer(ctx);
    ctx.restore();
  };

  R.hud = function (ctx, dt, inScene) {
    if (inScene) hudLayer(ctx);   // harbor chips would cover screen panels
    resultLayer(ctx, dt);
  };
})();
