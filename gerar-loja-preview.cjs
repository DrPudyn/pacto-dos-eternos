const fs=require('fs'),path=require('path'),zlib=require('zlib');
const W=480,H=320;
function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return (c^0)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const body=Buffer.concat([Buffer.from(type),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(body));return Buffer.concat([len,body,crc]);}
function px(x,y){
 if(x<20||x>W-20||y<20||y>H-20)return [12,18,24,255];
 if(y<70)return [35,45,58,255];
 if(x>40&&x<440&&y>90&&y<280){
  const col=Math.floor((x-40)/130);
  if(y<120)return [180,60,50,255];
  if((x+7*y)%23===0)return [230,190,90,255];
  return [28,36,48,255];
 }
 return [18,24,32,255];
}
const raw=Buffer.alloc((W*H+H)*4);let o=0;
for(let y=0;y<H;y++){raw[o++]=0;for(let x=0;x<W;x++){const [r,g,b,a]=px(x,y);raw[o++]=r;raw[o++]=g;raw[o++]=b;raw[o++]=a;}}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const dir=path.join(__dirname,'/opt/cursor/artifacts');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'loja-tela-preview.png'),png);
fs.copyFileSync(path.join(__dirname,'assets/loja-store-icon.png'),path.join(dir,'loja-icone-store.png'));
console.log('Prévias em /opt/cursor/artifacts/');
