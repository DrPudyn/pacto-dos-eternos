// MapManager — tilemap em camadas (chão, paredes, objetos, decoração, colisão).
// O retângulo do trecho é só a memória. O contorno jogável é um caminho,
// uma praça, uma ponte ou um corredor: o que fica de fora é bloqueado.

import {BIOMES, biomeAt} from './biomas.mjs';
import {CHUNK_H, CHUNK_W, T, clamp, inGrid, tileIndex} from './constantes.mjs';
import {hash32, mulberry32} from './rng.mjs';

const AREA = CHUNK_W * CHUNK_H;

function emptyLayers() {
  return {
    ground: new Uint8Array(AREA),
    wall: new Uint8Array(AREA),
    object: new Uint8Array(AREA),
    decor: new Uint8Array(AREA),
    solid: new Uint8Array(AREA)
  };
}

function pathCenters(rand, entryY, exitY, biome) {
  const keys = [0, 0.28, 0.55, 0.78, 1].map((t, i) => {
    const y = i === 0 ? entryY : i === 4 ? exitY : clamp(Math.round(entryY + (exitY - entryY) * t + (rand() - 0.5) * biome.wander), biome.yMin, biome.yMax);
    return {x: Math.round(t * (CHUNK_W - 1)), y};
  });
  const centers = [];
  for (let x = 0; x < CHUNK_W; x++) {
    let y = keys[0].y;
    for (let i = 0; i < keys.length - 1; i++) {
      if (x >= keys[i].x && x <= keys[i + 1].x) {
        const span = Math.max(1, keys[i + 1].x - keys[i].x);
        const t = (x - keys[i].x) / span;
        y = Math.round(keys[i].y + (keys[i + 1].y - keys[i].y) * t);
        break;
      }
    }
    centers.push({x, y: clamp(y, 2, CHUNK_H - 3)});
  }
  return centers;
}

function stamp(cx, cy, radius, visit) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (inGrid(x, y)) visit(x, y);
    }
  }
}

function neighborWalkable(solid, x, y) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (inGrid(nx, ny) && solid[tileIndex(nx, ny)] === 0) return true;
  }
  return false;
}

function paintForest(layers, centers, rand) {
  const {ground, wall, decor, solid} = layers;
  const open = new Set();
  for (const p of centers) for (let dy = -1; dy <= 1; dy++) open.add(p.x + ',' + (p.y + dy));
  for (const p of centers) stamp(p.x, p.y, 2, (x, y) => { solid[tileIndex(x, y)] = 0; });
  // Clareira no meio: o grupo luta num espaço mais largo, sem virar um retângulo.
  const mid = centers[Math.floor(centers.length * 0.48)];
  stamp(mid.x, mid.y, 4, (x, y) => { solid[tileIndex(x, y)] = 0; });
  // Mata em volta do caminho, para a tela não ficar um vazio em volta de uma trilha.
  for (const p of centers) {
    stamp(p.x, p.y, 9, (x, y) => {
      const i = tileIndex(x, y);
      if (solid[i] === 0 || ground[i]) return;
      ground[i] = T.grass;
      if (rand() < 0.62) wall[i] = T.tree;
      else if (rand() < 0.45) wall[i] = T.rock;
      else solid[i] = 0;
    });
  }
  for (let y = 0; y < CHUNK_H; y++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const i = tileIndex(x, y);
      if (solid[i] !== 0) continue;
      ground[i] = open.has(x + ',' + y) ? T.dirt : T.grass;
      if (ground[i] === T.grass && rand() < 0.08) decor[i] = T.flower;
    }
  }
}

function paintTown(layers, centers, rand, index) {
  const {ground, wall, object, decor, solid} = layers;
  for (const p of centers) stamp(p.x, p.y, 3, (x, y) => { solid[tileIndex(x, y)] = 0; });
  for (let y = 0; y < CHUNK_H; y++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const i = tileIndex(x, y);
      if (solid[i] === 0) ground[i] = (x + y) % 5 === 0 ? T.dirt : T.cobble;
      else if (neighborWalkable(solid, x, y) && rand() < 0.4) {
        wall[i] = T.rock;
        ground[i] = T.cobble;
      }
    }
  }
  const doors = [];
  const above = placeHouse(layers, centers, index, 0, -1);
  const below = placeHouse(layers, centers, index, 1, 1);
  if (above) doors.push(above);
  if (below) doors.push(below);
  for (const p of centers) {
    stamp(p.x, p.y, 8, (x, y) => {
      const i = tileIndex(x, y);
      if (solid[i] === 0 || wall[i] || ground[i]) return;
      ground[i] = (x + y) % 2 === 0 ? T.cobble : T.dirt;
      if (rand() < 0.5) wall[i] = ((x / 2) | 0) % 2 === 0 ? T.house : T.roof;
      else if (rand() < 0.35) wall[i] = T.rock;
    });
  }
  for (let y = 0; y < CHUNK_H; y++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const i = tileIndex(x, y);
      if (solid[i] === 0 && decor[i] === 0 && rand() < 0.04) decor[i] = T.flower;
    }
  }
  return doors;
}

function placeHouse(layers, centers, index, which, dir) {
  const spot = centers[Math.floor(centers.length * (which === 0 ? 0.36 : 0.7))];
  const doorX = clamp(spot.x, 4, CHUNK_W - 5);
  const doorY = spot.y + dir * 2;
  const top = dir < 0 ? doorY - 4 : doorY;
  const bottom = dir < 0 ? doorY : doorY + 4;
  const left = doorX - 3;
  const right = doorX + 3;
  if (top < 1 || bottom >= CHUNK_H - 1 || left < 1 || right >= CHUNK_W - 1) return null;
  const {ground, wall, object, solid} = layers;
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const edge = x === left || x === right || y === top || y === bottom;
      const isDoor = x === doorX && y === doorY;
      const i = tileIndex(x, y);
      const roofRow = dir < 0 ? y === top : y === bottom;
      if (isDoor) {
        solid[i] = 0;
        ground[i] = T.cobble;
        object[i] = T.door;
        wall[i] = 0;
      } else if (edge) {
        solid[i] = 1;
        ground[i] = T.cobble;
        wall[i] = roofRow ? T.roof : T.house;
        object[i] = 0;
      } else {
        solid[i] = 1;
        ground[i] = T.wood;
        wall[i] = T.roof;
        object[i] = 0;
      }
    }
  }
  const frontY = doorY - dir;
  if (inGrid(doorX, frontY)) {
    const i = tileIndex(doorX, frontY);
    solid[i] = 0;
    ground[i] = T.cobble;
    wall[i] = 0;
  }
  return {tx: doorX, ty: doorY, id: index + ':' + which};
}

function paintBridge(layers, centers) {
  const {ground, wall, solid} = layers;
  for (let i = 0; i < AREA; i++) {
    solid[i] = 1;
    ground[i] = T.water;
  }
  const open = (x, y) => {
    const i = tileIndex(x, y);
    solid[i] = 0;
    ground[i] = T.plank;
    wall[i] = 0;
  };
  for (const p of centers) stamp(p.x, p.y, 1, open);
  // Plataforma no meio da ponte, para o contorno não ser só uma faixa reta.
  const mid = centers[Math.floor(centers.length * 0.5)];
  stamp(mid.x, mid.y, 2, open);
  for (let y = 0; y < CHUNK_H; y++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const i = tileIndex(x, y);
      // Guarda-corpo fica na água, ao lado das tábuas. Não come o piso.
      if (solid[i] === 1 && ground[i] === T.water && neighborWalkable(solid, x, y)) wall[i] = T.rail;
    }
  }
}

function paintDungeon(layers, centers, rand, crypt) {
  const {ground, wall, object, solid} = layers;
  for (const p of centers) stamp(p.x, p.y, 2, (x, y) => { solid[tileIndex(x, y)] = 0; });
  const side = centers[Math.floor(centers.length * 0.42)];
  stamp(side.x, clamp(side.y - 4, 3, CHUNK_H - 4), 3, (x, y) => { solid[tileIndex(x, y)] = 0; });
  const sideB = centers[Math.floor(centers.length * 0.72)];
  stamp(sideB.x, clamp(sideB.y + 4, 3, CHUNK_H - 4), 3, (x, y) => { solid[tileIndex(x, y)] = 0; });
  for (const p of centers) {
    stamp(p.x, p.y, 6, (x, y) => {
      const i = tileIndex(x, y);
      if (solid[i] === 0 || wall[i]) return;
      ground[i] = T.stone;
      wall[i] = T.wall;
    });
  }
  for (let y = 0; y < CHUNK_H; y++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const i = tileIndex(x, y);
      if (solid[i] === 0) {
        ground[i] = crypt && (x + y) % 7 === 0 ? T.ice : T.stone;
        continue;
      }
      if (neighborWalkable(solid, x, y)) {
        ground[i] = T.stone;
        wall[i] = T.wall;
        if (rand() < 0.18) object[i] = T.torch;
      }
    }
  }
  for (const p of centers) {
    stamp(p.x, p.y, 9, (x, y) => {
      const i = tileIndex(x, y);
      if (solid[i] === 0 || wall[i] || ground[i]) return;
      ground[i] = T.stone;
      wall[i] = T.wall;
    });
  }
}

function fillEmpty(layers, rand, groundId, wallId) {
  const {ground, wall} = layers;
  for (let y = 0; y < CHUNK_H; y++) {
    for (let x = 0; x < CHUNK_W; x++) {
      const i = tileIndex(x, y);
      if (ground[i] || wall[i]) continue;
      const edge = Math.min(x, y, CHUNK_W - 1 - x, CHUNK_H - 1 - y);
      if (edge < 2 && rand() < 0.72) continue;
      ground[i] = groundId;
      if (wallId && rand() < 0.5) wall[i] = wallId;
    }
  }
}

function sealBorders(layers) {
  const {solid, wall, ground} = layers;
  for (let x = 0; x < CHUNK_W; x++) {
    for (const y of [0, CHUNK_H - 1]) {
      const i = tileIndex(x, y);
      solid[i] = 1;
      if (ground[i] === T.water) continue;
      if (!wall[i]) wall[i] = T.rock;
      if (!ground[i]) ground[i] = T.grass;
    }
  }
}

function reopenSpine(layers, centers) {
  // A borda de cima e de baixo nunca fecha o caminho: o eixo do caminho permanece livre.
  const {solid, wall, object} = layers;
  for (const p of centers) {
    const i = tileIndex(p.x, p.y);
    solid[i] = 0;
    wall[i] = 0;
    if (object[i] === T.torch) object[i] = 0;
  }
}

function collectSpawns(layers, centers, rand, count) {
  const {solid, object} = layers;
  const spawns = [];
  for (let attempt = 0; attempt < 100 && spawns.length < count; attempt++) {
    const p = centers[4 + Math.floor(rand() * (centers.length - 8))];
    const side = rand() < 0.5 ? 1 : -1;
    let x = p.x;
    let y = p.y + side;
    if (!inGrid(x, y) || solid[tileIndex(x, y)] || object[tileIndex(x, y)] === T.door) {
      x = p.x;
      y = p.y;
    }
    if (x < 8 || x > CHUNK_W - 5) continue;
    if (solid[tileIndex(x, y)] || object[tileIndex(x, y)] === T.door) continue;
    if (spawns.some(s => Math.abs(s.tx - x) < 3 && Math.abs(s.ty - y) < 2)) continue;
    spawns.push({tx: x, ty: y, kind: null});
  }
  return spawns;
}

export function generateChunk(seed, index, prevExitY) {
  const biome = biomeAt(index);
  const rand = mulberry32(hash32(seed, index + 17));
  const entryY = prevExitY == null ? Math.floor(CHUNK_H / 2) : clamp(prevExitY, biome.yMin, biome.yMax);
  const exitY = clamp(entryY + Math.round((rand() - 0.5) * biome.wander), biome.yMin, biome.yMax);
  const centers = pathCenters(rand, entryY, exitY, biome);
  const layers = emptyLayers();
  layers.solid.fill(1);
  let doors = [];
  if (biome.id === 'floresta') paintForest(layers, centers, rand);
  else if (biome.id === 'cidade') doors = paintTown(layers, centers, rand, index);
  else if (biome.id === 'ponte') paintBridge(layers, centers);
  else paintDungeon(layers, centers, rand, biome.id === 'cripta');
  if (biome.id === 'floresta') fillEmpty(layers, rand, T.grass, T.tree);
  else if (biome.id === 'cidade') fillEmpty(layers, rand, T.cobble, T.house);
  else if (biome.id !== 'ponte') fillEmpty(layers, rand, biome.id === 'cripta' ? T.ice : T.stone, T.wall);
  sealBorders(layers);
  reopenSpine(layers, centers);
  const spawns = collectSpawns(layers, centers, rand, biome.spawn).map((spot, n) => ({
    ...spot,
    kind: biome.mobs[n % biome.mobs.length]
  }));
  const waypoints = centers.filter((_, i) => i % 2 === 0).map(p => ({
    x: p.x * 32 + 16,
    y: p.y * 32 + 16
  }));
  return {
    index,
    biome: biome.id,
    entryY: centers[0].y,
    exitY: centers[centers.length - 1].y,
    ...layers,
    doors,
    spawns,
    waypoints,
    width: CHUNK_W,
    height: CHUNK_H
  };
}

export function createInterior(biomeId, seed, door) {
  const w = 18;
  const h = 14;
  const area = w * h;
  const ground = new Uint8Array(area);
  const wall = new Uint8Array(area);
  const object = new Uint8Array(area);
  const decor = new Uint8Array(area);
  const solid = new Uint8Array(area);
  const floor = biomeId === 'cidade' ? T.wood : T.stone;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      const exit = x === Math.floor(w / 2) && y === h - 1;
      if (exit) {
        solid[i] = 0;
        ground[i] = floor;
        object[i] = T.exit;
      } else if (edge) {
        solid[i] = 1;
        ground[i] = floor;
        wall[i] = y === 0 ? T.roof : T.wall;
      } else {
        solid[i] = 0;
        ground[i] = floor;
        if ((x + y) % 6 === 0) decor[i] = T.flower;
      }
    }
  }
  const rand = mulberry32(hash32(seed, 9000 + door.chunk * 10 + door.tx));
  const biome = BIOMES.find(b => b.id === biomeId) ?? BIOMES[0];
  const spawns = [{tx: 4, ty: 4, kind: biome.mobs[0]}];
  if (rand() > 0.2) spawns.push({tx: w - 5, ty: 5, kind: biome.mobs[1 % biome.mobs.length]});
  return {
    id: door.id,
    biome: biomeId,
    width: w,
    height: h,
    ground, wall, object, decor, solid,
    exit: {tx: Math.floor(w / 2), ty: h - 1},
    spawns,
    door
  };
}

export class MapManager {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
    this.chunks = new Map();
    this.interior = null;
  }

  ensure(index) {
    if (index < 0) return null;
    if (this.chunks.has(index)) return this.chunks.get(index);
    const prev = index > 0 ? this.ensure(index - 1) : null;
    const chunk = generateChunk(this.seed, index, prev ? prev.exitY : null);
    this.chunks.set(index, chunk);
    return chunk;
  }

  dropBefore(index) {
    for (const key of [...this.chunks.keys()]) {
      if (key < index) this.chunks.delete(key);
    }
  }

  // Colisão em coordenadas de tile do mundo (ou do interior, quando há troca de mapa).
  blocked(tx, ty) {
    if (this.interior) {
      const room = this.interior;
      if (!inGrid(tx, ty, room.width, room.height)) return true;
      return room.solid[ty * room.width + tx] === 1;
    }
    if (ty < 0 || ty >= CHUNK_H || tx < 0) return true;
    const chunkIndex = Math.floor(tx / CHUNK_W);
    const localX = tx - chunkIndex * CHUNK_W;
    const chunk = this.chunks.get(chunkIndex);
    if (!chunk || localX < 0 || localX >= CHUNK_W) return true;
    return chunk.solid[tileIndex(localX, ty)] === 1;
  }

  sample(tx, ty) {
    if (this.interior) {
      const room = this.interior;
      if (!inGrid(tx, ty, room.width, room.height)) return null;
      const i = ty * room.width + tx;
      return {
        biome: room.biome,
        ground: room.ground[i],
        wall: room.wall[i],
        object: room.object[i],
        decor: room.decor[i],
        solid: room.solid[i] === 1
      };
    }
    if (ty < 0 || ty >= CHUNK_H || tx < 0) return null;
    const chunkIndex = Math.floor(tx / CHUNK_W);
    const localX = tx - chunkIndex * CHUNK_W;
    const chunk = this.chunks.get(chunkIndex);
    if (!chunk || localX < 0 || localX >= CHUNK_W) return null;
    const i = tileIndex(localX, ty);
    return {
      biome: chunk.biome,
      ground: chunk.ground[i],
      wall: chunk.wall[i],
      object: chunk.object[i],
      decor: chunk.decor[i],
      solid: chunk.solid[i] === 1
    };
  }
}

export {BIOMES};
