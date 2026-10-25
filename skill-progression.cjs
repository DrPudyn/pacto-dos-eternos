const mhSkillXpRate=6;
const mhSkillKillXp={mob:12,boss:120};
const mhSkillCosts=[0,2500,5000,10000],mhSkillXpStep=21600*30,mhSkillXpMax=mhSkillXpStep*3;
const mhSkillDefs={
 precision:{name:'Precisão',values:[.20,.22,.24,.26]},
 enemyDamage:{name:'Dano contra monstros',values:[20,23,26,30]},
 bossDamage:{name:'Dano contra bosses',values:[50,55,60,65]},
 swift:{name:'Passos rápidos',values:[1.5,1.55,1.6,1.65]},
 blacksmith:{name:'Ferreiro',values:[.5,.6,.7,.8]},
 fury:{name:'Fúria',values:[1,1.1,1.2,1.3]},
 execute:{name:'Execução',values:[1.5,1.55,1.6,1.65]}
};
function mhSkillLevel(hero,key){const n=hero.skillLevels?.[key];return Number.isInteger(n)&&n>=0&&n<=3?n:0;}
function mhSkillValue(hero,key){return mhSkillDefs[key].values[mhSkillLevel(hero,key)];}
function mhSkillNormalize(hero){
 hero.skillXpTicks=Number.isSafeInteger(hero.skillXpTicks)?Math.max(0,Math.min(mhSkillXpMax,hero.skillXpTicks)):0;
 hero.skillLevels=Object.fromEntries((hero.skills??[]).filter(k=>Object.hasOwn(mhSkillDefs,k)).map(k=>[k,mhSkillLevel(hero,k)]));return hero;
}
function mhSkillDescription(key,level){
 const n=mhSkillDefs[key].values[level],pct=v=>String(Math.round(v*10000)/100).replace('.',',');
 if(key==='precision')return `${pct(n)}% de chance de atacar sem consumir energia.`;
 if(key==='enemyDamage')return `+${n} de ataque contra monstros.`;
 if(key==='bossDamage')return `+${n} de ataque contra bosses.`;
 if(key==='swift')return `+${pct(n-1)}% de velocidade de movimento. Atua no farm e nos modos com deslocamento; não acelera turnos na campanha.`;
 if(key==='blacksmith')return `+${String(n).replace('.',',')} de energia reparada por minuto em repouso. Não cura vida durante a campanha.`;
 if(key==='execute')return `+${pct(n-1)}% de dano contra inimigos com menos de 25% de vida.`;
 return `Golpes seguidos contra o mesmo alvo aumentam o dano em até ${pct(.18*n)}%.`;
}
function mhSkillUpgrade(player,battle,heroId,key,expectedLevel,balance){
 const hero=player.heroes.find(h=>h.id===heroId);if(!hero)throw Error('Herói não encontrado no seu perfil.');
 if(!Object.hasOwn(mhSkillDefs,key)||!hero.skills.includes(key))throw Error('Esse herói não possui esta skill.');
 mhSkillNormalize(hero);const level=mhSkillLevel(hero,key);
 if(level===3)throw Error('Esta skill já está no nível máximo.');
 if(!Number.isInteger(expectedLevel)||expectedLevel!==level)throw Error('O nível dessa skill mudou. Atualize a ficha antes de aprimorar.');
 const target=level+1,ticks=mhSkillXpStep,coins=mhSkillCosts[target];
 if(hero.skillXpTicks<ticks)throw Error('Experiência insuficiente para essa melhoria.');
 if(balance<coins*1e6)throw Error('Ouro insuficiente para essa melhoria.');
 hero.skillXpTicks-=ticks;hero.skillLevels[key]=target;
 for(const actor of battle.heroes)if(actor.state.heroId===heroId){actor.state.skillXpTicks=hero.skillXpTicks;actor.state.skillLevels={...hero.skillLevels};}
 return {heroId,skill:key,level:target,coins,xp: ticks/30};
}
function mhSkillAward(player,battle,gains){
 for(const {heroId,ticks}of gains){if(!Number.isSafeInteger(ticks)||ticks<1)continue;const hero=player.heroes.find(h=>h.id===heroId);if(!hero)continue;mhSkillNormalize(hero);hero.skillXpTicks=Math.min(mhSkillXpMax,hero.skillXpTicks+ticks);for(const actor of battle.heroes)if(actor.state.heroId===heroId)actor.state.skillXpTicks=hero.skillXpTicks;}
}
function mhSkillKillAward(battle,actor,monster){
 if(!battle.skillKillXpEnabled||monster.festivalExcluded)return 0;
 const hero=actor.state,before=Math.max(0,hero.skillXpTicks??0),ticks=(monster.boss?mhSkillKillXp.boss:mhSkillKillXp.mob)*30;
 hero.skillXpTicks=Math.min(mhSkillXpMax,before+ticks);const credited=hero.skillXpTicks-before;
 hero.skillXpEarnedTicks=(hero.skillXpEarnedTicks??0)+credited;return credited;
}
const runtime=`var mhSkillXpRate=${mhSkillXpRate},mhSkillKillXp=${JSON.stringify(mhSkillKillXp)};var mhSkillCosts=${JSON.stringify(mhSkillCosts)},mhSkillXpStep=${mhSkillXpStep},mhSkillXpMax=${mhSkillXpMax},mhSkillDefs=${JSON.stringify(mhSkillDefs)};\n`+[mhSkillLevel,mhSkillValue,mhSkillNormalize,mhSkillDescription,mhSkillUpgrade,mhSkillAward,mhSkillKillAward].map(fn=>fn.toString()).join('\n');
function applySkillProgression(source){
 const patch=(from,to)=>{if(!source.includes(from))throw Error('Skills: trecho não encontrado: '+from.slice(0,100));source=source.replace(from,to);};
 patch('function ln(e,t){',runtime+'\nfunction ln(e,t){');
 patch('...miniHeroCodexStats(e.rarity)}}','...miniHeroCodexStats(e.rarity),skillLevels:{...e.skillLevels},skillXpTicks:e.skillXpTicks??0,skillXpEarnedTicks:0}}');
 patch('updateHero(e,t){let n=e.state;', 'updateHero(e,t){let n=e.state;if(n.departedAt===null&&!n.leaving&&(n.action===`walk`||n.action===`attack`)){n.skillXpTicks=Math.min(mhSkillXpMax,(n.skillXpTicks??0)+mhSkillXpRate);n.skillXpEarnedTicks=(n.skillXpEarnedTicks??0)+mhSkillXpRate;}');
 patch('strike(e,t,n,r,i,a){','strike(e,t,n,r,i,a){if(t.dead||t.hp<=0)return;');
 patch('t.dead&&(this.killCount+=1,','t.dead&&(mhSkillKillAward(this,e,t),this.killCount+=1,');
 patch('this.departures.push({heroId:t.heroId,tick:this.tickCount,durability:t.durability})','this.departures.push({heroId:t.heroId,tick:this.tickCount,durability:t.durability,skillXpTicks:t.skillXpTicks??0,skillXpEarnedTicks:t.skillXpEarnedTicks??0})');
 patch('function xc(e,t){for(let[n,r]of t.battle.durabilities()){let t=e.heroes.find(e=>e.id===n);t?.status===`working`&&(t.durability=r)}}','function xc(e,t){for(const actor of t.battle.heroes){const h=e.heroes.find(h=>h.id===actor.state.heroId);if(h){h.skillXpTicks=actor.state.skillXpTicks??h.skillXpTicks??0;if(h.status===`working`)h.durability=actor.state.durability;}}}');
 patch('i.durability=r.durability,i.restingSince=a','i.durability=r.durability,i.skillXpTicks=r.skillXpTicks??i.skillXpTicks??0,i.restingSince=a');
 patch('fc(e,`precision`)&&this.random.next()<.2','fc(e,`precision`)&&this.random.next()<mhSkillValue(e.state,`precision`)');
 patch('fc(e,`swift`)?Gt:1','fc(e,`swift`)?mhSkillValue(e.state,`swift`):1');
 patch('fc(e,`bossDamage`)?50:0:fc(e,`enemyDamage`)?20:0','fc(e,`bossDamage`)?mhSkillValue(n,`bossDamage`):0:fc(e,`enemyDamage`)?mhSkillValue(n,`enemyDamage`):0');
 patch('a*=1+Ut[Math.min(n.streak,Ut.length-1)]','a*=1+Ut[Math.min(n.streak,Ut.length-1)]*mhSkillValue(n,`fury`)');
 patch('i&&(a*=Wt)','i&&(a*=mhSkillValue(n,`execute`))');
 patch('(e.skills.includes(`blacksmith`)?Dn:0)','(e.skills.includes(`blacksmith`)?mhSkillValue(e,`blacksmith`):0)');
 patch('vb(e.skills,3)','mhSkillPicker(e,!!n.fixed)');
 patch('n.weaponAction??null),J(`div`,{class:`sheet-actions`}','n.weaponAction??null),mhSkillXpBar(e,!!n.fixed),J(`div`,{class:`sheet-actions`}');
 patch('_b(e.skills,2),r)}var iC=', 'mhSkillBadges(e,2),r)}var iC=');
 patch('function Tb(e,t){for(let n of t.querySelectorAll(`[data-dur-hero]`)){let t=e.hero(Number(n.dataset.durHero));t&&wb(n,t,e.durability(t))}}','function Tb(e,t){for(let n of t.querySelectorAll(`[data-dur-hero]`)){let t=e.hero(Number(n.dataset.durHero));t&&wb(n,t,e.durability(t))}mhSkillRefresh(t);}');
 return source;
}
module.exports={mhSkillXpRate,mhSkillCosts,mhSkillXpStep,mhSkillXpMax,mhSkillDefs,mhSkillLevel,mhSkillValue,mhSkillNormalize,mhSkillDescription,mhSkillUpgrade,mhSkillAward,applySkillProgression};
