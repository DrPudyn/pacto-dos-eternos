// A floresta aprovada usa tile de 16px nativos, desenhados em 2× inteiro.
// Cada trecho tem 40 colunas (640px). A altura cobre a tela e um pouco além,
// com o mockup ocupando y = 0..360.

export const TILE = 16;
export const SCALE = 2;
export const CHUNK_W = 40;
export const CHUNK_PX = CHUNK_W * TILE;
export const ROW0 = -16;
export const ROWS = 56;
export const CHUNK_H = ROWS;
export const FOREST_TOP = ROW0 * TILE;
export const FOREST_BOTTOM = (ROW0 + ROWS) * TILE;

// Ids antigos do atlas pintado. A floresta nova não desenha por eles.
export const T = {
  void: 0, grass: 1, dirt: 2, stone: 3, wood: 4, water: 5, plank: 6, wall: 7,
  tree: 8, house: 9, roof: 10, door: 11, flower: 12, torch: 13, rock: 14,
  rail: 15, exit: 16, cobble: 17, ice: 18
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function inGrid(x, y, width = CHUNK_W, height = ROWS) {
  return x >= 0 && y >= 0 && x < width && y < height;
}
