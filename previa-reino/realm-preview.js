// Isolated visual preview: no account API, game state or save is touched.
const ns='http://www.w3.org/2000/svg',world=document.getElementById('world'),svg=document.getElementById('regions'),dialog=document.getElementById('detail');
const regions=[
 {name:'Base dos Eternos — voltar à tela inicial',boss:'Varkhan, Guardião das Brasas',lore:'O portal se fecha atrás de você. Um último posto dos Eternos resiste na margem deste mundo partido. Além de suas muralhas começa o domínio do Rei Demônio.',lock:[145,505],points:[[9,432],[65,411],[93,373],[149,391],[166,423],[250,449],[320,520],[389,627],[291,700],[99,670],[13,590]]},
 {name:'Minas Acorrentadas',boss:'O Carcereiro de Ferro',lore:'Sob as torres de mineração, rios de metal ardente alimentam as máquinas do exército demoníaco. O fogo jamais se apaga.',lock:[155,277],points:[[13,216],[57,174],[123,173],[144,143],[209,154],[221,206],[278,228],[295,280],[342,306],[342,392],[256,430],[133,402],[61,369],[4,312]]},
 {name:'Floresta Corrompida',boss:'A Raiz Profana',lore:'Árvores retorcidas guardam um santuário rubro. As raízes atravessam a pedra flutuante como se procurassem algo no abismo.',lock:[426,434],points:[[296,367],[349,335],[407,339],[451,364],[495,347],[541,382],[562,433],[558,481],[517,523],[472,603],[397,640],[330,558],[292,455]]},
 {name:'Catacumbas do Silêncio',boss:'O Arauto Mudo',lore:'Chamas azuis revelam a necrópole. Nenhum sino toca, mas algo desperta nas câmaras sob a estátua do antigo guardião.',lock:[699,355],points:[[564,330],[609,274],[660,239],[697,222],[743,250],[787,283],[813,340],[810,404],[769,455],[710,539],[635,485],[580,409]]},
 {name:'Deserto das Cinzas',boss:'O Senhor das Dunas',lore:'Um templo dourado preserva a memória de um reino perdido. A estrada antiga desaparece entre pilares e areias suspensas.',lock:[371,191],points:[[219,166],[271,115],[319,99],[359,91],[403,119],[462,121],[470,164],[515,191],[535,252],[510,303],[455,340],[348,321],[294,274],[237,237]]},
 {name:'Fortaleza de Ferro',boss:'O Marechal Blindado',lore:'A fornalha central transforma a própria montanha em armas. Esta fortaleza é o coração industrial da invasão.',lock:[605,167],points:[[491,122],[529,78],[582,64],[609,89],[643,94],[677,126],[689,165],[724,183],[734,249],[693,293],[604,300],[544,253],[503,208]]},
 {name:'Abismo dos Ecos',boss:'O Invocador do Vazio',lore:'Pontes estreitas levam a um portal que rasga o céu. A cada pulso, fragmentos de mundos esquecidos surgem na escuridão.',lock:[799,112],points:[[703,115],[720,70],[765,42],[786,24],[817,41],[849,69],[862,108],[878,126],[865,174],[843,201],[796,229],[751,208],[716,171]]},
 {name:'Catedral Profanada',boss:'Os Gêmeos do Eclipse',lore:'A luz violeta dos vitrais anuncia o altar dos generais. A antiga fé foi substituída por um pacto com o vazio.',lock:[925,281],points:[[812,219],[849,162],[880,158],[899,138],[924,164],[945,152],[971,189],[990,208],[1008,244],[1046,279],[1040,340],[1008,390],[951,434],[880,414],[831,366],[804,298]]},
 {name:'Portões da Ruína',boss:'O Último General',lore:'Entre estandartes escarlates e cataratas de lava, o último bastião separa o exército dos Eternos do trono.',lock:[1056,484],points:[[800,380],[874,331],[947,344],[974,364],[1029,344],[1087,378],[1160,415],[1230,418],[1254,482],[1250,557],[1205,653],[1110,706],[1016,709],[938,646],[870,591],[830,491]]},
 {name:'Trono do Rei Demônio',boss:'Azhrael, Rei da Ruína',lore:'A cidadela domina o horizonte. Sob a lua vermelha, Azhrael espera diante da fenda que ameaça consumir todos os reinos.',lock:[1147,159],points:[[989,146],[1015,76],[1048,35],[1075,22],[1110,11],[1143,6],[1178,17],[1203,50],[1230,39],[1243,87],[1269,116],[1277,198],[1273,282],[1252,329],[1190,382],[1099,390],[1044,344],[1024,278]]}
];
// One continuous route: each conquest unlocks exactly the next island.
const route=[0,2,1,4,5,6,3,8,7,9].map(i=>regions[i]);regions.splice(0,regions.length,...route);
const gameMode=(document.body.dataset.game==='1'||new URLSearchParams(location.search).get('game')==='1')&&window.parent!==window;
const realmOrigin=gameMode?window.parent.location.origin:location.origin;
let gameSlots=[],gameCleared={},gameUnlockedRegion=1;
let unlocked=gameMode?0:1,selected=0,hover=-1,complete=false;
const isLocked=i=>gameMode?i>0&&!gameSlots[i]?.available&&!gameCleared[gameSlots[i]?.id]:i>unlocked;
const isDone=i=>gameMode?i===0||!!gameCleared[gameSlots[i]?.id]:i<unlocked||complete;
function sendGame(type,extra={}){window.parent.postMessage({type,...extra},realmOrigin);}
if(gameMode){document.body.classList.add('in-game');window.addEventListener('message',event=>{if(event.origin!==realmOrigin||event.source!==window.parent||event.data?.type!=='realm:state')return;gameSlots=event.data.slots??[];gameCleared=event.data.cleared??{};gameUnlockedRegion=event.data.unlockedRegion??1;gameSlots.forEach((r,i)=>{if(r&&regions[i])Object.assign(regions[i],{name:r.name,boss:r.boss,...(r.lore?{lore:r.lore}:{})});});paint();const free=document.getElementById('free-dungeon');free.hidden=!event.data.freeDungeon;updateExpeditionCamp(event.data);revealGameMap();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open){e.preventDefault();sendGame('realm:base');}});}

function node(tag,attrs={}){const n=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))n.setAttribute(key,value);return n;}
function paint(){svg.replaceChildren();const defs=node('defs'),mask=node('mask',{id:'terrain-mask',maskUnits:'userSpaceOnUse',x:0,y:0,width:1280,height:720,style:'mask-type:alpha'});mask.append(node('image',{href:'./realm-demon-preview-v3.png',width:1280,height:720,preserveAspectRatio:'none'}));defs.append(mask);svg.append(defs);regions.forEach((r,i)=>{const g=node('g',{class:'region '+(isLocked(i)?'locked':isDone(i)?'completed':'available'),tabindex:isLocked(i)?'-1':'0',role:'button','aria-disabled':String(isLocked(i)),'aria-label':r.name+(isLocked(i)?' — bloqueado':''),'aria-haspopup':i===0?'false':'dialog'}),p=r.points.map(p=>p.join(',')).join(' ');g.append(node('polygon',{points:p,class:'shade',mask:'url(#terrain-mask)'}),node('polygon',{points:p,class:'outline',mask:'url(#terrain-mask)'}));const lock=node('g',{class:'lock',transform:`translate(${r.lock[0]},${r.lock[1]})`});lock.append(node('rect',{class:'lock-plate',x:-17,y:-19,width:34,height:39,rx:5}),node('path',{class:'lock-shackle',d:'M-7 -2 V-8 A7 7 0 0 1 7 -8 V-2'}),node('rect',{class:'lock-body',x:-10,y:-3,width:20,height:16,rx:1}),node('path',{class:'lock-hole',d:'M-2 3 h4 v6 h-4z'}));g.append(lock);g.onpointerenter=()=>hover=isLocked(i)?-1:i;g.onpointerleave=()=>hover=-1;g.onfocus=()=>hover=i;g.onblur=()=>hover=-1;g.onclick=()=>show(i);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(i);}};svg.append(g);});document.getElementById('progress').textContent=gameMode?Object.keys(gameCleared).length+' / 9 castelos libertados · Clique na base para voltar.':complete?'O caminho até o trono foi revelado.':unlocked>1?`${unlocked-1} ${unlocked===2?'território libertado':'territórios libertados'}. O próximo caminho está aberto.`:'Um caminho se abre além da névoa.';}
function show(i){if(i===0){if(gameMode)sendGame('realm:base');else window.location.assign('/');return;}if(isLocked(i))return;selected=i;const r=regions[i],locked=isLocked(i),done=isDone(i);document.getElementById('region-status').textContent=locked?'TERRITÓRIO SOB O VÉU':done?'TERRITÓRIO LIBERTADO':'O CAMINHO ESTÁ ABERTO';document.getElementById('region-name').textContent=r.name;document.getElementById('region-lore').textContent=r.lore;document.getElementById('region-levels').textContent='Um labirinto · '+(i===9?'Rei Demônio':'Um guardião');document.getElementById('region-boss').textContent=r.boss;document.getElementById('region-condition').textContent=locked?'Liberte '+regions[i-1].name+' para atravessar este caminho.':done?'Castelo conquistado. A recompensa já foi recebida; avance pela próxima ponte.':'Explore a região e enfrente seu guardião para revelar o próximo território.';const b=document.getElementById('complete');b.disabled=locked||done;b.textContent=done?'CASTELO CONQUISTADO':gameMode?'EXPLORAR REGIÃO':locked?'CAMINHO BLOQUEADO':done?'TERRITÓRIO CONCLUÍDO':'SIMULAR CONQUISTA NA PRÉVIA';dialog.showModal();}
document.getElementById('complete').onclick=()=>{if(selected===-1){dialog.close();return;}if(gameMode){if(!isLocked(selected)&&gameSlots[selected])sendGame('realm:region',{id:gameSlots[selected].id});return;}if(selected!==unlocked||complete)return;dialog.close();if(unlocked<9)unlocked++;else complete=true;paint();const next=svg.querySelectorAll('.region')[unlocked];next?.classList.add('pulse');};document.getElementById('reset').onclick=()=>{unlocked=1;complete=false;paint();};dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});paint();
const canvas=document.getElementById('effects'),ctx=canvas.getContext('2d'),art=document.querySelector('.world-art'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let last=0;
function pixel(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function glow(x,y,r,color,alpha){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
function ring(x,y,rx,ry,t,color,n){glow(x,y,Math.max(rx,ry)*1.5,color,.13+.05*Math.sin(t*2));for(let i=0;i<n;i++){const a=i/n*Math.PI*2+t*.65;pixel(x+Math.cos(a)*rx,y+Math.sin(a)*ry,i%3?2:3,2,i%4?color:'#ffead3');}}
function animate(ms){requestAnimationFrame(animate);if(document.hidden||ms-last<(reduced.matches?180:50))return;last=ms;const t=reduced.matches?0:ms/1000;ctx.clearRect(0,0,1280,720);ctx.imageSmoothingEnabled=false;drawExpeditionCamp(t);
 // Portal rings are local to the actual openings, never a full-screen shimmer.
 ring(791,82,24,31,t,'#f05aff',22);ring(1148,143,20,33,t*.7,'#ff4faa',24);
 drawLiquids(t);
 // Torches and hanging crystals have distinct, restrained light rhythms.
 for(const [x,y]of [[110,518],[256,497],[306,529],[377,479],[498,450],[631,409],[717,426],[820,477],[995,483],[1074,522],[1102,194],[1189,185],[894,292],[971,292]]){glow(x,y,15,'#ffcc79',.13+.07*Math.sin(t*3+x));for(let i=0;i<3;i++)pixel(x+Math.sin(i+t*3)*2,y-((t*9+i*5)%13),1,2,i%2?'#ffae46':'#ffe3a1');}
 // Sparse wind-blown wisps pass below the lowest foreground platforms.
 for(let i=0;i<11;i++){const x=((i*147+t*3)%1500)-100,y=642+i%3*21;ctx.fillStyle='#a3b4d009';for(let j=0;j<5;j++)ctx.fillRect(x+j*16,y-j%3*4,49,7);}
 // Gently deform only narrow fabric strips sampled from this pixel-art scene.
 if(art.complete&&art.naturalWidth){const sx=art.naturalWidth/1280,sy=art.naturalHeight/720;for(const [x,y,w,h]of [[71,471,15,48],[853,449,15,49],[1103,583,16,48]])for(let row=0;row<h;row+=2){const dx=Math.sin(t*1.5+row*.12)*(row/h)*1.4;ctx.drawImage(art,x*sx,(y+row)*sy,w*sx,2*sy,Math.round(x+dx),y+row,w,2);}}
 // Keep every liquid highlight inside the opaque foreground silhouette.
 if(art.complete&&art.naturalWidth){ctx.save();ctx.globalCompositeOperation='destination-in';ctx.drawImage(art,0,0,1280,720);ctx.restore();}
 if(hover>=0&&!isLocked(hover)){const r=regions[hover];glow(r.lock[0],r.lock[1],60,'#e7ba69',.09);}
}
requestAnimationFrame(animate);
// Each effect is clipped both to its individual waterfall polygon and to the
// bright liquid pixels in the artwork. Stonework and bridges never receive flow.
const liquidStreams=[
 {type:'water',points:[[77,624],[107,628],[108,668],[98,704],[88,718],[78,692]]},
 {type:'water',points:[[314,677],[338,677],[337,696],[329,710],[319,700]]},
 {type:'water',points:[[367,235],[386,234],[388,280],[377,322],[365,299]]},
 {type:'water',points:[[271,187],[282,191],[283,219],[279,237],[272,224]]},
 {type:'rose',points:[[461,532],[483,536],[483,587],[473,633],[459,605]]},
 {type:'rose',points:[[533,510],[547,509],[547,561],[539,595],[531,575]]},
 {type:'water',points:[[601,393],[619,397],[619,443],[611,476],[602,450]]},
 {type:'water',points:[[705,431],[730,433],[731,490],[716,545],[704,514]]},
 {type:'water',points:[[1017,632],[1037,635],[1035,667],[1026,697],[1016,673]]},
 {type:'water',points:[[1117,634],[1137,634],[1139,672],[1126,713],[1115,683]]},
 {type:'lava',points:[[57,323],[75,322],[77,366],[66,416],[56,385]]},
 {type:'lava',points:[[143,355],[163,355],[162,396],[152,439],[141,414]]},
 {type:'lava',points:[[239,390],[258,390],[259,421],[247,464],[238,440]]},
 {type:'lava',points:[[573,184],[590,185],[590,236],[582,276],[572,250]]},
 {type:'lava',points:[[617,185],[632,185],[632,220],[624,261],[616,236]]},
 {type:'purple',points:[[850,308],[869,312],[868,350],[859,386],[849,357]]},
 {type:'purple',points:[[970,341],[987,345],[985,370],[978,392],[969,374]]},
 {type:'red',points:[[1143,256],[1171,258],[1172,319],[1155,404],[1142,365]]},
 {type:'red',points:[[1240,269],[1257,269],[1257,302],[1248,333],[1238,311]]}
];
const liquidPalettes={water:['#168bd7','#5dcfff','#c4f7ff'],lava:['#ee5419','#ff9e29','#ffe188'],purple:['#8f2de0','#c96aff','#efbdff'],rose:['#b72a76','#f478b2','#ffd0e6'],red:['#cc144f','#ff456f','#ffbbce']};
function prepareLiquid(stream){
 if(!art.complete||!art.naturalWidth)return false;
 const xs=stream.points.map(p=>p[0]),ys=stream.points.map(p=>p[1]);
 stream.x=Math.floor(Math.min(...xs));stream.y=Math.floor(Math.min(...ys));stream.w=Math.ceil(Math.max(...xs))-stream.x+1;stream.h=Math.ceil(Math.max(...ys))-stream.y+1;
 const mask=document.createElement('canvas');mask.width=stream.w;mask.height=stream.h;const m=mask.getContext('2d',{willReadFrequently:true});m.imageSmoothingEnabled=false;
 m.drawImage(art,-stream.x,-stream.y,1280,720);
 const data=m.getImageData(0,0,stream.w,stream.h);
 for(let i=0;i<data.data.length;i+=4){const r=data.data[i],g=data.data[i+1],b=data.data[i+2];const bright=Math.max(r,g,b),low=Math.min(r,g,b);
 // Ignore dark rocks even where they fall inside the water silhouette.
 const vivid=bright>125&&bright-low>60;const liquid=stream.type==='water'?b>r*1.35&&g>r*1.35:stream.type==='lava'?r>g*1.2&&g>b*1.3:stream.type==='purple'?b>g*1.25&&r>g*1.2:r>g*1.35&&b>g*1.15;
 if(!vivid||!liquid)data.data[i+3]=0;
 }
 m.putImageData(data,0,0);m.globalCompositeOperation='destination-in';m.beginPath();stream.points.forEach(([x,y],i)=>i?m.lineTo(x-stream.x,y-stream.y):m.moveTo(x-stream.x,y-stream.y));m.closePath();m.fill();
 stream.mask=mask;stream.layer=document.createElement('canvas');stream.layer.width=stream.w;stream.layer.height=stream.h;return true;
}
function drawLiquids(t){for(const s of liquidStreams){if(!s.mask&&!prepareLiquid(s))continue;const c=s.layer.getContext('2d'),colors=liquidPalettes[s.type],speed=s.type==='lava'?23:43;c.clearRect(0,0,s.w,s.h);c.imageSmoothingEnabled=false;
 for(let lane=0;lane<5;lane++){const x=Math.round((lane+.5)*s.w/5);for(let j=-1;j<Math.ceil(s.h/21)+1;j++){const y=((t*speed*(.85+lane*.06)+lane*7+j*21)%(s.h+21))-12;c.globalAlpha=.3+lane%2*.17;c.fillStyle=colors[1+lane%2];c.fillRect(x,y,Math.max(1,Math.round(s.w/10)),6+lane%3*2);}}
 c.globalAlpha=1;c.globalCompositeOperation='destination-in';c.drawImage(s.mask,0,0);c.globalCompositeOperation='source-over';ctx.drawImage(s.layer,s.x,s.y);
}}

// A living outpost replaces the footer shortcut; gameplay still uses the existing route.
const expeditionCamp=document.createElement('button');expeditionCamp.id='free-dungeon';expeditionCamp.className='expedition-camp';expeditionCamp.type='button';expeditionCamp.hidden=gameMode;expeditionCamp.setAttribute('aria-label','Acampamento de Expedições — abrir Masmorra Livre');
const campArt=document.createElement('img');campArt.src='./refuge-expedition-camp-v1.png';campArt.alt='Ilha de expedições com barracas azuis, fogueira e portal';campArt.draggable=false;
const campEffects=document.createElement('canvas');campEffects.width=300;campEffects.height=200;campEffects.setAttribute('aria-hidden','true');const campCtx=campEffects.getContext('2d');campCtx.imageSmoothingEnabled=false;
const campLabel=document.createElement('span');campLabel.className='camp-label';campLabel.textContent='EXPEDIÇÕES';
const campHint=document.createElement('span');campHint.className='camp-hint';const campTitle=document.createElement('strong');campTitle.textContent='MASMORRA LIVRE';const campStatus=document.createElement('span');campStatus.className='camp-status';const campDescription=document.createElement('span');campDescription.textContent='Seus heróis exploram e coletam ouro automaticamente.';campHint.append(campTitle,campStatus,campDescription);expeditionCamp.append(campArt,campEffects,campLabel,campHint);world.append(expeditionCamp);
function updateExpeditionCamp(state={}){const count=Math.max(0,Number(state.farmHeroes)||0),multiplier=Math.max(1,Number(state.farmMultiplier)||1);expeditionCamp.classList.toggle('camp-active',count>0);campStatus.textContent=(count===1?'1 herói em expedição':count+' heróis em expedição')+' · Ouro ×'+multiplier.toLocaleString('pt-BR');expeditionCamp.setAttribute('aria-description',campStatus.textContent+' · Farm automático');}
updateExpeditionCamp();
expeditionCamp.onclick=()=>{if(gameMode){sendGame('realm:free-dungeon');return;}selected=-1;document.getElementById('region-status').textContent='POSTO DOS ETERNOS';document.getElementById('region-name').textContent='Acampamento de Expedições';document.getElementById('region-lore').textContent='Entre uma conquista e outra, os Eternos abastecem suas mochilas e atravessam a fenda em busca de ouro. A expedição continua enquanto você explora os castelos.';document.getElementById('region-levels').textContent='Masmorra Livre · farm automático';document.getElementById('region-boss').textContent='Criaturas descobertas nos castelos';document.getElementById('region-condition').textContent='No jogo, este acampamento abre diretamente a Masmorra Livre.';const complete=document.getElementById('complete');complete.disabled=false;complete.textContent='VOLTAR AO MAPA';dialog.showModal();};
window.addEventListener('message',event=>{if(!gameMode||event.origin!==realmOrigin||event.source!==window.parent||event.data?.type!=='realm:farm')return;updateExpeditionCamp(event.data);});
function drawExpeditionCamp(t){if(expeditionCamp.hidden)return;const c=campCtx;c.clearRect(0,0,300,200);c.imageSmoothingEnabled=false;
 // Coordinates are normalized to the illustrated camp asset, not the full map.
 const fireX=188,fireY=108,portalX=250,portalY=51;
 const glow=(x,y,r,color,alpha)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.globalAlpha=1;};
 glow(fireX,fireY,25,'#ffad42',.2+.08*Math.sin(t*9));for(let i=0;i<3;i++){const h=6+Math.round((Math.sin(t*9+i*2)+1)*3);c.fillStyle=i===1?'#fff0a2bb':'#ffc04a99';c.fillRect(fireX-4+i*3,fireY+5-h,2,h);}
 for(let i=0;i<7;i++){const rise=(t*16+i*4)%28,x=fireX+Math.sin(t*3+i)*6;c.globalAlpha=(1-rise/28)*.8;c.fillStyle=i%2?'#ffe8a0':'#ff9c36';c.fillRect(Math.round(x),Math.round(fireY-rise),1,2);}c.globalAlpha=1;
 glow(portalX,portalY,23,'#43d9f4',.18+.07*Math.sin(t*2));for(let i=0;i<13;i++){const angle=t*.8+i/13*Math.PI*2;c.fillStyle=i%3?'#83f1ff':'#d9ffff';c.fillRect(Math.round(portalX+Math.cos(angle)*13),Math.round(portalY+Math.sin(angle)*23),1,2);}
 if(expeditionCamp.classList.contains('camp-active'))for(let i=0;i<3;i++){const rise=(t*8+i*12)%34;c.globalAlpha=Math.sin(rise/34*Math.PI)*.65;c.fillStyle='#ffd16a';c.fillRect(176+i*4,Math.round(104-rise),2,3);}c.globalAlpha=1;
}
if(gameMode)sendGame('realm:ready');

// Reveal the game panel only after the art, sky and pixel font can be painted.
let gameRevealPending=false;
async function revealGameMap(){if(gameRevealPending)return;gameRevealPending=true;try{const sky=new Image();sky.src=new URL('./realm-sky.png',document.baseURI).href;await Promise.all([art.decode(),sky.decode(),campArt.decode(),document.fonts.ready]);requestAnimationFrame(()=>requestAnimationFrame(()=>sendGame('realm:visible')));}catch{sendGame('realm:error');}}
