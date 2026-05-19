const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const HEIGHT = 16;
const WIDTH = 60;
const ALLOWED = new Set(['0', '1', 'X', 'B', '<', '>', 'T', 'R', 'S', 'E']);
const DANGER = new Set(['X', 'B']);
const SOLID = new Set(['1', '<', '>', 'T']);
const INTERACTIVE = new Set(['R', '<', '>', 'T', 'B', 'X']);
const CLEAR = new Set(['0', 'S', 'E', 'R']);

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function normalizeMap(map) {
  if (!Array.isArray(map) || map.length !== HEIGHT) return null;

  let starts = 0;
  let exits = 0;
  const normalized = [];

  for (const rowValue of map) {
    if (typeof rowValue !== 'string' || rowValue.length !== WIDTH) return null;

    let row = '';
    for (const tile of rowValue) {
      if (!ALLOWED.has(tile)) return null;
      if (tile === 'S') starts++;
      if (tile === 'E') exits++;
      row += tile;
    }
    normalized.push(row);
  }

  if (starts !== 1 || exits < 1) return null;
  return normalized;
}

function findTile(map, tileToFind) {
  for (let r = 0; r < HEIGHT; r++) {
    for (let c = 0; c < WIDTH; c++) {
      if (map[r][c] === tileToFind) return { r, c };
    }
  }
  return null;
}

function isClear(tile) {
  return CLEAR.has(tile);
}

function isDanger(tile) {
  return DANGER.has(tile);
}

function isSolid(tile) {
  return SOLID.has(tile);
}

function hasMostlyClosedBorders(map) {
  for (let c = 0; c < WIDTH; c++) {
    if (map[0][c] !== '1' || map[HEIGHT - 1][c] !== '1') return false;
  }
  for (let r = 0; r < HEIGHT; r++) {
    if (map[r][0] !== '1' || map[r][WIDTH - 1] !== '1') return false;
  }
  return true;
}

function hasSafeStart(map) {
  const start = findTile(map, 'S');
  if (!start) return false;

  // Keep enough air around spawn so the ball does not start clipped, trapped, or under a low ceiling.
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = start.r + dr;
      const c = start.c + dc;
      if (r < 0 || r >= HEIGHT || c < 0 || c >= WIDTH) return false;
      if (dr === 0 && dc === 0) continue;
      if (isDanger(map[r][c])) return false;
    }
  }

  // At least two clear cells above/around the start helps preserve proper ceiling height.
  if (start.r < 2) return false;
  if (!isClear(map[start.r - 1][start.c])) return false;
  if (!isClear(map[start.r - 2][start.c])) return false;

  return true;
}

function hasFunctionalCeilingAndTunnels(map) {
  // Reject cramped one-tile-high crawlspaces. The ball needs headroom for smooth Bounce-style movement.
  for (let r = 1; r < HEIGHT - 1; r++) {
    for (let c = 1; c < WIDTH - 1; c++) {
      if (!isClear(map[r][c])) continue;
      const ceilingImmediatelyAbove = isSolid(map[r - 1][c]);
      const floorImmediatelyBelow = isSolid(map[r + 1][c]);
      if (ceilingImmediatelyAbove && floorImmediatelyBelow) return false;
    }
  }
  return true;
}

function hasInteractiveGameplay(map) {
  let count = 0;
  for (const row of map) {
    for (const tile of row) {
      if (INTERACTIVE.has(tile)) count++;
    }
  }
  return count >= 3;
}

function hasClearTravelLine(map, fromR, fromC, toR, toC) {
  const steps = Math.max(Math.abs(toR - fromR), Math.abs(toC - fromC));
  if (steps <= 1) return true;

  for (let i = 1; i < steps; i++) {
    const r = Math.round(fromR + ((toR - fromR) * i) / steps);
    const c = Math.round(fromC + ((toC - fromC) * i) / steps);
    if (r <= 0 || r >= HEIGHT - 1 || c <= 0 || c >= WIDTH - 1) return false;
    if (!isClear(map[r][c])) return false;
  }
  return true;
}

function hasConservativeReachability(map) {
  const start = findTile(map, 'S');
  if (!start) return false;

  const rings = new Set();
  for (let r = 0; r < HEIGHT; r++) {
    for (let c = 0; c < WIDTH; c++) {
      if (map[r][c] === 'R') rings.add(`${r},${c}`);
    }
  }

  const visited = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));
  const queue = [start];
  visited[start.r][start.c] = true;
  let reachedExit = false;
  const reachedRings = new Set();

  while (queue.length) {
    const { r, c } = queue.shift();
    const tile = map[r][c];

    if (tile === 'E') reachedExit = true;
    if (tile === 'R') reachedRings.add(`${r},${c}`);

    const moves = [];

    // Horizontal movement through clear air/tunnels.
    moves.push([0, -1], [0, 1]);

    // Bounce-style jump/fall reach. Target cells must be clear, not solid/danger.
    for (let dr = -4; dr <= 8; dr++) {
      for (let dc = -5; dc <= 5; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (Math.abs(dc) <= 5 && dr >= -4 && dr <= 8) moves.push([dr, dc]);
      }
    }

    for (const [dr, dc] of moves) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 1 || nr >= HEIGHT - 1 || nc < 1 || nc >= WIDTH - 1) continue;
      if (visited[nr][nc]) continue;
      if (!isClear(map[nr][nc])) continue;
      if (isDanger(map[nr][nc])) continue;

      if (!hasClearTravelLine(map, r, c, nr, nc)) continue;

      visited[nr][nc] = true;
      queue.push({ r: nr, c: nc });
    }
  }

  return reachedExit && reachedRings.size === rings.size;
}

function validateLevelPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const map = normalizeMap(payload.map);
  if (!map) return null;
  if (!hasMostlyClosedBorders(map)) return null;
  if (!hasSafeStart(map)) return null;
  if (!hasFunctionalCeilingAndTunnels(map)) return null;
  if (!hasInteractiveGameplay(map)) return null;
  if (!hasConservativeReachability(map)) return null;

  return {
    levelName: typeof payload.levelName === 'string' && payload.levelName.trim()
      ? payload.levelName.trim().slice(0, 40)
      : 'AI Bounce Level',
    map
  };
}

function extractJsonObject(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    try {
      return JSON.parse(trimmed.slice(first, last + 1));
    } catch (_) {
      return null;
    }
  }
}

function buildPrompt(userPrompt) {
  const cleanPrompt = String(userPrompt || '').slice(0, 700).trim() || 'a balanced Bounce-style level';
  return `Generate one safe Bounce-style 2D platformer level as JSON only.

The player's concept request is the primary design brief. Build the level around it instead of returning a generic map. Use the theme through platform shapes, tunnel layout, obstacle placement, collectibles, and level rhythm.

Required output JSON shape:
{
  "levelName": "short name matching the user concept",
  "map": ["exactly 16 strings, each exactly 60 characters"]
}

Hard geometry rules:
- Exactly 16 rows.
- Exactly 60 columns per row.
- Allowed characters only: 0, 1, X, B, <, >, T, R, S, E.
- Top, bottom, left, and right borders must be solid 1.
- Keep functional ceiling height. Do not create one-tile-high tunnels or crawlspaces.
- Use readable platform structures, ramps/stairs made from 1 tiles, ledges, bridges, and open air pockets.
- Keep a clear playable route from S to E.
- If using rings, all rings must be reachable before the exit.
- Do not place S inside danger, next to danger, clipped into walls, or under a low ceiling.

Tile meanings:
- 0 = empty air.
- 1 = solid platform/wall.
- X = spike danger.
- B = bomb danger.
- < and > = solid conveyor platforms that push left/right.
- T = timed phase platform. It becomes solid and non-solid over time. Use it as a dynamic obstacle/bridge, not as a trampoline.
- R = collectible ring. The exit opens only after all rings are collected.
- S = player start. Use exactly one S.
- E = exit. Use at least one E.

Dynamic/interaction requirement:
- Include at least 3 interactive/dynamic elements total from R, <, >, T, B, X.
- The player should need to resolve or react to at least one mechanic: collect rings before exit, cross conveyors, time phase platforms, or avoid bombs/spikes.
- Do not spam hazards. Make them intentional and fair.

Concept adherence:
- If the user asks for a cave, make it tunnel-like but still tall enough.
- If the user asks for lava/traps, use X/B hazards carefully.
- If the user asks for moving/dynamic obstacles, use conveyors and T phase platforms.
- If the user asks for treasure/collection, use R rings.
- If the user asks for easy, keep hazards sparse and platforms wide.
- If the user asks for hard, add more timing and hazard pressure but keep the route valid.

Return JSON only. No markdown. No explanation.

Player request:
${cleanPrompt}`;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, { error: 'OPENROUTER_API_KEY is not configured on the server' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (_) {
    return sendJson(res, 400, { error: 'Invalid JSON request body' });
  }

  const model = process.env.AI_MODEL || 'openrouter/free';
  const prompt = buildPrompt(body.prompt);

  try {
    const aiResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://vercel.app',
        'X-Title': process.env.SITE_TITLE || 'Bounce AI Level Generator'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a strict level designer for an old Bounce-style browser platformer. Return valid JSON only. No markdown. No commentary. The user concept must visibly influence the generated level.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.55,
        max_tokens: 2600,
        response_format: { type: 'json_object' }
      })
    });

    if (!aiResponse.ok) {
      const details = await aiResponse.text().catch(() => '');
      return sendJson(res, 502, {
        error: 'AI provider request failed',
        status: aiResponse.status,
        details: details.slice(0, 300)
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData?.choices?.[0]?.message?.content;
    const parsed = typeof content === 'string' ? extractJsonObject(content) : content;
    const validLevel = validateLevelPayload(parsed);

    if (!validLevel) {
      return sendJson(res, 422, { error: 'AI returned an invalid or unsafe level. Try again with a clearer concept.' });
    }

    return sendJson(res, 200, validLevel);
  } catch (err) {
    return sendJson(res, 500, {
      error: 'Serverless AI generation failed',
      details: err && err.message ? err.message : 'Unknown error'
    });
  }
}
