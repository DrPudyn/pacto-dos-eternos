// Lanceiro desenhado pixel a pixel.
// Capuz pontudo sobre elmo de aba, nasal, cota de escamas, saia de tecido e
// lança de folha com guarda — silhueta própria, no mesmo retângulo do lanceiro
// original (x 11–21, y 5–18 no repouso; pés na linha 18).
// Repouso e caminhada: linhas down-right, down-left, up-right, up-left
// (o jogo pede direção diagonal fora do ataque).
// Ataque, 6 quadros, hitFrame 5: linhas right, left, down, up (cardinal).
// A lança sobe recolhida, estoca na direção do quadro e o corpo fica plantado.
// Tecido: somente (54,39,136), (86,83,187) e (123,146,213).
const fs=require('fs'),path=require('path'),zlib=require('zlib');

const C={
  K:[0,0,0], D:[54,39,136], M:[86,83,187], L:[123,146,213],
  H:[250,203,166], S:[238,195,154], s:[221,183,143],
  h:[133,83,67], n:[62,58,54], e:[48,32,28],
  a:[214,206,186], A:[150,142,126], Z:[88,82,72],
  W:[168,118,68], w:[112,74,40], b:[74,46,26],
  T:[220,228,236], t:[164,176,190], u:[102,112,126],
  G:[186,132,52], '*':[255,255,255]
};

const rightBlade=[
  [0,0,'*'],[0,-1,'K'],[0,1,'K'],
  [-1,-1,'K'],[-1,0,'t'],[-1,1,'K'],
  [-2,-1,'t'],[-2,0,'T'],[-2,1,'t'],
  [-3,-1,'K'],[-3,0,'u'],[-3,1,'K'],
  [-4,-1,'G'],[-4,0,'K'],[-4,1,'G'],
  [-5,-1,'K'],[-5,0,'w'],[-5,1,'K']
];

function blank(){return Array.from({length:32},()=>Array(32).fill(null));}
function clone(g){return g.map(row=>row.slice());}
const dirs={
  right:[1,0], left:[-1,0], down:[0,1], up:[0,-1],
  upright:[1,-1], upleft:[-1,-1], downright:[1,1], downleft:[-1,1]
};
function rot(along,perp,dir){
  const d=dirs[dir];
  if(!d) throw Error('Direção '+dir);
  const px=-d[1], py=d[0];
  return [along*d[0]+perp*px, along*d[1]+perp*py];
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
// Costas: o rosto vira capuz. A aba de metal do elmo permanece.
function backView(g){
  const o=clone(g);
  for(let y=8;y<=12;y++) for(let x=11;x<=17;x++){
    const ch=o[y][x];
    if(ch && 'HSsne'.includes(ch)) o[y][x]=(x+y)&1?'M':'D';
  }
  return o;
}
function line(x0,y0,x1,y1){
  const pts=[];
  let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy, x=x0, y=y0;
  for(;;){
    pts.push([x,y]);
    if(x===x1 && y===y1) break;
    const e2=2*err;
    if(e2>-dy){err-=dy; x+=sx;}
    if(e2<dx){err+=dx; y+=sy;}
  }
  return pts;
}

// Capuz, aba, nasal, escamas e saia. A lança entra depois, pela direita.
const body=[
  [13,7,'L'],[14,7,'K'],
  [13,8,'K'],[14,8,'K'],
  [12,9,'K'],[13,9,'L'],[14,9,'M'],[15,9,'D'],[16,9,'K'],[17,9,'K'],
  [11,10,'K'],[12,10,'D'],[13,10,'M'],[14,10,'a'],[15,10,'A'],[16,10,'a'],[17,10,'K'],
  [11,11,'K'],[12,11,'H'],[13,11,'S'],[14,11,'n'],[15,11,'e'],[16,11,'H'],[17,11,'K'],
  [12,12,'K'],[13,12,'A'],[14,12,'Z'],[15,12,'h'],[16,12,'K'],[17,12,'K'],
  [12,13,'K'],[13,13,'a'],[14,13,'A'],[15,13,'a'],[16,13,'Z'],[17,13,'K'],
  [11,14,'K'],[12,14,'D'],[13,14,'M'],[14,14,'L'],[15,14,'D'],[16,14,'K'],
  [12,15,'K'],[13,15,'M'],[14,15,'D'],[15,15,'M'],[16,15,'K']
];
const legs=[
  [[13,16,'K'],[14,16,'D'],[15,16,'K'],[16,16,'K'],[13,17,'K'],[16,17,'K'],[13,18,'K'],[16,18,'K']],
  [[13,16,'K'],[14,16,'M'],[15,16,'K'],[14,17,'K'],[15,17,'K'],[14,18,'K']],
  [[11,16,'K'],[12,16,'D'],[13,16,'K'],[15,16,'K'],[16,16,'K'],[11,17,'K'],[16,17,'K'],[11,18,'K'],[16,18,'K']],
  [[12,16,'K'],[13,16,'L'],[15,16,'K'],[16,16,'K'],[13,17,'K'],[16,17,'K'],[16,18,'K']]
];
const idleSpear={butt:[19,18], tip:[19,5], dir:'up'};

function socketOf(tip,dir){
  const [dx,dy]=rot(-5,0,dir);
  return [tip[0]+dx, tip[1]+dy];
}
function drawBlade(g,tip,dir){
  const pts=[];
  for(const [dx,dy,ch] of rightBlade){
    const [rx,ry]=rot(dx,dy,dir), x=tip[0]+rx, y=tip[1]+ry;
    if(x<0||y<0||x>31||y>31) throw Error('Lâmina fora '+x+','+y+' '+dir);
    g[y][x]=ch;
    pts.push([x,y]);
  }
  return pts;
}
function drawShaft(g,x0,y0,x1,y1){
  const pts=line(x0,y0,x1,y1);
  const on=new Set(pts.map(([x,y])=>x+','+y));
  const ox=pts.length>1?Math.sign(pts[0][0]-pts[1][0]):0;
  const oy=pts.length>1?Math.sign(pts[0][1]-pts[1][1]):0;
  for(let i=0;i<pts.length;i++){
    const [x,y]=pts[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      if(i===0 && dx===ox && dy===oy) continue;
      const nx=x+dx, ny=y+dy;
      if(nx<0||ny<0||nx>31||ny>31||on.has(nx+','+ny)||g[ny][nx]) continue;
      g[ny][nx]='K';
    }
  }
  for(const [x,y] of pts){
    if(!g[y][x]||g[y][x]==='K') g[y][x]=(x+y)&1?'w':'W';
  }
  return pts;
}
function nearest(pts,x,y){
  let best=pts[0], bestD=1e9;
  for(const p of pts){
    const d=Math.abs(p[0]-x)+Math.abs(p[1]-y);
    if(d<bestD){best=p; bestD=d;}
  }
  return best;
}
// Mão curta: fecha no cabo e, se faltar, um pixel até encostar no corpo.
function grip(g,x,y){
  if(!g[y][x]||'WwKb'.includes(g[y][x])) g[y][x]='H';
  for(let i=1;i<=2;i++){
    const nx=x-i;
    if(nx<0) break;
    const cur=g[y][nx];
    if(cur && !'KWw'.includes(cur)) break;
    g[y][nx]=i===1?'S':'K';
    const beyond=nx>0?g[y][nx-1]:null;
    if(beyond && !'KWw'.includes(beyond)) break;
  }
}
function drawSpear(g,spec){
  const sock=socketOf(spec.tip, spec.dir);
  const shaft=drawShaft(g, spec.butt[0], spec.butt[1], sock[0], sock[1]);
  const blade=drawBlade(g, spec.tip, spec.dir);
  if(spec.dir==='up'){
    const x=spec.tip[0]+2, y=spec.tip[1];
    if(x<=31 && g[y][x-1] && !g[y][x]) g[y][x]='K';
  }
  const bladeSet=new Set(blade.map(([x,y])=>x+','+y));
  const pool=shaft.filter(([x,y])=>!bladeSet.has(x+','+y));
  const grips=(pool.length?pool:shaft).filter(([x,y])=>Math.abs(x-17)+Math.abs(y-14)<=6);
  if(!grips.length) return;
  const lead=nearest(grips, 17, 12);
  grip(g, lead[0], lead[1]);
  const rearPool=grips.filter(([x,y])=>Math.abs(x-lead[0])+Math.abs(y-lead[1])>=3);
  if(rearPool.length){
    const rear=nearest(rearPool, 17, 16);
    grip(g, rear[0], rear[1]);
  }
}
function bob(g){
  const src=clone(g);
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) g[y][x]=null;
  for(let y=0;y<32;y++) for(let x=0;x<32;x++) if(src[y][x]){
    if(y>0) g[y-1][x]=src[y][x];
    if(y===18) g[18][x]=src[y][x];
  }
}
function compose(leg,spec,opts={}){
  const g=blank();
  put(g, body);
  put(g, legs[leg]);
  if(opts.back){
    const hood=backView(g);
    for(let y=0;y<32;y++) for(let x=0;x<32;x++) g[y][x]=hood[y][x];
  }
  drawSpear(g, spec);
  if(opts.bob) bob(g);
  if(opts.blink && g[11][15]==='e') g[11][15]='s';
  if(opts.tassel){
    g[7][13]=null;
    g[6][14]='K'; g[7][14]='L';
  }
  if(opts.glint){
    const tip=spec.tip;
    if(g[tip[1]][tip[0]]==='*'){g[tip[1]][tip[0]]='T';}
  }
  return g;
}

// Ataque à direita: a lança sobe inteira, tomba para a frente e estica no quadro 5.
const rightThrust=[
  idleSpear,
  {butt:[19,16], tip:[19,3], dir:'up'},
  {butt:[19,14], tip:[19,2], dir:'up'},
  {butt:[17,14], tip:[26,14], dir:'right'},
  {butt:[17,14], tip:[29,14], dir:'right'},
  {butt:[18,14], tip:[31,14], dir:'right'}
];
// Para baixo a recolhida é para cima; a estocada do quadro 5 desce reta.
const downThrust=[
  idleSpear,
  {butt:[19,16], tip:[19,3], dir:'up'},
  {butt:[19,14], tip:[19,2], dir:'up'},
  {butt:[19,14], tip:[19,24], dir:'down'},
  {butt:[19,16], tip:[19,28], dir:'down'},
  {butt:[19,17], tip:[19,30], dir:'down'}
];
// Para cima o lanceiro está de costas: a lança desce na recolhida e sobe reta no quadro 5.
const upThrust=[
  idleSpear,
  {butt:[19,12], tip:[19,24], dir:'down'},
  {butt:[19,13], tip:[19,26], dir:'down'},
  {butt:[19,16], tip:[19,6], dir:'up'},
  {butt:[19,15], tip:[19,3], dir:'up'},
  {butt:[19,14], tip:[19,1], dir:'up'}
];

function attackPose(poses, index, back){
  return compose(0, poses[index], {back});
}

function buildFrames(){
  const idle=[];
  for(let f=0;f<16;f++){
    const raised=f===8||f===10;
    const spec=raised?{butt:[19,18], tip:[19,4], dir:'up'}:idleSpear;
    const opt={blink:f===3||f===5||f===13, tassel:f===9||f===11, glint:f===12||f===14};
    const front=compose(0, spec, opt);
    idle.push(front, mirror(front), backView(front), mirror(backView(front)));
  }
  const walk=[];
  const walkSpear=[
    idleSpear,
    {butt:[19,18], tip:[19,5], dir:'up'},
    {butt:[19,18], tip:[19,6], dir:'up'},
    {butt:[19,18], tip:[19,4], dir:'up'}
  ];
  const walkLegs=[2,1,3,0];
  for(let i=0;i<4;i++){
    const front=compose(walkLegs[i], walkSpear[i], {bob:i===1||i===3});
    walk.push(front, mirror(front), backView(front), mirror(backView(front)));
  }
  const attack=[];
  for(let i=0;i<6;i++){
    attack.push(attackPose(rightThrust,i,false), mirror(attackPose(rightThrust,i,false)), attackPose(downThrust,i,false), attackPose(upThrust,i,true));
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
function draw(dir=path.join(__dirname)){
  const built=buildFrames();
  const idle=reorder(built.idle,16), walk=reorder(built.walk,4), attack=reorder(built.attack,6);
  const idle0=bounds(idle[0]);
  if(idle0.minx!==11||idle0.maxx!==21||idle0.miny!==5||idle0.maxy!==18) throw Error('Pegada do repouso diferente da original '+JSON.stringify(idle0));
  for(const [name,frames,count] of [['idle',idle,16],['walk',walk,4]]){
    for(let r=0;r<4;r++) for(let f=0;f<count;f++){
      const g=frames[r*count+f], b=bounds(g);
      if(!b.cloth) throw Error(name+' sem tecido f'+f+' r'+r);
      if(b.maxy!==18) throw Error(name+' pés em y'+b.maxy+' f'+f+' r'+r);
      if(b.n<48) throw Error(name+' raro demais f'+f+' r'+r+' n'+b.n);
      if(components(g)!==1) throw Error(name+' partido f'+f+' r'+r+' partes '+components(g));
    }
  }
  if(attack.length!==24) throw Error('Ataque com '+attack.length+' quadros');
  for(let r=0;r<4;r++) for(let f=0;f<6;f++){
    const g=attack[r*6+f], b=bounds(g);
    if(!b.cloth) throw Error('attack sem tecido f'+f+' r'+r);
    if(b.n<48) throw Error('attack raro f'+f+' r'+r);
    if(components(g)!==1) throw Error('attack partido f'+f+' r'+r+' partes '+components(g));
    const stars=tipOf(g);
    if(stars.length!==1) throw Error('attack ponta f'+f+' r'+r+' n'+stars.length);
    let foot=false;
    for(let x=0;x<32;x++) if(g[18][x]) foot=true;
    if(!foot) throw Error('attack sem pé no chão f'+f+' r'+r);
  }
  const expect=[[29,1],[2,-1],[28,1],[3,-1]];
  for(let r=0;r<4;r++){
    const [x,y]=tipOf(attack[r*6+5])[0];
    const [limit,sign]=expect[r];
    const value=r<2?x:y;
    if(sign>0 && value<limit) throw Error('Estocada curta linha '+r+' em '+value);
    if(sign<0 && value>limit) throw Error('Estocada curta linha '+r+' em '+value);
  }
  fs.mkdirSync(dir,{recursive:true});
  writePng(path.join(dir,'spearman-idle.png'),512,128,sheet(idle,512));
  writePng(path.join(dir,'spearman-walk.png'),128,128,sheet(walk,128));
  writePng(path.join(dir,'spearman-attack.png'),192,128,sheet(attack,192));
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
  for(let f=0;f<4;f++){console.log('f'+f, JSON.stringify(bounds(out.walk[f]))); show(out.walk[f]);}
  console.log('ATTACK right');
  for(let f=0;f<6;f++){console.log('f'+f, JSON.stringify(bounds(out.attack[f])), 'tip', tipOf(out.attack[f])); show(out.attack[f]);}
  console.log('ATTACK down f5', tipOf(out.attack[2*6+5]), 'up f5', tipOf(out.attack[3*6+5]));
}
module.exports={draw,C};
