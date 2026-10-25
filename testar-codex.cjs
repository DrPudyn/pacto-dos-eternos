const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const {service}=require('./shared-service.cjs'),rules=require('./codex-rules.cjs'),{createEngine}=require('./shared-engine.cjs'),{towerService}=require('./tower-service.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'minihero-codex-')),file=path.join(dir,'jogadores.json');let app=service({dir});
const server=http.createServer((req,res)=>app.handle(req,res,new URL(req.url,'http://localhost')));
server.listen(0,'127.0.0.1',async()=>{
 const base=`http://127.0.0.1:${server.address().port}/shared-api/`;
 async function call(route,data,cookie=''){const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,value:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 try{
  const a=await call('register',{name:'Codex A',password:'codex-test-profile-a'}),b=await call('register',{name:'Codex B',password:'codex-test-profile-b'});
  assert.equal((await call('codex/register',{skin:'mage',rarity:5})).status,401);
  assert.equal((await call('codex/register',{skin:'mage',rarity:5},b.cookie)).status,400);
  const db=JSON.parse(fs.readFileSync(file)),u=db.users.find(u=>u.name==='Codex A'),model=u.state.player.heroes[0];
  u.state.player.heroes=Array.from({length:24},(_,i)=>({...structuredClone(model),id:i+1,skin:rules.classes[i%4],rarity:Math.floor(i/4),range:[1,2,3,3][i%4],atk:75,atkSpd:75,dur:75,durability:375,skills:[],status:'idle'}));u.state.nextId=25;db.users.find(u=>u.name==='Codex B').state.balance=1000000;fs.writeFileSync(file,JSON.stringify(db));app=service({dir});
  let state=(await call('state',undefined,a.cookie)).value;
  assert.equal(state.codex.collections.flatMap(c=>c.entries).filter(e=>e.discovered).length,24);
  assert.equal(state.codex.collections.flatMap(c=>c.entries).filter(e=>e.registered).length,0);
  assert.deepEqual(state.codex.bonuses,{gold:0,move:0,damage:0,repair:0,crit:0,energy:0});
  assert.equal((await call('codex/activate',{rarity:2},a.cookie)).status,400);
  assert.equal((await call('codex/register',{skin:'fake',rarity:2},a.cookie)).status,400);
  for(let rarity=0;rarity<6;rarity++){
   for(const skin of rules.classes)assert.equal((await call('codex/register',{skin,rarity},a.cookie)).status,200);
   state=(await call('state',undefined,a.cookie)).value;assert.equal(state.codex.collections[rarity].active,false);
   const claim=await call('codex/activate',{rarity},a.cookie);assert.equal(claim.status,200);
  }
  const expected={gold:.01,move:.01,damage:.06,repair:.02,crit:.01,energy:.05};
  state=(await call('state',undefined,a.cookie)).value;assert.deepEqual(state.codex.bonuses,expected);
  for(let i=0;i<3;i++)await call('codex/activate',{rarity:5},a.cookie);
  assert.deepEqual((await call('state',undefined,a.cookie)).value.codex.bonuses,expected);
  assert.equal(state.packet.player.heroes.length,24,'Registrar não consome heróis');
  assert.equal((await call('state',undefined,b.cookie)).value.codex.collections[5].active,false);
  // Buying a hero discovers its class and rarity for the buyer, independently of the seller's registrations.
  assert.equal((await call('market/list',{heroId:12,price:1},a.cookie)).status,200);
  const listing=(await call('market',undefined,b.cookie)).value.listings[0];
  const bought=await call('market/buy',{id:listing.id},b.cookie);assert.equal(bought.status,200);
  assert.equal(bought.value.codex.collections[2].entries.find(e=>e.skin==='mage').discovered,true);
  assert.equal(bought.value.codex.collections[2].entries.find(e=>e.skin==='mage').registered,false);
  assert.equal((await call('codex/register',{skin:'mage',rarity:2},b.cookie)).status,200);
  assert.equal((await call('codex/activate',{rarity:2},b.cookie)).status,400);
  app=service({dir});state=(await call('state',undefined,a.cookie)).value;
  assert.deepEqual(state.codex.bonuses,expected);assert.equal(state.codex.collections[2].entries[3].registered,true,'Vender não apaga registro');
  const engine=createEngine(JSON.parse(fs.readFileSync(file)).users.find(u=>u.name==='Codex A').state,{codexBonuses:expected}).engine;
  await engine.action('heroes/work',{heroIds:[1]});const battle=engine.live.battle,h=battle.heroes[0],monster=battle.monsters.find(m=>!m.dead);
  assert.equal(h.state.codexMove,1.01);assert.equal(h.state.codexDamage,1.06);assert.equal(h.state.codexEnergy,.95);
  const initialGold=battle.mhdg;monster.hp=1;battle.strike(h,monster,100,false,false,false);
  assert.equal(battle.events.at(-1).damage,106);assert.equal(battle.mhdg-initialGold,Math.round(monster.mhdg*1.01));
  const initialEnergy=h.state.durability;battle.startAttack(h,battle.monsters.find(m=>!m.dead),0);assert.ok(Math.abs(initialEnergy-h.state.durability-.475)<1e-8,'Economia de energia fracionária');
  const plain=createEngine(null).engine,template=structuredClone(plain.player.heroes[0]);
  const repair=createEngine(null,{codexBonuses:expected}).engine;repair.player.heroes=[{...template,id:1,status:'resting',durability:10,skills:[],forgeSince:null}];repair.player.repairedAt=Date.now()-60000;await repair.action('state');assert.ok(Math.abs(repair.player.heroes[0].durability-10.51)<.002,'Reparo ganha 2%');
  const user={id:'codex-tower'},team=Array.from({length:15},(_,i)=>({...template,id:i+1,rarity:2,durability:375,dur:75}));rules.discover(user,Array.from({length:24},(_,i)=>({skin:rules.classes[i%4],rarity:Math.floor(i/4)})));for(let rarity=0;rarity<6;rarity++){for(const skin of rules.classes)rules.register(user,skin,rarity);rules.activate(user,rarity);}
  const tower=towerService();tower.start(user,team,team.map(h=>h.id));assert.equal(tower.view(user).run.state.heroes[0].state.codexDamage,1.06);
  user.codex.active={};user.tower.floor++;user.tower.battle=null;assert.equal(tower.view(user).run.state.heroes[0].state.codexDamage,1.06,'Torre mantém bônus nos próximos andares');
  const restored=towerService().view(JSON.parse(JSON.stringify(user)));assert.equal(restored.run.state.heroes[0].state.codexEnergy,.95,'Torre mantém bônus após restauração');
  console.log('OK Códice: 24 descobertas; registro e ativação manuais; validação; sem consumo; compras; persistência; isolamento; bônus sem duplicar; dano, Ouro e energia reais; reparo; Torre com bônus fixos.');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();}
});
