// Rendering-only palette swaps: never modify heroes, stats or original sheets.
const mhHeroPalettes=new Map(),mhHeroPaletteUrls=new Map(),mhCodexPaletteUrls=new Map(),mhCodexPaletteJobs=new Map(),mhCodexBaseImages=new Map();
const mhRarityClothRGB=[[201,207,214],[110,225,106],[74,168,255],[182,112,255],[255,178,46],[255,77,109]];
function mhClothPixel(skin,r,g,b,x,y,portrait=false,width=32,height=32){
 if(portrait){if(skin==='swordsman'){
   const nx=x/width,ny=y/height;
   const cape=ny>.35&&!(nx>.18&&nx<.25&&ny>.58&&ny<.66)&&r>20&&r>g*1.5&&r>b*1.2&&r-g>6;
   // Navy fabric beneath the breastplate, collar and sleeves; keep steel and ink untouched.
   const underArmor=(nx>.30&&nx<.46&&ny>.59&&ny<.95)||(nx>.76&&nx<.91&&ny>.70&&ny<.98)||(nx>.39&&nx<.61&&ny>.39&&ny<.59);
   return cape||(underArmor&&b>=24&&b<115&&b>r*1.10&&b>g*1.12);
  }
  if(skin==='archer')return y>height*.34&&g>r*1.2&&g>b*1.04&&g-r>12;
  if(skin==='spearman'){const nx=x/width,ny=y/height,clothJoint=(nx>.38&&nx<.64&&ny>.46&&ny<.57)||(nx>.20&&nx<.35&&ny>.70&&ny<.79)||(nx>.72&&nx<.86&&ny>.79&&ny<.91);return ((nx>.17||ny>.60)&&g>r*1.12&&g>b*.75&&g-r>4)||(clothJoint&&b>r*1.25&&b>g*1.12&&b-r>12&&b<150);}
  return b>r*1.12&&r>g*1.22&&b>g*1.5;
 }
 if(skin==='mage')return x%32>=7&&x%32<=25&&y%32<=25&&b>r*1.12&&r>g*1.22&&b>g*1.5;
 return (r===54&&g===39&&b===136)||(r===86&&g===83&&b===187)||(r===123&&g===146&&b===213);
}
function mhClothShade(r,g,b,rarity){if(rarity===4){const v=(.2126*r+.7152*g+.0722*b)/255,stops=[[52,27,12],[126,71,22],[200,139,48],[242,194,91],[255,237,176]],t=Math.min(3.999,Math.max(0,v*4.5)),i=Math.floor(t),f=t-i;return stops[i].map((c,k)=>Math.round(c+(stops[i+1][k]-c)*f));}const target=mhRarityClothRGB[rarity],max=Math.max(...target),min=Math.min(...target),delta=max-min;let h=0;if(delta){h=max===target[0]?((target[1]-target[2])/delta)%6:max===target[1]?(target[2]-target[0])/delta+2:(target[0]-target[1])/delta+4;h=(h/6+1)%1;}const l=Math.min(.86,.09+.84*(.2126*r+.7152*g+.0722*b)/255),sat=rarity===0?.08:Math.min(.9,delta/Math.max(1,max)+.18),a=sat*Math.min(l,1-l),f=n=>{const k=(n+h*12)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));};return [f(0),f(8),f(4)];}
function mhColorClothes(image,skin,rarity,portrait=false){const canvas=document.createElement('canvas');const scale=portrait?Math.min(1,384/Math.max(image.naturalWidth,image.naturalHeight)):1;canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const p=i/4;if(mhClothPixel(skin,d[i],d[i+1],d[i+2],p%canvas.width,Math.floor(p/canvas.width),portrait,canvas.width,canvas.height)){const undercloth=portrait&&skin==='swordsman'&&d[i+2]>d[i]*1.10&&d[i+2]>d[i+1]*1.12;const lift=undercloth?50:0;const rgb=mhClothShade(d[i]+lift,d[i+1]+lift,d[i+2]+lift,rarity);d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];}}ctx.putImageData(pixels,0,0);return canvas;}
async function mhPrepareHeroRarity(resolve=W){
 const ready=Promise.all(['swordsman','spearman','archer','mage'].flatMap(skin=>['idle','walk','attack'].map(async action=>{const image=new Image();image.src=resolve(`heroes/${skin}-${action}.png`);try{await image.decode();for(let rarity=0;rarity<6;rarity++){const key=`heroes/${skin}-${action}:${rarity}`,canvas=mhColorClothes(image,skin,rarity);mhHeroPalettes.set(key,canvas);mhHeroPaletteUrls.set(key,canvas.toDataURL());}}catch(e){console.warn('Paleta indisponível; mantendo sprite original:',skin,action,e);}}))).then(()=>{for(const node of document.querySelectorAll('[data-loading-hero]')){const key=`heroes/${node.dataset.loadingHero}-idle:${node.dataset.loadingRarity}`,src=mhHeroPaletteUrls.get(key),image=node.querySelector('img');if(src&&image)image.src=src;}document.documentElement.dataset.heroRarityPalettes=String(mhHeroPalettes.size);});
 if(typeof window!=='undefined')window.__mhHeroRarityReady=ready;
 await ready;
}
function mhHeroRarityUrl(skin,action,rarity){return mhHeroPaletteUrls.get(`heroes/${skin}-${action}:${rarity}`)??W(`heroes/${skin}-${action}.png`);}
function mhRarityCrop(renderer,key,rarity,x,y,w,h){const canvas=mhHeroPalettes.get(key+':'+rarity);if(!canvas)return renderer.crop(key,x,y,w,h);const variant=key+'-rarity-'+rarity;if(!renderer.textures.has(variant))renderer.textures.set(variant,P.from(canvas));return renderer.crop(variant,x,y,w,h);}
function mhRarityCodexUrl(skin,rarity){const key=skin+':'+rarity,base=new URL('./codex-'+skin+'-pixel.png',import.meta.url).href;if(mhCodexPaletteUrls.has(key))return mhCodexPaletteUrls.get(key);if(!mhCodexPaletteJobs.has(key)){const job=(async()=>{try{if(!mhCodexBaseImages.has(base)){const image=new Image();image.src=base;mhCodexBaseImages.set(base,image.decode().then(()=>image));}const image=await mhCodexBaseImages.get(base);const url=mhColorClothes(image,skin,rarity,true).toDataURL();mhCodexPaletteUrls.set(key,url);for(const node of document.querySelectorAll('[data-rarity-codex]'))if(node.dataset.rarityCodex===key)node.src=url;}catch(e){console.warn('Retrato original preservado:',key,e);}})();mhCodexPaletteJobs.set(key,job);}return base;}
const mhMythicReducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
function mhMythicTrail(renderer,actor,hero,time){
 if(hero.rarity!==5||!renderer.state?.rarityMovementEnabled||mhMythicReducedMotion?.matches){actor.mythicTrail?.clear();return;}
 if(!actor.mythicTrail){actor.mythicTrail=new nm();actor.container.addChildAt(actor.mythicTrail,0);actor.mythicTrailPoints=[];}
 const x=actor.container.x,y=actor.container.y;
 const previous=actor.mythicTrailPoints.at(-1);if(previous&&(time<previous.time||Math.hypot(x-previous.x,y-previous.y)>64)){actor.mythicTrailPoints=[];actor.mythicTrailAt=-1;}
 if(hero.action==='walk'&&hero.departedAt===null&&time-(actor.mythicTrailAt??-1)>.045){actor.mythicTrailAt=time;actor.mythicTrailPoints.push({x,y,time});}
 const points=actor.mythicTrailPoints=actor.mythicTrailPoints.filter(p=>time-p.time<.28).slice(-7),g=actor.mythicTrail;g.clear();
 for(let i=0;i<points.length;i++){const p=points[i],age=(time-p.time)/.28,alpha=(1-age)*.5,dx=Math.round(p.x-x),dy=Math.round(p.y-y);g.rect(dx-5,dy+5,10,2).fill({color:0xb31541,alpha});g.rect(dx+(i%2?3:-5),dy+2-Math.floor(age*9),2,3).fill({color:0xff4162,alpha:alpha*1.5});g.rect(dx-1,dy+4-Math.floor(age*4),2,2).fill({color:0xffd19b,alpha});}
}
function mhMythicCritical(renderer,fx,event,age){
 if(!event.crit||!renderer.state?.rarityMovementEnabled||mhMythicReducedMotion?.matches||age<0||age>.4)return;
 const hero=renderer.state.heroes.find(h=>h.id===event.heroId);if(hero?.rarity!==5)return;
 fx.text.style.fill=0xff96ae;const g=fx.spark,alpha=1-age/.4,radius=5+age*38;g.position.set(q(event.x),q(event.y));
 for(let i=0;i<8;i++){const angle=i*Math.PI/4,dx=Math.round(Math.cos(angle)*radius),dy=Math.round(Math.sin(angle)*radius);g.rect(dx-1,dy-1,3,3).fill({color:i%2?0xffc07a:0xff315c,alpha});g.rect(Math.round(dx*.65),Math.round(dy*.65),2,2).fill({color:0xffe4b8,alpha:alpha*.75});}
}
export {mhPrepareHeroRarity,mhHeroRarityUrl,mhClothPixel,mhClothShade};
