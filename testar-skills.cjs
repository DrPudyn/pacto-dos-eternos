const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const {createEngine}=require('./shared-engine.cjs'),{service}=require('./shared-service.cjs'),{towerService}=require('./tower-service.cjs'),rules=require('./skill-progression.cjs');
const {mhSkillXpStep:step,mhSkillXpMax:cap}=rules;
function hero(id=1,extra={}){return {id,skin:'swordsman',rarity:2,atk:100,atkSpd:80,dur:200,durability:1000,range:1,skills:Object.keys(rules.mhSkillDefs),skillLevels:{},skillXpTicks:0,status:'idle',restingSince:null,forgeSince:null,mintedAt:1,...extra};}
async function coreTests(){
 assert.equal(step/(30*rules.mhSkillXpRate),3600,'Uma melhoria por hora ativa');
 const direct=hero(99,{skillXpTicks:cap});for(let level=0;level<3;level++){rules.mhSkillUpgrade({heroes:[direct]},{heroes:[]},99,'precision',level,100000e6);assert.equal(direct.skillXpTicks,cap-(level+1)*step,'Cada melhoria consome exatamente um terço');}assert.equal(direct.skillLevels.precision,3);
 const runtime=createEngine(null),e=runtime.engine;e.player.heroes=[hero()];await e.action('heroes/work',{heroIds:[1]});const b=e.live.battle,h=b.heroes[0];
 b.rollBoss=()=>false;b.advanceTo(b.tick+300);await e.action('state');assert.ok(e.player.heroes[0].skillXpTicks>0&&e.player.heroes[0].skillXpTicks<=300*rules.mhSkillXpRate,'Combate gera XP real');assert.equal(e.player.heroes[0].skillXpTicks%rules.mhSkillXpRate,0,'Taxa 6x no combate real');
 const earned=e.player.heroes[0].skillXpTicks;await e.action('heroes/rest',{heroIds:[1]});b.advanceTo(b.tick+100);await e.action('state');assert.equal(e.player.heroes[0].skillXpTicks,earned,'Repouso não gera XP');
 const restored=createEngine(runtime.export()).engine;assert.equal(restored.player.heroes[0].skillXpTicks,earned);
 const active=createEngine(null).engine;active.player.heroes=[hero(1,{skillXpTicks:cap})];await active.action('heroes/work',{heroIds:[1]});active.upgradeSkill(1,'bossDamage',0);assert.equal(active.live.battle.heroes[0].state.skillLevels.bossDamage,1);assert.equal(active.live.battle.heroes[0].state.skillXpTicks,cap-step);active.live.battle.advanceTo(30);await active.action('state');assert.ok(active.player.heroes[0].skillXpTicks>=cap-step&&active.player.heroes[0].skillXpTicks<cap-step+30*rules.mhSkillXpRate+1,'Combate não recupera XP que já foi gasta');
 const depletion=createEngine(null).engine;depletion.player.heroes=[hero(1,{durability:.5,skills:[]})];await depletion.action('heroes/work',{heroIds:[1]});depletion.live.battle.advanceTo(900);const departure=depletion.live.battle.departures[0];assert.ok(departure);depletion.live.startedAt=Date.now()-31000;await depletion.action('state');assert.equal(depletion.player.heroes[0].skillXpTicks,departure.skillXpTicks,'XP preservada quando o ator sai e é removido');
 const combat=createEngine(null).engine;combat.player.heroes=[hero()];await combat.action('heroes/work',{heroIds:[1]});const battle=combat.live.battle,actor=battle.heroes[0];
 actor.state.critChance=0;actor.state.aoe=1;
 function damage(skill,level,boss=false){actor.state.skills=[skill];actor.state.skillLevels={[skill]:level};actor.state.streak=skill==='fury'?4:0;actor.state.streakTarget='target';const target={id:'target',x:10.5,y:5.5,hp:skill==='execute'?240:10000,maxHp:skill==='execute'?1000:10000,dead:false,boss,mhdg:0};battle.hit(actor,target);return battle.events.at(-1).damage;}
 assert.equal(damage('bossDamage',0,true),150);assert.equal(damage('bossDamage',3,true),165);
 assert.equal(damage('enemyDamage',0),120);assert.equal(damage('enemyDamage',3),130);
 assert.equal(damage('execute',0),150);assert.equal(damage('execute',3),165);
 assert.equal(damage('fury',0),118);assert.equal(damage('fury',3),123);
 actor.state.skills=['precision'];actor.state.skillLevels={precision:3};battle.random.next=()=>.25;const target=battle.monsters.find(m=>!m.dead),dur=actor.state.durability;battle.startAttack(actor,target,0);assert.equal(actor.state.durability,dur);actor.state.skillLevels.precision=0;battle.startAttack(actor,target,0);assert.equal(actor.state.durability,dur-.5);
 actor.state.skills=['swift'];actor.state.skillLevels={swift:3};actor.state.action='walk';actor.state.x=5.5;actor.state.y=5.5;actor.state.targetId=target.id;actor.path=[{x:8.5,y:5.5}];actor.replan=false;actor.state.leaving=false;battle.updateHero(actor,.1);assert.ok(Math.abs(actor.state.x-5.5-.396)<1e-8);
 const repair=createEngine(null).engine;repair.player.heroes=[hero(1,{status:'resting',skills:['blacksmith'],skillLevels:{blacksmith:3},durability:10})];repair.player.repairedAt=Date.now()-60000;await repair.action('state');assert.ok(Math.abs(repair.player.heroes[0].durability-11.3)<.002);
 const account={id:'skill-tower'},team=Array.from({length:15},(_,i)=>hero(i+1,{skillLevels:{bossDamage:2}})),gains=[];let tower=towerService({onExperience:(_,rows)=>gains.push(...rows)});tower.start(account,team,team.map(h=>h.id));const at=account.tower.lastAt;tower.tick(account,at+1000);tower.tick(account,at+2000);assert.ok(gains.reduce((n,g)=>n+g.ticks,0)>0,'Torre também concede XP');team[0].skillLevels.bossDamage=3;assert.equal(tower.view(account).run.state.heroes[0].state.skillLevels.bossDamage,2,'Torre mantém skills da entrada');const saved=JSON.parse(JSON.stringify(account)),count=gains.length;tower=towerService({onExperience:(_,rows)=>gains.push(...rows)});tower.tick(saved,saved.tower.lastAt);assert.equal(gains.length,count,'Restauração não duplica XP');
 const award=createEngine(null).engine;award.player.heroes=[hero(1,{skillXpTicks:cap-2})];award.awardSkillXp([{heroId:1,ticks:10}]);assert.equal(award.player.heroes[0].skillXpTicks,cap,'XP limitada a uma barra');
 console.log('OK motor: XP em combate, repouso, saída, limite, restauração; sete skills reais; skills fixas e XP da Torre.');
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'minihero-skills-')),file=path.join(dir,'jogadores.json');let app=service({dir});
const server=http.createServer((req,res)=>app.handle(req,res,new URL(req.url,'http://localhost')));
server.listen(0,'127.0.0.1',async()=>{
 const base=`http://127.0.0.1:${server.address().port}/shared-api/`;
 async function call(route,data,cookie=''){const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,value:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 function fixture(edit){app.close();const db=JSON.parse(fs.readFileSync(file));edit(db);fs.writeFileSync(file,JSON.stringify(db));app=service({dir});}
 try{
  await coreTests();
  const a=await call('register',{name:'Skills A',password:'skills-test-profile-a'}),b=await call('register',{name:'Skills B',password:'skills-test-profile-b'});
  fixture(db=>{for(const u of db.users)u.state.balance=100000e6;const u=db.users.find(u=>u.name==='Skills A');u.state.player.heroes=[hero(1001,{skillXpTicks:cap}),hero(1002)];u.state.nextId=1003;});
  assert.equal((await call('skills/upgrade',{heroId:1001,skill:'bossDamage',expectedLevel:0})).status,401);
  assert.equal((await call('skills/upgrade',{heroId:1001,skill:'bossDamage',expectedLevel:0},b.cookie)).status,400);
  assert.equal((await call('skills/upgrade',{heroId:1002,skill:'bossDamage',expectedLevel:0},a.cookie)).status,400);
  assert.equal((await call('skills/upgrade',{heroId:1001,skill:'invalid',expectedLevel:0},a.cookie)).status,400);
  const before=(await call('state',undefined,a.cookie)).value.balance;
  const first=await call('skills/upgrade',{heroId:1001,skill:'bossDamage',expectedLevel:0},a.cookie);assert.equal(first.status,200);const upgraded=first.value.packet.player.heroes.find(h=>h.id===1001);assert.equal(upgraded.skillLevels.bossDamage,1);assert.equal(upgraded.skillXpTicks,cap-step);assert.equal(upgraded.skillLevels.precision,0);assert.equal(first.value.balance,before-2500e6);
  const duplicate=await Promise.all([call('skills/upgrade',{heroId:1001,skill:'bossDamage',expectedLevel:1},a.cookie),call('skills/upgrade',{heroId:1001,skill:'bossDamage',expectedLevel:1},a.cookie)]);assert.equal(duplicate.filter(r=>r.status===200).length,1);assert.equal(duplicate.filter(r=>r.status===400).length,1);
  let current=(await call('state',undefined,a.cookie)).value;assert.equal(current.balance,before-7500e6);assert.equal(current.packet.player.heroes.find(h=>h.id===1001).skillXpTicks,step);
  fixture(db=>{const u=db.users.find(u=>u.name==='Skills A');u.state.balance=0;u.state.player.heroes[0].skillXpTicks=cap;});
  assert.equal((await call('skills/upgrade',{heroId:1001,skill:'bossDamage',expectedLevel:2},a.cookie)).status,400);current=(await call('state',undefined,a.cookie)).value;assert.equal(current.packet.player.heroes[0].skillXpTicks,cap);
  fixture(db=>{db.users.find(u=>u.name==='Skills A').state.balance=100000e6;});
  const max=await call('skills/upgrade',{heroId:1001,skill:'bossDamage',expectedLevel:2},a.cookie);assert.equal(max.status,200);assert.equal(max.value.upgrade.coins,10000);assert.equal(max.value.packet.player.heroes[0].skillXpTicks,cap-step);assert.equal(max.value.packet.player.heroes[0].skillLevels.bossDamage,3);
  assert.equal((await call('skills/upgrade',{heroId:1001,skill:'bossDamage',expectedLevel:3},a.cookie)).status,400);
  fixture(db=>{db.users.find(u=>u.name==='Skills A').state.player.heroes[0].skillXpTicks=123456;});
  assert.equal((await call('market/list',{heroId:1001,price:1},a.cookie)).status,200);const listing=(await call('market',undefined,b.cookie)).value.listings[0];assert.equal(listing.hero.skillLevels.bossDamage,3);assert.equal(listing.hero.skillXpTicks,123456);
  const buy=await call('market/buy',{id:listing.id},b.cookie);assert.equal(buy.status,200);let bought=buy.value.packet.player.heroes.find(h=>h.skillLevels?.bossDamage===3);assert.ok(bought);assert.equal(bought.skillXpTicks,123456);app=service({dir});bought=(await call('state',undefined,b.cookie)).value.packet.player.heroes.find(h=>h.skillLevels?.bossDamage===3);assert.equal(bought.skillXpTicks,123456,'Venda e reinício preservam skills e XP');
  fixture(db=>{const u=db.users.find(u=>u.name==='Skills A');u.state.player.heroes=[2001,2002,2003,2004].map(id=>hero(id,{rarity:0,skills:['precision'],skillLevels:{precision:2},skillXpTicks:500000}));u.state.nextId=2005;});
  assert.equal((await call('action',{route:'fusion/choose',args:{heroIds:[2001,2002,2003,2004]}},a.cookie)).status,200);const fusion=await call('purchase',{product:'fusion'},a.cookie);assert.equal(fusion.status,200);const child=fusion.value.packet.player.heroes[0];assert.equal(child.id,2005);assert.equal(child.skillXpTicks,0);assert.ok(child.skills.every(key=>rules.mhSkillLevel(child,key)===0),'Fusão zera todas as skills');assert.equal(fusion.value.packet.player.heroes.length,1);
  console.log('OK API: propriedade, XP e Ouro obrigatórios, descontos exatos, uma skill por compra, clique duplicado bloqueado, máximo 3, mercado preserva e fusão zera.');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();}
});
