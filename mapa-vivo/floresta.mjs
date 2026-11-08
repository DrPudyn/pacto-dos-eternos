// Floresta do mockup aprovado e os trechos que continuam à direita.
// O caminho é a mesma curva senoidal; só o tronco e a base bloqueiam.

import {CHAO, GRADE, HEROIS, MOBS_INICIAIS, OBJETOS, WANG} from './floresta/canonico.mjs';
import {CHUNK_PX, CHUNK_W, ROW0, ROWS, TILE} from './constantes.mjs';
import {hash32, mulberry32} from './rng.mjs';

export {CHAO, HEROIS, MOBS_INICIAIS, WANG};

const WANG_MAP = Object.fromEntries(WANG.map(tile => [tile.key, tile]));

export function pathCenter(x) {
  return 182 + 32 * Math.sin(x / 97 - 0.6) + 10 * Math.sin(x / 41);
}

export function pathHalf(x) {
  return 19 + 5 * Math.sin(x / 134);
}

export function terrainKind(x, y) {
  return Math.abs(y - pathCenter(x)) < pathHalf(x) ? 'L' : 'U';
}

export function wangKey(px, py) {
  let key = '';
  for (const [dx, dy] of [[0, 0], [TILE, 0], [0, TILE], [TILE, TILE]]) {
    key += terrainKind(px + dx, py + dy);
  }
  return key;
}

export function wangTile(px, py) {
  return WANG_MAP[wangKey(px, py)];
}

function onPath(x, y, pad = 6) {
  return Math.abs(y - pathCenter(x)) < pathHalf(x) + pad;
}

function tooClose(list, x, y, gap) {
  const limit = gap * gap;
  for (const item of list) {
    const dx = item.x - x;
    const dy = item.y - y;
    if (dx * dx + dy * dy < limit) return true;
  }
  return false;
}

// Células que a base ocupa. Dentro do retângulo do mockup, a âncora fora da
// imagem não bloqueia — é o que a grade aprovada registra.
export function cellsOf(obj) {
  if (!obj.solid) return [];
  const tree = obj.asset.startsWith('oak') || obj.asset.startsWith('birch');
  const fw = tree ? 8 : obj.asset === 'log' ? 12 : 10;
  const fh = tree ? 5 : 7;
  const x0 = obj.x - Math.floor(fw / 2);
  const y0 = obj.y - fh;
  const x1 = obj.x + Math.ceil(fw / 2);
  const y1 = obj.y;
  const anchorInside = obj.x >= 0 && obj.x < CHAO.w && obj.y >= 0 && obj.y < CHAO.vista;
  const cells = [];
  for (let ty = Math.floor(y0 / TILE); ty <= Math.floor((y1 - 1) / TILE); ty++) {
    for (let tx = Math.floor(x0 / TILE); tx <= Math.floor((x1 - 1) / TILE); tx++) {
      const inMockup = tx >= 0 && tx < CHUNK_W && ty >= 0 && ty < 23;
      if (inMockup && !anchorInside) continue;
      cells.push([tx, ty]);
    }
  }
  return cells;
}

function extensionObjects(index, seed, existing) {
  const rand = mulberry32(hash32(seed, 4000 + index));
  const x0 = index * CHUNK_PX;
  const objs = [];
  const place = (asset, x, y) => {
    if (onPath(x, y, 4)) return;
    if (tooClose(existing, x, y, 30) || tooClose(objs, x, y, 30)) return;
    // No primeiro trecho a copa nova não pode pintar por cima do mockup.
    if (index === 0 && y + 2 > 0 && y - 62 < CHAO.vista) return;
    objs.push({asset, x: Math.round(x), y: Math.round(y), flip: rand() < 0.5, solid: true, sombra: true});
  };
  for (const [top, bottom] of [[-230, -150], [-140, -60], [-52, -8], [430, 520], [530, 610]]) {
    let x = x0 + Math.floor(rand() * 18);
    while (x < x0 + CHUNK_PX - 8) {
      const y = top + Math.floor(rand() * (bottom - top));
      place(rand() < 0.3 ? 'birch' : 'oak', x, y);
      x += 32 + Math.floor(rand() * 22);
    }
  }
  return objs;
}

function generatedChunk(index, seed, neighbors) {
  const rand = mulberry32(hash32(seed, index + 91));
  const x0 = index * CHUNK_PX;
  const objs = [];
  const avoid = neighbors ?? [];
  const place = (asset, x, y, solid, gap) => {
    if (x < x0 + 6 || x > x0 + CHUNK_PX - 6) return false;
    if (solid && onPath(x, y, solid ? 8 : 0)) return false;
    if (!solid && terrainKind(x, y) === 'L') return false;
    if (tooClose(objs, x, y, gap) || tooClose(avoid, x, y, gap)) return false;
    objs.push({asset, x: Math.round(x), y: Math.round(y), flip: rand() < 0.5, solid, sombra: true});
    return true;
  };
  let x = x0 + 10 + Math.floor(rand() * 12);
  while (x < x0 + CHUNK_PX - 8) {
    place(rand() < 0.28 ? 'birch' : 'oak', x, 10 + Math.floor(rand() * 96), true, 30);
    x += 28 + Math.floor(rand() * 14);
  }
  x = x0 + 22 + Math.floor(rand() * 16);
  while (x < x0 + CHUNK_PX - 8) {
    place(rand() < 0.35 ? 'birch' : 'oak', x, 68 + Math.floor(rand() * 52), true, 34);
    x += 40 + Math.floor(rand() * 18);
  }
  x = x0 + 4 + Math.floor(rand() * 12);
  while (x < x0 + CHUNK_PX - 6) {
    place(rand() < 0.33 ? 'birch' : 'oak', x, 270 + Math.floor(rand() * 78), true, 28);
    x += 26 + Math.floor(rand() * 16);
  }
  for (let i = 0; i < 3; i++) place('rocks', x0 + 48 + Math.floor(rand() * 540), 110 + Math.floor(rand() * 180), true, 46);
  place('log', x0 + 90 + Math.floor(rand() * 420), 250 + Math.floor(rand() * 36), true, 40);
  if (rand() < 0.85) place('waystone', x0 + 140 + Math.floor(rand() * 340), 96 + Math.floor(rand() * 36), true, 50);
  for (let i = 0; i < 7; i++) place('shrub', x0 + 20 + Math.floor(rand() * 590), 48 + Math.floor(rand() * 280), false, 24);
  if (rand() < 0.8) place('oak-sapling', x0 + 40 + Math.floor(rand() * 480), 86 + Math.floor(rand() * 70), true, 28);
  const cx = x0 + 170 + Math.floor(rand() * 200);
  const cy = Math.round(pathCenter(cx) + pathHalf(cx) + 16);
  const kept = objs.filter(obj => {
    if (!obj.solid) return true;
    return obj.x < cx || obj.x > cx + 148 || obj.y < cy - 6 || obj.y > cy + 48;
  });
  const spawns = [
    {kind: index % 2 ? 'criatura' : 'cogumelo', x: Math.round(cx + 34), y: Math.round(cy + 14)},
    {kind: index % 2 ? 'cogumelo' : 'criatura', x: Math.round(cx + 92), y: Math.round(cy + 26)}
  ];
  return {objects: kept.concat(extensionObjects(index, seed, kept)), spawns};
}

export function buildChunk(index, seed, neighbors = []) {
  const x0 = index * CHUNK_PX;
  const made = index === 0
    ? {objects: OBJETOS.map(obj => ({...obj})).concat(extensionObjects(0, seed, OBJETOS)), spawns: MOBS_INICIAIS.map(mob => ({...mob}))}
    : generatedChunk(index, seed, neighbors);
  const waypoints = [];
  for (let x = 24; x < CHUNK_PX; x += 48) waypoints.push({x, y: Math.round(pathCenter(x0 + x))});
  return {
    index,
    biome: 'floresta',
    entryY: Math.round(pathCenter(x0)),
    exitY: Math.round(pathCenter(x0 + CHUNK_PX)),
    objects: made.objects,
    spawns: made.spawns,
    waypoints,
    doors: [],
    width: CHUNK_W,
    height: ROWS,
    row0: ROW0,
    solid: new Uint8Array(CHUNK_W * ROWS)
  };
}

export function stampObject(chunk, obj, extra) {
  for (const [tx, ty] of cellsOf(obj)) {
    if (ty < ROW0 || ty >= ROW0 + ROWS) continue;
    if (tx < 0) {
      if (chunk.index === 0 && extra) extra.add(tx + ',' + ty);
      continue;
    }
    if (Math.floor(tx / CHUNK_W) !== chunk.index) continue;
    const lx = tx - chunk.index * CHUNK_W;
    chunk.solid[(ty - ROW0) * CHUNK_W + lx] = 1;
  }
}

export function gradeAprovada() {
  return GRADE.split('\n').map(row => [...row].map(cell => Number(cell)));
}
