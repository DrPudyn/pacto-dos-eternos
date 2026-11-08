// HeroAI — o grupo anda sozinho para a direita, desvia para matar e retoma a marcha.
// Cada herói tem o próprio caminho (A*); a formação só define o ponto de encontro.

import {CHUNK_W, TILE} from './constantes.mjs';
import {findPath} from './pathfinding.mjs';

// O espadachim vai na frente. Os outros ficam um passo atrás, em cima do caminho.
export const FORMATION = [
  {x: 0, y: 0},
  {x: -24, y: -4},
  {x: -47, y: 6},
  {x: -64, y: 0}
];

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function living(list) {
  return list.filter(entity => entity.hp > 0 && !entity.dead);
}

export class HeroAI {
  constructor(world) {
    this.world = world;
  }

  update(dt) {
    const world = this.world;
    const heroes = living(world.heroes);
    if (!heroes.length) return;
    const mobs = this.threats(heroes);
    const leader = heroes[0];
    for (let index = 0; index < heroes.length; index++) {
      const hero = heroes[index];
      hero.cooldown = Math.max(0, (hero.cooldown ?? 0) - dt);
      hero.actionTime = Math.max(0, (hero.actionTime ?? 0) - dt);
      const reach = world.interior ? 900 : hero.aggro;
      const foe = this.nearest(hero, mobs, reach);
      if (foe && distance(hero, foe) <= hero.range) {
        hero.mode = 'attack';
        this.attack(hero, foe);
      } else if (foe) {
        hero.mode = 'chase';
        this.approach(hero, foe, dt);
        hero.anim = 'walk';
      } else {
        hero.mode = 'march';
        const goal = this.marchGoal(hero, index, leader);
        const moved = this.approach(hero, goal, dt);
        hero.anim = hero.actionTime > 0 ? 'attack' : moved > 0 ? 'walk' : 'idle';
      }
    }
    this.separate(heroes);
  }

  threats(heroes) {
    const lead = Math.max(...heroes.map(hero => hero.x));
    const rear = Math.min(...heroes.map(hero => hero.x));
    return living(this.world.mobs).filter(mob => {
      if (this.world.interior) return !!mob.interior;
      if (mob.interior) return false;
      return mob.x > rear - 90 && mob.x < lead + 460;
    });
  }

  nearest(hero, mobs, reach) {
    let best = null;
    let bestDistance = reach;
    for (const mob of mobs) {
      const gap = distance(hero, mob);
      if (gap < bestDistance) {
        bestDistance = gap;
        best = mob;
      }
    }
    return best;
  }

  marchGoal(hero, index, leader) {
    const world = this.world;
    if (world.interior) {
      const room = world.interior;
      return {
        x: room.exit.tx * TILE + TILE / 2 + (index - 1) * 10,
        y: room.exit.ty * TILE + 8
      };
    }
    const door = world.progression.doorObjective(leader);
    if (door && index === 0) return {x: door.x, y: door.y};
    const ahead = world.progression.waypointAhead(index === 0 ? hero : leader, index === 0 ? 72 : 28);
    return {
      x: ahead.x + FORMATION[index].x,
      y: ahead.y + FORMATION[index].y
    };
  }

  approach(hero, goal, dt) {
    const world = this.world;
    const gx = Math.floor(goal.x / TILE);
    const gy = Math.floor(goal.y / TILE);
    hero._plan = (hero._plan ?? 0) - dt;
    if (hero._plan <= 0 || hero._gx !== gx || hero._gy !== gy) {
      hero._plan = 0.25;
      hero._gx = gx;
      hero._gy = gy;
      const blocked = (x, y) => world.map.blocked(x, y);
      const path = findPath(blocked, {x: Math.floor(hero.x / TILE), y: Math.floor(hero.y / TILE)}, {x: gx, y: gy}, 22);
      hero.path = path ? path.slice(1) : [];
    }
    let dest = goal;
    if (hero.path?.length) {
      const step = hero.path[0];
      const px = step.x * TILE + TILE / 2;
      const py = step.y * TILE + TILE / 2;
      if (Math.hypot(hero.x - px, hero.y - py) < 10) hero.path.shift();
      else dest = {x: px, y: py};
    }
    return world.movement.steer(hero, dest, hero.speed, dt);
  }

  attack(hero, foe) {
    hero.facing = foe.x - hero.x > 6 ? 'right' : foe.x - hero.x < -6 ? 'left' : foe.y > hero.y ? 'down' : 'up';
    hero.anim = 'attack';
    if (hero.cooldown > 0) return;
    hero.cooldown = hero.skin === 'archer' ? 0.7 : 0.4;
    hero.actionTime = 0.32;
    foe.hp -= hero.damage;
    foe.hit = 0.14;
    if (hero.skin === 'archer') {
      this.world.shots.push({x: hero.x, y: hero.y - 18, tx: foe.x, ty: foe.y - 12, age: 0, life: 0.2, color: '#f2e2a8'});
    }
    if (foe.hp <= 0) {
      foe.hp = 0;
      foe.dead = true;
      foe.respawn = 6.5;
      this.world.kills++;
      // Ouro deste mapa é só visual. Não entra no baú, no save nem na loja.
      this.world.gold += 8 + Math.floor(hero.x / (CHUNK_W * TILE));
      this.world.drops.push({x: foe.x, y: foe.y, age: 0, life: 2.4});
    }
  }

  separate(heroes) {
    const collision = this.world.collision;
    for (let i = 0; i < heroes.length; i++) {
      for (let j = i + 1; j < heroes.length; j++) {
        const a = heroes[i];
        const b = heroes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const gap = Math.hypot(dx, dy) || 0.01;
        if (gap >= 9) continue;
        const push = (9 - gap) / 2;
        const nx = dx / gap * push;
        const ny = dy / gap * push;
        if (collision.fits(a.x - nx, a.y - ny)) {
          a.x -= nx;
          a.y -= ny;
        }
        if (collision.fits(b.x + nx, b.y + ny)) {
          b.x += nx;
          b.y += ny;
        }
      }
    }
  }
}

export class MobAI {
  constructor(world) {
    this.world = world;
  }

  update(dt) {
    const world = this.world;
    const heroes = living(world.heroes);
    for (const mob of world.mobs) {
      if (mob.dead || mob.hp <= 0) {
        mob.respawn = (mob.respawn ?? 6.5) - dt;
        if (mob.respawn > 0) continue;
        const crowded = heroes.some(hero => distance(hero, {x: mob.homeX, y: mob.homeY}) < 40);
        if (crowded) {
          mob.respawn = 0.8;
          continue;
        }
        mob.dead = false;
        mob.hp = mob.maxHp;
        mob.x = mob.homeX;
        mob.y = mob.homeY;
        mob.hit = 0;
        world.respawns = (world.respawns ?? 0) + 1;
      }
      mob.hit = Math.max(0, (mob.hit ?? 0) - dt);
      mob.phase = (mob.phase ?? 0) + dt;
      const prey = heroes.filter(hero => world.interior ? !!mob.interior : !mob.interior)
        .reduce((best, hero) => {
          const gap = distance(mob, hero);
          return !best || gap < best.gap ? {hero, gap} : best;
        }, null);
      const sense = world.interior ? 900 : 96;
      if (prey && prey.gap < sense) {
        mob.mode = 'chase';
        world.movement.steer(mob, prey.hero, mob.speed, dt);
      } else {
        mob.mode = 'wander';
        mob.wander = (mob.wander ?? 1) - dt;
        if (mob.wander <= 0) {
          mob.wander = 1.6;
          const angle = ((mob.chunk * 13 + Math.floor(mob.homeX) + Math.floor(world.time * 2)) % 8) / 8 * Math.PI * 2;
          mob.spot = {x: mob.homeX + Math.cos(angle) * 22, y: mob.homeY + Math.sin(angle) * 14};
        }
        if (mob.spot) world.movement.steer(mob, mob.spot, mob.speed * 0.55, dt);
      }
    }
    world.shots.forEach(shot => { shot.age += dt; });
    world.shots = world.shots.filter(shot => shot.age < shot.life);
    world.drops.forEach(drop => { drop.age += dt; });
    world.drops = world.drops.filter(drop => drop.age < drop.life);
  }
}
