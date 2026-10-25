var mhSkillBridge=null,mhSkillSelection=new Map(),mhSkillBusy=new Set();
function installSkillProgression(bridge){mhSkillBridge=bridge;}
function mhSkillCurrent(hero){return mhSkillBridge?.getCurrent()?.packet?.player?.heroes.find(h=>h.id===hero.id)??hero;}
function mhSkillXpBar(hero,readonly=false){
 const wrap=J('div',{class:'mh-xp-block',attrs:readonly?{}:{'data-skill-xp-hero':String(hero.id)}}),label=J('div',{class:'mh-xp-label'},J('strong',{text:'XP DO HERÓI'}),J('span',{class:'mh-xp-count'})),bar=J('div',{class:'mh-xp-bar',attrs:{role:'progressbar','aria-label':'Experiência do herói',title:'Masmorra automática: 6 XP por segundo andando ou atacando, +12 XP pelo último golpe em monstros e +120 XP em bosses naturais. Repouso não gera XP. Cada melhoria consome 21.600 XP.','aria-valuemin':'0','aria-valuemax':String(mhSkillXpMax/30)}}),fill=J('span',{class:'mh-xp-fill'});
 bar.append(fill,...[1,2,3].map(n=>J('span',{class:'mh-xp-marker mh-xp-marker-'+n,text:String(n),attrs:{title:`${n}/3 da barra: ${n} melhoria(s) disponível(is)`}})));wrap.append(label,bar);mhSkillPaintXp(wrap,hero);return wrap;
}
function mhSkillPaintXp(wrap,hero){const xp=Math.max(0,Math.min(mhSkillXpMax,hero.skillXpTicks??0)),bar=wrap.querySelector('.mh-xp-bar');wrap.querySelector('.mh-xp-count').textContent=`${Math.floor(xp/30).toLocaleString('pt-BR')} / ${(mhSkillXpMax/30).toLocaleString('pt-BR')} XP`;wrap.querySelector('.mh-xp-fill').style.width=(xp/mhSkillXpMax*100)+'%';bar.setAttribute('aria-valuenow',String(Math.floor(xp/30)));bar.setAttribute('aria-valuetext',Math.floor(xp/30)+' XP, usada individualmente em cada melhoria');for(const marker of wrap.querySelectorAll('.mh-xp-marker'))marker.classList.toggle('reached',xp>=Number(marker.textContent)*mhSkillXpStep);}
function mhSkillBadges(hero,scale=2){return J('span',{class:'mh-skill-badges'},...hero.skills.map(key=>{const level=mhSkillLevel(hero,key);return J('span',{class:'mh-skill-mini mh-level-'+level,attrs:{title:`${mhSkillDefs[key].name} · Nível ${level}: ${mhSkillDescription(key,level)}`}},gb(key,scale),J('small',{text:String(level)}));}));}
function mhSkillMarketInfo(hero){return J('div',{class:'mh-market-info'},J('p',{class:'mh-market-label',text:'SKILLS E MELHORIAS'}),J('div',{class:'mh-market-skill-list'},...hero.skills.map(key=>{const level=mhSkillLevel(hero,key);return J('div',{class:'mh-market-skill mh-level-'+level},gb(key,2),J('span',{},J('strong',{text:`${mhSkillDefs[key].name} · LV ${level}`}),J('small',{text:mhSkillDescription(key,level)})));})),mhSkillXpBar(hero,true));}
function mhSkillPicker(initial,readonly=false){
 const container=J('div',{class:'mh-skill-progression'}),icons=J('div',{class:'skill-badges skill-picker mh-skill-picker'}),info=J('div',{class:'mh-skill-info'}),title=J('strong'),current=J('p'),next=J('p',{class:'mh-skill-next'}),requirements=J('p',{class:'mh-skill-requirements'}),message=J('p',{class:'mh-skill-message',attrs:{role:'status'}}),upgrade=J('button',{class:'mh-skill-upgrade',attrs:{type:'button'}});
 let selected=mhSkillSelection.get(initial.id),expanded=mhSkillSelection.has(initial.id);if(!initial.skills.includes(selected))selected=initial.skills[0];
 info.append(title,current,next,requirements,upgrade,message);container.append(icons,info);
 for(const key of initial.skills){const icon=J('button',{class:'skill-badge mh-skill-icon',attrs:{type:'button','data-skill':key}},gb(key,3),J('small',{class:'mh-skill-level'}));icon.onclick=()=>{expanded=!(selected===key&&expanded);selected=key;if(expanded)mhSkillSelection.set(initial.id,key);else mhSkillSelection.delete(initial.id);message.textContent='';paint();};icons.append(icon);}
 function paint(){
  const hero=readonly?initial:mhSkillCurrent(initial);if(!selected)return;
  for(const icon of icons.children){const key=icon.dataset.skill,level=mhSkillLevel(hero,key);icon.className='skill-badge mh-skill-icon mh-level-'+level;icon.classList.toggle('selected',key===selected);icon.setAttribute('aria-pressed',String(key===selected));icon.setAttribute('aria-label',`${mhSkillDefs[key].name} nível ${level}`);icon.querySelector('.mh-skill-level').textContent='LV '+level;}
  const level=mhSkillLevel(hero,selected),target=level+1;
  title.textContent=`${mhSkillDefs[selected].name} · Nível ${level}`;current.textContent='Atual: '+mhSkillDescription(selected,level);
  requirements.hidden=true;next.hidden=upgrade.hidden=readonly||level===3||!expanded;
  if(level===3){next.hidden=false;next.textContent='Nível máximo alcançado.';return;}
  next.textContent=`Nível ${target}: ${mhSkillDescription(selected,target)}`;
  const xp=mhSkillXpStep,coins=mhSkillCosts[target],hasXp=(hero.skillXpTicks??0)>=xp,balance=mhSkillBridge?.getCurrent()?.balance??0;
  requirements.textContent=`${(xp/30).toLocaleString('pt-BR')} XP (1/3 da barra) + ${coins.toLocaleString('pt-BR')} Ouro${hasXp?' · XP suficiente':' · Falta XP'}`;
  upgrade.textContent=mhSkillBusy.has(hero.id)?'APRIMORANDO…':`APRIMORAR → LV ${target} · ${coins.toLocaleString('pt-BR')} OURO`;
  upgrade.disabled=!mhSkillBridge||mhSkillBusy.has(hero.id)||!hasXp||balance<coins*1e6;
 }
 upgrade.onclick=async()=>{
  if(readonly||mhSkillBusy.has(initial.id))return;const hero=mhSkillCurrent(initial),skill=selected,expectedLevel=mhSkillLevel(hero,skill);mhSkillBusy.add(hero.id);message.textContent='Salvando melhoria…';paint();
  try{await mhSkillBridge.upgrade({heroId:hero.id,skill,expectedLevel});message.textContent='Skill aprimorada! XP e Ouro descontados.';$(`${mhSkillDefs[skill].name} aprimorada para o nível ${expectedLevel+1}.`,'success');}
  catch(e){message.textContent=e.message;}
  finally{mhSkillBusy.delete(hero.id);paint();mhSkillRefresh(document);}
 };
 container._mhSkillRefresh=paint;paint();return container;
}
function mhSkillRefresh(root){
 if(!mhSkillBridge)return;const heroes=mhSkillBridge.getCurrent()?.packet?.player?.heroes??[];
 for(const wrap of root.querySelectorAll('[data-skill-xp-hero]')){const hero=heroes.find(h=>h.id===Number(wrap.dataset.skillXpHero));if(hero)mhSkillPaintXp(wrap,hero);}
 for(const picker of root.querySelectorAll('.mh-skill-progression'))picker._mhSkillRefresh?.();
}
