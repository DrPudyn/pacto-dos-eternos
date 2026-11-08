const fs=require('fs');
const root='minihero-offline/build',manifest={};
for(const skin of ['swordsman','spearman','archer','mage'])for(const action of ['idle','walk','attack'])manifest[`heroes/${skin}-${action}.png`]=fs.readdirSync(root).find(n=>n.startsWith(skin+'-'+action)&&n.endsWith('.png'));
const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Alinhamento arqueiro</title><style>
body{margin:0;background:#121722;color:#eef3ff;font:14px Arial;padding:20px}
h2{margin:28px 0 10px;color:#f3d08b}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:end}
.card{background:#1c2433;border:1px solid #40506a;border-radius:10px;padding:12px;text-align:center}
.label{font-size:12px;color:#9eb0c9;margin-bottom:8px}
.icon{width:48px;height:48px;margin:auto;background:#0b1018;position:relative}
.icon::before{content:'';position:absolute;inset:0;border:1px dashed #4d607c;opacity:.6}
.portrait{width:160px;height:280px;margin:auto;position:relative;background:linear-gradient(#2a1c2d,#151922);border-radius:12px;border:2px solid #b670ff;overflow:hidden}
.portrait .card-hero{position:absolute;left:50%;transform:translateX(-50%);top:38px}
.row-icons{display:flex;gap:18px;justify-content:center;align-items:center}
.row-icon{width:42px;height:42px;background:#101723;border:2px solid #ff4d6d;border-radius:6px;position:relative}
.row-icon::after{content:'';position:absolute;inset:6px;border:1px dashed #5b6a7d}
.dungeon{display:flex;gap:10px;justify-content:center;align-items:flex-end;height:96px;background:#232018;border-radius:8px;padding:12px}
.dun{width:64px;height:64px;position:relative}
.dun img{width:64px;height:64px;image-rendering:pixelated}
</style>
<h1>Arqueiro × Maga × Lanceiro — escala e centro</h1>
<p>Ícone de lista (crop 16×16), carta de invocação (32×32) e repouso na masmorra.</p>
<h2>Lista de heróis (ícone 48px)</h2>
<div class="grid" id="icons"></div>
<h2>Carta / ficha (escala de loja)</h2>
<div class="grid" id="cards"></div>
<h2>Masmorra (frame idle, 2×)</h2>
<div class="dungeon" id="dungeon"></div>
<script type="module" src="./alinhamento-arqueiro-preview.js"></script>`;
const js=`import{mhPrepareHeroRarity,mhHeroRarityUrl} from './hero-rarity-client.js';
const manifest=${JSON.stringify(manifest)};
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
`;
for(const dest of ['minihero-offline/build','minihero-offline/shared-build']){
 fs.writeFileSync(dest+'/alinhamento-arqueiro-preview.html',html);
 fs.writeFileSync(dest+'/alinhamento-arqueiro-preview.js',js);
}
console.log('Prévia de alinhamento: /shared-build/alinhamento-arqueiro-preview.html');
