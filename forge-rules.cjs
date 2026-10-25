const forgeCollections=[
 {name:'Aprendizes da Forja',tiers:[1,2],repair:.01,slots:0,description:'+1% de velocidade de reparo'},
 {name:'Mestres do Metal',tiers:[3,4],repair:.02,slots:0,description:'+2% de velocidade de reparo'},
 {name:'Legado da Forja',tiers:[5,6],repair:.02,slots:1,description:'+2% de reparo e +1 vaga na forja'}
];
function mhForgeComplete(c,tiers){return tiers.every(tier=>[1,2,3].every(level=>c.stageRegistered?.[`${tier}:${level}`]));}
function mhForgeBook(player){
 const c=player.forgeCodex??={discovered:{},registered:{},active:{}};
 c.stageDiscovered??={};c.stageRegistered??={};
 for(const s of player.blacksmiths??[])if(Number.isInteger(s.tier)&&s.tier>=1&&s.tier<=6)c.discovered[s.tier]??=Date.now();
 for(let tier=1;tier<=6;tier++){
  if(c.discovered[tier])for(let level=1;level<=Math.max(1,mhForgeProgress(player,tier).level);level++)c.stageDiscovered[`${tier}:${level}`]??=c.discovered[tier];
  if(c.registered[tier])c.stageRegistered[`${tier}:1`]??=c.registered[tier];
 }
 for(let index=0;index<forgeCollections.length;index++)if(c.active[index]&&!mhForgeComplete(c,forgeCollections[index].tiers))delete c.active[index];
 return c;
}
function mhForgeProgress(player,tier){const all=player.forgeMastery??={};let p=all[tier];if(!p||!Number.isInteger(p.level)||p.level<0||p.level>3)p=all[tier]={level:0,xp:0};if(!Number.isFinite(p.xp)||p.xp<0)p.xp=0;return p;}
function mhForgeBonus(player){const c=mhForgeBook(player),out={repair:0,slots:0};for(let i=0;i<forgeCollections.length;i++)if(c.active[i]&&mhForgeComplete(c,forgeCollections[i].tiers)){out.repair+=forgeCollections[i].repair;out.slots+=forgeCollections[i].slots;}return out;}
function mhForgeStats(player,tier,heroRepair=0){const base=On[tier-1],p=mhForgeProgress(player??{},tier),bonus=mhForgeBonus(player??{});return {...base,rate:Math.round(base.rate*(1+p.level*.05+bonus.repair+heroRepair)*10000)/10000,slots:base.slots+Number(p.level===3)+bonus.slots};}
function mhForgeFleet(player){if(!player?.blacksmiths?.some(s=>s.id===player.blacksmithInService))return [];const stats={};return player.blacksmiths.map(s=>({...s,...(stats[s.tier]??=mhForgeStats(player,s.tier,miniHeroCodexBonuses.repair??0))})).sort((a,b)=>b.rate-a.rate||a.id-b.id);}
function mhForgeHeroPriority(hero){return (hero.atk??0)*2+(hero.atkSpd??0)+(hero.dur??0)+(hero.rarity??0)*30;}
function mhForgeAssignments(player){const queue=Nn(player.heroes).sort((a,b)=>mhForgeHeroPriority(b)-mhForgeHeroPriority(a)||a.id-b.id),assigned=new Map();let cursor=0;for(const forge of mhForgeFleet(player))for(let slot=0;slot<forge.slots&&cursor<queue.length;slot++,cursor++)assigned.set(queue[cursor].id,forge);return assigned;}
function mhForgeRates(player){const assigned=mhForgeAssignments(player);return new Map(player.heroes.filter(jn).map(h=>{const forge=assigned.get(h.id),skill=h.skills.includes('blacksmith')?mhSkillValue(h,'blacksmith'):0,rate=forge?forge.rate+skill:(En+skill)*(1+(miniHeroCodexBonuses.repair??0));return [h.id,rate/60];}));}
function mhForgeAutoManage(player,at){
 Fn(player,at);if(!Bn(player))return [];
 const resumed=[],workers=player.heroes.filter(h=>h.status==='working');
 const start=h=>{h.status='working';h.forgeSince=null;workers.push(h);resumed.push(h);};
 const ready=player.heroes.filter(h=>h.status==='resting'&&h.durability>=Un(h)).sort(Wn);
 for(const hero of ready){
  if(Rn(player)>0){start(hero);continue;}
  const weakest=workers.length?Kn(workers):null;if(!weakest||!Gn(hero,weakest))break;
  workers.splice(workers.indexOf(weakest),1);weakest.status='resting';weakest.restingSince=at;weakest.forgeSince=null;start(hero);
 }
 const queue=player.heroes.filter(h=>h.status==='resting'&&h.durability<rn(h.dur)-Hn).sort((a,b)=>mhForgeHeroPriority(b)-mhForgeHeroPriority(a)||a.id-b.id);
 const selected=new Set(queue.slice(0,Mn(player)).map(h=>h.id));
 for(const hero of player.heroes){if(selected.has(hero.id))hero.forgeSince??=at;else hero.forgeSince=null;}
 return resumed;
}
function mhForgeAdvanceXp(player,at){
 const previous=Number.isFinite(player.forgeXpAt)?player.forgeXpAt:at,seconds=Math.max(0,(at-previous)/1000),fleet=mhForgeFleet(player);
 if(fleet.length&&seconds>0){
  const bonus=new Map(),rates=mhForgeRates(player),multipliers=[1,1.5,2,3,4,6];
  for(const [id,forge] of mhForgeAssignments(player)){
   const hero=player.heroes.find(h=>h.id===id),repairRate=rates.get(id)??0;
   if(!hero||repairRate<=0)continue;
   const repairingSeconds=Math.min(seconds,Math.max(0,(rn(hero.dur)-hero.durability)/repairRate));
   const xp=forge.rate/60*repairingSeconds*(multipliers[hero.rarity]??1);
   bonus.set(forge.tier,(bonus.get(forge.tier)??0)+xp);
  }
  for(const tier of new Set(fleet.map(f=>f.tier))){const p=mhForgeProgress(player,tier);if(p.level>=3)continue;const rate=fleet.filter(f=>f.tier===tier).reduce((sum,f)=>sum+f.slots*f.rate/60,0);p.xp=Math.min(mhForgeRequirement(tier,p.level).xp,p.xp+rate*seconds+(bonus.get(tier)??0));}
 }
 player.forgeXpAt=Math.max(previous,at);
}
function mhForgeRequirement(tier,level){const base=On[tier-1];return {xp:base.slots*base.rate*60*8*(level+1),coins:Math.ceil(base.price/1e6*[.05,.10,.20][level])};}
function mhForgeUpgrade(player,tier,expectedLevel,balance){
 if(!Number.isInteger(tier)||tier<1||tier>6||!player.blacksmiths.some(s=>s.tier===tier))throw Error('Você precisa possuir este ferreiro.');
 const p=mhForgeProgress(player,tier);if(p.level===3)throw Error('Maestria máxima alcançada.');if(p.level!==expectedLevel)throw Error('A maestria mudou. Atualize antes de aprimorar.');
 const cost=mhForgeRequirement(tier,p.level);if(p.xp+1e-6<cost.xp)throw Error('Mantenha as forjas em serviço para ganhar mais XP.');if(balance<cost.coins*1e6)throw Error('Ouro insuficiente.');
 p.xp=Math.max(0,p.xp-cost.xp);p.level++;return {tier,level:p.level,coins:cost.coins};
}
function mhForgeRegister(player,tier,level=1){if(!Number.isInteger(tier)||tier<1||tier>6||!Number.isInteger(level)||level<1||level>3)throw Error('Forja ou nível inválido.');const c=mhForgeBook(player),key=`${tier}:${level}`;if(!c.stageDiscovered[key])throw Error('Você ainda não alcançou esta evolução da forja.');c.stageRegistered[key]??=Date.now();if(level===1)c.registered[tier]??=Date.now();}
function mhForgeActivate(player,index){if(!Number.isInteger(index)||!forgeCollections[index])throw Error('Coleção inválida.');const c=mhForgeBook(player);if(!mhForgeComplete(c,forgeCollections[index].tiers))throw Error('Registre as duas forjas nos níveis 1, 2 e 3 para ativar o bônus.');c.active[index]??=Date.now();}
function mhForgeView(player,heroRepair=0){const c=mhForgeBook(player);return {entries:On.map((base,i)=>{const tier=i+1,p=mhForgeProgress(player,tier);return {tier,name:base.name,owned:player.blacksmiths.filter(s=>s.tier===tier).length,discovered:!!c.discovered[tier],registered:!!c.registered[tier],level:p.level,xp:p.xp,next:p.level<3?mhForgeRequirement(tier,p.level):null,...mhForgeStats(player,tier,heroRepair)};}),stages:On.flatMap((base,i)=>[1,2,3].map(level=>({tier:i+1,level,name:base.name,discovered:!!c.stageDiscovered[`${i+1}:${level}`],registered:!!c.stageRegistered[`${i+1}:${level}`]}))),collections:forgeCollections.map((group,index)=>({...group,index,active:!!c.active[index],ready:mhForgeComplete(c,group.tiers)})),bonuses:mhForgeBonus(player)};}
function mhForgeRepair(player,at){
 mhForgeAdvanceXp(player,at);const seconds=Math.max(0,(at-player.repairedAt)/1000);
 if(seconds>0)for(const [id,rate]of Pn(player)){const h=player.heroes.find(h=>h.id===id),max=rn(h.dur);h.durability=Math.min(max,h.durability+rate*seconds);if(max-h.durability<1e-6)h.durability=max;}
 player.repairedAt=Math.max(player.repairedAt,at);
}
const functions=[mhForgeComplete,mhForgeBook,mhForgeProgress,mhForgeBonus,mhForgeStats,mhForgeFleet,mhForgeHeroPriority,mhForgeAssignments,mhForgeRates,mhForgeAutoManage,mhForgeAdvanceXp,mhForgeRequirement,mhForgeUpgrade,mhForgeRegister,mhForgeActivate,mhForgeView,mhForgeRepair];
function applyForgeRules(source){
 const patch=(from,to)=>{if(!source.includes(from))throw Error('Forja: trecho não encontrado: '+from.slice(0,80));source=source.replace(from,to);};
 patch('function An(e){',`var forgeCollections=${JSON.stringify(forgeCollections)};var forgeNames=['Forja Aprendiz','Forja do Ferro','Forja dos Anões','Forja Rúnica','Forja do Vulcão','Forja do Dragão'];On.forEach((entry,i)=>entry.name=forgeNames[i]);${functions.map(f=>f.toString()).join('\n')}\nfunction An(e){`);
 patch('return t?On[t.tier-1]:void 0','return t?{...mhForgeStats(e,t.tier,miniHeroCodexBonuses.repair??0),slots:mhForgeFleet(e).reduce((sum,f)=>sum+f.slots,0)}:void 0');
 const ratesStart=source.indexOf('function Pn(e){'),ratesEnd=source.indexOf('function Fn(',ratesStart);if(ratesStart<0||ratesEnd<0)throw Error('Taxas de reparo não encontradas.');source=source.slice(0,ratesStart)+'function Pn(e){return mhForgeRates(e)}'+source.slice(ratesEnd);
 const a=source.indexOf('function Fn(e,t){'),b=source.indexOf('var In=',a);if(a<0||b<0)throw Error('Reparo não encontrado.');source=source.slice(0,a)+'function Fn(e,t){mhForgeRepair(e,t)}'+source.slice(b);
 patch('return(e.forgeSince===null?t:t*Vn)-Hn','return t*Vn-Hn');
 const autoStart=source.indexOf('function qn(e,t){'),autoEnd=source.indexOf('var Jn=',autoStart);if(autoStart<0||autoEnd<0)throw Error('Automação da Lúmina não encontrada.');source=source.slice(0,autoStart)+'function qn(e,t){return mhForgeAutoManage(e,t)}'+source.slice(autoEnd);
 const hintStart=source.indexOf('var Ss='),hintEnd=source.indexOf(',Cs=',hintStart);if(hintStart<0||hintEnd<0)throw Error('Descrição da Lúmina não encontrada.');source=source.slice(0,hintStart)+'var Ss=`A Lúmina devolve os heróis ao combate com 80% da energia, dentro ou fora das forjas. Com os 15 lugares ocupados, um herói mais forte substitui o mais fraco em combate. As vagas de reparo são reorganizadas automaticamente: os heróis mais fortes em descanso recebem as forjas mais rápidas. Heróis esperando uma vaga no combate podem continuar reparando acima de 80%.`'+source.slice(hintEnd);
 return source;
}
module.exports={applyForgeRules,forgeCollections};
