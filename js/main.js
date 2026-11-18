// ============================================================
// main.js - canvas bootstrap, fixed render loop, input router.
// Everything hangs off the FG namespace; no globals leak.
// ============================================================

(function () {
  var U = FG.ui, G = FG.game, SC = FG.screens, A = FG.audio, S = FG.save;

  // ---------------- canvas ----------------
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var vw = window.innerWidth, vh = window.innerHeight;
    // integer scale when possible so pixels stay crisp
    var scale = Math.min(vw / FG.W, vh / FG.H);
    if (scale >= 1) scale = Math.max(1, Math.floor(scale * 2) / 2);
    var cssW = Math.floor(FG.W * scale), cssH = Math.floor(FG.H * scale);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(FG.W * dpr);
    canvas.height = Math.round(FG.H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener("resize", fitCanvas);
  fitCanvas();

  // ---------------- input ----------------
  function toLogical(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (FG.W / r.width),
      y: (clientY - r.top) * (FG.H / r.height)
    };
  }

  var spaceHeld = false, pointerHeld = false;

  function pressAction() {
    if (U.confirmData) return;               // modal swallows everything
    if (SC.isOpen()) return;                 // menus: buttons only
    var st = G.fish.state;
    if (st === "idle") G.startCharge();
    else if (st === "bite") G.hookAttempt();
    else if (st === "fighting") G.setReeling(true);
  }
  function releaseAction() {
    var st = G.fish.state;
    if (st === "charging") G.releaseCast();
    else if (st === "fighting") G.setReeling(false);
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (FG.paused) { e.preventDefault(); return; } // rotate lock swallows all input
    A.init(); A.resume();
    var p = toLogical(e.clientX, e.clientY);
    U.mouse.x = p.x; U.mouse.y = p.y;
    U.mouseIsDown = true;
    pointerHeld = true;
    // give the click a chance to hit a widget first; fishing input
    // is only for the open harbor view.
    // pressAction itself ignores states it doesn't handle (flying, waiting…)
    if (!SC.isOpen() && !U.confirmData && !hitWidget(p)) pressAction();
    e.preventDefault();
  });
  window.addEventListener("pointerup", function (e) {
    if (FG.paused) { U.mouseIsDown = false; pointerHeld = false; return; }
    var p = toLogical(e.clientX, e.clientY);
    U.mouse.x = p.x; U.mouse.y = p.y;
    var consumed = U.click(p.x, p.y);
    U.mouseIsDown = false;
    if (pointerHeld && (!consumed || G.fish.state === "charging")) releaseAction();
    pointerHeld = false;
  });
  canvas.addEventListener("pointermove", function (e) {
    var p = toLogical(e.clientX, e.clientY);
    U.mouse.x = p.x; U.mouse.y = p.y;
  });
  canvas.addEventListener("wheel", function (e) {
    U.wheel(e.deltaY > 0 ? 1 : -1);
    e.preventDefault();
  }, { passive: false });

  // Does a widget cover this point right now? (regions from last frame)
  function hitWidget(p) { return U.hitTest(p.x, p.y); }

  // touch: prevent double-tap zoom etc.
  document.addEventListener("touchstart", function (e) {
    if (e.target === canvas) e.preventDefault();
  }, { passive: false });

  // ---------------- keyboard ----------------
  var HOTKEYS = { Digit1: "shop", Digit2: "collection", Digit3: "quests", Digit4: "trophies", Digit5: "profile", Digit6: "pause" };

  window.addEventListener("keydown", function (e) {
    if (FG.paused) return; // rotate lock: no keyboard either
    A.init(); A.resume();
    var k = e.code;
    if (k === "Space") {
      e.preventDefault();
      if (!spaceHeld) { spaceHeld = true; pressAction(); }
      return;
    }
    if (k === "KeyM") { toggleMute(); return; }
    if (k === "Slash" || k === "KeyH" || k === "F1") {
      if (SC.current() === "help") SC.close(); else SC.open("help");
      return;
    }
    if (HOTKEYS[k]) {
      if (SC.current() === "title") return;
      SC.open(HOTKEYS[k]);
      return;
    }
    if (k === "Escape" || k === "Backspace") {
      e.preventDefault();
      if (U.confirmData) { U.confirmData = null; A.back(); return; }
      if (SC.isOpen()) SC.close();
      else SC.open("pause");
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      if (spaceHeld) { spaceHeld = false; releaseAction(); }
    }
  });

  var muted = false, volBackup = null;
  function toggleMute() {
    if (!muted) {
      volBackup = { music: A.getVol("music"), sfx: A.getVol("sfx") };
      A.setVol("music", 0); A.setVol("sfx", 0);
      A.stopMusic();
      muted = true;
      U.toast("SOUND OFF", "#8fa8c2");
    } else {
      A.setVol("music", volBackup ? volBackup.music : 0.55);
      A.setVol("sfx", volBackup ? volBackup.sfx : 0.8);
      if (SC.current() !== "title") A.startMusic();
      muted = false;
      U.toast("SOUND ON", "#4ec26b");
    }
  }

  // ---------------- save on exit ----------------
  function saveNow() { if (SC.current() !== "title") S.save(); }
  window.addEventListener("beforeunload", saveNow);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") saveNow();
  });

  // ---------------- rotate lock ----------------
  // Touch devices (phones/tablets) must be in landscape: a full-screen modal
  // demands rotation, the sim freezes behind it, and it dismisses the instant
  // the device turns sideways. Desktop (fine pointer) is never locked.
  var ROT = FG.rotate = { needed: false, refresh: applyOrientation };
  var mqPortrait = window.matchMedia("(orientation: portrait)");

  function isTouchForm() {
    return window.matchMedia("(pointer: coarse)").matches &&
      (navigator.maxTouchPoints || 0) > 0;
  }

  function applyOrientation() {
    var need = isTouchForm() && mqPortrait.matches;
    if (need === ROT.needed) return;
    ROT.needed = need;
    FG.paused = need;
    document.body.classList.toggle("portraitLock", need);
    if (need) { saveNow(); A.suspend(); }
    else { A.resume(); }
  }

  if (mqPortrait.addEventListener) mqPortrait.addEventListener("change", applyOrientation);
  else mqPortrait.addListener(applyOrientation); // iOS < 14
  window.addEventListener("orientationchange", applyOrientation);
  window.addEventListener("resize", applyOrientation);
  applyOrientation(); // device may already be portrait at boot

  // ---------------- main loop ----------------
  var last = performance.now();

  function frame(now) {
    var dt = (now - last) / 1000;
    last = now;
    if (FG.paused) { requestAnimationFrame(frame); return; } // rotate-lock: freeze sim, hold last frame
    if (dt > 0.1) dt = 0.1; // browser tab was sleeping / hitched
    FG.tGlobal = (FG.tGlobal || 0) + dt;

    // ---- update ----
    var onHarbor = !SC.isOpen() || SC.current() === "pause";
    if (S.state && SC.current() !== "title") G.update(dt);
    FG.particles.update(dt);
    U.updateToasts(dt);

    // ---- draw ----
    U.beginFrame();
    if (S.state && SC.current() !== "title") {
      FG.render.scene(ctx, dt);
    } else {
      ctx.fillStyle = "#101826";
      ctx.fillRect(0, 0, FG.W, FG.H);
    }
    SC.draw(ctx, dt);
    if (S.state && SC.current() !== "title") {
      FG.render.hud(ctx, dt, SC.current() === "harbor" || SC.current() === "pause");
      if (SC.current() === "harbor") SC.hotbar(ctx);
    }
    U.drawConfirm(ctx);
    U.drawToasts(ctx);

    requestAnimationFrame(frame);
  }

  // boot: load (or mint) save state so title can check for it
  S.load();
  requestAnimationFrame(frame);

  // ---------------- PWA: service worker + install prompt ----------------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline is optional */ });
    });
  }

  var deferredBip = null;
  var IS_IOS = /iPhone|iPad|iPod/.test(navigator.platform) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var STANDALONE = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  var INST = FG.install = {
    available: false,          // show the harbor install chip
    isStandalone: STANDALONE,
    deferred: null,
    request: function () {
      if (deferredBip) {
        deferredBip.prompt();
        return deferredBip.userChoice.then(function (choice) {
          deferredBip = null;
          INST.available = false;
          if (choice.outcome === "accepted") U.toast("ISLAND ANGLER INSTALLED", "#4ec26b");
        });
      }
      // iOS: no prompt API - tell the user the manual path
      U.toast("TAP SHARE, THEN 'ADD TO HOME SCREEN'", "#ffd94a", 5);
      return Promise.resolve();
    }
  };

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredBip = e;
    INST.available = true;
  });
  window.addEventListener("appinstalled", function () {
    INST.available = false;
    deferredBip = null;
  });
  // iOS never fires beforeinstallprompt; offer the manual hint once on the harbor
  if (IS_IOS && !STANDALONE) {
    INST.available = true;
    INST.request = function () {
      U.toast("TAP SHARE, THEN 'ADD TO HOME SCREEN'", "#ffd94a", 5);
      return Promise.resolve();
    };
  }

  // test/debug seam: drive the game headlessly from the console
  FG.debug = {
    frame: function (dt) { last -= dt * 1000; frame(last + dt * 1000); },
    press: pressAction, release: releaseAction
  };
})();
