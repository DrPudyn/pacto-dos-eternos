const fs=require('fs');
const root='minihero-offline/build',manifest={};
for(const skin of ['swordsman','spearman','archer','mage'])for(const action of ['idle','walk','attack'])manifest[`heroes/${skin}-${action}.png`]=fs.readdirSync(root).find(n=>n.startsWith(skin+'-'+action)&&n.endsWith('.png'));
const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Arqueiro e auras</title><style>*{box-sizing:border-box}body{margin:0;background:#111612;color:#eef1f8;font:14px Arial}#canvas{display:block;width:100vw;height:100vh}</style><canvas id="canvas"></canvas><script type="module" src="./arqueiro-aura-preview.js"></script></html>`;
const js=`import{b as Mf,i as De,G as nm,h as Me}from './CanvasPool-ddESjdwZ.js';import{n as Pe}from './canvasUtils-BPAiyt2y.js';import{m as gc,l as ln,a as nn}from './session-1XYmAd2G.js';
import{mhPrepareHeroRarity,mhRarityCrop,mhRarityAura,mhMythicTrail}from './hero-rarity-client.js';
const manifest=${JSON.stringify(manifest)};await mhPrepareHeroRarity(key=>new URL(manifest[key],import.meta.url).href);
const W=key=>manifest[key]??key;
function q(v){return Math.round(v);}
const heroes=['swordsman','spearman','archer','mage'].map((skin,i)=>ln({id:i+1,skin,rarity:i,atk:80,atkSpd:150,dur:1000,durability:5000,range:nn(skin).range,skills:['swift'],skillLevels:{swift:2},skillXpTicks:0,x:48+i*56,y:96,action:'idle',actionTime:0,joinedAt:0,departedAt:null,direction:'down-right',heroId:i+1,facingLeft:false,frameSeconds:0.09},i));
const battle={heroes,elapsed:3,rarityMovementEnabled:true,skillKillXpEnabled:true,farmWavesEnabled:false,events:[],shots:[],monsters:[]};
const preview=class{app;heroLayer;heroes=new Map;state=battle;textures=new Map;ready=false;
 async init(canvas){await this.app.init({canvas,background:'#111612',antialias:false,preference:'webgl',roundPixels:true});this.heroLayer=new De;this.app.stage.addChild(this.heroLayer);this.heroLayer.sortableChildren=true;
  for(const key of ['heroes/swordsman-idle.png','heroes/spearman-idle.png','heroes/archer-idle.png','heroes/mage-idle.png'])this.textures.set(key.replace('.png',''),await Pe.load(W(key)));
  this.ready=true;this.render(0);}
 crop(key,x,y,w,h){const img=this.textures.get(key);const frame=key+'@'+x+','+y;return this.textures.has(frame)?this.textures.get(frame):(this.textures.set(frame,img),img);}
 constructor(){this.app=new Mf({resizeTo:window});}
 render(time){if(!this.ready)return;for(const e of this.state.heroes){let i=this.heroes.get(e.id);if(!i){const container=new De,sprite=new Me;sprite.anchor.set(.5,.5);sprite.scale.set(2);container.addChild(sprite);this.heroLayer.addChild(container);i={container,sprite};this.heroes.set(e.id,i);}
  i.container.position.set(q(e.x),q(e.y));i.container.zIndex=i.container.y;mhMythicTrail(this,i,e,time);mhRarityAura(this,i,e,time);
  const skin=nn(e.skin)?e.skin:'swordsman';i.sprite.texture=mhRarityCrop(this,'heroes/'+skin+'-idle',e.rarity,0,0,32,32);}};
};
const demo=new preview();await demo.init(document.getElementById('canvas'));function tick(t){demo.render(t/1000);requestAnimationFrame(tick);}requestAnimationFrame(tick);`;
for(const dest of ['minihero-offline/build','minihero-offline/shared-build']){
 fs.writeFileSync(dest+'/arqueiro-aura-preview.html',html);
 fs.writeFileSync(dest+'/arqueiro-aura-preview.js',js);
}
console.log('Prévia QA: /shared-build/arqueiro-aura-preview.html');
