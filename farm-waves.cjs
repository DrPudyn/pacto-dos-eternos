function mhFarmWaveTick(battle){
 battle.farmWave??=1;
 battle.monsters=battle.monsters.filter(m=>!m.dead||battle.elapsed-m.hitAt<.9);
 if(battle.monsters.some(m=>!m.dead)||battle.pendingBossHp!==null){battle.farmWaveClearAt=null;return;}
 if(battle.farmWaveClearAt==null){battle.farmWaveClearAt=battle.elapsed;return;}
 if(battle.elapsed-battle.farmWaveClearAt<2)return;
 battle.farmWave++;battle.farmWaveClearAt=null;battle.farmWaveStartedAt=battle.elapsed;
 battle.monsters=[];battle.shots=[];
 for(const hero of battle.heroes){hero.path=[];hero.replan=false;hero.fired=false;hero.state.targetId=null;hero.state.targetBlows=0;hero.state.recentTargets=[];hero.state.action='idle';hero.state.actionTime=0;}
 battle.respawn();
}
const mhFarmCastleGold=require('./campaign-config.cjs').stages.map(stage=>stage.monsterGold);
const mhFarmVariantGold=[1,1.2,1.45,1.75];
function mhFarmMonsterGold(battle,monster){
 if(!battle.farmWavesEnabled||monster.boss||monster.dead)return null;
 const pool=battle.farmMobPool??globalThis.mhFarmMobPool;
 if(!Array.isArray(pool)||!pool.length)return null;
 let hash=2166136261;for(const c of String(monster.id)+':'+String(monster.spawnedAt))hash=Math.imul(hash^c.charCodeAt(0),16777619);
 const mob=pool[(hash>>>0)%pool.length];if(!Number.isInteger(mob?.region)||!Number.isInteger(mob?.variant))return null;
 monster.farmRegion=mob.region;monster.farmVariant=mob.variant;
 const base=mhFarmCastleGold[mob.region-1],factor=mhFarmVariantGold[mob.variant];
 return Number.isFinite(base)&&Number.isFinite(factor)?Math.round(base*factor*2*1e6):null;
}
function applyWaveRules(source){
 const patch=(from,to)=>{if(!source.includes(from))throw Error('Levas do farm: trecho não encontrado: '+from);source=source.replace(from,to);};
 const bountyRules=`const mhFarmCastleGold=${JSON.stringify(mhFarmCastleGold)},mhFarmVariantGold=${JSON.stringify(mhFarmVariantGold)};\n${mhFarmMonsterGold.toString()}`;
 patch('function ln(e,t){',mhFarmWaveTick.toString()+'\n'+bountyRules+'\nfunction ln(e,t){');
 patch('strike(e,t,n,r,i,a){if(t.dead||t.hp<=0)return;n=Math.round',`strike(e,t,n,r,i,a){if(t.dead||t.hp<=0)return;let farmGold=mhFarmMonsterGold(this,t);if(farmGold!==null)t.mhdg=farmGold;n=Math.round`);
 patch('this.landShots(),this.monsters.filter(e=>!e.dead&&!e.boss).length<=14&&this.respawn(),','this.landShots(),this.farmWavesEnabled?mhFarmWaveTick(this):this.monsters.filter(e=>!e.dead&&!e.boss).length<=14&&this.respawn(),');
 const fields='farmWavesEnabled:!!this.farmWavesEnabled,farmWave:this.farmWave??1,farmWaveClearAt:this.farmWaveClearAt??null,farmWaveStartedAt:this.farmWaveStartedAt??0,';
 patch('toState(){return{','toState(){return{'+fields);
 patch('snapshot(){return{','snapshot(){return{'+fields);
 patch('r.random.state=t.random,','r.random.state=t.random,r.farmWavesEnabled=!!t.farmWavesEnabled,r.rollBoss=(()=>r.farmWavesEnabled),r.farmWave=t.farmWave??1,r.farmWaveClearAt=t.farmWaveClearAt??null,r.farmWaveStartedAt=t.farmWaveStartedAt??0,');
 return source;
}
function applyWaveVisuals(source){
 const from='i=yr(r+(this.biomeElapsedOffset??0));i.index',to='i=t.farmWavesEnabled?mhFarmWaveBiome(t):yr(r+(this.biomeElapsedOffset??0));i.index';
 if(!source.includes(from))throw Error('Cenário por leva não encontrado.');source=source.replace(from,to);
 const render='this.onRender?.(t,this.huntId)';if(!source.includes(render))throw Error('Transição das levas não encontrada.');
 return source.replace(render,'mhFarmWaveVisual(this,t,r),'+render);
}
module.exports={applyWaveRules,applyWaveVisuals};
