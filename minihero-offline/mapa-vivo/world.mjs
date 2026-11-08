// Mundo do mapa vivo. Junta MapManager, câmera, colisão, movimento, IA e progressão.
// Nada aqui grava save, ouro da conta, login ou loja: o estado mora só na sessão da tela.

import {CameraController} from './camera.mjs';
import {CollisionSystem} from './collision.mjs';
import {FORMATION, HeroAI, MobAI} from './hero-ai.mjs';
import {CHUNK_W, TILE} from './constantes.mjs';
import {MapManager} from './map-manager.mjs';
import {MovementSystem} from './movement.mjs';
import {ProgressionManager} from './progression.mjs';
import {biomeLabel} from './biomas.mjs';

const DEFAULT_PARTY = [
  {id: 'espada', name: 'Espadachim', skin: 'swordsman'},
  {id: 'lanca', name: 'Lanceiro', skin: 'spearman'},
  {id: 'arco', name: 'Arqueiro', skin: 'archer'}
];

const KNOWN = new Set(['swordsman', 'spearman', 'archer', 'mage']);

export function normalizeParty(party) {
  const source = Array.isArray(party) ? party.filter(hero => hero && KNOWN.has(hero.skin)).slice(0, 4) : [];
  const list = source.length ? source : DEFAULT_PARTY;
  return list.map((hero, index) => ({
    id: hero.id ?? 'h' + index,
    name: hero.name || DEFAULT_PARTY.find(item => item.skin === hero.skin)?.name || 'Herói',
    skin: hero.skin,
    range: hero.skin === 'archer' ? 124 : hero.skin === 'spearman' ? 42 : 34,
    aggro: hero.skin === 'archer' ? 230 : 168,
    speed: hero.skin === 'archer' ? 104 : 120,
    damage: hero.skin === 'archer' ? 2 : hero.skin === 'spearman' ? 3 : 3,
    hp: 100,
    maxHp: 100,
    facing: 'right',
    anim: 'idle',
    mode: 'march',
    cooldown: index * 0.12,
    actionTime: 0,
    path: [],
    frame: index
  }));
}

export function createWorld(options = {}) {
  const seed = (options.seed ?? 20261108) >>> 0;
  const map = new MapManager(seed);
  const first = map.ensure(0);
  map.ensure(1);
  map.ensure(2);
  const heroes = normalizeParty(options.party);
  const spine = first.waypoints[Math.floor(first.waypoints.length * 0.42)] ?? first.waypoints[0];
  heroes.forEach((hero, index) => {
    const slot = FORMATION[index] ?? FORMATION[0];
    hero.x = spine.x + slot.x;
    hero.y = spine.y + slot.y;
  });
  const world = {
    seed,
    map,
    heroes,
    mobs: [],
    drops: [],
    shots: [],
    kills: 0,
    gold: 0,
    time: 0,
    fade: 0,
    doorLock: 0,
    interior: null,
    snapCamera: true,
    place: '',
    paused: false
  };
  world.collision = new CollisionSystem(map);
  world.movement = new MovementSystem(world.collision);
  world.ai = new HeroAI(world);
  world.mobAI = new MobAI(world);
  world.progression = new ProgressionManager(map);
  world.progression.world = world;
  world.camera = new CameraController(options.view ?? {w: 960, h: 540});
  for (const hero of heroes) {
    const spot = world.collision.nearestOpen(hero.x, hero.y);
    hero.x = spot.x;
    hero.y = spot.y;
  }
  world.progression.update(world);
  return world;
}

export function focusOf(world) {
  const heroes = world.heroes.filter(hero => hero.hp > 0);
  const list = heroes.length ? heroes : world.heroes;
  return {
    x: list.reduce((sum, hero) => sum + hero.x, 0) / list.length,
    y: list.reduce((sum, hero) => sum + hero.y, 0) / list.length
  };
}

export function stepWorld(world, dt) {
  const step = Math.max(0, Math.min(0.05, dt));
  if (!step || world.paused) return world;
  world.time += step;
  if (world.doorLock > 0) world.doorLock -= step;
  if (world.fade > 0) world.fade -= step;
  world.progression.update(world);
  world.ai.update(step);
  world.mobAI.update(step);
  world.progression.transitions(world);
  const focus = focusOf(world);
  const bounds = world.progression.bounds(world);
  if (world.snapCamera) {
    world.camera.snap(focus.x, focus.y, bounds);
    world.snapCamera = false;
  } else {
    world.camera.follow(focus.x, focus.y, step, bounds);
  }
  return world;
}

export function describeWorld(world) {
  const focus = focusOf(world);
  const chunk = world.interior ? world.progression.leadChunk : Math.max(0, Math.floor(focus.x / (CHUNK_W * TILE)));
  return {
    chunk,
    biome: world.interior ? 'Interior · ' + biomeLabel(world.returnSpot ? Math.floor(world.returnSpot.x / (CHUNK_W * TILE)) : chunk) : biomeLabel(chunk),
    interior: !!world.interior,
    kills: world.kills,
    gold: world.gold,
    heroes: world.heroes.map(hero => ({name: hero.name, skin: hero.skin, mode: hero.mode, x: Math.round(hero.x), y: Math.round(hero.y)})),
    mobsAlive: world.mobs.filter(mob => !mob.dead && mob.hp > 0).length,
    camera: {x: world.camera.x, y: world.camera.y},
    loaded: [...world.map.chunks.keys()]
  };
}

export {TILE, CHUNK_W};
