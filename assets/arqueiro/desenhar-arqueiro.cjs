// Arqueiro desenhado pixel a pixel.
// Capuz pontudo, cachecol, aljava no ombro e arco recurvo — silhueta própria,
// no mesmo retângulo do arqueiro original (x 11–20, y 9–18 no repouso; pés na linha 18).
// Tecido: somente (54,39,136), (86,83,187) e (123,146,213), que hero-rarity-client.js recolore.
const fs=require('fs'),path=require('path'),zlib=require('zlib');

const C={
  K:[0,0,0], D:[54,39,136], M:[86,83,187], L:[123,146,213],
  H:[250,203,166], S:[238,195,154], s:[221,183,143],
  W:[184,110,50], w:[142,72,35], b:[110,42,25], d:[83,5,5],
  h:[133,83,67], q:[106,83,63], e:[104,54,44], l:[187,158,121],
  '*':[255,255,255]
};

function blank(){return Array.from({length:32},()=>Array(32).fill(null));}
function clone(g){return g.map(row=>row.slice());}
function stamp(g,ox,oy,rows){
  rows.forEach((row,dy)=>{
    if(row.length!==rows[0].length) throw Error('Largura irregular: '+row);
    [...row].forEach((ch,dx)=>{
      if(ch==='.'||ch===' ') return;
      if(!C[ch]) throw Error('Cor desconhecida '+ch);
      const x=ox+dx,y=oy+dy;
      if(x<0||y<0||x>31||y>31) throw Error('Fora da célula '+x+','+y);
      g[y][x]=ch;
    });
  });
  return g;
}
function mirror(g){
  const o=blank();
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(g[y][x]) o[y][31-x]=g[y][x];
  return o;
}
function clearRect(g,x0,y0,x1,y1){
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) g[y][x]=null;
}
function put(g,pixels){
  for(const [x,y,ch] of pixels){
    if(x<0||y<0||x>31||y>31) throw Error('Fora da célula '+x+','+y);
    g[y][x]=ch;
  }
}
// Costas: o rosto vira capuz. Mãos, arco e flecha ficam.
function backView(g){
  const o=clone(g);
  for(let y=9;y<=13;y++) for(let x=12;x<=16;x++){
    const ch=o[y][x];
    if(!ch) continue;
    if('HSs'.includes(ch)) o[y][x]=(x+y)&1?'M':'D';
    else if(ch==='K'){
      const edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!o[y+dy]||!o[y+dy][x+dx]);
      if(!edge) o[y][x]='D';
    }
  }
  return o;
}

// x = 11 + índice. Capuz, rosto, aljava (branco+couro), túnica e arco recurvo na direita.
const frontIdle=[
  '..KMK.....',
  '.KLMDK....',
  'KLSsHDK...',
  'KMKsKDK.WK',
  'K*HsMLK.bK',
  'KhDMLKSSbK',
  '.KhMKhK.bK',
  '.Kh.Kh..bK',
  '..K..K..K.',
  '..K..KK...'
];
const frontUp=[
  '..KMK.....',
  '.KLMDK....',
  'KLMDMLK...',
  'KMLDMKK.WK',
  'K*bMLMK.bK',
  'KhDMLM.SbK',
  '.KhMK.K.bK',
  '.Kh.Kh..bK',
  '..K..K..K.',
  '..K..KK...'
];

function pose(rows,ox=11,oy=9){return stamp(blank(),ox,oy,rows);}
function shiftHood(g,dx){
  const src=clone(g);
  for(let y=9;y<=11;y++) for(let x=9;x<=19;x++) g[y][x]=null;
  for(let y=9;y<=11;y++) for(let x=9;x<=19;x++) if(src[y][x]) g[y][x+dx]=src[y][x];
}
function scarf(g){put(g,[[10,13,'K'],[10,14,'D'],[10,15,'K']]);}
function blink(g){g[12][13]='s';}

// Pernas de uma passada. O arco acompanha o quadril.
const strides=[
  ['.Kh.Kh..bK','..K..h...K','.....K....','.....KK...'],
  ['..KhKhK.K.','...K..K...','....K.K...','....KK....','....K.K...'],
  ['.hK..Kh.bK','..K...K..K','..K....K..','..KK......'],
  ['..h.K....K','...K.K....','....K.K...','....K.KK..','.....K....']
];
function shiftBand(g,y0,y1){
  const src=clone(g);
  for(let y=y0-1;y<=y1;y++) for(let x=0;x<32;x++) g[y][x]=null;
  for(let y=y0;y<=y1;y++) for(let x=0;x<32;x++) if(src[y][x]) g[y-1][x]=src[y][x];
}
function makeWalk(i){
  const g=pose(frontIdle);
  const bob=i===1||i===3;
  if(bob) shiftBand(g,9,14);
  clearRect(g,10,bob?14:15,22,18);
  stamp(g,11,bob?14:15,strides[i]);
  if(i===3) scarf(g);
  if(i===2) put(g,[[18,11,'W'],[19,11,'K'],[18,12,'w'],[19,12,'K']]);
  return g;
}

// Ataque, 12 quadros. A mesma flecha não some: sai da aljava, encaixa, desce
// até a horizontal, a corda puxa, e o quadro 8 (hitFrame) solta na horizontal.
function bow(g,pixels,quiver){
  clearRect(g,17,7,30,16);
  if(quiver) g[13][12]=quiver;
  put(g,pixels);
  return g;
}
function attackFront(){
  const hold=pose(frontIdle);
  const edge=[[17,11,'K'],[17,12,'K'],[17,13,'K'],[17,15,'K']];
  const hip=[
    [19,12,'W'],[20,12,'K'],
    [19,13,'b'],[20,13,'K'],
    [18,14,'S'],[19,14,'b'],[20,14,'K'],
    [19,15,'b'],[20,15,'K'],
    [19,16,'b'],[20,16,'K']
  ];
  // Arco na vertical. A fileira da flecha é desenhada por cima.
  const stave=(x,y0,y1)=>[
    [x,y0,'W'],[x+1,y0,'K'],
    ...Array.from({length:y1-y0},(_,i)=>[[x,y0+1+i,'b'],[x+1,y0+1+i,'K']]).flat(),
    [x+1,y1+1,'K']
  ];
  const frames=[clone(hold)];
  // 1. A mão tira a flecha da aljava. A haste ainda toca o bolso.
  frames.push(bow(clone(hold),[
    [9,12,'K'],[9,13,'K'],[9,14,'K'],[10,12,'K'],[10,15,'K'],
    [10,13,'*'],[11,13,'w'],[12,13,'w'],
    [10,14,'S'],
    ...hip, ...edge
  ]));
  // 2. Leva a flecha até o arco, ainda baixa, pronta para encaixar.
  frames.push(bow(clone(hold),[
    [15,13,'w'],[16,13,'w'],[17,13,'w'],[18,13,'*'],[18,14,'S'],
    [19,11,'W'],[20,11,'K'],
    [19,12,'w'],[20,12,'K'],
    [19,13,'b'],[20,13,'K'],
    [19,14,'b'],[20,14,'K'],
    [19,15,'b'],[20,15,'K'],
    [20,16,'K']
  ],'q'));
  // 3. Encaixa e sobe. A ponta fica acima do arco, sem soltar.
  frames.push(bow(clone(hold),[
    [21,7,'*'],
    [20,8,'w'],[21,8,'K'],
    [18,9,'W'],[19,9,'w'],[20,9,'b'],[21,9,'K'],
    [18,10,'b'],[19,10,'w'],[20,10,'K'],
    [17,11,'w'],[18,11,'b'],[19,11,'K'],
    [16,12,'S'],[17,12,'K'],[18,12,'b'],[19,12,'K'],
    [18,13,'b'],[19,13,'K'],
    [18,14,'b'],[19,14,'K'],
    [19,15,'K']
  ],'q'));
  // 4. A ponta desce. A flecha segue encaixada.
  frames.push(bow(clone(hold),[
    [20,9,'W'],[21,9,'K'],
    [19,10,'w'],[20,10,'b'],[21,10,'*'],
    [18,11,'w'],[19,11,'w'],[20,11,'b'],[21,11,'K'],
    [17,12,'w'],[18,12,'K'],[20,12,'b'],[21,12,'K'],
    [16,13,'S'],[17,13,'K'],[20,13,'b'],[21,13,'K'],
    [20,14,'b'],[21,14,'K'],
    [21,15,'K']
  ],'q'));
  // 5. Quase na horizontal: a ponta desce até encostar no arco.
  frames.push(bow(clone(hold),[
    ...stave(20,10,14),
    [17,12,'w'],[18,12,'w'],[19,12,'b'],[20,12,'w'],[21,12,'*'],
    [15,13,'K'],[16,13,'S'],[17,13,'K']
  ],'q'));
  // 6. Horizontal, na direção do personagem. Puxada curta.
  frames.push(bow(clone(hold),[
    ...stave(20,10,15),
    [16,13,'K'],[17,13,'S'],[18,13,'K'],[19,13,'w'],[20,13,'b'],[21,13,'*']
  ],'q'));
  // 7. Puxada cheia: a mão recua até o rosto e a flecha permanece no arco.
  frames.push(bow(clone(hold),[
    [19,10,'K'],[20,10,'W'],[21,10,'K'],
    [20,11,'w'],[21,11,'K'],
    [20,12,'b'],[21,12,'K'],
    [13,13,'K'],[14,13,'S'],[15,13,'K'],[16,13,'w'],[17,13,'w'],[18,13,'w'],[19,13,'b'],[20,13,'w'],[21,13,'*'],
    [20,14,'b'],[21,14,'K'],
    [19,15,'K'],[20,15,'w'],[21,15,'K'],
    [20,16,'K']
  ],'q'));
  // 8. hitFrame. A corda volta e a flecha sai na horizontal, separada do arco.
  frames.push(bow(clone(hold),[
    ...stave(20,10,15),
    [18,13,'S'],[19,13,'K'],[20,13,'b'],
    [23,13,'b'],[24,13,'w'],[25,13,'*']
  ],'q'));
  // 9. A flecha segue na mesma linha.
  frames.push(bow(clone(hold),[
    ...stave(20,10,15),
    [18,13,'S'],[19,13,'K'],
    [26,13,'b'],[27,13,'w'],[28,13,'*']
  ],'q'));
  // 10. Recuperação: o arco baixa e a flecha deixa o quadro pela horizontal.
  frames.push(bow(clone(hold),[
    ...hip, ...edge,
    [29,13,'w'],[30,13,'*']
  ],'q'));
  frames.push(clone(hold));
  if(frames.length!==12) throw Error('Ataque com '+frames.length+' quadros');
  return frames;
}

function buildFrames(){
  const idle=[];
  for(let f=0;f<16;f++){
    const front=pose(frontIdle);
    const back=pose(frontUp);
    if(f===3||f===5){blink(front); back[10][14]='L';}
    if(f>=8&&f<=15){
      const dx=f===13?-1:f%2?0:1;
      if(dx){shiftHood(front,dx); shiftHood(back,dx);}
    }
    if(f===9||f===11||f===13){scarf(front); scarf(back);}
    idle.push(front,mirror(front),back,mirror(back));
  }
  const walk=[];
  for(let i=0;i<4;i++){
    const front=makeWalk(i);
    walk.push(front,mirror(front),backView(front),mirror(backView(front)));
  }
  const attack=[];
  for(const front of attackFront()) attack.push(front,mirror(front),backView(front),mirror(backView(front)));
  return {idle,walk,attack};
}

function sheet(frames,width){
  const height=128,data=Buffer.alloc(width*height*4);
  frames.forEach((g,i)=>{
    const col=i%(width/32), row=Math.floor(i/(width/32));
    for(let y=0;y<32;y++) for(let x=0;x<32;x++){
      const ch=g[y][x]; if(!ch) continue;
      const o=((row*32+y)*width+(col*32+x))*4, rgb=C[ch];
      data[o]=rgb[0]; data[o+1]=rgb[1]; data[o+2]=rgb[2]; data[o+3]=255;
    }
  });
  return data;
}
function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xedb88320&-(c&1));}return (~c)>>>0;}
function writePng(file,width,height,data){
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4); ihdr[8]=8; ihdr[9]=6;
  const chunk=(type,payload)=>{const t=Buffer.from(type),len=Buffer.alloc(4);len.writeUInt32BE(payload.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,payload])));return Buffer.concat([len,t,payload,crc]);};
  const stride=width*4, raw=Buffer.alloc(height*(stride+1));
  for(let y=0;y<height;y++){raw[y*(stride+1)]=0; data.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);}
  fs.writeFileSync(file,Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
}
function bounds(g){
  let minx=32,miny=32,maxx=-1,maxy=-1,n=0,cloth=0,white=0;
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(g[y][x]){
    n++; if(x<minx)minx=x; if(y<miny)miny=y; if(x>maxx)maxx=x; if(y>maxy)maxy=y;
    if('DML'.includes(g[y][x])) cloth++;
    if(g[y][x]==='*') white++;
  }
  return {minx,miny,maxx,maxy,n,cloth,white};
}
function reorder(frames,count){
  const rows=[[],[],[],[]];
  for(let f=0;f<count;f++) for(let r=0;r<4;r++) rows[r].push(frames[f*4+r]);
  return rows.flat();
}
function draw(dir=path.join(__dirname)){
  const built=buildFrames();
  const idle=reorder(built.idle,16), walk=reorder(built.walk,4), attack=reorder(built.attack,12);
  for(const [name,frames,count] of [['idle',idle,16],['walk',walk,4],['attack',attack,12]]){
    for(let r=0;r<4;r++) for(let f=0;f<count;f++){
      const b=bounds(frames[r*count+f]);
      if(!b.cloth) throw Error(name+' sem tecido '+f+'/'+r);
      if(b.maxy!==18) throw Error(name+' pés em y'+b.maxy+' f'+f+' r'+r);
      if(b.n<48) throw Error(name+' raro demais f'+f+' r'+r+' n'+b.n);
    }
  }
  const idle0=bounds(idle[0]);
  if(idle0.minx!==11||idle0.maxx!==20||idle0.miny!==9||idle0.maxy!==18) throw Error('Pegada do repouso diferente da original '+JSON.stringify(idle0));
  for(let r=0;r<4;r++){
    for(let f=0;f<=10;f++){
      let has=false;
      const g=attack[r*12+f];
      for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(g[y][x]==='*') has=true;
      if(!has) throw Error('Flecha sumiu antes da recuperação f'+f+' r'+r);
    }
    const shot=attack[r*12+8];
    const stars=[];
    for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(shot[y][x]==='*') stars.push([x,y]);
    if(stars.length!==1) throw Error('Quadro 8 deve ter uma ponta');
    const [tip,ty]=stars[0];
    if(r%2===0&&tip<22) throw Error('Flecha pouco separada à direita');
    if(r%2===1&&tip>9) throw Error('Flecha pouco separada à esquerda');
    const shaft=r%2===0?shot[ty][tip-1]:shot[ty][tip+1];
    if(!shaft||shaft==='K') throw Error('Flecha do quadro 8 fora da horizontal, linha '+r);
    const gap=r%2===0?shot[ty][tip-3]:shot[ty][tip+3];
    if(gap) throw Error('Flecha do quadro 8 sem folga do arco, linha '+r);
  }
  fs.mkdirSync(dir,{recursive:true});
  writePng(path.join(dir,'archer-idle.png'),512,128,sheet(idle,512));
  writePng(path.join(dir,'archer-walk.png'),128,128,sheet(walk,128));
  writePng(path.join(dir,'archer-attack.png'),384,128,sheet(attack,384));
  return {idle,walk,attack};
}

if(require.main===module){
  const out=draw(path.join(__dirname));
  const show=(g,y0=7,y1=18)=>{
    for(let y=y0;y<=y1;y++){
      let line='';
      for(let x=8;x<=24;x++) line+=g[y][x]||'.';
      console.log(String(y).padStart(2),line);
    }
  };
  console.log('IDLE'); show(out.idle[0]);
  console.log('WALK'); for(let f=0;f<4;f++){console.log('f'+f); show(out.walk[f],8,18);}
  console.log('ATTACK'); for(const f of [0,2,5,7,8,9]){console.log('f'+f); show(out.attack[f],6,18);}
  console.log('bounds',bounds(out.idle[0]),bounds(out.attack[8]));
}
module.exports={draw,C};
