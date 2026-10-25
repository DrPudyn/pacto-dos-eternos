const assert=require('assert/strict');
const {createEngine,createTowerBattle}=require('./shared-engine.cjs');
const {towerService}=require('./tower-service.cjs');
const {mapFor}=require('./tower-world.cjs');
const sample=createEngine(null).engine.player.heroes[0];
const heroes=Array.from({length:15},(_,i)=>({...structuredClone(sample),id:i+1,atk:300,dur:400,durability:2000,skills:[],status:'idle'}));
const confirmedKills=[],confirmedFloors=[];
const user={id:'tower-test',state:{balance:123000000,player:{chest:456000000,weaponSummons:15,mintCards:15,equipment:{weapons:[]}}}},tower=towerService({onCombat:(u,event)=>confirmedKills.push(event),onFloor:(u,event)=>confirmedFloors.push(event)}),ids=heroes.map(h=>h.id),original=JSON.stringify(heroes);
assert.throws(()=>tower.start(user,heroes,ids.slice(1)),/15/);
assert.throws(()=>tower.start(user,heroes,[...ids.slice(0,14),1]),/15/);
tower.start(user,heroes,ids);assert.throws(()=>tower.start(user,heroes,ids),/andamento/);
let now=user.tower.lastAt,iterations=0;
while(user.tower.completed<6&&user.tower.status==='active'&&iterations++<500){now+=3000;tower.tick(user,now);}
assert.ok(user.tower.completed>=6,'Team should clear at least six floors');assert.ok(user.tower.bosses>=1,'Boss on floor five must be defeated');assert.equal(user.state.balance,123000000,'Torre não credita ouro no saldo');assert.equal(user.state.player.chest,456000000,'Torre não credita ouro no baú');assert.equal(user.state.player.equipment.weapons.length,0,'Torre não cria equipamentos');assert.equal(user.state.player.weaponSummons,15,'Bosses da Torre não dão baús de armas');assert.equal(user.state.player.mintCards,15,'Bosses da Torre não dão pergaminhos');assert.equal(JSON.stringify(heroes),original,'Original collection must not lose energy');assert.equal(user.towerBest.floor,user.tower.completed);
assert.equal(confirmedKills.length,user.tower.kills);assert.equal(confirmedFloors.length,user.tower.completed);assert.equal(new Set(confirmedKills.map(e=>e.stream+':'+e.sequence)).size,confirmedKills.length);assert.ok(confirmedKills.some(e=>e.boss));assert.equal(confirmedFloors[4].floor,5);
const restored=JSON.parse(JSON.stringify(user)),newService=towerService();assert.equal(newService.view(restored).run.kills,user.tower.kills);assert.equal(newService.view(restored).run.floor,user.tower.floor);
newService.pause(restored);const pausedTicks=restored.tower.ticks;newService.tick(restored,restored.tower.lastAt+1000);assert.ok(restored.tower.ticks>pausedTicks||restored.tower.transitionUntil,'Sair da tela deve manter o combate ativo');
for(let floor=1;floor<=4;floor++){const map=mapFor(floor),start=42,seen=new Set([start]),q=[start];for(let i=0;i<q.length;i++)for(const d of [-41,41,-1,1]){const n=q[i]+d;if(n>=0&&n<861&&!map.blocked[n]&&!seen.has(n)){seen.add(n);q.push(n);}}assert.equal(seen.size,map.blocked.filter(x=>!x).length);}
for(const seed of [1,2]){const boss=createTowerBattle(heroes,5,seed).battle.monsters.find(m=>m.boss);assert.equal(boss.kind,'giant');assert.equal(boss.towerVariant,4);assert(boss.towerRegion>=1&&boss.towerRegion<=9);assert.equal(boss.hp,boss.maxHp);}
const exhausted={id:'exhausted'},weak=heroes.map(h=>({...h,durability:.5,atk:1})),weakService=towerService();weakService.start(exhausted,weak,ids);now=exhausted.tower.lastAt;for(let i=0;i<200&&exhausted.tower.status==='active';i++){now+=3000;weakService.tick(exhausted,now);}assert.equal(exhausted.tower.status,'finished');assert.ok(weakService.view(exhausted).run.reason);
console.log('OK: 15 fixos, mapas conectados, progressão, boss a cada 5, energia sem reparo, fim de tentativa, recorde e restauração.');
const legacy={id:'legacy',tower:{status:'active',floor:9},towerBest:{floor:8}};assert.equal(towerService().view(legacy).run,null);assert.equal(legacy.towerLegacy.floor,9);
assert.equal(createTowerBattle(heroes,5,42).battle.monsters.find(m=>m.boss).maxHp,100000);
