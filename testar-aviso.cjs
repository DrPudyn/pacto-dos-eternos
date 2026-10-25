const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http'),crypto=require('crypto'),{spawn}=require('child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pacto-aviso-'));
const token=crypto.randomBytes(24).toString('hex'),tokenFile=path.join(__dirname,'.aviso-local');
let now=Date.now();
const app=require('./shared-service.cjs').service({dir,now:()=>now,noticeToken:token});
const server=http.createServer((q,s)=>app.handle(q,s,new URL(q.url,'http://127.0.0.1')));
function direct(host,extra,remote,text){
 return new Promise(resolve=>{
  let status,raw=[];
  const req={method:'POST',headers:{host,'content-type':'application/json','accept-encoding':'','x-pacto-aviso':token,...extra},socket:{remoteAddress:remote??'127.0.0.1'},async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify({text}));}};
  const res={writeHead(code){status=code;},end(buf){raw.push(buf);resolve({status,body:JSON.parse(Buffer.concat(raw.map(part=>Buffer.isBuffer(part)?part:Buffer.from(part))).toString('utf8')||'{}')});}};
  app.handle(req,res,new URL('/shared-api/host/notice','http://127.0.0.1')).catch(error=>{console.error(error);process.exitCode=1;server.close();});
 });
}
server.listen(0,'127.0.0.1',async()=>{
 const port=server.address().port,base='http://127.0.0.1:'+port+'/shared-api/';
 async function call(route,data,cookie='',headers={}){const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json',...headers},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,value:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const previousToken=fs.existsSync(tokenFile)?fs.readFileSync(tokenFile):null;
 try{
  assert.equal((await call('host/notice',{text:'TESTE'})).status,403);
  assert.equal((await call('host/notice',{text:'TESTE'},'',{'x-pacto-aviso':token,'x-forwarded-for':'203.0.113.8'})).status,403);
  assert.equal((await call('host/notice',{text:'TESTE'},'',{'x-pacto-aviso':token,'cf-connecting-ip':'203.0.113.8'})).status,403);
  assert.equal((await call('host/notice',{text:'TESTE'},'',{'x-pacto-aviso':'0'.repeat(token.length)})).status,403);
  assert.equal((await direct('elongated-handwrite-expose.ngrok-free.dev',{},'127.0.0.1','TESTE')).status,403);
  assert.equal((await direct('127.0.0.1',{},'203.0.113.9','TESTE')).status,403);
  assert.equal((await direct('127.0.0.1',{'x-forwarded-for':'203.0.113.8'},'::ffff:127.0.0.1','TESTE')).status,403);
  assert.equal((await direct('127.0.0.1:'+port,{},'::ffff:127.0.0.1','')).status,400);
  assert.equal((await direct('localhost',{},'127.0.0.1','x'.repeat(301))).status,400);
  const a=await call('register',{name:'Aviso A',password:'aviso-teste-123'}),b=await call('register',{name:'Aviso B',password:'aviso-teste-456'});
  assert.equal((await call('host/notice',{text:'TESTE'},a.cookie,{'x-pacto-aviso':token,'x-forwarded-host':'jogo.example'})).status,403);
  assert.deepEqual((await call('state',undefined,a.cookie)).value.notices,[]);
  assert.deepEqual((await call('presence',undefined,b.cookie)).value.notices,[]);
  fs.writeFileSync(tokenFile,token,{mode:0o600});
  const sent=await new Promise(resolve=>{const child=spawn(process.execPath,[path.join(__dirname,'avisar.cjs'),'TESTE'],{env:{...process.env,MINIHERO_PORT:String(port)}});let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);child.on('exit',code=>resolve({code,stdout,stderr}));});
  assert.equal(sent.code,0,sent.stderr);assert.match(sent.stdout,/Aviso enviado/);
  const offline=await new Promise(resolve=>{const child=spawn(process.execPath,[path.join(__dirname,'avisar.cjs'),'NAO'],{env:{...process.env,MINIHERO_PORT:'9'}});let stderr='';child.stderr.on('data',d=>stderr+=d);child.on('exit',code=>resolve({code,stderr}));});
  assert.equal(offline.code,1);assert.match(offline.stderr,/não está aberto/i);
  const stateA=await call('state',undefined,a.cookie),stateB=await call('presence',undefined,b.cookie),chatB=await call('chat',undefined,b.cookie);
  assert.equal(stateA.value.notices.length,1);assert.equal(stateA.value.notices[0].text,'TESTE');
  assert.equal(stateB.value.notices[0].text,'TESTE');assert.equal(chatB.value.notices[0].id,stateA.value.notices[0].id);
  const id=stateA.value.notices[0].id;
  assert.equal(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8').includes(id),false);
  const seen=await call('notice/dismiss',{id},a.cookie);assert.equal(seen.status,200);assert.deepEqual(seen.value.notices,[]);
  assert.equal((await call('state',undefined,a.cookie)).value.notices.length,0);
  assert.equal((await call('session',undefined,b.cookie)).value.notices[0].text,'TESTE');
  assert.equal((await call('notice/dismiss',{id:'nao-e-uuid'},b.cookie)).status,400);
  const saved=fs.readFileSync(path.join(dir,'jogadores.json'),'utf8');
  assert.equal(saved.includes(id),false);assert.equal(saved.includes('linha TESTE'),false);
  const spaced=await direct('127.0.0.1',{},'127.0.0.1','  linha\n\tTESTE  ');
  assert.equal(spaced.status,200);assert.equal(spaced.body.text,'linha TESTE');
  now+=10*60*1000+1;
  assert.deepEqual((await call('state',undefined,b.cookie)).value.notices,[]);
  assert.deepEqual((await call('presence',undefined,a.cookie)).value.notices,[]);
  const savedLater=fs.readFileSync(path.join(dir,'jogadores.json'),'utf8'),bots=JSON.parse(savedLater).users.filter(u=>u.isBot);
  assert.equal(savedLater.includes(id),false);assert.equal(savedLater.includes('linha TESTE'),false);
  assert.equal(bots.length,3);assert.equal(bots.every(u=>u.isBot&&u.botKey),true);
  console.log('OK: aviso local TESTE chega aos dois jogadores, some ao dispensar, vence em 10 minutos e não entra no save.');
 }catch(e){console.error(e);process.exitCode=1;}finally{
  if(previousToken===null)fs.rmSync(tokenFile,{force:true});else fs.writeFileSync(tokenFile,previousToken);
  app.close();server.close();
 }
});
