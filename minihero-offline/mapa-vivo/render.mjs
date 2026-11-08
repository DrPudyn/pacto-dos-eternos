// Desenha o tilemap e os atores. A câmera é a origem: o cenário anda
// para o lado contrário do grupo porque todo mundo é desenhado em (mundo - câmera).

import {CHUNK_H, CHUNK_W, TILE, T} from './constantes.mjs';
import {FACING_ROW} from './movement.mjs';
import {HERO_TINT} from './sprites.mjs';
import {atlasFrame, buildAtlas, voidColor} from './tileset.mjs';

const SCALE = 2;

export function createRenderer(sprites) {
  const atlases = new Map();
  function atlas(biome) {
    if (!atlases.has(biome)) atlases.set(biome, buildAtlas(biome));
    return atlases.get(biome);
  }
  return {
    draw(ctx, world, view) {
      const cameraX = Math.round(world.camera.x);
      const cameraY = Math.round(world.camera.y);
      const focusChunk = world.interior ? world.interior.biome : (world.map.sample(Math.floor((cameraX + view.w / 2) / TILE), Math.floor((cameraY + view.h / 2) / TILE))?.biome ?? 'floresta');
      ctx.fillStyle = voidColor(focusChunk);
      ctx.fillRect(0, 0, view.w, view.h);
      const x0 = Math.floor(cameraX / TILE) - 1;
      const y0 = Math.floor(cameraY / TILE) - 1;
      const x1 = Math.ceil((cameraX + view.w) / TILE) + 1;
      const y1 = Math.ceil((cameraY + view.h) / TILE) + 1;
      const actors = [];
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const sample = world.map.sample(tx, ty);
          const px = tx * TILE - cameraX;
          const py = ty * TILE - cameraY;
          // Margem só visual a oeste do primeiro trecho: a câmera centraliza o grupo
          // e, no começo, ainda não existe chão jogável atrás dele.
          if (!sample) {
            if (!world.interior) paintMargin(ctx, tx, ty, px, py, actors, atlas, world);
            continue;
          }
          if (!sample.ground && !sample.wall && !sample.object && !sample.decor) {
            ctx.fillStyle = voidColor(sample.biome);
            ctx.fillRect(px, py, TILE, TILE);
            continue;
          }
          const sheet = atlas(sample.biome);
          if (sample.ground) blit(ctx, sheet, sample.ground, px, py);
          if (sample.ground === T.water) shimmer(ctx, px, py, tx, world.time);
          if (sample.decor) actors.push({y: py + TILE, draw: () => blit(ctx, sheet, sample.decor, px, py)});
          if (sample.wall) actors.push({y: py + TILE, draw: () => blit(ctx, sheet, sample.wall, px, py - (sample.wall === T.tree ? 10 : 0))});
          if (sample.object) actors.push({y: py + TILE, draw: () => blit(ctx, sheet, sample.object, px, py)});
        }
      }
      for (const drop of world.drops) {
        const x = drop.x - cameraX;
        const y = drop.y - cameraY - Math.sin(drop.age * 8) * 3;
        actors.push({y: drop.y - cameraY, draw: () => {
          ctx.fillStyle = '#3a2c10';
          ctx.fillRect(x - 3, y + 4, 6, 2);
          ctx.fillStyle = '#ffd347';
          ctx.fillRect(x - 3, y - 3, 6, 6);
          ctx.fillStyle = '#fff3ad';
          ctx.fillRect(x - 1, y - 4, 2, 2);
        }});
      }
      for (const mob of world.mobs) {
        if (mob.dead || mob.hp <= 0) continue;
        actors.push({y: mob.y - cameraY, draw: () => drawActor(ctx, sprites.mobs[mob.kind], mob, cameraX, cameraY, world.time, mob.tint)});
      }
      for (const hero of world.heroes) {
        const sheet = sprites.heroes[hero.skin]?.[hero.anim] || sprites.heroes[hero.skin]?.idle;
        actors.push({y: hero.y - cameraY, draw: () => drawActor(ctx, sheet, hero, cameraX, cameraY, world.time, HERO_TINT[hero.skin])});
      }
      actors.sort((a, b) => a.y - b.y);
      for (const actor of actors) actor.draw();
      for (const shot of world.shots) drawShot(ctx, shot, cameraX, cameraY);
      if (world.fade > 0) {
        ctx.fillStyle = `rgba(4, 8, 12, ${Math.min(1, world.fade * 2.4)})`;
        ctx.fillRect(0, 0, view.w, view.h);
      }
    },
    minimap(ctx, world, width, height) {
      ctx.fillStyle = '#0d1718';
      ctx.fillRect(0, 0, width, height);
      if (world.interior) {
        const room = world.interior;
        const scale = Math.min((width - 16) / room.width, (height - 16) / room.height);
        for (let y = 0; y < room.height; y++) for (let x = 0; x < room.width; x++) {
          ctx.fillStyle = room.solid[y * room.width + x] ? '#243044' : '#8a7044';
          ctx.fillRect(8 + x * scale, 8 + y * scale, Math.ceil(scale), Math.ceil(scale));
        }
        for (const hero of world.heroes) {
          ctx.fillStyle = HERO_TINT[hero.skin] ?? '#fff';
          ctx.fillRect(8 + hero.x / TILE * scale - 1, 8 + hero.y / TILE * scale - 1, 3, 3);
        }
        return;
      }
      const lead = world.progression?.leadChunk ?? 0;
      const keys = [lead - 1, lead, lead + 1].filter(index => world.map.chunks.has(index));
      if (!keys.length) return;
      const min = keys[0];
      const sample = world.map.chunks.get(min);
      const span = keys.length * sample.width;
      const scale = Math.min((width - 12) / span, (height - 12) / sample.height);
      for (const index of keys) {
        const chunk = world.map.chunks.get(index);
        const ox = 6 + (chunk.index - min) * chunk.width * scale;
        for (let y = 0; y < chunk.height; y += 1) for (let x = 0; x < chunk.width; x += 1) {
          if (chunk.solid[y * chunk.width + x]) continue;
          ctx.fillStyle = chunk.biome === 'ponte' ? '#8a6234' : chunk.biome === 'cidade' ? '#8d7d68' : chunk.biome === 'masmorra' ? '#4a4556' : chunk.biome === 'cripta' ? '#345066' : '#2f6a3c';
          ctx.fillRect(ox + x * scale, 6 + y * scale, Math.ceil(scale), Math.ceil(scale));
        }
      }
      for (const hero of world.heroes) {
        ctx.fillStyle = '#ffe08a';
        ctx.fillRect(6 + (hero.x / TILE - min * sample.width) * scale - 1.5, 6 + hero.y / TILE * scale - 1.5, 3, 3);
      }
    }
  };
}

const MARGIN_FLOOR = {floresta: T.grass, cidade: T.cobble, ponte: T.water, masmorra: T.stone, cripta: T.stone};
const MARGIN_PROP = {floresta: T.tree, cidade: T.roof, ponte: 0, masmorra: T.wall, cripta: T.wall};

function paintMargin(ctx, tx, ty, px, py, actors, atlas, world) {
  const chunkIndex = Math.floor(tx / CHUNK_W);
  const chunk = world.map.chunks.get(Math.max(0, chunkIndex));
  const west = tx < 0 && tx >= -20 && ty > -6 && ty < CHUNK_H + 6;
  const vertical = chunk && chunkIndex >= 0 && ty >= -6 && ty < CHUNK_H + 6 && (ty < 0 || ty >= CHUNK_H) && tx >= chunkIndex * CHUNK_W && tx < (chunkIndex + 1) * CHUNK_W;
  if (!west && !vertical) return;
  const biome = west ? 'floresta' : chunk.biome;
  const sheet = atlas(biome);
  blit(ctx, sheet, west ? T.grass : (MARGIN_FLOOR[biome] ?? T.grass), px, py);
  if ((MARGIN_FLOOR[biome] ?? T.grass) === T.water) shimmer(ctx, px, py, tx, world.time);
  const n = (Math.imul(tx * 13 + 99, 374761393) ^ Math.imul(ty, 668265263)) >>> 0;
  const prop = west ? (n % 11 === 0 ? T.rock : T.tree) : MARGIN_PROP[biome];
  if (prop && n % 3 !== 0) {
    actors.push({y: py + TILE, draw: () => blit(ctx, sheet, prop, px, py - (prop === T.tree ? 10 : 0))});
  }
}

function blit(ctx, sheet, id, dx, dy) {
  const frame = atlasFrame(id);
  ctx.drawImage(sheet, frame.sx, frame.sy, frame.sw, frame.sh, dx, dy, TILE, TILE);
}

function shimmer(ctx, x, y, tx, time) {
  const shift = Math.floor(time * 8 + tx) % 10;
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#d7f4ff';
  ctx.fillRect(x + 4 + shift, y + 9, 4, 1);
  ctx.fillRect(x + 18 - shift, y + 22, 3, 1);
  ctx.globalAlpha = 1;
}

function drawActor(ctx, image, actor, cameraX, cameraY, time, tint) {
  const x = Math.round(actor.x - cameraX);
  const y = Math.round(actor.y - cameraY);
  ctx.fillStyle = '#0008';
  ctx.fillRect(x - 8, y - 2, 16, 4);
  const row = FACING_ROW[actor.facing] ?? 2;
  if (image?.complete && image.naturalWidth) {
    const frames = Math.max(1, Math.floor(image.width / 32));
    const rows = Math.max(1, Math.floor(image.height / 32));
    let frame = 0;
    if (actor.anim === 'attack') frame = actor.actionTime > 0 ? Math.min(frames - 1, Math.floor((1 - actor.actionTime / 0.32) * frames)) : Math.min(frames - 1, Math.floor(frames * 0.55));
    else frame = Math.floor(time * (actor.anim === 'walk' || actor.mode === 'chase' ? 10 : 6) + (actor.phase || actor.frame || 0)) % frames;
    ctx.drawImage(image, frame * 32, Math.min(row, rows - 1) * 32, 32, 32, x - 16 * SCALE, y - 30 * SCALE, 32 * SCALE, 32 * SCALE);
    if (actor.hit > 0) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 8, y - 28, 16, 18);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = tint || '#eee';
    ctx.fillRect(x - 6, y - 22, 12, 16);
    ctx.fillStyle = '#f0d2b0';
    ctx.fillRect(x - 4, y - 28, 8, 7);
  }
  if (actor.maxHp && actor.hp < actor.maxHp) {
    const ratio = Math.max(0, actor.hp / actor.maxHp);
    ctx.fillStyle = '#201810';
    ctx.fillRect(x - 10, y - 36 * (image ? 1.4 : 1), 20, 3);
    ctx.fillStyle = ratio > 0.35 ? '#d24b4b' : '#ffd0d0';
    ctx.fillRect(x - 9, y - 36 * (image ? 1.4 : 1) + 1, Math.round(18 * ratio), 1);
  }
}

function drawShot(ctx, shot, cameraX, cameraY) {
  const t = shot.age / shot.life;
  const x = shot.x + (shot.tx - shot.x) * t - cameraX;
  const y = shot.y + (shot.ty - shot.y) * t - cameraY;
  ctx.fillStyle = shot.color;
  ctx.fillRect(x - 2, y - 1, 5, 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y - 1, 2, 2);
}
