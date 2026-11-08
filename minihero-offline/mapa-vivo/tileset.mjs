// Tileset pintado em código, no mesmo grid 32×32 dos sprites dos heróis.
// Trocar por um PNG depois é local: desenhe os ids de `T` nesta ordem e
// aponte atlasSource para o arquivo. As cores vêm do bioma.

import {BIOMES} from './biomas.mjs';
import {T} from './constantes.mjs';

export const ATLAS_COLS = 8;

const ORDER = [
  T.void, T.grass, T.dirt, T.stone, T.wood, T.water, T.plank, T.wall,
  T.tree, T.house, T.roof, T.door, T.flower, T.torch, T.rock, T.rail,
  T.exit, T.cobble, T.ice
];

export function atlasFrame(id) {
  const index = Math.max(0, ORDER.indexOf(id));
  return {sx: (index % ATLAS_COLS) * 32, sy: Math.floor(index / ATLAS_COLS) * 32, sw: 32, sh: 32};
}

export function buildAtlas(biomeId) {
  const biome = BIOMES.find(item => item.id === biomeId) ?? BIOMES[0];
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * 32;
  canvas.height = Math.ceil(ORDER.length / ATLAS_COLS) * 32;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ORDER.forEach((id, index) => {
    paint(ctx, id, biome.colors, (index % ATLAS_COLS) * 32, Math.floor(index / ATLAS_COLS) * 32);
  });
  return canvas;
}

export function voidColor(biomeId) {
  return (BIOMES.find(item => item.id === biomeId) ?? BIOMES[0]).void;
}

function dot(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function paint(ctx, id, c, x, y) {
  if (id === T.grass) return grass(ctx, x, y, c.grassA ?? '#245632', c.grassB ?? '#1b4224', c.flower ?? '#d6d26a');
  if (id === T.dirt) return dirt(ctx, x, y, c.dirtA ?? '#6a5130', c.dirtB ?? '#7d6240');
  if (id === T.stone) return stone(ctx, x, y, c.stoneA ?? '#3a3644', c.stoneB ?? '#4a4556');
  if (id === T.wood) return planks(ctx, x, y, c.woodA ?? '#8a6234', c.woodB ?? '#6e4c28', true);
  if (id === T.water) return water(ctx, x, y, c.waterA ?? '#163e58', c.waterB ?? '#1d5270', c.waterC ?? '#102c40');
  if (id === T.plank) return planks(ctx, x, y, c.plankA ?? '#8b5e34', c.plankB ?? '#a67444', false);
  if (id === T.cobble) return cobble(ctx, x, y, c.cobbleA ?? c.stoneA ?? '#6a6e76', c.cobbleB ?? '#8a8e96');
  if (id === T.ice) return ice(ctx, x, y, c.stoneA ?? '#2a3e4e', c.ice ?? '#b7e4f4');
  if (id === T.tree) return tree(ctx, x, y, c.trunk ?? '#3a2918', c.leaf ?? '#2f7a3c');
  if (id === T.house) return wall(ctx, x, y, c.wall ?? '#8d7d68', c.wallDark ?? '#5e5144');
  if (id === T.roof) return roof(ctx, x, y, c.roof ?? '#7c3030', c.roofDark ?? '#541f1f');
  if (id === T.door || id === T.exit) return door(ctx, x, y, c.door ?? '#c4964a', id === T.exit ? '#f2e2a8' : '#6a4a22');
  if (id === T.flower) return flower(ctx, x, y, c.flower ?? '#e6e68a', c.leaf ?? '#2f7a3c');
  if (id === T.torch) return torch(ctx, x, y, c.torch ?? '#ffb040', c.torchHot ?? '#fff1c4');
  if (id === T.rock) return rock(ctx, x, y, c.rock ?? c.wall ?? '#5c6570');
  if (id === T.rail) return rail(ctx, x, y, c.rail ?? '#4e3424', c.rope ?? '#c2a46a');
  if (id === T.wall) return bricks(ctx, x, y, c.wall ?? '#262230', c.wallDark ?? '#18161f');
}

function grass(ctx, x, y, a, b, flower) {
  dot(ctx, x, y, 32, 32, a);
  dot(ctx, x + 2, y + 6, 2, 2, b);
  dot(ctx, x + 14, y + 4, 3, 2, b);
  dot(ctx, x + 24, y + 16, 2, 2, b);
  dot(ctx, x + 8, y + 22, 2, 2, b);
  dot(ctx, x + 20, y + 26, 3, 2, b);
  dot(ctx, x + 6, y + 12, 1, 3, flower);
  dot(ctx, x + 26, y + 8, 1, 3, flower);
}

function dirt(ctx, x, y, a, b) {
  dot(ctx, x, y, 32, 32, a);
  dot(ctx, x, y + 15, 32, 1, b);
  dot(ctx, x + 4, y + 8, 3, 2, b);
  dot(ctx, x + 18, y + 22, 4, 2, b);
  dot(ctx, x + 22, y + 5, 2, 2, '#3d2c18');
}

function stone(ctx, x, y, a, b) {
  dot(ctx, x, y, 32, 32, a);
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 ? 8 : 0;
    dot(ctx, x, y + row * 8, 32, 1, b);
    for (let col = offset; col < 32; col += 16) dot(ctx, x + col, y + row * 8, 1, 8, b);
  }
}

function planks(ctx, x, y, a, b, horizontal) {
  dot(ctx, x, y, 32, 32, a);
  if (horizontal) {
    for (let row = 0; row < 4; row++) dot(ctx, x, y + row * 8 + 7, 32, 1, b);
  } else {
    for (let col = 0; col < 4; col++) dot(ctx, x + col * 8 + 7, y, 1, 32, b);
    dot(ctx, x + 3, y + 6, 2, 1, '#e6c48a');
    dot(ctx, x + 19, y + 18, 2, 1, '#e6c48a');
  }
}

function water(ctx, x, y, a, b, deep) {
  dot(ctx, x, y, 32, 32, a);
  dot(ctx, x, y + 6, 32, 3, b);
  dot(ctx, x, y + 16, 32, 2, deep);
  dot(ctx, x, y + 24, 32, 3, b);
  dot(ctx, x + 6, y + 8, 6, 1, '#9ad4ea');
  dot(ctx, x + 18, y + 26, 5, 1, '#9ad4ea');
}

function cobble(ctx, x, y, a, b) {
  dot(ctx, x, y, 32, 32, a);
  for (let i = 0; i < 6; i++) {
    const px = x + (i * 9) % 26 + 2;
    const py = y + ((i * 7) % 24) + 3;
    dot(ctx, px, py, 5, 4, b);
    dot(ctx, px, py + 4, 5, 1, '#2c3138');
  }
}

function ice(ctx, x, y, a, iceColor) {
  stone(ctx, x, y, a, '#1c3040');
  dot(ctx, x + 4, y + 6, 8, 1, iceColor);
  dot(ctx, x + 18, y + 18, 7, 1, iceColor);
  dot(ctx, x + 10, y + 24, 2, 2, iceColor);
}

function tree(ctx, x, y, trunk, leaf) {
  dot(ctx, x + 14, y + 18, 4, 12, trunk);
  dot(ctx, x + 6, y + 8, 20, 12, leaf);
  dot(ctx, x + 10, y + 4, 12, 6, leaf);
  dot(ctx, x + 8, y + 10, 3, 3, '#1d4a28');
  dot(ctx, x + 18, y + 12, 2, 2, '#8fce74');
}

function wall(ctx, x, y, a, b) {
  dot(ctx, x, y, 32, 32, a);
  for (let row = 0; row < 4; row++) {
    dot(ctx, x, y + row * 8, 32, 1, b);
    dot(ctx, x + (row % 2 ? 16 : 0), y + row * 8, 1, 8, b);
  }
  dot(ctx, x + 20, y + 12, 6, 6, '#1a2430');
  dot(ctx, x + 21, y + 13, 4, 2, '#9fd0ea');
}

function bricks(ctx, x, y, a, b) {
  dot(ctx, x, y, 32, 32, a);
  for (let row = 0; row < 4; row++) {
    dot(ctx, x, y + 7 + row * 8, 32, 1, b);
    dot(ctx, x + (row % 2 ? 4 : 18), y + row * 8, 1, 8, b);
  }
}

function roof(ctx, x, y, a, b) {
  dot(ctx, x, y, 32, 32, a);
  for (let row = 0; row < 8; row++) dot(ctx, x, y + row * 4, 32, 1, b);
  dot(ctx, x + 4, y + 10, 2, 2, '#e6c48a');
}

function door(ctx, x, y, wood, mark) {
  dot(ctx, x + 6, y + 2, 20, 30, '#3a2a18');
  dot(ctx, x + 8, y + 4, 16, 26, wood);
  dot(ctx, x + 8, y + 16, 16, 1, '#6a4a22');
  dot(ctx, x + 18, y + 18, 2, 2, mark);
  dot(ctx, x + 10, y + 8, 4, 5, '#2a2118');
}

function flower(ctx, x, y, petal, leaf) {
  dot(ctx, x + 15, y + 16, 2, 8, leaf);
  dot(ctx, x + 12, y + 12, 3, 3, petal);
  dot(ctx, x + 17, y + 12, 3, 3, petal);
  dot(ctx, x + 14, y + 9, 4, 3, petal);
}

function torch(ctx, x, y, flame, hot) {
  dot(ctx, x + 14, y + 16, 4, 10, '#6a5438');
  dot(ctx, x + 13, y + 8, 6, 8, flame);
  dot(ctx, x + 15, y + 6, 2, 4, hot);
}

function rock(ctx, x, y, color) {
  dot(ctx, x + 6, y + 14, 20, 12, color);
  dot(ctx, x + 10, y + 10, 12, 6, color);
  dot(ctx, x + 8, y + 16, 4, 2, '#2c3138');
  dot(ctx, x + 16, y + 12, 3, 2, '#c5ccd4');
}

function rail(ctx, x, y, post, rope) {
  dot(ctx, x + 6, y + 8, 3, 18, post);
  dot(ctx, x + 23, y + 8, 3, 18, post);
  dot(ctx, x + 6, y + 12, 20, 2, rope);
  dot(ctx, x + 6, y + 18, 20, 2, rope);
}
