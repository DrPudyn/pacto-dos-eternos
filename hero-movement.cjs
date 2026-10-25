const multipliers=[1,1.10,1.25,1.45,1.65,4];
function mhHeroMoveSpeed(hero,rarityEnabled=false){
 const base=rarityEnabled?2.8*(mhHeroMoveMultipliers[hero.rarity]??1):Kt;
 return base*(hero.skills?.includes('swift')?mhSkillValue(hero,'swift'):1)*(hero.codexMove??1);
}
function applyMovementRules(source){
 const patch=(from,to)=>{if(!source.includes(from))throw Error('Movimentação: trecho não encontrado: '+from);source=source.replace(from,to);};
 patch('function ln(e,t){',`var mhHeroMoveMultipliers=${JSON.stringify(multipliers)};${mhHeroMoveSpeed.toString()}\nfunction ln(e,t){`);
 patch('let r=Kt*(fc(e,`swift`)?mhSkillValue(e.state,`swift`):1)*t*(e.state.codexMove??1);','let r=mhHeroMoveSpeed(n,!!this.rarityMovementEnabled)*t;');
 patch('r.random.state=t.random,r.tickCount=t.tick','r.random.state=t.random,r.rarityMovementEnabled=!!t.rarityMovementEnabled,r.skillKillXpEnabled=!!t.skillKillXpEnabled,r.tickCount=t.tick');
 patch('toState(){return{tick:this.tickCount','toState(){return{rarityMovementEnabled:!!this.rarityMovementEnabled,skillKillXpEnabled:!!this.skillKillXpEnabled,tick:this.tickCount');
 patch('snapshot(){return{tick:this.tickCount','snapshot(){return{rarityMovementEnabled:!!this.rarityMovementEnabled,skillKillXpEnabled:!!this.skillKillXpEnabled,tick:this.tickCount');
 patch('o=Kt*(e.skills.includes(`swift`)?Gt:1)','o=mhHeroMoveSpeed(e,!!this.state.rarityMovementEnabled)');
 patch('s=Math.floor(t*(r===`walk`?5+o:5))%a','s=Math.floor((r===`walk`?Math.max(0,c):t)*(r===`walk`?Math.min(12,5+o):5))%a');
 return source;
}
module.exports={multipliers,applyMovementRules};
