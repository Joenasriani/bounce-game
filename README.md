# Bounce Game - GitHub/Vercel Ready

This package keeps the browser game static and moves AI generation to a Vercel serverless function.

## Required Vercel Environment Variables

- `OPENROUTER_API_KEY`
- `AI_MODEL`

Recommended value:

```txt
AI_MODEL=openrouter/free
```

Optional:

- `SITE_URL`
- `SITE_TITLE`

## Structure

```txt
index.html
api/generate-level.js
package.json
```

The game calls:

```txt
/api/generate-level
```

No API key is stored in `index.html`.

## AI level rules now enforced

The frontend and the Vercel API route both validate generated levels before loading them:

- exactly 16 rows
- exactly 60 columns
- valid tile symbols only
- closed borders
- one player start `S`
- at least one exit `E`
- safe spawn clearance
- no one-tile-high tunnels
- no solid/danger cells on approved path targets
- at least 3 interactive/dynamic elements from rings, conveyors, one timed platform, pulsing electric hazards, bombs, or spikes
- reachable exit and reachable rings

## Tile meanings

```txt
0 = empty air
1 = solid wall/platform
X = spike danger
B = bomb danger
< = solid conveyor pushing left
> = solid conveyor pushing right
T = timed phase platform
Z = pulsing electric hazard
R = collectible ring
S = player start
E = exit
```

## Responsive UI pass

This version keeps the core gameplay, physics feel, controls, and visual identity intact while improving menu/controller layout and introducing a cleaner Level 8+ dynamic obstacle progression.

- Menus use viewport-safe sizing and safe-area padding.
- Overlay panels are designed to stay fully visible without internal scrollbars.
- Touch controls scale with viewport size and respect mobile safe areas.
- HUD badges wrap safely on smaller screens.


## Level design update

- Level 8 was rebuilt so the player no longer faces several repeated disappearing tier platforms.
- Timed phase platforms are now used as a single intentional bridge/gate section, not as every tier of the level.
- A new `Z` pulsing electric hazard starts from Level 8 onward. It is placed on readable paths with waiting space so the player resolves timing instead of fighting random placement.
- Level 9 and Level 10 continue the `Z` mechanic with higher pressure while preserving the same Bounce-style movement feel.
