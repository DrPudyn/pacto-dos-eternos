const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const {service}=require('./shared-service.cjs');
const dir=fs.mkdtempSync(path.join(require('os').tmpdir(),'pacto-chat-reconexao-'));
let at=Date.now(),liveClock=false,previewCookie='';const clock=()=>liveClock?Date.now():at;let app=service({dir,now:clock});
const preview=process.argv.includes('--preview');
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');if(await app.handle(req,res,url))return;
 const name=url.pathname==='/'?'/compartilhado.html':url.pathname;
 if(!(/^\/shared-build\/[A-Za-z0-9_.-]+$/.test(name)||['/compartilhado.html','/shared.css'].includes(name))){res.writeHead(404);return res.end();}
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg'};
 fs.readFile(path.join(__dirname,'minihero-offline',name),(err,data)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':mime[path.extname(name)]??'application/octet-stream','Cache-Control':'no-store',...(name==='/compartilhado.html'?{'Set-Cookie':previewCookie+'; HttpOnly; SameSite=Strict; Path=/'}:{})});res.end(data);});
});
server.listen(preview?17843:0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;
 async function call(route,data,cookie=''){const r=await fetch(base+'/shared-api/'+route,{method:data===undefined?'GET':'POST',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,value:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 try{
  const a=await call('register',{name:'QA Reconexao',password:crypto.randomBytes(20).toString('hex')}),b=await call('register',{name:'QA Amigo',password:crypto.randomBytes(20).toString('hex')});assert.equal(a.status,200);assert.equal(b.status,200);
  let r=await call('chat',{text:'Mensagem antes de ficar AFK',clientId:'primeira-mensagem'},a.cookie);assert.equal(r.status,200);const epoch=r.value.chatEpoch;
  r=await call('chat',{text:'Mensagem antes de ficar AFK',clientId:'primeira-mensagem'},a.cookie);assert.equal(r.status,200);assert.equal(r.value.messages.length,1,'Uma repetição de rede não pode duplicar a mensagem');
  at+=12*3600000;r=await call('chat',{text:'Voltei depois de doze horas',clientId:'segunda-mensagem'},a.cookie);assert.equal(r.status,200,'AFK não deve encerrar a sessão');assert.equal(r.value.messages.length,2);
  r=await call('chat',undefined,b.cookie);assert.equal(r.status,200);assert.equal(r.value.messages[1].name,'QA Reconexao');assert(r.value.online.includes('QA Amigo'));
  app.close();app=service({dir,now:clock});r=await call('chat',undefined,a.cookie);assert.equal(r.status,200,'Sessão deve sobreviver ao reinício');assert.equal(r.value.messages.length,2);assert.notEqual(r.value.chatEpoch,epoch);assert.equal(r.value.messages[1].text,'Voltei depois de doze horas');
  r=await call('chat',{text:'Voltei depois de doze horas',clientId:'segunda-mensagem'},a.cookie);assert.equal(r.status,200);assert.equal(r.value.messages.length,2);
  r=await call('chat',{text:'Mensagem após o reinício',clientId:'terceira-mensagem'},a.cookie);assert.equal(r.status,200);assert.equal(r.value.messages.at(-1).id,3);assert.equal(r.value.messages.at(-1).userId,undefined);
  assert.equal((await call('chat')).status,401);assert.equal((await call('session',undefined,a.cookie)).value.name,'QA Reconexao');
  console.log('OK: duas contas, 12h AFK sem logout, reconexão, repetição sem duplicatas, histórico e sessão preservados após reinício.');
  at=Date.now();r=await call('chat',{text:'Envio após ajuste do relógio',clientId:'quarta-mensagem'},a.cookie);assert.equal(r.status,200,'Um ajuste do relógio não pode bloquear envios indefinidamente');
  if(preview){liveClock=true;previewCookie=a.cookie;await call('tutorial/defer',{},a.cookie);console.log('Prévia isolada: '+base);return;}
 }catch(e){console.error(e);process.exitCode=1;}
 app.close();server.close();
});
process.on('SIGINT',()=>{app.close();server.close(()=>process.exit());});
