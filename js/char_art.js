// ============================================================
// char_art.js — the fisherman: procedurally drawn every frame
// from part primitives so arms/rod animate smoothly.
// Also the front-facing HUD portrait.
// ============================================================

(function () {
  var C = FG.char = {};
  var TAU = Math.PI * 2;

  var COL = {
    skin: "#e2a97c", skinD: "#b97f54", hair: "#4a3226",
    hat: "#e6c980", hatD: "#b89a52", hatBand: "#8a4f2d",
    jersey: "#c94f3a", jerseyD: "#8f2f24", collar: "#f2e2b8",
    susp: "#6b4230", belt: "#4a3626",
    pants: "#3b4d63", pantsD: "#27344a",
    boots: "#5c3a24", bootsD: "#332014",
    rod: "#9a6a3a", rodD: "#5e3f1e", rodG: "#1d130b",
    grip: "#2a2119", reel: "#aab2ba", reelD: "#5e666e",
    out: "#181018", outline: "rgba(10,8,16,0.55)"
  };

  // small pixel helpers
  function px(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  // ============================================================
  // pose = {state, t (sec), rodBend, tension, power}
  // draws the fisherman whose FEET rest at (fx, fy) world px.
  // Rod angle & hands derive from state curves.
  // ============================================================
  C.draw = function (ctx, fx, fy, pose) {
    var st = pose.state || "idle", t = pose.t || 0;
    var bob = 0, headDy = 0, lean = 0, ldx = 0;
    var rodAng = -58, rodBend = 0.15, armL = 0; // armL: 0 at side, 1 on rod, 2 up fist
    var leftHandCircle = false, rodTipDown = false;
    var ph = t * TAU;

    switch (st) {
      case "idle":
        bob = Math.sin(ph * 1.2) * 0.9;
        rodAng = -58 + Math.sin(ph * 0.8) * 3;
        break;
      case "wait":
        bob = Math.sin(ph * 1.0) * 0.9;
        rodAng = -46 + Math.sin(ph * 1.7) * 4;
        rodBend = 0.35;
        break;
      case "cast":
        // t passed as cast phase 0..1 via pose.ct
        var cp = FG.clamp(pose.ct || 0, 0, 1);
        if (cp < 0.35) { var k = cp / 0.35; rodAng = FG.lerp(-58, 115, FG.smo01(k)); bob = -2 * FG.smo01(k); }
        else if (cp < 0.55) { var k2 = (cp - 0.35) / 0.2; rodAng = FG.lerp(115, -40, FG.easeOut(k2)); bob = -2 + 4 * k2; lean = 2; }
        else { var k3 = (cp - 0.55) / 0.45; rodAng = FG.lerp(-40, -46, k3); bob = 2 - 2 * k3; lean = 2 - 2 * k3; }
        armL = 1;
        break;
      case "bite":
        bob = Math.sin(ph * 9) * 1.4;
        headDy = 1;
        rodAng = -30 + Math.sin(ph * 9) * 8; // rod jerked toward water
        rodBend = 0.75;
        armL = 1; lean = 2;
        break;
      case "hook":
        var hp = FG.clamp(pose.ht || 0, 0, 1);
        rodAng = FG.lerp(-30, -84, FG.easeOut(hp));
        bob = -3 + 3 * hp; lean = -3 + 2 * hp; armL = 1;
        rodBend = 0.6 * (1 - hp) + 0.2;
        break;
      case "reel":
        bob = Math.sin(ph * 6) * 1.2;
        rodAng = -52 + Math.sin(ph * 6) * 6;
        rodBend = 0.35 + (pose.tension || 0) * 0.55;
        armL = 1; lean = 1;
        leftHandCircle = true;
        break;
      case "caught":
        bob = -Math.abs(Math.sin(ph * 3)) * 3;
        rodAng = -84; armL = 2; lean = -1;
        break;
      case "sad":
        bob = Math.sin(ph * 0.8) * 0.6 + 1.5;
        rodAng = -8; rodBend = 0.05; armL = 0; lean = 3;
        headDy = 2;
        break;
    }
    rodBend += pose.rodBend || 0;

    var ox = fx, oy = fy + bob; // origin at feet
    // ---- shadow (soft, drawn under) ----
    ctx.fillStyle = "rgba(10,20,30,0.28)";
    ctx.fillRect(fx - 9, fy, 18, 2);
    ctx.fillRect(fx - 7, fy + 2, 14, 1);

    // ---- legs ----
    var lLeg = ox - 5, rLeg = ox + 1 + lean * 0;
    var lStep = 0, rStep = 0;
    if (st === "reel") { lStep = Math.sin(ph * 6) * 0.8; rStep = -lStep; }
    if (st === "sad") { lLeg -= 1; rLeg += 1; }
    // pants
    px(ctx, lLeg, oy - 16 + lStep, 5, 10, COL.pants);
    px(ctx, rLeg, oy - 16 + rStep, 5, 10, COL.pants);
    px(ctx, lLeg, oy - 16 + lStep, 1, 10, COL.pantsD);
    px(ctx, rLeg + 4, oy - 16 + rStep, 1, 10, COL.pantsD);
    // boots
    px(ctx, lLeg - 1, oy - 6 + lStep, 7, 5, COL.boots);
    px(ctx, rLeg - 1, oy - 6 + rStep, 7, 5, COL.boots);
    px(ctx, lLeg - 1, oy - 6 + lStep, 7, 1, COL.bootsD);
    px(ctx, rLeg - 1, oy - 6 + rStep, 7, 1, COL.bootsD);
    // boot toes (slight forward point toward water = down)
    px(ctx, lLeg, oy - 2, 5, 2, COL.boots);
    px(ctx, rLeg, oy - 2, 5, 2, COL.boots);

    // ---- torso ----
    var ty = oy - 32; // torso top
    px(ctx, ox - 6, ty, 13, 16, COL.jersey);
    px(ctx, ox - 6, ty, 2, 16, COL.jerseyD);           // left shade
    px(ctx, ox + 5, ty, 2, 16, FG.shadeHex(COL.jersey, -0.12)); // right light edge
    px(ctx, ox - 6, ty, 13, 2, COL.jerseyD);           // shoulder line
    px(ctx, ox - 3, ty + 1, 7, 2, COL.collar);         // collar / neck area
    // suspenders
    px(ctx, ox - 3, ty + 2, 2, 12, COL.susp);
    px(ctx, ox + 2, ty + 2, 2, 12, COL.susp);
    // belt
    px(ctx, ox - 6, ty + 14, 13, 2, COL.belt);
    // hem shadow
    px(ctx, ox - 6, oy - 17, 13, 1, FG.shadeHex(COL.jersey, -0.35));

    // ---- arms ----
    var rShX = ox + 6, rShY = ty + 3;   // right shoulder (near side)
    var lShX = ox - 7, lShY = ty + 4;   // left shoulder

    // rod grip position relative to body
    var grip = { x: ox + 8, y: ty + 6 };
    if (st === "cast") grip.x = ox + 7;
    var ang = rodAng * Math.PI / 180;

    // right arm: shoulder -> hand at grip (2-segment)
    var handR = grip;
    var midR = { x: (rShX + handR.x) / 2, y: (rShY + handR.y) / 2 - 2 };
    // upper sleeve
    ART.thickLine(ctx, rShX, rShY, midR.x, midR.y, 3, COL.jersey);
    // forearm (skin)
    ART.thickLine(ctx, midR.x, midR.y, handR.x, handR.y, 2, COL.skin);
    px(ctx, midR.x, midR.y, 3, 3, COL.jerseyD); // elbow shade

    // left arm varies
    var handL;
    if (armL === 1) {
      handL = { x: grip.x - 3, y: grip.y + 4 };
      if (leftHandCircle) {
        handL.x += Math.cos(ph * 6) * 2;
        handL.y += Math.sin(ph * 6) * 2;
      }
      var midL = { x: (lShX + handL.x) / 2 + 1, y: (lShY + handL.y) / 2 + 1 };
      ART.thickLine(ctx, lShX, lShY, midL.x, midL.y, 3, FG.shadeHex(COL.jersey, -0.2));
      ART.thickLine(ctx, midL.x, midL.y, handL.x, handL.y, 2, COL.skinD);
      px(ctx, handL.x - 1, handL.y - 1, 3, 3, COL.skinD);
    } else if (armL === 2) {
      handL = { x: ox - 8, y: ty - 8 };
      var midL2 = { x: lShX - 1, y: (lShY + handL.y) / 2 };
      ART.thickLine(ctx, lShX, lShY, midL2.x, midL2.y, 3, FG.shadeHex(COL.jersey, -0.2));
      ART.thickLine(ctx, midL2.x, midL2.y, handL.x, handL.y, 2, COL.skinD);
      px(ctx, handL.x - 1, handL.y - 2, 4, 4, COL.skinD); // raised fist
    } else {
      handL = { x: lShX - 1, y: ty + 14 };
      var midL3 = { x: lShX - 2, y: (lShY + handL.y) / 2 };
      ART.thickLine(ctx, lShX, lShY, midL3.x, midL3.y, 3, FG.shadeHex(COL.jersey, -0.2));
      ART.thickLine(ctx, midL3.x, midL3.y, handL.x, handL.y, 2, COL.skinD);
      px(ctx, handL.x - 1, handL.y, 3, 3, COL.skinD);
    }

    // ---- head (slightly turned right: face sliver visible) ----
    var hx = ox, hy = oy - 32 - 11 + headDy;
    // back/head base
    px(ctx, hx - 5, hy + 1, 11, 10, COL.skin);
    px(ctx, hx - 5, hy + 1, 2, 10, COL.skinD);            // left shade
    px(ctx, hx - 5, hy + 1, 11, 2, COL.hair);             // hairline under hat
    // face sliver on the right (turned) side
    px(ctx, hx + 3, hy + 4, 3, 6, COL.skin);
    px(ctx, hx + 4, hy + 5, 1, 1, "#1d1620");             // eye
    px(ctx, hx + 5, hy + 7, 1, 2, COL.skinD);             // nose edge
    px(ctx, hx + 4, hy + 9, 2, 1, FG.shadeHex(COL.skinD, -0.2)); // mouth hint
    // neck
    px(ctx, hx - 2, hy + 10, 5, 2, COL.skinD);

    // ---- hat ----
    var hyat = hy - 2;
    px(ctx, hx - 9, hyat + 5, 19, 2, COL.hat);            // brim
    px(ctx, hx - 9, hyat + 6, 19, 1, COL.hatD);           // brim shade
    px(ctx, hx - 6, hyat, 13, 5, COL.hat);                // crown
    px(ctx, hx - 6, hyat, 2, 5, COL.hatD);
    px(ctx, hx - 6, hyat + 3, 13, 1, COL.hatBand);        // band
    px(ctx, hx + 7, hyat + 5, 1, 1, FG.shadeHex(COL.hat, 0.2)); // brim tip light

    // ---- rod ----
    var rodLen = 30;
    var joint = { x: grip.x + Math.cos(ang) * rodLen * 0.55, y: grip.y + Math.sin(ang) * rodLen * 0.55 };
    var tip = {
      x: grip.x + Math.cos(ang) * rodLen + Math.sin(ang) * rodBend * 9,
      y: grip.y + Math.sin(ang) * rodLen - Math.cos(ang) * -rodBend * 9
    };
    // bend pulls tip toward bobber (down-ish)
    tip.y += rodBend * 10;
    ART.thickLine(ctx, grip.x, grip.y, joint.x, joint.y, 3, COL.rod);
    ART.thickLine(ctx, grip.x, grip.y, joint.x, joint.y, 1, FG.shadeHex(COL.rod, 0.25));
    ART.thickLine(ctx, joint.x, joint.y, tip.x, tip.y, 2, COL.rod);
    ART.thickLine(ctx, joint.x, joint.y, tip.x, tip.y, 1, FG.shadeHex(COL.rod, 0.25));
    px(ctx, tip.x - 1, tip.y - 1, 2, 2, COL.rodG);        // tip guide
    // reel under grip
    px(ctx, grip.x - 2, grip.y + 3, 5, 4, COL.reel);
    px(ctx, grip.x - 2, grip.y + 3, 5, 1, COL.reelD);
    px(ctx, grip.x + 2, grip.y + 5, 2, 2, COL.reelD);     // reel knob
    // grip handle
    ART.thickLine(ctx, grip.x, grip.y, grip.x - 4, grip.y + 2, 3, COL.grip);
    px(ctx, grip.x - 6, grip.y + 1, 3, 3, COL.grip);

    // hands on top of rod butt
    px(ctx, handR.x - 1, handR.y - 1, 4, 4, COL.skin);
    px(ctx, handR.x - 1, handR.y + 2, 4, 1, COL.skinD);

    return { rodTip: tip, rodBase: grip };
  };

  // ---- HUD portrait (front view face) ----
  C.portrait = function () {
    return ART.get("portrait", function () {
      var c = FG.makeCanvas(32, 32), ctx = c.getContext("2d");
      var cx = 16;
      // shoulders/collar
      px(ctx, cx - 11, 26, 22, 6, COL.jersey);
      px(ctx, cx - 11, 26, 22, 1, COL.jerseyD);
      px(ctx, cx - 4, 26, 3, 2, COL.collar);
      px(ctx, cx + 2, 26, 3, 2, COL.collar);
      // head
      px(ctx, cx - 8, 10, 16, 15, COL.skin);
      px(ctx, cx - 8, 10, 3, 15, COL.skinD);
      px(ctx, cx + 6, 10, 2, 15, FG.shadeHex(COL.skin, 0.12));
      // hair sides
      px(ctx, cx - 9, 13, 2, 8, COL.hair);
      px(ctx, cx + 7, 13, 2, 8, COL.hair);
      // eyes
      px(ctx, cx - 4, 16, 2, 2, "#1d1620");
      px(ctx, cx + 3, 16, 2, 2, "#1d1620");
      px(ctx, cx - 3, 16, 1, 1, "#8fb8ff"); // glint
      px(ctx, cx + 4, 16, 1, 1, "#8fb8ff");
      // nose + mouth
      px(ctx, cx, 18, 2, 3, COL.skinD);
      px(ctx, cx - 2, 23, 5, 1, FG.shadeHex(COL.skinD, -0.25));
      // stubble dots
      px(ctx, cx - 3, 22, 1, 1, COL.hair); px(ctx, cx + 4, 22, 1, 1, COL.hair);
      // hat
      px(ctx, cx - 12, 8, 24, 3, COL.hat);
      px(ctx, cx - 12, 10, 24, 1, COL.hatD);
      px(ctx, cx - 8, 2, 16, 6, COL.hat);
      px(ctx, cx - 8, 2, 3, 6, COL.hatD);
      px(ctx, cx - 8, 6, 16, 1, COL.hatBand);
      px(ctx, cx + 5, 1, 2, 2, COL.hatBand); // little feather knot
      return c;
    });
  };
})();
