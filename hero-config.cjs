// Shared class definitions: keep browser rendering and authoritative combat in sync.
function addMage(source){
 const replace=(from,to)=>{if(!source.includes(from))throw Error('Mage patch missing: '+from.slice(0,60));source=source.replace(from,to);};
 replace('en=Object.keys($t)','en=Object.keys($t)');
 replace('projectile:!0}},en=','projectile:!0},mage:{name:`Mago`,weapon:`Cajado arcano`,range:3,frames:16,hitFrame:10,projectile:!0}},en=');
 replace('function W(e){','function W(e){if(/^heroes\\/mage-(idle|walk|attack)\\.png$/.test(e))return new URL(`./mage-${e.split(`-`).pop()}`,import.meta.url).href;');
 replace('var Ry={swordsman:', 'var Ry={mage:`diagonal`,swordsman:');
 replace('By={swordsman:', 'By={mage:{x:8,y:4},swordsman:');
 replace('Uy={swordsman:', 'Uy={mage:`effects/burst-electric`,swordsman:');
 const start=source.indexOf('renderArrows(e,t){'),end=source.indexOf('renderMonster(e,t,n){',start);
 let arrows=source.slice(start,end);
 arrows=arrows.replace('e=new Me,e.anchor.set(.5)', 'e=this.state.heroes.find(h=>h.id===n.heroId)?.skin===`mage`?new nm().circle(0,0,3).fill(12079359).circle(0,0,1.4).fill(16777215):new Me,e.anchor?.set(.5)');
 arrows=arrows.replace('e.texture=this.crop(Vy.texture,s,c,l,u),','this.state.heroes.find(h=>h.id===n.heroId)?.skin!==`mage`&&(e.texture=this.crop(Vy.texture,s,c,l,u)),');
 source=source.slice(0,start)+arrows+source.slice(end);
 return require('./boss-visuals.cjs').addBossState(source);
}
// Idle doll heights inside the 32px frame: swordsman 9, spearman 14, archer 10, mage 14.
// Match the swordsman to their average (38/3) without passing the tallest facing (mage, 15px).
//  (38/3) / 9 = 38/27. Battle already draws every actor at 2×, so the swordsman uses 76/27.
function scaleSwordsman(source){
 const replace=(from,to)=>{if(!source.includes(from))throw Error('Swordsman scale patch missing: '+from.slice(0,80));source=source.replace(from,to);};
 replace(
  'function lb(e,t,rarity){let n=tn(e)?e:`swordsman`,{x:r,y:i}=By[n];return ub(mhHeroRarityUrl(n,`idle`,rarity),{sheetWidth:cb.width,sheetHeight:cb.height,x:r,y:i,width:16,height:16,scale:t})}',
  'function lb(e,t,rarity){let n=tn(e)?e:`swordsman`,{x:r,y:i}=By[n],k=n===`swordsman`?38/27:1;return ub(mhHeroRarityUrl(n,`idle`,rarity),{sheetWidth:cb.width,sheetHeight:cb.height,x:r,y:i,width:16,height:16,scale:t*k})}'
 );
 replace(
  'function mb(e,t,n){let r=db*t,i=fb*t,a=ub(mhHeroRarityUrl(tn(e.skin)?e.skin:`swordsman`,`idle`,e.rarity),{sheetWidth:512,sheetHeight:128,x:0,y:0,width:32,height:32,scale:n});return a.classList.add(`card-hero`)',
  'function mb(e,t,n){let r=db*t,i=fb*t,skin=tn(e.skin)?e.skin:`swordsman`,k=skin===`swordsman`?38/27:1,a=ub(mhHeroRarityUrl(skin,`idle`,e.rarity),{sheetWidth:512,sheetHeight:128,x:0,y:0,width:32,height:32,scale:n});if(k!==1)a.style.backgroundSize=`${512*n*k}px ${128*n*k}px`,a.style.backgroundPosition=`${16*n*(1-k)}px ${18.5*n*(1-k)}px`,a.style.zIndex=`1`;return a.classList.add(`card-hero`)'
 );
 replace(
  'e.rarity>=4?J(`span`,{class:`card-holo`}):null)',
  'e.rarity>=4?J(`span`,{class:`card-holo`,style:{zIndex:`2`}}):null)'
 );
 replace(
  'function nw(e,t,n,r,i=0){let a=ub(e,{sheetWidth:t.frames*32,sheetHeight:t.rows*32,x:0,y:n*32,width:32,height:32,scale:r});return a.classList.add(`sprite-idle`),a.style.setProperty(`--frames`,String(t.frames)),a.style.setProperty(`--strip`,`${t.frames*32*r}px`),a.style.setProperty(`--px`,`${r}px`),a.style.setProperty(`--i`,String(i)),a}',
  'function nw(e,t,n,r,i=0){let k=String(e).includes(`swordsman`)?38/27:1,s=r*k,a=ub(e,{sheetWidth:t.frames*32,sheetHeight:t.rows*32,x:0,y:n*32,width:32,height:32,scale:s});a.classList.add(`sprite-idle`),a.style.setProperty(`--frames`,String(t.frames)),a.style.setProperty(`--strip`,`${t.frames*32*s}px`),a.style.setProperty(`--px`,`${s}px`),a.style.setProperty(`--i`,String(i));if(k===1)return a;let o=J(`span`,{class:`sprite-window`,style:{width:`${32*r}px`,height:`${32*r}px`,overflow:`hidden`,position:`relative`,flex:`none`}});return a.style.position=`absolute`,a.style.left=`${16*r*(1-k)}px`,a.style.top=`${18.5*r*(1-k)}px`,o.append(a),o}'
 );
 replace(
  'ub(W(`heroes/swordsman-idle.png`),{sheetWidth:512,sheetHeight:128,x:9,y:7,width:14,height:14,scale:4})',
  'ub(W(`heroes/swordsman-idle.png`),{sheetWidth:512,sheetHeight:128,x:9,y:7,width:14,height:14,scale:4*38/27})'
 );
 replace(
  'i.sprite.texture=mhRarityCrop(this,`heroes/${l}-${r}`,e.rarity,s*32,n*32,32,32)}let u=this.selectedHero===e.id;',
  'i.sprite.texture=mhRarityCrop(this,`heroes/${l}-${r}`,e.rarity,s*32,n*32,32,32)}let sy=l===`swordsman`?76/27:2;i.sprite.scale.set(sy),i.sprite.y=5-2.5*sy,i.container.hitArea=new k(l===`swordsman`?-12:-10,l===`swordsman`?-22:-12,l===`swordsman`?24:20,l===`swordsman`?34:20);let u=this.selectedHero===e.id;'
 );
 return source;
}
module.exports={addMage,scaleSwordsman};
