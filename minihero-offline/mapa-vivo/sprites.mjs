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

export function loadSprites(baseUrl) {
  const heroes = {};
  const mobs = {};
  const jobs = [];
  for (const [skin, sheets] of Object.entries(HERO_SHEETS)) {
    heroes[skin] = {};
    for (const [action, file] of Object.entries(sheets)) {
      const item = load(new URL('../build/' + file, baseUrl).href);
      heroes[skin][action] = item.image;
      jobs.push(item.ready);
    }
  }
  for (const [kind, file] of Object.entries(MOB_SHEETS)) {
    const item = load(new URL('../build/' + file, baseUrl).href);
    mobs[kind] = item.image;
    jobs.push(item.ready);
  }
  return {heroes, mobs, ready: Promise.all(jobs)};
}
