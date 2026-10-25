const fs=require('fs'),path=require('path'),http=require('http'),{spawn,execFileSync}=require('child_process');
const root=__dirname,pidFile=path.join(root,'tunel.pid'),log=path.join(root,'tunel.log');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function alive(id){try{process.kill(Number(id),0);return true;}catch{return false;}}
function detached(command,args,out,err){const child=spawn(command,args,{cwd:root,detached:true,windowsHide:true,stdio:['ignore',fs.openSync(out,'w'),fs.openSync(err,'w')]});child.unref();return child.pid;}
function ready(){return new Promise(resolve=>{const req=http.get('http://127.0.0.1:17841/',res=>{res.resume();resolve(res.statusCode===200);});req.on('error',()=>resolve(false));req.setTimeout(1500,()=>{req.destroy();resolve(false);});});}
async function ensureServer(){
 if(!await ready()){detached(process.execPath,['servidor-compartilhado.cjs'],path.join(root,'compartilhado.log'),path.join(root,'compartilhado-erro.log'));for(let i=0;i<30&&!await ready();i++)await wait(200);if(!await ready())throw Error('Não foi possível iniciar o servidor local.');}
}
async function getAccessLink({fresh=false}={}){
 await ensureServer();
 const accessPid=path.join(root,'tunel-acesso.pid'),accessLog=path.join(root,'tunel-acesso.log'),accessErr=path.join(root,'tunel-acesso-saida.log'),linkFile=path.join(root,'LINK PARA MEU IRMAO.txt');
 let id=fs.existsSync(accessPid)?Number(fs.readFileSync(accessPid,'utf8').trim()):0;
 let url=fs.existsSync(accessLog)?fs.readFileSync(accessLog,'utf8').match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0]:null;
 if(fresh||!id||!alive(id)||!url){
  if(fresh&&id&&alive(id))throw Error('Já há um link ativo. Para evitar desconectar seu amigo, use o link atual ou feche o túnel antes de gerar outro.');
  const client=path.join(root,'ferramentas','cloudflared.exe');if(!fs.existsSync(client))throw Error('Cliente oficial Cloudflare não encontrado na pasta ferramentas.');
  fs.writeFileSync(accessLog,'');id=detached(client,['tunnel','--url','http://127.0.0.1:17841','--protocol','http2','--no-autoupdate'],accessErr,accessLog);fs.writeFileSync(accessPid,String(id));url=null;
  for(let i=0;i<90;i++){if(fs.existsSync(accessLog))url=fs.readFileSync(accessLog,'utf8').match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];if(url)break;if(!alive(id))throw Error('O túnel encerrou. Consulte tunel-acesso.log.');await wait(500);}
 }
 if(!url)throw Error('O provedor ainda não devolveu o link. Tente novamente ou consulte tunel-acesso.log.');
 fs.writeFileSync(linkFile,url+'\r\n\r\nO PC e o túnel precisam ficar ligados. O cadastro exige apenas nome e senha.\r\n');
 fs.writeFileSync(path.join(root,'LINK PARA MEU AMIGO.txt'),url+'\r\n');
 return url;
}
async function main(){
 if(process.argv[2]==='stop'){
  const files=[pidFile,path.join(root,'tunel-acesso.pid')].filter(fs.existsSync);if(!files.length){console.log('Nenhum túnel registrado.');return;}
  for(const file of files){const id=Number(fs.readFileSync(file,'utf8').trim());if(!Number.isSafeInteger(id)||id<1)throw Error('Registro de processo inválido.');
   execFileSync('powershell.exe',['-NoProfile','-Command',`$t = Get-CimInstance Win32_Process -Filter "ProcessId = ${id}"; if ($t -and $t.Name -eq 'cloudflared.exe' -and $t.CommandLine.Contains('http://127.0.0.1:17841')) { Stop-Process -Id ${id} -ErrorAction Stop; Write-Output 'Acesso externo encerrado. O jogo local continua aberto.' } else { Write-Output 'O túnel já foi encerrado.' }`],{windowsHide:true,stdio:['ignore','inherit','inherit']});
  }return;
 }
 const url=await getAccessLink();
 console.log('\nLINK PARA COMPARTILHAR:\n'+url+'\n\nNo seu PC: http://127.0.0.1:17841\nO cadastro exige apenas nome e senha.\nO link pode mudar quando o túnel reiniciar.');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={getAccessLink};
