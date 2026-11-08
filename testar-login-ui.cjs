// Login UI: garante que os passos de cadastro/vínculo entram no DOM (sem "undefined" de append aninhado).
const assert=require('assert'),fs=require('fs'),http=require('http'),path=require('path'),os=require('os');
const source=fs.readFileSync('shared-adapter.js','utf8');
assert.match(source,/registerBox\.append\(nameLabel,name,create\)/);
assert.match(source,/panel\.append\([\s\S]*registerBox,linkBox/);
assert.doesNotMatch(source,/panel\.append\([\s\S]*registerBox\.append/);

async function withBrowser(run){
 let puppeteer;
 try{puppeteer=require('puppeteer');}catch{
  const {execFileSync}=require('child_process');
  execFileSync('npm',['install','--no-save','puppeteer@23'],{stdio:'inherit'});
  puppeteer=require('puppeteer');
 }
 const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox']});
 try{return await run(browser);}finally{await browser.close();}
}

async function withServer(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pacto-login-ui-'));
 const app=require('./shared-service.cjs').service({dir});
 const root=path.join(__dirname,'minihero-offline');
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg'};
 const server=http.createServer(async(q,s)=>{
  const url=new URL(q.url,'http://127.0.0.1');
  if(await app.handle(q,s,url))return;
  const name=url.pathname==='/'?'/compartilhado.html':url.pathname;
  if(!(/^\/shared-build\/[A-Za-z0-9_.-]+$/.test(name)||['/compartilhado.html','/shared.css'].includes(name))){s.writeHead(404);return s.end();}
  fs.readFile(path.join(root,name),(err,data)=>{if(err){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':mime[path.extname(name)]??'application/octet-stream','Cache-Control':'no-store'});s.end(data);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const {port}=server.address();
 return {port,close:()=>new Promise(r=>server.close(r))};
}

async function main(){
 const artifacts=path.join('/opt/cursor/artifacts');
 fs.mkdirSync(artifacts,{recursive:true});
 const {port,close}=await withServer();
 try{
  await withBrowser(async browser=>{
   const page=await browser.newPage();
   await page.setViewport({width:1280,height:800});
   const addr='TestWallet111111111111111111111111111';
   await page.evaluateOnNewDocument(a=>{
    const pk={toBase58:()=>a};
    const provider={isPhantom:true,connect:async()=>({publicKey:pk}),publicKey:pk,signMessage:async()=>({signature:new Uint8Array(64)})};
    globalThis.phantom={solana:provider};
    globalThis.solana=provider;
    const realFetch=globalThis.fetch.bind(globalThis);
    globalThis.fetch=async(url,init)=>{
     if(String(url).includes('/shared-api/auth/login')){const e=Object.assign(new Error('not found'),{status:404});throw e;}
     if(String(url).includes('/shared-api/')){
      const route=String(url).split('/shared-api/')[1];
      if(route==='auth/challenge')return {ok:true,json:async()=>({message:'Pacto test challenge'})};
      if(route==='auth/login'){const err=Error('not found');err.status=404;return {ok:false,status:404,json:async()=>({error:'not found'})};}
     }
     return realFetch(url,init);
    };
   },addr);
   await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle0',timeout:120000});
   await page.waitForSelector('#shared-wallet-connect',{timeout:120000});
   const connectText=await page.evaluate(()=>document.body.innerText);
   assert.equal(connectText.includes('undefined'),false,'login inicial não deve mostrar undefined');
   await page.screenshot({path:path.join(artifacts,'login-solana-connect.png'),fullPage:true});
   await page.click('#shared-wallet-connect');
   await page.waitForFunction(()=>!document.querySelector('#shared-wallet-name')?.hidden,{timeout:30000});
   await page.waitForSelector('#shared-wallet-name:not([hidden])');
   const registerText=await page.evaluate(()=>({hasName:!!document.querySelector('#shared-wallet-name'),hasCreate:!!document.querySelector('.shared-wallet-step .primary'),undef:document.body.innerText.includes('undefined')}));
   assert.equal(registerText.undef,false);
   assert.equal(registerText.hasName,true);
   assert.equal(registerText.hasCreate,true);
   await page.screenshot({path:path.join(artifacts,'login-solana-create-pact.png'),fullPage:true});
   await page.click('button.switch');
   await page.waitForFunction(()=>!document.querySelector('#shared-link-name')?.hidden,{timeout:15000});
   await page.screenshot({path:path.join(artifacts,'login-solana-link-legacy.png'),fullPage:true});
   const link=await page.evaluate(()=>({hasLegacy:!!document.querySelector('#shared-link-name'),undef:document.body.innerText.includes('undefined')}));
   assert.equal(link.undef,false);
   assert.equal(link.hasLegacy,true);
  });
  console.log('testar-login-ui: ok');
 }finally{await close();}
}
main().catch(e=>{console.error(e);process.exit(1);});
