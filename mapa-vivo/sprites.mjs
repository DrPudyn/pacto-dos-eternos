// Folhas de sprite que o jogo já usa. O recorte é 32×32, quatro fileiras:
// direita, esquerda, baixo, cima — o mesmo mapa da masmorra (zy no cliente original).

export const HERO_SHEETS = {
  swordsman: {
    idle: 'swordsman-idle-BZoYeDgg.png',
    walk: 'swordsman-walk-DMJTpNDL.png',
    attack: 'swordsman-attack-dbN_R6X3.png'
  },
  spearman: {
    idle: 'spearman-idle-CJGk46vT.png',
    walk: 'spearman-walk-BS5M27-3.png',
    attack: 'spearman-attack-C3GjcOso.png'
  },
  archer: {
    idle: 'archer-idle-P3SxISc4.png',
    walk: 'archer-walk-BSlfYEZv.png',
    attack: 'archer-attack-ClxIWz7r.png'
  },
  mage: {
    idle: 'mage-idle.png',
    walk: 'mage-walk.png',
    attack: 'mage-attack.png'
  }
};

export const MOB_SHEETS = {
  slime: 'slime-idle-BGYzMBfI.png',
  lobo: 'wolf-idle-DQ8kllyk.png',
  cogumelo: 'mushroom-idle-BrHqkzBm.png',
  goblin: 'goblin-idle-DI_1ex45.png',
  orc: 'orc-idle-BlAC89q4.png',
  morcego: 'bat-idle-hFetTYWt.png',
  esqueleto: 'skeleton-idle-poWSJqXr.png',
  zumbi: 'zombie-idle-BB8yAnxg.png'
};

export const HERO_TINT = {
  swordsman: '#d64545',
  spearman: '#3e9b4a',
  archer: '#3d7ec4',
  mage: '#a46bd0'
};

function load(src) {
  const image = new Image();
  image.decoding = 'async';
  const ready = new Promise(resolve => {
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
  });
  image.src = src;
  return {image, ready};
}

const FOREST_OBJECTS = ['oak', 'birch', 'oak-sapling', 'birch-sapling', 'rocks', 'shrub', 'log', 'waystone'];

// No cliente online a whitelist só entrega /shared-build. O jogo offline continua em /build.
function spriteFolder() {
  const path = globalThis.location?.pathname ?? '';
  const shared = path === '/' || /(^|\/)compartilhado\.html$/.test(path) || /(^|\/)mapa-vivo\.html$/.test(path);
  return shared ? '../shared-build/' : '../build/';
}

export function loadSprites(baseUrl) {
  const heroes = {};
  const mobs = {};
  const jobs = [];
  const forest = {objects: {}, grass: [], mobs: {}};
  const take = (url) => {
    const item = load(url);
    jobs.push(item.ready);
    return item.image;
  };
  const sheetRoot = spriteFolder();
  for (const [skin, sheets] of Object.entries(HERO_SHEETS)) {
    heroes[skin] = {};
    for (const [action, file] of Object.entries(sheets)) {
      const item = load(new URL(sheetRoot + file, baseUrl).href);
      heroes[skin][action] = item.image;
      jobs.push(item.ready);
    }
  }
  for (const [kind, file] of Object.entries(MOB_SHEETS)) {
    const item = load(new URL(sheetRoot + file, baseUrl).href);
    mobs[kind] = item.image;
    jobs.push(item.ready);
  }
  forest.ground = take(new URL('./floresta/chao-0.png', baseUrl).href);
  forest.terrain = take(new URL('./floresta/terreno.png', baseUrl).href);
  for (let i = 0; i < 11; i++) {
    forest.grass.push(take(new URL('./floresta/grama/' + String(i).padStart(2, '0') + '.png', baseUrl).href));
  }
  for (const name of FOREST_OBJECTS) {
    forest.objects[name] = take(new URL('./floresta/' + name + '.png', baseUrl).href);
  }
  forest.mobs.cogumelo = take(new URL('./floresta/cogumelo.png', baseUrl).href);
  forest.mobs.criatura = take(new URL('./floresta/criatura.png', baseUrl).href);
  return {heroes, mobs, forest, ready: Promise.all(jobs)};
}
