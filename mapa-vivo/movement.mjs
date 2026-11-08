// MovementSystem — desloca um corpo respeitando a colisão.
// Se o passo diagonal bate na parede, tenta o eixo X e depois o Y (escorregar).

export function facingFrom(dx, dy, previous = 'right') {
  if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) return previous;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

export const FACING_ROW = {right: 0, left: 1, down: 2, up: 3};

export class MovementSystem {
  constructor(collision) {
    this.collision = collision;
  }

  move(entity, dx, dy) {
    const distance = Math.hypot(dx, dy);
    if (distance < 0.0001) return false;
    const steps = Math.max(1, Math.ceil(distance / 6));
    let moved = false;
    for (let i = 0; i < steps; i++) {
      const sx = dx / steps;
      const sy = dy / steps;
      if (this.collision.fits(entity.x + sx, entity.y + sy)) {
        entity.x += sx;
        entity.y += sy;
        moved = true;
        continue;
      }
      if (Math.abs(sx) > 0.001 && this.collision.fits(entity.x + sx, entity.y)) {
        entity.x += sx;
        moved = true;
        continue;
      }
      if (Math.abs(sy) > 0.001 && this.collision.fits(entity.x, entity.y + sy)) {
        entity.y += sy;
        moved = true;
      }
    }
    if (moved) entity.facing = facingFrom(dx, dy, entity.facing);
    return moved;
  }

  steer(entity, target, speed, dt) {
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2.5) return 0;
    const step = Math.min(distance, speed * dt);
    const moved = this.move(entity, (dx / distance) * step, (dy / distance) * step);
    return moved ? step : 0;
  }
}
