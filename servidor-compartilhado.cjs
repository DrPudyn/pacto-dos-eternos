const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const noticeToken=crypto.randomBytes(24).toString('hex'),noticeTokenFile=path.join(__dirname,'.aviso-local');
const {service}=require('./shared-service.cjs');const app=service({noticeToken});
const root=path.join(__dirname,'minihero-offline'),port=Number(process.env.MINIHERO_PORT??17841);
const serveAssets=require('./static-assets.cjs').staticAssets(root);
const server=http.createServer(async(req,res)=>{
 let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);return res.end();}
 if(await app.handle(req,res,url))return;
 let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end();}
 if(name==='/')name='/compartilhado.html';
 await serveAssets(req,res,name);
});server.listen(port,'127.0.0.1',()=>{fs.writeFileSync(noticeTokenFile,noticeToken,{mode:0o600});console.log('Mini Hero compartilhado: http://127.0.0.1:'+port);});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'A versão compartilhada já está aberta.':err.message);process.exitCode=1;});
let lastTowerSave=Date.now();
const towerTimer=setInterval(()=>{try{if(app.advanceTowers()&&Date.now()-lastTowerSave>=10000){app.persist();lastTowerSave=Date.now();}}catch(err){console.error('Falha ao avançar a Torre:',err.message);}},1000);
towerTimer.unref();
function stop(){clearInterval(towerTimer);app.persist();try{if(fs.readFileSync(noticeTokenFile,'utf8')===noticeToken)fs.unlinkSync(noticeTokenFile);}catch{}server.close(()=>process.exit());}process.on('SIGINT',stop);process.on('SIGTERM',stop);
