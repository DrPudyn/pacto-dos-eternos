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
module.exports={addMage};
