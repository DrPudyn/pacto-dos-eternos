const fs=require('fs');const p='campaign-tactics.js';let s=fs.readFileSync(p,'utf8');s=s.replace('m.boss?85:m.elite?65:35','(m.boss?200:m.elite?120:70)*(1+(cfg.id-1)*.07)');s=s.replace('n.posture=Math.min(n.postureMax,n.posture+dt*9);','if(this.elapsed-(n.impactedAt??-100)>2.5)n.posture=Math.min(n.postureMax,n.posture+dt*2);');
const marker=' // Roles modify existing attacks';
s=s.replace(marker,` // A boss occupies a broad combat footprint; heroes attack its edge.
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
`+marker);fs.writeFileSync(p,s);
