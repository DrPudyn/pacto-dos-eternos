// Pagamento real de USDC na Solana devnet: pede, assina, confirma e não entrega duas vezes.
const assert=require('node:assert/strict'),crypto=require('crypto'),fs=require('fs'),http=require('http'),os=require('os'),path=require('path');
const bs58=require('./bs58.cjs');
const {decodeAddress,associatedTokenAddress}=require('./solana-pubkey.cjs');
const {compileTransaction,createAtaIdempotentIx,buildLojaPayment}=require('./solana-tx-build.cjs');
const PROGRAMS=require('./solana-programs.cjs');
const RPC=process.env.LOJA_SOLANA_RPC||'https://api.devnet.solana.com';
const TOKEN=PROGRAMS.TOKEN_PROGRAM_ID;
const RENT='SysvarRent111111111111111111111111111111111';
const OFFICIAL_DEVNET_USDC='4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

function keypair(){
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
 const raw=publicKey.export({type:'spki',format:'der'}).subarray(-32);
 return {address:bs58.encode(raw),privateKey};
}
function signWire(wire,privateKeys){
 const n=wire[0];
 if(n!==privateKeys.length)throw Error('A transação espera '+n+' assinaturas.');
 const message=wire.subarray(1+n*64);
 const out=Buffer.from(wire);
 privateKeys.forEach((key,i)=>{
  const sig=crypto.sign(null,message,key);
  if(sig.length!==64)throw Error('Assinatura Ed25519 inesperada.');
  sig.copy(out,1+i*64);
 });
 return out;
}
async function rpc(method,params){
 const res=await fetch(RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
 const body=await res.json().catch(()=>({}));
 if(!res.ok||body.error)throw Error(body.error?.message||'Falha na consulta RPC Solana.');
 return body.result;
}
async function waitSig(sig){
 const start=Date.now();
 while(Date.now()-start<90000){
  const st=await rpc('getSignatureStatuses',[[sig],{searchTransactionHistory:true}]);
  const row=st?.value?.[0];
  if(row?.err)throw Error('Transação rejeitada: '+JSON.stringify(row.err));
  if(row?.confirmationStatus==='confirmed'||row?.confirmationStatus==='finalized')return row;
  await new Promise(r=>setTimeout(r,1500));
 }
 throw Error('A devnet não confirmou '+sig);
}
async function send(wire){
 const sig=await rpc('sendTransaction',[wire.toString('base64'),{encoding:'base64',preflightCommitment:'confirmed',maxRetries:3}]);
 await waitSig(sig);
 return sig;
}
async function blockhash(){
 const value=await rpc('getLatestBlockhash',[{commitment:'finalized'}]);
 return value.value.blockhash;
}
async function airdrop(address){
 let last;
 for(const lamports of [1_000_000_000,500_000_000]){
  try{
   const sig=await rpc('requestAirdrop',[address,lamports]);
   await waitSig(sig);
   console.log('airdrop',lamports,sig);
   return sig;
  }catch(e){last=e;console.log('airdrop RPC falhou',lamports,e.message);await new Promise(r=>setTimeout(r,2000));}
 }
 try{
  const res=await fetch('https://faucet.solana.com/api/request',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://faucet.solana.com'},body:JSON.stringify({walletAddress:address,network:'devnet',amount:1})});
  const text=await res.text();
  if(!res.ok)throw Error(text.slice(0,240));
  const sig=(text.match(/[1-9A-HJ-NP-Za-km-z]{80,90}/)||[])[0];
  if(!sig)throw Error(text.slice(0,240));
  await waitSig(sig);
  return sig;
 }catch(e){last=e;}
 throw Error('Sem SOL na devnet. O requestAirdrop do cluster responde 410 (faucet fechado) e https://faucet.solana.com/api/request exige login GitHub e captcha, que este ambiente não completa. Sem SOL não há taxa para cunhar um mint de teste nem para enviar o USDC. Último erro: '+(last?.message||last));
}
async function tryOfficialUsdc(payer){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),8000);
 try{
  const res=await fetch('https://spl-token-faucet.com/api/request?token=USDC&wallet='+payer,{signal:controller.signal});
  const text=await res.text();
  if(!res.ok)throw Error(text.slice(0,180));
  const sig=(text.match(/[1-9A-HJ-NP-Za-km-z]{80,90}/)||[])[0];
  if(!sig)throw Error(text.slice(0,180));
  await waitSig(sig);
  return sig;
 }finally{clearTimeout(timer);}
}
async function createTestMint(payer){
 const mint=keypair();
 const rent=await rpc('getMinimumBalanceForRentExemption',[82]);
 const createData=Buffer.alloc(4+8+8+32);
 createData.writeUInt32LE(0,0);
 createData.writeBigUInt64LE(BigInt(rent),4);
 createData.writeBigUInt64LE(82n,12);
 decodeAddress(TOKEN).copy(createData,20);
 const init=Buffer.alloc(35);
 init[0]=0;init[1]=6;
 decodeAddress(payer.address).copy(init,2);
 init[34]=0;
 const created=signWire(compileTransaction({
  feePayer:payer.address,
  recentBlockhash:await blockhash(),
  instructions:[
   {programId:PROGRAMS.SYSTEM_PROGRAM_ID,data:createData,accounts:[
    {pubkey:payer.address,isSigner:true,isWritable:true},
    {pubkey:mint.address,isSigner:true,isWritable:true},
   ]},
   {programId:TOKEN,data:init,accounts:[
    {pubkey:mint.address,isSigner:false,isWritable:true},
    {pubkey:RENT,isSigner:false,isWritable:false},
   ]},
  ],
 }),[payer.privateKey,mint.privateKey]);
 const createSig=await send(created);
 const ata=associatedTokenAddress(payer.address,mint.address);
 const mintTo=Buffer.alloc(9);
 mintTo[0]=7;mintTo.writeBigUInt64LE(5_000_000n,1);
 const funded=signWire(compileTransaction({
  feePayer:payer.address,
  recentBlockhash:await blockhash(),
  instructions:[
   createAtaIdempotentIx(payer.address,payer.address,mint.address,ata),
   {programId:TOKEN,data:mintTo,accounts:[
    {pubkey:mint.address,isSigner:false,isWritable:true},
    {pubkey:ata,isSigner:false,isWritable:true},
    {pubkey:payer.address,isSigner:true,isWritable:false},
   ]},
  ],
 }),[payer.privateKey]);
 const mintSig=await send(funded);
 return {mint:mint.address,createSig,mintSig,note:'Faucet de USDC da devnet indisponível. Foi criado um mint de teste com 6 decimais, no mesmo programa SPL, e 5 tokens foram cunhados na carteira pagadora.'};
}

async function main(){
 const payer=keypair();
 const receiver=keypair();
 console.log('pagador',payer.address);
 console.log('recebedora',receiver.address);
 await airdrop(payer.address);
 let mint=OFFICIAL_DEVNET_USDC,mintNote='Mint oficial de USDC na devnet.';
 try{
  const faucetSig=await tryOfficialUsdc(payer.address);
  console.log('faucet USDC',faucetSig);
 }catch(e){
  console.log('faucet USDC indisponível:',e.message);
  const made=await createTestMint(payer);
  mint=made.mint;
  mintNote=made.note;
  console.log('mint de teste',made.mint);
  console.log('criar mint',made.createSig);
  console.log('cunhar',made.mintSig);
 }
 process.env.LOJA_SOLANA_CLUSTER='devnet';
 process.env.LOJA_SOLANA_RPC=RPC;
 process.env.LOJA_CARTEIRA_RECEBEDORA=receiver.address;
 process.env.LOJA_MINT_USDC=mint;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loja-devnet-'));
 const app=require('./shared-service.cjs').service({dir});
 const server=http.createServer((req,res)=>app.handle(req,res,new URL(req.url,'http://127.0.0.1')));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port+'/shared-api/';
 async function call(route,data,cookie=''){
  const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  const value=await r.json().catch(()=>({}));
  return {status:r.status,value,cookie:r.headers.get('set-cookie')?.split(';')[0]??cookie};
 }
 async function signed(route,payload){
  const challenge=await call('auth/challenge',{address:payer.address});
  const signature=[...crypto.sign(null,Buffer.from(challenge.value.message,'utf8'),payer.privateKey)];
  return call(route,{...payload,address:payer.address,message:challenge.value.message,signature});
 }
 try{
  const reg=await signed('auth/register',{name:'Devnet USDC'});
  assert.equal(reg.status,200,JSON.stringify(reg.value));
  assert.deepEqual(reg.value.loja.paymentOptions.map(p=>p.label),['USDC']);
  const cookie=reg.cookie;
  const before=reg.value.packet.player.mintCards;
  const [a,b]=await Promise.all([
   call('loja/pedido',{product:'character',quantity:1,paymentMint:mint},cookie),
   call('loja/pedido',{product:'character',quantity:1,paymentMint:mint},cookie),
  ]);
  assert.equal(a.status,200,JSON.stringify(a.value));
  assert.equal(b.status,200,JSON.stringify(b.value));
  assert.equal(a.value.lojaOrder.orderId,b.value.lojaOrder.orderId);
  const order=a.value.lojaOrder;
  assert.equal(order.amountMicro,500_000);
  assert.equal(order.receiver,receiver.address);
  assert.equal(order.paymentMint,mint);
  assert.equal(order.destinationAta,associatedTokenAddress(receiver.address,mint));
  const wire=signWire(buildLojaPayment({
   payer:payer.address,receiver:receiver.address,sourceAta:order.sourceAta,destAta:order.destinationAta,
   mint,amountMicro:order.amountMicro,decimals:order.decimals,reference:order.reference,blockhash:await blockhash(),
  }),[payer.privateKey]);
  const paymentSig=await send(wire);
  console.log('pagamento',paymentSig);
  console.log('explorer','https://explorer.solana.com/tx/'+paymentSig+'?cluster=devnet');
  const tx=await rpc('getTransaction',[paymentSig,{encoding:'jsonParsed',commitment:'confirmed',maxSupportedTransactionVersion:0}]);
  const keys=(tx.transaction.message.accountKeys||[]).map(k=>typeof k==='string'?k:k.pubkey);
  assert.ok(keys.includes(order.reference),'A transação não carrega a referência única do pedido.');
  const ix=[...(tx.transaction.message.instructions||[]),...(tx.meta.innerInstructions||[]).flatMap(g=>g.instructions||[])];
  const paid=ix.map(i=>i.parsed).find(p=>p?.type==='transferChecked'&&p.info?.mint===mint);
  assert.equal(paid.info.tokenAmount.amount,'500000');
  assert.equal(paid.info.destination,order.destinationAta);
  const first=await call('loja/confirmar',{orderId:order.orderId,signature:paymentSig},cookie);
  assert.equal(first.status,200,JSON.stringify(first.value));
  assert.equal(first.value.lojaResult.already,false);
  assert.equal(first.value.packet.player.mintCards,before+1);
  const second=await call('loja/confirmar',{orderId:order.orderId,signature:paymentSig},cookie);
  assert.equal(second.status,200,JSON.stringify(second.value));
  assert.equal(second.value.lojaResult.already,true);
  assert.equal(second.value.packet.player.mintCards,before+1);
  const weapon=await call('loja/pedido',{product:'weapon',quantity:1,paymentMint:mint},cookie);
  assert.equal(weapon.status,200);
  assert.notEqual(weapon.value.lojaOrder.orderId,order.orderId);
  assert.notEqual(weapon.value.lojaOrder.reference,order.reference);
  const reused=await call('loja/confirmar',{orderId:weapon.value.lojaOrder.orderId,signature:paymentSig},cookie);
  assert.equal(reused.status,400);
  assert.match(reused.value.error,/já foi usada/);
  assert.equal(reused.value.equipment,undefined);
  const state=await call('state',undefined,cookie);
  assert.equal(state.value.packet.player.mintCards,before+1);
  assert.equal(state.value.equipment.weaponSummons,reg.value.equipment.weaponSummons);
  const balance=await rpc('getTokenAccountBalance',[order.destinationAta]);
  assert.equal(balance.value.amount,'500000');
  console.log(mintNote);
  console.log('OK devnet',JSON.stringify({mint,payer:payer.address,receiver:receiver.address,signature:paymentSig,amountMicro:500000,seals:before+1}));
 }finally{
  server.close();
  try{app.close();}catch{}
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
