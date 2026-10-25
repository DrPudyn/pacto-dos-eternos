// One deterministic combat module for both the server and client prediction.
function mhInstallCampaignTactics(b,cfg,saved){
 if(b.tacticalInstalled)return b;b.tacticalInstalled=true;
 b.tactics={strategy:cfg.strategy??'aggressive',priority:null,priorityUntil:0,...saved?.tactics};
 const distance=(a,c)=>Math.abs(a.x-c.x)+Math.abs(a.y-c.y);
 const alive=()=>b.heroes.filter(h=>h.state.departedAt===null&&!h.state.leaving);
 const blocked=(x,y)=>x<=0||y<=0||x>=40||y>=20||(x%2===0&&y%2===0);
 const neighbors=p=>[[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>({x:Math.floor(p.x)+x+.5,y:Math.floor(p.y)+y+.5})).filter(p=>!blocked(Math.floor(p.x),Math.floor(p.y))&&!b.monsters.some(m=>!m.dead&&distance(m,p)<.8)&&!alive().some(h=>distance(h.state,p)<.65));
 function initMonster(m,i){
  if(m.tactical)return;m.tactical=true;m.family=cfg.id;m.attackAt=b.elapsed+2+(i%5);m.moveAt=b.elapsed+.5+(i%3)*.4;m.evades=0;
  if(m.boss){m.variant=4;m.role='boss';m.label=cfg.bestiary.names[4];m.attackAt=b.elapsed+3;return;}
  if(i>=cfg.count-2){m.variant=0;m.role='objective';m.objective=true;m.label=cfg.bestiary.objective;m.hp=m.maxHp=Math.round(cfg.hp*.8);}
  else if(i===cfg.count-3){m.variant=3;m.role='elite';m.elite=true;m.label=cfg.bestiary.names[3];m.hp=m.maxHp=Math.round(cfg.hp*2.4);}
  else {m.variant=i%3;m.role=cfg.bestiary.roles[m.variant];m.label=cfg.bestiary.names[m.variant];const factor=m.role==='tank'?1.5:m.role==='swarm'?.65:1;m.hp=m.maxHp=Math.round(cfg.hp*factor);}
 }
 b.monsters.forEach(initMonster);
 for(const h of b.heroes){const n=h.state;n.postureMax??=Math.min(160,90+n.maxDurability*.04)+(n.skin==='swordsman'?35:0);n.posture??=n.postureMax;n.stunnedUntil??=0;n.guardUntil??=0;}
 const state=b.toState.bind(b),snapshot=b.snapshot.bind(b),update=b.update.bind(b),updateHero=b.updateHero.bind(b),select=b.selectTarget.bind(b);
 b.toState=()=>({...state(),tactics:{...b.tactics}});
 b.snapshot=()=>({...snapshot(),tactics:{...b.tactics}});
 function stagger(h,power){const n=h.state;if(b.elapsed<n.guardUntil)return;const tenacity=n.skin==='swordsman'?.65:n.skin==='spearman'?.85:1;n.posture=Math.max(0,n.posture-power*tenacity);n.impactedAt=b.elapsed;if(n.posture<=0){n.stunnedUntil=b.elapsed+1.2;n.guardUntil=b.elapsed+4.2;n.posture=n.postureMax;h.path=[];n.action='idle';n.actionTime=0;}}
 function threatens(m,p){if(!m.warning)return false;const w=m.warning;return w.shape==='line'?(w.axis==='x'?Math.abs(p.y-w.y)<.75&&Math.abs(p.x-w.x)<w.radius:Math.abs(p.x-w.x)<.75&&Math.abs(p.y-w.y)<w.radius):distance(w,p)<w.radius;}
 function attack(m){
  const targets=alive().sort((a,c)=>distance(a.state,m)-distance(c.state,m));if(!targets.length)return;const target=targets[0].state;
  if(m.role==='boss'||m.role==='elite'||m.role==='charger'){
   const line=m.role==='charger'||cfg.id%2===0;m.warning={x:line?m.x:target.x,y:line?m.y:target.y,axis:Math.abs(target.x-m.x)>Math.abs(target.y-m.y)?'x':'y',shape:line?'line':'circle',radius:m.boss?5:m.elite?3:3.5,endsAt:b.elapsed+(m.boss?1.5:1.1)};
  }else if(distance(target,m)<(m.role==='ranged'?7:1.8)){m.warning={x:target.x,y:target.y,shape:'circle',radius:m.role==='ranged'?1.2:1,endsAt:b.elapsed+.65};}
  m.attackAt=b.elapsed+(m.boss?9:m.elite?7:m.role==='charger'?6:4.5);
 }
 b.update=function(dt){
  for(const [i,m]of this.monsters.entries()){
   if(m.dead)continue;initMonster(m,i);if(m.objective)continue;
   if(m.warning&&this.elapsed>=m.warning.endsAt){for(const h of alive())if(threatens(m,h.state))stagger(h,(m.boss?200:m.elite?120:70)*(1+(cfg.id-1)*.07));m.impact={...m.warning,at:this.elapsed};if(m.role==='charger'&&!m.move){const target=alive().sort((a,c)=>distance(a.state,m)-distance(c.state,m))[0];if(target){const axis=m.warning.axis,sign=Math.sign(target.state[axis]-m[axis]);let goal={x:m.x,y:m.y};for(let step=0;step<3;step++){const next={...goal,[axis]:goal[axis]+sign};if(blocked(Math.floor(next.x),Math.floor(next.y))||this.monsters.some(n=>n!==m&&!n.dead&&distance(n,next)<.8))break;goal=next;}m.move={x:m.x,y:m.y,tx:goal.x,ty:goal.y,at:this.elapsed,duration:.28};}}m.warning=null;if(m.boss||m.elite)m.vulnerableUntil=this.elapsed+3;}
   if(!m.warning&&this.elapsed>=m.attackAt)attack(m);
   if(m.move){const p=Math.min(1,(this.elapsed-m.move.at)/m.move.duration);m.x=m.move.x+(m.move.tx-m.move.x)*p;m.y=m.move.y+(m.move.ty-m.move.y)*p;if(p===1){m.move=null;for(const h of alive())if(h.state.action!=='attack')this.requestReplan(h);}}
   if(!m.move&&!m.warning&&!m.boss&&!m.elite&&m.role!=='protector'&&m.role!=='tank'&&this.elapsed>=m.moveAt){
    const heroes=alive(),nearest=heroes.sort((a,c)=>distance(a.state,m)-distance(c.state,m))[0];m.moveAt=this.elapsed+2.5;
    if(nearest){const d=distance(m,nearest.state),evade=m.role==='ranged'&&d<4&&m.evades<2;if(d>2||evade){let cells=neighbors(m);cells.sort((a,c)=>(distance(a,nearest.state)-distance(c,nearest.state))*(evade?-1:1));if(cells.length){const goal=cells[0];m.facing=goal.x<m.x?'left':'right';m.move={x:m.x,y:m.y,tx:goal.x,ty:goal.y,at:this.elapsed,duration:m.role==='charger'?.55:.9};if(evade)m.evades++;}}}
   }
  }
  if(this.elapsed>=this.tactics.priorityUntil)this.tactics.priority=null;
  update(dt);
 };
 b.selectTarget=function(h,current){
  const enemies=this.monsters.filter(m=>!m.dead),marked=enemies.find(m=>m.id===this.tactics.priority);
  if(marked&&this.planRoute(h,enemies,[marked]))return;
  const score=m=>{let p=0;if(m.objective)p+=this.tactics.strategy==='hunter'?18:6;if(this.tactics.strategy==='hunter'&&['ranged','protector'].includes(m.role))p+=15;if(h.state.skin==='spearman'&&(m.elite||m.role==='tank'))p+=10;if(h.state.skin==='archer'&&['ranged','protector'].includes(m.role))p+=12;if(['swordsman','mage'].includes(h.state.skin))p+=enemies.filter(n=>n!==m&&distance(n,m)<=3).length*3;if(m.vulnerableUntil>this.elapsed)p+=this.tactics.strategy==='aggressive'?20:10;return p-distance(h.state,m)*.3;};
  const candidates=[...enemies].sort((a,c)=>score(c)-score(a));for(const m of candidates.slice(0,4))if(this.planRoute(h,enemies,[m]))return;return select(h,current);
 };
 b.updateHero=function(h,dt){
  const n=h.state;if(this.elapsed<n.stunnedUntil){n.action='idle';return;}if(this.elapsed-(n.impactedAt??-100)>2.5)n.posture=Math.min(n.postureMax,n.posture+dt*2);
  const hazard=this.monsters.find(m=>!m.dead&&threatens(m,n));
  const cautious=this.tactics.strategy==='cautious';
  if(hazard&&hazard.warning.endsAt-this.elapsed>(cautious?.2:.45)&&n.action!=='attack'&&h.path.length===0&&Math.abs(n.x%1-.5)<.05&&Math.abs(n.y%1-.5)<.05){const queue=[{p:n,path:[]}],seen=new Set();let escape=null;while(queue.length){const at=queue.shift();if(at.path.length&&!threatens(hazard,at.p)){escape=at.path;break;}if(at.path.length>=8)continue;for(const p of neighbors(at.p)){const key=p.x+','+p.y;if(seen.has(key))continue;seen.add(key);queue.push({p,path:[...at.path,p]});}}if(escape){h.path=escape;n.targetId=null;n.dodgedAt=this.elapsed;}}
  const move=n.codexMove??1;n.codexMove=move*(n.skin==='archer'?1.15:1)*(cautious&&hazard?1.2:1);updateHero(h,dt);n.codexMove=move;
 };
 // A boss occupies a broad combat footprint; heroes attack its edge.
 const route=b.planRoute.bind(b),position=b.inPosition.bind(b);
 b.planRoute=function(h,enemies,candidates){
  const boss=candidates.length===1&&candidates[0].boss?candidates[0]:null;if(!boss)return route(h,enemies,candidates);
  const mask=new Uint8Array(Fs),costs=new Float64Array(Fs);for(const m of enemies)mask[Is(Math.floor(m.x),Math.floor(m.y))]=1;
  for(let x=1;x<40;x++)for(let y=1;y<20;y++)if(distance({x:x+.5,y:y+.5},boss)<3)mask[Is(x,y)]=1;
  const start=lc(h.state),paths=Vs(start,mask,costs,h.state.slot);let best=null;
  for(let x=1;x<40;x++)for(let y=1;y<20;y++){const d=distance({x:x+.5,y:y+.5},boss),key=Is(x,y);if(blocked(x,y)||mask[key]||d<3||d>h.state.range+2||!Number.isFinite(paths.costs[key]))continue;const occupied=this.heroes.filter(a=>a!==h&&distance(a.path.at(-1)??a.state,{x:x+.5,y:y+.5})<.8).length;const score=paths.costs[key]+occupied*80;if(!best||score<best.score)best={key,score};}
  if(!best)return false;h.path=Hs(paths,start,best.key);h.state.targetId=boss.id;return true;
 };
 b.inPosition=function(h,m){if(!m.boss)return position(h,m);const n=h.state,d=distance(n,m);return uc(n)&&d>=3&&d<=n.range+2;};
 // Roles modify existing attacks while leaving the original rarity AoE available.
 const hit=b.hit.bind(b);
 b.hit=function(h,m){const aoe=h.state.aoe;if(h.state.skin==='mage')h.state.aoe=Math.max(aoe,3);if(h.state.skin==='swordsman')h.state.aoe=Math.max(aoe,2);hit(h,m);h.state.aoe=aoe;};
 return b;
}
