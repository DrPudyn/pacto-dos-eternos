const fs=require('fs'),os=require('os'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {service}=require('./shared-service.cjs'),{sharedStore}=require('./shared-store.cjs'),{createEngine}=require('./shared-engine.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pacto-market-test-'));let app=service({dir});
const assets=require('./static-assets.cjs').staticAssets(path.join(__dirname,'minihero-offline'));
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(await app.handle(req,res,url))return;await assets(req,res,url.pathname==='/'?'/compartilhado.html':url.pathname);});
server.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;
 async function call(route,data,cookie=''){const response=await fetch(base+'/shared-api/'+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:response.status,value:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
 try{
  const a=await call('register',{name:'Mercado Ficticio A',password:'Test-isolated-market-a-123'}),b=await call('register',{name:'Mercado Ficticio B',password:'Test-isolated-market-b-123'});assert.equal(a.status,200);assert.equal(b.status,200);
  app.close();const store=sharedStore(dir),db=store.load(),au=db.users.find(u=>u.name==='Mercado Ficticio A'),bu=db.users.find(u=>u.name==='Mercado Ficticio B');
  const hero=structuredClone(createEngine(null).engine.player.heroes[0]);Object.assign(hero,{id:1,status:'idle',rarity:4,forgeSince:null});au.state.player.heroes=[hero];au.state.nextId=2;au.state.balance=100000e6;bu.state.balance=20000000e6;
  au.state.player.equipment={version:1,embers:0,receipts:{},weapons:[{id:'fixture-mythic',skin:'swordsman',rarity:5,level:4,passive:'crit',heroId:null,favorite:false,failures:1,invested:150,version:2,createdAt:1}]};store.save(db);store.close();app=service({dir});
  assert.equal((await call('market/list-weapon',{weaponId:'fixture-mythic',price:8000000})).status,401);
  assert.equal((await call('market/list-weapon',{weaponId:'fixture-mythic',price:8000000},b.cookie)).status,400);
  const listed=await call('market/list-weapon',{weaponId:'fixture-mythic',price:8000000},a.cookie);assert.equal(listed.status,200);assert.equal(listed.value.equipment.weapons.length,0);
  const list=await call('market',undefined,b.cookie),offer=list.value.listings.find(l=>l.type==='weapon');assert.equal(offer.weapon.name,'Espada do Primeiro Pacto');assert.equal(offer.weapon.level,4);
  const buys=await Promise.all([call('market/buy',{id:offer.id},b.cookie),call('market/buy',{id:offer.id},b.cookie)]);assert.equal(buys.filter(r=>r.status===200).length,1);assert.equal(buys.filter(r=>r.status===400).length,1);
  let buyer=await call('state',undefined,b.cookie),seller=await call('state',undefined,a.cookie);assert.equal(buyer.value.balance,12000000e6);assert.equal(seller.value.balance,8100000e6);assert.equal(buyer.value.equipment.weapons[0].level,4);
  assert.equal((await call('market/list',{heroId:1,price:1500000},a.cookie)).status,200);
  const mixed=await call('market',undefined,b.cookie);assert.equal(mixed.status,200);assert.ok(mixed.value.listings.some(l=>l.hero));
  const id=buyer.value.equipment.weapons[0].id;assert.equal((await call('market/list-weapon',{weaponId:id,price:9000000},b.cookie)).status,200);
  app.close();app=service({dir});const saved=await call('market',undefined,b.cookie),own=saved.value.listings.find(l=>l.weapon);assert.equal(own.weapon.level,4);assert.equal((await call('market/cancel',{id:own.id},a.cookie)).status,400);assert.equal((await call('market/cancel',{id:own.id},b.cookie)).status,200);
  buyer=await call('state',undefined,b.cookie);assert.equal(buyer.value.equipment.weapons.length,1);assert.equal(buyer.value.balance,12000000e6);assert.equal(buyer.value.equipment.weapons[0].passive,'crit');
  app.close();const botStore=sharedStore(dir),botDb=botStore.load(),bot=botDb.users.find(u=>u.botKey==='arena-bot-1');
  bot.state.player.heroes=Array.from({length:19},(_,i)=>({...structuredClone(hero),id:i+1,rarity:i<15?0:3,status:'idle',forgeSince:null}));bot.state.nextId=100;bot.state.balance=5000000e6;bot.state.player.mintCards=0;bot.state.player.weaponSummons=0;bot.state.player.blacksmiths=[{id:80,tier:1,mintedAt:1}];bot.state.player.blacksmithInService=80;bot.state.player.porters=[{id:81,mintedAt:1}];bot.state.player.porterOn=true;bot.botLoadoutVersion=1;bot.botNextActionAt=0;botStore.save(botDb);botStore.close();app=service({dir});
  app.advanceTowers();const botMarket=await call('market',undefined,b.cookie);assert.equal(botMarket.status,200);assert.ok(botMarket.value.listings.some(l=>l.seller==='IA Arashi'&&l.hero?.rarity===4&&l.source!=='caravan'));assert.equal(botMarket.value.listings.filter(l=>l.source==='caravan'&&l.seller==='IA Arashi'&&(l.weapon??l.hero).rarity===5).length,2);
  app.persist();const verify=sharedStore(dir),savedBots=verify.load(),savedBot=savedBots.users.find(u=>u.botKey==='arena-bot-1');assert.ok(savedBot.state.balance<5000000e6);assert.ok(savedBot.state.player.heroes.length>=15);assert.equal(savedBot.state.stats.fusions,1);assert.ok(Object.values(savedBots.festival.seasons).some(s=>s.kind==='week'&&s.entries[savedBot.id]?.fusion>0));verify.close();
  console.log('OK HTTP: autenticação, propriedade, heróis e armas no mesmo mercado, compra concorrente única, saldos, atributos, reinício e cancelamento.');
 }catch(e){console.error(e.stack);process.exitCode=1;}finally{
  if(process.argv.includes('--preview')&&!process.exitCode){
   app.close();const s=sharedStore(dir),d=s.load();for(const u of d.users)u.tutorial={version:1,completedAt:1,rewardClaimedAt:1,deferred:true,step:0};
   const u=d.users.find(u=>u.name==='Mercado Ficticio A');
   d.listings.push({id:'fixture-preview-weapon',type:'weapon',seller:u.id,price:8000000,weapon:{id:'mythic-preview',skin:'archer',rarity:5,level:0,passive:'crit',heroId:null,favorite:false,failures:0,invested:0,version:0,createdAt:1},created:1});
   s.save(d);s.close();app=service({dir});console.log('PREVIA_ISOLADA=http://127.0.0.1:'+server.address().port);
  }else{app.close();server.close();}
 }
});
