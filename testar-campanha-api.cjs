const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http'),crypto=require('crypto');
const {service}=require('./shared-service.cjs');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'campaign-api-'));let time=Date.now(),app=service({dir,now:()=>time});
const server=http.createServer((q,s)=>app.handle(q,s,new URL(q.url,'http://localhost')));
server.listen(0,'127.0.0.1',async()=>{const base=`http://127.0.0.1:${server.address().port}/shared-api/`;
 const call=async(route,data,cookie='')=>{const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,value:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{
  assert.equal((await call('campaign/state')).status,401);
  const a=await call('register',{name:'Campaign Test',password:crypto.randomBytes(16).toString('hex')}),b=await call('register',{name:'Other Campaign',password:crypto.randomBytes(16).toString('hex')});
  app.close();const file=path.join(dir,'jogadores.json'),db=JSON.parse(fs.readFileSync(file)),u=db.users.find(u=>u.name==='Campaign Test'),h=require('./shared-engine.cjs').createEngine(null).engine.player.heroes[0];
  u.state.player.heroes=Array.from({length:15},(_,i)=>({...structuredClone(h),id:i+1,skin:['swordsman','spearman','archer','mage'][i%4],range:[1,2,3,3][i%4],atk:80,atkSpd:80,dur:100,durability:500,skills:[],status:'resting'}));fs.writeFileSync(file,JSON.stringify(db));app=service({dir,now:()=>time});
  const heroIds=u.state.player.heroes.map(h=>h.id),requestId=crypto.randomUUID();assert.equal((await call('campaign/start',{stageId:2,heroIds,requestId},a.cookie)).status,400);
  let r=await call('campaign/start',{stageId:1,heroIds,requestId},a.cookie);assert.equal(r.status,200);const runId=r.value.run.id;
  assert.equal((await call('campaign/start',{stageId:1,heroIds,requestId},a.cookie)).value.run.id,runId);
  assert.equal((await call('action',{route:'heroes/work',args:{heroIds}},a.cookie)).status,400);
  assert.equal((await call('tower/start',{heroIds},a.cookie)).status,400);
  assert.equal((await call('equipment/equip',{weaponId:'fake',heroId:1,requestId:crypto.randomUUID()},a.cookie)).status,400);
  assert.equal((await call('campaign/target',{runId,monsterId:'m1'},b.cookie)).status,400);
  assert.equal((await call('campaign/target',{runId,monsterId:'m2'},a.cookie)).value.run.priority,'m2');
  app.persist();app.close();app=service({dir,now:()=>time});assert.equal((await call('campaign/state',undefined,a.cookie)).value.run.id,runId,'Active attempt survives SQLite restart');
  for(let n=0;n<100;n++){time+=1000;app.advanceTowers(time);r=await call('campaign/state',undefined,a.cookie);if(r.value.run.status!=='active')break;}
  assert.equal(r.value.run.status,'won');const before=(await call('state',undefined,a.cookie)).value.balance;await call('campaign/abandon',{runId},a.cookie);assert.equal((await call('state',undefined,a.cookie)).value.balance,before);
  assert.equal(Object.keys((await call('campaign/state',undefined,b.cookie)).value.cleared).length,0);
  app.persist();app.close();app=service({dir,now:()=>time});assert((await call('campaign/state',undefined,a.cookie)).value.cleared[1]);
  console.log('API campanha OK: autenticação, isolamento, bloqueios, seleção de alvo, retomada SQLite, vitória no servidor, recompensa idempotente e persistência.');
 }catch(e){console.error(e);process.exitCode=1;}finally{app.close();server.close();}
});
