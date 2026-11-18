// ============================================================
// game.js - game state machine, fishing loop, economy,
// progression, weather, day/night clock.
// ============================================================

(function () {
  var G = FG.game = {};
  var S = FG.save;            // namespace
  function SV() { return S.state; } // live save state

  // ---------------- clock & weather ----------------
  G.DAY_LEN = 420; // seconds per full day cycle
  G.time = { phase: 0.06, day: 1, t: 0 };

  G.WEATHERS = [
    { kind: "sunny",  w: 55, bite: 1.00, name: "SUNNY",  icon: "sun" },
    { kind: "cloudy", w: 25, bite: 0.95, name: "CLOUDY", icon: "cloud" || "gear" },
    { kind: "rainy",  w: 14, bite: 1.15, name: "RAIN",   icon: "rain" },
    { kind: "storm",  w: 6,  bite: 1.30, name: "STORM",  icon: "bolt" }
  ];
  G.weather = { kind: "sunny", bite: 1, timer: 140, flash: 0 };

  function rollWeather() {
    var items = G.WEATHERS.map(function (x) { return { x: x, w: x.w }; });
    var pick = FG.pickWeighted(items).x;
    if (pick.kind === G.weather.kind) pick = G.WEATHERS[0];
    G.weather.kind = pick.kind;
    G.weather.bite = pick.bite;
    G.weather.timer = FG.rand(90, 220);
    if (pick.kind === "rainy" || pick.kind === "storm") FG.audio.rainLoop(true);
    else FG.audio.rainLoop(false);
    FG.ui.toast("WEATHER: " + pick.name, "#c2ced9");
  }

  G.isDay = function () {
    var p = G.time.phase;
    return p < 0.52; // dawn+day+sunset
  };
  G.timeName = function () { return FG.timeOfDayName(G.time.phase); };

  // ---------------- fishing states ----------------
  // idle -> charging -> flying -> waiting -> bite -> hooking -> fighting -> resolve(caught/lost) -> idle
  G.fish = { state: "idle", t: 0 };

  G.cast = { power: 0, dir: 1, active: false };
  G.bobber = { x: 0, y: 0, depth: 0, vy: 0, flight: 0, targetX: 0, targetY: 0, sx: 0, sy: 0 };
  G.current = null;   // species being fought
  G.fight = null;
  G.result = null;    // pending catch result for post panel
  G.pending = null;   // bite target species (rolled at bite start)
  G.biteT = 0;
  G.hint = "";

  var CHARGE_DUR = 1.25, FLY_DUR = 0.55;

  // ---------------- lifecycle ----------------
  G.newGame = function () {
    if (!S.state) S.load();
    G.time.phase = 0.06; G.time.day = 1; G.time.t = 0;
    G.weather.kind = "sunny"; G.weather.bite = 1; G.weather.timer = 150;
    G.toIdle();
    FG.audio.setVol("music", SV().settings.music);
    FG.audio.setVol("sfx", SV().settings.sfx);
  };

  G.toIdle = function () {
    G.fish.state = "idle"; G.fish.t = 0;
    G.cast.active = false; G.cast.power = 0;
    G.current = null; G.fight = null; G.pending = null;
    G.result = null;
    G.hint = "HOLD TO CAST";
  };

  // ---------------- input entry points ----------------
  G.startCharge = function () {
    if (G.fish.state !== "idle") return;
    G.fish.state = "charging"; G.fish.t = 0;
    G.cast.power = 0; G.cast.dir = 1; G.cast.active = true;
    G.hint = "RELEASE AT GREEN";
  };

  G.releaseCast = function () {
    if (G.fish.state !== "charging") return;
    var p = FG.clamp(G.cast.power, 0.05, 1);
    G.fish.state = "flying"; G.fish.t = 0; G.cast.active = false;
    // bait consumption
    var bait = S.getBait();
    if (bait.id !== "worm") {
      if ((SV().bait[bait.id] | 0) <= 0) {
        // fall back to worm mid-flow
        SV().selectedBait = "worm";
        bait = S.getBait();
      } else { SV().bait[bait.id]--; }
    }
    SV().stats.castCount++;
    // launch bobber from rod tip area
    var b = G.bobber;
    b.sx = 315; b.sy = 168; b.flight = 0;
    b.targetX = 330 + p * 265;
    b.targetY = 255 - p * 112;
    b.depth = FG.clamp(0.1 + p * 0.72 + FG.rand(-0.08, 0.12), 0, 1);
    b.x = b.sx; b.y = b.sy;
    G.hint = "...";
    FG.audio.cast();
    FG.particles.splash(b.sx, b.sy, 0);
  };

  G.hookAttempt = function () {
    if (G.fish.state !== "bite") return;
    var remaining = 1.0 + FG.save.getRod().hook * 0.6 - G.biteT;
    // luck affects chance bite becomes hookable catch: rod hook bonus raises window (above), plus small instant-fail chance at low rod tiers
    G.fish.state = "hooking"; G.fish.t = 0;
    var ok = Math.random() < (0.75 + FG.save.getRod().hook * 0.25 + SV().level * 0.01);
    G.hookOk = ok;
    G.hint = ok ? "!" : "...";
    FG.audio.splash(true);
    FG.particles.splash(G.bobber.x, G.bobber.y, 2);
  };

  // ---------------- fish selection ----------------
  function timeTag() { return G.isDay() ? "day" : "night"; }

  G.rollFish = function () {
    var rodTier = FG.save.rodTier(), rod = FG.save.getRod();
    var bait = FG.save.getBait();
    var luck = rod.luck + SV().level * 0.012;
    var depth = G.bobber.depth;
    var ttag = timeTag();
    var weights = [], pool = [];
    for (var i = 0; i < FG.FISH.length; i++) {
      var f = FG.FISH[i];
      if (SV().level < f.levelReq || rodTier < f.rodMin) continue;
      if (f.time !== "any" && f.time !== ttag) continue;
      var rl = FG.rarityIdx[f.rarity];
      var bm = (FG.BAIT_RARITY[bait.id] || [1, 1, 1, 1, 1, 1])[rl];
      if (bm <= 0) continue;
      // depth overlap weight
      var lo = f.depth[0], hi = f.depth[1];
      var ov = Math.min(hi, depth + 0.18) - Math.max(lo, depth - 0.18);
      if (ov <= 0) ov = 0.04; // small chance outside its band
      var w = FG.RARITY_TABLE[rodTier][rl] * bm * (ov + 0.15);
      if (rl >= 2) w *= (1 + luck);
      if ((G.weather.kind === "storm") && rl >= 2) w *= 1.5;
      if ((G.weather.kind === "rainy") && rl >= 1) w *= 1.2;
      weights.push(w); pool.push(f);
    }
    if (!pool.length) return null;
    var total = 0; for (var k = 0; k < weights.length; k++) total += weights[k];
    var r = Math.random() * total;
    for (k = 0; k < weights.length; k++) { r -= weights[k]; if (r <= 0) return pool[k]; }
    return pool[pool.length - 1];
  };

  function rollSize(f) {
    var lvlF = SV().level / FG.MAX_LEVEL;
    var rr = Math.pow(Math.random(), 0.85 - lvlF * 0.25);
    var len = FG.lerp(f.lenMin, f.lenMax, rr);
    var lr = FG.clamp((len - f.lenMin) / Math.max(0.01, f.lenMax - f.lenMin), 0, 1);
    var kg = FG.lerp(f.wMin, f.wMax, Math.pow(lr, 1.7)) * FG.rand(0.92, 1.08);
    return { cm: len, kg: kg };
  }

  // ---------------- fight ----------------
  function startFight(f) {
    var d = f.difficulty;
    var reel = FG.save.getReel(), line = FG.save.getLine();
    G.current = f;
    G.fight = {
      t: 0,
      progress: 16,           // 0..100
      tension: 0.18,
      stamina: 36 + d * 7 + f.speed * 0.15,
      run: 0, runT: FG.rand(0.8, 1.8),
      maxT: 0.18, snaps: 0, snapT: 0,
      reelRate: 17 + reel.reel * 7 + SV().level * 0.25,
      control: reel.control, pull: line.pull, snapRes: line.snap,
      fishX: 0, fishVX: f.speed * 0.12, dir: 1,
      exhausted: false, warnT: 0
    };
    G.fish.state = "fighting"; G.fish.t = 0;
    G.hint = "HOLD TO REEL - RELEASE TO REST";
    FG.audio.fight(1);
  }

  var reeling = false;
  G.setReeling = function (down) {
    if (G.fish.state !== "fighting") { reeling = false; return; }
    reeling = down;
  };

  function updateFight(dt) {
    var ft = G.fight, f = G.current;
    ft.t += dt;
    // fish run schedule
    ft.runT -= dt;
    if (ft.runT <= 0) {
      if (ft.run > 0) {
        ft.run = 0; ft.runT = FG.rand(1.4, 3.4);
        FG.audio.tick();
      } else {
        ft.run = FG.rand(0.6, 1.3);
        ft.runT = ft.run;
        FG.audio.fight(2);
      }
    }
    var struggling = ft.run > 0 && ft.stamina > 0;
    var struggle = struggling ? 1 + f.difficulty * 0.12 : 0.35;
    if (ft.exhausted) struggle *= 0.12;
    if (struggling) ft.stamina -= dt * 1.4;
    // fish lateral wander for animation
    ft.fishX += ft.dir * f.speed * 0.04 * dt;
    if (ft.fishX > 22) ft.dir = -1; if (ft.fishX < -22) ft.dir = 1;

    if (reeling) {
      var eff = 1 - ft.tension * 0.55;
      ft.progress += ft.reelRate * eff * dt;
      ft.tension += (0.20 + f.difficulty * 0.030) * struggle * (1 - ft.control * 0.45) * dt;
      ft.stamina -= dt * (0.55 + ft.reelRate * 0.03);
      if (Math.random() < dt * 14) FG.audio.reel();
    } else {
      ft.tension -= (0.45 + ft.pull * 0.3) * dt;
      ft.progress -= (2.5 + f.speed * 0.06 + f.difficulty * 0.35) * (ft.exhausted ? 0.35 : 1) * dt;
      ft.stamina += dt * 1.1;
    }
    ft.tension = FG.clamp(ft.tension, 0, 1.02);
    ft.progress = FG.clamp(ft.progress, 0, 100);
    ft.maxT = Math.max(ft.maxT, ft.tension);
    if (ft.stamina <= 0) { ft.exhausted = true; ft.stamina = 0; }
    if (ft.exhausted && reeling) ft.run = 0;

    // line stress
    if (ft.tension >= 0.92) {
      ft.warned = true;
      ft.snapT += dt * (1 - ft.snapRes * 0.55);
      ft.warnT = 0.2;
      if (ft.snapT > 0.45) { resolveLose("LINE SNAPPED"); return; }
    } else {
      ft.snapT = Math.max(0, ft.snapT - dt * 0.8);
    }
    ft.warnT -= dt;

    // slow time-out if fish drags player far away
    if (ft.progress <= 0) { resolveLose("THE LINE WENT SLACK - IT GOT AWAY"); return; }
    if (ft.progress >= 100) resolveCatch();
  }

  function resolveCatch() {
    var f = G.current;
    var ft = G.fight;
    var sz = rollSize(f);
    var grace = 1 - ft.maxT;
    var q = 0;
    if (grace > 0.72 && ft.snapT === 0 && !ft.warned) q = 3;
    else if (grace > 0.52) q = 2;
    else if (grace > 0.3) q = 1;
    var quality = FG.QUALITIES[q];
    var xp = Math.round(f.xp * quality.mult * FG.rand(0.9, 1.1));
    var coins = Math.round(f.value * quality.mult * FG.rand(0.95, 1.05));
    var first = !SV().caught[f.id];
    if (!SV().caught[f.id]) SV().caught[f.id] = { n: 0, bestKg: 0, bestCm: 0, firstAt: Date.now() };
    var rec = SV().caught[f.id];
    rec.n++;
    var isBest = sz.kg > rec.bestKg;
    if (sz.kg > rec.bestKg) rec.bestKg = sz.kg;
    if (sz.cm > rec.bestCm) rec.bestCm = sz.cm;

    var st = SV().stats;
    st.totalCaught++;
    st.biggestKg = Math.max(st.biggestKg, sz.kg);
    if (sz.kg >= 5) st.heavyCatch++;
    var ri = FG.rarityIdx[f.rarity];
    if (ri >= 2) st.rareCaught++;
    if (ri >= 3) st.epicCaught++;
    if (ri >= 4) st.legendaryCaught++;
    if (ri >= 5) st.mythicalCaught++;
    if (q === 3) st.perfectCaught++;
    if (!G.isDay()) st.nightsCaught++;
    st.cleanStreak++;
    st.bestStreak = Math.max(st.bestStreak, st.cleanStreak);

    // challenge progress (repeatable counters reset on claim)
    addProg("ch_catch5", 1);
    addProg("ch_heavy5", sz.kg >= 5 ? 1 : 0);
    addProg("ch_rare3", ri >= 2 ? 1 : 0);
    addProg("ch_streak10", 0, Math.max(SV().challenge.prog.ch_streak10 || 0, st.cleanStreak));
    if (!SV().challenge._sp) SV().challenge._sp = [];
    if (SV().challenge._sp.indexOf(f.id) < 0) { SV().challenge._sp.push(f.id); addProg("ch_species3", 1); }
    addProg("ch_discover15", 0, FG.save.speciesDiscovered());

    G.grantCoins(coins);
    G.grantXp(xp);
    FG.audio.win();

    G.result = { fish: f, cm: sz.cm, kg: sz.kg, quality: quality, xp: xp, coins: coins, first: first, isBest: isBest };
    G.fish.state = "caught"; G.fish.t = 0;
    G.hint = "";
    G.checkAchievements();
  }

  function resolveLose(reason) {
    var f = G.current;
    SV().stats.misses++;
    SV().stats.cleanStreak = 0;
    G.result = { fish: f, lost: true, reason: reason };
    G.fish.state = "lost"; G.fish.t = 0;
    FG.audio.lose();
    FG.ui.toast(reason || "IT GOT AWAY...", "#e87a6e");
  }

  function addProg(id, add, set) {
    var p = SV().challenge.prog;
    p[id] = set !== undefined ? set : ((p[id] || 0) + add);
  }

  // ---------------- rewards ----------------
  G.grantCoins = function (n) {
    SV().coins += n; SV().stats.earned += n;
  };
  G.grantXp = function (n) {
    SV().xp += n;
    while (SV().level < FG.MAX_LEVEL && SV().xp >= FG.xpForLevel(SV().level)) {
      SV().xp -= FG.xpForLevel(SV().level);
      SV().level++;
      FG.audio.levelup();
      FG.ui.toast("LEVEL UP! LEVEL " + SV().level, "#ffd94a", 4);
      notifyUnlocks();
    }
    G.checkAchievements();
  };

  function notifyUnlocks() {
    // shop items gated by level become purchasable - just inform once per level
    var list = FG.EQUIP.rods.concat(FG.EQUIP.reels, FG.EQUIP.lines, FG.EQUIP.baits);
    for (var i = 0; i < list.length; i++) {
      if (list[i].level === SV().level)
        FG.ui.toast("NEW ITEM UNLOCKED: " + list[i].name, "#4ec26b", 4);
    }
  }

  G.checkAchievements = function () {
    var st = SV().stats, disc = FG.save.speciesDiscovered(), total = FG.FISH.length;
    var conds = {
      ach_first: st.totalCaught >= 1,
      ach_rare: st.rareCaught >= 1,
      ach_epic: st.epicCaught >= 1,
      ach_legend: st.legendaryCaught >= 1,
      ach_myth: st.mythicalCaught >= 1,
      ach_half: disc >= total / 2,
      ach_all: disc >= total,
      ach_huge: st.biggestKg >= 20,
      ach_perfect: st.perfectCaught >= 1,
      ach_maxlevel: SV().level >= FG.MAX_LEVEL,
      ach_trophies5: SV().trophies.length >= 5,
      ach_night: st.nightsCaught >= 1
    };
    for (var id in conds) {
      if (conds[id] && !SV().achievements[id]) {
        SV().achievements[id] = true;
        FG.audio.achieve();
        var name = FG.ACHIEVEMENTS.filter(function (a) { return a.id === id; })[0].name;
        FG.ui.toast("ACHIEVEMENT: " + name, "#e8b71f", 5);
      }
    }
  };

  // ---------------- shop actions ----------------
  G.buy = function (item) {
    if (SV().owned[item.id]) return false;
    if (SV().level < item.level) return false;
    if (SV().coins < item.price) return false;
    SV().coins -= item.price; SV().stats.spent += item.price;
    SV().owned[item.id] = 1;
    FG.audio.buy();
    return true;
  };
  G.equip = function (cat, id) {
    if (!SV().owned[id]) return false;
    SV().equipped[cat] = id;
    FG.audio.click();
    return true;
  };
  G.buyBait = function (bait) {
    if (SV().level < bait.level) return false;
    if (SV().coins < bait.price) return false;
    SV().coins -= bait.price; SV().stats.spent += bait.price;
    SV().bait[bait.id] = (SV().bait[bait.id] | 0) + bait.amount;
    FG.audio.buy();
    return true;
  };
  G.claimChallenge = function (ch) {
    var p = SV().challenge.prog[ch.track === "speciesTotal" ? "ch_discover15" : ch.id];
    if ((p || 0) < ch.goal) return false;
    SV().challenge.claimed[ch.id] = (SV().challenge.claimed[ch.id] || 0) + 1;
    // reset cycle counters
    if (ch.track === "fishCaught" || ch.track === "heavyCatch" || ch.track === "rareCaught" || ch.track === "cleanStreak" || ch.track === "speciesCaught")
      SV().challenge.prog[ch.id] = 0;
    if (ch.track === "speciesCaught") SV().challenge._sp = [];
    SV().coins += ch.reward.coins;
    G.grantXp(ch.reward.xp);
    FG.ui.toast(ch.name + " CLAIMED: +" + ch.reward.coins + " COINS +" + ch.reward.xp + " XP", "#4ec26b", 4);
    FG.audio.win();
    return true;
  };

  G.keepTrophy = function (res) {
    var f = res.fish;
    if (SV().trophies.length >= 18) {
      // replace oldest worst-tier if this one beats something? simple: refuse
      FG.ui.toast("TROPHY WALL FULL (18)", "#e87a6e");
      return false;
    }
    // one mount per fish max (release to free slot happens in trophy hall)
    for (var i = 0; i < SV().trophies.length; i++)
      if (SV().trophies[i].id === f.id) { FG.ui.toast("ALREADY MOUNTED - SEE TROPHY HALL", "#c2ced9"); return false; }
    SV().trophies.push({ id: f.id, kg: res.kg, cm: res.cm, date: Date.now() });
    FG.ui.toast(f.name + " MOUNTED IN TROPHY HALL", "#e8b71f", 4);
    FG.audio.buy();
    G.checkAchievements();
    return true;
  };
  G.releaseTrophy = function (idx) {
    if (idx < 0 || idx >= SV().trophies.length) return;
    SV().trophies.splice(idx, 1);
    FG.audio.back();
  };

  // ---------------- update loop ----------------
  G.update = function (dt) {
    // clock
    G.time.t += dt;
    var p = G.time.phase + dt / G.DAY_LEN;
    if (p >= 1) { p -= 1; G.time.day++; FG.ui.toast("DAY " + G.time.day + " - A NEW DAWNS", "#ffd97a", 3); }
    G.time.phase = p;
    FG.audio.setNight(!G.isDay());
    if (S.state) S.state.playtime += dt;

    // weather
    G.weather.timer -= dt;
    if (G.weather.timer <= 0) rollWeather();
    if (G.weather.flash > 0) G.weather.flash -= dt;
    if (G.weather.kind === "storm" && Math.random() < dt * 0.03) {
      G.weather.flash = 0.18; FG.audio.thunder();
    }

    var f = G.fish;
    f.t += dt;
    switch (f.state) {
      case "idle":
        G.hint = SV().selectedBait !== "worm" && (SV().bait[SV().selectedBait] | 0) <= 0 ? "OUT OF BAIT - USING WORM" : "HOLD TO CAST";
        break;
      case "charging":
        G.cast.power += G.cast.dir * dt / CHARGE_DUR;
        if (G.cast.power >= 1) { G.cast.power = 1; G.cast.dir = -1; }
        else if (G.cast.power <= 0) { G.cast.power = 0; G.cast.dir = 1; }
        break;
      case "flying": {
        var k = FG.clamp(f.t / FLY_DUR, 0, 1);
        var b = G.bobber;
        b.x = FG.lerp(b.sx, b.targetX, k);
        b.y = FG.lerp(b.sy, b.targetY, k) - Math.sin(k * Math.PI) * 26;
        if (k >= 1) {
          f.state = "waiting"; f.t = 0;
          b.x = b.targetX; b.y = b.targetY;
          FG.audio.splash(false);
          FG.particles.splash(b.x, b.y, 1);
          // schedule bite
          var biteMul = G.weather.bite * (0.8 + FG.save.getRod().hook * 0.5);
          var bait = FG.save.getBait();
          biteMul *= (bait.id === "worm" ? 1 : 1.15);
          G.biteDelay = FG.rand(1.8, 6.5) / biteMul;
          G.hint = "WAITING FOR A BITE...";
        }
        break;
      }
      case "waiting":
        G.biteT = 0;
        G.biteDelay -= dt;
        if (G.biteDelay <= 0) {
          // roll fish now; chance of nibble (small fish / nothing) first
          G.pending = G.rollFish();
          if (!G.pending) { f.state = "idle"; G.hint = "NOTHING BITING HERE"; break; }
          f.state = "bite"; f.t = 0; G.biteT = 0;
          FG.audio.bite();
          FG.particles.splash(G.bobber.x, G.bobber.y, 1);
          G.hint = "NOW - HOOK IT!";
        } else {
          G.hint = "...";
        }
        break;
      case "bite":
        G.biteT += dt;
        var win = 1.0 + FG.save.getRod().hook * 0.6;
        if (G.biteT >= win) {
          SV().stats.misses++;
          SV().stats.cleanStreak = 0;
          f.state = "lost"; f.t = 0;
          G.result = { fish: G.pending, lost: true, reason: "MISSED THE HOOK" };
          FG.audio.lose();
          FG.ui.toast("MISSED THE HOOK...", "#e87a6e");
        }
        break;
      case "hooking":
        if (f.t >= 0.35) {
          if (G.hookOk) startFight(G.pending);
          else {
            f.state = "lost"; f.t = 0;
            G.result = { fish: G.pending, lost: true, reason: "IT SPIT THE HOOK - BETTER TACKLE HELPS" };
            SV().stats.misses++; SV().stats.cleanStreak = 0;
            FG.audio.lose();
          }
        }
        break;
      case "fighting":
        updateFight(dt);
        break;
      case "caught":
        if (f.t >= 1.4) f.state = "result";
        break;
      case "lost":
        if (f.t >= 1.1) f.state = "result";
        break;
    }

    // autosave
    G._saveT = (G._saveT || 0) + dt;
    if (G._saveT > 30) { G._saveT = 0; FG.save.save(); }
  };

  // convenience for screens/main to know if input should go to fishing
  G.fishingActive = function () {
    var s = G.fish.state;
    return s !== "idle" && s !== "result";
  };
})();
