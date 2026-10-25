const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const {bosses,bossAppearance}=require('./boss-visuals.cjs');
const {createEngine}=require('./shared-engine.cjs');
const r=createEngine(null),b=r.engine.live.battle;
for(const skin of bosses){
 b.pendingBossSkin=skin;b.placeBoss(100000);
 const monster=b.monsters.at(-1);assert.equal(monster.bossSkin,skin);assert.equal(bossAppearance(monster),skin);
 assert.equal(b.pendingBossSkin,null);assert.equal(b.toState().monsters.at(-1).bossSkin,skin);
 assert(fs.existsSync('minihero-offline/shared-build/boss-'+skin+'.png'));
}
const pending=createEngine(null);pending.engine.live.battle.pendingBossSkin='dragao';pending.engine.live.battle.pendingBossHp=100000;
assert.equal(createEngine(pending.export()).engine.live.battle.pendingBossSkin,'dragao');
const source=fs.readFileSync('minihero-offline/shared-build/app-0-_Askj9.js','utf8');
const vars=source.slice(source.indexOf('var miniHeroBossKinds='),source.indexOf('var ob=class'));
const method=source.slice(source.indexOf('renderCustomBoss(e,t,n){'),source.indexOf('renderMonsters(e,t){'));
let calls=[];const scope={calls,tb:.6,Yy:1,Gy:5,ab:()=>{}};vm.createContext(scope);
vm.runInContext(vars+';var render=({'+method+'}).renderCustomBoss;',scope);
const actor={index:0,sprite:{scale:{set(){} }},container:{},bar:{clear(){}},marker:{clear(){}}};
const renderer={state:{heroes:[]},crop(...args){calls.push(args);return {};}};
for(const skin of bosses){assert.equal(scope.render.call(renderer,actor,{id:'m1',boss:true,bossSkin:skin,spawnedAt:0,hitAt:-100,hp:100,maxHp:100},1),true);assert.deepEqual(calls.at(-1),['bosses/'+skin,240,0,48,48]);}
assert.equal(scope.render.call(renderer,actor,{id:'m1',boss:true,dead:true,spawnedAt:0,hitAt:1},2),false);
console.log('OK: six boss textures, explicit selection, queued skin persistence, render frames and death fade.');
