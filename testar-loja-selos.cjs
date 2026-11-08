const assert=require('node:assert/strict'),crypto=require('crypto'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http'),vm=require('vm');
const bs58=require('./bs58.cjs');
const {decodeAddress,associatedTokenAddress}=require('./solana-pubkey.cjs');
const PROGRAMS=require('./solana-programs.cjs');
assert.equal(PROGRAMS.ASSOCIATED_TOKEN_PROGRAM_ID,'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
assert.equal(decodeAddress(PROGRAMS.SYSTEM_PROGRAM_ID).length,32);
assert.ok(decodeAddress(PROGRAMS.SYSTEM_PROGRAM_ID).every(b=>b===0));
assert.equal(bs58.encode(Buffer.alloc(32)),PROGRAMS.SYSTEM_PROGRAM_ID);
for(const sample of [Buffer.alloc(32),Buffer.from([0,0,1,2,3]),Buffer.from([0,255]),crypto.randomBytes(32),crypto.randomBytes(64)]){
 assert.deepEqual(bs58.decode(bs58.encode(sample)),sample);
}
assert.equal(associatedTokenAddress('CH5hxStZQZTLhXt7FD1okkeN6V2Dhq4QvD6XhJf1Ufgv','4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),'JA9gH9BEc8y2q7YN5VwyjnvwozqmurrUuw2ymFo1S8wu');
const browserSource=fs.readFileSync('solana-spl-browser.js','utf8');
function browserApi(fetchImpl){
 return vm.runInNewContext(browserSource+'\n({ata:mhSolanaAta,decode:mhSolanaDecode58,encode:mhSolanaEncode58,programs:MH_SOLANA_PROGRAMS,rpc:mhSolanaRpc})',{crypto,TextEncoder,Uint8Array,AbortController,setTimeout,clearTimeout,fetch:fetchImpl});
}
const browser=browserApi(fetch);
assert.equal(browser.programs.ASSOCIATED_TOKEN_PROGRAM_ID,PROGRAMS.ASSOCIATED_TOKEN_PROGRAM_ID);
assert.equal(browser.decode(PROGRAMS.SYSTEM_PROGRAM_ID).length,32);
assert.equal(browser.encode(new Uint8Array(32)),PROGRAMS.SYSTEM_PROGRAM_ID);
const fakeSig=()=>bs58.encode(crypto.randomBytes(64));
const {load,welcomePriceUsd,amountMicro}=require('./loja-config.cjs');
const {verifyPayment}=require('./loja-tx-verify.cjs');
const {createLojaService}=require('./loja-service.cjs');
const {createEngine}=require('./shared-engine.cjs');
assert.equal(welcomePriceUsd(0.5,0.25,0.15),9.56);
const cfg=load();
assert.equal(amountMicro('welcome',1,cfg),9_560_000);
const receiver=process.env.LOJA_CARTEIRA_RECEBEDORA||'7EqQdEhbDkmM6gXesmPGiLvdYRB67a8bCGem15tEtb7g';
function mockTx({reference,mint,amount,destination,authority}){
 return {
  slot:123,blockTime:1,meta:{err:null,preTokenBalances:[],postTokenBalances:[{accountIndex:2,mint,owner:receiver,uiTokenAmount:{amount:String(amount),decimals:6}}]},
  transaction:{message:{accountKeys:[authority,reference,destination,mint],instructions:[{parsed:{type:'transferChecked',info:{source:'srcAta',destination,mint,tokenAmount:{amount:String(amount),decimals:6},authority}}}]}},
 };
}
function walletFixture(){
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
 const raw=publicKey.export({type:'spki',format:'der'}).subarray(-32);
 return {address:bs58.encode(raw),privateKey,sign:message=>crypto.sign(null,Buffer.from(message,'utf8'),privateKey)};
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'loja-test-'));
process.env.LOJA_CARTEIRA_RECEBEDORA=receiver;
process.env.LOJA_SOLANA_CLUSTER='devnet';
const lojaConfig=load();
const txMocks=new Map();
const rpcCalls=[];
const app=require('./shared-service.cjs').service({dir,lojaConfig,getTransaction:async(_rpc,sig)=>txMocks.get(sig)??null,fetch:async(url,init)=>{
 rpcCalls.push({url,body:init?.body});
 const req=JSON.parse(init.body);
 if(req.method==='getLatestBlockhash')return {ok:true,status:200,async text(){return JSON.stringify({jsonrpc:'2.0',id:req.id,result:{value:{blockhash:'block111',lastValidBlockHeight:9}}});}};
 if(req.method==='sendTransaction')return {ok:true,status:200,async text(){return JSON.stringify({jsonrpc:'2.0',id:req.id,result:'sigRpc'});}};
 return {ok:false,status:403,async text(){return JSON.stringify({error:{code:403,message:'Access forbidden from '+url}});}};
}});
const server=http.createServer((req,res)=>app.handle(req,res,new URL(req.url,'http://127.0.0.1')));
server.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port+'/shared-api/';
 async function call(route,data,cookie=''){
  const r=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  const value=await r.json().catch(()=>({}));
  return {status:r.status,value,cookie:r.headers.get('set-cookie')?.split(';')[0]??''};
 }
 async function signed(route,payload,fixture){
  const challenge=await call('auth/challenge',{address:fixture.address});
  const signature=[...fixture.sign(challenge.value.message)];
  return call(route,{...payload,address:fixture.address,message:challenge.value.message,signature});
 }
 try{
  assert.equal(await browser.ata('CH5hxStZQZTLhXt7FD1okkeN6V2Dhq4QvD6XhJf1Ufgv','4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),'JA9gH9BEc8y2q7YN5VwyjnvwozqmurrUuw2ymFo1S8wu');
  const unit=createLojaService({config:lojaConfig,getTransaction:async(_rpc,sig)=>txMocks.get(sig)});
  const db={lojaOrders:[],lojaUsedSignatures:[]};
  const user={id:'u1',walletAddress:walletFixture().address,lojaPurchases:{}};
  const engine=createEngine(require('./starter-state.cjs').starterState()).engine;
  const order=unit.createOrder(db,user,{product:'character',quantity:2,paymentMint:lojaConfig.mints.usdc});
  assert.ok(order.reference);
  assert.equal(order.amountMicro,1_000_000);
  assert.equal(order.rpc,undefined);
  assert.equal(unit.publicView(user).rpc,undefined);
  assert.equal(JSON.stringify(unit.publicView(user)).includes(lojaConfig.rpc),false);
  assert.equal(JSON.stringify(order).includes(lojaConfig.rpc),false);
  const closed=createLojaService({config:{...lojaConfig,enabled:false,rpc:'https://rpc-secreto.example'},fetch:async()=>{throw Error('não devia chamar');}});
  assert.equal((await closed.proxyRpc({jsonrpc:'2.0',id:1,method:'getLatestBlockhash',params:[]})).status,503);
  const bad=verifyPayment(mockTx({reference:'x',mint:lojaConfig.mints.usdc,amount:'999999',destination:order.destinationAta,authority:user.walletAddress}),{reference:order.reference,mint:order.paymentMint,amountMicro:order.amountMicro,decimals:6,destinationAta:order.destinationAta});
  assert.equal(bad.ok,false);
  const good=verifyPayment(mockTx({reference:order.reference,mint:order.paymentMint,amount:String(order.amountMicro),destination:order.destinationAta,authority:user.walletAddress}),{reference:order.reference,mint:order.paymentMint,amountMicro:order.amountMicro,decimals:6,destinationAta:order.destinationAta,payer:user.walletAddress});
  assert.equal(good.ok,true);
  const sig1=fakeSig();
  txMocks.set(sig1,mockTx({reference:order.reference,mint:order.paymentMint,amount:String(order.amountMicro),destination:order.destinationAta,authority:user.walletAddress}));
  const done=await unit.confirmOrder(db,user,engine,{orderId:order.orderId,signature:sig1});
  assert.equal(done.already,false);
  assert.equal(done.granted.quantity,2);
  assert.equal(engine.player.mintCards,17);
  assert.equal(order.receiver,receiver);
  const replay=await unit.confirmOrder(db,user,engine,{orderId:order.orderId,signature:sig1});
  assert.equal(replay.already,true);
  assert.equal(engine.player.mintCards,17);
  const [first,second]=await Promise.all([
   unit.confirmOrder(db,user,engine,{orderId:order.orderId,signature:sig1}),
   unit.confirmOrder(db,user,engine,{orderId:order.orderId,signature:sig1}),
  ]);
  assert.equal(first.already&&second.already,true);
  assert.equal(engine.player.mintCards,17);
  const other=unit.createOrder(db,user,{product:'weapon',quantity:1,paymentMint:lojaConfig.mints.usdc});
  const weaponsBefore=engine.player.weaponSummons;
  await assert.rejects(()=>unit.confirmOrder(db,user,engine,{orderId:other.orderId,signature:sig1}),/já foi usada/);
  assert.equal(engine.player.weaponSummons,weaponsBefore);
  assert.equal(db.lojaOrders.find(o=>o.id===other.orderId).status,'pending');
  const again=unit.createOrder(db,user,{product:'weapon',quantity:1,paymentMint:lojaConfig.mints.usdc});
  assert.equal(again.orderId,other.orderId);
  assert.equal(db.lojaOrders.filter(o=>o.product==='weapon'&&o.status==='pending').length,1);
  assert.throws(()=>unit.createOrder(db,user,{product:'character',quantity:1,paymentMint:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'}),/apenas USDC/);
  assert.deepEqual(unit.publicView(user).paymentOptions.map(p=>p.id),['usdc']);
  const offline=createLojaService({config:lojaConfig,getTransaction:async()=>{throw Error('fetch failed');}});
  const cards=engine.player.mintCards;
  const pending=offline.createOrder(db,user,{product:'character',quantity:1,paymentMint:lojaConfig.mints.usdc});
  await assert.rejects(()=>offline.confirmOrder(db,user,engine,{orderId:pending.orderId,signature:fakeSig()}),/não respondeu/);
  assert.equal(engine.player.mintCards,cards);
  assert.equal(db.lojaOrders.find(o=>o.id===pending.orderId).status,'pending');

  const welcome=unit.createOrder(db,user,{product:'welcome',quantity:1,paymentMint:lojaConfig.mints.usdc});
  assert.equal(welcome.amountMicro,9_560_000);
  const sigW=fakeSig();
  txMocks.set(sigW,mockTx({reference:welcome.reference,mint:welcome.paymentMint,amount:String(welcome.amountMicro),destination:welcome.destinationAta,authority:user.walletAddress}));
  const pack=await unit.confirmOrder(db,user,engine,{orderId:welcome.orderId,signature:sigW});
  assert.equal(pack.granted.revelation.heroes.length,15);
  assert.equal(pack.granted.revelation.weapons.length,15);
  assert.equal(user.lojaPurchases.welcome,1);
  assert.throws(()=>unit.createOrder(db,user,{product:'welcome',quantity:1,paymentMint:lojaConfig.mints.usdc}),/já foi comprado/);

  const buyer=walletFixture();
  const reg=await signed('auth/register',{name:'Loja QA'},buyer);
  assert.equal(reg.status,200);
  assert.equal(reg.value.loja.soon,false);
  const cookie=reg.cookie;
  const pedido=await call('loja/pedido',{product:'weapon',quantity:1,paymentMint:lojaConfig.mints.usdc},cookie);
  assert.equal(pedido.status,200);
  assert.ok(pedido.value.lojaOrder?.orderId);

  const dup=await Promise.all([
   call('loja/pedido',{product:'weapon',quantity:3,paymentMint:lojaConfig.mints.usdc},cookie),
   call('loja/pedido',{product:'weapon',quantity:3,paymentMint:lojaConfig.mints.usdc},cookie),
  ]);
  assert.equal(dup[0].status,200);
  assert.equal(dup[1].status,200);
  assert.equal(dup[0].value.lojaOrder.orderId,dup[1].value.lojaOrder.orderId);
  assert.equal(dup[0].value.lojaOrder.amountMicro,750_000);
  assert.equal(dup[0].value.lojaOrder.receiver,receiver);
  assert.equal(dup[0].value.loja.paymentOptions.length,1);
  assert.equal(dup[0].value.loja.paymentOptions[0].id,'usdc');
  assert.equal(dup[0].value.lojaOrder.rpc,undefined);
  assert.equal(dup[0].value.loja.rpc,undefined);
  assert.equal(JSON.stringify(dup[0].value).includes(lojaConfig.rpc),false);
  const anon=await call('loja/rpc',{jsonrpc:'2.0',id:1,method:'getLatestBlockhash',params:[{commitment:'finalized'}]});
  assert.equal(anon.status,401);
  const beforeCalls=rpcCalls.length;
  const blocked=await call('loja/rpc',{jsonrpc:'2.0',id:1,method:'getBalance',params:['11111111111111111111111111111111']},cookie);
  assert.equal(blocked.status,400);
  assert.match(blocked.value.error,/não é permitida/);
  assert.equal(rpcCalls.length,beforeCalls);
  const big=await call('loja/rpc',{jsonrpc:'2.0',id:1,method:'getAccountInfo',params:['x'.repeat(9000)]},cookie);
  assert.equal(big.status,413);
  assert.match(big.value.error,/grande demais/);
  const block=await call('loja/rpc',{jsonrpc:'2.0',id:7,method:'getLatestBlockhash',params:[{commitment:'finalized'}]},cookie);
  assert.equal(block.status,200);
  assert.equal(block.value.result.value.blockhash,'block111');
  assert.equal(block.value.id,7);
  assert.equal(JSON.stringify(block.value).includes(lojaConfig.rpc),false);
  assert.equal(JSON.stringify(block.value).includes('Access forbidden'),false);
  assert.equal(rpcCalls.at(-1).url,lojaConfig.rpc);
  assert.equal(JSON.parse(rpcCalls.at(-1).body).method,'getLatestBlockhash');
  const forbidden=await call('loja/rpc',{jsonrpc:'2.0',id:1,method:'getAccountInfo',params:['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']},cookie);
  assert.equal(forbidden.status,502);
  assert.equal(forbidden.value.error,'A rede Solana não respondeu. Tente novamente em instantes.');
  assert.equal(JSON.stringify(forbidden.value).includes(lojaConfig.rpc),false);
  assert.equal(JSON.stringify(forbidden.value).includes('Access forbidden'),false);
  const sent=await call('loja/rpc',{jsonrpc:'2.0',id:1,method:'sendTransaction',params:['wire',{encoding:'base58'}]},cookie);
  assert.equal(sent.status,200);
  assert.equal(sent.value.result,'sigRpc');
  const payer2=walletFixture();
  const reg2=await signed('auth/register',{name:'Loja RPC'},payer2);
  assert.equal(reg2.status,200);
  let limited;
  for(let n=0;n<21;n++)limited=await call('loja/rpc',{jsonrpc:'2.0',id:1,method:'getSignatureStatuses',params:[[fakeSig()]]},reg2.cookie);
  assert.equal(limited.status,429);
  assert.match(limited.value.error,/Muitas consultas/);
  let seen;
  const browserRpc=browserApi(async(url,init)=>{
   seen={url,init};
   if(String(url).includes('solana.com'))throw Error('RPC direto');
   return {ok:true,json:async()=>({jsonrpc:'2.0',id:1,result:{value:{blockhash:'zz'}}})};
  });
  assert.equal((await browserRpc.rpc('getLatestBlockhash',[{commitment:'finalized'}])).value.blockhash,'zz');
  assert.equal(seen.url,'/shared-api/loja/rpc');
  assert.equal(seen.init.credentials,'same-origin');
  assert.equal(JSON.parse(seen.init.body).method,'getLatestBlockhash');
  const broken=browserApi(async()=>{throw new TypeError('Failed to fetch');});
  await assert.rejects(()=>broken.rpc('getLatestBlockhash',[]),/não respondeu/);
  const usdt=await call('loja/pedido',{product:'weapon',quantity:1,paymentMint:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'},cookie);
  assert.equal(usdt.status,400);
  assert.match(usdt.value.error,/USDC/);

  console.log('OK: preços, só USDC, ATA da devnet, idempotência da assinatura, pedido único, proxy RPC e pacote de boas-vindas.');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();try{app.close();}catch{}}
});
