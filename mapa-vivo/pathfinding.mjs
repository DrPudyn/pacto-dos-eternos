// Caminho em grade (A*). Quatro direções, como o passo de um tile no Tibia.
// A busca fica perto do herói (limit) para o trecho infinito não virar um grid gigante.

export function findPath(blocked, start, goal, limit = 16) {
  const sx = start.x | 0;
  const sy = start.y | 0;
  let gx = goal.x | 0;
  let gy = goal.y | 0;
  if (blocked(gx, gy)) {
    const open = nearestOpen(blocked, gx, gy, 3);
    if (!open) return null;
    gx = open.x;
    gy = open.y;
  }
  let ox = sx;
  let oy = sy;
  if (blocked(ox, oy)) {
    const open = nearestOpen(blocked, ox, oy, 2);
    if (!open) return null;
    ox = open.x;
    oy = open.y;
  }
  if (ox === gx && oy === gy) return [{x: ox, y: oy}];

  const key = (x, y) => x + ',' + y;
  const heuristic = (x, y) => Math.abs(x - gx) + Math.abs(y - gy);
  const open = [{x: ox, y: oy, f: heuristic(ox, oy)}];
  const cost = new Map([[key(ox, oy), 0]]);
  const prev = new Map();
  const closed = new Set();
  let guard = 0;
  while (open.length && guard++ < 900) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[best].f) best = i;
    const current = open.splice(best, 1)[0];
    const here = key(current.x, current.y);
    if (closed.has(here)) continue;
    closed.add(here);
    if (current.x === gx && current.y === gy) return rebuild(prev, key(gx, gy), ox, oy);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (Math.abs(nx - ox) > limit || Math.abs(ny - oy) > limit) continue;
      if (blocked(nx, ny)) continue;
      const next = key(nx, ny);
      const step = cost.get(here) + 1;
      if (step >= (cost.get(next) ?? Infinity)) continue;
      cost.set(next, step);
      prev.set(next, here);
      open.push({x: nx, y: ny, f: step + heuristic(nx, ny)});
    }
  }
  return null;
}

function nearestOpen(blocked, x, y, rings) {
  if (!blocked(x, y)) return {x, y};
  for (let ring = 1; ring <= rings; ring++) {
    for (let dy = -ring; dy <= ring; dy++) {
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
        if (!blocked(x + dx, y + dy)) return {x: x + dx, y: y + dy};
      }
    }
  }
  return null;
}

function rebuild(prev, goalKey, sx, sy) {
  const path = [];
  let cursor = goalKey;
  while (cursor) {
    const [x, y] = cursor.split(',').map(Number);
    path.push({x, y});
    if (x === sx && y === sy) break;
    cursor = prev.get(cursor);
  }
  path.reverse();
  return path;
}
