const classes=['swordsman','spearman','archer','mage'];
const collections=[
 {name:'Comuns',color:'#b8c4d4',title:'Primeiros Passos',description:'+1% de Ouro dos mobs',bonus:{gold:.01}},
 {name:'Incomuns',color:'#81c979',title:'Passos Ligeiros',description:'+1% de velocidade de movimento',bonus:{move:.01}},
 {name:'Raros',color:'#66bcff',title:'Técnica de Combate',description:'+1% de dano',bonus:{damage:.01}},
 {name:'Épicos',color:'#ba83ef',title:'Segredos da Forja',description:'+2% de velocidade de reparo',bonus:{repair:.02}},
 {name:'Lendários',color:'#ffc463',title:'Precisão Lendária',description:'+1 ponto percentual de chance de crítico',bonus:{crit:.01}},
 {name:'Míticos',color:'#ff4d6d',title:'Legado Mítico',description:'+5% de dano · 5% menos consumo de energia',bonus:{damage:.05,energy:.05}}
];
function book(user){return user.codex??={version:1,discovered:{},registered:{},active:{}};}
function valid(skin,rarity){return classes.includes(skin)&&Number.isInteger(rarity)&&rarity>=0&&rarity<collections.length;}
function discover(user,heroes){const c=book(user);for(const h of heroes??[])if(valid(h.skin,h.rarity))c.discovered[`${h.rarity}:${h.skin}`]??=Date.now();return c;}
function register(user,skin,rarity){if(!valid(skin,rarity))throw Error('Página do Códice inválida.');const c=book(user),key=`${rarity}:${skin}`;if(!c.discovered[key])throw Error('Você ainda não descobriu esse herói.');c.registered[key]??=Date.now();}
function activate(user,rarity){if(!Number.isInteger(rarity)||rarity<0||rarity>=collections.length)throw Error('Coleção inválida.');const c=book(user);if(!classes.every(skin=>c.registered[`${rarity}:${skin}`]))throw Error('Registre as quatro classes para liberar este bônus.');c.active[rarity]??=Date.now();}
function bonuses(user){const c=book(user),out={gold:0,move:0,damage:0,repair:0,crit:0,energy:0};for(let i=0;i<collections.length;i++)if(c.active[i]&&classes.every(skin=>c.registered[`${i}:${skin}`]))for(const [key,n]of Object.entries(collections[i].bonus))out[key]=Math.round((out[key]+n)*1e6)/1e6;for(const [key,n]of Object.entries(require('./weapon-codex.cjs').bonuses(user)))out[key]=Math.round((out[key]+n)*1e6)/1e6;return out;}
function view(user){const c=book(user);return {classes,collections:collections.map((collection,rarity)=>({...collection,rarity,active:!!c.active[rarity],entries:classes.map(skin=>({skin,discovered:!!c.discovered[`${rarity}:${skin}`],registered:!!c.registered[`${rarity}:${skin}`]}))})),bonuses:bonuses(user)};}
function applyCombatRules(source){
 const patch=(from,to)=>{if(!source.includes(from))throw Error('Códice: regra de combate não encontrada: '+from);source=source.replace(from,to);};
 patch('function ln(e,t){',`var miniHeroCodexBonuses=typeof CODEX_BONUSES==='object'?CODEX_BONUSES:{gold:0,move:0,damage:0,repair:0,crit:0,energy:0};function miniHeroCodexStats(rarity){return {critChance:an(rarity)+(miniHeroCodexBonuses.crit??0),codexGold:1+(miniHeroCodexBonuses.gold??0),codexMove:1+(miniHeroCodexBonuses.move??0),codexDamage:1+(miniHeroCodexBonuses.damage??0),codexEnergy:1-(miniHeroCodexBonuses.energy??0)}}function ln(e,t){`);
 patch('maxDurability:rn(e.dur),slot:t}}','maxDurability:rn(e.dur),slot:t,...miniHeroCodexStats(e.rarity)}}');
 patch('let r=Kt*(fc(e,`swift`)?Gt:1)*t;', 'let r=Kt*(fc(e,`swift`)?Gt:1)*t*(e.state.codexMove??1);');
 patch('r.durability-zt)', 'r.durability-zt*(r.codexEnergy??1))');
 patch('strike(e,t,n,r,i,a){let o=', 'strike(e,t,n,r,i,a){n=Math.round(n*(e.state.codexDamage??1));let o=');
 patch('this.mhdgEarned+=t.mhdg,', 'this.mhdgEarned+=Math.round(t.mhdg*(e.state.codexGold??1)),');
 patch('mhdg:t.dead?t.mhdg:0,', 'mhdg:t.dead?Math.round(t.mhdg*(e.state.codexGold??1)):0,');
 patch('(e.skills.includes(`blacksmith`)?Dn:0))/60', '(e.skills.includes(`blacksmith`)?Dn:0))/60*(1+(miniHeroCodexBonuses.repair??0))');
 return source;
}
module.exports={classes,collections,book,discover,register,activate,bonuses,view,applyCombatRules};
