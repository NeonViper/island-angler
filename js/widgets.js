// ============================================================
// widgets.js - immediate-mode UI: panels, buttons, lists,
// meters, toasts. All pixel-styled, no DOM overlays.
// ============================================================

(function () {
  var U = FG.ui = {};
  var F = FG.font;

  U.mouse = { x: 0, y: 0, downX: 0, downY: 0 };
  var regions = [];   // click targets registered each frame
  var hoverId = null;

  U.beginFrame = function () { regions = []; };

  function pointIn(px, py, r) {
    return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
  }

  // ---------------- panels ----------------
  U.panel = function (ctx, x, y, w, h, o) {
    o = o || {};
    var accent = o.accent || "#3b6a8f";
    // drop shadow
    ctx.fillStyle = "rgba(5,10,18,0.45)";
    ctx.fillRect(x + 3, y + 3, w, h);
    // body
    U.notchPanel(ctx, x, y, w, h, "rgba(16,24,36,0.94)");
    U.notchPanel(ctx, x + 2, y + 2, w - 4, h - 4, "rgba(24,36,52,0.97)");
    FG.rectOutline(ctx, x + 1, y + 1, w - 2, h - 2, accent);
    FG.rectOutline(ctx, x + 3, y + 3, w - 6, h - 6, FG.shadeHex(accent, -0.45));
    if (o.title) {
      // title ribbon
      var tw = F.w(o.title, 1) + 16;
      ctx.fillStyle = accent;
      ctx.fillRect(x + 10, y - 7, tw, 14);
      ctx.fillStyle = FG.shadeHex(accent, 0.25);
      ctx.fillRect(x + 10, y - 7, tw, 1);
      ctx.fillStyle = FG.shadeHex(accent, -0.4);
      ctx.fillRect(x + 10, y + 6, tw, 1);
      F.draw(ctx, o.title, x + 10 + tw / 2, y - 3, "#ffffff", 1, { align: "center" });
    }
  };

  // rounded-look panel silhouette (notched corners)
  U.notchPanel = function (ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x + 1, y, w - 2, h);
    ctx.fillRect(x, y + 1, w, h - 2);
    // notch corners
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + w - 1, y, 1, 1);
    ctx.fillRect(x, y + h - 1, 1, 1); ctx.fillRect(x + w - 1, y + h - 1, 1, 1);
    ctx.restore();
  };

  // ---------------- buttons ----------------
  var BTN_STYLES = {
    normal: { fill: "#27435f", hi: "#31567a", lo: "#1c3249", text: "#e8f0f8", border: "#5d87b0" },
    gold:   { fill: "#6e5313", hi: "#8a6a1e", lo: "#52400e", text: "#ffe48a", border: "#e8b71f" },
    green:  { fill: "#1f5537", hi: "#2a6e46", lo: "#173f2a", text: "#c8f0d2", border: "#4ec26b" },
    red:    { fill: "#6e2723", hi: "#8a322d", lo: "#521b18", text: "#f2c8c2", border: "#e87a6e" }
  };

  U.btn = function (ctx, x, y, w, h, label, o) {
    o = o || {};
    var style = BTN_STYLES[o.style] || BTN_STYLES.normal;
    var enabled = o.enabled !== false;
    var hovered = enabled && pointIn(U.mouse.x, U.mouse.y, { x: x, y: y, w: w, h: h });
    var pressed = hovered && U.mouseIsDown;
    var fill = pressed ? style.lo : (hovered ? style.hi : style.fill);
    if (!enabled) fill = "#2a3138";

    ctx.fillStyle = "rgba(5,10,18,0.5)";
    ctx.fillRect(x + 1, y + 2, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = FG.shadeHex(enabled ? (pressed || hovered ? style.hi : style.fill) : "#2a3138", 0.18);
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = "rgba(10,15,25,0.4)";
    ctx.fillRect(x, y + h - 1, w, 1);
    FG.rectOutline(ctx, x, y, w, h, enabled ? style.border : "#46525c");
    var ty = y + (h - 7) / 2 + (pressed ? 1 : 0);
    F.draw(ctx, label, x + w / 2, ty, enabled ? style.text : "#6b7680", 1, { align: "center" });

    regions.push({ x: x, y: y, w: w, h: h, cb: o.cb, enabled: enabled, sound: o.sound !== false });
    return hovered;
  };

  // click dispatch - called by main on pointer up
  U.click = function (x, y) {
    for (var i = regions.length - 1; i >= 0; i--) {
      var r = regions[i];
      if (pointIn(x, y, r)) {
        if (r.enabled) {
          if (r.sound) FG.audio.click();
          if (r.cb) r.cb();
          return true;
        }
        return false; // blocked disabled button (absorbs click)
      }
    }
    return false;
  };

  // ---------------- meters / bars ----------------
  U.meter = function (ctx, x, y, w, h, val, color, bg, label) {
    ctx.fillStyle = "rgba(8,14,22,0.9)";
    ctx.fillRect(x, y, w, h);
    FG.rectOutline(ctx, x, y, w, h, "rgba(90,120,150,0.8)");
    if (val > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y + 2, Math.max(1, Math.round((w - 4) * FG.clamp(val, 0, 1))), h - 4);
      ctx.fillStyle = FG.shadeHex(color, 0.25);
      ctx.fillRect(x + 2, y + 2, Math.max(1, Math.round((w - 4) * FG.clamp(val, 0, 1))), 1);
    }
    if (label) F.draw(ctx, label, x + 3, y + (h - 7) / 2, "#e8f0f8", 1);
  };

  U.vgradBar = function (ctx, x, y, w, h, val, colTop, colBot) {
    ctx.fillStyle = "rgba(8,14,22,0.9)";
    ctx.fillRect(x, y, w, h);
    if (val > 0) {
      for (var i = 0; i < h - 4; i++) {
        ctx.fillStyle = FG.mix(colTop, colBot, i / Math.max(1, h - 4));
        var hh = 1;
        if (i < (h - 4) * FG.clamp(val, 0, 1)) ctx.fillRect(x + 2, y + 2 + i, w - 4, hh);
      }
    }
    FG.rectOutline(ctx, x, y, w, h, "rgba(90,120,150,0.8)");
  };

  // ---------------- tab bar ----------------
  U.tabs = function (ctx, x, y, tabs, current, onPick, w) {
    var tx = x, tw = w || 64;
    for (var i = 0; i < tabs.length; i++) {
      var active = i === current;
      var h = active ? 15 : 13;
      var style = active ? BTN_STYLES.gold : BTN_STYLES.normal;
      ctx.fillStyle = active ? "#3f3010" : "rgba(20,30,42,0.9)";
      ctx.fillRect(tx, y + (15 - h), tw, h);
      FG.rectOutline(ctx, tx, y + (15 - h), tw, h, active ? style.border : "#31435a");
      F.draw(ctx, tabs[i], tx + tw / 2, y + (15 - h) + (h - 7) / 2 + 1, active ? "#ffe48a" : "#8fa8c2", 1, { align: "center" });
      regions.push({ x: tx, y: y, w: tw, h: 15, enabled: true, cb: (function (idx) { return function () { onPick(idx); }; })(i) });
      tx += tw + 2;
    }
  };

  // ---------------- scroll state ----------------
  var scrollState = {};
  U.scroll = function (key) {
    if (!scrollState[key]) scrollState[key] = { y: 0 };
    return scrollState[key];
  };
  U.wheel = function (dy) {
    // apply to the scroll region under the mouse
    for (var i = regions.length - 1; i >= 0; i--) {
      var r = regions[i];
      if (r.scroll && pointIn(U.mouse.x, U.mouse.y, r)) {
        var st = scrollState[r.scroll];
        if (st) st.y = FG.clamp(st.y + dy * 22, 0, r.maxScroll || 0);
        return true;
      }
    }
    return false;
  };
  U.region = function (r) { regions.push(r); };

  // true if a widget registered this frame covers (x,y)
  U.hitTest = function (x, y) {
    for (var i = 0; i < regions.length; i++) {
      if (pointIn(x, y, regions[i])) return true;
    }
    return false;
  };

  // ---------------- toasts ----------------
  U.toasts = [];
  U.toast = function (text, color, ttl) {
    U.toasts.push({ text: String(text).toUpperCase(), color: color || "#e8f0f8", ttl: ttl || 3, t: 0 });
    if (U.toasts.length > 6) U.toasts.shift();
  };
  U.updateToasts = function (dt) {
    for (var i = U.toasts.length - 1; i >= 0; i--) {
      var t = U.toasts[i];
      t.t += dt;
      if (t.t > t.ttl) U.toasts.splice(i, 1);
    }
  };
  U.drawToasts = function (ctx) {
    var y = 10;
    for (var i = 0; i < U.toasts.length; i++) {
      var t = U.toasts[i];
      var appear = FG.clamp(t.t / 0.15, 0, 1);
      var gone = FG.clamp((t.ttl - t.t) / 0.3, 0, 1);
      ctx.globalAlpha = Math.min(appear, gone);
      var w = F.w(t.text, 1) + 14;
      var x = FG.W / 2 - w / 2;
      ctx.fillStyle = "rgba(10,16,26,0.9)";
      ctx.fillRect(x, y, w, 15);
      FG.rectOutline(ctx, x, y, w, 15, t.color);
      ctx.fillStyle = t.color;
      ctx.fillRect(x + 1, y + 1, w - 2, 1);
      F.draw(ctx, t.text, FG.W / 2, y + 4, t.color, 1, { align: "center" });
      y += 19;
    }
    ctx.globalAlpha = 1;
  };

  // ---------------- confirm modal ----------------
  U.confirmData = null;
  U.confirm = function (title, text, onYes) {
    U.confirmData = { title: title, text: text, onYes: onYes };
    FG.audio.open();
  };
  U.drawConfirm = function (ctx) {
    if (!U.confirmData) return false;
    var d = U.confirmData;
    ctx.fillStyle = "rgba(4,8,14,0.6)";
    ctx.fillRect(0, 0, FG.W, FG.H);
    var w = 240, h = 90, x = FG.W / 2 - w / 2, y = FG.H / 2 - h / 2;
    U.panel(ctx, x, y, w, h, { title: d.title, accent: "#e87a6e" });
    F.drawWrapped(ctx, d.text, x + w / 2, y + 18, "#c8d6e2", 1, w - 30, 1, { align: "center" });
    U.btn(ctx, x + 20, y + h - 24, 80, 17, "YES", { style: "red", cb: function () {
      var cb = d.onYes; U.confirmData = null; if (cb) cb();
    } });
    U.btn(ctx, x + w - 100, y + h - 24, 80, 17, "NO", { cb: function () { U.confirmData = null; } });
    return true;
  };

  U.mouseIsDown = false;
})();
