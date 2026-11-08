import{mhPrepareHeroRarity,mhHeroRarityUrl} from './hero-rarity-client.js';
const manifest={"heroes/swordsman-idle.png":"swordsman-idle-BZoYeDgg.png","heroes/swordsman-walk.png":"swordsman-walk-DMJTpNDL.png","heroes/swordsman-attack.png":"swordsman-attack-dbN_R6X3.png","heroes/spearman-idle.png":"spearman-idle-CJGk46vT.png","heroes/spearman-walk.png":"spearman-walk-BS5M27-3.png","heroes/spearman-attack.png":"spearman-attack-C3GjcOso.png","heroes/archer-idle.png":"archer-idle-P3SxISc4.png","heroes/archer-walk.png":"archer-walk-BSlfYEZv.png","heroes/archer-attack.png":"archer-attack-ClxIWz7r.png","heroes/mage-idle.png":"mage-idle.png","heroes/mage-walk.png":"mage-walk.png","heroes/mage-attack.png":"mage-attack.png"};
const By={mage:{x:8,y:4},spearman:{x:8,y:4},archer:{x:8,y:4},swordsman:{x:9,y:6}};
const names={mage:'Maga',spearman:'Lanceiro',archer:'Arqueiro',swordsman:'Espadachim'};
const skins=['mage','spearman','archer'];
await mhPrepareHeroRarity(k=>new URL(manifest[k],import.meta.url).href);
function iconSpan(skin,scale=3,rarity=5){
 const {x,y}=By[skin],url=mhHeroRarityUrl(skin,'idle',rarity),node=document.createElement('span');
 node.className='sprite';node.style.cssText='display:block;width:'+(16*scale)+'px;height:'+(16*scale)+'px;margin:auto;background:url('+url+') '+-x*scale+'px '+(-y*scale)+'px / '+(512*scale)+'px '+(128*scale)+'px no-repeat';return node;
}
function cardSpan(skin,scale=5,rarity=5){
 const url=mhHeroRarityUrl(skin,'idle',rarity),node=document.createElement('span');
 node.className='card-hero';node.style.cssText='display:block;width:'+(32*scale)+'px;height:'+(32*scale)+'px;background:url('+url+') 0 0 / '+(512*scale)+'px '+(128*scale)+'px no-repeat';return node;
}
const icons=document.getElementById('icons');
for(const skin of skins){const box=document.createElement('div');box.className='card';box.innerHTML='<div class="label">'+names[skin]+'</div>';const wrap=document.createElement('div');wrap.className='icon';wrap.append(iconSpan(skin,3,5));box.append(wrap);icons.append(box);} 
const cards=document.getElementById('cards');
for(const skin of skins){const box=document.createElement('div');box.className='card';const portrait=document.createElement('div');portrait.className='portrait';portrait.append(cardSpan(skin,5,5));box.innerHTML='<div class="label">'+names[skin]+'</div>';box.append(portrait);cards.append(box);} 
const dungeon=document.getElementById('dungeon');
for(const skin of skins){const box=document.createElement('div');box.className='dun';const img=new Image();img.src=mhHeroRarityUrl(skin,'idle',5);img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(img,0,0,32,32,0,0,64,64);box.append(c);};dungeon.append(box);}
