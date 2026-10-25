const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const codex=require('./weapon-codex.cjs'),combined=require('./codex-rules.cjs'),gear=require('./equipment-rules.cjs'),{service}=require('./shared-service.cjs');
const sample={skin:'swordsman',rarity:0},user={};
assert.throws(()=>codex.register(user,'swordsman',0));assert.throws(()=>codex.activate(user,0));
codex.discover(user,[sample,{...sample,level:10},{skin:'fake',rarity:4}]);codex.register(user,'swordsman',0);assert.throws(()=>codex.activate(user,0));
user.weaponCodex.active[5]=123;assert.deepEqual(codex.bonuses(user),{},'Corrupted incomplete activation never grants a bonus');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codex-weapons-'));let app=service({dir});
const server=http.createServer((q,s)=>app.handle(q,s,new URL(q.url,'http://localhost')));
server.listen(0,'127.0.0.1',async()=>{const base='http://127.0.0.1:'+server.address().port+'/shared-api/';
 async function call(route,data,cookie=''){const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,value:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 try{
  const a=await call('register',{name:'Codex Armas',password:'codex-weapon-test'}),b=await call('register',{name:'Outro Codex',password:'codex-other-test'});
  assert.equal((await call('codex/weapons/register',{skin:'swordsman',rarity:0})).status,401);
  assert.equal((await call('codex/weapons/activate',{rarity:0},a.cookie)).status,400);
  app.close();const file=path.join(dir,'jogadores.json'),db=JSON.parse(fs.readFileSync(file)),u=db.users.find(u=>u.name==='Codex Armas');
  for(const skin of gear.CLASSES)for(let rarity=0;rarity<6;rarity++){const out=gear.open(u.state.player,skin,1,1e12,()=>0);gear.find(u.state.player,out.weapons[0].id).rarity=rarity;}
  fs.writeFileSync(file,JSON.stringify(db));app=service({dir});
  let state=(await call('state',undefined,a.cookie)).value;assert.equal(state.codex.weapons.collections.flatMap(c=>c.entries).filter(e=>e.discovered).length,24);
  assert.equal((await call('codex/weapons/register',{skin:'fake',rarity:0},a.cookie)).status,400);
  for(let rarity=0;rarity<6;rarity++){for(const skin of gear.CLASSES.slice(0,3))assert.equal((await call('codex/weapons/register',{skin,rarity},a.cookie)).status,200);assert.equal((await call('codex/weapons/activate',{rarity},a.cookie)).status,400);assert.equal((await call('codex/weapons/register',{skin:'mage',rarity},a.cookie)).status,200);assert.equal((await call('codex/weapons/activate',{rarity},a.cookie)).status,200);}
  const expected={gold:.005,move:0,damage:.015,repair:.005,crit:.0025,energy:.005};
  state=(await call('state',undefined,a.cookie)).value;assert.deepEqual(state.codex.bonuses,expected);assert.equal(state.equipment.weapons.length,24,'Registration consumes no equipment');
  await call('codex/weapons/activate',{rarity:5},a.cookie);await call('codex/weapons/register',{skin:'mage',rarity:5},a.cookie);assert.deepEqual((await call('state',undefined,a.cookie)).value.codex.bonuses,expected);
  assert.deepEqual((await call('state',undefined,b.cookie)).value.codex.weapons.bonuses,{},'Accounts isolated');
  const out=await call('equipment/dismantle',{weaponIds:state.equipment.weapons.map(w=>w.id),requestId:require('crypto').randomUUID()},a.cookie);assert.equal(out.status,200);assert.equal(out.value.equipment.weapons.length,0);assert.deepEqual(out.value.codex.bonuses,expected,'Dismantling preserves records and bonuses');
  app.close();app=service({dir});state=(await call('state',undefined,a.cookie)).value;assert.deepEqual(state.codex.bonuses,expected,'SQLite persistence');
  const saved=JSON.parse(fs.readFileSync(file)).users.find(u=>u.name==='Codex Armas'),{createEngine}=require('./shared-engine.cjs'),template=createEngine(null).engine.player.heroes[0];
  const engine=createEngine(null,{codexBonuses:combined.bonuses(saved)}).engine;engine.player.heroes=[{...structuredClone(template),id:1,atk:100,status:'idle',skills:[],durability:100}];await engine.action('heroes/work',{heroIds:[1]});const hero=engine.live.battle.heroes[0];assert.equal(hero.state.codexDamage,1.015);assert.equal(hero.state.codexEnergy,.995);
  const team=Array.from({length:15},(_,i)=>({...structuredClone(template),id:i+1,status:'idle',durability:100}));const tower=require('./tower-service.cjs').towerService();tower.start(saved,team,team.map(h=>h.id));assert.equal(saved.tower.codexBonuses.damage,.015);saved.weaponCodex.active={};assert.equal(saved.tower.codexBonuses.damage,.015,'Existing tower snapshots remain fixed');
  console.log('OK: 24 discoveries, four required, validation/auth, no item consumption, no stacking duplicates, account isolation, dismantling retention, persistence, live combat and Tower snapshot.');
 }catch(e){console.error(e);process.exitCode=1;}finally{app.close();server.close();}
});
