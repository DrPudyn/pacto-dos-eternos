function mhPactIcon(className='icon',scale=2){return '<img class="'+className+'" src="'+W('ui/card-back.png')+'" alt="" style="width:'+16*scale+'px;height:'+16*scale+'px;object-fit:contain;background:none;image-rendering:pixelated">';}
function mhPactReveal(context,heroes){
 if(!heroes.length)return;cx();jx();
 const cardScale=heroes.length===1?6:window.innerWidth>=1400?4:window.innerWidth>=1000?3:window.innerWidth>=650?3:2,heroScale=cardScale===3?5:cardScale*1.5;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const overlay=J('section',{class:'pact-reveal',attrs:{role:'dialog','aria-modal':'true','aria-label':'Heróis do Salão dos Pactos'}}),panel=J('div',{class:'pact-reveal-panel'}),grid=J('div',{class:'pact-reveal-grid',style:{'--pact-columns':String(Math.min(8,heroes.length)),'--pact-width':40*cardScale+'px'}}),status=J('p',{class:'pact-status',attrs:{role:'status'},text:'O livro está despertando os pactos…'}),intro=J('div',{class:'pact-intro'},J('img',{attrs:{src:W('ui/summon-cards.png'),alt:'Grimório dos Pactos'}}));
 let closed=false,ready=false,count=0;const timers=new Set(),later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!closed)fn();},ms);timers.add(id);};
 function close(){closed=true;for(const id of timers)clearTimeout(id);document.removeEventListener('keydown',key);overlay.remove();previousFocus?.focus?.({preventScroll:true});}
 const previousFocus=document.activeElement,key=e=>{if(e.key==='Escape'){e.preventDefault();close();}};
 const finish=Y('main',close,'CONTINUAR'),view=Y('alt',()=>{close();context.panels.heroes({filter:'all',heroId:heroes[0].id});},'VER HERÓIS'),revealAll=Y('main',()=>{wake();for(const [i,item]of items.entries())later(item.reveal,reduced?0:i*90);},'REVELAR TODOS'),skip=Y('alt',()=>{wake();for(const item of items)item.reveal(true);},'PULAR ANIMAÇÃO');finish.hidden=view.hidden=true;
 const items=heroes.map(hero=>{
  const node=J('button',{class:'pact-hero',style:{'--rarity':to(hero.rarity)},attrs:{type:'button','aria-label':'Abrir selo de pacto'}}),seal=J('img',{class:'pact-seal',attrs:{src:W('ui/card-back.png'),alt:''}}),result=J('span',{class:'pact-result'},mb(hero,cardScale,heroScale),J('strong',{text:U(hero.rarity).toUpperCase()}),J('span',{text:no(hero)}),J('small',{text:`ATQ ${hero.atk} · VEL ${hero.atkSpd} · DUR ${hero.dur}`}));
  node.title='Selo de pacto';result.setAttribute('aria-hidden','true');
  let revealed=false;function reveal(instant=false){if(revealed||!ready||closed)return;revealed=true;result.removeAttribute('aria-hidden');node.classList.add('pact-open');if(instant||reduced)node.classList.add('pact-instant');node.setAttribute('aria-label',`${U(hero.rarity)} ${no(hero)} #${hero.id}`);count++;status.textContent=`${count} de ${heroes.length} heróis revelados`;if(count===heroes.length){revealAll.hidden=skip.hidden=true;finish.hidden=view.hidden=false;finish.focus({preventScroll:true});}}
  node.append(seal,result);node.onclick=()=>reveal();grid.append(node);return {node,reveal};
 });
 function wake(){if(ready)return;ready=true;overlay.classList.add('pact-ready');intro.remove();status.textContent='Toque em um selo para revelar seu herói.';for(const item of items)item.node.disabled=false;}
 for(const item of items)item.node.disabled=true;
 panel.append(J('header',{},J('h1',{text:'SALÃO DOS PACTOS'}),J('p',{text:'Novos laços. Novos heróis.'})),grid,status,J('div',{class:'pact-actions'},revealAll,skip,view,finish));overlay.append(panel,intro);z(document,'modal-root').append(overlay);document.addEventListener('keydown',key);skip.focus({preventScroll:true});later(wake,reduced?0:1600);
}
