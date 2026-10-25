// The island is a navigation layer; existing screens retain their original actions.
function installRefuge({root,openWeapons,openDismantle,openUpgrade,openCampaign}){
 if(root.querySelector('.refuge-world'))return;
 const lobby=root.querySelector('#lobby');if(!lobby)return;
 root.classList.add('has-refuge');
 // Every full page in the new refuge returns to the island, including Escape.
 const originalPage=rx;rx=(options,draw)=>originalPage({...options,onBack:ex},draw);
 const asset=n=>new URL('./refuge-'+n+'.png',import.meta.url).href;
 const world=J('section',{class:'refuge-world',attrs:{'aria-label':'Refúgio dos Eternos'}}),scene=J('div',{class:'refuge-scene'}),art=J('img',{class:'refuge-island',attrs:{src:asset('cutout'),alt:''}}),canvas=J('canvas',{class:'refuge-effects',attrs:{'aria-hidden':'true'}}),nav=J('nav',{class:'refuge-destinations',attrs:{'aria-label':'Destinos do Refúgio'}});
 scene.append(J('div',{class:'refuge-clouds',attrs:{'aria-hidden':'true'}}),art,canvas,nav);world.append(scene,J('div',{class:'refuge-caption',text:'REFÚGIO DOS ETERNOS'}));lobby.append(world);
 const fit=()=>{const {width,height}=world.getBoundingClientRect();scene.style.width=(matchMedia('(max-width: 760px)').matches?width:Math.min(width,Math.max(0,height-24)*16/9))+'px';};
 const resize=new ResizeObserver(fit);resize.observe(world);fit();
 const originals=[...lobby.querySelectorAll('.shortcuts .shortcut')];
 const go=kind=>{const mode=lobby.querySelector('.mode-'+kind);if(mode)mode.click();};
 const shortcut=index=>originals[index]?.click();
 function choice(title,entries){const forge=title==='FORJAS',notes={'INVOCAR HERÓIS':'Desperte um novo aliado do Pacto.','INVOCAR ARMAS':'Encontre a arma da sua próxima conquista.','FORJAS':'Prepare seus heróis para a próxima batalha.','LÚMINA':'A guardiã que organiza suas forjas.','FUSÃO':'Una seus heróis e desperte um novo poder.','APRIMORAR EQUIPAMENTO':'Alimente suas armas com Brasas do Pacto.','DESMONTAR ARMAS':'Recupere Brasas dos seus equipamentos.'};dx({title,className:'eternal-menu '+(forge?'eternal-menu-forge':'eternal-menu-summon')},body=>{body.classList.add('refuge-choices');body.append(J('p',{class:'eternal-menu-intro',text:forge?'O fogo do Pacto fortalece seus eternos.':'Toda lenda começa com um chamado.'}));for(const [label,img,fn]of entries){const b=Y('alt',()=>{cx();fn();},label),icon=J('span',{class:'refuge-choice-icon',attrs:{'aria-hidden':'true'}});if(img==='ajudante-personagem.png')icon.append(J('span',{class:'mh-assistant-sprite refuge-choice-assistant'}));else if(img==='forge-ui-upgrade'||img==='forge-ui-fusion')icon.append(J('span',{class:'forge-ui-art '+(img==='forge-ui-upgrade'?'forge-ui-anvil':'forge-ui-fusion')}));else if(img)icon.append(J('img',{attrs:{src:new URL('./'+img,import.meta.url).href,alt:''}}));else icon.textContent='✦';b.replaceChildren(icon,J('span',{class:'refuge-choice-copy'},J('span',{class:'refuge-choice-label',text:label}),J('small',{class:'refuge-choice-description',text:notes[label]??''})),J('span',{class:'refuge-choice-arrow',text:'›',attrs:{'aria-hidden':'true'}}));body.append(b);}});}
 const destinations=[
 ['HERÓIS',22,44,()=>go('heroes'),'heroes'],['MASMORRA',26,20,()=>openCampaign?openCampaign():go('dungeon'),'dungeon'],
 ['INVOCAÇÕES',50,49,()=>choice('INVOCAÇÕES',[
 ['INVOCAR HERÓIS','pact-book.png',()=>shortcut(2)],['INVOCAR ARMAS','weapon-chest.png',openWeapons]]),'summon'],
 ['BAZAR',73,46,()=>go('market'),'market'],
 ['FORJAS',84,77,()=>choice('FORJAS',[
 ['FORJAS','forge-6-lv3.png',()=>shortcut(4)],['LÚMINA','ajudante-personagem.png',()=>shortcut(5)],['FUSÃO','forge-ui-fusion',()=>go('fusion')],['APRIMORAR EQUIPAMENTO','forge-ui-upgrade',()=>{ex();openUpgrade();}],['DESMONTAR ARMAS','brasa-do-pacto.png',()=>{ex();openDismantle();}]]),'forge'],
 ['RANKING',28,71,()=>go('leaderboard'),'ranking'],['TORRE DO INFINITO',88,18,()=>go('tower'),'tower']
 ];
 for(const [label,x,y,fn,kind]of destinations){const b=J('button',{class:'refuge-destination refuge-'+kind,attrs:{type:'button'},style:{left:x+'%',top:y+'%'}},J('span',{text:label}));b.onclick=fn;nav.append(b);}
 const mobileNav=J('nav',{class:'refuge-mobile-nav',attrs:{'aria-label':'Destinos para celular'}});
 for(const [label,x,y,fn,kind]of destinations){const button=J('button',{class:'refuge-mobile-link refuge-mobile-'+kind,attrs:{type:'button'},text:label});button.onclick=fn;mobileNav.append(button);}world.append(mobileNav);
 const themes={HEROES:'heroes',HERÓIS:'heroes',BLACKSMITHS:'forge',FORJAS:'forge',AJUDANTE:'forge',LÚMINA:'forge',PORTER:'forge',MARKET:'market',MERCADO:'market',SHOP:'market',LOJA:'market','RANKING FESTIVAL':'ranking',SUMMON:'summon',ARMAMENTOS:'summon',FUSION:'summon'};
 const interiorCanvases=new WeakMap();
 function decorate(){for(const page of root.querySelectorAll('.page')){const theme=themes[page.getAttribute('aria-label')];if(theme&&page.dataset.refugeTheme!==theme){page.dataset.refugeTheme=theme;page.style.setProperty('--refuge-interior','url("'+asset(theme)+'")');const c=J('canvas',{class:'refuge-interior-effects',attrs:{width:'836',height:'471','aria-hidden':'true'}});page.append(c);interiorCanvases.set(page,c);}}}
 const observer=new MutationObserver(decorate);observer.observe(root,{subtree:true,childList:true});decorate();
 // Low resolution effects deliberately use square pixels, not smooth particle sprites.
 canvas.width=836;canvas.height=471;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,last=0;
 const pixel=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
 function glow(x,y,r,color,a){ctx.globalAlpha=a;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.globalAlpha=1;}
 function renderInterior(page,t){const c=interiorCanvases.get(page);if(!c)return;const x=c.getContext('2d'),theme=page.dataset.refugeTheme;x.clearRect(0,0,836,471);const warm=theme==='forge'||theme==='market'||theme==='ranking';
  for(let i=0;i<35;i++){const px=(i*137)%836,py=471-((t*(warm?10:7)+i*53)%471);x.globalAlpha=(.25+.2*Math.sin(t+i))*(px>230&&px<610?.25:1);x.fillStyle=warm?'#ffc06b':'#6ddfff';x.fillRect(px,py,1+(i%2),2);}x.globalAlpha=1;
  if(theme==='forge')for(const [px,py,h]of [[586,140,131],[632,242,55],[800,270,57]]){x.globalAlpha=.45;for(let i=0;i<8;i++){const flow=(t*32+i*19)%h;x.fillStyle=i%2?'#ffcc55':'#ff6c17';x.fillRect(px+Math.sin(i)*3,py+flow,2,6);}}x.globalAlpha=1;
 }
 // Masks follow actual luminous liquid pixels, so highlights cannot drift
 // onto the stone or bridge even where a channel bends.
 const refugeFlows=[
  ['lava',[[559,318],[582,318],[590,324],[591,351],[602,361],[645,378],[645,390],[596,376],[580,367],[575,335],[560,333]]],
  ['lava',[[781,301],[796,301],[800,309],[800,332],[816,336],[813,347],[786,346],[783,324]]],
  ['water',[[34,241],[46,241],[48,292],[42,329],[34,317]]],
  ['water',[[213,368],[235,368],[236,389],[231,426],[225,451],[216,428],[217,390]]],
  ['water',[[678,396],[692,396],[695,430],[685,464],[678,446]]],
  ['water',[[729,384],[742,384],[744,420],[737,449],[730,433]]],
  ['water',[[733,99],[751,99],[752,136],[744,177],[735,156]]],
  ['water',[[788,109],[798,109],[799,138],[794,155],[788,146]]],
  ['water',[[575,263],[588,261],[590,282],[584,299],[576,291]]]
 ].map(([type,points])=>({type,points}));
 function initFlow(f){if(!art.complete||!art.naturalWidth)return false;f.x=Math.floor(Math.min(...f.points.map(p=>p[0])));f.y=Math.floor(Math.min(...f.points.map(p=>p[1])));f.w=Math.ceil(Math.max(...f.points.map(p=>p[0])))-f.x+1;f.h=Math.ceil(Math.max(...f.points.map(p=>p[1])))-f.y+1;
  f.mask=document.createElement('canvas');f.mask.width=f.w;f.mask.height=f.h;const m=f.mask.getContext('2d',{willReadFrequently:true});m.drawImage(art,-f.x,-f.y,836,471);const d=m.getImageData(0,0,f.w,f.h);
  for(let i=0;i<d.data.length;i+=4){const r=d.data[i],g=d.data[i+1],b=d.data[i+2];const liquid=f.type==='lava'?r>150&&r>g*1.12&&g>b*1.4:b>145&&g>95&&b>r*1.3&&g>r*1.3;if(!liquid)d.data[i+3]=0;}
  m.putImageData(d,0,0);m.globalCompositeOperation='destination-in';m.beginPath();f.points.forEach(([x,y],i)=>i?m.lineTo(x-f.x,y-f.y):m.moveTo(x-f.x,y-f.y));m.closePath();m.fill();f.layer=document.createElement('canvas');f.layer.width=f.w;f.layer.height=f.h;return true;
 }
 function drawRefugeLiquids(t){for(const f of refugeFlows){if(!f.mask&&!initFlow(f))continue;const c=f.layer.getContext('2d'),speed=f.type==='lava'?25:39;c.clearRect(0,0,f.w,f.h);c.imageSmoothingEnabled=false;
  for(let lane=0;lane<Math.ceil(f.w/3);lane++)for(let j=-1;j<Math.ceil(f.h/18)+1;j++){const y=((t*speed*(.85+lane%4*.08)+lane*7+j*18)%(f.h+18))-10;c.fillStyle=f.type==='lava'?(lane%3?'#ffc74f99':'#fff1b8bb'):(lane%3?'#7ee6ffa0':'#dcffffcf');c.fillRect(lane*3,y,1+lane%2,5+lane%3);}
  c.globalCompositeOperation='destination-in';c.drawImage(f.mask,0,0);c.globalCompositeOperation='source-over';ctx.drawImage(f.layer,f.x,f.y);
 }}
 function render(ms){frame=requestAnimationFrame(render);if(ms-last<(matchMedia('(pointer:coarse)').matches?80:50)||document.hidden)return;last=ms;const t=reduced.matches?0:ms/1000;const page=root.querySelector('.page[data-refuge-theme]');if(page){renderInterior(page,t);return;}if(root.hasAttribute('data-page')||root.dataset.screen!=='lobby'||document.querySelector('.tower-screen'))return;ctx.clearRect(0,0,836,471);
  // Cloud wisps drift independently across the foreground beneath the island.
  for(let i=0;i<12;i++){const x=((i*91+t*(i%2?2:3))%1000)-100,y=422+(i%3)*16;ctx.globalAlpha=.055;for(let k=0;k<7;k++)pixel(x+k*13,y-Math.sin(k)*8,29,12,'#b3d5ff');}ctx.globalAlpha=1;
  // Portal energy rotates around the dungeon entrance.
  glow(214,77,43,'#9b42ff',.35+.12*Math.sin(t*2));for(let i=0;i<26;i++){const a=i/26*Math.PI*2+t*.8,x=214+Math.cos(a)*23,y=77+Math.sin(a)*31;pixel(x,y,2,3,i%3?'#b062ff':'#f0ceff');}
  // Invocation streams rise in blue and orbit the central pedestal.
  glow(418,197,65,'#268fff',.25+.1*Math.sin(t*1.5));for(let i=0;i<30;i++){const y=220-((t*15+i*13)%90),x=418+Math.sin(i*2.4+t*.6)*35;pixel(x,y,1+(i%2),3,i%3?'#5ed6ff':'#d1fbff');}
  drawRefugeLiquids(t);
  for(let i=0;i<15;i++){const y=326-((t*11+i*6)%38);pixel(705+Math.sin(i*5+t)*18,y,1,2,'#ffbb52');}
  // Individual lantern pools flicker out of phase.
  for(const [x,y]of [[165,172],[334,139],[510,182],[630,192],[681,304],[182,318]])glow(x,y,16,'#ffc55c',.10+.07*Math.sin(t*4+x));
  // Cloth strips ripple gently, anchored to poles at the building edges.
  if(art.complete&&art.naturalWidth){const scale=art.naturalWidth/836;for(const [x,y,w,h]of [[58,126,14,45],[553,125,18,42],[167,257,17,42],[493,306,17,47]])for(let row=0;row<h;row++){const sway=reduced.matches?0:Math.sin(t*1.8+row*.16)*(row/h)*1.5;ctx.drawImage(art,x*scale,(y+row)*scale,w*scale,scale,Math.round(x+sway),y+row,w,1);}}
 }
 frame=requestAnimationFrame(render);
 // One installation per login; the page reload on logout releases observers and RAF.
 return {destroy(){observer.disconnect();resize.disconnect();rx=originalPage;cancelAnimationFrame(frame);world.remove();root.classList.remove('has-refuge');}};
}

