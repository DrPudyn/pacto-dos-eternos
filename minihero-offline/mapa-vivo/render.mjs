// Desenha a floresta em pixels nativos. O CSS amplia 2× com nearest-neighbor.
// Objetos, heróis e mobs entram na mesma lista e são ordenados pela base,
// então o grupo passa por trás da copa. Só o tronco bloqueia o passo.

import {CHAO, wangTile} from './floresta.mjs';
import {TILE} from './constantes.mjs';
import {FACING_ROW} from './movement.mjs';
import {hash32} from './rng.mjs';

const FLOWER = ['#f4e1ae', '#c783c0', '#9dc255'];

export function createRenderer(sprites) {
  const boxes = new Map();
  return {
    draw(ctx, world, view) {
      ctx.imageSmoothingEnabled = false;
      const cameraX = Math.round(world.camera.x);
      const cameraY = Math.round(world.camera.y);
      ctx.fillStyle = '#10241c';
      ctx.fillRect(0, 0, view.w, view.h);
      const x0 = Math.floor(cameraX / TILE) - 1;
      const y0 = Math.floor(cameraY / TILE) - 1;
      const x1 = Math.ceil((cameraX + view.w) / TILE) + 1;
      const y1 = Math.ceil((cameraY + view.h) / TILE) + 1;
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const px = tx * TILE;
          const py = ty * TILE;
          if (px >= 0 && py >= 0 && px + TILE <= CHAO.w && py + TILE <= CHAO.h) continue;
          drawGroundTile(ctx, sprites.forest, px, py, cameraX, cameraY);
        }
      }
      const ground = sprites.forest?.ground;
      if (ground?.complete && ground.naturalWidth) {
        ctx.drawImage(ground, -cameraX, -cameraY);
      }
      drawFlowers(ctx, x0, y0, x1, y1, cameraX, cameraY);
      const actors = [];
      for (const chunk of world.map.chunks.values()) {
        for (const obj of chunk.objects) {
          if (obj.x < cameraX - 80 || obj.x > cameraX + view.w + 80) continue;
          if (obj.y < cameraY - 20 || obj.y > cameraY + view.h + 90) continue;
          if (obj.sombra) actors.push({y: -1e9, draw: () => shadow(ctx, obj.x - cameraX, obj.y - cameraY)});
          actors.push({y: obj.y, draw: () => drawProp(ctx, sprites.forest.objects[obj.asset], obj, cameraX, cameraY, boxes)});
        }
      }
      for (const mob of world.mobs) {
        if (mob.dead || mob.hp <= 0) continue;
        actors.push({y: -1e9 + mob.y, draw: () => shadow(ctx, mob.x - cameraX, mob.y - cameraY)});
        const sheet = sprites.forest?.mobs?.[mob.kind];
        actors.push({y: mob.y, draw: () => drawMob(ctx, sheet, mob, cameraX, cameraY, world.time, boxes)});
      }
      for (const hero of world.heroes) {
        actors.push({y: -1e9 + hero.y, draw: () => shadow(ctx, hero.x - cameraX, hero.y - cameraY)});
        const sheet = sprites.heroes[hero.skin]?.[hero.anim] || sprites.heroes[hero.skin]?.idle;
        actors.push({y: hero.y, draw: () => drawHero(ctx, sheet, hero, cameraX, cameraY, world.time, boxes)});
      }
      for (const drop of world.drops) {
        actors.push({y: drop.y, draw: () => drawDrop(ctx, drop, cameraX, cameraY)});
      }
      actors.sort((a, b) => a.y - b.y);
      for (const actor of actors) actor.draw();
      for (const shot of world.shots) drawShot(ctx, shot, cameraX, cameraY);
      if (world.fade > 0) {
        ctx.fillStyle = `rgba(8, 14, 12, ${Math.min(1, world.fade * 2.4)})`;
        ctx.fillRect(0, 0, view.w, view.h);
      }
    },
    minimap(ctx, world, width, height) {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#10241c';
      ctx.fillRect(0, 0, width, height);
      const focus = world.heroes.reduce((best, hero) => hero.x > best.x ? hero : best, world.heroes[0] ?? {x: 320, y: 200});
      const tilesX = 26;
      const tilesY = 16;
      const scale = Math.max(2, Math.min((width - 8) / tilesX, (height - 8) / tilesY));
      const startTx = Math.floor(focus.x / TILE) - Math.floor(tilesX / 2);
      const startTy = Math.floor(focus.y / TILE) - Math.floor(tilesY / 2);
      for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
          const blocked = world.map.blocked(startTx + x, startTy + y);
          ctx.fillStyle = blocked ? '#6a4a2c' : '#3d8f45';
          ctx.fillRect(4 + x * scale, 4 + y * scale, Math.ceil(scale), Math.ceil(scale));
        }
      }
      for (const mob of world.mobs) {
        if (mob.dead || mob.hp <= 0) continue;
        const x = Math.floor(mob.x / TILE) - startTx;
        const y = Math.floor(mob.y / TILE) - startTy;
        if (x < 0 || y < 0 || x >= tilesX || y >= tilesY) continue;
        ctx.fillStyle = '#d24b4b';
        ctx.fillRect(4 + x * scale, 4 + y * scale, Math.max(2, scale), Math.max(2, scale));
      }
      for (const hero of world.heroes) {
        const x = Math.floor(hero.x / TILE) - startTx;
        const y = Math.floor(hero.y / TILE) - startTy;
        ctx.fillStyle = '#ffe08a';
        ctx.fillRect(4 + x * scale, 4 + y * scale, Math.max(3, scale), Math.max(3, scale));
      }
    }
  };
}

function drawGroundTile(ctx, forest, px, py, cameraX, cameraY) {
  const terrain = forest?.terrain;
  const tile = wangTile(px, py);
  if (!terrain?.complete || !tile) return;
  const dx = px - cameraX;
  const dy = py - cameraY;
  const key = tile.key;
  const pure = key[0] === key[1] && key[1] === key[2] && key[2] === key[3];
  if (!pure) {
    ctx.drawImage(terrain, tile.x, tile.y, TILE, TILE, dx, dy, TILE, TILE);
    return;
  }
  const salt = hash32(px, py + 17);
  ctx.save();
  ctx.translate(dx + 8, dy + 8);
  if (salt % 3 === 0) ctx.scale(-1, 1);
  else if (salt % 3 === 1) ctx.scale(1, -1);
  else ctx.scale(-1, -1);
  ctx.drawImage(terrain, tile.x, tile.y, TILE, TILE, -8, -8, TILE, TILE);
  ctx.restore();
  if (key[0] === 'U' && forest.grass?.length) {
    const variant = forest.grass[(salt >>> 8) % forest.grass.length];
    if (variant?.complete && variant.naturalWidth) ctx.drawImage(variant, dx, dy);
  }
}

function drawFlowers(ctx, x0, y0, x1, y1, cameraX, cameraY) {
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const px = tx * TILE;
      const py = ty * TILE;
      if (px >= 0 && py >= 0 && px < CHAO.w && py < CHAO.vista) continue;
      const key = wangTile(px, py)?.key;
      if (!key || key !== 'UUUU') continue;
      const salt = hash32(tx + 3, ty + 11);
      if (salt % 41 !== 0) continue;
      ctx.fillStyle = FLOWER[salt % 3];
      ctx.fillRect(px - cameraX + (salt % 11) + 2, py - cameraY + ((salt >>> 4) % 11) + 2, 1, 1);
    }
  }
}

function shadow(ctx, x, y) {
  ctx.fillStyle = 'rgba(19, 46, 38, 0.55)';
  ctx.fillRect(Math.round(x) - 3, Math.round(y) - 1, 7, 2);
}

function frameBox(image, sx, sy, sw, sh, cache) {
  const key = (image.src || image) + ':' + sx + ':' + sy + ':' + sw;
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  const data = ctx.getImageData(0, 0, sw, sh).data;
  let minX = sw;
  let minY = sh;
  let maxX = 0;
  let maxY = 0;
  let seen = false;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (data[(y * sw + x) * 4 + 3] === 0) continue;
      seen = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + 1 > maxX) maxX = x + 1;
      if (y + 1 > maxY) maxY = y + 1;
    }
  }
  const box = seen ? [minX, minY, maxX, maxY] : [0, 0, sw, sh];
  cache.set(key, box);
  return box;
}

function blitAnchored(ctx, image, sx, sy, sw, sh, anchorX, anchorY, flip, cache) {
  if (!image?.complete || !image.naturalWidth) return null;
  let box = frameBox(image, sx, sy, sw, sh, cache);
  if (flip) box = [sw - box[2], box[1], sw - box[0], box[3]];
  const left = Math.round(anchorX) - Math.floor((box[0] + box[2]) / 2);
  const top = Math.round(anchorY) - box[3];
  ctx.save();
  ctx.translate(left + (flip ? sw : 0), top);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.restore();
  return {left, top, sw, sh};
}

function drawProp(ctx, image, obj, cameraX, cameraY, cache) {
  blitAnchored(ctx, image, 0, 0, image?.naturalWidth || 0, image?.naturalHeight || 0, obj.x - cameraX, obj.y - cameraY, obj.flip, cache);
}

function drawHero(ctx, image, hero, cameraX, cameraY, time, cache) {
  const x = hero.x - cameraX;
  const y = hero.y - cameraY;
  if (image?.complete && image.naturalWidth) {
    const row = FACING_ROW[hero.facing] ?? 0;
    const rows = Math.max(1, Math.floor(image.naturalHeight / 32));
    const frames = Math.max(1, Math.floor(image.naturalWidth / 32));
    let frame = 0;
    if (hero.anim === 'attack') frame = Math.min(frames - 1, Math.floor((1 - Math.max(0, hero.actionTime) / 0.32) * frames));
    else if (hero.anim === 'walk') frame = Math.floor(time * 8 + (hero.frame || 0)) % frames;
    else frame = Math.floor(time * 4 + (hero.frame || 0)) % frames;
    blitAnchored(ctx, image, frame * 32, Math.min(row, rows - 1) * 32, 32, 32, x, y, false, cache);
    if (hero.hit > 0) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.round(x) - 4, Math.round(y) - 12, 8, 8);
      ctx.globalAlpha = 1;
    }
  }
  if (hero.maxHp && hero.hp < hero.maxHp) bar(ctx, x, y - 16, hero.hp / hero.maxHp);
}

function drawMob(ctx, image, mob, cameraX, cameraY, time, cache) {
  const x = mob.x - cameraX;
  const y = mob.y - cameraY;
  const flip = mob.facing === 'left';
  if (image?.complete && image.naturalWidth) {
    const frames = Math.max(1, Math.floor(image.naturalWidth / 24));
    const frame = Math.floor(time * (mob.mode === 'chase' ? 8 : 5) + (mob.phase || 0)) % frames;
    blitAnchored(ctx, image, frame * 24, 0, 24, 24, x, y, flip, cache);
    if (mob.hit > 0) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.round(x) - 5, Math.round(y) - 16, 10, 10);
      ctx.globalAlpha = 1;
    }
  }
  if (mob.maxHp && mob.hp < mob.maxHp) bar(ctx, x, y - 20, mob.hp / mob.maxHp);
}

function bar(ctx, x, y, ratio) {
  const left = Math.round(x) - 7;
  const top = Math.round(y);
  ctx.fillStyle = '#201810';
  ctx.fillRect(left, top, 14, 3);
  ctx.fillStyle = ratio > 0.35 ? '#d24b4b' : '#ffd0d0';
  ctx.fillRect(left + 1, top + 1, Math.round(12 * Math.max(0, ratio)), 1);
}

function drawDrop(ctx, drop, cameraX, cameraY) {
  const x = Math.round(drop.x - cameraX);
  const y = Math.round(drop.y - cameraY - Math.sin(drop.age * 8) * 2);
  ctx.fillStyle = '#e2c37e';
  ctx.fillRect(x - 2, y - 2, 4, 3);
  ctx.fillStyle = '#fff3ad';
  ctx.fillRect(x - 1, y - 3, 2, 1);
}

function drawShot(ctx, shot, cameraX, cameraY) {
  const t = shot.age / shot.life;
  const x = Math.round(shot.x + (shot.tx - shot.x) * t - cameraX);
  const y = Math.round(shot.y + (shot.ty - shot.y) * t - cameraY);
  ctx.fillStyle = shot.color;
  ctx.fillRect(x - 2, y - 1, 5, 1);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y - 1, 2, 1);
}
