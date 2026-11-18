// ============================================================
// screens.js - all menu/UI screens drawn on the game canvas:
// title, shop, collection, quests, trophies, profile, settings.
// ============================================================

(function () {
  var SC = FG.screens = {};
  var U = FG.ui, F = FG.font, S = FG.save, A = FG.audio, ART = FG.art;
  var FMT = FG.fmtInt, KG = FG.fmtKg, CM = FG.fmtCm;

  SC.stack = ["title"];

  SC.open = function (name) {
    if (SC.current() === name) return;
    SC.stack.push(name);
    A.open();
  };
  SC.close = function () {
    if (SC.stack.length <= 1) return;
    SC.stack.pop();
    A.back();
  };
  SC.current = function () { return SC.stack[SC.stack.length - 1]; };
  SC.isOpen = function () { return SC.stack[SC.stack.length - 1] !== "harbor"; };

  // ---------------- shared helpers ----------------
  var NAV = [
    { id: "shop", label: "SHOP" }, { id: "collection", label: "BOOK" },
    { id: "quests", label: "QUESTS" }, { id: "trophies", label: "TROPHY" },
    { id: "profile", label: "PROFILE" }, { id: "pause", label: "MENU" }
  ];

  function hotbar(ctx) {
    var bw = 88, gap = 6, n = NAV.length;
    var x0 = FG.W / 2 - (n * bw + (n - 1) * gap) / 2;
    for (var i = 0; i < n; i++) {
      U.btn(ctx, x0 + i * (bw + gap), 337, bw, 18, NAV[i].label, {
        cb: (function (id) { return function () { SC.open(id); }; })(NAV[i].id)
      });
    }
  }
  SC.hotbar = hotbar;

  function backButton(ctx) {
    U.btn(ctx, 8, 337, 70, 18, "BACK", { cb: function () { SC.close(); } });
  }

  function rarityTag(ctx, rarity, x, y) {
    F.draw(ctx, FG.rarityName(rarity), x, y, FG.rarityColor(rarity), 1);
  }

  function playtime(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + "H " : "") + m + "M";
  }

  // ============================================================
  // TITLE SCREEN
  // ============================================================
  var titleT = 0;
  SC.title = function (ctx, dt) {
    titleT += dt;
    // animated sky backdrop
    var g = ctx.createLinearGradient(0, 0, 0, FG.H);
    g.addColorStop(0, "#2a3b5e"); g.addColorStop(0.5, "#5a4a7a"); g.addColorStop(0.62, "#c96a4a"); g.addColorStop(0.66, "#2f6a8f"); g.addColorStop(1, "#1c405c");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FG.W, FG.H);
    // sun half at horizon
    var sunY = 232 + Math.sin(titleT * 0.3) * 4;
    FG.env.sun() && ctx.drawImage(FG.env.sun(), FG.W / 2 - 20, sunY - 16);
    ctx.fillStyle = "#1c405c"; ctx.fillRect(0, 236, FG.W, FG.H - 236);
    // shimmer rows
    for (var i = 0; i < 10; i++) {
      var yy = 242 + i * 11, ph = titleT * (0.6 + i * 0.05) + i;
      ctx.fillStyle = "rgba(255,217,122," + (0.10 + 0.05 * Math.sin(ph * 2)) + ")";
      var w = 70 - i * 5 + Math.sin(ph) * 8;
      ctx.fillRect(FG.W / 2 - w / 2, yy, w, 2);
    }
    // silhouetted dock + fisherman
    ctx.fillStyle = "#141b26";
    ctx.fillRect(0, 300, 240, 60);
    ctx.fillRect(0, 296, 260, 5);
    ctx.fillRect(60, 300, 6, 40); ctx.fillRect(170, 300, 6, 40);
    // fisherman silhouette (simple)
    ctx.fillRect(200, 268, 13, 28); ctx.fillRect(197, 292, 18, 6);
    ctx.fillRect(199, 254, 15, 14); ctx.fillRect(195, 252, 22, 3);
    ART.thickLine(ctx, 210, 270, 240, 240, 2, "#141b26");
    // title
    var bob = Math.sin(titleT * 1.6) * 2;
    F.draw(ctx, "ISLAND", FG.W / 2, 74 + bob, "#c9e2f0", 3, { align: "center", shadow: true });
    F.draw(ctx, "ANGLER", FG.W / 2, 74 + 30 + bob, "#ffd97a", 3, { align: "center", shadow: true });
    F.draw(ctx, "A TALE OF TIDE & LINE", FG.W / 2, 74 + 62 + bob, "#e8a86a", 1, { align: "center" });

    var hasSave = S.has();
    U.btn(ctx, FG.W / 2 - 80, 200, 160, 22, "CONTINUE", { style: "gold", enabled: hasSave, cb: startGame });
    U.btn(ctx, FG.W / 2 - 80, 228, 160, 22, "NEW JOURNEY", { cb: newJourney });
    U.btn(ctx, FG.W / 2 - 55, 256, 110, 18, "HOW TO PLAY", { cb: function () { SC.open("help"); } });

    F.draw(ctx, "ALL ART & SOUND MADE WITH CODE - NO EXTERNAL ASSETS", FG.W / 2, 350, "rgba(180,200,220,0.5)", 1, { align: "center" });
  };

  function startGame() {
    S.load();
    FG.game.newGame();
    SC.stack = ["harbor"];
    A.resume(); A.startMusic();
    FG.ui.toast("WELCOME BACK, ANGLER", "#ffd97a", 4);
  }
  function newJourney() {
    U.confirm("START OVER?", "YOUR CURRENT PROGRESS WILL BE WASHED AWAY BY THE TIDE.", function () {
      S.reset(); S.load();
      FG.game.newGame();
      SC.stack = ["harbor"];
      A.resume(); A.startMusic();
      FG.ui.toast("A NEW DAWN BREAKS", "#4ec26b", 4);
    });
  }

  // ============================================================
  // HELP
  // ============================================================
  SC.help = function (ctx) {
    ctx.fillStyle = "rgba(4,8,14,0.55)"; ctx.fillRect(0, 0, FG.W, FG.H);
    U.panel(ctx, 90, 30, 460, 296, { title: "HOW TO PLAY" });
    var lines = [
      ["CASTING", "HOLD SPACE / CLICK / TAP to charge the cast bar. Release in the GREEN zone for a perfect cast."],
      ["THE BITE", "When the bobber dunks and 'NOW - HOOK IT!' flashes, press within the window to hook it."],
      ["THE FIGHT", "HOLD to reel. Watch the tension meter: hold it below the red zone or your line snaps. Release to let tension bleed off and tire the fish out."],
      ["THE LORE", "Better bait and tackle attract rarer fish. Some species only bite at night, in deep water, or on mystic bait."],
      ["TAXIDERMY", "Keep a first catch or personal best as a mount for your trophy hall (18 slots max)."],
      ["CONTROLS", "SPACE/CLICK cast & hook & reel - ESC back - 1-6 open menus - M mute - ? help"]
    ];
    var y = 50;
    for (var i = 0; i < lines.length; i++) {
      F.draw(ctx, lines[i][0], 110, y, "#ffd97a", 1);
      var lh = F.drawWrapped(ctx, lines[i][1], 110, y + 11, "#c8d6e2", 1, 420, 0);
      y += 11 + lh + 12;
    }
    backButton(ctx);
  };

  // ============================================================
  // SHOP
  // ============================================================
  var shopTab = 0;
  var SHOP_TABS = ["RODS", "REELS", "LINES", "BAIT"];
  SC.shop = function (ctx) {
    ctx.fillStyle = "rgba(4,8,14,0.55)"; ctx.fillRect(0, 0, FG.W, FG.H);
    U.panel(ctx, 20, 24, 600, 306, { title: "TACKLE SHOP", accent: "#e8b71f" });
    // coins
    ctx.drawImage(FG.env.icon("coin"), 540, 32);
    F.draw(ctx, FMT(S.state.coins), 536, 34, "#ffe48a", 1, { align: "right" });

    U.tabs(ctx, 32, 32, SHOP_TABS, shopTab, function (i) { shopTab = i; }, 70);

    var catKeys = ["rods", "reels", "lines", "baits"];
    var cat = FG.EQUIP[catKeys[shopTab]];
    var isBait = shopTab === 3;
    var listX = 32, rowY = 66, rowH = 34;

    for (var i = 0; i < cat.length; i++) {
      var it = cat[i];
      var owned = isBait ? (S.state.bait[it.id] | 0) > 0 || it.id === "worm" : !!S.state.owned[it.id];
      var equipped = !isBait && S.state.equipped[{ 0: "rod", 1: "reel", 2: "line" }[shopTab]] === it.id;
      var locked = S.state.level < it.level;
      var y = rowY + i * (rowH + 4);
      var hov = U.btn(ctx, listX, y, 290, rowH, "", {
        enabled: true, sound: false,
        cb: (function (item) { return function () { shopSel = item.id; }; })(it)
      });
      var sel = shopSel === it.id;
      // repaint selection
      ctx.fillStyle = sel ? "rgba(232,183,31,0.16)" : (hov ? "rgba(120,160,200,0.10)" : "rgba(16,26,40,0.7)");
      ctx.fillRect(listX + 1, y + 1, 288, rowH - 2);
      if (sel) FG.rectOutline(ctx, listX + 1, y + 1, 288, rowH - 2, "#e8b71f");
      var tx = listX + 10;
      F.draw(ctx, it.name, tx, y + 6, locked ? "#6b7680" : "#e8f0f8", 1);
      if (isBait) {
        F.draw(ctx, "OWN: " + (it.id === "worm" ? "MAX" : (S.state.bait[it.id] | 0)), tx, y + 19, "#8fa8c2", 1);
      } else {
        var stat = shopTab === 0 ? "HOOK +" + Math.round(it.hook * 100) + "%  LUCK +" + Math.round(it.luck * 100) + "%"
          : shopTab === 1 ? "REEL x" + it.reel.toFixed(2) + "  CTRL +" + Math.round(it.control * 100) + "%"
          : "SNAP -" + Math.round(it.snap * 100) + "%  PULL +" + Math.round(it.pull * 100) + "%";
        F.draw(ctx, stat, tx, y + 19, "#8fa8c2", 1);
      }
      if (equipped) { F.draw(ctx, "USED", listX + 285, y + 6, "#4ec26b", 1, { align: "right" }); }
      else if (owned) { F.draw(ctx, "OWNED", listX + 285, y + 6, "#c2ced9", 1, { align: "right" }); }
      else if (locked) { F.draw(ctx, "LV " + it.level, listX + 285, y + 6, "#e87a6e", 1, { align: "right" }); }
      else {
        ctx.drawImage(FG.env.icon("coin"), listX + 228, y + 5);
        F.draw(ctx, FMT(it.price), listX + 225, y + 7, "#ffe48a", 1, { align: "right" });
      }
    }

    // detail column
    var sel2 = cat.filter(function (x) { return x.id === shopSel; })[0] || cat[0];
    var dx = 336;
    ctx.fillStyle = "rgba(10,18,28,0.7)";
    ctx.fillRect(dx, 66, 270, 170);
    FG.rectOutline(ctx, dx, 66, 270, 170, "rgba(90,120,150,0.5)");
    var icon = shopTab === 0 ? "rod" : shopTab === 1 ? "reel" : shopTab === 2 ? "line" : "bait";
    ctx.drawImage(FG.env.icon(icon), dx + 12, 78);
    F.draw(ctx, sel2.name, dx + 38, 80, "#e8f0f8", 1);
    F.drawWrapped(ctx, sel2.desc, dx + 12, 104, "#9db4c8", 1, 246, 0);
    F.draw(ctx, "LEVEL " + sel2.level + "+", dx + 12, 200, "#8fa8c2", 1);

    var owned2 = isBait ? (S.state.bait[sel2.id] | 0) > 0 || sel2.id === "worm" : !!S.state.owned[sel2.id];
    if (!isBait) {
      var equipCat = { 0: "rod", 1: "reel", 2: "line" }[shopTab];
      var eq = S.state.equipped[equipCat] === sel2.id;
      U.btn(ctx, dx + 12, 220, 118, 20, eq ? "EQUIPPED" : "EQUIP", {
        style: eq ? "green" : "normal", enabled: owned2,
        cb: function () { FG.game.equip(equipCat, sel2.id); }
      });
      if (!owned2) U.btn(ctx, dx + 140, 220, 118, 20, "BUY", {
        style: "gold", enabled: !owned2 && S.state.level >= sel2.level && S.state.coins >= sel2.price,
        cb: function () {
          if (FG.game.buy(sel2)) { S.state.equipped[equipCat] = sel2.id; FG.ui.toast(sel2.name + " PURCHASED & EQUIPPED", "#e8b71f"); }
          else FG.ui.toast("NOT ENOUGH COINS", "#e87a6e");
        }
      });
    } else {
      U.btn(ctx, dx + 12, 220, 118, 20, "SELECT", {
        style: S.state.selectedBait === sel2.id ? "green" : "normal",
        enabled: sel2.id === "worm" || (S.state.bait[sel2.id] | 0) > 0,
        cb: function () {
          if (sel2.id === "worm" || (S.state.bait[sel2.id] | 0) > 0) { S.state.selectedBait = sel2.id; A.click(); FG.ui.toast(sel2.name + " IN USE", "#4ec26b"); }
          else FG.ui.toast("NONE LEFT - BUY MORE", "#e87a6e");
        }
      });
      U.btn(ctx, dx + 140, 220, 118, 20, "BUY " + sel2.amount, {
        style: "gold", enabled: S.state.level >= sel2.level && S.state.coins >= sel2.price,
        cb: function () {
          if (FG.game.buyBait(sel2)) FG.ui.toast("+" + sel2.amount + " " + sel2.name, "#e8b71f");
          else FG.ui.toast("NOT ENOUGH COINS", "#e87a6e");
        }
      });
    }
    backButton(ctx);
  };
  var shopSel = "rod_wood";

  // ============================================================
  // COLLECTION (the book)
  // ============================================================
  var colFilter = -1, colSel = null, colScroll = "col";
  SC.collection = function (ctx) {
    ctx.fillStyle = "rgba(4,8,14,0.55)"; ctx.fillRect(0, 0, FG.W, FG.H);
    U.panel(ctx, 20, 24, 600, 306, { title: "SEA JOURNAL", accent: "#3b9dff" });
    F.draw(ctx, S.speciesDiscovered() + " / " + FG.FISH.length + " SPECIES DISCOVERED", 34, 36, "#8fa8c2", 1);

    var tabs = ["ALL"].concat(FG.RARITIES.map(function (r) { return r.name.slice(0, 4); }));
    U.tabs(ctx, 32, 48, tabs, colFilter + 1, function (i) { colFilter = i - 1; }, 62);

    var sc = U.scroll(colScroll);
    // grid 5 cols x 4 visible rows, cells 68x40
    var gx = 32, gy = 70, cw = 68, ch = 40;
    var pool = FG.FISH.filter(function (f) { return colFilter < 0 || FG.rarityIdx[f.rarity] === colFilter; });
    var viewH = 4 * (ch + 2);
    var maxY = Math.max(0, Math.ceil(pool.length / 5) * (ch + 2) - viewH);
    sc.y = FG.clamp(sc.y, 0, maxY);
    U.region({ x: gx, y: gy, w: 5 * cw, h: viewH, scroll: colScroll, maxScroll: maxY });

    for (var i = 0; i < pool.length; i++) {
      var f = pool[i];
      var cx = gx + (i % 5) * cw, cy = gy + Math.floor(i / 5) * (ch + 2) - sc.y;
      if (cy + ch < gy || cy > gy + viewH) continue;
      var known = !!S.state.caught[f.id];
      var sel = colSel === f.id;
      ctx.fillStyle = sel ? "rgba(59,157,255,0.18)" : "rgba(16,26,40,0.7)";
      ctx.fillRect(cx, cy, cw - 4, ch);
      FG.rectOutline(ctx, cx, cy, cw - 4, ch, sel ? "#3b9dff" : (known ? FG.rarityColor(f.rarity) : "rgba(90,110,130,0.5)"));
      var sp = FG.fishSprite(f.id, 0, !known);
      if (sp) {
        ctx.globalAlpha = known ? 1 : 0.45;
        ctx.drawImage(sp, Math.round(cx + (cw - 4) / 2 - sp.width / 2), Math.round(cy + 14 - sp.height / 2));
        ctx.globalAlpha = 1;
      }
      if (known) {
        F.draw(ctx, "x" + S.state.caught[f.id].n, cx + 3, cy + ch - 10, "#8fa8c2", 1);
      } else {
        F.draw(ctx, "?", cx + (cw - 4) / 2, cy + 24, "#5d6b78", 1, { align: "center" });
      }
      (function (fid) {
        U.region({ x: cx, y: cy, w: cw - 4, h: ch, enabled: true, cb: function () { colSel = fid; A.tick(); } });
      })(f.id);
    }

    // detail column
    var dx = 390;
    ctx.fillStyle = "rgba(10,18,28,0.7)";
    ctx.fillRect(dx, 70, 216, 176);
    FG.rectOutline(ctx, dx, 70, 216, 176, "rgba(90,120,150,0.5)");
    var selF = colSel ? FG.FISH_BY_ID[colSel] : null;
    if (!selF) {
      F.draw(ctx, "PICK A SPECIES", dx + 108, 120, "#5d6b78", 1, { align: "center" });
      F.draw(ctx, "FROM THE BOOK", dx + 108, 134, "#5d6b78", 1, { align: "center" });
    } else {
      var known2 = !!S.state.caught[selF.id];
      var sp2 = FG.fishSprite(selF.id, Math.floor(FG.tGlobal * 6) % 6, !known2);
      if (sp2) ctx.drawImage(sp2, dx + 108 - sp2.width / 2, 84);
      F.draw(ctx, selF.name, dx + 108, 130, known2 ? "#e8f0f8" : "#8fa8c2", 1, { align: "center" });
      F.draw(ctx, FG.rarityName(selF.rarity), dx + 108, 142, FG.rarityColor(selF.rarity), 1, { align: "center" });
      if (known2) {
        var rec = S.state.caught[selF.id];
        F.drawWrapped(ctx, selF.desc, dx + 12, 156, "#9db4c8", 1, 192, 0);
        F.draw(ctx, "CAUGHT: " + rec.n + "   BEST: " + KG(rec.bestKg), dx + 12, 214, "#c2ced9", 1);
        F.draw(ctx, "LENGTH: " + CM(rec.bestCm), dx + 12, 226, "#c2ced9", 1);
        var isMounted = S.state.trophies.filter(function (t) { return t.id === selF.id; }).length > 0;
        U.btn(ctx, dx + 12, 236, 100, 16, isMounted ? "MOUNTED" : "MOUNT BEST", {
          style: isMounted ? "green" : "gold", enabled: !isMounted && S.state.trophies.length < 18,
          cb: function () {
            if (isMounted) return;
            var rec2 = S.state.caught[selF.id];
            if (S.state.trophies.length >= 18) { FG.ui.toast("TROPHY WALL FULL (18)", "#e87a6e"); return; }
            S.state.trophies.push({ id: selF.id, kg: rec2.bestKg, cm: rec2.bestCm, date: Date.now() });
            FG.audio.buy(); FG.ui.toast(selF.name + " MOUNTED", "#e8b71f");
            FG.game.checkAchievements();
          }
        });
      } else {
        F.draw(ctx, "UNDISCOVERED", dx + 108, 158, "#6b7680", 1, { align: "center" });
        F.draw(ctx, "HINTS:", dx + 12, 176, "#ffd97a", 1);
        var depthTxt = selF.depth[0] < 0.34 ? "SHALLOW" : selF.depth[0] < 0.7 ? "MID-WATER" : "DEEP";
        F.draw(ctx, "WHEN: " + (selF.time === "any" ? "DAY OR NIGHT" : selF.time.toUpperCase()), dx + 12, 190, "#c2ced9", 1);
        F.draw(ctx, "WHERE: " + depthTxt + "", dx + 12, 202, "#c2ced9", 1);
        F.draw(ctx, "ROD TIER " + selF.rodMin + "+, LEVEL " + selF.levelReq + "+", dx + 12, 214, "#c2ced9", 1);
        F.draw(ctx, "BAITS: " + selF.baitPref.join(", ").toUpperCase(), dx + 12, 226, "#c2ced9", 1);
      }
    }
    backButton(ctx);
  };

  // ============================================================
  // QUESTS (challenges + achievements)
  // ============================================================
  var questTab = 0;
  SC.quests = function (ctx) {
    ctx.fillStyle = "rgba(4,8,14,0.55)"; ctx.fillRect(0, 0, FG.W, FG.H);
    U.panel(ctx, 60, 24, 520, 306, { title: "TIDE LOG", accent: "#4ec26b" });
    U.tabs(ctx, 72, 32, ["CHALLENGES", "ACHIEVEMENTS"], questTab, function (i) { questTab = i; }, 100);

    if (questTab === 0) {
      for (var i = 0; i < FG.CHALLENGES.length; i++) {
        var ch = FG.CHALLENGES[i];
        var prog = ch.track === "speciesTotal" ? S.speciesDiscovered() : (S.state.challenge.prog[ch.id] || 0);
        var done = prog >= ch.goal;
        var claimed = !ch.repeat && (S.state.challenge.claimed[ch.id] || 0) > 0;
        var y = 64 + i * 40;
        ctx.fillStyle = "rgba(16,26,40,0.7)";
        ctx.fillRect(72, y, 496, 36);
        FG.rectOutline(ctx, 72, y, 496, 36, done && !claimed ? "#e8b71f" : "rgba(90,120,150,0.5)");
        F.draw(ctx, ch.name, 82, y + 5, claimed ? "#6b7680" : "#e8f0f8", 1);
        F.draw(ctx, ch.desc, 82, y + 17, "#8fa8c2", 1);
        U.meter(ctx, 318, y + 6, 104, 8, prog / ch.goal, "#4ec26b");
        F.draw(ctx, Math.min(prog, ch.goal) + "/" + ch.goal, 318, y + 19, "#c2ced9", 1);
        ctx.drawImage(FG.env.icon("coin"), 428, y + 4);
        F.draw(ctx, "+" + ch.reward.coins, 444, y + 6, "#ffe48a", 1);
        if (ch.track !== "speciesTotal")
          F.draw(ctx, (S.state.challenge.claimed[ch.id] || 0) + "x CLAIMED", 560, y + 19, "#5d6b78", 1, { align: "right" });
        U.btn(ctx, 480, y + 8, 80, 19, claimed ? "DONE" : "CLAIM", {
          style: "gold", enabled: done && !claimed && ch.id !== "ch_discover15" ? !claimed : done && !claimed,
          cb: (function (c) { return function () { FG.game.claimChallenge(c); }; })(ch)
        });
      }
    } else {
      for (var k = 0; k < FG.ACHIEVEMENTS.length; k++) {
        var a = FG.ACHIEVEMENTS[k];
        var got = !!S.state.achievements[a.id];
        var ax = 84 + (k % 2) * 250, ay = 68 + Math.floor(k / 2) * 38;
        ctx.fillStyle = "rgba(16,26,40,0.7)";
        ctx.fillRect(ax, ay, 240, 34);
        FG.rectOutline(ctx, ax, ay, 240, 34, got ? "#e8b71f" : "rgba(90,110,130,0.4)");
        ctx.globalAlpha = got ? 1 : 0.35;
        ctx.drawImage(FG.env.icon("ach"), ax + 6, ay + 9);
        ctx.globalAlpha = 1;
        F.draw(ctx, a.name, ax + 30, ay + 6, got ? "#ffe48a" : "#8fa8c2", 1);
        F.draw(ctx, a.desc, ax + 30, ay + 18, got ? "#9db4c8" : "#5d6b78", 1);
        if (got) { ctx.drawImage(FG.env.icon("star"), ax + 220, ay + 13); }
      }
    }
    backButton(ctx);
  };

  // ============================================================
  // TROPHY HALL
  // ============================================================
  SC.trophies = function (ctx) {
    ctx.fillStyle = "rgba(4,8,14,0.55)"; ctx.fillRect(0, 0, FG.W, FG.H);
    U.panel(ctx, 40, 24, 560, 306, { title: "TROPHY HALL", accent: "#e8b71f" });
    F.draw(ctx, S.state.trophies.length + " / 18 MOUNTS - CLICK TO RELEASE BACK TO THE SEA", 310, 40, "#8fa8c2", 1, { align: "center" });
    var cols = 6, cw = 84, chh = 76;
    for (var i = 0; i < 18; i++) {
      var x = 60 + (i % cols) * (cw + 8), y = 58 + Math.floor(i / cols) * (chh + 8);
      var t = S.state.trophies[i];
      ctx.fillStyle = t ? "rgba(30,24,14,0.6)" : "rgba(16,26,40,0.45)";
      ctx.fillRect(x, y, cw, chh);
      FG.rectOutline(ctx, x, y, cw, chh, t ? "#8a6a1e" : "rgba(90,110,130,0.3)");
      // plaque bottom
      ctx.fillStyle = t ? "#5e4026" : "rgba(16,26,40,0.45)";
      ctx.fillRect(x + 1, y + chh - 14, cw - 2, 13);
      if (t) {
        var f = FG.FISH_BY_ID[t.id];
        var sp = FG.fishSprite(t.id, Math.floor(FG.tGlobal * 4 + i) % 6, false);
        if (sp) {
          var s = Math.min((cw - 8) / sp.width, 44 / sp.height, 2);
          ctx.drawImage(sp, x + cw / 2 - sp.width * s / 2, y + 8 + (44 - sp.height * s) / 2, sp.width * s, sp.height * s);
        }
        F.draw(ctx, f ? f.name.split(" ").slice(-1)[0] : "?", x + cw / 2, y + chh - 11, "#ffe48a", 1, { align: "center" });
        F.draw(ctx, KG(t.kg), x + cw / 2, y + chh - 3, "#c2ced9", 1, { align: "center" });
        U.region({ x: x, y: y, w: cw, h: chh, enabled: true, cb: (function (idx) {
          return function () {
            U.confirm("RELEASE MOUNT?", "RETURN THIS MOUNT TO THE SEA? THE SLOT FREES UP.", function () {
              FG.game.releaseTrophy(idx); FG.ui.toast("RETURNED TO THE TIDE", "#4ec26b");
            });
          };
        })(i) });
      } else {
        ctx.drawImage(FG.env.icon("vase"), x + cw / 2 - 8, y + 24);
        F.draw(ctx, "EMPTY", x + cw / 2, y + chh - 11, "#5d6b78", 1, { align: "center" });
      }
    }
    backButton(ctx);
  };

  // ============================================================
  // PROFILE
  // ============================================================
  SC.profile = function (ctx) {
    ctx.fillStyle = "rgba(4,8,14,0.55)"; ctx.fillRect(0, 0, FG.W, FG.H);
    U.panel(ctx, 60, 24, 520, 306, { title: "ANGLER PROFILE", accent: "#a865f6" });
    var st = S.state.stats;
    // portrait card
    ctx.fillStyle = "rgba(10,18,28,0.8)";
    ctx.fillRect(74, 58, 150, 120);
    FG.rectOutline(ctx, 74, 58, 150, 120, "#3b6a8f");
    var por = FG.char.portrait();
    ctx.drawImage(por, 74 + 75 - 24, 64, 48, 48);
    F.draw(ctx, FG.RANKS[S.rankIndex()].name, 74 + 75, 118, "#ffd97a", 1, { align: "center" });
    F.draw(ctx, "LEVEL " + S.state.level, 74 + 75, 130, "#e8f0f8", 1, { align: "center" });
    var need = FG.xpForLevel(S.state.level);
    U.meter(ctx, 84, 144, 130, 9, S.state.xp / need, "#a865f6");
    F.draw(ctx, S.state.xp + "/" + need + " XP", 74 + 75, 157, "#8fa8c2", 1, { align: "center" });
    F.draw(ctx, "NEXT RANK: " + (S.rankIndex() < 5 ? FG.RANKS[S.rankIndex() + 1].name : "MAX"), 74 + 75, 168, "#4ec26b", 1, { align: "center" });

    // stat grid
    var stats = [
      ["FISH CAUGHT", FMT(st.totalCaught)], ["SPECIES", S.speciesDiscovered() + " / " + FG.FISH.length],
      ["RARE +", FMT(st.rareCaught)], ["MISSERS", FMT(st.misses)],
      ["BIGGEST", KG(st.biggestKg)], ["PERFECT", FMT(st.perfectCaught)],
      ["BEST STREAK", FMT(st.bestStreak)], ["NIGHT CATCHES", FMT(st.nightsCaught)],
      ["CASTS", FMT(st.castCount)], ["COINS EARNED", FMT(st.earned)],
      ["COINS SPENT", FMT(st.spent)], ["TIME FISHED", playtime(S.state.playtime)]
    ];
    for (var i = 0; i < stats.length; i++) {
      var x = 246 + (i % 2) * 160, y = 52 + Math.floor(i / 2) * 25;
      F.draw(ctx, stats[i][0], x, y, "#8fa8c2", 1);
      F.draw(ctx, stats[i][1], x + 150, y + 10, "#e8f0f8", 1, { align: "right" });
      ctx.fillStyle = "rgba(90,120,150,0.25)";
      ctx.fillRect(x, y + 20, 150, 1);
    }

    // gear strip
    F.draw(ctx, "GEAR", 74, 190, "#ffd97a", 1);
    var gear = [[S.getRod(), "rod"], [S.getReel(), "reel"], [S.getLine(), "line"], [S.getBait(), "bait"]];
    for (var k = 0; k < gear.length; k++) {
      var gx = 74 + k * 120;
      ctx.fillStyle = "rgba(10,18,28,0.8)";
      ctx.fillRect(gx, 202, 112, 22);
      FG.rectOutline(ctx, gx, 202, 112, 22, "rgba(90,120,150,0.5)");
      ctx.drawImage(FG.env.icon(gear[k][1]), gx + 5, 206);
      F.draw(ctx, gear[k][0].name, gx + 26, 210, "#c2ced9", 1);
    }
    U.btn(ctx, 74, 240, 130, 18, "SETTINGS", { cb: function () { SC.open("settings"); } });
    backButton(ctx);
  };

  // ============================================================
  // SETTINGS
  // ============================================================
  SC.settings = function (ctx) {
    ctx.fillStyle = "rgba(4,8,14,0.7)"; ctx.fillRect(0, 0, FG.W, FG.H);
    U.panel(ctx, 150, 60, 340, 220, { title: "SETTINGS", accent: "#8fa8c2" });
    // sliders
    sliderRow(ctx, "MUSIC", 170, 90, S.state.settings.music, function (v) { S.state.settings.music = v; A.setVol("music", v); });
    sliderRow(ctx, "SFX", 170, 120, S.state.settings.sfx, function (v) { S.state.settings.sfx = v; A.setVol("sfx", v); });
    U.btn(ctx, 170, 150, 150, 20, "SCREEN SHAKE: " + (S.state.settings.shake ? "ON" : "OFF"), {
      style: S.state.settings.shake ? "green" : "normal",
      cb: function () { S.state.settings.shake = !S.state.settings.shake; }
    });
    U.btn(ctx, 170, 180, 150, 20, "SAVE NOW", { style: "green", cb: function () {
      if (S.save()) FG.ui.toast("PROGRESS SAVED", "#4ec26b");
      else FG.ui.toast("SAVE FAILED", "#e87a6e");
    } });
    U.btn(ctx, 330, 180, 140, 20, "DELETE SAVE", { style: "red", cb: function () {
      U.confirm("DELETE SAVE?", "PERMANENTLY WASH ALL PROGRESS AWAY?", function () {
        S.reset(); SC.stack = ["title"]; FG.ui.toast("SAVE ERASED", "#e87a6e");
      });
    } });
    U.btn(ctx, 170, 214, 300, 18, "HOW TO PLAY", { cb: function () { SC.open("help"); } });
    backButton(ctx);
  };

  function sliderRow(ctx, label, x, y, val, onSet) {
    F.draw(ctx, label, x, y, "#c2ced9", 1);
    var tx = x + 120, tw = 150;
    ctx.fillStyle = "rgba(8,14,22,0.9)"; ctx.fillRect(tx, y, tw, 8);
    FG.rectOutline(ctx, tx, y, tw, 8, "rgba(90,120,150,0.6)");
    ctx.fillStyle = "#4ec26b";
    ctx.fillRect(tx + 2, y + 2, Math.round((tw - 4) * val), 4);
    ctx.fillStyle = "#e8f0f8";
    ctx.fillRect(tx + Math.round((tw - 4) * val), y - 1, 3, 10);
    F.draw(ctx, Math.round(val * 100) + "%", x + 320, y, "#8fa8c2", 1);
    U.region({ x: tx - 4, y: y - 6, w: tw + 8, h: 20, enabled: true, cb: function () {
      var v = FG.clamp((U.mouse.x - tx) / tw, 0, 1);
      onSet(Math.round(v * 10) / 10); A.tick();
    } });
  }

  // ============================================================
  // PAUSE
  // ============================================================
  SC.pause = function (ctx) {
    ctx.fillStyle = "rgba(4,8,14,0.6)"; ctx.fillRect(0, 0, FG.W, FG.H);
    U.panel(ctx, 210, 90, 220, 180, { title: "PAUSED", accent: "#5d87b0" });
    U.btn(ctx, 235, 120, 170, 22, "RESUME", { style: "green", cb: function () { SC.close(); } });
    U.btn(ctx, 235, 150, 170, 22, "SETTINGS", { cb: function () { SC.open("settings"); } });
    U.btn(ctx, 235, 180, 170, 18, "SAVE", { cb: function () { S.save(); FG.ui.toast("SAVED", "#4ec26b"); } });
    U.btn(ctx, 235, 206, 170, 22, "QUIT TO TITLE", { style: "red", cb: function () {
      U.confirm("QUIT?", "RETURN TO TITLE? (PROGRESS SAVES FIRST)", function () {
        S.save(); A.stopMusic(); FG.audio.rainLoop(false);
        SC.stack = ["title"];
      });
    } });
    backButton(ctx);
  };

  // dispatch
  SC.draw = function (ctx, dt) {
    var fn = SC[SC.current()];
    if (fn) fn(ctx, dt);
  };
})();
