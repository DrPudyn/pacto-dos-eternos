// Ilha da loja, pixel a pixel, no mesmo recorte da ilha-castelo (1672×941).
// A arte ocupa o céu livre no canto superior esquerdo e uma corrente aponta
// para as ruínas do portal, sem pintar por cima da ilha principal.
const fs=require('fs'),path=require('path'),zlib=require('zlib');

const SCENE_W=1672,SCENE_H=941;
const OX=8,OY=6,W=392,H=214;

const C={
  out:[18,12,16],
  stoneHi:[238,222,198],stoneL:[214,192,164],stone:[172,148,124],stoneD:[112,90,74],stoneDk:[62,46,40],mortar:[86,68,58],
  plaster:[232,218,198],plasterD:[196,174,150],
  roofHi:[176,196,216],roofL:[118,146,178],roof:[68,94,132],roofD:[40,58,90],roofDk:[22,32,52],
  woodHi:[204,148,82],wood:[148,94,46],woodD:[92,54,26],woodDk:[48,28,14],
  goldHi:[255,238,180],gold:[232,178,62],goldD:[164,108,30],goldDk:[92,56,16],
  cloth:[22,48,112],clothL:[58,102,184],clothD:[12,28,68],
  grass:[64,132,52],grassL:[124,182,74],grassD:[32,78,34],leaf:[20,58,30],moss:[78,120,48],
  flame:[255,248,220],flameM:[255,178,46],flameD:[214,88,14],
  cryL:[232,252,255],cry:[120,214,255],cryD:[32,112,186],
  iron:[78,70,64],ironL:[168,156,140],
  potR:[188,36,44],potG:[36,150,70],potB:[46,92,204],potP:[132,52,176],glass:[214,238,248]
};

function mix(a,b,t){return[0,1,2].map(i=>Math.round(a[i]+(b[i]-a[i])*t));}
function hash(x,y){let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+1013904223)|0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return(~c)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const body=Buffer.concat([Buffer.from(type),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(body));return Buffer.concat([len,body,crc]);}
function readPng(p){
  const b=fs.readFileSync(p);let off=8,idat=[],meta={};
  while(off+8<=b.length){const len=b.readUInt32BE(off),type=b.slice(off+4,off+8).toString('ascii'),data=b.slice(off+8,off+8+len);
    if(type==='IHDR'){meta.w=data.readUInt32BE(0);meta.h=data.readUInt32BE(4);meta.color=data[9];}
    if(type==='IDAT')idat.push(data);if(type==='IEND')break;off+=12+len;}
  const raw=zlib.inflateSync(Buffer.concat(idat)),{w,h,color}=meta,bpp=color===6?4:3,stride=w*bpp,out=Buffer.alloc(w*h*4);
  let prev=Buffer.alloc(stride),i=0;
  const paeth=(a,bb,c)=>{const pp=a+bb-c,pa=Math.abs(pp-a),pb=Math.abs(pp-bb),pc=Math.abs(pp-c);return pa<=pb&&pa<=pc?a:pb<=pc?bb:c;};
  for(let y=0;y<h;y++){const filter=raw[i++],row=raw.subarray(i,i+stride);i+=stride;const recon=Buffer.alloc(stride);
    for(let x=0;x<stride;x++){const left=x>=bpp?recon[x-bpp]:0,up=prev[x],ul=x>=bpp?prev[x-bpp]:0;let v=row[x];
      if(filter===1)v=(v+left)&255;else if(filter===2)v=(v+up)&255;else if(filter===3)v=(v+((left+up)>>1))&255;else if(filter===4)v=(v+paeth(left,up,ul))&255;recon[x]=v;}
    if(color===6)recon.copy(out,y*w*4);else for(let x=0;x<w;x++){const o=(y*w+x)*4;out[o]=recon[x*3];out[o+1]=recon[x*3+1];out[o+2]=recon[x*3+2];out[o+3]=255;}
    prev=recon;}
  return{w,h,data:out};
}
function writePng(file,w,h,rgba){
  const raw=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;rgba.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]));
}

function createPainter(cut){
  const buf=Buffer.alloc(W*H*4);
  const blocked=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const sx=OX+x,sy=OY+y;
    if(sx<0||sy<0||sx>=cut.w||sy>=cut.h){blocked[y*W+x]=1;continue;}
    let hit=0;
    for(let dy=-2;dy<=2&&!hit;dy++)for(let dx=-2;dx<=2&&!hit;dx++){
      const xx=sx+dx,yy=sy+dy;
      if(xx<0||yy<0||xx>=cut.w||yy>=cut.h)continue;
      if(cut.data[(yy*cut.w+xx)*4+3]>36)hit=1;
    }
    blocked[y*W+x]=hit;
  }
  function plot(x,y,rgb,a=255){
    x=Math.round(x);y=Math.round(y);
    if(x<0||y<0||x>=W||y>=H||blocked[y*W+x])return;
    const i=(y*W+x)*4;
    if(a>=250||buf[i+3]===0){buf[i]=rgb[0];buf[i+1]=rgb[1];buf[i+2]=rgb[2];buf[i+3]=a;return;}
    const sa=a/255,da=buf[i+3]/255,oa=sa+da*(1-sa);
    buf[i]=Math.round((rgb[0]*sa+buf[i]*da*(1-sa))/oa);
    buf[i+1]=Math.round((rgb[1]*sa+buf[i+1]*da*(1-sa))/oa);
    buf[i+2]=Math.round((rgb[2]*sa+buf[i+2]*da*(1-sa))/oa);
    buf[i+3]=Math.round(oa*255);
  }
  function solid(x,y,rgb){plot(x,y,rgb,255);}
  function inside(){return buf;}
  return{plot,solid,buf,blocked};
}

function draw(p){
  const {solid,plot}=p;
  const rockBottom=new Int16Array(W).fill(-1);

  // Pedrinhas soltas no céu, à esquerda e à direita da loja.
  floatRock(16,124,28,16,true);
  floatRock(236,22,30,14,true);

  // Penhasco em lóbulos, com estratos e frestas — o mesmo miolo de pedra da ilha principal.
  for(let y=128;y<=200;y++){
    const t=Math.max(0,(y-134)/66);
    const cx=114+Math.sin(y*0.09)*5;
    const lobe=Math.sin((y-120)*0.13)*12+Math.sin((y-120)*0.31)*5;
    const half=Math.max(16,104*(1-t*0.55)+lobe+(hash(4,y)-0.5)*9);
    for(let x=cx-half;x<=cx+half;x++){
      const edge=Math.abs(x-cx)/half;
      if(t>0.35&&edge>0.72&&hash(Math.floor(x/4),Math.floor(y/5))>0.78)continue;
      const n=hash(x,y);
      const strata=Math.floor(y/5);
      let col=mix(C.stoneL,C.stoneD,Math.min(1,t*0.7+edge*0.35));
      if(hash(strata,2)>0.62)col=mix(col,C.stone,0.35);
      if(hash(strata,3)<0.18)col=mix(col,C.stoneDk,0.4);
      if(n>0.9)col=mix(col,C.stoneHi,0.4);
      if(n<0.04)col=C.stoneDk;
      if(x<cx-half*0.4)col=mix(col,C.stoneHi,0.12);
      if(Math.abs((x+strata*3)%13)<1)col=mix(col,C.stoneDk,0.5);
      solid(x,y,col);
      const rx=Math.round(x);
      if(rx>=0&&rx<W&&y>rockBottom[rx])rockBottom[rx]=Math.round(y);
    }
  }
  // Musgo na boca do penhasco.
  for(let x=40;x<200;x++){
    const lip=148+(hash(x,2)-0.5)*3;
    if(hash(x,4)>0.55)solid(x,lip,hash(x,5)>0.5?C.moss:C.grassD);
  }

  // Plataforma de pedra e gramado, vistos de leve de cima.
  for(let y=136;y<=158;y++)for(let x=28;x<=210;x++){
    const nx=(x-118)/108,ny=(y-146)/16;
    if(nx*nx+ny*ny>1)continue;
    const top=ny<0.15;
    if(top){
      const g=hash(x,y);
      let col=g>0.72?C.grassL:g<0.18?C.grassD:C.grass;
      if((x+y)%9===0)col=C.leaf;
      solid(x,y,col);
    }else{
      const slab=Math.floor((x+y)/8);
      let col=hash(slab,y)>0.5?C.stone:C.stoneD;
      if(ny>0.65)col=mix(col,C.stoneDk,0.4);
      if(Math.abs(ny-0.35)<0.08)col=C.mortar;
      solid(x,y,col);
    }
  }

  // Arbusto e pinheirinho à esquerda, como na ilha principal.
  pine(34,128,40);
  bush(52,142,11,C.grassD);
  bush(176,140,9,C.leaf);
  flowers(64,140);

  // Parede frontal de pedra, com fiadas desalinhadas.
  wall(62,92,178,150);
  // Parede lateral direita, um pouco mais escura, para a perspectiva.
  for(let y=100;y<=150;y++){
    const inset=Math.round((y-100)*0.18);
    for(let x=178;x<=196-inset;x++){
      const row=Math.floor((y-100)/6),off=(row&1)?4:0;
      const lx=(x+off)%9,ly=(y-100)%6;
      let col=lx===0||ly===0?C.stoneDk:hash(x,row)>0.6?C.stoneD:C.stone;
      if(x>188)col=mix(col,C.stoneDk,0.35);
      solid(x,y,col);
    }
  }

  // Viga de madeira sob o beiral e contrafortes.
  for(let x=58;x<=180;x++){solid(x,90,C.woodDk);solid(x,91,C.woodD);solid(x,92,C.wood);}
  for(let y=92;y<=150;y++){solid(60,y,C.stoneDk);solid(61,y,C.stoneD);solid(180,y,C.stoneD);solid(181,y,C.stoneDk);}

  // Telhado de duas águas, telhas azul-acinzentadas como a igreja.
  roof();
  // Toldo listrado do mercador.
  awning();

  // Porta em arco, janelas acesas, balcão de poções e baú.
  door(108,112,28,38);
  windowArch(78,108,20,22,true);
  windowArch(146,108,20,22,true);
  windowArch(184,114,10,14,false);
  steps();
  chest(46,132,22,16,true);
  counter(164,128);
  bottles(168,116);
  // Barril de madeira atrás do baú.
  barrel(40,136);

  // Lanternas: brilho primeiro, ferragem por cima.
  glow(112,104,18,150);
  glow(64,86,14,120);
  glow(174,84,14,120);
  glow(108,132,10,70);
  lantern(112,96);
  lantern(64,80);
  lantern(174,78);

  // Bandeira com moeda no cume.
  flag(124,4);
  // Corrente sobe para o céu livre e chega junto das ruínas do portal.
  chain(192,78,378,64,34);
  vines();
  grassBlades();

  // Cristais e um fio d'água sob a ilha.
  crystals();
  waterfall();
  sparkles();
  rim();
  outline();

  function wall(x0,y0,x1,y1){
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const row=Math.floor((y-y0)/5);
      const jitter=hash(row,7)>0.5?4:0;
      const span=8+Math.floor(hash(row,x>>3)*5);
      const lx=(x-x0+jitter)%span,ly=(y-y0)%5;
      const n=hash(Math.floor((x+jitter)/span),row);
      let col=n>0.75?C.stoneL:n<0.2?C.stoneD:mix(C.stone,C.stoneL,n*0.4);
      if(lx===0||ly===0)col=C.mortar;
      else{
        if(lx<2||ly===1)col=mix(col,C.stoneHi,0.42);
        if(lx>span-3||ly===4)col=mix(col,C.stoneDk,0.28);
      }
      if(y<112&&lx!==0&&ly!==0)col=mix(col,y<103?C.plaster:C.plasterD,0.78);
      // Luz quente vazando da porta e das janelas sobre a pedra.
      const doorD=Math.hypot(x-112,y-128),winL=Math.hypot(x-88,y-118),winR=Math.hypot(x-156,y-118);
      const spill=Math.max(0,1-doorD/28)*0.28+Math.max(0,1-winL/16)*0.22+Math.max(0,1-winR/16)*0.22;
      if(spill>0)col=mix(col,C.flameM,spill);
      solid(x,y,col);
    }
    // Vigas de enxaimel.
    for(let x=74;x<=166;x+=28)for(let y=94;y<=112;y++){solid(x,y,C.woodDk);solid(x+1,y,C.wood);}
    for(let x=64;x<=176;x++){solid(x,112,C.woodDk);solid(x,113,C.woodD);}
  }

  function roof(){
    const peakX=120,peakY=34,eaveY=90,left=52,right=186;
    for(let y=peakY;y<=eaveY;y++){
      const t=(y-peakY)/(eaveY-peakY);
      const xL=Math.round(peakX+(left-peakX)*t);
      const xR=Math.round(peakX+(right-peakX)*t);
      for(let x=xL;x<=xR;x++){
        const side=x<peakX?0:1;
        const row=Math.floor((y-peakY)/5);
        const off=(row&1)?4:0;
        const tile=(x+off)%7;
        const n=hash(x>>1,row);
        let col=side?C.roofD:C.roof;
        if(n>0.82)col=mix(col,C.roofL,0.55);
        if(n<0.08)col=mix(col,C.roofDk,0.65);
        if(tile<2)col=mix(col,side?C.roof:C.roofHi,0.75);
        if(tile>5)col=mix(col,C.roofDk,0.55);
        if((y-peakY)%4===0)col=mix(col,C.roofDk,0.6);
        if(y>eaveY-3)col=C.woodDk;
        if(n>0.93&&y<eaveY-6)col=mix(col,C.moss,0.7);
        solid(x,y,col);
      }
    }
    // Cumeeira e acabamento dourado.
    for(let y=peakY;y<=eaveY;y++){solid(peakX,y,C.roofHi);solid(peakX+1,y,C.roofL);}
    for(let x=left+2;x<right-1;x++){solid(x,eaveY-1,C.goldD);solid(x,eaveY,C.woodDk);}
    // Lucarna pequena, com caixilho, no lado iluminado.
    for(let y=50;y<=64;y++)for(let x=98;x<=112;x++){
      if(y<56&&Math.abs(x-105)>(64-y))continue;
      const frame=x===98||x===112||y===50||y===64||x===105||y===58;
      solid(x,y,frame?C.woodDk:mix(C.flame,C.goldHi,0.35));
    }
  }

  function awning(){
    for(let x=56;x<=182;x++){
      const scallop=(x%12)<6?0:Math.min(4,(x%12)-6);
      const stripe=Math.floor((x-56)/7)%2;
      const fold=(x-56)%7;
      for(let y=78;y<=98+scallop;y++){
        const hang=y-78;
        let col=stripe?C.cloth:C.gold;
        if(!stripe)col=hang<3?C.goldHi:C.gold;
        else col=hang<3?C.clothL:C.cloth;
        if(fold===0||fold===6)col=mix(col,stripe?C.clothD:C.goldDk,0.55);
        if(fold===3)col=mix(col,[255,255,255],stripe?0.08:0.18);
        if(hang>14)col=mix(col,C.roofDk,0.35);
        if(y>=96+scallop)col=C.goldD;
        if(x<60||x>178)col=C.goldDk;
        solid(x,y,col);
      }
    }
    // Cordas nas pontas e uma fila de moedinhas.
    for(let y=96;y<=132;y++){solid(58,y,C.goldD);solid(180,y,C.goldD);}
    for(let i=0;i<5;i++)coin(88+i*16,100,3);
  }

  function door(cx,y0,w,h){
    for(let y=y0;y<=y0+h;y++){
      const arch=y<y0+12?Math.sqrt(1-Math.pow((y0+12-y)/12,2))* (w/2):w/2;
      for(let x=cx-w/2-3;x<=cx+w/2+3;x++){
        const d=Math.abs(x-cx);
        if(d>arch+3)continue;
        if(d>arch){solid(x,y,y<y0+8?C.stoneHi:C.stoneL);continue;}
        const plank=Math.floor((x-(cx-w/2))/5);
        let col=plank%2?C.wood:C.woodD;
        if(hash(x,y)>0.9)col=C.woodDk;
        // Fresta de luz quente no centro.
        if(d<3&&y>y0+8)col=mix(C.flameM,C.gold,0.35);
        solid(x,y,col);
      }
    }
    // Dobradiças e aldabra.
    for(const hy of [y0+16,y0+30]){solid(cx-w/2+2,hy,C.ironL);solid(cx-w/2+3,hy,C.iron);solid(cx-w/2+4,hy,C.iron);}
    solid(cx+4,y0+22,C.gold);solid(cx+5,y0+22,C.goldHi);solid(cx+4,y0+23,C.goldD);
    // Arco de pedra mais claro.
    for(let a=0;a<=16;a++){
      const ang=Math.PI*(a/16);
      solid(cx+Math.cos(ang)*(w/2+4),y0+12-Math.sin(ang)*13,C.stoneHi);
    }
  }

  function windowArch(x,y,w,h,potions){
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
      const nx=(xx-x-w/2)/(w/2),ny=(yy-y-h*0.35)/(h*0.7);
      if(nx*nx+ny*ny>1&&yy<y+h*0.4)continue;
      const mullion=xx===x+Math.floor(w/2)||yy===y+Math.floor(h/2);
      if(mullion||xx===x||yy===y+h-1||xx===x+w-1)solid(xx,yy,C.woodDk);
      else{
        const glowpx=mix(C.flame,C.goldHi,hash(xx,yy));
        solid(xx,yy,mix(glowpx,[80,48,16],0.25));
      }
    }
    if(potions){
      bottle(x+4,y+h-9,8,C.potR);
      bottle(x+10,y+h-8,7,C.potB);
    }
    // Peitoril.
    for(let xx=x-1;xx<x+w+1;xx++)solid(xx,y+h,C.stoneL);
  }

  function steps(){
    for(let s=0;s<3;s++){
      const y=150+s*3,x0=96-s*3,x1=132+s*3;
      for(let x=x0;x<=x1;x++){solid(x,y,C.stoneL);solid(x,y+1,C.stone);solid(x,y+2,C.stoneD);}
    }
  }

  function chest(x,y,w,h,open){
    for(let yy=y+4;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
      let col=yy<y+7?C.wood:C.woodD;
      if(xx<x+2||xx>x+w-3)col=C.woodDk;
      if(yy===y+7||yy===y+h-1)col=C.goldD;
      solid(xx,yy,col);
    }
    // Tampa entreaberta.
    for(let yy=y;yy<y+6;yy++)for(let xx=x+1;xx<x+w-1;xx++){
      const col=yy<y+2?C.woodHi:C.wood;
      solid(xx,yy-(open?2:0),col);
    }
    for(let xx=x+3;xx<x+w-3;xx++)solid(xx,y+2,C.gold);
    solid(x+w/2,y+8,C.goldHi);solid(x+w/2-1,y+8,C.gold);solid(x+w/2,y+9,C.goldD);
    if(open){for(let xx=x+4;xx<x+w-4;xx++)solid(xx,y+4,xx%2?C.goldHi:C.flame);}
  }

  function barrel(x,y){
    for(let yy=0;yy<14;yy++)for(let xx=-6;xx<=6;xx++){
      if((xx/6)**2+((yy-7)/7)**2>1)continue;
      let col=Math.abs(xx)>4?C.woodDk:C.wood;
      if(yy===3||yy===10)col=C.iron;
      solid(x+xx,y+yy,col);
    }
    solid(x,y+6,C.ironL);
  }

  function counter(x,y){
    for(let xx=0;xx<28;xx++){solid(x+xx,y,C.woodHi);solid(x+xx,y+1,C.wood);solid(x+xx,y+2,C.woodD);}
    for(let yy=3;yy<12;yy++){solid(x+2,y+yy,C.woodDk);solid(x+24,y+yy,C.woodDk);}
  }

  function bottles(x,y){
    bottle(x,y,12,C.potG);
    bottle(x+7,y-2,14,C.potP);
    bottle(x+14,y+1,11,C.potR);
    bottle(x+20,y-1,13,C.potB);
  }

  function bottle(x,y,h,liquid){
    // Rolha, gargalo e bojo.
    solid(x,y,C.woodHi);solid(x,y+1,C.wood);
    solid(x,y+2,C.glass);solid(x,y+3,C.glass);
    for(let yy=4;yy<h;yy++){
      const fat=yy>h*0.45;
      const rad=fat?2:1;
      for(let xx=-rad;xx<=rad;xx++){
        let col=yy>h*0.55?liquid:mix(C.glass,liquid,0.35);
        if(xx===-rad)col=mix(col,[255,255,255],0.35);
        if(xx===rad)col=mix(col,[0,0,0],0.35);
        solid(x+xx,y+yy,col);
      }
    }
    solid(x-1,y+h-2,mix(liquid,C.glass,0.5));
  }

  function lantern(x,y){
    // Suporte, tampa, vidro e chama.
    solid(x,y,C.iron);solid(x,y+1,C.ironL);solid(x-1,y+1,C.iron);
    for(let xx=-3;xx<=3;xx++)solid(x+xx,y+2,xx===0?C.goldHi:C.goldD);
    for(let yy=3;yy<=8;yy++){
      solid(x-3,y+yy,C.goldD);solid(x+3,y+yy,C.goldD);
      const hot=yy<6;
      solid(x-1,y+yy,hot?C.flame:C.flameM);
      solid(x,y+yy,hot?C.flame:C.flameM);
      solid(x+1,y+yy,hot?C.goldHi:C.flameD);
      solid(x-2,y+yy,C.gold);
      solid(x+2,y+yy,C.goldD);
    }
    for(let xx=-3;xx<=3;xx++)solid(x+xx,y+9,C.goldDk);
    solid(x,y+10,C.goldD);solid(x,y+11,C.iron);
  }

  function glow(x,y,r,strength){
    for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){
      const d=Math.hypot(xx,yy);
      if(d>r)continue;
      const a=Math.round(strength*(1-d/r)*(1-d/r));
      if(a<8)continue;
      plot(x+xx,y+yy,d<r*0.35?C.flame:C.flameD,a);
    }
  }

  function coin(x,y,r){
    for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){
      if(xx*xx+yy*yy>r*r)continue;
      const edge=xx*xx+yy*yy>(r-1)*(r-1);
      let col=edge?C.goldDk:C.gold;
      if(xx<0&&yy<0&&!edge)col=C.goldHi;
      solid(x+xx,y+yy,col);
    }
    if(r>=3){solid(x,y-1,C.goldHi);solid(x,y,C.goldDk);solid(x,y+1,C.goldHi);}
  }

  function flag(x,y){
    // Mastro.
    for(let yy=0;yy<52;yy++){solid(x,y+yy,yy%6===0?C.goldD:C.woodDk);solid(x+1,y+yy,C.wood);}
    solid(x,y,C.goldHi);solid(x+1,y,C.gold);solid(x,y+1,C.goldD);
    const fw=48,fh=30;
    for(let yy=0;yy<fh;yy++){
      const wave=Math.round(Math.sin(yy*0.45)*1.2);
      const swallow=yy>6&&yy<fh-6?Math.round(Math.sin((yy-6)/(fh-12)*Math.PI)*8):0;
      for(let xx=0;xx<fw-swallow;xx++){
        const px=x+4+xx+wave,py=y+4+yy;
        const border=xx<2||yy<2||yy>fh-3||xx>fw-swallow-3;
        let col=border?C.gold:((xx>>3)&1)?C.cloth:C.clothL;
        if(!border&&yy>fh-8)col=mix(col,C.clothD,0.45);
        // Dobra de tecido.
        if(!border&&Math.abs(xx-18-wave*2)<2)col=mix(col,C.clothD,0.35);
        solid(px,py,col);
      }
    }
    coin(x+26,y+16,7);
    // Estrela de quatro pontas sobre a moeda, em baixo-relevo claro.
    solid(x+26,y+13,C.goldHi);solid(x+26,y+19,C.goldHi);solid(x+23,y+16,C.goldHi);solid(x+29,y+16,C.goldHi);
    solid(x+26,y+16,C.flame);
  }

  function chain(x0,y0,x1,y1,n){
    for(let i=0;i<n;i++){
      const t=(i+0.5)/n;
      const x=x0+(x1-x0)*t,y=y0+(y1-y0)*t-Math.sin(t*Math.PI)*14;
      const horiz=i%2===0,rx=horiz?5:2.4,ry=horiz?2.4:5;
      for(let yy=Math.floor(-ry);yy<=ry;yy++)for(let xx=Math.floor(-rx);xx<=rx;xx++){
        const d=Math.hypot(xx/rx,yy/ry);
        if(d>1||d<0.48)continue;
        solid(x+xx,y+yy,(xx+yy)<0?C.ironL:C.iron);
      }
    }
  }

  function floatRock(cx,cy,rx,ry,grass){
    for(let y=cy-ry-8;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){
      const nx=(x-cx)/rx,ny=(y-cy)/ry;
      if(nx*nx+ny*ny>1)continue;
      const t=(ny+1)/2;
      let col=mix(C.stoneL,C.stoneDk,Math.min(1,t));
      if(hash(x,y)>0.8)col=mix(col,C.stone,0.5);
      if(grass&&ny<-0.35)col=hash(x,y)>0.4?C.grass:C.grassD;
      solid(x,y,col);
    }
  }

  function pine(x,base,h){
    for(let i=0;i<3;i++){
      const y0=base-h+ i*10,rad=7+i*3;
      for(let yy=0;yy<12;yy++){
        const r=Math.round(rad*(yy/12));
        for(let xx=-r;xx<=r;xx++){
          let col=xx<-1?C.grassL:xx>r-2?C.leaf:C.grassD;
          solid(x+xx,y0+yy,col);
        }
      }
    }
    for(let yy=0;yy<8;yy++){solid(x,base-6+yy,C.woodDk);solid(x+1,base-6+yy,C.wood);}
  }

  function bush(x,y,r,col){
    for(let yy=-r/2;yy<=r/3;yy++)for(let xx=-r;xx<=r;xx++){
      if((xx/r)**2+(yy/(r*0.6))**2>1)continue;
      solid(x+xx,y+yy,hash(x+xx,y+yy)>0.6?C.grassL:col);
    }
  }

  function flowers(x,y){
    const cols=[C.potR,C.gold,C.cry,C.potP];
    for(let i=0;i<4;i++){solid(x+i*3,y,cols[i]);solid(x+i*3,y+1,C.grassD);}
  }

  function crystals(){
    const spots=[[72,14],[98,22],[126,16],[154,12]];
    for(const [x,len] of spots){
      let y=rockBottom[x];
      if(y<0)y=rockBottom[x-1]||rockBottom[x+1];
      if(y<0)continue;
      for(let i=0;i<len;i++){
        const w=Math.max(1,Math.round((1-i/len)*4));
        for(let xx=-w;xx<=w;xx++){
          let col=xx===-w?C.cryL:xx===w?C.cryD:C.cry;
          if(xx===-w+1)col=C.cryL;
          solid(x+xx,y+2+i,col);
        }
      }
      plot(x-1,y+4,C.cryL,180);
    }
  }

  function vines(){
    const path=[[64,100],[63,108],[66,116],[64,124],[68,132],[70,140]];
    for(const [x,y] of path){
      solid(x,y,C.leaf);solid(x+1,y,C.grassD);solid(x,y+1,C.grass);
      if(hash(x,y)>0.4)solid(x-2,y,C.grassL);
    }
  }

  function grassBlades(){
    for(let x=40;x<190;x+=3){
      if(hash(x,11)<0.45)continue;
      const y=140+Math.round((hash(x,12)-0.5)*4);
      solid(x,y,C.grassL);solid(x,y-1,C.grass);solid(x+(hash(x,13)>0.5?1:-1),y-2,C.grassL);
    }
  }

  function waterfall(){
    let y=rockBottom[70];
    if(y<0)return;
    for(let i=0;i<16;i++){
      const x=70+Math.round(Math.sin(i*0.6));
      solid(x,y+i,i%3?C.cry:C.cryL);
      plot(x+1,y+i,C.cry,140);
    }
  }

  function sparkles(){
    const pts=[[150,18],[40,70],[200,40],[96,70],[230,24]];
    for(const [x,y] of pts){
      solid(x,y,C.goldHi);plot(x-1,y,C.gold,160);plot(x+1,y,C.gold,160);plot(x,y-1,C.gold,160);plot(x,y+1,C.gold,160);
    }
  }

  function outline(){
    // Contorno por fora do desenho, para não apagar cristal, corrente nem fio d'água.
    const src=Buffer.from(p.buf);
    const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      if(src[(y*W+x)*4+3]>20)continue;
      if(!dirs.some(([dx,dy])=>src[((y+dy)*W+x+dx)*4+3]>210))continue;
      solid(x,y,C.out);
    }
  }

  function rim(){
    // Luz fria da lua na borda superior esquerda; o contorno escuro fica por baixo.
    const src=Buffer.from(p.buf);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      const i=(y*W+x)*4;
      if(src[i+3]<240)continue;
      const upL=src[((y-1)*W+x-1)*4+3]<20;
      if(!upL)continue;
      const rgb=mix([src[i],src[i+1],src[i+2]],[186,206,228],0.28);
      solid(x,y,rgb);
    }
  }
}

function cropAndPlace(buf){
  let minx=W,miny=H,maxx=0,maxy=0,n=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(buf[(y*W+x)*4+3]<12)continue;
    n++;if(x<minx)minx=x;if(y<miny)miny=y;if(x>maxx)maxx=x;if(y>maxy)maxy=y;
  }
  if(n<2500)throw new Error('Ilha da loja ficou simples demais ('+n+' pixels).');
  const pad=2;
  minx=Math.max(0,minx-pad);miny=Math.max(0,miny-pad);maxx=Math.min(W-1,maxx+pad);maxy=Math.min(H-1,maxy+pad);
  const w=maxx-minx+1,h=maxy-miny+1,out=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++)buf.copy(out,(y*w)*4,((miny+y)*W+minx)*4,((miny+y)*W+minx+w)*4);
  const left=(OX+minx)/SCENE_W*100,top=(OY+miny)/SCENE_H*100,width=w/SCENE_W*100;
  return{rgba:out,w,h,left,top,width,opaque:n};
}

function patchCss(place){
  const file=path.join(__dirname,'refuge.css');
  let css=fs.readFileSync(file,'utf8');
  const set=(name,value)=>{
    const re=new RegExp('(--'+name+':)\\s*[^;]+');
    if(!re.test(css))throw new Error('refuge.css sem --'+name);
    css=css.replace(re,'$1'+value);
  };
  set('shop-left',place.left.toFixed(3)+'%');
  set('shop-top',place.top.toFixed(3)+'%');
  set('shop-width',place.width.toFixed(3)+'%');
  fs.writeFileSync(file,css);
}

function enlarge(rgba,w,h,scale){
  const W2=w*scale,H2=h*scale,out=Buffer.alloc(W2*H2*4);
  const sky=[7,18,42];
  for(let y=0;y<H2;y++)for(let x=0;x<W2;x++){
    const sx=Math.floor(x/scale),sy=Math.floor(y/scale),s=(sy*w+sx)*4,d=(y*W2+x)*4;
    const a=rgba[s+3]/255;
    out[d]=Math.round(rgba[s]*a+sky[0]*(1-a));
    out[d+1]=Math.round(rgba[s+1]*a+sky[1]*(1-a));
    out[d+2]=Math.round(rgba[s+2]*a+sky[2]*(1-a));
    out[d+3]=255;
  }
  return{rgba:out,w:W2,h:H2};
}

function composite(cut,sky,island){
  const rgba=Buffer.from(sky.data);
  for(let y=0;y<cut.h;y++)for(let x=0;x<cut.w;x++){
    const i=(y*cut.w+x)*4,a=cut.data[i+3]/255;
    if(!a)continue;
    rgba[i]=Math.round(cut.data[i]*a+rgba[i]*(1-a));
    rgba[i+1]=Math.round(cut.data[i+1]*a+rgba[i+1]*(1-a));
    rgba[i+2]=Math.round(cut.data[i+2]*a+rgba[i+2]*(1-a));
    rgba[i+3]=255;
  }
  const ox=Math.round(island.left/100*SCENE_W),oy=Math.round(island.top/100*SCENE_H);
  let overlap=0;
  for(let y=0;y<island.h;y++)for(let x=0;x<island.w;x++){
    const s=(y*island.w+x)*4,a=island.rgba[s+3]/255;
    if(a<0.15)continue;
    const dx=ox+x,dy=oy+y;
    if(dx<0||dy<0||dx>=SCENE_W||dy>=SCENE_H)continue;
    const di=(dy*SCENE_W+dx)*4;
    if(cut.data[di+3]>36)overlap++;
    rgba[di]=Math.round(island.rgba[s]*a+rgba[di]*(1-a));
    rgba[di+1]=Math.round(island.rgba[s+1]*a+rgba[di+1]*(1-a));
    rgba[di+2]=Math.round(island.rgba[s+2]*a+rgba[di+2]*(1-a));
    rgba[di+3]=255;
  }
  return{rgba,overlap};
}

function main(){
  // A loja é a tenda pintada no próprio recorte do Refúgio. Este gerador
  // não recria o recorte antigo, que parecia colado por cima do cenário.
  return;
  const cut=readPng(path.join(__dirname,'assets/refuge-cutout.png'));
  const sky=readPng(path.join(__dirname,'assets/refuge-sky.png'));
  const painter=createPainter(cut);
  draw(painter);
  const place=cropAndPlace(painter.buf);
  const out=path.join(__dirname,'assets/refuge-shop-island.png');
  writePng(out,place.w,place.h,place.rgba);
  patchCss(place);
  const comp=composite(cut,sky,{...place,rgba:place.rgba});
  if(comp.overlap>40)throw new Error('A ilha da loja cobre a ilha principal ('+comp.overlap+' px).');
  const artDir='/opt/cursor/artifacts';
  fs.mkdirSync(artDir,{recursive:true});
  const big=enlarge(place.rgba,place.w,place.h,3);
  writePng(path.join(artDir,'ilha-loja-ampliada.png'),big.w,big.h,big.rgba);
  writePng(path.join(artDir,'refugio-com-ilha-loja.png'),SCENE_W,SCENE_H,comp.rgba);
  console.log('Ilha da loja',place.w+'x'+place.h,'opacos',place.opaque,'sobreposição',comp.overlap);
  console.log('posição left',place.left.toFixed(3)+'%','top',place.top.toFixed(3)+'%','width',place.width.toFixed(3)+'%');
}

if(require.main===module)main();
module.exports={main};
