// Biomas em ciclo. A progressão usa o índice do trecho:
// 0 floresta, 1 cidade, 2 ponte, 3 masmorra, 4 cripta, e recomeça com outro desenho.
// Para criar um bioma, acrescente um item aqui e um caso em pintarTerreno() no MapManager.

export const BIOMES = [
  {
    id: 'floresta',
    name: 'Floresta',
    wander: 8,
    yMin: 7,
    yMax: 26,
    pathRadius: 1,
    mobs: ['lobo', 'slime', 'cogumelo'],
    spawn: 4,
    void: '#0d1810',
    colors: {
      grassA: '#1d4a28', grassB: '#256033', dirtA: '#6a5130', dirtB: '#7c6240',
      leaf: '#2f7a3c', trunk: '#3a2918', flower: '#d2d56a', rock: '#5c6570'
    }
  },
  {
    id: 'cidade',
    name: 'Cidade',
    wander: 2,
    yMin: 13,
    yMax: 20,
    pathRadius: 2,
    mobs: ['goblin', 'orc', 'morcego'],
    spawn: 3,
    void: '#12161c',
    colors: {
      grassA: '#3d4a3a', grassB: '#4a5844', dirtA: '#6e5738', dirtB: '#806644',
      cobbleA: '#6a6e76', cobbleB: '#7c8088', wall: '#8d7d68', wallDark: '#5e5144',
      roof: '#7c3030', roofDark: '#541f1f', door: '#c4964a', woodA: '#8a6234', woodB: '#a07848'
    }
  },
  {
    id: 'ponte',
    name: 'Ponte',
    wander: 5,
    yMin: 8,
    yMax: 25,
    pathRadius: 1,
    mobs: ['morcego', 'slime'],
    spawn: 3,
    void: '#0c2430',
    colors: {
      waterA: '#163e58', waterB: '#1d5270', waterC: '#102c40',
      plankA: '#8b5e34', plankB: '#a67444', rail: '#4e3424', rope: '#c2a46a'
    }
  },
  {
    id: 'masmorra',
    name: 'Masmorra',
    wander: 6,
    yMin: 7,
    yMax: 26,
    pathRadius: 1,
    mobs: ['esqueleto', 'orc', 'goblin'],
    spawn: 4,
    void: '#100e14',
    colors: {
      stoneA: '#3a3644', stoneB: '#4a4556', wall: '#262230', wallDark: '#18161f',
      torch: '#ffb040', torchHot: '#fff1c4'
    }
  },
  {
    id: 'cripta',
    name: 'Cripta',
    wander: 4,
    yMin: 8,
    yMax: 25,
    pathRadius: 1,
    mobs: ['esqueleto', 'zumbi', 'morcego'],
    spawn: 4,
    void: '#101820',
    colors: {
      stoneA: '#2a3e4e', stoneB: '#345066', ice: '#b7e4f4', wall: '#1a2c3a',
      wallDark: '#101c28', torch: '#9fd0ff', torchHot: '#e7f7ff'
    }
  }
];

export function biomeAt(index) {
  return BIOMES[((index % BIOMES.length) + BIOMES.length) % BIOMES.length];
}

export function biomeLabel(index) {
  const biome = biomeAt(index);
  const lap = Math.floor(index / BIOMES.length) + 1;
  return lap > 1 ? `${biome.name} ${lap}` : biome.name;
}

export const MOB_STATS = {
  slime: {name: 'Slime', hp: 6, speed: 42, tint: '#53a56a'},
  lobo: {name: 'Lobo', hp: 8, speed: 56, tint: '#8a9098'},
  cogumelo: {name: 'Cogumelo', hp: 8, speed: 16, tint: '#d24b4b'},
  criatura: {name: 'Criatura', hp: 7, speed: 22, tint: '#3e7a32'},
  goblin: {name: 'Goblin', hp: 7, speed: 50, tint: '#6ea84a'},
  orc: {name: 'Orc', hp: 12, speed: 44, tint: '#3e7a32'},
  morcego: {name: 'Morcego', hp: 4, speed: 70, tint: '#6a5a86'},
  esqueleto: {name: 'Esqueleto', hp: 8, speed: 48, tint: '#d9d3c4'},
  zumbi: {name: 'Zumbi', hp: 10, speed: 38, tint: '#6d8a62'}
};
