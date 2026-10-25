const assert=require('node:assert/strict'),{createEngine,createCampaignBattle}=require('./shared-engine.cjs'),{stages}=require('./campaign-config.cjs');
const team=createEngine(null).engine.player.heroes.slice(0,1);team.forEach(h=>Object.assign(h,{atk:2,dur:2000,durability:10000}));
for(const strategy of ['aggressive','cautious','hunter']){
 const cfg={...stages[0],strategy},a=createCampaignBattle(team,cfg,321);a.advanceTo(150);const state=JSON.parse(JSON.stringify(a.toState())),b=createCampaignBattle(team,cfg,321,state);a.advanceTo(240);b.advanceTo(240);assert.equal(JSON.stringify(a.toState()),JSON.stringify(b.toState()),'restore deterministic '+strategy);
 assert(a.monsters.some(m=>m.objective));assert(a.monsters.some(m=>m.elite));assert(a.monsters.every(m=>m.family===1));assert(a.heroes.every(h=>Number.isFinite(h.state.posture)));
 for(const m of a.monsters){assert(m.x>0&&m.x<40&&m.y>0&&m.y<20);}
}
const cfg=stages[0],b=createCampaignBattle(team,cfg,12),h=b.heroes[0],m=b.monsters[0];h.state.skin='swordsman';m.hp=m.maxHp=1000;m.role='patrol';b.strike(h,m,100,false,false,false);assert.equal(m.hp,910);b.monsters.filter(x=>x.objective).forEach(x=>x.dead=true);b.strike(h,m,100,false,false,false);assert.equal(m.hp,810);m.vulnerableUntil=3;b.strike(h,m,100,false,false,false);assert.equal(m.hp,695);
console.log('OK: três estratégias, restauração determinística, postura válida, objetivos e vulnerabilidade.');
