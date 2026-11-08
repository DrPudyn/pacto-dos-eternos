// Espadachim desenhado pixel a pixel.
// Elmo redondo com crista, mecha de cabelo, tabardo, escudo aquecido e
// espada reta de guarda cruzada — silhueta própria, no mesmo retângulo
// do espadachim original (x 11–22, y 10–18 no repouso; pés na linha 18).
// Repouso, caminhada e ataque seguem as quatro diagonais do motor
// (baixo-direita, baixo-esquerda, cima-direita, cima-esquerda):
// Ry.swordsman é diagonal, e o repouso também usa facingRow diagonal.
// Ataque com 6 quadros e hitFrame 3. O corte prepara, passa em arco e
// a lâmina aponta na direção do personagem no quadro do impacto.
// Tecido: somente (54,39,136), (86,83,187) e (123,146,213).
const fs=require('fs'),path=require('path'),zlib=require('zlib');

const C={
  K:[0,0,0], D:[54,39,136], M:[86,83,187], L:[123,146,213],
  H:[250,203,166], S:[238,195,154], s:[221,183,143],
  h:[133,83,67],
  Q:[176,42,48], q:[120,24,32],
  P:[226,230,224], R:[168,176,170], r:[108,116,120], N:[62,68,74],
  T:[232,238,244], t:[176,188,198], u:[118,128,140],
  G:[198,154,64], g:[138,102,38],
  W:[156,98,54], w:[104,64,36], b:[70,42,28],
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
function put(g,pixels){
  for(const [x,y,ch] of pixels){
    if(!C[ch]) throw Error('Cor desconhecida '+ch);
    if(x<0||y<0||x>31||y>31) throw Error('Fora da célula '+x+','+y);
    g[y][x]=ch;
  }
}
function mirror(g){
  const o=blank();
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(g[y][x]) o[y][31-x]=g[y][x];
  return o;
}
// Costas: a viseira vira elmo. A mecha, a crista e o tabardo ficam.
function backView(g){
  const o=clone(g);
  for(let y=11;y<=13;y++) for(let x=14;x<=17;x++){
    const ch=o[y][x];
    if(ch&&'HS'.includes(ch)) o[y][x]=(x+y)&1?'r':'N';
  }
  return o;
}
function line(x0,y0,x1,y1){
  const pts=[];
  let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy, x=x0, y=y0;
  for(;;){
    pts.push([x,y]);
    if(x===x1&&y===y1) break;
    const e2=2*err;
    if(e2>-dy){err-=dy; x+=sx;}
    if(e2<dx){err+=dx; y+=sy;}
  }
  return pts;
}
function polar(x,y,deg,len){
  const a=deg*Math.PI/180;
  return [Math.round(x+Math.cos(a)*len), Math.round(y+Math.sin(a)*len)];
}

// Tronco sem a espada. x = 11 + índice, y = 10 + linha.
// Escudo aquecido à esquerda (x 11–13), elmo com crista e mecha, tabardo
// e peitoral. A coluna x 17 é o ombro, onde a mão encosta.
const torso=[
  '....qQK.....',
  '...KhPKK....',
  '..KhKNSK....',
  'KRKDMLK.....',
  'KLKDPMK.....',
  'KDKMLKK.....'
];
const legs=[
  ['.K.wDwK.....','.K.b.bK.....','..KK.KK.....'],
  ['.K..DwK.....','....bKK.....','....KK......'],
  ['.KwD.wK.....','.Kb..bK.....','KK....KK....'],
  ['.Kw.DwK.....','KKb..bK.....','KK....KK....']
];
// Espada curta ao lado, dentro do retângulo do repouso. No golpe o braço
// estende a mesma lâmina, com menos escorço.
const sideSword=[
  [18,14,'G'],[19,14,'K'],
  [18,15,'H'],[19,15,'g'],[20,15,'K'],
  [20,16,'T'],[21,16,'t'],[22,16,'K'],
  [21,17,'u'],[22,17,'*'],
  [21,18,'K'],[22,18,'K']
];

// Lâmina reta, guarda de ouro e fio claro. O cabo encosta no ombro.
function drawSword(g,hand,deg,len){
  const tip=polar(hand[0],hand[1],deg,len);
  const pts=line(hand[0],hand[1],tip[0],tip[1]);
  if(pts.length<4) throw Error('Espada curta '+pts.length+' '+deg);
  const dx=tip[0]-hand[0], dy=tip[1]-hand[1];
  // Espessura num eixo cardinal, para o fio continuar grudado na lâmina.
  const px=Math.abs(dx)>=Math.abs(dy)?0:1, py=Math.abs(dx)>=Math.abs(dy)?1:0;
  const before=new Set();
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(g[y][x]) before.add(x+','+y);
  const paint=(x,y,ch,force=false)=>{
    if(x<0||y<0||x>31||y>31){if(force) throw Error('Espada fora '+x+','+y); return false;}
    if(g[y][x]&&'DML'.includes(g[y][x])) throw Error('Espada cobriu tecido '+x+','+y);
    if(g[y][x]){if(force) throw Error('Espada cruzou o corpo '+x+','+y+' '+g[y][x]); return false;}
    g[y][x]=ch;
    return true;
  };
  const onBody=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>before.has((x+dx)+','+(y+dy)));
  paint(hand[0],hand[1],'H',true);
  let ax=hand[0], ay=hand[1];
  for(let n=0;n<4 && !onBody(ax,ay); n++){
    if(ax!==17) ax+=Math.sign(17-ax);
    else ay+=Math.sign(14-ay);
    paint(ax,ay,'S',true);
  }
  pts.forEach(([x,y],i)=>{
    if(i===0) return;
    if(i===1){
      paint(x,y,'g',true);
      paint(x+px,y+py,'G');
      paint(x-px,y-py,'G');
      return;
    }
    const end=i===pts.length-1;
    paint(x,y,end?'*':(i%2?'T':'t'),true);
    paint(x+px,y+py,end?'K':'u');
    paint(x-px,y-py,'K');
  });
  return tip;
}
function bob(g){
  const src=clone(g);
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) g[y][x]=null;
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(src[y][x]){
    if(y>0) g[y-1][x]=src[y][x];
    if(y===18) g[18][x]=src[y][x];
  }
}
function sway(g){
  g[10][15]=null; g[10][16]=null;
  g[10][14]='q'; g[10][15]='Q'; g[10][16]='K';
}
function compose(leg,sword,opts={}){
  const g=blank();
  stamp(g,11,10,torso);
  stamp(g,11,16,legs[leg]);
  if(opts.blink&&g[12][17]==='S') g[12][17]='r';
  if(opts.back){
    const hood=backView(g);
    for(let y=0;y<32;y++) for(let x=0;x<32;x++) g[y][x]=hood[y][x];
  }
  if(opts.sway) sway(g);
  if(sword==='side') put(g,sideSword);
  else drawSword(g,sword.hand,sword.deg,sword.len);
  if(opts.bob) bob(g);
  return g;
}

// Corte descendente, da guarda alta até a diagonal da frente.
// Ângulo 0 aponta à direita; positivo desce, porque y cresce para baixo.
const downCut=[
  'side',
  {hand:[19,12], deg:-85, len:9},
  {hand:[18,13], deg:-12, len:9},
  {hand:[18,15], deg:28, len:9},
  {hand:[18,16], deg:68, len:9},
  {hand:[18,15], deg:50, len:6}
];
// Corte ascendente, de costas: a lâmina sobe na direção de quem olha para cima.
const upCut=[
  'side',
  {hand:[18,16], deg:82, len:9},
  {hand:[18,15], deg:-8, len:9},
  {hand:[18,13], deg:-32, len:9},
  {hand:[19,12], deg:-78, len:9},
  {hand:[18,14], deg:-8, len:6}
];

function buildFrames(){
  const idle=[];
  for(let f=0;f<16;f++){
    const opt={blink:f===3||f===5||f===13, sway:f>=9&&f<=12};
    const front=compose(0,'side',opt);
    idle.push(front, mirror(front), backView(front), mirror(backView(front)));
  }
  const walk=[];
  const order=[2,1,3,0];
  for(let i=0;i<4;i++){
    const front=compose(order[i],'side',{bob:i===1||i===3});
    walk.push(front, mirror(front), backView(front), mirror(backView(front)));
  }
  const attack=[];
  for(let i=0;i<6;i++){
    const right=compose(0,downCut[i],{});
    const up=compose(0,upCut[i],{back:true});
    attack.push(right, mirror(right), up, mirror(up));
  }
  return {idle,walk,attack};
}

function sheet(frames,width){
  const height=128, data=Buffer.alloc(width*height*4);
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
  let minx=32,miny=32,maxx=-1,maxy=-1,n=0,cloth=0;
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(g[y][x]){
    n++; if(x<minx)minx=x; if(y<miny)miny=y; if(x>maxx)maxx=x; if(y>maxy)maxy=y;
    if('DML'.includes(g[y][x])) cloth++;
  }
  return {minx,miny,maxx,maxy,n,cloth};
}
function components(g){
  const seen=Array.from({length:32},()=>Array(32).fill(false));
  let parts=0;
  for(let y=0;y<32;y++) for(let x=0;x<32;x++){
    if(!g[y][x]||seen[y][x]) continue;
    parts++;
    const stack=[[x,y]];
    seen[y][x]=true;
    while(stack.length){
      const [cx,cy]=stack.pop();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=cx+dx, ny=cy+dy;
        if(nx<0||ny<0||nx>31||ny>31||seen[ny][nx]||!g[ny][nx]) continue;
        seen[ny][nx]=true;
        stack.push([nx,ny]);
      }
    }
  }
  return parts;
}
function tipOf(g){
  const stars=[];
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(g[y][x]==='*') stars.push([x,y]);
  return stars;
}
function reorder(frames,count){
  const rows=[[],[],[],[]];
  for(let f=0;f<count;f++) for(let r=0;r<4;r++) rows[r].push(frames[f*4+r]);
  return rows.flat();
}
function foot(g){return g[18].some(Boolean);}
function draw(dir=path.join(__dirname)){
  const built=buildFrames();
  const idle=reorder(built.idle,16), walk=reorder(built.walk,4), attack=reorder(built.attack,6);
  const idle0=bounds(idle[0]);
  if(idle0.minx!==11||idle0.maxx!==22||idle0.miny!==10||idle0.maxy!==18) throw Error('Pegada do repouso diferente da original '+JSON.stringify(idle0));
  for(const [name,frames,count] of [['idle',idle,16],['walk',walk,4]]){
    for(let r=0;r<4;r++) for(let f=0;f<count;f++){
      const g=frames[r*count+f], b=bounds(g);
      if(!b.cloth) throw Error(name+' sem tecido f'+f+' r'+r);
      if(b.maxy!==18) throw Error(name+' pés em y'+b.maxy+' f'+f+' r'+r);
      if(b.n<48) throw Error(name+' raro demais f'+f+' r'+r+' n'+b.n);
      if(components(g)!==1) throw Error(name+' partido f'+f+' r'+r+' partes '+components(g));
      if(tipOf(g).length!==1) throw Error(name+' fio f'+f+' r'+r);
    }
  }
  if(attack.length!==24) throw Error('Ataque com '+attack.length+' quadros');
  for(let r=0;r<4;r++) for(let f=0;f<6;f++){
    const g=attack[r*6+f], b=bounds(g);
    if(!b.cloth) throw Error('attack sem tecido f'+f+' r'+r);
    if(b.n<48) throw Error('attack raro f'+f+' r'+r);
    if(components(g)!==1) throw Error('attack partido f'+f+' r'+r+' partes '+components(g));
    if(tipOf(g).length!==1) throw Error('attack fio f'+f+' r'+r+' n'+tipOf(g).length);
    if(!foot(g)) throw Error('attack sem pé no chão f'+f+' r'+r);
  }
  // Quadro 3: a ponta está na diagonal de cada linha.
  const hitExpect=[[24,16],[7,16],[24,12],[7,12]];
  for(let r=0;r<4;r++){
    const [x,y]=tipOf(attack[r*6+3])[0];
    const [limitX,limitY]=hitExpect[r];
    if(r%2===0&&x<limitX) throw Error('Corte curto à direita, linha '+r+' x'+x);
    if(r%2===1&&x>limitX) throw Error('Corte curto à esquerda, linha '+r+' x'+x);
    if(r<2&&y<limitY) throw Error('Corte de frente pouco baixo, linha '+r+' y'+y);
    if(r>=2&&y>limitY) throw Error('Corte de costas pouco alto, linha '+r+' y'+y);
  }
  fs.mkdirSync(dir,{recursive:true});
  writePng(path.join(dir,'swordsman-idle.png'),512,128,sheet(idle,512));
  writePng(path.join(dir,'swordsman-walk.png'),128,128,sheet(walk,128));
  writePng(path.join(dir,'swordsman-attack.png'),192,128,sheet(attack,192));
  return {idle,walk,attack};
}

if(require.main===module){
  const out=draw(path.join(__dirname));
  const show=(g)=>{
    for(let y=0;y<32;y++){
      let line='', any=false;
      for(let x=0;x<32;x++){const ch=g[y][x]; if(ch) any=true; line+=ch||'.';}
      if(any) console.log(String(y).padStart(2), line);
    }
  };
  console.log('IDLE', JSON.stringify(bounds(out.idle[0])));
  show(out.idle[0]);
  console.log('WALK');
  for(let f=0;f<4;f++){console.log('f'+f, JSON.stringify(bounds(out.walk[f])), 'partes', components(out.walk[f])); show(out.walk[f]);}
  console.log('ATTACK down');
  for(let f=0;f<6;f++){console.log('f'+f, JSON.stringify(bounds(out.attack[f])), 'tip', tipOf(out.attack[f]), 'partes', components(out.attack[f])); show(out.attack[f]);}
  console.log('ATTACK up');
  for(let f=0;f<6;f++){console.log('f'+f, 'tip', tipOf(out.attack[2*6+f]), 'partes', components(out.attack[2*6+f])); show(out.attack[2*6+f]);}
}
module.exports={draw,C};
