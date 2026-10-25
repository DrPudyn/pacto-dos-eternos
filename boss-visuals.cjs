const bosses=['rei-esqueleto','golem-forja','aranha-rainha','dragao','necromante','lobisomem-ancestral'];
function bossAppearance(monster){
 if(bosses.includes(monster.bossSkin))return monster.bossSkin;
 let hash=2166136261;
 for(const c of `${monster.id}:${monster.spawnedAt}:${monster.x}:${monster.y}`)hash=Math.imul(hash^c.charCodeAt(0),16777619);
 hash^=hash>>>16;
 return bosses[(hash>>>0)%bosses.length];
}
function addBossVisuals(source){
 const patch=(from,to)=>{if(!source.includes(from))throw Error('Boss patch target missing: '+from);source=source.replace(from,to);};
 patch('function W(e){','function W(e){if(/^bosses\\/[a-z-]+\\.png$/.test(e))return new URL(`./boss-${e.slice(7)}`,import.meta.url).href;');
 patch('return[...Iy,...en.flatMap', 'return[...miniHeroBossKinds.map(e=>`bosses/${e}`),...Iy,...en.flatMap');
 patch('var ob=class',`var miniHeroBossKinds=${JSON.stringify(bosses)};var miniHeroBossAppearance=${bossAppearance.toString().replaceAll('bosses','miniHeroBossKinds')};var ob=class`);
 patch('renderMonster(e,t,n){',`renderMonster(e,t,n){if(t.boss&&!this.towerCreatures)return this.renderCustomBoss(e,t,n);`);
 patch('renderMonsters(e,t){',`renderCustomBoss(e,t,n){
 const skin=miniHeroBossAppearance(t),age=n-t.spawnedAt,hit=n-t.hitAt;
 if(t.dead&&hit>=.7)return false;
 const frame=Math.floor(n*5+e.index*3)%8;
 e.sprite.texture=this.crop(\`bosses/\${skin}\`,frame*48,0,48,48);
 e.sprite.scale.set(4/3);e.sprite.tint=!t.dead&&hit>=0&&hit<.12?16765858:16777215;
 e.container.alpha=t.dead?Math.max(0,1-hit/.7):Math.min(1,Math.max(0,age/tb));
 e.bar.clear();e.marker.clear();
 if(!t.dead&&t.hp<t.maxHp)ab(e.bar,-18,Math.max(0,t.hp/t.maxHp),Yy,4854806);
 const selected=this.state.heroes.find(h=>h.id===this.selectedHero&&h.targetId===t.id);
 if(selected&&!t.dead)e.marker.ellipse(0,Gy,8.5,3.5).stroke({color:selected.color,alpha:.75,width:.75});
 return true;
 }renderMonsters(e,t){`);
 return source;
}
function addBossState(source){
 for(const [from,to]of [
  ['r.pendingBossHp=t.pendingBossHp,','r.pendingBossHp=t.pendingBossHp,r.pendingBossSkin=t.pendingBossSkin??null,'],
  ['pendingBossHp:this.pendingBossHp,','pendingBossHp:this.pendingBossHp,pendingBossSkin:this.pendingBossSkin??null,'],
  ['kind:Ms,tier:0,','kind:Ms,bossSkin:this.pendingBossSkin??null,tier:0,'],
  ['this.pendingBossHp=null;for(let e of this.heroes)','this.pendingBossHp=null,this.pendingBossSkin=null;for(let e of this.heroes)'],
  ['r.pendingBossSkin=t.pendingBossSkin??null,','r.pendingBossSkin=t.pendingBossSkin??null,r.pendingBossFestivalExcluded=!!t.pendingBossFestivalExcluded,'],
  ['pendingBossSkin:this.pendingBossSkin??null,','pendingBossSkin:this.pendingBossSkin??null,pendingBossFestivalExcluded:!!this.pendingBossFestivalExcluded,'],
  ['bossSkin:this.pendingBossSkin??null,','bossSkin:this.pendingBossSkin??null,festivalExcluded:!!this.pendingBossFestivalExcluded,'],
  ['this.pendingBossHp=null,this.pendingBossSkin=null;','this.pendingBossHp=null,this.pendingBossSkin=null,this.pendingBossFestivalExcluded=false;']
 ]){if(!source.includes(from))throw Error('Boss state target missing: '+from);source=source.replace(from,to);}
 return source;
}
module.exports={bosses,bossAppearance,addBossVisuals,addBossState};
