// CollisionSystem — separa chão livre de tile bloqueado.
// O corpo do herói é um pequeno círculo nos pés; encostar na parede escorrega em vez de atravessar.

import {TILE} from './constantes.mjs';

export class CollisionSystem {
  constructor(map) {
    this.map = map;
    this.radius = 8;
  }

  blockedPixel(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return true;
    return this.map.blocked(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  fits(x, y, radius = this.radius) {
    return !this.blockedPixel(x, y)
      && !this.blockedPixel(x - radius, y)
      && !this.blockedPixel(x + radius, y)
      && !this.blockedPixel(x, y - radius)
      && !this.blockedPixel(x, y + radius);
  }

  nearestOpen(x, y, radius = this.radius) {
    if (this.fits(x, y, radius)) return {x, y};
    for (let ring = 1; ring <= 6; ring++) {
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          const nx = x + dx * 8;
          const ny = y + dy * 8;
          if (this.fits(nx, ny, radius)) return {x: nx, y: ny};
        }
      }
    }
    return {x, y};
  }
}
