// Cosmetic spawn variety shared by the Dungeon and Tower renderer.
const kinds=['slime','blueslime','orc','minotaur','wolf','bat','goblin','skeleton','werewolf','cyclop','yeti','troll','zombie','reaper','gargoyle','werewolfman','snowman','vampire'];
function monsterAppearance(monster,elapsed=0){
 // The Giant is kept only for boss encounters; it is never in the common mob pool.
 if(monster.boss)return monster.kind;
 let hash=2166136261;
 for(const c of `${monster.id}:${monster.spawnedAt}:${monster.x}:${monster.y}`)hash=Math.imul(hash^c.charCodeAt(0),16777619);
 hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d);hash^=hash>>>15;
 hash>>>=0;
 const theme=Math.floor(elapsed/120)%5;
 const themed=theme===1?['yeti','snowman','skeleton','wolf','skeleton','blueslime','gargoyle']:
  theme===4?['vampire','zombie','bat','skeleton','gargoyle','werewolfman','zombie','vampire']:
  kinds;
 return themed[hash%themed.length];
}
function farmMobPool(cleared){const last=Math.min(9,Math.max(1,...Object.keys(cleared??{}).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=9)));return Array.from({length:last},(_,i)=>i+1).flatMap(region=>[0,1,2,3].map(variant=>({region,variant})));}
function renderFarmMob(actor,m,time){
 let entry;if(this.towerCreatures){if(!Number.isInteger(m.towerRegion)||!Number.isInteger(m.towerVariant))return null;entry={region:m.towerRegion,variant:m.towerVariant};}else{if(this.disableFarmMobs||m.boss||!globalThis.mhFarmMobPool?.length)return null;let hash=2166136261;for(const c of String(m.id)+':'+String(m.spawnedAt))hash=Math.imul(hash^c.charCodeAt(0),16777619);entry=globalThis.mhFarmMobPool[(hash>>>0)%globalThis.mhFarmMobPool.length];}
 const frame=time-m.hitAt<.22?3:[0,1,0,2][Math.floor(time*3+actor.index)%4],key=entry.region+'-'+entry.variant+'-'+frame;
 this.farmTextures??=new Map();let texture=this.farmTextures.get(key);if(!this.farmTextures.has(key)){this.farmTextures.set(key,false);const image=new Image();image.src=new URL('./enemy-'+key.split('-').slice(0,2).join('-')+'-pixel-'+frame+'.png',MH_FARM_URL).href;image.decode().then(()=>{const texture=P.from(image);texture.source.scaleMode='nearest';this.farmTextures.set(key,texture);}).catch(()=>this.farmTextures.delete(key));}if(!texture){actor.sprite.visible=false;actor.bar.clear();actor.marker.clear();return true;}
 const size=this.towerCreatures&&m.boss?64:entry.variant===3?40:36;actor.sprite.visible=true;actor.sprite.texture=texture;actor.sprite.scale.set(size/96);actor.sprite.y=-size*.22;actor.sprite.tint=time-m.hitAt<.12?0xffc878:0xffffff;actor.marker.clear();actor.bar.clear();
 if(m.dead){actor.container.alpha=Math.max(0,1-(time-m.hitAt)/.5);return time-m.hitAt<.5;}actor.container.alpha=Math.min(1,Math.max(0,(time-m.spawnedAt)/.3));if(m.hp<m.maxHp)ab(actor.bar,-size*.65,Math.max(0,m.hp/m.maxHp),Yy,4854806);return true;
}
function addMonsterVariety(source){
 const asset='function W(e){';
 const loader='let e=new Set([...Ns.flatMap(e=>e.kinds),Ms]);';
 const render='renderMonster(e,t,n){let r=Ay[t.kind]';
 const idleRender='let i=Math.floor(n*5+e.index*3)%r.idle.frames,o=r.idle.rows===4?a:0;e.sprite.texture=this.crop(`monsters/${t.kind}-idle`,i*32,o*32,32,32)';
 if(!source.includes(asset)||!source.includes(loader)||!source.includes(render)||!source.includes(idleRender))throw Error('Monster renderer patch target missing');
 source=source.replace(asset,asset+'if(e===`monsters/snowman-damage.png`||e===`monsters/snowman-die.png`)e=`monsters/snowman-idle.png`;if(e.startsWith(`monsters/vampire-`))return new URL(`./vampire-idle.png`,import.meta.url).href;');
 source=source.replace(loader,`let e=new Set(${JSON.stringify([...kinds,'giant'])});`);
 source=source.replace(idleRender,`let i=Math.floor(n*5+e.index*3)%r.idle.frames,o=r.idle.rows===4?a:0;if(t.kind===\`snowman\`){if(!e.snowball){e.snowball=new Me;e.snowball.anchor.set(.5,.5);e.snowball.scale.set(2);e.container.addChildAt(e.snowball,3)}let b=i>=10;e.sprite.texture=this.crop(\`monsters/snowman-idle\`,(b?9:i)*32,o*32,32,32);e.snowball.visible=b;if(b){e.snowball.texture=this.crop(\`monsters/snowman-idle\`,i*32,o*32,32,32);e.snowball.position.set((i-9)*8,0)}}else{if(e.snowball)e.snowball.visible=!1;e.sprite.texture=this.crop(\`monsters/\`+t.kind+\`-idle\`,i*32,o*32,32,32)}`);
 return source.replace(render,`renderMonster(e,t,n){const farm=miniHeroRenderFarmMob.call(this,e,t,n);if(farm!==null)return farm;e.sprite.visible=true;e.sprite.scale.set(2);e.sprite.y=0;t={...t,kind:miniHeroMonsterAppearance(t,n)};let r=Ay[t.kind]`)
  .replace('var ob=class',`var miniHeroRenderFarmMob=${renderFarmMob.toString().replaceAll('MH_FARM_URL','import.meta.url')};var miniHeroMonsterKinds=${JSON.stringify(kinds)};Ay.snowman.damageRows=4;Ay.snowman.dieFrames=12;Ay.vampire={name:'Vampire',idle:{frames:8,rows:1},damageRows:1,dieFrames:8};var miniHeroMonsterAppearance=${monsterAppearance.toString().replaceAll('kinds','miniHeroMonsterKinds')};var ob=class`);
}
module.exports={farmMobPool,kinds,monsterAppearance,addMonsterVariety};
