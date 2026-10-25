const crypto=require('crypto'),config=require('./campaign-config.cjs'),{createCampaignBattle,createCampaignATBBattle}=require('./shared-engine.cjs'),codex=require('./codex-rules.cjs');
function campaignService({actor,onBoss,now=Date.now}){
 const live=new Map();
 const book=u=>{let p=u.campaign;if(p?.version!==2){if(p)u.campaignLegacyV1??=structuredClone(p);if(p?.run?.status==='active'){const e=actor(u);for(const h of e.player.heroes)if(p.run.heroIds.includes(h.id)){h.status='resting';delete h.campaignRunId;}}p=u.campaign={version:2,cleared:{},run:null};}return p;};
 function battle(u){const r=book(u).run;let b=live.get(u.id);if(!b||b.id!==r.id||b.wave!==r.wave){b={id:r.id,wave:r.wave,value:(r.mode==='atb'?createCampaignATBBattle:createCampaignBattle)(r.team,{...config.stage(r.stage),strategy:r.strategy,hp:Math.round(config.stage(r.stage).hp*(config.stage(r.stage).type==='general'&&r.wave===2?1.35:1))},r.seed+r.wave,r.battle,r.bonuses)};live.set(u.id,b);}if(r.mode==='atb'){b.value.priority=r.priority??null;}else{b.value.tactics.priority=(r.priorityUntil??0)>b.value.elapsed?r.priority:null;b.value.tactics.priorityUntil=r.priorityUntil??0;}return b.value;}
 function sync(u,b){const r=book(u).run,e=actor(u),dur=b.durabilities();for(const a of b.heroes){const h=e.player.heroes.find(h=>h.id===a.state.heroId);if(!h)continue;h.durability=Math.max(0,dur.get(h.id)??h.durability);const earned=a.state.skillXpEarnedTicks??0,old=r.xp[h.id]??0;if(earned>old)e.awardSkillXp([{heroId:h.id,ticks:earned-old}]);r.xp[h.id]=earned;}r.team=r.team.map(h=>({...h,durability:dur.get(h.id)??h.durability}));r.battle=b.toState();}
 function finish(u,won,reason){const p=book(u),r=p.run;if(r.status!=='active')return;const e=actor(u),s=config.stage(r.stage);r.status=won?'won':'lost';r.reason=reason;r.finishedAt=now();r.reward={gold:0,seals:0,chests:0,first:false};
  if(won){const old=p.cleared[s.id],first=!old,killGold=Math.round(battle(u).mhdg/1e6),gold=s.gold+(first?s.firstGold:0)+killGold;r.reward={gold,killGold,seals:3,chests:3,first};e.balance+=gold*1e6;e.player.mintCards+=3;e.player.weaponSummons=(e.player.weaponSummons??0)+3;p.cleared[s.id]={ticks:Math.min(r.ticks,old?.ticks??Infinity)};e.player.campaignFarmMultiplier=config.farmMultiplier(p.cleared);r.reward.farmMultiplier=e.player.campaignFarmMultiplier;onBoss?.(u,{stream:'campaign:'+r.id,sequence:1,at:now(),kind:s.kind,boss:true,artificial:false});}
  for(const h of e.player.heroes)if(r.heroIds.includes(h.id)){h.status='resting';h.restingSince=now();h.forgeSince=null;delete h.campaignRunId;}e.player.repairedAt=now();r.priority=null;
 }
 function tick(u,at=now()){
  const r=book(u).run;if(r?.status!=='active')return;const elapsed=at-r.lastAt;r.lastAt=at;if(elapsed<0)return;
  // A long server interruption never grants unattended victories or rewards.
  if(elapsed>30000){finish(u,false,'A tentativa foi encerrada após uma interrupção longa do servidor. Nenhum prêmio foi concedido.');return;}
  r.remainder=(r.remainder??0)+elapsed*30/1000;let frames=Math.min(900,Math.floor(r.remainder));r.remainder-=frames;const s=config.stage(r.stage);let b=battle(u);
  for(let i=0;i<frames;i++){
   b.advanceTo(b.tick+1);r.ticks++;if(r.mode==='atb')for(const mob of b.units)if(mob.side==='enemy'&&mob.hp<=0)require('./creature-codex.cjs').discover(u,s.id,mob.variant);
   if(r.mode==='atb'){r.bossSpawned=b.bossSpawned;if(b.result){sync(u,b);finish(u,b.result==='won',b.result==='won'?'O castelo foi libertado.':'Seu grupo caiu. Prepare a equipe e tente novamente.');break;}}
   if(r.ticks>=s.seconds*30){sync(u,b);finish(u,false,'O tempo acabou. Refaça a dungeon para conquistar este castelo.');break;}
   if(r.mode!=='atb'&&!b.monsters.some(m=>!m.dead)){sync(u,b);if(r.bossSpawned){finish(u,true,'O castelo foi libertado.');break;}r.bossSpawned=true;b.placeBoss(s.bossHp);const boss=b.monsters.find(m=>m.boss&&!m.dead);if(!boss)throw Error('Não foi possível posicionar o guardião.');boss.maxHp=boss.hp;boss.mhdg=s.bossGold*1e6;sync(u,b);}
   if(r.mode!=='atb'&&!b.heroes.some(h=>h.state.departedAt===null&&(h.state.durability>=.5||h.state.action==='attack'))){sync(u,b);finish(u,false,'O time ficou sem energia. Seus heróis retornaram para reparo.');break;}
  }
  if(r.status==='active')sync(u,b);
 }
 function start(u,{stageId,heroIds,requestId,strategy='aggressive'}){
  const p=book(u);if(!['aggressive','cautious','hunter'].includes(strategy))throw Error('Estratégia inválida.');if(typeof requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(requestId))throw Error('Identificador de tentativa inválido.');
  if(p.run?.requestId===requestId||(p.requests??[]).includes(requestId))return view(u);if(p.run?.status==='active')throw Error('Uma expedição já está em andamento.');
  if(u.tower?.status==='active')throw Error('Encerre a expedição da Torre antes de iniciar a campanha.');
  const s=config.stage(stageId);if(p.cleared[s.id])throw Error('Este castelo já foi conquistado. Avance para o próximo.');if(s.id>1&&!p.cleared[s.id-1])throw Error('Conclua a fase anterior primeiro.');
  if(!Array.isArray(heroIds)||heroIds.length<1||heroIds.length>4||new Set(heroIds).size!==heroIds.length||heroIds.some(id=>!Number.isSafeInteger(id)))throw Error('Escolha de 1 a 4 heróis diferentes.');
  const e=actor(u),team=heroIds.map(id=>e.player.heroes.find(h=>h.id===id));if(team.some(h=>!h||h.durability<.5))throw Error('Todos os heróis precisam pertencer ao perfil e ter energia.');
  // Retire from the old idle dungeon before reserving the actual collection.
  for(const h of team){h.status='campaign';h.forgeSince=null;h.campaignRunId=requestId;}
  e.live.battle.heroes=e.live.battle.heroes.filter(a=>!heroIds.includes(a.state.heroId));
  p.requests=[...(p.requests??[]),requestId].slice(-128);p.run={id:crypto.randomUUID(),requestId,status:'active',mode:'atb',stage:s.id,strategy,bossSpawned:false,heroIds:[...heroIds],team:structuredClone(team),seed:crypto.randomInt(1,1e8),wave:1,ticks:0,lastAt:now(),startedAt:now(),remainder:0,battle:null,priority:null,xp:{},bonuses:structuredClone(codex.bonuses(u))};live.delete(u.id);sync(u,battle(u));return view(u);
 }
 function target(u,{runId,monsterId}){tick(u);const r=book(u).run;if(r?.id!==runId||r.status!=='active')throw Error('Tentativa indisponível.');const b=battle(u);if(monsterId!==null&&!b.monsters.some(m=>m.id===monsterId&&!m.dead))throw Error('Alvo indisponível.');r.priority=monsterId;r.priorityUntil=b.elapsed+8;if(r.mode==='atb'){b.priority=monsterId;return view(u);}b.tactics.priority=monsterId;b.tactics.priorityUntil=r.priorityUntil;for(const h of b.heroes)if(h.state.action!=='attack')b.requestReplan(h);return view(u);}
 function ability(u,{runId,heroId,skill,targetId,auto}){tick(u);const r=book(u).run;if(r?.id!==runId||r.status!=='active'||r.mode!=='atb')throw Error('Batalha indisponível.');const b=battle(u);if(typeof auto==='boolean')b.auto=auto;else b.command(heroId,skill,targetId);sync(u,b);return view(u);}
 function abandon(u,{runId}){const r=book(u).run;if(!r||r.id!==runId)throw Error('Tentativa indisponível.');tick(u);finish(u,false,'Expedição encerrada. A energia utilizada foi preservada.');return view(u);}
 function view(u){const p=book(u),r=p.run,s=r?config.stage(r.stage):null;return {farmMultiplier:config.farmMultiplier(p.cleared),regions:config.regions.map(r=>({...r,available:!p.cleared[r.id]&&(r.id===1||!!p.cleared[r.id-1])})),stages:config.stages,cleared:p.cleared,unlockedRegion:Math.min(config.stages.length,Object.keys(p.cleared).length+1),run:r?{id:r.id,mode:r.mode??'legacy',status:r.status,stage:r.stage,strategy:r.strategy??'aggressive',wave:r.wave,ticks:r.ticks,seconds:r.ticks/30,remainingSeconds:Math.max(0,s.seconds-r.ticks/30),timeLimit:s.seconds,priority:r.priority,state:battle(u).toState(),bossSpawned:!!r.bossSpawned,snapshot:battle(u).snapshot(),team:r.team,reason:r.reason??null,reward:r.reward??null,armored:r.mode!=='atb'&&s.type==='general'&&battle(u).monsters.some(m=>!m.dead&&m.hp<m.maxHp*.5)&&battle(u).elapsed%12<5}:null};}
 return {start,tick,target,ability,abandon,view,active:u=>book(u).run?.status==='active',reset:()=>live.clear()};
}
module.exports={campaignService};
