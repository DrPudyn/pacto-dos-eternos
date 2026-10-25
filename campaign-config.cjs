const regions=[
  {
    "id": 1,
    "name": "Floresta Corrompida",
    "boss": "A Raiz Profana",
    "lore": "Raízes rubras aprisionam os antigos vigias da primeira ponte.\nDestrua a guarda profana para abrir passagem ao coração da dimensão.",
    "available": true
  },
  {
    "id": 2,
    "name": "Minas Acorrentadas",
    "boss": "O Carcereiro de Ferro",
    "lore": "As minas alimentam as fornalhas demoníacas com metal e prisioneiros.\nDerrube o carcereiro e rompa a corrente que sustenta sua conquista.",
    "available": true
  },
  {
    "id": 3,
    "name": "Deserto das Cinzas",
    "boss": "O Senhor das Dunas",
    "lore": "Um antigo templo guarda a estrada soterrada dos Eternos.\nVença seu senhor corrompido para alcançar a fortaleza além das areias.",
    "available": true
  },
  {
    "id": 4,
    "name": "Fortaleza de Ferro",
    "boss": "O Marechal Blindado",
    "lore": "Destas fornalhas saem as armas dos generais de Azhrael.\nVença o marechal para silenciar a marcha de ferro.",
    "available": true
  },
  {
    "id": 5,
    "name": "Abismo dos Ecos",
    "boss": "O Invocador do Vazio",
    "lore": "Vozes de reinos destruídos atravessam as pontes do abismo.\nInterrompa a invocação antes que outra fenda alcance o Refúgio.",
    "available": true
  },
  {
    "id": 6,
    "name": "Catacumbas do Silêncio",
    "boss": "O Arauto Mudo",
    "lore": "Chamas frias iluminam os túmulos dos primeiros defensores deste mundo.\nDerrote o arauto que os mantém presos ao pacto demoníaco.",
    "available": true
  },
  {
    "id": 7,
    "name": "Portões da Ruína",
    "boss": "O Último General",
    "lore": "O último exército de Azhrael bloqueia a ponte para sua cidadela.\nQuebre a defesa dos portões e avance sobre o domínio real.",
    "available": true
  },
  {
    "id": 8,
    "name": "Catedral Profanada",
    "boss": "O Guardião do Eclipse",
    "lore": "O altar sustenta o selo que protege o trono de Azhrael.\nDerrube seu guardião e desfaça a proteção do Rei Demônio.",
    "available": true
  },
  {
    "id": 9,
    "name": "Trono do Rei Demônio",
    "boss": "Azhrael, Rei da Ruína",
    "lore": "Todas as pontes conduzem à fenda aberta sob o trono de Azhrael.\nDerrote o Rei Demônio para impedir que a escuridão consuma os Eternos.",
    "available": true
  }
];
const stages=[
  {
    "id": 1,
    "region": 1,
    "name": "Floresta Corrompida",
    "boss": "A Raiz Profana",
    "lore": "Raízes rubras aprisionam os antigos vigias da primeira ponte.\nDestrua a guarda profana para abrir passagem ao coração da dimensão.",
    "type": "castle",
    "seconds": 180,
    "waves": 1,
    "count": 10,
    "hp": 180,
    "bossHp": 2400,
    "gold": 450,
    "firstGold": 900,
    "kind": "slime",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  },
  {
    "id": 2,
    "region": 2,
    "name": "Minas Acorrentadas",
    "boss": "O Carcereiro de Ferro",
    "lore": "As minas alimentam as fornalhas demoníacas com metal e prisioneiros.\nDerrube o carcereiro e rompa a corrente que sustenta sua conquista.",
    "type": "castle",
    "seconds": 195,
    "waves": 1,
    "count": 12,
    "hp": 290,
    "bossHp": 4600,
    "gold": 720,
    "firstGold": 1350,
    "kind": "slime",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  },
  {
    "id": 3,
    "region": 3,
    "name": "Deserto das Cinzas",
    "boss": "O Senhor das Dunas",
    "lore": "Um antigo templo guarda a estrada soterrada dos Eternos.\nVença seu senhor corrompido para alcançar a fortaleza além das areias.",
    "type": "castle",
    "seconds": 210,
    "waves": 1,
    "count": 14,
    "hp": 400,
    "bossHp": 6800,
    "gold": 990,
    "firstGold": 1800,
    "kind": "blueslime",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  },
  {
    "id": 4,
    "region": 4,
    "name": "Fortaleza de Ferro",
    "boss": "O Marechal Blindado",
    "lore": "Destas fornalhas saem as armas dos generais de Azhrael.\nVença o marechal para silenciar a marcha de ferro.",
    "type": "castle",
    "seconds": 225,
    "waves": 1,
    "count": 16,
    "hp": 510,
    "bossHp": 9000,
    "gold": 1260,
    "firstGold": 2250,
    "kind": "blueslime",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  },
  {
    "id": 5,
    "region": 5,
    "name": "Abismo dos Ecos",
    "boss": "O Invocador do Vazio",
    "lore": "Vozes de reinos destruídos atravessam as pontes do abismo.\nInterrompa a invocação antes que outra fenda alcance o Refúgio.",
    "type": "castle",
    "seconds": 240,
    "waves": 1,
    "count": 18,
    "hp": 620,
    "bossHp": 11200,
    "gold": 1530,
    "firstGold": 2700,
    "kind": "blueslime",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  },
  {
    "id": 6,
    "region": 6,
    "name": "Catacumbas do Silêncio",
    "boss": "O Arauto Mudo",
    "lore": "Chamas frias iluminam os túmulos dos primeiros defensores deste mundo.\nDerrote o arauto que os mantém presos ao pacto demoníaco.",
    "type": "castle",
    "seconds": 255,
    "waves": 1,
    "count": 20,
    "hp": 730,
    "bossHp": 13400,
    "gold": 1800,
    "firstGold": 3150,
    "kind": "orc",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  },
  {
    "id": 7,
    "region": 7,
    "name": "Portões da Ruína",
    "boss": "O Último General",
    "lore": "O último exército de Azhrael bloqueia a ponte para sua cidadela.\nQuebre a defesa dos portões e avance sobre o domínio real.",
    "type": "castle",
    "seconds": 270,
    "waves": 1,
    "count": 22,
    "hp": 840,
    "bossHp": 15600,
    "gold": 2070,
    "firstGold": 3600,
    "kind": "orc",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  },
  {
    "id": 8,
    "region": 8,
    "name": "Catedral Profanada",
    "boss": "O Guardião do Eclipse",
    "lore": "O altar sustenta o selo que protege o trono de Azhrael.\nDerrube seu guardião e desfaça a proteção do Rei Demônio.",
    "type": "castle",
    "seconds": 285,
    "waves": 1,
    "count": 24,
    "hp": 950,
    "bossHp": 17800,
    "gold": 2340,
    "firstGold": 4050,
    "kind": "orc",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  },
  {
    "id": 9,
    "region": 9,
    "name": "Trono do Rei Demônio",
    "boss": "Azhrael, Rei da Ruína",
    "lore": "Todas as pontes conduzem à fenda aberta sob o trono de Azhrael.\nDerrote o Rei Demônio para impedir que a escuridão consuma os Eternos.",
    "type": "castle",
    "seconds": 300,
    "waves": 1,
    "count": 26,
    "hp": 1060,
    "bossHp": 20000,
    "gold": 2610,
    "firstGold": 4500,
    "kind": "orc",
    "art": "campaign-arena.png",
    "rule": "Limpe o labirinto e derrote o guardião. Os inimigos derrotados não renascem."
  }
];
// Increasing health, guarded gold drops and boss damage reduction along the route.
for(const [i,s] of stages.entries()){
 s.bestiary=require('./campaign-bestiary.cjs').families[i];
 s.atb={hp:Math.round(110*Math.pow(1.42,i)),bossHp:Math.round(1800*Math.pow(1.40,i)),attack:Math.round(16*Math.pow(1.25,i)),defense:i*.025,enrageAt:Math.max(100,s.seconds-45)};
 if(i===6||i===7){s.atb.attack=Math.round(s.atb.attack*1.15);s.atb.bossHp=Math.round(s.atb.bossHp*1.1);}
 s.hp=Math.round(180*Math.pow(1.42,i)/10)*10;
 s.bossHp=Math.round(2400*Math.pow(1.48,i)/100)*100;
 s.bossDefense=i*.05;
 s.monsterGold=Math.round(10*Math.pow(1.4,i));
 s.bossGold=Math.round(200*Math.pow(1.45,i));
 s.gold=Math.round(450*Math.pow(1.4,i)/10)*10;
 s.firstGold=Math.round(900*Math.pow(1.4,i)/10)*10;
}
function stage(id){const s=stages.find(s=>s.id===id);if(!s)throw Error('Castelo indisponível.');return s;}
const FARM=[1,1.3,1.7,2.2,2.9,3.8,5,6.6,8.7,11.5];function farmMultiplier(cleared){const best=Math.max(0,...Object.keys(cleared??{}).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=9));return FARM[best];}module.exports={regions,stages,stage,farmMultiplier};
