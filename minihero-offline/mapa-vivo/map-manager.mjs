// MapManager da floresta. O primeiro trecho é o mockup aprovado.
// Os seguintes repetem os mesmos tiles, a mesma curva de caminho e a mesma regra:
// a copa não bloqueia, só o tronco e a base.

import {CHUNK_PX, CHUNK_W, ROW0, ROWS} from './constantes.mjs';
import {buildChunk, stampObject} from './floresta.mjs';

export function generateChunk(seed, index) {
  return buildChunk(index, seed, []);
}

export function createInterior() {
  return null;
}

export class MapManager {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
    this.chunks = new Map();
    this.extra = new Set();
    this.interior = null;
  }

  ensure(index) {
    if (index < 0) return null;
    if (this.chunks.has(index)) return this.chunks.get(index);
    const prev = index > 0 ? this.ensure(index - 1) : null;
    const neighbors = prev ? prev.objects.filter(obj => obj.x > index * CHUNK_PX - 56) : [];
    const chunk = buildChunk(index, this.seed, neighbors);
    this.chunks.set(index, chunk);
    if (prev) for (const obj of prev.objects) stampObject(chunk, obj, this.extra);
    for (const obj of chunk.objects) stampObject(chunk, obj, this.extra);
    this.openSpawns(chunk);
    return chunk;
  }

  openSpawns(chunk) {
    for (const spot of chunk.spawns) {
      if (!this.blocked(Math.floor(spot.x / 16), Math.floor(spot.y / 16))) continue;
      let found = null;
      for (let ring = 1; ring <= 6 && !found; ring++) {
        for (let dy = -ring; dy <= ring && !found; dy++) {
          for (let dx = -ring; dx <= ring; dx++) {
            const x = spot.x + dx * 8;
            const y = spot.y + dy * 8;
            if (!this.blocked(Math.floor(x / 16), Math.floor(y / 16))) {
              found = {x, y};
              break;
            }
          }
        }
      }
      if (found) {
        spot.x = found.x;
        spot.y = found.y;
      }
    }
  }

  dropBefore(index) {
    for (const key of [...this.chunks.keys()]) {
      if (key < index) this.chunks.delete(key);
    }
  }

  blocked(tx, ty) {
    if (this.interior) {
      const room = this.interior;
      if (tx < 0 || ty < 0 || tx >= room.width || ty >= room.height) return true;
      return room.solid[ty * room.width + tx] === 1;
    }
    if (ty < ROW0 || ty >= ROW0 + ROWS || tx < -4) return true;
    if (tx < 0) return this.extra.has(tx + ',' + ty);
    const chunkIndex = Math.floor(tx / CHUNK_W);
    const chunk = this.chunks.get(chunkIndex);
    if (!chunk) return true;
    const lx = tx - chunkIndex * CHUNK_W;
    if (lx < 0 || lx >= CHUNK_W) return true;
    return chunk.solid[(ty - ROW0) * CHUNK_W + lx] === 1;
  }

  sample(tx, ty) {
    return {biome: 'floresta', solid: this.blocked(tx, ty)};
  }
}
