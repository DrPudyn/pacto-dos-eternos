const assert = require('node:assert/strict');

async function main() {
const {CHUNK_H, CHUNK_W, TILE} = await import('./mapa-vivo/constantes.mjs');
const {findPath} = await import('./mapa-vivo/pathfinding.mjs');
const {CameraController} = await import('./mapa-vivo/camera.mjs');
const {MapManager, generateChunk} = await import('./mapa-vivo/map-manager.mjs');
const {createWorld, stepWorld, describeWorld} = await import('./mapa-vivo/world.mjs');

function walkableCount(chunk) {
  let n = 0;
  for (let i = 0; i < chunk.solid.length; i++) if (chunk.solid[i] === 0) n++;
  return n;
}

function floodReachesExit(chunk) {
  const seen = new Uint8Array(chunk.solid.length);
  const stack = [[0, chunk.entryY]];
  let reached = false;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= CHUNK_W || y >= CHUNK_H) continue;
    const i = y * CHUNK_W + x;
    if (seen[i] || chunk.solid[i]) continue;
    seen[i] = 1;
    if (x === CHUNK_W - 1 && y === chunk.exitY) reached = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return reached;
}

function insideSolid(chunk) {
  let minX = CHUNK_W, maxX = 0, minY = CHUNK_H, maxY = 0, holes = 0;
  for (let y = 0; y < CHUNK_H; y++) for (let x = 0; x < CHUNK_W; x++) {
    if (chunk.solid[y * CHUNK_W + x]) continue;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (chunk.solid[y * CHUNK_W + x]) holes++;
  return holes > 8;
}

const seed = 20261108;
for (let index = 0; index < 5; index++) {
  const chunk = generateChunk(seed, index, index === 0 ? null : generateChunk(seed, index - 1, null).exitY);
  const open = walkableCount(chunk);
  assert.ok(open > 40, 'trecho ' + index + ' sem chão');
  assert.ok(open < CHUNK_W * CHUNK_H * 0.72, 'trecho ' + index + ' preencheu o retângulo');
  assert.ok(insideSolid(chunk), 'trecho ' + index + ' não tem oco dentro da caixa');
  assert.equal(floodReachesExit(chunk), true, 'trecho ' + index + ' não liga a entrada à saída');
}

const map = new MapManager(seed);
const a = map.ensure(0);
const b = map.ensure(1);
assert.equal(b.entryY, a.exitY, 'os trechos precisam encaixar na mesma fileira');
assert.ok(b.doors.length >= 1, 'a cidade precisa de casa com porta');
assert.notEqual(a.biome, b.biome);

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

const world = createWorld({seed, view: {w: 960, h: 540}});
const startX = Math.max(...world.heroes.map(hero => hero.x));
let peakX = startX;
let peakCam = world.camera.x;
let sawInterior = false;
let leftInterior = false;
for (let frame = 0; frame < 60 * 36; frame++) {
  const inside = !!world.interior;
  stepWorld(world, 1 / 60);
  if (world.interior) sawInterior = true;
  if (inside && !world.interior) leftInterior = true;
  if (!world.interior) {
    peakX = Math.max(peakX, ...world.heroes.map(hero => hero.x));
    peakCam = Math.max(peakCam, world.camera.x);
  }
}
const report = describeWorld(world);
assert.ok(peakX > startX + 700, 'os heróis devem avançar para a direita: ' + peakX);
assert.ok(Math.max(...world.heroes.map(hero => hero.x)) > 2500, 'depois da casa o grupo precisa seguir para o próximo trecho');
assert.ok(report.kills > 0, 'os heróis devem eliminar mobs no caminho');
assert.ok(peakCam > 200, 'a câmera acompanha o grupo');
assert.ok(Math.max(...world.map.chunks.keys()) >= 1, 'um trecho novo precisa ser gerado');
assert.equal(sawInterior, true, 'o grupo deve entrar numa casa da cidade');
assert.equal(leftInterior, true, 'o grupo deve sair da casa e continuar');
assert.ok([...world.map.chunks.keys()].every(index => index >= 0));

const again = createWorld({seed, view: {w: 320, h: 240}});
stepWorld(world, 0.5);
stepWorld(again, 0.5);
assert.equal(Math.round(world.heroes[0].x), Math.round(world.heroes[0].x));
const freshA = createWorld({seed: 7, view: {w: 320, h: 240}});
const freshB = createWorld({seed: 7, view: {w: 320, h: 240}});
for (let i = 0; i < 90; i++) { stepWorld(freshA, 1 / 30); stepWorld(freshB, 1 / 30); }
assert.equal(freshA.heroes[0].x, freshB.heroes[0].x);
assert.equal(freshA.kills, freshB.kills);

const wide = createWorld({seed, view: {w: 200, h: 160}});
assert.ok(CHUNK_W * TILE > wide.camera.view.w);
assert.ok(CHUNK_H * TILE > wide.camera.view.h);
console.log('Mapa vivo ok.', report);
}

main().catch(error => { console.error(error); process.exit(1); });
