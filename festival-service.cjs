const crypto=require('crypto');
const ZONE='America/Sao_Paulo';
const DEFAULTS={power:[1,3,10,35,120,400],fusion:[1,3,10,35,120,400],hunt:{boss:1}};
const WEEK=['power','fusion','hunter'],MONTH=['tower'];
const LABELS={power:'Power da Conta',fusion:'Mestre das Fusões',hunter:'Caçador de Bosses',champion:'Grande Campeão do Mês',tower:'Torre do Infinito'};
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function localParts(at){return Object.fromEntries(formatter.formatToParts(new Date(at)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
function midnight(y,m,d){const target=Date.UTC(y,m-1,d);let at=target;for(let i=0;i<3;i++){const p=localParts(at);at+=target-Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);}return at;}
function period(kind,at){const p=localParts(at),day=new Date(Date.UTC(p.year,p.month-1,p.day));if(kind==='week')day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);else day.setUTCDate(1);const y=day.getUTCFullYear(),m=day.getUTCMonth()+1,d=day.getUTCDate(),start=midnight(y,m,d),end=kind==='week'?midnight(y,m,d+7):midnight(y,m+1,1);return {id:(kind==='week'?'W:':'M:')+new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10),kind,start,end};}
function dayKey(at){const p=localParts(at);return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;}
function splitEven(value,count,offset=0){const n=Math.floor(value/count),out=Array(count).fill(n);for(let i=0;i<value%count;i++)out[(offset+i)%count]++;return out;}
function placementPoints(rank){return rank===1?100:rank===2?70:rank===3?50:rank<=10?30:rank<=25?15:rank<=50?5:0;}
const AVATAR_DEFAULT={body:'masculino',skin:'#d5a078',hair:'#493126',style:'curto',primary:'#7252aa',secondary:'#e1b64f',weapon:'espada'};
function avatarConfig(input){const keys=Object.keys(AVATAR_DEFAULT);if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))throw Error('Configuração de avatar inválida.');const v={...AVATAR_DEFAULT,...input};if(!['masculino','feminino'].includes(v.body)||!['curto','longo','moicano','careca'].includes(v.style)||!['espada','machado','cajado','arco','lança'].includes(v.weapon)||!['skin','hair','primary','secondary'].every(k=>/^#[0-9a-f]{6}$/i.test(v[k])))throw Error('Escolha opções válidas para o avatar.');return v;}
function festivalService(db,options={}){
 const now=options.now??Date.now,getPower=options.power??(u=>(u.state?.player?.heroes??[]).reduce((n,h)=>n+DEFAULTS.power[h.rarity],0)),balance=options.balance??(u=>u.state.balance),credit=options.credit??((u,coins)=>{u.state.balance+=coins*1e6;});
 const fresh=!db.festival;
 const f=db.festival??={version:1,startedAt:now(),seasons:{},contributions:{},ledger:[],combatCursors:{},towerEvents:{},totalContributed:0,totalDistributed:0,totalBurned:0,consumedFees:0,allocationSequence:0};
 if((f.version??1)<2){
  f.bossHuntStartedAt=now();
  for(const s of Object.values(f.seasons))if(s.status==='open'){
   if(s.kind==='month'){s.pools.tower=(s.pools.tower??0)+(s.pools.champion??0);delete s.pools.champion;}
   else for(const e of Object.values(s.entries)){e.hunter=0;e.days={};delete e.at.hunter;}
  }
  f.version=2;
 }
 f.bossHuntStartedAt??=f.startedAt;
 const config={...DEFAULTS,...f.config,hunt:{boss:1}};delete config.dailyLimit;f.config=config;
 function season(kind,at){const p=period(kind,at);return f.seasons[p.id]??={...p,status:'open',pools:Object.fromEntries((kind==='week'?WEEK:MONTH).map(k=>[k,0])),entries:{},results:null};}
 function entry(s,u,at){return s.entries[u.id]??={joinedAt:at,powerBase:getPower(u),power:0,fusion:0,hunter:0,champion:0,tower:0,firsts:0,seconds:0,at:{},days:{},fusionIds:{}};}
 function join(u,at=now()){entry(season('week',at),u,at);entry(season('month',at),u,at);}
 function updatePower(u,at=now(),reset=false){const s=season('week',at);if(s.status!=='open')return;const e=entry(s,u,at);if(reset)e.powerBase=getPower(u);const score=Math.max(0,getPower(u)-e.powerBase);if(score!==e.power){e.power=score;e.at.power=at;}}
 function rows(s,category){return Object.entries(s.entries).map(([id,e])=>{const user=db.users.find(u=>u.id===id);return {userId:id,name:user?.name??'',score:e[category]??0,at:e.at[category]??e.joinedAt,firsts:e.firsts,seconds:e.seconds,avatar:avatarConfig(user?.rankingAvatar??{}),eligible:!!user&&!user.festivalDisqualified};}).filter(r=>r.eligible&&r.score>0).sort((a,b)=>b.score-a.score||(category==='champion'?(b.firsts-a.firsts||b.seconds-a.seconds):0)||a.at-b.at||a.userId.localeCompare(b.userId)).map((r,i)=>({...r,position:i+1}));}
 function contribute(u,id,spent,source,at=now()){
  if(f.contributions[id])return false;if(!['skill','forge','fusion','equipment-box','equipment-upgrade','summon','porter'].includes(source)||!Number.isSafeInteger(spent)||spent<0)throw Error('Contribuição inválida.');
  join(u,at);const amount=Math.floor(spent/5),weekly=Math.floor(amount*7/10),monthly=amount-weekly,sequence=f.allocationSequence++,w=season('week',at),m=season('month',at);
  if(w.status!=='open'||m.status!=='open')throw Error('Temporada encerrada para esta contribuição.');
  const ws=splitEven(weekly,3,sequence%3),ms=splitEven(monthly,MONTH.length,sequence%MONTH.length);WEEK.forEach((k,i)=>w.pools[k]+=ws[i]);MONTH.forEach((k,i)=>m.pools[k]+=ms[i]);
  f.contributions[id]={id,userId:u.id,source,spent,amount,weekly,monthly,burned:spent-amount,at,week:w.id,month:m.id};f.totalContributed+=amount;f.consumedFees+=spent-amount;return true;
 }
 function fusion(u,id,heroes,at=now()){const s=season('week',at),e=entry(s,u,at);if(s.status!=='open'||e.fusionIds[id])return false;e.fusionIds[id]=at;const points=heroes.reduce((n,h)=>n+(config.fusion[h.rarity]??0),0);if(points>0){e.fusion+=points;e.at.fusion=at;}return true;}
 function combat(u,event){
  if(!event.boss||event.at<f.bossHuntStartedAt||event.artificial||!Number.isSafeInteger(event.sequence)||event.sequence<1||!Number.isFinite(event.at)||event.at<f.startedAt)return false;
  const stream=u.id+':'+event.stream,last=f.combatCursors[stream]??0;if(event.sequence<=last)return false;f.combatCursors[stream]=event.sequence;
  const s=season('week',event.at);if(s.status!=='open')return false;const e=entry(s,u,event.at),key=dayKey(event.at),daily=e.days[key]??={points:0,counts:{},events:[]},points=1;
  if(points<=0)return false;daily.points+=points;daily.counts[event.boss?'boss':event.kind]=(daily.counts[event.boss?'boss':event.kind]??0)+1;daily.events.push({id:event.stream+':'+event.sequence,points,at:event.at});e.hunter+=points;e.at.hunter=event.at;return true;
 }
 function tower(u,event){if(event.at<f.startedAt||!Number.isSafeInteger(event.floor)||event.floor<1)return false;const id=u.id+':'+event.runId+':'+event.floor;if(f.towerEvents[id])return false;f.towerEvents[id]=event.at;const s=season('month',event.at);if(s.status!=='open')return false;const e=entry(s,u,event.at);if(event.floor>e.tower){e.tower=event.floor;e.at.tower=event.at;}return true;}
 function close(s,at){
  if(s.status==='closed'||at<s.end)return false;
  const categories=s.kind==='week'?WEEK:MONTH,results={};const awards=new Map();
  for(const category of categories){const ranked=rows(s,category),pool=s.pools[category];let distributed=0,burned=0;const winners=[],burns=[];
   for(let i=0;i<3;i++){const coins=Math.floor(pool*[50,30,20][i]/100),winner=ranked[i];if(winner){winners.push({...winner,coins});distributed+=coins;awards.set(winner.userId,(awards.get(winner.userId)??0)+coins);}else{burned+=coins;burns.push({position:i+1,coins,reason:'Vaga não conquistada'});}}
   const residue=pool-distributed-burned;if(residue){burned+=residue;burns.push({coins:residue,reason:'Resíduo de arredondamento inteiro'});}results[category]={category,pool,distributed,burned,winners,burns,ranking:ranked};
  }
  for(const [id,coins]of awards){const user=db.users.find(u=>u.id===id);if(!user||!Number.isSafeInteger(balance(user)+coins*1e6))throw Error('Não foi possível validar o saldo de um vencedor. Fechamento adiado.');}
  for(const [id,coins]of awards)credit(db.users.find(u=>u.id===id),coins);
  for(const [category,r]of Object.entries(results)){f.totalDistributed+=r.distributed;f.totalBurned+=r.burned;f.ledger.push({id:s.id+':'+category,season:s.id,category,contributed:r.pool,distributed:r.distributed,burned:r.burned,winners:r.winners.map(w=>({userId:w.userId,name:w.name,coins:w.coins,position:w.position})),burns:r.burns,closedAt:at});s.pools[category]=0;}
  s.results=results;s.status='closed';s.closedAt=at;
  return true;
 }
 function tick(at=now()){
  let changed=false;
  for(const u of db.users)join(u,at);
  // A week closing on the same instant as a month must contribute first.
  for(;;){const overdue=Object.values(f.seasons).filter(s=>s.status==='open'&&s.end<=at).sort((a,b)=>a.end-b.end||(a.kind==='week'?-1:1));if(!overdue.length)break;for(const s of overdue)changed=close(s,at)||changed;}
  return changed;
 }
 function view(u,at=now()){
  updatePower(u,at);const w=season('week',at),m=season('month',at),publicSeason=s=>({id:s.id,start:s.start,end:s.end,kind:s.kind,categories:(s.kind==='week'?WEEK:MONTH).map(key=>{const all=rows(s,key);return {key,label:LABELS[key],pool:s.pools[key],top:all.slice(0,10),mine:all.find(r=>r.userId===u.id)??null,participants:all.length};})});
  const weekly=Object.values(w.pools).reduce((a,b)=>a+b,0),monthly=Object.values(m.pools).reduce((a,b)=>a+b,0),reserved=Object.values(f.seasons).filter(s=>s.status==='open').reduce((n,s)=>n+Object.values(s.pools).reduce((a,b)=>a+b,0),0);
  const history=Object.values(f.seasons).filter(s=>s.status==='closed').sort((a,b)=>b.end-a.end).map(s=>({id:s.id,kind:s.kind,start:s.start,end:s.end,closedAt:s.closedAt,results:Object.values(s.results).map(({ranking,...r})=>r)}));
  return {serverTime:at,timezone:ZONE,startedAt:f.startedAt,bossHuntStartedAt:f.bossHuntStartedAt,week:publicSeason(w),month:publicSeason(m),pot:{reserved,weekly,monthly,contributed:f.totalContributed,distributed:f.totalDistributed,burned:f.totalBurned+f.consumedFees,consumedFees:f.consumedFees},powerTotal:getPower(u),powerDetails:{current:getPower(u),baseline:entry(w,u,at).powerBase,net:getPower(u)-entry(w,u,at).powerBase,score:entry(w,u,at).power},dailyHunter:{points:entry(w,u,at).days[dayKey(at)]?.points??0,limit:null},avatar:avatarConfig(u.rankingAvatar??{}),history,config};
 }
 if(fresh)for(const u of db.users)join(u,now());
 return {join,updatePower,contribute,fusion,combat,tower,tick,view,rows,season,close,avatarConfig};
}
module.exports={festivalService,period,midnight,dayKey,splitEven,placementPoints,avatarConfig,AVATAR_DEFAULT,DEFAULTS,WEEK,MONTH};
