# Island Angler

An original offline pixel-art fishing RPG that runs entirely in the browser —
no framework, no assets, no network. Every sprite, font glyph and sound is
generated procedurally by code at runtime.

## Play

Just open `index.html` in a modern browser, or serve the folder:

```
npx serve .
```

Click or tap to cast. Hold to charge cast power, release in the green zone for
distance. When a fish bites, tap quickly to hook it, then balance line tension
during the fight — too much tension snaps the line, too little lets it escape.
Rarity and species stay secret until you land the catch.

## Features

- 29 hand-coded fish species across 6 rarity tiers
- Day/night cycle, weather, animated tides and shoreline foam
- Tackle shop (rods, reels, lines, bait), quests, trophies, sea journal
- Save system via localStorage
- Fully procedural art: palms, hut, dock, character, fish, UI icons
- Custom bitmap font rendered from pixel data
- Pointer + touch input, 640x360 logical resolution, scales to any screen

## Structure

| File | Purpose |
| --- | --- |
| `js/util.js` | math, seeded RNG, palette helpers, canvas factory |
| `js/font.js` | 5x7 pixel bitmap font |
| `js/art.js` | shared pixel-art primitives (rects, ellipses, gradients, outlines) |
| `js/fish_data.js` | species, rarity, tackle and quest data tables |
| `js/fish_art.js` / `fish_art2.js` | procedural fish sprites |
| `js/char_art.js` | fisher character animation frames |
| `js/env_art.js` | palms, hut, dock props, clouds, icons |
| `js/audio.js` | WebAudio synth SFX |
| `js/save.js` | localStorage persistence |
| `js/game.js` | state machine: cast / bite / hook / fight / result |
| `js/widgets.js` | buttons, panels, hotbar |
| `js/screens.js` | shop, journal, quests, trophies, profile, menu |
| `js/render.js` | scene compositor: sky, sea, beach, dock, particles, HUD |
| `js/main.js` | boot + game loop |

Everything is original work — no external assets or libraries.
