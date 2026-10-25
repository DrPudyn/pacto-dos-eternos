const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),crypto=require('crypto');
const gear=require('./equipment-rules.cjs'),{createEngine,createTowerBattle}=require('./shared-engine.cjs');
function core(){
 const player={heroes:[{id:1,skin:'spearman',status:'idle'},{id:2,skin:'mage',status:'idle'}]};
 assert.equal(gear.ODDS.reduce((a,b)=>a+b),10000);assert.throws(()=>gear.open(player,'other',1,1e9));assert.throws(()=>gear.open(player,'spearman',15,14999e6));
 const w=gear.open(player,'spearman',1,1e9,()=>.99999).weapons[0];assert.equal(w.rarity,5);assert.equal(gear.book(player).weapons.length,1);assert.equal(gear.cost(w).gold,600);
 assert.throws(()=>gear.equip(player,w.id,2));gear.equip(player,w.id,1);assert.equal(player.heroes[0].weaponBonus.attack,.1);assert.throws(()=>gear.dismantle(player,[w.id]));gear.unequip(player,w.id);
 const item=gear.find(player,w.id),b=gear.book(player);item.favorite=true;assert.throws(()=>gear.dismantle(player,[w.id]));item.favorite=false;b.embers=100000;
 const before=b.embers;let result=gear.upgrade(player,w.id,0,1e12,()=>.999999);assert.equal(result.success,false);assert.equal(item.level,0);assert.equal(item.invested,0);assert.equal(gear.cost(item).chance,100);assert.throws(()=>gear.upgrade(player,w.id,0,1e12));
 result=gear.upgrade(player,w.id,1,1e12,()=>.999999);assert.equal(result.success,true);assert.equal(item.failures,0);assert.equal(item.level,1);
 while(item.level<10)gear.upgrade(player,w.id,item.version,1e12,()=>0);
 assert.equal(item.invested,2068);assert.equal(gear.bonus(item).attack,.2);assert.equal(gear.salvage(item),900+Math.floor(2068*.8));assert.throws(()=>gear.upgrade(player,w.id,item.version,1e12));const refund=gear.dismantle(player,[w.id]);assert.equal(refund.embers,2554);assert.equal(b.embers,before-2088+2554);assert.throws(()=>gear.dismantle(player,[w.id]));
 const temp=gear.open(player,'spearman',1,1e9,()=>0).weapons[0];gear.equip(player,temp.id,1);player.heroes=[];gear.reconcile(player);assert.equal(gear.find(player,temp.id).heroId,null,'Arma volta à mochila quando o herói deixa a coleção');
 const sample=structuredClone(createEngine(null).engine.player.heroes[0]);Object.assign(sample,{id:1,skin:'spearman',atk:100,atkSpd:100,skills:[],rarity:0,durability:1000});
 const base=createTowerBattle([sample],1,15).battle,armed=createTowerBattle([{...sample,weaponBonus:{attack:.2,boss:.04,crit:.02,speed:.04,energy:.04,execute:.04}}],1,15).battle;
 assert.equal(base.heroes[0].state.damage,100);assert.equal(armed.heroes[0].state.damage,120);assert.equal(armed.heroes[0].state.critChance,base.heroes[0].state.critChance+.02);assert.ok(armed.heroes[0].state.window<=base.heroes[0].state.window);
 const a=armed.heroes[0],m=armed.monsters[0];m.boss=true;m.hp=m.maxHp=100000;armed.hit(a,m);assert.equal(m.maxHp-m.hp,125,'Dano de arma e passivo aplicados no combate real');
 const state=createEngine(null).export();state.player.heroes=[sample];state.player.equipment={version:1,embers:10,weapons:[{...temp,heroId:1,skin:'spearman',rarity:5,level:10,passive:'crit'}]};const restored=createEngine(state).engine;assert.equal(restored.player.heroes[0].weaponBonus.attack,.2);
 console.log('OK regras: raridades, custos, +10, falha/proteção, reembolso de 80% só dos sucessos, proteção, classe, vínculo e dano real.');
}
async function api(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pacto-equipment-'));let app=require('./shared-service.cjs').service({dir});const server=http.createServer((q,s)=>app.handle(q,s,new URL(q.url,'http://localhost')));await new Promise(r=>server.listen(0,'127.0.0.1',r));let cookie='';const url='http://127.0.0.1:'+server.address().port+'/shared-api/';
 async function call(route,data){const r=await fetch(url+route,{method:data?'POST':'GET',headers:{cookie,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});cookie=r.headers.get('set-cookie')?.split(';')[0]??cookie;return {status:r.status,data:await r.json()};}
 function edit(fn){app.close();const file=path.join(dir,'jogadores.json'),db=JSON.parse(fs.readFileSync(file));fn(db);fs.writeFileSync(file,JSON.stringify(db));app=require('./shared-service.cjs').service({dir});}
 try{assert.equal((await call('equipment/state')).status,401);assert.equal((await call('register',{name:'QA Armas',password:'teste-armas-12345'})).status,200);edit(db=>db.users[0].state.balance=100000e6);
 const requestId=crypto.randomUUID(),body={requestId,skin:'mage',count:15};const [a,b]=await Promise.all([call('equipment/open',body),call('equipment/open',body)]);assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.data.balance,85000e6);assert.equal(b.data.equipment.weapons.length,15);const f=await call('festival');assert.equal(f.data.pot.contributed,1500);assert.equal((await call('equipment/open',{...body,count:10})).status,400);
 const weapon=a.data.equipment.weapons[0];edit(db=>{db.users[0].state.player.equipment.embers=10000;});const ubody={requestId:crypto.randomUUID(),weaponId:weapon.id,expectedVersion:0};const [u,v]=await Promise.all([call('equipment/upgrade',ubody),call('equipment/upgrade',{...ubody,requestId:crypto.randomUUID()})]);assert.deepEqual([u.status,v.status],[200,400]);assert.equal((await call('equipment/upgrade',ubody)).data.balance,u.data.balance);
 const favor=await call('equipment/favorite',{requestId:crypto.randomUUID(),weaponId:weapon.id,favorite:true});assert.equal(favor.status,200);assert.equal((await call('equipment/dismantle',{requestId:crypto.randomUUID(),weaponIds:[weapon.id]})).status,400);app.close();app=require('./shared-service.cjs').service({dir});const saved=await call('equipment/state');assert.equal(saved.data.equipment.weapons.length,15);assert.equal(saved.data.equipment.weapons[0].favorite,true);
 console.log('OK API: autenticação, compra 15, débito único, contribuição ao Festival, cliques concorrentes, versão, favorito e reinício.');
 }finally{await new Promise(r=>server.close(r));app.close();}
}
(async()=>{core();await api();})().catch(e=>{console.error(e);process.exitCode=1;});
