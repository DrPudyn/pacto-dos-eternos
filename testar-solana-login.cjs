const assert=require('node:assert/strict'),crypto=require('crypto'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const bs58=require('./bs58.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pacto-solana-'));
const {service}=require('./shared-service.cjs');
let app=service({dir});
const server=http.createServer((req,res)=>app.handle(req,res,new URL(req.url,'http://127.0.0.1')));
function walletFixture(){
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
 const raw=publicKey.export({type:'spki',format:'der'}).subarray(-32);
 return {address:bs58.encode(raw),privateKey,sign:message=>crypto.sign(null,Buffer.from(message,'utf8'),privateKey)};
}
server.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port+'/shared-api/';
 async function call(route,data,cookie=''){
  const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  const value=await r.json().catch(()=>({}));
  return {status:r.status,value,cookie:r.headers.get('set-cookie')?.split(';')[0]??''};
 }
 async function signed(route,payload,fixture){
  const challenge=await call('auth/challenge',{address:fixture.address});
  assert.equal(challenge.status,200);
  const signature=[...fixture.sign(challenge.value.message)];
  return call(route,{...payload,address:fixture.address,message:challenge.value.message,signature});
 }
 try{
  const legacy=await call('register',{name:'Legado',password:'senha-antiga-123'});
  assert.equal(legacy.status,200);
  const db=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8'));
  assert.equal(db.authVersion,2);
  assert.ok(db.users.some(u=>u.name==='Legado'&&!u.walletAddress));

  const nova=walletFixture();
  const created=await signed('auth/register',{name:'Carteira Nova'},nova);
  assert.equal(created.status,200);
  assert.equal(created.value.name,'Carteira Nova');
  assert.equal(created.value.walletAddress,nova.address);

  const login=await signed('auth/login',{},nova);
  assert.equal(login.status,200);
  assert.equal((await call('state',undefined,login.cookie)).value.name,'Carteira Nova');

  const linkWallet=walletFixture();
  const linked=await signed('auth/link',{name:'Legado',password:'senha-antiga-123'},linkWallet);
  assert.equal(linked.status,200);
  assert.equal(linked.value.name,'Legado');
  const linkedDb=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8')).users.find(u=>u.name==='Legado');
  assert.equal(linkedDb.walletAddress,linkWallet.address);
  assert.equal(linkedDb.pass,undefined);

  const blocked=await call('login',{name:'Legado',password:'senha-antiga-123'});
  assert.equal(blocked.status,403);

  const again=await signed('auth/link',{name:'Legado',password:'senha-antiga-123'},walletFixture());
  assert.equal(again.status,409);

  const bots=(await call('leaderboard',undefined,login.cookie)).value.rows.map(row=>row.name);
  for(const bot of ['IA Arashi','IA Fênix','IA Lobo'])assert.ok(bots.includes(bot),bot);

  console.log('OK: nonce, assinatura, cadastro, vínculo único, login por carteira e bots preservados.');
 }catch(error){console.error(error);process.exitCode=1;}finally{try{app.close();}catch{}server.close();}
});
