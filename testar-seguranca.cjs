const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pacto-seguranca-'));
const {service}=require('./shared-service.cjs');
let app=service({dir});
const root=path.join(__dirname,'minihero-offline');
const serve=require('./static-assets.cjs').staticAssets(root);
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(await app.handle(req,res,url))return;
 let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
 if(name==='/')name='/compartilhado.html';
 await serve(req,res,name);
});
server.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;
 async function call(route,data,cookie='',headers={}){
  const r=await fetch(base+'/shared-api/'+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json',...headers},body:data===undefined?undefined:JSON.stringify(data)});
  const text=await r.text();
  return {status:r.status,value:text?JSON.parse(text):{},cookie:r.headers.get('set-cookie')?.split(';')[0]??'',headers:r.headers};
 }
 async function page(pathname,headers={}){
  const r=await fetch(base+pathname,{headers});
  return {status:r.status,headers:r.headers,body:await r.text()};
 }
 try{
  const home=await page('/');
  assert.equal(home.status,200);
  assert.match(home.body,/PACTO DOS/);
  assert.equal(home.headers.get('x-content-type-options'),'nosniff');
  assert.equal(home.headers.get('x-frame-options'),'DENY');
  assert.match(home.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.match(home.headers.get('content-security-policy'),/script-src 'self'/);
  assert.equal(home.headers.get('cross-origin-resource-policy'),'same-origin');
  for(const forbidden of ['/servidor-compartilhado.cjs','/shared-service.cjs','/.git/config','/dados-compartilhados/jogadores.json','/etc/passwd','/shared-build/../servidor-compartilhado.cjs','/shared-build/%2e%2e%2f%2e%2e%2fservidor-compartilhado.cjs','/shared-build/..%2f..%2fservidor-compartilhado.cjs','/shared-build/....']){
   const hidden=await page(forbidden);
   assert.equal(hidden.status,404,forbidden);
   assert.doesNotMatch(hidden.body,/noticeToken|CREATE TABLE|function service/);
  }
  const securePage=await page('/',{'x-forwarded-proto':'https'});
  assert.equal(securePage.headers.get('strict-transport-security'),'max-age=15552000');

  assert.equal((await call('host-info')).status,200);
  assert.equal(typeof (await call('host-info')).value.inviteCode,'string');
  assert.equal((await call('host-info',undefined,'',{'x-forwarded-for':'203.0.113.8'})).status,403);
  assert.equal((await call('host-info',undefined,'',{'x-forwarded-host':'jogo.example'})).status,403);
  assert.equal((await call('host/notice',{text:'TESTE'},'',{'x-forwarded-for':'203.0.113.8','x-pacto-aviso':'a'.repeat(32)})).status,403);
  {
   const dir2=fs.mkdtempSync(path.join(os.tmpdir(),'pacto-spoof-')),app2=service({dir:dir2});
   const server2=http.createServer((q,s)=>app2.handle(q,s,new URL(q.url,'http://127.0.0.1')));
   await new Promise(resolve=>server2.listen(0,'127.0.0.1',resolve));
   const response=await fetch('http://127.0.0.1:'+server2.address().port+'/shared-api/register',{method:'POST',headers:{'Content-Type':'application/json','x-forwarded-for':'203.0.113.9'},body:JSON.stringify({name:'admin',password:'senha-segura-2'})});
   const value=await response.json();
   assert.equal(response.status,200);assert.equal(value.isOwner,false);assert.equal(value.canImport,false);
   app2.close();server2.close();
  }

  const owner=await call('register',{name:'admin',password:'senha-segura-admin'});
  assert.equal(owner.status,200);assert.equal(owner.value.isOwner,true);assert.equal(owner.value.canImport,false);
  const friend=await call('register',{name:'Amigo',password:'senha-segura-amigo'});
  assert.equal(friend.status,200);assert.equal(friend.value.isOwner,false);
  assert.equal(friend.headers.get('x-content-type-options'),'nosniff');
  assert.doesNotMatch(JSON.stringify(friend.value),/senha-segura-amigo|salt/);
  const again=await call('login',{name:'Amigo',password:'senha-segura-amigo'});
  assert.equal(again.status,200);
  assert.equal((await call('state',undefined,friend.cookie)).status,401);
  assert.equal((await call('state',undefined,again.cookie)).value.name,'Amigo');
  assert.equal((await call('admin/players',undefined,again.cookie)).status,403);
  assert.equal((await call('admin/credit',{name:'Amigo',coins:100},again.cookie)).status,403);
  const before=again.value.balance;
  assert.equal((await call('state',{balance:999999999,player:{heroes:[]}},again.cookie)).value.balance,before);
  assert.equal((await call('action',{route:'give-gold',args:{}},again.cookie)).status,400);
  assert.equal((await call('import',{state:{balance:1}},again.cookie)).status,403);
  assert.equal((await call('login',{name:'IA Arashi',password:'senha-segura-bot'})).value.error,'Este perfil é um jogador automático.');
  assert.match((await call('password-reset',{name:'IA Lobo',code:'A'.repeat(16),password:'senha-nova-123'})).value.error,/Código inválido/);
  const rank=(await call('leaderboard',undefined,again.cookie)).value.rows.map(row=>row.name);
  for(const bot of ['IA Arashi','IA Fênix','IA Lobo'])assert.ok(rank.includes(bot),bot);

  let locked=0;
  for(let i=0;i<10;i++){
   const attempt=await call('login',{name:'Amigo',password:'senha-errada-'+i},'',{'x-forwarded-for':'198.51.100.30'});
   assert.equal(attempt.status,401);
  }
  locked=await call('login',{name:'Amigo',password:'senha-segura-amigo'},'',{'x-forwarded-for':'9.9.9.9, 198.51.100.31'});
  assert.equal(locked.status,429);
  const fresh=await call('login',{name:'admin',password:'senha-segura-admin'},'',{'x-forwarded-for':'198.51.100.32'});
  assert.equal(fresh.status,200);

  for(let i=0;i<12;i++)assert.equal((await call('login',{name:'Z',password:'x'},'',{'x-forwarded-for':'1.1.1.1, 198.51.100.20'})).status,400);
  assert.equal((await call('login',{name:'Z',password:'x'},'',{'x-forwarded-for':'8.8.8.8, 198.51.100.20'})).status,429);
  assert.equal((await call('login',{name:'Z',password:'x'},'',{'x-forwarded-for':'198.51.100.21'})).status,400);

  for(let i=0;i<12;i++)assert.equal((await call('chat',{text:'oi '+i},again.cookie)).status,200);
  assert.equal((await call('chat',{text:'<img src=x onerror=alert(1)>'},again.cookie)).status,429);
  const echoed=(await call('chat',undefined,again.cookie)).value.messages.find(message=>message.text.startsWith('oi '));
  assert.equal(echoed.name,'Amigo');

  const {createEngine}=require('./shared-engine.cjs');
  const saved=createEngine(null).export();
  const db=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8'));
  db.users.find(user=>user.name==='admin').imported=false;
  fs.writeFileSync(path.join(dir,'jogadores.json'),JSON.stringify(db));
  app.close();app=service({dir});
  const ownerAgain=await call('login',{name:'admin',password:'senha-segura-admin'});
  const cheated=structuredClone(saved);cheated.player.heroes[0].atk=9999;cheated.battle={injected:true,monsters:[{id:'injected-gold',mhdg:1e15}]};
  assert.equal((await call('import',{state:cheated},ownerAgain.cookie)).status,400);
  const weapon=structuredClone(saved);weapon.player.equipment={version:1,embers:0,weapons:[{id:'x',skin:'swordsman',rarity:5,level:99}]};
  assert.equal((await call('import',{state:weapon},ownerAgain.cookie)).status,400);
  assert.equal((await call('import',{state:saved},ownerAgain.cookie)).status,200);
  const after=await call('state',undefined,ownerAgain.cookie);
  assert.equal(after.value.packet.player.heroes.length,saved.player.heroes.length);
  assert.equal(after.value.balance,saved.balance);
  assert.equal(JSON.stringify(after.value).includes('injected'),false);
  assert.equal((await call('import',{state:saved},ownerAgain.cookie)).status,403);

  const bundle=fs.readFileSync(path.join(root,'shared-build/app-0-_Askj9.js'),'utf8');
  assert.equal(bundle.includes('function mhInstallLanguage'),false);
  assert.equal(bundle.includes('shared-wallet-connect'),true);
  assert.equal(bundle.includes('MENSAGEM DO PACTO'),true);
  console.log('OK: contas, aviso local, arquivos, trapaça e cliente ofuscado.');
 }catch(error){console.error(error);process.exitCode=1;}finally{try{app.close();}catch{}server.close();}
});
