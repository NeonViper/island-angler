// ============================================================
// audio.js — fully procedural WebAudio: SFX + generative
// day/night music. No sample files. Created on first gesture.
// ============================================================

(function () {
  var A = FG.audio = {};
  var ctx = null, master = null, musicGain = null, sfxGain = null;
  var musicTimer = null, musicOn = false;
  var night = false;
  var A2 = { music: 0.55, sfx: 0.8 }; // volumes 0..1

  A.init = function () {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = A2.music; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = A2.sfx; sfxGain.connect(master);
  };
  A.resume = function () { if (ctx && ctx.state === "suspended") ctx.resume(); };
  A.suspend = function () { if (ctx && ctx.state === "running") ctx.suspend(); };

  function now() { return ctx.currentTime; }

  function tone(o) { // {f,f2,type,vol,delay,dur,attack,release,dest,detune}
    if (!ctx) return;
    var t0 = now() + (o.delay || 0);
    var osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    var g = ctx.createGain();
    var atk = o.attack === undefined ? 0.005 : o.attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(o.vol || 0.2, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g); g.connect(o.dest || sfxGain);
    osc.start(t0); osc.stop(t0 + o.dur + 0.02);
  }

  function noise(o) { // filtered noise burst
    if (!ctx) return;
    var t0 = now() + (o.delay || 0);
    var len = Math.max(1, Math.floor(ctx.sampleRate * o.dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = o.filter || "lowpass"; f.frequency.value = o.freq || 1000;
    if (o.q) f.Q.value = o.q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + o.dur);
    src.connect(f); f.connect(g); g.connect(o.dest || sfxGain);
    src.start(t0); src.stop(t0 + o.dur + 0.05);
  }

  // ---------------- SFX library ----------------
  A.click = function () { tone({ f: 660, f2: 880, type: "square", vol: 0.05, dur: 0.05 }); };
  A.back = function () { tone({ f: 500, f2: 330, type: "square", vol: 0.05, dur: 0.07 }); };
  A.open = function () {
    tone({ f: 320, f2: 640, type: "triangle", vol: 0.1, dur: 0.18 });
    tone({ f: 480, f2: 960, type: "sine", vol: 0.06, dur: 0.2, delay: 0.05 });
  };
  A.cast = function () {
    noise({ freq: 2400, dur: 0.25, vol: 0.12, delay: 0 });
    tone({ f: 220, f2: 90, type: "sine", vol: 0.1, dur: 0.3 });
  };
  A.splash = function (big) {
    noise({ freq: big ? 900 : 1600, filter: "lowpass", dur: big ? 0.35 : 0.18, vol: big ? 0.28 : 0.16 });
    tone({ f: big ? 140 : 260, f2: big ? 60 : 120, type: "sine", vol: big ? 0.16 : 0.08, dur: big ? 0.4 : 0.2 });
  };
  A.bite = function () {
    tone({ f: 740, f2: 620, type: "triangle", vol: 0.16, dur: 0.09 });
    tone({ f: 740, f2: 620, type: "triangle", vol: 0.16, dur: 0.09, delay: 0.13 });
    tone({ f: 920, f2: 700, type: "triangle", vol: 0.18, dur: 0.12, delay: 0.26 });
  };
  A.reel = function () { tone({ f: 180, f2: 240, type: "sawtooth", vol: 0.03, dur: 0.06 }); };
  A.tick = function () { tone({ f: 1200, type: "square", vol: 0.02, dur: 0.02 }); };
  A.snap = function () {
    noise({ freq: 5000, filter: "highpass", dur: 0.08, vol: 0.3 });
    tone({ f: 900, f2: 120, type: "sawtooth", vol: 0.15, dur: 0.18 });
  };
  A.fight = function (struggle) {
    tone({ f: 120 + struggle * 180, f2: 90, type: "sawtooth", vol: 0.02 + struggle * 0.05, dur: 0.12 });
  };
  A.win = function () {
    var n = [523, 659, 784, 1047, 1319];
    for (var i = 0; i < n.length; i++)
      tone({ f: n[i], type: "triangle", vol: 0.14, dur: 0.35, delay: i * 0.09, attack: 0.01 });
    tone({ f: 2093, type: "sine", vol: 0.05, dur: 0.5, delay: 0.45 });
  };
  A.lose = function () {
    var n = [440, 370, 294, 220];
    for (var i = 0; i < n.length; i++)
      tone({ f: n[i], type: "triangle", vol: 0.1, dur: 0.3, delay: i * 0.13 });
  };
  A.coin = function () {
    tone({ f: 988, type: "square", vol: 0.06, dur: 0.06 });
    tone({ f: 1319, type: "square", vol: 0.06, dur: 0.1, delay: 0.06 });
  };
  A.levelup = function () {
    var n = [523, 587, 659, 784, 880, 1047];
    for (var i = 0; i < n.length; i++)
      tone({ f: n[i], type: "square", vol: 0.05, dur: 0.12, delay: i * 0.05 });
    tone({ f: 1568, type: "triangle", vol: 0.1, dur: 0.6, delay: 0.35 });
  };
  A.achieve = function () {
    tone({ f: 784, type: "sine", vol: 0.12, dur: 0.4 });
    tone({ f: 1175, type: "sine", vol: 0.12, dur: 0.4, delay: 0.1 });
    tone({ f: 1568, type: "sine", vol: 0.1, dur: 0.7, delay: 0.2 });
  };
  A.buy = function () { A.coin(); tone({ f: 659, type: "triangle", vol: 0.08, dur: 0.15, delay: 0.08 }); };
  A.error = function () { tone({ f: 200, f2: 150, type: "square", vol: 0.08, dur: 0.15 }); };
  A.thunder = function () {
    noise({ freq: 300, filter: "lowpass", dur: 1.4, vol: 0.25 });
    tone({ f: 60, f2: 30, type: "sine", vol: 0.2, dur: 1.6 });
  };
  A.rainLoop = function (on) {
    if (!ctx) return;
    if (on && !A._rain) {
      var len = Math.floor(ctx.sampleRate * 2);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      var f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 6000; f.Q.value = 0.5;
      var g = ctx.createGain(); g.gain.value = 0.05;
      src.connect(f); f.connect(g); g.connect(sfxGain);
      src.start(); A._rain = { s: src, g: g };
    } else if (!on && A._rain) {
      A._rain.s.stop(); A._rain = null;
    }
  };

  // ---------------- generative music ----------------
  // Simple pentatonic music-box: melody + bass, day & night moods.
  var DAY_SCALE = [0, 2, 4, 7, 9, 12, 14];   // major pentatonic
  var NIGHT_SCALE = [0, 2, 3, 5, 7, 9, 12];  // minor-ish
  var ROOT = 220; // A3
  var step = 0;

  function noteFreq(semi) { return ROOT * Math.pow(2, semi / 12); }

  function musicStep() {
    if (!ctx || !musicOn) return;
    var scale = night ? NIGHT_SCALE : DAY_SCALE;
    var bar = Math.floor(step / 8) % 4;
    // melody
    if (step % 2 === 0) {
      var deg = Math.floor(Math.random() * scale.length);
      var oct = Math.random() < 0.2 ? 12 : 0;
      tone({ f: noteFreq(scale[deg] + oct), type: "triangle", vol: 0.045, dur: 0.55, attack: 0.01, dest: musicGain });
    }
    // bass every 4 steps
    if (step % 4 === 0) {
      var bassNotes = night ? [0, -5, -2, -7] : [0, 5, 7, 3];
      tone({ f: noteFreq(bassNotes[bar % 4] - 12), type: "sine", vol: 0.055, dur: 1.1, attack: 0.02, dest: musicGain });
    }
    // shimmer
    if (Math.random() < (night ? 0.18 : 0.1))
      tone({ f: noteFreq(scale[scale.length - 1] + 24), type: "sine", vol: 0.015, dur: 1.2, delay: 0.1, dest: musicGain });
    step++;
    musicTimer = setTimeout(musicStep, 340);
  }

  A.startMusic = function () {
    if (!ctx || musicOn) return;
    musicOn = true; step = 0; musicStep();
  };
  A.stopMusic = function () { musicOn = false; if (musicTimer) clearTimeout(musicTimer); };
  A.setNight = function (isNight) { if (isNight !== night) night = isNight; };
  A.setVol = function (which, v) {
    v = FG.clamp(v, 0, 1);
    if (which === "music") { A2.music = v; if (musicGain) musicGain.gain.value = v; }
    else { A2.sfx = v; if (sfxGain) sfxGain.gain.value = v; }
  };
  A.getVol = function (which) { return which === "music" ? A2.music : A2.sfx; };
})();
