async function mhInstallCampaignEnemyVisuals(renderer,stage,onTarget){
 const textures=await Promise.all(Array.from({length:5},async(_,i)=>{const im=new Image();im.src=new URL('./enemy-'+stage.id+'-'+i+'.png',import.meta.url).href;await im.decode();const t=P.from(im);t.source.scaleMode='nearest';return t;}));
 const forestFrames=await Promise.all(Array.from({length:5},(_,i)=>Promise.all(Array.from({length:4},async(_,frame)=>{const im=new Image();im.src=new URL('./enemy-'+stage.id+'-'+i+'-pixel-'+frame+'.png',import.meta.url).href;await im.decode();const texture=P.from(im);texture.source.scaleMode='nearest';return texture;}))));
 const original=renderer.renderMonster.bind(renderer);
 renderer.renderMonster=function(a,m,t){
  if(!m.family)return original(a,m,t);
  a.container.position.set(q(m.x),q(m.y));a.container.scale.set(1);
  if(m.dead){a.bar.clear();a.marker.clear();a.container.alpha=Math.max(0,1-(t-m.hitAt)/.7);return t-m.hitAt<.7;}
  const forestFrame=m.warning||(m.impact&&t-m.impact.at<.35)?3:m.move?1+Math.floor(t*8)%2:m.boss?[0,1,0,2][Math.floor(t*2.5)%4]:0;
  a.container.alpha=1;a.sprite.texture=forestFrames?forestFrames[m.variant??0][forestFrame]:textures[m.variant??0];a.sprite.visible=!m.objective;
  const size=forestFrames?(m.boss?64:m.elite?48:40):(m.boss?70:m.elite?45:30),walk=m.move?Math.sin(t*12):Math.sin(t*3+a.index);
  a.sprite.scale.set((m.facing==='left'?-1:1)*size/96,size/96*(1+walk*.025));a.sprite.y=-size*.22+walk*(m.move?1.5:.5);a.sprite.rotation=forestFrames?0:m.move?walk*.035:0;if(forestFrames){a.sprite.scale.y=size/96;a.sprite.y=-size*.22+(m.boss?Math.sin(t*2)*.6:0);}
  a.sprite.tint=t-m.hitAt<.12?0xffc878:0xffffff;a.marker.clear();a.bar.clear();
  if(m.objective){a.marker.poly([-7,2,0,-18,7,2,0,8]).fill(stage.bestiary.color).stroke({color:0xffe6ab,width:1});a.marker.ellipse(0,8,10,3).stroke({color:stage.bestiary.color,width:1});}
  if(m.hp<m.maxHp||m.boss||m.elite){a.bar.rect(-13,-size*.65,26,3).fill(0x171820);a.bar.rect(-13,-size*.65,26*Math.max(0,m.hp/m.maxHp),3).fill(m.boss?0xef5678:0xe9b85a);}
  if(m.boss)a.marker.ellipse(0,10,29,10).stroke({color:stage.bestiary.color,alpha:.22,width:1});
  if(m.vulnerableUntil>t)a.marker.ellipse(0,8,size*.4,5).stroke({color:0xffdc71,width:1.5});
  if(this.state.tactics?.priority===m.id)a.marker.ellipse(0,9,size*.45,6).stroke({color:0xffffff,width:2});
  if(!a.targetHook){a.targetHook=true;a.container.eventMode='static';a.container.cursor='pointer';a.container.on('pointertap',()=>onTarget(a.last.id));}
  return true;
 };
 const g=new nm;renderer.effects.addChild(g);
 renderer.onRender=(state)=>{g.clear();const time=state.elapsed;
  for(const m of state.monsters){if(m.dead)continue;const w=m.warning??(m.impact&&time-m.impact.at<.35?m.impact:null);if(!w)continue;
   if(m.role==='ranged'&&m.warning){const progress=Math.max(0,1-(w.endsAt-time)/.65);g.circle(q(m.x+(w.x-m.x)*progress),q(m.y+(w.y-m.y)*progress)-5,2).fill(stage.bestiary.color);}
   const alpha=m.warning?.18+.12*Math.sin(time*12):.5;
   for(let x=1;x<40;x++)for(let y=1;y<20;y++){if(x%2===0&&y%2===0)continue;const dx=Math.abs(x+.5-w.x),dy=Math.abs(y+.5-w.y);if(w.shape==='line'?(w.axis==='x'?dy<.75&&dx<w.radius:dx<.75&&dy<w.radius):dx+dy<w.radius)g.rect(q(x),q(y),q(1),q(1)).fill({color:0xff674b,alpha});}
  }
  for(const h of state.heroes){if(h.posture<h.postureMax||h.stunnedUntil>time){const x=q(h.x),y=q(h.y)+13;if(h.stunnedUntil>time){for(let i=0;i<3;i++){const a=time*5+i*Math.PI*2/3;g.rect(x+Math.cos(a)*10-1,q(h.y)-21+Math.sin(a)*3,3,3).fill(0xffd85d);}}g.rect(x-9,y,18,2).fill(0x172132);g.rect(x-9,y,18*h.posture/h.postureMax,2).fill(h.stunnedUntil>time?0xffcb59:0x62d4ee);}}
 };
}
