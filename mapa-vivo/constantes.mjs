// Tamanho do tile e dos trechos. O mundo é maior que a viewport:
// cada trecho tem 30×34 tiles (960×1088 px) e a progressão cola novos trechos à direita.
// Para ampliar o mapa, aumente CHUNK_W / CHUNK_H — o gerador e a câmera acompanham.

export const TILE = 32;
export const CHUNK_W = 30;
export const CHUNK_H = 34;

// Camadas do tilemap. O id 0 é vazio (fora do contorno jogável).
export const T = {
  void: 0,
  grass: 1,
  dirt: 2,
  stone: 3,
  wood: 4,
  water: 5,
  plank: 6,
  wall: 7,
  tree: 8,
  house: 9,
  roof: 10,
  door: 11,
  flower: 12,
  torch: 13,
  rock: 14,
  rail: 15,
  exit: 16,
  cobble: 17,
  ice: 18
};

const SOLID = new Set([T.void, T.water, T.wall, T.tree, T.house, T.roof, T.rock, T.rail]);
const DOOR = new Set([T.door, T.exit]);

export function isSolidId(id) {
  return SOLID.has(id);
}

export function isDoorId(id) {
  return DOOR.has(id);
}

export function tileIndex(x, y, width = CHUNK_W) {
  return y * width + x;
}

export function inGrid(x, y, width = CHUNK_W, height = CHUNK_H) {
  return x >= 0 && y >= 0 && x < width && y < height;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
