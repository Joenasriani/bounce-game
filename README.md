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
- at least 3 interactive/dynamic elements from rings, conveyors, timed platforms, bombs, or spikes
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
R = collectible ring
S = player start
E = exit
```

## Responsive UI pass

This version keeps gameplay, physics, level data, and visual identity unchanged while improving menu and controller layout across mobile, tablet, desktop, and landscape screens.

- Menus use viewport-safe sizing and safe-area padding.
- Overlay panels are designed to stay fully visible without internal scrollbars.
- Touch controls scale with viewport size and respect mobile safe areas.
- HUD badges wrap safely on smaller screens.
