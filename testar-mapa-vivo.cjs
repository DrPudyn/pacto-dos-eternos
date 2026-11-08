const assert = require('node:assert/strict');

async function main() {
const {CHUNK_W, TILE, ROW0} = await import('./mapa-vivo/constantes.mjs');
const {findPath} = await import('./mapa-vivo/pathfinding.mjs');
const {CameraController} = await import('./mapa-vivo/camera.mjs');
const {MapManager} = await import('./mapa-vivo/map-manager.mjs');
const {gradeAprovada, pathCenter} = await import('./mapa-vivo/floresta.mjs');
const {createWorld, stepWorld, describeWorld} = await import('./mapa-vivo/world.mjs');

const seed = 20261108;
const map = new MapManager(seed);
const grade = gradeAprovada();
const first = map.ensure(0);
let diffs = 0;
for (let y = 0; y < grade.length; y++) {
  for (let x = 0; x < grade[0].length; x++) {
    if (first.solid[(y - ROW0) * CHUNK_W + x] !== grade[y][x]) diffs++;
  }
}
assert.equal(diffs, 0, 'a colisão do primeiro trecho tem de ser a grade aprovada');
assert.equal(first.biome, 'floresta');
assert.equal(first.doors.length, 0);

function reaches(index) {
  const chunk = map.ensure(index);
  assert.equal(chunk.biome, 'floresta');
  assert.equal(chunk.entryY, index === 0 ? first.entryY : map.ensure(index - 1).exitY);
  const x0 = index * CHUNK_W;
  const sy = Math.floor(pathCenter(x0 + 8) / TILE);
  const gy = Math.floor(pathCenter((index + 1) * CHUNK_W * TILE - 8) / TILE);
  const seen = new Set();
  const stack = [[x0, sy]];
  let reached = false;
  while (stack.length) {
    const [x, y] = stack.pop();
    const key = x + ',' + y;
    if (seen.has(key) || x < x0 || x >= x0 + CHUNK_W || y < -4 || y > 28) continue;
    if (map.blocked(x, y)) continue;
    seen.add(key);
    if (x === x0 + CHUNK_W - 1 && Math.abs(y - gy) <= 1) reached = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  assert.equal(reached, true, 'trecho ' + index + ' não liga a entrada à saída');
  assert.ok(seen.size > 400, 'trecho ' + index + ' ficou fechado demais');
  let centerBlocked = 0;
  for (let x = x0; x < x0 + CHUNK_W; x += 2) {
    const px = x * TILE + 8;
    if (map.blocked(x, Math.floor(pathCenter(px) / TILE))) centerBlocked++;
  }
  assert.equal(centerBlocked, 0, 'o meio do caminho do trecho ' + index + ' está bloqueado');
}
for (let index = 0; index < 4; index++) reaches(index);
assert.notDeepEqual(map.ensure(1).objects.map(obj => obj.x + ':' + obj.y), map.ensure(2).objects.map(obj => obj.x + ':' + obj.y));

const blocked = (x, y) => x === 2 && y < 4 || x < 0 || y < 0 || x > 5 || y > 4;
const path = findPath(blocked, {x: 0, y: 0}, {x: 4, y: 0}, 8);
assert.ok(path && path.length > 3, 'A* deveria contornar o muro');
assert.ok(path.every(step => !blocked(step.x, step.y)));

const camera = new CameraController({w: 400, h: 240});
camera.snap(0, 0, {x: 0, y: 0, w: 2000, h: 1200});
const before = camera.x;
camera.follow(600, 400, 1 / 60, {x: 0, y: 0, w: 2000, h: 1200});
assert.ok(camera.x > before, 'a câmera avança na direção do foco');
assert.ok(camera.x < 600 - 200, 'o lerp não pode pular até o alvo num frame');

const world = createWorld({seed, view: {w: 640, h: 360}});
const startX = Math.max(...world.heroes.map(hero => hero.x));
assert.ok(world.heroes.every(hero => world.collision.fits(hero.x, hero.y)));
assert.deepEqual(world.heroes.map(hero => hero.skin), ['swordsman', 'spearman', 'archer']);
let peakX = startX;
let peakCam = world.camera.x;
let steppedOnSolid = 0;
for (let frame = 0; frame < 60 * 20; frame++) {
  stepWorld(world, 1 / 60);
  for (const hero of world.heroes) {
    if (world.map.blocked(Math.floor(hero.x / TILE), Math.floor(hero.y / TILE))) steppedOnSolid++;
  }
  peakX = Math.max(peakX, ...world.heroes.map(hero => hero.x));
  peakCam = Math.max(peakCam, world.camera.x);
}
const report = describeWorld(world);
assert.equal(steppedOnSolid, 0, 'um herói pisou numa base sólida');
assert.ok(peakX > startX + 700, 'os heróis devem avançar para a direita: ' + peakX);
assert.ok(report.kills > 0, 'os heróis devem eliminar mobs no caminho');
assert.ok(world.respawns > 0, 'os mobs devem renascer na clareira');
assert.ok(peakCam > 200, 'a câmera acompanha o grupo');
assert.ok(Math.max(...world.map.chunks.keys()) >= 2, 'um trecho novo de floresta precisa ser gerado');
assert.ok([...world.map.chunks.keys()].every(index => index >= 0));
assert.equal(world.interior, null);

const freshA = createWorld({seed: 7, view: {w: 320, h: 240}});
const freshB = createWorld({seed: 7, view: {w: 320, h: 240}});
for (let i = 0; i < 90; i++) { stepWorld(freshA, 1 / 30); stepWorld(freshB, 1 / 30); }
assert.equal(freshA.heroes[0].x, freshB.heroes[0].x);
assert.equal(freshA.kills, freshB.kills);
console.log('Mapa vivo ok.', report);
}

main().catch(error => { console.error(error); process.exit(1); });
