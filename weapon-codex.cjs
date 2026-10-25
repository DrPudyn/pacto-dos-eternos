const gear=require('./equipment-rules.cjs');
const sets=[
 {name:'Comuns',title:'Arsenal do Recruta',description:'+0,5% de Ouro dos mobs',bonus:{gold:.005}},
 {name:'Incomuns',title:'Ferramentas de Campanha',description:'+0,5% de velocidade de reparo',bonus:{repair:.005}},
 {name:'Raras',title:'Arsenal do Guardião',description:'+0,5% de dano',bonus:{damage:.005}},
 {name:'Épicas',title:'Relíquias Rúnicas',description:'0,5% menos consumo de energia',bonus:{energy:.005}},
 {name:'Lendárias',title:'Arsenal dos Eternos',description:'+0,25 ponto percentual de chance de crítico',bonus:{crit:.0025}},
 {name:'Míticas',title:'Armas do Primeiro Pacto',description:'+1% de dano',bonus:{damage:.01}}
];
function book(user){return user.weaponCodex??={version:1,discovered:{},registered:{},active:{}};}
function valid(skin,rarity){return gear.CLASSES.includes(skin)&&Number.isInteger(rarity)&&rarity>=0&&rarity<6;}
function discover(user,weapons){const b=book(user);for(const w of weapons??[])if(valid(w.skin,w.rarity))b.discovered[w.rarity+':'+w.skin]??=Date.now();}
function register(user,skin,rarity){if(!valid(skin,rarity))throw Error('Arma do Códice inválida.');const b=book(user),key=rarity+':'+skin;if(!b.discovered[key])throw Error('Você ainda não descobriu essa arma.');b.registered[key]??=Date.now();}
function ready(b,rarity){return gear.CLASSES.every(skin=>b.registered[rarity+':'+skin]);}
function activate(user,rarity){if(!Number.isInteger(rarity)||rarity<0||rarity>=6)throw Error('Coleção de armas inválida.');const b=book(user);if(!ready(b,rarity))throw Error('Registre as quatro armas desta raridade para liberar o bônus.');b.active[rarity]??=Date.now();}
function bonuses(user){const b=book(user),out={};for(let i=0;i<6;i++)if(b.active[i]&&ready(b,i))for(const [key,value]of Object.entries(sets[i].bonus))out[key]=Math.round(((out[key]??0)+value)*1e6)/1e6;return out;}
function view(user){const b=book(user);return {collections:sets.map((s,rarity)=>({...s,rarity,active:!!b.active[rarity]&&ready(b,rarity),entries:gear.CLASSES.map(skin=>({skin,rarity,name:gear.TITLES[skin][rarity],discovered:!!b.discovered[rarity+':'+skin],registered:!!b.registered[rarity+':'+skin]}))})),bonuses:bonuses(user)};}
module.exports={sets,book,discover,register,activate,bonuses,view};
