const fs=require('fs'),path=require('path'),zlib=require('zlib');
const W=64,H=64;
function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return (c^0)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const body=Buffer.concat([Buffer.from(type),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(body));return Buffer.concat([len,body,crc]);}
function pixel(x,y){
 const cx=32,cy=32,d=Math.hypot(x-cx,y-cy);
 if(d>28)return [0,0,0,0];
 if(d>24&&d<28){const t=(d-24)/4;return [255,230,140,Math.floor(180*(1-t))];}
 const roof=y<20;
 if(roof){if(y<8)return [180,60,50,255];return [210,90,70,255];}
 if(x>20&&x<44&&y>24&&y<46)return [80,160,220,255];
 if(x>26&&x<38&&y>30&&y<40)return [40,90,140,255];
 return [60,75,95,255];
}
const raw=Buffer.alloc((W*H+ H)*4);
let o=0;for(let y=0;y<H;y++){raw[o++]=0;for(let x=0;x<W;x++){const [r,g,b,a]=pixel(x,y);raw[o++]=r;raw[o++]=g;raw[o++]=b;raw[o++]=a;}}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
// A placa da loja usa assets/loja-saco.png, pintado à parte. Este gerador
// não reescreve mais o ícone cru por cima da arte.
console.log('Ícone da loja preservado');
