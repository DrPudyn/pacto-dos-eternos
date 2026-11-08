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
const browser=vm.runInNewContext(fs.readFileSync('solana-spl-browser.js','utf8')+'\n({ata:mhSolanaAta,decode:mhSolanaDecode58,encode:mhSolanaEncode58,programs:MH_SOLANA_PROGRAMS})',{crypto,TextEncoder,Uint8Array,fetch});
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
const app=require('./shared-service.cjs').service({dir,lojaConfig,getTransaction:async(_rpc,sig)=>txMocks.get(sig)??null,fetch:async()=>({})});
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
  const usdt=await call('loja/pedido',{product:'weapon',quantity:1,paymentMint:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'},cookie);
  assert.equal(usdt.status,400);
  assert.match(usdt.value.error,/USDC/);

  console.log('OK: preços, só USDC, ATA da devnet, idempotência da assinatura, pedido único, RPC fora e pacote de boas-vindas.');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();try{app.close();}catch{}}
});
