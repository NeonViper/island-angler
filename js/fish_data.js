// ============================================================
// fish_data.js - species database, rarities, economy constants.
// All species original. Art lives in fish_art.js (art key per id).
// ============================================================

FG.RARITIES = [
  { id: "common",    name: "COMMON",    color: "#a3aab5", xp: 1.0 },
  { id: "uncommon",  name: "UNCOMMON",  color: "#4ec26b", xp: 1.4 },
  { id: "rare",      name: "RARE",      color: "#3b9dff", xp: 2.0 },
  { id: "epic",      name: "EPIC",      color: "#a865f6", xp: 3.2 },
  { id: "legendary", name: "LEGENDARY", color: "#e8b71f", xp: 5.0 },
  { id: "mythical",  name: "MYTHICAL",  color: "#e8423f", xp: 8.0 }
];
FG.rarityIdx = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythical: 5 };
FG.rarityColor = function (r) { return FG.RARITIES[FG.rarityIdx[r]].color; };
FG.rarityName = function (r) { return FG.RARITIES[FG.rarityIdx[r]].name; };

// rarity pick weights per rod tier (1..4)
FG.RARITY_TABLE = {
  1: [75, 20, 4.5, 0.45, 0.05, 0],
  2: [58, 27, 10, 3.0, 0.32, 0],
  3: [45, 35, 16, 3.5, 0.5, 0],
  4: [25, 35, 25, 10, 4, 1]
};
// bait rarity multipliers [common,uncommon,rare,epic,legendary,mythical]
FG.BAIT_RARITY = {
  worm:     [1, 1, 1, 1, 1, 0],
  tropical: [0.9, 1.35, 1.15, 1.0, 0.85, 0],
  shiny:    [0.75, 1.3, 1.8, 1.4, 1.1, 0],
  deep:     [0.55, 0.85, 1.35, 1.9, 2.2, 0],
  mystic:   [0.35, 0.75, 1.25, 2.6, 4.2, 6]
};

function fish(o) { return o; }

FG.FISH = [
// ---------------- COMMON ----------------
fish({ id:"guppy", name:"PEARL FIN GUPPY", rarity:"common", art:"guppy",
  levelReq:1, rodMin:1, difficulty:1, speed:46, schooling:true, depth:[0,0.75], time:"any",
  lenMin:2, lenMax:6, wMin:0.01, wMax:0.04, value:6, xp:4, baitPref:["worm","tropical"],
  desc:"A speckled ornament of the shallows. Its pearly tail flickers like a coin in the sun." }),
fish({ id:"tetra", name:"EMBERFIN TETRA", rarity:"common", art:"tetra",
  levelReq:1, rodMin:1, difficulty:1, speed:52, schooling:true, depth:[0,0.6], time:"day",
  lenMin:3, lenMax:7, wMin:0.01, wMax:0.05, value:7, xp:4, baitPref:["worm","tropical"],
  desc:"Schools of these tiny lantern-fish dart like sparks over the reef at midday." }),
fish({ id:"blenny", name:"TIDEPOOL BLENNY", rarity:"common", art:"blenny",
  levelReq:1, rodMin:1, difficulty:1, speed:18, schooling:false, depth:[0,0.35], time:"any",
  lenMin:5, lenMax:11, wMin:0.02, wMax:0.09, value:8, xp:5, baitPref:["worm"],
  desc:"A grumpy little bottom-dweller with a frilled crest. Bites fingers and patience alike." }),
fish({ id:"goby", name:"SAND GOBY", rarity:"common", art:"goby",
  levelReq:1, rodMin:1, difficulty:1, speed:22, schooling:true, depth:[0,0.5], time:"any",
  lenMin:4, lenMax:9, wMin:0.02, wMax:0.06, value:7, xp:4, baitPref:["worm","tropical"],
  desc:"Almost the color of wet sand. It perches on the seabed like a shy stone with fins." }),
fish({ id:"darter", name:"SILVER DARTER", rarity:"common", art:"darter",
  levelReq:1, rodMin:1, difficulty:2, speed:34, schooling:false, depth:[0.1,0.8], time:"any",
  lenMin:9, lenMax:17, wMin:0.04, wMax:0.18, value:10, xp:5, baitPref:["worm","shiny"],
  desc:"A sleek arrow of polished silver that hunts in nervous, lightning darts." }),
fish({ id:"damsel", name:"BANDED DAMSELFISH", rarity:"common", art:"damsel",
  levelReq:1, rodMin:1, difficulty:2, speed:40, schooling:true, depth:[0.2,0.9], time:"day",
  lenMin:5, lenMax:10, wMin:0.03, wMax:0.10, value:9, xp:5, baitPref:["tropical"],
  desc:"Stubborn and scrappy, it will chase a line ten times its size. Gold band, cobalt attitude." }),
fish({ id:"snapper", name:"DUSKY SNAPPER", rarity:"common", art:"snapper",
  levelReq:1, rodMin:1, difficulty:2, speed:28, schooling:false, depth:[0.25,1], time:"night",
  lenMin:20, lenMax:40, wMin:0.3, wMax:1.4, value:14, xp:7, baitPref:["worm","shiny"],
  desc:"A dependable evening catch with copper eyes and a taste for moonlit worms." }),

// ---------------- UNCOMMON ----------------
fish({ id:"clownfish", name:"CLOWNFISH", rarity:"uncommon", art:"clownfish",
  levelReq:1, rodMin:1, difficulty:2, speed:30, schooling:false, depth:[0,0.5], time:"day",
  lenMin:7, lenMax:14, wMin:0.08, wMax:0.35, value:24, xp:10, baitPref:["tropical"],
  desc:"Three bold bands of snow on a flame-orange body. Fearlessly curious about anything shiny." }),
fish({ id:"tang", name:"BLUE TANG", rarity:"uncommon", art:"tang",
  levelReq:2, rodMin:1, difficulty:3, speed:34, schooling:false, depth:[0.2,0.85], time:"day",
  lenMin:16, lenMax:30, wMin:0.3, wMax:1.2, value:30, xp:12, baitPref:["tropical","shiny"],
  desc:"A royal-blue disc edged with a black painter's brush, and a tail of pure sunshine." }),
fish({ id:"parrotfish", name:"REEF PARROTFISH", rarity:"uncommon", art:"parrotfish",
  levelReq:3, rodMin:2, difficulty:3, speed:22, schooling:false, depth:[0.1,0.8], time:"day",
  lenMin:28, lenMax:55, wMin:1.0, wMax:3.8, value:36, xp:14, baitPref:["tropical"],
  desc:"Its fused beak crunches coral into sand. The whole reef is its lunch plate." }),
fish({ id:"angel", name:"GOLDFIN ANGELFISH", rarity:"uncommon", art:"angel",
  levelReq:3, rodMin:2, difficulty:4, speed:20, schooling:false, depth:[0.2,0.9], time:"any",
  lenMin:16, lenMax:30, wMin:0.4, wMax:1.6, value:38, xp:14, baitPref:["tropical","shiny"],
  desc:"Tall sail-like fins and vertical gold bars. Glides like a butterfly over the reef wall." }),
fish({ id:"wrasse", name:"EMERALD WRASSE", rarity:"uncommon", art:"wrasse",
  levelReq:2, rodMin:1, difficulty:3, speed:38, schooling:false, depth:[0.1,0.7], time:"day",
  lenMin:12, lenMax:24, wMin:0.15, wMax:0.8, value:28, xp:11, baitPref:["tropical","shiny"],
  desc:"A ribbon of jade with a forked emerald tail. Sleeps buried in the sand like a secret." }),
fish({ id:"puffer", name:"SPINEBACK PUFFERFISH", rarity:"uncommon", art:"puffer",
  levelReq:3, rodMin:2, difficulty:4, speed:14, schooling:false, depth:[0.1,0.6], time:"any",
  lenMin:14, lenMax:30, wMin:0.3, wMax:1.6, value:34, xp:13, baitPref:["worm","shiny"],
  desc:"Inflates into a ball of bristling thorns when startled. Tastes, famously, of regret." }),

// ---------------- RARE ----------------
fish({ id:"lionfish", name:"LIONFISH", rarity:"rare", art:"lionfish",
  levelReq:4, rodMin:2, difficulty:5, speed:12, schooling:false, depth:[0.2,0.9], time:"night",
  lenMin:18, lenMax:35, wMin:0.35, wMax:1.5, value:68, xp:22, baitPref:["tropical","deep"],
  desc:"A drifting fan of striped venom. The most beautiful thing on the reef - and the sharpest." }),
fish({ id:"mahi", name:"MAHI-MAHI", rarity:"rare", art:"mahi",
  levelReq:5, rodMin:2, difficulty:6, speed:48, schooling:false, depth:[0.5,1], time:"day",
  lenMin:50, lenMax:110, wMin:3, wMax:14, value:95, xp:26, baitPref:["shiny","deep"],
  desc:"Emerald and gold, with a king's crown along its back. Jumps when it sees the boat." }),
fish({ id:"tuna", name:"YELLOWFIN TUNA", rarity:"rare", art:"tuna",
  levelReq:6, rodMin:2, difficulty:7, speed:62, schooling:true, depth:[0.6,1], time:"any",
  lenMin:60, lenMax:120, wMin:15, wMax:65, value:120, xp:28, baitPref:["shiny","deep"],
  desc:"A torpedo of muscle that runs the open current. Reeling one in is a full-body argument." }),
fish({ id:"barracuda", name:"BARRACUDA", rarity:"rare", art:"barracuda",
  levelReq:5, rodMin:2, difficulty:6, speed:64, schooling:false, depth:[0.4,1], time:"any",
  lenMin:55, lenMax:115, wMin:3.5, wMax:18, value:100, xp:27, baitPref:["shiny","deep"],
  desc:"Glass knives in a jaw that never quite closes. It watches you decide whether to bite." }),
fish({ id:"jack", name:"MANGROVE JACK", rarity:"rare", art:"jack",
  levelReq:4, rodMin:2, difficulty:5, speed:52, schooling:false, depth:[0.3,0.9], time:"any",
  lenMin:32, lenMax:62, wMin:1.8, wMax:9, value:80, xp:24, baitPref:["shiny","worm"],
  desc:"A bruiser in a bronze suit with a black spot at its heart. Fights harder than it looks." }),
fish({ id:"ray", name:"SAND GLIDER STINGRAY", rarity:"rare", art:"ray",
  levelReq:5, rodMin:2, difficulty:5, speed:16, schooling:false, depth:[0.3,1], time:"night",
  lenMin:45, lenMax:95, wMin:2, wMax:11, value:88, xp:25, baitPref:["deep","worm"],
  desc:"A winged shadow that walks on the sand. Its undulation looks like slow flight." }),

// ---------------- EPIC ----------------
fish({ id:"hammerhead", name:"HAMMERHEAD SHARK", rarity:"epic", art:"hammerhead",
  levelReq:7, rodMin:3, difficulty:8, speed:44, schooling:false, depth:[0.5,1], time:"any",
  lenMin:95, lenMax:160, wMin:20, wMax:85, value:280, xp:55, baitPref:["deep","shiny"],
  desc:"Eyes at both ends of a strange copper head. It circles the bobber like a question mark." }),
fish({ id:"swordfish", name:"MOONSAIL SWORDFISH", rarity:"epic", art:"swordfish",
  levelReq:8, rodMin:3, difficulty:8, speed:58, schooling:false, depth:[0.6,1], time:"night",
  lenMin:90, lenMax:145, wMin:30, wMax:95, value:320, xp:60, baitPref:["deep","shiny"],
  desc:"It carries a silver lance and sails a midnight blue fin against the moon." }),
fish({ id:"marlin", name:"BLUE MARLIN", rarity:"epic", art:"marlin",
  levelReq:9, rodMin:3, difficulty:9, speed:60, schooling:false, depth:[0.7,1], time:"day",
  lenMin:100, lenMax:170, wMin:40, wMax:140, value:380, xp:65, baitPref:["deep"],
  desc:"A cobalt spear of pure momentum. Legends say a marlin can pull a boat into the sunrise." }),
fish({ id:"grouper", name:"TIGER GROUPER", rarity:"epic", art:"grouper",
  levelReq:7, rodMin:3, difficulty:8, speed:18, schooling:false, depth:[0.5,1], time:"night",
  lenMin:45, lenMax:90, wMin:5, wMax:28, value:260, xp:52, baitPref:["deep","worm"],
  desc:"Ambush predator with tiger-stripe flanks. It sits like a rock, then erupts like a trap." }),
fish({ id:"lantern", name:"ABYSS LANTERNFISH", rarity:"epic", art:"lantern",
  levelReq:7, rodMin:3, difficulty:7, speed:26, schooling:true, depth:[0.8,1], time:"night",
  lenMin:10, lenMax:19, wMin:0.1, wMax:0.45, value:240, xp:50, baitPref:["mystic","deep"],
  desc:"It rises from the midnight trench trailing its own constellation of cold lights." }),

// ---------------- LEGENDARY ----------------
fish({ id:"koi", name:"GOLDEN KOI", rarity:"legendary", art:"koi",
  levelReq:12, rodMin:3, difficulty:8, speed:16, schooling:false, depth:[0,0.5], time:"any",
  lenMin:35, lenMax:70, wMin:1, wMax:7, value:950, xp:120, baitPref:["mystic","tropical"],
  desc:"A pond noble that somehow reached the sea. Old fishermen say it grants one wish and keeps nine." }),
fish({ id:"eel", name:"PHANTOM EEL", rarity:"legendary", art:"eel",
  levelReq:13, rodMin:3, difficulty:9, speed:30, schooling:false, depth:[0.5,1], time:"night",
  lenMin:90, lenMax:160, wMin:4, wMax:14, value:1100, xp:130, baitPref:["mystic","deep"],
  desc:"A ribbon of living twilight that uncoils from nowhere. Many insist it was never there at all." }),
fish({ id:"sunfish", name:"OCEAN MOONFISH", rarity:"legendary", art:"sunfish",
  levelReq:14, rodMin:3, difficulty:9, speed:10, schooling:false, depth:[0.4,1], time:"day",
  lenMin:90, lenMax:140, wMin:25, wMax:95, value:1300, xp:140, baitPref:["mystic","shiny"],
  desc:"A floating sun-disk of silver-blue, basking sideways on the swell like a dream of a whale." }),

// ---------------- MYTHICAL ----------------
fish({ id:"jelly", name:"CRYSTAL JELLYFISH", rarity:"mythical", art:"jelly",
  levelReq:18, rodMin:4, difficulty:9, speed:8, schooling:false, depth:[0.3,1], time:"night",
  lenMin:40, lenMax:95, wMin:1.5, wMax:12, value:3200, xp:280, baitPref:["mystic"],
  desc:"A bell of living glass that rings like a choir when the tide turns. It glows from memory." }),
fish({ id:"ghostlin", name:"AURORA GHOSTLIN", rarity:"mythical", art:"ghostlin",
  levelReq:18, rodMin:4, difficulty:10, speed:55, schooling:false, depth:[0.8,1], time:"night",
  lenMin:150, lenMax:240, wMin:80, wMax:210, value:4200, xp:340, baitPref:["mystic"],
  desc:"The reef's oldest myth: a marlin braided from aurora light, seen once in a lifetime, never twice." })
];

FG.FISH_BY_ID = {};
FG.FISH.forEach(function (f) { FG.FISH_BY_ID[f.id] = f; });

// ---------------- EQUIPMENT DATA ----------------
FG.EQUIP = {
  rods: [
    { id:"rod_wood",   name:"OLD WOODEN ROD", tier:1, price:0,    level:1,  hook:0.00, luck:0.00,
      desc:"Bent, whittled, stubborn. It has landed more sunsets than fish." },
    { id:"rod_fiber",  name:"FIBERGLASS ROD", tier:2, price:250,  level:3,  hook:0.15, luck:0.55,
      desc:"Springs back true. Noticeably better odds of a bite worth hooking." },
    { id:"rod_carbon", name:"CARBON PRO ROD", tier:3, price:1000, level:7,  hook:0.30, luck:1.00,
      desc:"A professional's spine. Deeper patience, better luck, cleaner hook-sets." },
    { id:"rod_star",   name:"CELESTIAL ROD",  tier:4, price:5000, level:15, hook:0.50, luck:1.00,
      desc:"Quivered from star-iron. The mythical fish of the bay hear it hum." }
  ],
  reels: [
    { id:"reel_basic", name:"TIN REEL",       tier:1, price:0,    level:1, reel:1.00, control:0.00,
      desc:"It clicks, it squeaks, it mostly works." },
    { id:"reel_bronze",name:"BRONZE DRAG REEL",tier:2, price:200,  level:4, reel:1.18, control:0.15,
      desc:"A smoother drag. Line tension bleeds off gentler in a fight." },
    { id:"reel_steel", name:"STEELWORK REEL", tier:3, price:900,  level:10, reel:1.38, control:0.30,
      desc:"Machined gears. Reel faster with far less build-up in the line." },
    { id:"reel_moon",  name:"MOONLIT REEL",   tier:4, price:4000, level:16, reel:1.55, control:0.45,
      desc:"Silent as moonwater. The handle turns like it is dreaming." }
  ],
  lines: [
    { id:"line_hemp",   name:"HEMPLINE",       tier:1, price:0,    level:1,  snap:0.00, pull:0.00,
      desc:"Braided from old rope. It snaps the way rumors do." },
    { id:"line_nylon",  name:"NYLON LINE",     tier:2, price:180,  level:5,  snap:0.15, pull:0.05,
      desc:"Stretchy and forgiving. Gives you a second to think." },
    { id:"line_braid",  name:"BRAIDED CORE",   tier:3, price:850,  level:11, snap:0.30, pull:0.10,
      desc:"Thin, strong, honest. Large fish stop being automatic losses." },
    { id:"line_silk",   name:"SPECTRE SILK",   tier:4, price:3800, level:17, snap:0.45, pull:0.15,
      desc:"Nearly invisible, nearly unbreakable. Whispers under load." }
  ],
  baits: [
    { id:"worm",     name:"BASIC WORM",      price:0,   level:1,  stack:true,  amount:9999,
      desc:"Infinite bait from the jar by the dock. Standard catches." },
    { id:"tropical", name:"TROPICAL BAIT",   price:40,  level:2,  stack:true,  amount:5,
      desc:"Fruit-and-shrimp mix. More reef & tropical species." },
    { id:"shiny",    name:"SHINY LURE",      price:70,  level:5,  stack:true,  amount:5,
      desc:"Glints like a panicked minnow. Boosts uncommon & rare." },
    { id:"deep",     name:"DEEPWATER LURE",  price:120, level:8,  stack:true,  amount:5,
      desc:"Sinks like stone. Attracts the big ones of the current." },
    { id:"mystic",   name:"MYSTIC BAIT",     price:260, level:12, stack:true,  amount:3,
      desc:"Smells faintly of lightning. The only thing mythical fish bite." }
  ]
};

// ---------------- LEVELS ----------------
FG.MAX_LEVEL = 20;
FG.xpForLevel = function (level) {
  // xp needed to advance FROM this level
  return Math.round(40 + level * 30 + level * level * 6);
};

// ---------------- RANKS ----------------
FG.RANKS = [
  { id:"beginner", name:"BEGINNER",        req:{},                                   perk:"BASIC TACKLE" },
  { id:"apprentice", name:"APPRENTICE",    req:{totalCaught:10},                     perk:"BETTER BAIT ACCESS" },
  { id:"skilled", name:"SKILLED ANGLER",   req:{species:10},                         perk:"BETTER ROD ACCESS" },
  { id:"expert", name:"EXPERT",           req:{rareCaught:3},                        perk:"ADVANCED TACKLE" },
  { id:"master", name:"MASTER",           req:{epicCaught:1},                        perk:"SPECIAL VASES" },
  { id:"legend", name:"LEGENDARY ANGLER", req:{legendaryCaught:1},                   perk:"GLORIOUS TITLE" }
];
FG.RANK_XP = [0, 40, 80, 160, 300, 600];

// ---------------- QUALITY ----------------
FG.QUALITIES = [
  { id:"standard", name:"STANDARD",  mult:1.0, color:"#a3aab5" },
  { id:"good",     name:"GOOD",      mult:1.2, color:"#4ec26b" },
  { id:"excellent",name:"EXCELLENT", mult:1.5, color:"#3b9dff" },
  { id:"perfect",  name:"PERFECT",   mult:2.0, color:"#e8b71f" }
];

// ---------------- CHALLENGES (repeatable) & ACHIEVEMENTS (once) ----------------
FG.CHALLENGES = [
  { id:"ch_catch5",     name:"BASKET FULL",      desc:"CATCH 5 FISH",                  goal:5,   reward:{coins:50,  xp:15},  repeat:true,  track:"fishCaught" },
  { id:"ch_species3",   name:"VARIED PALETTE",   desc:"CATCH 3 DIFFERENT SPECIES",     goal:3,   reward:{coins:75,  xp:20},  repeat:true,  track:"speciesCaught" },
  { id:"ch_heavy5",     name:"HEAVYWEIGHT",      desc:"CATCH A FISH OVER 5 KG",        goal:1,   reward:{coins:100, xp:25},  repeat:true,  track:"heavyCatch" },
  { id:"ch_rare3",      name:"RARE AIR",         desc:"CATCH 3 RARE+ FISH",            goal:3,   reward:{coins:200, xp:50},  repeat:true,  track:"rareCaught" },
  { id:"ch_streak10",   name:"UNBROKEN STREAK",  desc:"CATCH 10 WITHOUT LOSING ONE",   goal:10,  reward:{coins:150, xp:40},  repeat:true,  track:"cleanStreak" },
  { id:"ch_discover15", name:"REEF SCHOLAR",     desc:"DISCOVER 15 SPECIES",           goal:15,  reward:{coins:300, xp:60},  repeat:false, track:"speciesTotal" }
];

FG.ACHIEVEMENTS = [
  { id:"ach_first",     name:"FIRST CAST REWARD", desc:"LAND YOUR FIRST FISH" },
  { id:"ach_rare",      name:"GLITTER IN THE LINE", desc:"CATCH A RARE FISH" },
  { id:"ach_epic",      name:"BEAST OF THE BAY", desc:"CATCH AN EPIC FISH" },
  { id:"ach_legend",    name:"WHAT THE TIDE OWES", desc:"CATCH A LEGENDARY FISH" },
  { id:"ach_myth",      name:"THE IMPOSSIBLE KNOT", desc:"CATCH A MYTHICAL FISH" },
  { id:"ach_half",      name:"HALF THE OCEAN", desc:"DISCOVER 50% OF ALL SPECIES" },
  { id:"ach_all",       name:"THE WHOLE BLUE", desc:"DISCOVER EVERY SPECIES" },
  { id:"ach_huge",      name:"MONSTER WEIGHT", desc:"LAND A FISH OVER 20 KG" },
  { id:"ach_perfect",   name:"FLAWLESS KNOT", desc:"LAND A PERFECT QUALITY FISH" },
  { id:"ach_maxlevel",  name:"MASTER ANGLER", desc:"REACH LEVEL 20" },
  { id:"ach_trophies5", name:"WALL OF WONDERS", desc:"KEEP 5 TROPHIES" },
  { id:"ach_night",     name:"MOONWATCH", desc:"CATCH FISH AT NIGHT" }
];
