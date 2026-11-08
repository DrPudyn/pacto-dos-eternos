// Cards da loja em 96×96, pixel a pixel, na paleta do refúgio.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const S=96;
function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return (~c)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const body=Buffer.concat([Buffer.from(type),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(body));return Buffer.concat([len,body,crc]);}
function writePng(file,buf){
 const raw=Buffer.alloc((S*4+1)*S);
 for(let y=0;y<S;y++){raw[y*(S*4+1)]=0;buf.copy(raw,y*(S*4+1)+1,y*S*4,(y+1)*S*4);}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(S,0);ihdr.writeUInt32BE(S,4);ihdr[8]=8;ihdr[9]=6;
 fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]));
}
const canvas=()=>Buffer.alloc(S*S*4);
function plot(buf,x,y,rgb,a=255){
 x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=S||y>=S||a<=0)return;
 const i=(y*S+x)*4;if(buf[i+3]&&a<250)return;
 buf[i]=rgb[0];buf[i+1]=rgb[1];buf[i+2]=rgb[2];buf[i+3]=a;
}
function fill(buf,x0,y0,x1,y1,rgb){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)plot(buf,x,y,rgb);}
function disc(buf,cx,cy,r,rgb){const r2=r*r;for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if((x-cx)**2+(y-cy)**2<=r2)plot(buf,x,y,rgb);}
function ring(buf,cx,cy,r0,r1,rgb){for(let y=cy-r1;y<=cy+r1;y++)for(let x=cx-r1;x<=cx+r1;x++){const d=(x-cx)**2+(y-cy)**2;if(d>=r0*r0&&d<=r1*r1)plot(buf,x,y,rgb);}}
function glow(buf,cx,cy,r,rgb){for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){const d=Math.hypot(x-cx,y-cy);if(d<r&&((x+y)&1)===0)plot(buf,x,y,rgb,Math.round(70*(1-d/r)));}}
const G={hi:[255,236,170],mid:[232,178,62],lo:[164,108,28],dk:[92,56,16]};
const wood={hi:[196,132,70],mid:[138,82,40],lo:[86,48,22],dk:[46,26,12]};
const wax={hi:[150,196,255],mid:[52,96,186],lo:[24,48,120]};
const ink=[10,18,40];
function glyph(buf,ch,x,y,rgb){
 const font={
  '-':['###','...','...','...','...'],
  '1':['.#.','##.','.#.','.#.','###'],
  '5':['###','#..','###','..#','###'],
  '%':['#.#','..#','.#.','#..','#.#']
 };
 const rows=font[ch];if(!rows)return;
 rows.forEach((row,dy)=>[...row].forEach((bit,dx)=>{if(bit==='#'){plot(buf,x+dx,y+dy,rgb);}}));
}
function banner(buf,x,y){
 fill(buf,x,y,x+27,y+8,[120,22,36]);
 fill(buf,x,y,x+27,y,[255,210,150]);
 fill(buf,x,y+8,x+27,y+8,[70,12,22]);
 let cursor=x+2;
 for(const ch of '-15%'){glyph(buf,ch,cursor,y+2,[255,244,220]);cursor+=4;}
}
function sealBody(buf,cx,cy,scale){
 const R=Math.round(22*scale);
 glow(buf,cx,cy,R+8,G.mid);
 ring(buf,cx,cy,R-1,R+3,G.lo);
 ring(buf,cx,cy,R-4,R-1,G.mid);
 ring(buf,cx,cy,R-6,R-4,G.hi);
 disc(buf,cx,cy,R-6,wax.mid);
 disc(buf,cx-4,cy-5,Math.max(4,R-12),wax.hi);
 for(let a=0;a<8;a++){const t=a/8*Math.PI*2;disc(buf,cx+Math.cos(t)*(R-1),cy+Math.sin(t)*(R-1),1,a%2?G.hi:G.dk);}
 const s=scale;
 const hx=cx,hy=cy-Math.round(6*s);
 disc(buf,hx,hy,Math.round(3.2*s),G.hi);
 fill(buf,hx-Math.round(4*s),hy+Math.round(3*s),hx+Math.round(4*s),hy+Math.round(10*s),G.mid);
 fill(buf,hx-Math.round(7*s),hy+Math.round(4*s),hx-Math.round(4*s),hy+Math.round(9*s),G.lo);
 fill(buf,hx+Math.round(3*s),hy+Math.round(5*s),hx+Math.round(5*s),hy+Math.round(14*s),G.hi);
 fill(buf,hx+Math.round(2*s),hy+Math.round(5*s),hx+Math.round(8*s),hy+Math.round(7*s),G.lo);
 fill(buf,hx-Math.round(2*s),hy+Math.round(10*s),hx,hy+Math.round(16*s),G.lo);
 fill(buf,hx+1,hy+Math.round(10*s),hx+Math.round(3*s),hy+Math.round(16*s),G.dk);
}
function ribbons(buf,cx,cy){
 fill(buf,cx-16,cy+16,cx-6,cy+20,G.mid);
 fill(buf,cx-18,cy+20,cx-10,cy+30,G.lo);
 fill(buf,cx-16,cy+20,cx-12,cy+28,G.hi);
 fill(buf,cx+6,cy+16,cx+16,cy+20,G.mid);
 fill(buf,cx+10,cy+20,cx+18,cy+30,G.lo);
 fill(buf,cx+12,cy+20,cx+16,cy+28,G.hi);
 fill(buf,cx-4,cy+14,cx+4,cy+20,G.dk);
}
function drawSeal(buf){sealBody(buf,48,40,1.15);ribbons(buf,48,40);}
function drawChest(buf,x,y,w,h){
 fill(buf,x+2,y+h,x+w-2,y+h+3,ink);
 fill(buf,x,y+8,x+w,y+h,wood.mid);
 fill(buf,x,y+8,x+3,y+h,wood.hi);
 fill(buf,x+w-4,y+8,x+w,y+h,wood.lo);
 fill(buf,x,y,x+w,y+10,wood.hi);
 fill(buf,x,y,x+w,y+3,wood.hi);
 fill(buf,x,y+8,x+w,y+11,G.mid);
 fill(buf,x,y+h-4,x+w,y+h-2,G.lo);
 const lock=x+Math.floor(w/2);
 fill(buf,lock-2,y,lock+2,y+h,G.lo);
 fill(buf,lock-1,y+1,lock+1,y+6,G.hi);
 disc(buf,lock,y+Math.floor(h*0.62),3,G.hi);
 disc(buf,lock,y+Math.floor(h*0.62),1,G.dk);
 for(let i=4;i<w-2;i+=5)plot(buf,x+i,y+2,wood.lo);
}
function drawSword(buf,x,y){
 for(let i=0;i<26;i++){plot(buf,x+i,y-i,G.hi);plot(buf,x+i+1,y-i,[236,236,246]);plot(buf,x+i+1,y-i+1,G.mid);}
 fill(buf,x-1,y+1,x+9,y+4,wood.dk);
 fill(buf,x,y+2,x+8,y+3,G.mid);
 fill(buf,x+3,y+4,x+5,y+12,wood.mid);
 disc(buf,x+4,y+13,2,G.hi);
}
function drawWeapon(buf){
 glow(buf,50,54,34,[255,170,40]);
 drawChest(buf,20,42,56,30);
 drawSword(buf,38,48);
 fill(buf,16,76,80,79,[40,32,28]);
}
function drawPack(buf){
 glow(buf,48,52,36,G.mid);
 drawChest(buf,12,46,46,28);
 sealBody(buf,70,40,0.72);
 fill(buf,44,30,52,40,G.lo);
 fill(buf,30,26,48,32,G.mid);
 fill(buf,48,26,66,32,G.hi);
 fill(buf,46,26,50,40,G.dk);
 fill(buf,32,24,40,26,G.hi);
 fill(buf,56,24,64,26,G.hi);
 banner(buf,8,8);
}
function main(){
 // O selo, a espada e o baú -15% são pintura pronta em assets/. Redesenhar
 // aqui devolveria os ícones simples por cima dessa arte.
 return;
 const dir=path.join(__dirname,'assets');
 for(const [name,draw] of [['loja-selo.png',drawSeal],['loja-arma.png',drawWeapon],['loja-pacote.png',drawPack]]){
  const buf=canvas();draw(buf);writePng(path.join(dir,name),buf);
 }
 fs.copyFileSync(path.join(dir,'loja-pacote.png'),path.join(dir,'loja-welcome.png'));
 console.log('Artes da loja refeitas');
}
if(require.main===module)main();
module.exports={main};
