// Shared by authoritative battles and visual prediction. Defense applies to every hit.
function mhCampaignDefense(battle,defense){
 const reduction=Math.max(0,Math.min(.4,Number(defense)||0)),strike=battle.strike.bind(battle);
 battle.strike=function(hero,monster,damage,...rest){
  let armor=monster.boss?reduction:monster.role==='tank'?.2:monster.elite?.15:0;
  if(monster.vulnerableUntil>battle.elapsed)armor=0;
  else if(!monster.objective){
   if(battle.monsters.some(m=>!m.dead&&m.objective))armor+=.1;
   if(battle.monsters.some(m=>!m.dead&&m!==monster&&m.role==='protector'&&Math.abs(m.x-monster.x)+Math.abs(m.y-monster.y)<5))armor+=.15;
  }
  armor=Math.min(.6,armor);if(hero.state.skin==='spearman')armor*=.5;
  const opening=monster.vulnerableUntil>battle.elapsed&&battle.tactics?.strategy==='aggressive'?1.15:1;
  return strike(hero,monster,Math.max(1,Math.round(damage*(1-armor)*opening)),...rest);
 };
 return battle;
}
