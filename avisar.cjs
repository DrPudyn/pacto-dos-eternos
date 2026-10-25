const fs=require('fs'),http=require('http'),path=require('path');
const port=Number(process.env.MINIHERO_PORT||17841);
const text=process.argv.slice(2).join(' ').trim();
function fail(message){console.error(message);process.exitCode=1;}
if(!Number.isInteger(port)||port<1||port>65535)fail('Porta local inválida.');
else if(!text)fail('Use: node avisar.cjs "sua mensagem"\nOu dê dois cliques em AVISO.cmd');
else send();
function send(){
 let token;
 try{token=fs.readFileSync(path.join(__dirname,'.aviso-local'),'utf8').trim();}catch{fail('O servidor local não está pronto. Abra o jogo e tente de novo.');return;}
 if(!/^[a-f0-9]{32,128}$/.test(token)){fail('O servidor local não está pronto. Abra o jogo e tente de novo.');return;}
 const body=Buffer.from(JSON.stringify({text}));
 const req=http.request({hostname:'127.0.0.1',port,path:'/shared-api/host/notice',method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','Content-Length':body.length,'X-Pacto-Aviso':token},timeout:5000},res=>{
  const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>{
   let value={};try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}
   if(res.statusCode===200&&value.ok){console.log('Aviso enviado. Os jogadores verão a mensagem na tela por 10 minutos. Cada jogador vê uma vez.');return;}
   if(res.statusCode===400){fail(value.error||'Mensagem inválida.');return;}
   if(res.statusCode===403){fail('O servidor recusou o aviso. Ele só pode ser enviado deste computador.');return;}
   fail(value.error||'Não foi possível enviar o aviso. Confira se o jogo está aberto.');
  });
 });
 req.on('timeout',()=>{req.destroy();fail('O servidor local não respondeu. Confira se o jogo está aberto.');});
 req.on('error',()=>fail('O servidor local não está aberto. Abra o jogo com ABRIR MINI HERO COMPARTILHADO.cmd e tente de novo.'));
 req.end(body);
}
