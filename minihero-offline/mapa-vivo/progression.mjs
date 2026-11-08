// ProgressionManager — gera o próximo trecho, esquece o que ficou para trás
// e troca o mapa quando o grupo entra numa casa. O ciclo é andar → matar → avançar.

import {CHUNK_PX, CHUNK_W, FOREST_BOTTOM, FOREST_TOP, TILE} from './constantes.mjs';
import {MOB_STATS} from './biomas.mjs';
import {createInterior} from './map-manager.mjs';
import {FORMATION} from './hero-ai.mjs';

export class ProgressionManager {
  constructor(map) {
    this.map = map;
    this.leadChunk = 0;
    this.visitedDoors = new Set();
  }

  update(world) {
    if (world.interior) return;
    const xs = world.heroes.map(hero => hero.x);
    const lead = Math.max(...xs);
    const rear = Math.min(...xs);
    this.leadChunk = Math.max(0, Math.floor(lead / CHUNK_PX));
    const rearChunk = Math.max(0, Math.floor(rear / CHUNK_PX));
    for (let index = Math.max(0, rearChunk - 1); index <= this.leadChunk + 2; index++) this.map.ensure(index);
    this.map.dropBefore(rearChunk - 1);
    for (const chunk of this.map.chunks.values()) {
      if (chunk.spawned) continue;
      chunk.spawned = true;
      for (const spot of chunk.spawns) world.mobs.push(this.mobFrom(chunk, spot, false));
    }
    world.mobs = world.mobs.filter(mob => mob.interior || this.map.chunks.has(mob.chunk));
  }

  mobFrom(chunk, spot, interior) {
    const stats = MOB_STATS[spot.kind] ?? MOB_STATS.slime;
    const originX = interior ? 0 : chunk.index * CHUNK_PX;
    const x = Number.isFinite(spot.x) ? spot.x : originX + spot.tx * TILE + TILE / 2;
    const y = Number.isFinite(spot.y) ? spot.y : spot.ty * TILE + TILE / 2;
    return {
      kind: spot.kind,
      name: stats.name,
      hp: stats.hp,
      maxHp: stats.hp,
      speed: stats.speed,
      tint: stats.tint,
      x,
      y,
      homeX: x,
      homeY: y,
      tx: spot.tx,
      ty: spot.ty,
      chunk: interior ? -1 : chunk.index,
      interior,
      facing: 'down',
      dead: false,
      hit: 0,
      phase: spot.tx
    };
  }

  areaClear(world, chunkIndex) {
    return !world.mobs.some(mob => !mob.dead && !mob.interior && mob.chunk === chunkIndex);
  }

  doorObjective(hero) {
    if (!hero || this.map.interior) return null;
    const chunkIndex = Math.max(0, Math.floor(hero.x / (CHUNK_W * TILE)));
    const chunk = this.map.chunks.get(chunkIndex);
    if (!chunk?.doors?.length) return null;
    let best = null;
    for (const door of chunk.doors) {
      const point = {
        x: chunk.index * CHUNK_W * TILE + door.tx * TILE + TILE / 2,
        y: door.ty * TILE + TILE / 2,
        id: door.id,
        tx: door.tx,
        ty: door.ty,
        chunk: chunk.index,
        biome: chunk.biome
      };
      if (this.visitedDoors.has(point.id)) continue;
      if (point.x < hero.x - 40) continue;
      const gap = Math.hypot(point.x - hero.x, point.y - hero.y);
      if (gap < 340 && (!best || gap < best.gap)) best = {...point, gap};
    }
    return best;
  }

  waypointAhead(hero, ahead) {
    const origin = Math.max(0, Math.floor(hero.x / (CHUNK_W * TILE)));
    for (let index = origin; index <= origin + 2; index++) {
      const chunk = this.map.ensure(index);
      if (!chunk) continue;
      for (const point of chunk.waypoints) {
        const x = chunk.index * CHUNK_W * TILE + point.x;
        const y = point.y;
        if (x > hero.x + ahead * 0.35) return {x, y};
      }
    }
    return {x: hero.x + ahead, y: hero.y};
  }

  bounds(world) {
    if (world.interior) {
      return {x: 0, y: 0, w: world.interior.width * TILE, h: world.interior.height * TILE};
    }
    let min = Infinity;
    let max = -Infinity;
    for (const key of this.map.chunks.keys()) {
      min = Math.min(min, key);
      max = Math.max(max, key);
    }
    if (!Number.isFinite(min)) return {x: 0, y: FOREST_TOP, w: CHUNK_PX, h: FOREST_BOTTOM - FOREST_TOP};
    return {x: min * CHUNK_PX - 24, y: FOREST_TOP, w: (max - min + 1) * CHUNK_PX + 48, h: FOREST_BOTTOM - FOREST_TOP};
  }

  transitions(world) {
    this.world = world;
    if (world.doorLock > 0) return;
    if (!world.interior) {
      const leader = world.heroes[0];
      const door = this.doorObjective(leader);
      if (!door) return;
      if (Math.hypot(leader.x - door.x, leader.y - door.y) > 48) return;
      this.enter(world, door);
      return;
    }
    if (world.mobs.some(mob => mob.interior && !mob.dead && mob.hp > 0)) return;
    const exit = world.interior.exit;
    const ex = exit.tx * TILE + TILE / 2;
    const ey = exit.ty * TILE + TILE / 2;
    if (world.heroes.some(hero => Math.hypot(hero.x - ex, hero.y - ey) < 22)) this.leave(world);
  }

  streetSpot(world, door) {
    const worldTx = door.chunk * CHUNK_W + door.tx;
    const leader = world.heroes[0];
    let best = null;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [0, -2], [0, 2]]) {
      const tx = worldTx + dx;
      const ty = door.ty + dy;
      if (world.map.blocked(tx, ty)) continue;
      const x = tx * TILE + TILE / 2;
      const y = ty * TILE + TILE / 2;
      if (!world.collision.fits(x, y)) continue;
      const gap = Math.hypot(x - leader.x, y - leader.y);
      if (!best || gap < best.gap) best = {x, y, gap, id: door.id};
    }
    return best ?? {x: leader.x, y: leader.y, id: door.id};
  }

  enter(world, door) {
    const room = createInterior(door.biome, world.seed, door);
    world.returnSpot = this.streetSpot(world, door);
    this.visitedDoors.add(door.id);
    world.interior = room;
    world.map.interior = room;
    world.mobs = world.mobs.filter(mob => !mob.interior);
    for (const spot of room.spawns) world.mobs.push(this.mobFrom({index: -1}, spot, true));
    const baseX = room.exit.tx * TILE + TILE / 2;
    const baseY = (room.exit.ty - 1) * TILE + TILE / 2;
    world.heroes.forEach((hero, index) => {
      hero.x = baseX + (index - 1) * 18;
      hero.y = baseY;
      hero.path = [];
      const spot = world.collision.nearestOpen(hero.x, hero.y);
      hero.x = spot.x;
      hero.y = spot.y;
    });
    world.snapCamera = true;
    world.fade = 0.45;
    world.place = 'Interior';
  }

  leave(world) {
    const back = world.returnSpot;
    world.mobs = world.mobs.filter(mob => !mob.interior);
    world.interior = null;
    world.map.interior = null;
    world.heroes.forEach((hero, index) => {
      const slot = FORMATION[index] ?? FORMATION[0];
      hero.x = back.x + slot.x * 0.45;
      hero.y = back.y + slot.y * 0.45;
      hero.path = [];
      const spot = world.collision.nearestOpen(hero.x, hero.y);
      hero.x = spot.x;
      hero.y = spot.y;
    });
    world.doorLock = 1.2;
    world.ignoredDoor = back.id;
    world.snapCamera = true;
    world.fade = 0.45;
    world.place = '';
  }
}
