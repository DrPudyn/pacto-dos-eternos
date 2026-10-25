const crypto=require('crypto');
const {createTowerBattle}=require('./shared-engine.cjs');
const codex=require('./codex-rules.cjs');
function towerService(options={}){
 const live=new Map();
 function normalize(user){if(user.tower&&user.tower.version!=='dungeon-v1'){user.towerLegacy=user.tower;user.tower=null;}if(user.towerBest&&user.towerBest.version!=='dungeon-v1'){user.towerBestLegacy=user.towerBest;user.towerBest=null;}}
 function restore(user){const run=user.tower;if(!run)return null;let entry=live.get(user.id);if(!entry||entry.id!==run.id||entry.floor!==run.floor){entry={id:run.id,floor:run.floor,...createTowerBattle(run.team,run.floor,run.seed+run.floor,run.battle,run.codexBonuses??{})};if(options.onCombat){const battle=entry.battle,strike=battle.strike.bind(battle);battle.strike=(hero,monster,...args)=>{const dead=monster.dead,out=strike(hero,monster,...args);if(!dead&&monster.dead)options.onCombat(user,{stream:'tower:'+run.id+':'+entry.floor,sequence:battle.eventId,at:entry.frameAt??Date.now(),kind:monster.kind,boss:!!monster.boss,artificial:!!monster.festivalExcluded});return out;};}live.set(user.id,entry);}return entry;}
 function record(user){const r=user.tower,best=user.towerBest??{floor:0,bosses:0,kills:0};if(r.completed>best.floor||r.completed===best.floor&&(r.bosses>best.bosses||r.bosses===best.bosses&&r.kills>best.kills))user.towerBest={version:'dungeon-v1',floor:r.completed,bosses:r.bosses,kills:r.kills,seconds:Math.floor(r.ticks/30),at:Date.now()};}
 function finish(user,reason){const r=user.tower;r.status='finished';r.reason=reason;r.finishedAt=Date.now();record(user);}
 function saveBattle(user,battle){user.tower.battle=battle.toState();}
 function start(user,heroes,ids){
  normalize(user);
  if(user.tower?.status==='active')throw Error('Você já tem uma tentativa em andamento.');
  if(!Array.isArray(ids)||ids.length!==15||new Set(ids).size!==15||ids.some(id=>!Number.isSafeInteger(id)))throw Error('Escolha exatamente 15 heróis diferentes.');
  const team=ids.map(id=>heroes.find(h=>h.id===id));if(team.some(h=>!h||h.durability<.5))throw Error('Todos os heróis devem pertencer ao seu perfil e ter energia.');
  user.tower={version:'dungeon-v1',id:crypto.randomUUID(),status:'active',floor:1,completed:0,kills:0,bosses:0,ticks:0,seed:crypto.randomInt(1,1e8),startedAt:Date.now(),lastAt:Date.now(),team:structuredClone(team).map(h=>({...h,status:'working',forgeSince:null})),battle:null,transitionUntil:0};
  user.tower.codexBonuses=structuredClone(codex.bonuses(user));
  live.delete(user.id);saveBattle(user,restore(user).battle);return view(user);
 }
 function tick(user,now=Date.now()){
  normalize(user);const r=user.tower;if(!r||r.status!=='active')return;
  if(r.paused){r.paused=false;r.lastAt=now;return;}
  const entry=restore(user);
  if(r.transitionUntil){r.lastAt=now;if(now<r.transitionUntil)return;r.floor++;r.transitionUntil=0;r.battle=null;live.delete(user.id);saveBattle(user,restore(user).battle);return;}
  const elapsed=now-r.lastAt;r.lastAt=now;if(elapsed>30000)return;
  const frames=Math.max(0,Math.min(90,Math.floor(elapsed*30/1000)));const b=entry.battle;
  const xpBefore=new Map(b.heroes.map(h=>[h.state.heroId,h.state.skillXpEarnedTicks??0]));
  for(let i=0;i<frames;i++){
   entry.frameAt=Math.floor(now-(frames-i-1)*1000/30);
   const before=b.kills,bosses=b.bossesKilled;b.advanceTo(b.tick+1);r.ticks++;r.kills+=b.kills-before;r.bosses+=b.bossesKilled-bosses;
   const remaining=b.heroes.filter(h=>h.state.departedAt===null&&h.state.durability>=.5);
   if(!b.monsters.some(m=>!m.dead)){
    r.completed=r.floor;record(user);options.onFloor?.(user,{runId:r.id,floor:r.floor,at:entry.frameAt});const energies=b.durabilities();r.team=r.team.map(h=>({...h,durability:energies.get(h.id)??0}));
    if(!remaining.length){finish(user,'O último herói ficou sem energia.');break;}
    r.transitionUntil=now+1800;break;
   }
   if(!remaining.length&&!b.heroes.some(h=>h.state.departedAt===null&&h.state.action==='attack')){finish(user,'Todos os heróis ficaram sem energia.');break;}
  }
  const xpAfter=new Map(b.heroes.map(h=>[h.state.heroId,h.state.skillXpEarnedTicks??0]));for(const departure of b.drainDepartures())xpAfter.set(departure.heroId,departure.skillXpEarnedTicks??0);
  const gains=[...xpAfter].map(([heroId,ticks])=>({heroId,ticks:ticks-(xpBefore.get(heroId)??0)})).filter(h=>h.ticks>0);
  if(gains.length)options.onExperience?.(user,gains);
  saveBattle(user,b);
 }
 function view(user){normalize(user);const r=user.tower;if(!r)return {run:null,best:user.towerBest??null};const {battle,map}=restore(user);return {best:user.towerBest??null,run:{id:r.id,status:r.status,floor:r.floor,completed:r.completed,kills:r.kills,bosses:r.bosses,seconds:Math.floor(r.ticks/30),transition:!!r.transitionUntil,reason:r.reason??null,map,team:r.team.map(h=>({id:h.id,skin:h.skin,rarity:h.rarity,maxDurability:h.dur*5,durability:battle.durabilities().get(h.id)??0})),state:battle.toState(),snapshot:battle.snapshot()}};}
 function abandon(user){normalize(user);if(user.tower?.status==='active'){tick(user);finish(user,'Tentativa encerrada pelo jogador.');}return view(user);}
 // Older browser tabs still send this when leaving the screen. Keep it harmless.
 function pause(user){normalize(user);if(user.tower?.status==='active')tick(user);return {ok:true};}
 return {start,tick,view,abandon,pause,reset:()=>live.clear()};
}
module.exports={towerService};
