// ============================================================
// save.js — localStorage persistence with schema defaults.
// ============================================================

(function () {
  var S = FG.save = {};
  var KEY = "island_angler_save_v1";

  S.defaultState = function () {
    return {
      v: 1,
      coins: 30,
      xp: 0, level: 1,
      owned: { rod_wood: 1, reel_basic: 1, line_hemp: 1 },
      equipped: { rod: "rod_wood", reel: "reel_basic", line: "line_hemp" },
      bait: { worm: 9999, tropical: 0, shiny: 0, deep: 0, mystic: 0 },
      selectedBait: "worm",
      // caught[fishId] = { n, bestKg, bestCm, firstAt }
      caught: {},
      trophies: [],          // [{id, kg, cm, date}] max 18
      releases: {},          // fishId -> count released to aquarium? (kept fish)
      stats: {
        totalCaught: 0, misses: 0, rareCaught: 0, epicCaught: 0,
        legendaryCaught: 0, mythicalCaught: 0, heavyCatch: 0,
        cleanStreak: 0, bestStreak: 0, biggestKg: 0, perfectCaught: 0,
        nightsCaught: 0, spent: 0, earned: 0, castCount: 0
      },
      challenge: { prog: {}, claimed: {} },   // prog per id, claimed count
      achievements: {},                        // id -> true
      settings: { music: 0.55, sfx: 0.8, shake: true },
      playtime: 0,
      savedAt: 0
    };
  };

  S.state = null;

  S.has = function () {
    try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
  };

  S.load = function () {
    var st = null;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) st = JSON.parse(raw);
    } catch (e) { st = null; }
    var def = S.defaultState();
    if (!st || st.v !== def.v) st = def;
    // deep-ish merge for forward compat
    for (var k in def) if (st[k] === undefined) st[k] = def[k];
    for (k in def.owned) if (st.owned[k] === undefined) st.owned[k] = def.owned[k];
    for (k in def.bait) if (st.bait[k] === undefined) st.bait[k] = def.bait[k];
    for (k in def.stats) if (st.stats[k] === undefined) st.stats[k] = def.stats[k];
    for (k in def.settings) if (st.settings[k] === undefined) st.settings[k] = def.settings[k];
    if (!st.challenge.prog) st.challenge.prog = {};
    if (!st.challenge.claimed) st.challenge.claimed = {};
    S.state = st;
    return st;
  };

  S.save = function () {
    if (!S.state) return;
    S.state.savedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(S.state));
      return true;
    } catch (e) {
      console.warn("save failed", e);
      return false;
    }
  };

  S.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    S.state = S.defaultState();
  };

  // ---------------- derived helpers ----------------
  S.level = function () { return S.state.level; };

  S.speciesDiscovered = function () {
    var n = 0;
    for (var id in S.state.caught) n++;
    return n;
  };

  S.rankIndex = function () {
    var st = S.state.stats;
    var r = 0;
    if (st.totalCaught >= 10) r = 1;
    if (S.speciesDiscovered() >= 10) r = 2;
    if (st.rareCaught >= 3) r = 3;
    if (st.epicCaught >= 1) r = 4;
    if (st.legendaryCaught >= 1) r = 5;
    return r;
  };

  S.rodTier = function () {
    var r = FG.EQUIP.rods.filter(function (x) { return x.id === S.state.equipped.rod; })[0];
    return r ? r.tier : 1;
  };
  S.getRod = function () {
    return FG.EQUIP.rods.filter(function (x) { return x.id === S.state.equipped.rod; })[0] || FG.EQUIP.rods[0];
  };
  S.getReel = function () {
    return FG.EQUIP.reels.filter(function (x) { return x.id === S.state.equipped.reel; })[0] || FG.EQUIP.reels[0];
  };
  S.getLine = function () {
    return FG.EQUIP.lines.filter(function (x) { return x.id === S.state.equipped.line; })[0] || FG.EQUIP.lines[0];
  };
  S.getBait = function () {
    return FG.EQUIP.baits.filter(function (x) { return x.id === S.state.selectedBait; })[0] || FG.EQUIP.baits[0];
  };
})();
