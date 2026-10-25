const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {service}=require('./shared-service.cjs');
const dir=fs.mkdtempSync(path.join(require('os').tmpdir(),'minihero-test-'));
let app=service({dir});const server=http.createServer((req,res)=>app.handle(req,res,new URL(req.url,'http://localhost')));
server.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;
 async function call(route,data,cookie='',headers={}){const r=await fetch(base+'/shared-api/'+route,{method:data===undefined?'GET':'POST',headers:{'Content-Type':'application/json',cookie,...headers},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 try{
  const a=await call('register',{name:'Teste A',password:'Testing-profile-a-42'}),b=await call('register',{name:'Teste B',password:'Testing-profile-b-42'});assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.body.balance,100000e6);assert.equal(b.body.canImport,false);
  const rareFixture=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8'));const sellerFixture=rareFixture.users.find(u=>u.name==='Teste A');sellerFixture.state.player.heroes[0].rarity=4;sellerFixture.state.stats.legendary=1;fs.writeFileSync(path.join(dir,'jogadores.json'),JSON.stringify(rareFixture));app=service({dir});
  assert.equal((await call('state')).status,401);
  assert.equal((await call('register',{name:'Teste A',password:'Testing-no-invite-42'},'',{'cf-connecting-ip':'203.0.113.1'})).status,409);
  assert.equal((await call('host-info',undefined,'',{'cf-connecting-ip':'203.0.113.1'})).status,403);
  assert.equal((await call('action',{route:'summon/card',args:{count:-10}},a.cookie)).status,400);
  let hero=a.body.packet.player.heroes[0];let listed=await call('market/list',{heroId:hero.id,price:1000},a.cookie);assert.equal(listed.status,200);assert.equal(listed.body.packet.player.heroes.length,2);
  const market=await call('market',undefined,b.cookie),id=market.body.listings[0].id;assert.equal(market.body.listings[0].mine,false);
  const purchases=await Promise.all([call('market/buy',{id},b.cookie),call('market/buy',{id},b.cookie)]);assert.equal(purchases.filter(p=>p.status===200).length,1);assert.equal(purchases.filter(p=>p.status===400).length,1);
  const as=await call('state',undefined,a.cookie),bs=await call('state',undefined,b.cookie);assert.equal(as.body.balance,101000e6);assert.equal(bs.body.balance,99000e6);assert.equal(bs.body.packet.player.heroes.length,4);assert.equal((await call('market',undefined,b.cookie)).body.listings.length,0);
  assert.equal(as.body.stats.legendary,1);assert.equal(bs.body.stats.legendary,0,'Comprar um lendário não deve contar como criação');
  await call('market/list',{heroId:as.body.packet.player.heroes[0].id,price:500},a.cookie);const own=(await call('market',undefined,a.cookie)).body.listings[0];assert.equal(own.mine,true);assert.equal((await call('market/cancel',{id:own.id},b.cookie)).status,400);assert.equal((await call('market/cancel',{id:own.id},a.cookie)).status,200);
  const summon=await call('purchase',{product:'summon-1'},b.cookie);assert.equal(summon.status,200);assert.equal(summon.body.packet.minted.length,1);assert.equal(summon.body.stats.created,4);
  let ids=summon.body.packet.player.heroes.slice(0,4).map(h=>h.id); // fusion requires same rarity: normalize a server fixture, never client mutation.
  const db=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8'));const bu=db.users.find(u=>u.name==='Teste B');bu.state.player.heroes.forEach(h=>h.rarity=0);fs.writeFileSync(path.join(dir,'jogadores.json'),JSON.stringify(db));app=service({dir});
  assert.equal((await call('action',{route:'fusion/choose',args:{heroIds:ids}},b.cookie)).status,200);const fusion=await call('purchase',{product:'fusion'},b.cookie);assert.equal(fusion.status,200);assert.equal(fusion.body.stats.fusions,1);
  const rank=await call('leaderboard',undefined,a.cookie);assert.equal(rank.body.rows.length,2);assert.equal(rank.body.rows.find(r=>r.name==='Teste B').fusions,1);
  app=service({dir});const restored=await call('state',undefined,b.cookie);assert.equal(restored.status,200);assert.equal(restored.body.stats.fusions,1);
  const state=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8')).users.find(u=>u.name==='Teste A').state;
  assert.equal((await call('import',{state},b.cookie)).status,403);
  const imported=await call('import',{state},a.cookie);assert.equal(imported.status,200);assert.equal(imported.body.balance,state.balance);assert.equal(imported.body.packet.player.heroes.length,state.player.heroes.length);
  assert.equal((await call('import',{state},a.cookie)).status,403);
  fs.writeFileSync(path.join(dir,'eventos-pendentes.json'),JSON.stringify([{id:'boss-test-once',kind:'spawn-boss',name:'Teste A'}]));
  const boss=await call('state',undefined,a.cookie);assert.equal(boss.body.packet.hunt.battle.monsters.filter(m=>m.boss&&!m.dead).length,1);
  assert.equal((await call('state',undefined,a.cookie)).body.packet.hunt.battle.monsters.filter(m=>m.boss&&!m.dead).length,1);
  assert.equal((await call('state',undefined,b.cookie)).body.packet.hunt.battle.monsters.filter(m=>m.boss&&!m.dead).length,0);
  const {createEngine}=require('./shared-engine.cjs');
  for(const [roll,key,rarity]of [[.997,'legendary',4],[.99999,'mythic',5]]){
   const rare=createEngine(null,{random:()=>roll});await rare.engine.pay('summon-1');assert.equal(rare.engine.player.heroes.at(-1).rarity,rarity);assert.equal(rare.engine.stats[key],1);
   const resumed=createEngine(rare.export());assert.equal(resumed.engine.stats[key],1);
   const legacy=rare.export();delete legacy.stats.legendary;delete legacy.stats.mythic;assert.equal(createEngine(legacy).engine.stats[key],1);
  }
  assert.equal((await call('admin/players',undefined,b.cookie)).status,403);
  assert.equal((await call('admin/credit',{name:'Teste A',coins:100},b.cookie)).status,403);
  assert.equal((await call('admin/credit',{name:'Teste B',coins:-1},a.cookie)).status,400);
  assert.equal((await call('admin/credit',{name:'Teste B',coins:1.5},a.cookie)).status,400);
  const beforeCredit=(await call('state',undefined,b.cookie)).body.balance;
  const credit=await call('admin/credit',{name:'Teste B',coins:123},a.cookie);assert.equal(credit.status,200);assert.equal(credit.body.isOwner,true);assert.equal(credit.body.credit.balance,(beforeCredit+123e6)/1e6);
  app=service({dir});assert.equal((await call('state',undefined,b.cookie)).body.balance,beforeCredit+123e6);assert.equal((await call('admin/players',undefined,a.cookie)).status,200);
  assert.equal((await call('admin/boss',{name:'Teste B'},b.cookie)).status,403);
  const manager=require('./gerenciar-compartilhado.cjs'),getAccessLink=manager.getAccessLink;manager.getAccessLink=async()=> 'https://minihero-test.trycloudflare.com';
  assert.equal((await call('admin/access-link',{},b.cookie)).status,403);
  const accessLink=await call('admin/access-link',{},a.cookie);assert.equal(accessLink.status,200);assert.equal(accessLink.body.url,'https://minihero-test.trycloudflare.com');manager.getAccessLink=getAccessLink;
  assert.equal((await call('admin/boss',{name:'Teste B',boss:'invalido'},a.cookie)).status,400);
  assert.equal((await call('admin/boss',{name:'Teste B',boss:'golem-forja'},a.cookie)).status,200);
  assert.equal((await call('state',undefined,b.cookie)).body.packet.hunt.battle.monsters.filter(m=>m.boss&&!m.dead).length,1);
  app=service({dir});assert.equal((await call('state',undefined,b.cookie)).body.packet.hunt.battle.monsters.find(m=>m.boss&&!m.dead).bossSkin,'golem-forja');
  assert.equal((await call('admin/boss',{name:'Teste B'},a.cookie)).status,400);
  assert.equal((await call('tower/start',{heroIds:[1,2]},a.cookie)).status,400);
  const towerDb=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8')),towerOwner=towerDb.users.find(u=>u.name==='Teste A'),model=towerOwner.state.player.heroes[0];towerOwner.state.player.heroes=Array.from({length:15},(_,i)=>({...structuredClone(model),id:i+1,durability:100,dur:20}));fs.writeFileSync(path.join(dir,'jogadores.json'),JSON.stringify(towerDb));app=service({dir});
  const towerStart=await call('tower/start',{heroIds:Array.from({length:15},(_,i)=>i+1)},a.cookie);assert.equal(towerStart.status,200);assert.equal(towerStart.body.run.team.length,15);assert.ok(towerStart.body.run.state);
  assert.equal((await call('tower/start',{heroIds:Array.from({length:15},(_,i)=>i+1)},a.cookie)).status,400);
  assert.equal((await call('tower/state',undefined,b.cookie)).body.run,null);
  assert.equal((await call('tower/pause',{},a.cookie)).status,200);
  app=service({dir});assert.equal((await call('tower/state',undefined,a.cookie)).body.run.id,towerStart.body.run.id);
  assert.equal((await call('tower/abandon',{},a.cookie)).body.run.status,'finished');
  assert.equal(typeof (await call('leaderboard',undefined,a.cookie)).body.rows[0].tower,'number');
  console.log('OK: perfis, mercado, ranking e torre com time fixo, pausa e salvamento por jogador.');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();}
});
