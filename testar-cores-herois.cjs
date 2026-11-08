const fs=require('fs'),zlib=require('zlib'),vm=require('vm'),assert=require('node:assert/strict');
function readPng(file){const b=fs.readFileSync(file),width=b.readUInt32BE(16),height=b.readUInt32BE(20);assert.equal(b[24],8);assert.equal(b[25],6);let parts=[],p=8;while(p<b.length){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')parts.push(b.subarray(p+8,p+8+n));p+=n+12;}const raw=zlib.inflateSync(Buffer.concat(parts)),stride=width*4,data=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){const a=x>=4?data[y*stride+x-4]:0,c=y?data[(y-1)*stride+x]:0,d=y&&x>=4?data[(y-1)*stride+x-4]:0;let predictor=0;if(filter===1)predictor=a;if(filter===2)predictor=c;if(filter===3)predictor=(a+c)>>1;if(filter===4){const n=a+c-d,pa=Math.abs(n-a),pb=Math.abs(n-c),pc=Math.abs(n-d);predictor=pa<=pb&&pa<=pc?a:pb<=pc?c:d;}data[y*stride+x]=(raw[y*(stride+1)+1+x]+predictor)&255;}}return {naturalWidth:width,naturalHeight:height,data};}
function nearest(image,w,h){const sw=image.naturalWidth,sh=image.naturalHeight,data=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=Math.min(sw-1,Math.floor(x*sw/w)),sy=Math.min(sh-1,Math.floor(y*sh/h)),s=(sy*sw+sx)*4,o=(y*w+x)*4;data[o]=image.data[s];data[o+1]=image.data[s+1];data[o+2]=image.data[s+2];data[o+3]=image.data[s+3];}return data;}
const document={createElement(){const canvas={width:0,height:0};canvas.getContext=()=>({imageSmoothingEnabled:false,drawImage(image,dx,dy,dw,dh){const w=dw||image.naturalWidth,h=dh||image.naturalHeight;canvas.data=nearest(image,w,h);},getImageData(){return {data:new Uint8ClampedArray(canvas.data)};},putImageData(image){canvas.data=image.data;}});return canvas;}};
const code=fs.readFileSync('hero-rarity-client.js','utf8').split('async function mhPrepareHeroRarity')[0],context={document};vm.createContext(context);vm.runInContext(code+';this.color=mhColorClothes;',context);
let variants=0;
for(const skin of ['swordsman','spearman','archer','mage'])for(const action of ['idle','walk','attack']){const root='minihero-offline/build',file=fs.readdirSync(root).find(n=>n.startsWith(skin+'-'+action)&&n.endsWith('.png')),image=readPng(root+'/'+file),palettes=[];for(let rarity=0;rarity<6;rarity++){const out=context.color(image,skin,rarity);assert.equal(out.width,image.naturalWidth);assert.equal(out.height,image.naturalHeight);let changed=0;for(let i=0;i<image.data.length;i+=4){assert.equal(out.data[i+3],image.data[i+3],'Alpha changed');const rgb=Array.from(image.data.slice(i,i+3)),protectedColor=['000000','facba6','eec39a','ddb78f','855343','814d29','612e1a','ffffff'].includes(Buffer.from(rgb).toString('hex'));if(protectedColor)assert.deepEqual(Array.from(out.data.slice(i,i+3)),rgb,'Protected skin/hair/weapon color changed');if(out.data[i]!==rgb[0]||out.data[i+1]!==rgb[1]||out.data[i+2]!==rgb[2])changed++;}assert(changed>0,skin+' '+action+' no clothes recolored');palettes.push(Buffer.from(out.data).toString('base64'));variants++;}assert.equal(new Set(palettes).size,6,'Rarities must differ');}
console.log('OK:',variants,'variantes; 4 classes × 3 animações × 6 raridades; dimensões, transparência, pele, cabelo, metais e cores distintas preservados.');

// Portrait regression: the client scales the codex art to 384px before recoloring.
// Compare that same nearest-neighbor buffer, or the navy underlayer is sampled off the cloth.
const portrait=readPng('minihero-offline/build/codex-swordsman-pixel.png');
const portraitScale=Math.min(1,384/Math.max(portrait.naturalWidth,portrait.naturalHeight));
const portraitW=Math.round(portrait.naturalWidth*portraitScale),portraitH=Math.round(portrait.naturalHeight*portraitScale);
const portraitBase=nearest(portrait,portraitW,portraitH);
for(let rarity=0;rarity<6;rarity++){
 const out=context.color(portrait,'swordsman',rarity,true);let navyChanged=0;
 assert.equal(out.width,portraitW);assert.equal(out.height,portraitH);
 for(let i=0;i<portraitBase.length;i+=4){
  const [r,g,b,a]=portraitBase.slice(i,i+4);assert.equal(out.data[i+3],a);
  if(a&&b>=24&&b<115&&b>r*1.10&&b>g*1.12&&(out.data[i]!==r||out.data[i+1]!==g||out.data[i+2]!==b))navyChanged++;
  if(r===0&&g===0&&b===0)assert.deepEqual(Array.from(out.data.slice(i,i+3)),[0,0,0]);
 }
 assert(navyChanged>100,'Swordsman underlayer missing for rarity '+rarity);
}
console.log('OK: tecido sob a armadura do retrato recolorido nas seis raridades; transparência e preto puro preservados.');
