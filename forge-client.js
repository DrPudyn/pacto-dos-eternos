var mhForgeBridge=null;
function installForgeProgression(bridge){mhForgeBridge=bridge;}
function mhForgeUIStats(player,tier){return mhForgeStats(player??{},tier,mhForgeBridge?.getCurrent()?.codex?.bonuses?.repair??0);}
function mhForgeAssignmentBadge(hero){
 if(hero?.forgeSince==null)return null;
 const player=mhForgeBridge?.getCurrent()?.packet?.player;if(!player)return null;
 const current=player.heroes.find(h=>h.id===hero.id&&h.forgeSince!=null);if(!current)return null;
 const forge=mhForgeAssignments(player).get(current.id);
 return J('span',{class:'forge-assignment-badge',text:'EM PREPARAÇÃO · '+(forge?.name??'Reparo compartilhado')});
}
function mhForgeSpriteUrl(tier,level){return new URL('./forge-'+tier+'-lv'+Math.max(1,Math.min(3,level??1))+'.png',import.meta.url).href;}
function mhForgeSprite(tier,level,className=''){return J('img',{class:'forge-sprite '+className,attrs:{src:mhForgeSpriteUrl(tier,level),alt:forgeNames[tier-1]+' · LV '+Math.max(1,level??1),draggable:'false'}});}
function mhForgeMasteryPanel(player,tier,panel){
 const p=mhForgeProgress(player??{},tier),cost=p.level<3?mhForgeRequirement(tier,p.level):null,owned=player?.blacksmiths.some(s=>s.tier===tier),wrap=J('section',{class:'forge-mastery mastery-level-'+p.level}),label=J('div',{class:'forge-mastery-label'},J('strong',{text:'MAESTRIA DA FORJA · LV '+p.level}),J('span',{text:p.level===3?'MÁXIMO':Math.floor(p.xp).toLocaleString('pt-BR')+' / '+cost.xp.toLocaleString('pt-BR')+' XP'})),bar=J('div',{class:'forge-mastery-bar'},J('span',{style:{width:(cost?Math.min(100,p.xp/cost.xp*100):100)+'%'}}));
 wrap.append(label,bar,J('p',{text:'Cada forja em serviço gera XP e as cópias somam no progresso da categoria. Heróis em reparo geram XP extra: Comum 1× · Incomum 1,5× · Raro 2× · Épico 3× · Lendário 4× · Mítico 6×. O bônus termina ao completar a energia.'}));
 if(cost){const button=J('button',{class:'forge-mastery-upgrade',attrs:{type:'button'},text:`APRIMORAR → LV ${p.level+1} · ${cost.coins.toLocaleString('pt-BR')} OURO`});button.disabled=!owned||p.xp+1e-6<cost.xp||!mhForgeBridge||(mhForgeBridge.getCurrent().balance??0)<cost.coins*1e6;button.title=`Próximo nível: +${(p.level+1)*5}% de reparo${p.level===2?' e +1 vaga':''}`;button.onclick=async()=>{button.disabled=true;try{await mhForgeBridge.perform('forge/upgrade',{tier,expectedLevel:p.level});$('Maestria da forja aprimorada!','success');panel.refresh();}catch(e){$(e.message,'error');button.disabled=false;}};wrap.append(button);panel.live(()=>{const latest=mhForgeBridge?.getCurrent(),current=latest?.packet?.player;if(!current)return;const progress=mhForgeProgress(current,tier);if(progress.level!==p.level)return;label.lastElementChild.textContent=Math.floor(progress.xp).toLocaleString('pt-BR')+' / '+cost.xp.toLocaleString('pt-BR')+' XP';bar.firstElementChild.style.width=Math.min(100,progress.xp/cost.xp*100)+'%';button.disabled=!current.blacksmiths.some(s=>s.tier===tier)||progress.xp+1e-6<cost.xp||(latest.balance??0)<cost.coins*1e6;});}
 else wrap.append(J('strong',{class:'forge-mastery-max',text:'+15% DE REPARO · +1 VAGA'}));return wrap;
}

function mhForgeFleetSummary(player,panel){const box=J('p',{class:'forge-fleet-summary'});panel.live(()=>{const p=mhForgeBridge?.getCurrent()?.packet?.player??player,fleet=mhForgeFleet(p),slots=fleet.reduce((n,f)=>n+f.slots,0),used=Math.min(slots,Nn(p.heroes).length);box.textContent=fleet.length?fleet.length+' forja(s) em serviço · '+used+' / '+slots+' vagas ocupadas. Todas as categorias ganham XP juntas.':'Forjas pausadas. Coloque em serviço para liberar as vagas e ganhar XP.';});return box;}
