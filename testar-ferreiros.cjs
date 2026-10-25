const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const {createEngine}=require('./shared-engine.cjs'),{service}=require('./shared-service.cjs');
async function repairTests(){
 const e=createEngine(null).engine;e.player.blacksmiths=[{id:100,tier:6}];e.player.blacksmithInService=100;e.player.porterOn=false;
 const sample=e.player.heroes[0];e.player.heroes=[{...sample,id:10,status:'resting',dur:100,durability:100,forgeSince:1,skills:[]}];
 e.player.repairedAt=Date.now()-60000;e.player.forgeXpAt=e.player.repairedAt;await e.action('state');let p=e.player.forgeMastery[6];assert.ok(Math.abs(p.xp-238)<.5,'XP por tempo em serviço');
 const before=p.xp;e.player.heroes[0].durability=499;e.player.repairedAt=Date.now()-60000;e.player.forgeXpAt=e.player.repairedAt;await e.action('state');assert.ok(Math.abs(p.xp-before-238)<.5,'XP independe da energia reparada');
 const earned=p.xp;e.player.repairedAt=Date.now()-60000;e.player.forgeXpAt=e.player.repairedAt;await e.action('state');assert.ok(p.xp>earned,'Herói cheio não impede XP');
 e.player.heroes[0].durability=100;e.player.heroes[0].forgeSince=null;e.player.repairedAt=Date.now()-60000;e.player.forgeXpAt=e.player.repairedAt;await e.action('state');assert.ok(p.xp>earned,'XP continua sem herói dentro da forja');
 e.player.heroes=[];e.player.repairedAt=Date.now()-60000;e.player.forgeXpAt=e.player.repairedAt;await e.action('state');assert.ok(p.xp>earned,'Forja vazia também ganha XP');
 e.player.forgeMastery[6]={level:3,xp:0};for(let tier=1;tier<=6;tier++)e.player.blacksmiths.push({id:200+tier,tier});
 for(let tier=1;tier<=6;tier++){e.player.forgeMastery[tier]={level:3,xp:0};for(let level=1;level<=3;level++)e.registerForge(tier,level);}for(let i=0;i<3;i++)e.activateForge(i);let view=e.forgeView();assert.equal(view.entries[5].rate,20.4);assert.equal(view.entries[5].slots,16);assert.equal(view.bonuses.repair,.05);assert.equal(view.bonuses.slots,1);
 e.player.blacksmiths=[];view=e.forgeView();assert.equal(view.entries[5].registered,true,'Venda preserva descoberta e registro');assert.equal(view.entries[5].level,3,'Venda preserva maestria da conta');
 const restored=createEngine(e.export()).engine;assert.equal(restored.forgeView().entries[5].level,3);assert.equal(restored.forgeView().collections[2].active,true);
 console.log('OK reparo, XP por tempo mesmo com forja vazia, bônus aditivos, vagas, venda e restauração.');
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'minihero-forge-test-')),file=path.join(dir,'jogadores.json');let app=service({dir});const server=http.createServer((req,res)=>app.handle(req,res,new URL(req.url,'http://localhost')));
server.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port+'/shared-api/';async function call(route,data,cookie=''){const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,value:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 function fixture(edit){const db=JSON.parse(fs.readFileSync(file));edit(db.users.find(u=>u.name==='Forge A'));fs.writeFileSync(file,JSON.stringify(db));app=service({dir});}
 try{
  await repairTests();const a=await call('register',{name:'Forge A',password:'forge-test-a-123'}),b=await call('register',{name:'Forge B',password:'forge-test-b-123'});
  assert.equal((await call('forge/upgrade',{tier:6,expectedLevel:0})).status,401);assert.equal((await call('forge/register',{tier:6},b.cookie)).status,400);assert.equal((await call('forge/activate',{index:2},a.cookie)).status,400);
  fixture(u=>{u.state.player.blacksmiths=[{id:100,tier:6},{id:101,tier:6}];u.state.balance=1000000e6;});
  let state=(await call('state',undefined,a.cookie)).value;assert.equal(state.codex.forge.entries[5].discovered,true);assert.equal(state.codex.forge.entries[5].registered,false);assert.equal(state.codex.forge.entries[5].owned,2);
  assert.equal((await call('forge/upgrade',{tier:6,expectedLevel:0},a.cookie)).status,400,'XP obrigatória');assert.equal((await call('forge/upgrade',{tier:5,expectedLevel:0},a.cookie)).status,400,'Propriedade obrigatória');
  assert.equal((await call('forge/register',{tier:6},a.cookie)).status,200);assert.equal((await call('forge/activate',{index:2},a.cookie)).status,400);
  fixture(u=>{u.state.player.forgeMastery[6].xp=114240;});
  const dup=await Promise.all([call('forge/upgrade',{tier:6,expectedLevel:0},a.cookie),call('forge/upgrade',{tier:6,expectedLevel:0},a.cookie)]);assert.equal(dup.filter(r=>r.status===200).length,1);
  state=(await call('state',undefined,a.cookie)).value;assert.equal(state.balance,940000e6);assert.equal(state.codex.forge.entries[5].level,1);assert.equal(state.codex.forge.entries[5].xp,0);assert.equal(state.codex.forge.entries[5].rate,17.85);
  fixture(u=>{u.state.player.forgeMastery[6].xp=228480;u.state.balance=0;});assert.equal((await call('forge/upgrade',{tier:6,expectedLevel:1},a.cookie)).status,400,'Ouro obrigatório');
  fixture(u=>{u.state.balance=1000000e6;});assert.equal((await call('forge/upgrade',{tier:6,expectedLevel:1},a.cookie)).status,200);
  fixture(u=>{u.state.player.forgeMastery[6].xp=342720;u.state.player.blacksmiths.push({id:102,tier:5});});
  assert.equal((await call('forge/upgrade',{tier:6,expectedLevel:2},a.cookie)).status,200);assert.equal((await call('forge/upgrade',{tier:6,expectedLevel:3},a.cookie)).status,400);
  await call('forge/register',{tier:5},a.cookie);assert.equal((await call('forge/activate',{index:2},a.cookie)).status,400,'Somente os dois níveis base não liberam bônus');
  fixture(u=>{u.state.player.forgeMastery[5]={level:3,xp:0};u.state.player.forgeCodex.active[2]=1;});
  state=(await call('state',undefined,a.cookie)).value;assert.equal(state.codex.forge.collections[2].active,false,'Ativação antiga incompleta é removida');assert.equal(state.codex.forge.bonuses.slots,0);
  for(const tier of [5,6])for(const level of [2,3])assert.equal((await call('forge/register',{tier,level},a.cookie)).status,200);
  assert.equal((await call('forge/activate',{index:2},a.cookie)).status,200);await call('forge/activate',{index:2},a.cookie);
  state=(await call('state',undefined,a.cookie)).value;assert.equal(state.codex.forge.entries[5].rate,19.89);assert.equal(state.codex.forge.entries[5].slots,16);assert.equal(state.codex.forge.bonuses.slots,1);
  app=service({dir});state=(await call('state',undefined,a.cookie)).value;assert.equal(state.codex.forge.entries[5].level,3);assert.equal(state.codex.forge.collections[2].active,true);assert.equal((await call('state',undefined,b.cookie)).value.codex.forge.entries[5].level,0);
  console.log('OK API: autenticação, propriedade, XP, Ouro, clique duplicado, três níveis, códice manual, cópias sem multiplicar, isolamento e persistência.');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();}
});
