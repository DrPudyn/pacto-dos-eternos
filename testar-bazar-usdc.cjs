// Bazar USDC: testes locais com transação simulada. Nenhuma chamada a devnet ou mainnet.
const assert=require('node:assert/strict'),crypto=require('crypto'),fs=require('fs'),http=require('http'),os=require('os'),path=require('path'),vm=require('vm');
const bs58=require('./bs58.cjs');
const {associatedTokenAddress,decodeAddress}=require('./solana-pubkey.cjs');
const {load,splitMicro,parsePriceUsdc,DEVELOPER_WALLET,FEE_BPS,SELLER_BPS,MIN_MICRO}=require('./bazar-usdc-config.cjs');
const {verifySplit}=require('./bazar-usdc-verify.cjs');
const {createBazarUsdcService}=require('./bazar-usdc-service.cjs');
const {compileTransaction,createAtaIdempotentIx,transferCheckedIx,messageBytes}=require('./solana-tx-build.cjs');
const {createEngine}=require('./shared-engine.cjs');
const {service}=require('./shared-service.cjs');
const {sharedStore}=require('./shared-store.cjs');
const LOJA='7EqQdEhbDkmM6gXesmPGiLvdYRB67a8bCGem15tEtb7g';
delete process.env.BAZAR_USDC;
assert.equal(load().enabled,false);
assert.equal(decodeAddress(DEVELOPER_WALLET).length,32);
assert.equal(FEE_BPS,1500);
assert.equal(SELLER_BPS,8500);
assert.notEqual(DEVELOPER_WALLET,LOJA);
assert.equal(MIN_MICRO,7);
for(const n of [7,8,9,10,11,100,999,1000,10_000,1_000_000,1_000_000_000_000]){
 const split=splitMicro(n);
 assert.equal(split.feeMicro+split.sellerMicro,n);
 assert.equal(split.feeMicro,Number((BigInt(n)*1500n)/10000n));
 assert.ok(split.feeMicro>=1&&split.sellerMicro>=1);
}
for(let n=7;n<=5000;n++){const split=splitMicro(n);assert.equal(split.feeMicro+split.sellerMicro,n);assert.ok(split.feeMicro>=1&&split.sellerMicro>=1);}
assert.deepEqual({fee:splitMicro(10).feeMicro,seller:splitMicro(10).sellerMicro},{fee:1,seller:9});
assert.deepEqual({fee:splitMicro(1_000_000).feeMicro,seller:splitMicro(1_000_000).sellerMicro},{fee:150_000,seller:850_000});
assert.equal(splitMicro(7).feeMicro,1);
assert.equal(splitMicro(7).sellerMicro,6);
assert.throws(()=>splitMicro(6),/zero|mínimo|inválido/i);
assert.throws(()=>splitMicro(0),/inválido/i);
assert.throws(()=>splitMicro(1_000_000_000_001),/máximo/i);
const comma=parsePriceUsdc('1,50');
assert.equal(comma.priceMicro,1_500_000);
assert.equal(comma.feeMicro+comma.sellerMicro,comma.priceMicro);
assert.equal(parsePriceUsdc('0.000007').priceMicro,7);
assert.equal(parsePriceUsdc('0,000007').feeMicro,1);
assert.throws(()=>parsePriceUsdc(1.5),/USDC/);
assert.throws(()=>parsePriceUsdc('0.000006'),/zero|mínimo/i);
assert.throws(()=>parsePriceUsdc('1000001'),/máximo/i);
const adapterSource=fs.readFileSync('shared-adapter.js','utf8');
const browserSource=fs.readFileSync('solana-spl-browser.js','utf8');
assert.match(adapterSource,/USDC ENTRE JOGADORES/);
assert.match(adapterSource,/bazar-usdc\/confirmar/);
assert.match(adapterSource,/ASSINAR NA MINHA CARTEIRA/);
assert.match(browserSource,/\/shared-api\/bazar-usdc\/rpc/);
assert.doesNotMatch(adapterSource,/BHSxkg3pmnmmMpiK77yPXgWokaJvSUJ3WynT12c2HjWx/);
assert.doesNotMatch(browserSource,/BHSxkg3pmnmmMpiK77yPXgWokaJvSUJ3WynT12c2HjWx/);
assert.doesNotMatch(fs.readFileSync('bot-market.cjs','utf8'),/bazarUsdc/);
assert.doesNotMatch(fs.readFileSync('bazar-usdc-service.cjs','utf8'),/paid-unfulfilled/);
assert.match(adapterSource,/O item fica reservado para este pedido/);
assert.doesNotMatch(adapterSource,/não é entregue de novo/);
assert.match(browserSource,/Pedido sem a transação autorizada/);
function wallet(){
 const {publicKey}=crypto.generateKeyPairSync('ed25519');
 return bs58.encode(publicKey.export({type:'spki',format:'der'}).subarray(-32));
}
function fakeSig(){return bs58.encode(crypto.randomBytes(64));}
function checked(source,destination,mint,amount,authority,decimals=6){
 return {parsed:{type:'transferChecked',info:{source,destination,mint,authority,tokenAmount:{amount:String(amount),decimals}}}};
}
const databases=[];
function storedOrder(order){
 const id=order.orderId||order.id;
 for(const database of databases){const row=database.bazarUsdcOrders?.find(o=>o.id===id);if(row?.message)return row;}
 return order;
}
function mockTx(order,patch={}){
 const full=storedOrder(order);
 const sellerAmt=patch.sellerMicro??full.sellerMicro,feeAmt=patch.feeMicro??full.feeMicro,mint=patch.mint??full.mint;
 const sellerDest=patch.sellerDest??full.sellerAta,feeDest=patch.feeDest??full.developerAta;
 const authority=patch.authority??full.payer,source=patch.source??full.payerAta;
 const legs=[];
 if(patch.legs!=='fee')legs.push(checked(source,sellerDest,patch.sellerMint??mint,sellerAmt,patch.sellerAuthority??authority,patch.sellerDecimals??6));
 if(patch.legs!=='seller')legs.push(checked(patch.feeSource??source,feeDest,patch.feeMint??mint,feeAmt,patch.feeAuthority??authority,patch.feeDecimals??6));
 const keys=patch.keys??[full.payer,full.reference,full.sellerAta,full.developerAta,full.mint];
 const tx={slot:4,blockTime:8,meta:{err:patch.err??null,preTokenBalances:[],postTokenBalances:[]},transaction:{message:{accountKeys:keys,instructions:patch.inner||patch.kind?[]:legs}}};
 if(patch.message!==false)tx.messageBase64=patch.messageBase64??full.message;
 if(patch.finalized===false)tx.finalized=false;
 if(patch.confirmationStatus)tx.confirmationStatus=patch.confirmationStatus;
 if(patch.inner)tx.meta.innerInstructions=[{instructions:legs}];
 if(patch.kind==='transfer')tx.transaction.message.instructions=[{parsed:{type:'transfer',info:{source,destination:sellerDest,mint,amount:String(full.priceMicro),authority}}}];
 if(patch.kind==='balance'){
  tx.meta.preTokenBalances=[{accountIndex:2,mint:full.mint,owner:full.sellerWallet,uiTokenAmount:{amount:'0',decimals:6}}];
  tx.meta.postTokenBalances=[{accountIndex:2,mint:full.mint,owner:full.sellerWallet,uiTokenAmount:{amount:String(full.priceMicro),decimals:6}}];
 }
 return tx;
}
const heroTemplate=structuredClone(createEngine(null).engine.player.heroes[0]);
Object.assign(heroTemplate,{status:'idle',rarity:5,forgeSince:null,skills:['precision','swift'],skillLevels:{precision:2,swift:1},skillXpTicks:80});
function engineWith(heroes,weapons=[]){
 const {engine}=createEngine(null);
 engine.player.heroes=heroes.map(h=>structuredClone(h));
 engine.nextId=5000;
 engine.player.equipment={version:1,embers:0,receipts:{},weapons:weapons.map(w=>structuredClone(w))};
 return engine;
}
function weapon(extra={}){return {id:'arma-usdc',skin:'swordsman',rarity:4,level:7,passive:'crit',heroId:null,favorite:false,failures:2,invested:40,version:3,createdAt:1,...extra};}
let nowAt=1_700_000_000_000;
function rpcResult(result){return {ok:true,json:async()=>({result}),text:async()=>JSON.stringify({jsonrpc:'2.0',id:1,result})};}
function harness(extra={}){
 const cfg={...load({enabled:extra.enabled??true,orderTtlMs:extra.ttl??60_000}),rpc:'https://rpc.teste.invalid'};
 const calls=[],fetchCalls=[];
 const tx=new Map();
 const net={blockhash:bs58.encode(crypto.randomBytes(32)),lastValidBlockHeight:5000,height:100,valid:true,fail:new Set(),truncated:false,signatures:[]};
 const bazar=createBazarUsdcService({config:cfg,now:()=>nowAt,lojaReceiver:LOJA,getTransaction:async(rpc,sig)=>{calls.push({rpc,sig});if(String(rpc).includes('solana.com'))throw Error('rede real');if(tx.get(sig)==='throw')throw Error('rede');return tx.has(sig)?tx.get(sig):null;},fetch:async(url,init)=>{
  const method=init?.body?JSON.parse(init.body).method:'';
  fetchCalls.push(method||String(url));
  if(String(url).includes('solana.com')||method==='sendTransaction')throw Error('rede real bloqueada');
  if(net.fail.has(method)||net.fail.has('all'))throw Error('rede instável');
  if(method==='getLatestBlockhash')return rpcResult({value:{blockhash:net.blockhash,lastValidBlockHeight:net.lastValidBlockHeight}});
  if(method==='getBlockHeight')return rpcResult(net.height);
  if(method==='isBlockhashValid')return rpcResult({value:net.valid});
  if(method==='getSignaturesForAddress')return rpcResult(net.truncated?Array.from({length:1000},()=>({signature:fakeSig()})):net.signatures.map(signature=>({signature})));
  return extra.fetch?extra.fetch(url,init):{ok:false,json:async()=>({}),text:async()=>'no'};
 }});
 function spawn(){return createBazarUsdcService({config:cfg,now:()=>nowAt,lojaReceiver:LOJA,getTransaction:async(rpc,sig)=>{calls.push({rpc,sig});if(String(rpc).includes('solana.com'))throw Error('rede real');if(tx.get(sig)==='throw')throw Error('rede');return tx.has(sig)?tx.get(sig):null;},fetch:async(url,init)=>{
  const method=init?.body?JSON.parse(init.body).method:'';
  fetchCalls.push(method||String(url));
  if(String(url).includes('solana.com')||method==='sendTransaction')throw Error('rede real bloqueada');
  if(net.fail.has(method)||net.fail.has('all'))throw Error('rede instável');
  if(method==='getLatestBlockhash')return rpcResult({value:{blockhash:net.blockhash,lastValidBlockHeight:net.lastValidBlockHeight}});
  if(method==='getBlockHeight')return rpcResult(net.height);
  if(method==='isBlockhashValid')return rpcResult({value:net.valid});
  if(method==='getSignaturesForAddress')return rpcResult(net.truncated?Array.from({length:1000},()=>({signature:fakeSig()})):net.signatures.map(signature=>({signature})));
  return {ok:false,json:async()=>({}),text:async()=>'no'};
 }});}
 return {bazar,cfg,calls,fetchCalls,tx,net,spawn};
}
(async()=>{
 const offHits={fetch:0,tx:0};
 const off=createBazarUsdcService({fetch:()=>{offHits.fetch++;throw Error('rede');},getTransaction:()=>{offHits.tx++;throw Error('rede');}});
 assert.equal(off.publicConfig().enabled,false);
 assert.equal(off.publicConfig().developerWallet,null);
 const offDb={listings:[],users:[]};
 const offUser={id:'u',name:'Off',walletAddress:wallet()};
 const offEngine=engineWith([{...heroTemplate,id:1}]);
 await assert.rejects(()=>off.list(offDb,offUser,offEngine,{kind:'hero',heroId:1,priceUsdc:'1',payoutWallet:LOJA}),/desligado/);
 assert.equal(offEngine.player.heroes.length,1);
 assert.equal(offHits.fetch,0);
 assert.equal(offHits.tx,0);
 assert.equal((await off.proxyRpc({method:'getFeeForMessage',params:['aa']})).status,503);
 assert.equal(offHits.fetch,0);
 const {bazar,cfg,calls,fetchCalls,tx,net,spawn}=harness();
 assert.equal(cfg.developerWallet,DEVELOPER_WALLET);
 assert.equal(cfg.rpc,'https://rpc.teste.invalid');
 const sellerAddr=wallet(),buyerAddr=wallet();
 const seller={id:'seller',name:'Vendedor',walletAddress:sellerAddr};
 const buyer={id:'buyer',name:'Comprador',walletAddress:buyerAddr};
 const db={users:[seller,buyer],listings:[],bazarUsdcListings:[],bazarUsdcOrders:[],bazarUsdcSignatures:[]};
 databases.push(db);
 const gear=weapon();
 const equipped=weapon({id:'equipada',heroId:1});
 const favorite=weapon({id:'favorita',favorite:true});
 const sellerEngine=engineWith([{...heroTemplate,id:1},{...heroTemplate,id:2,skillLevels:{precision:0,swift:0}},{...heroTemplate,id:3,status:'working'},{...heroTemplate,id:4,status:'resting'}],[gear,equipped,favorite]);
 const goldBefore=sellerEngine.balance;
 await assert.rejects(()=>bazar.list(db,seller,sellerEngine,{kind:'hero',heroId:3,priceUsdc:'1'}),/Desative o herói/);
 await assert.rejects(()=>bazar.list(db,seller,sellerEngine,{kind:'hero',heroId:4,priceUsdc:'1'}),/Desative o herói/);
 assert.equal(sellerEngine.player.heroes.find(h=>h.id===3).status,'working');
 await assert.rejects(()=>bazar.list(db,seller,sellerEngine,{kind:'weapon',weaponId:'equipada',priceUsdc:'1'}),/Desequipe a arma/);
 await assert.rejects(()=>bazar.list(db,seller,sellerEngine,{kind:'weapon',weaponId:'favorita',priceUsdc:'1'}),/favoritos/);
 assert.equal(sellerEngine.player.equipment.weapons.find(w=>w.id==='equipada').heroId,1);
 assert.equal(sellerEngine.player.equipment.weapons.find(w=>w.id==='favorita').favorite,true);
 await assert.rejects(()=>bazar.list(db,seller,sellerEngine,{kind:'hero',heroId:1,priceUsdc:'0.000006'}),/zero|mínimo/i);
 assert.equal(sellerEngine.player.heroes.some(h=>h.id===1),true);
 db.listings=Array.from({length:30},(_,i)=>({id:'ouro-'+i,seller:seller.id,price:1,hero:{rarity:0},created:1}));
 await assert.rejects(()=>bazar.list(db,seller,sellerEngine,{kind:'hero',heroId:1,priceUsdc:'1'}),/30 anúncios/);
 db.listings=[];
 assert.equal(sellerEngine.balance,goldBefore);
 const listed=await bazar.list(db,seller,sellerEngine,{kind:'hero',heroId:1,priceUsdc:'1,50',payoutWallet:LOJA,developerWallet:DEVELOPER_WALLET,feeMicro:1,sellerMicro:1});
 assert.equal(listed.payoutWallet,sellerAddr);
 assert.notEqual(listed.payoutWallet,LOJA);
 assert.equal(listed.developerWallet,DEVELOPER_WALLET);
 assert.equal(listed.priceMicro,1_500_000);
 assert.equal(listed.sellerMicro+listed.feeMicro,listed.priceMicro);
 assert.equal(listed.feeMicro,225_000);
 assert.deepEqual(listed.hero.skillLevels,{precision:2,swift:1});
 assert.equal(listed.hero.skillXpTicks,80);
 assert.equal(listed.hero.weaponId,undefined);
 assert.equal(sellerEngine.player.heroes.some(h=>h.id===1),false);
 assert.equal(sellerEngine.player.equipment.weapons.find(w=>w.id==='equipada').heroId,null);
 assert.equal(sellerEngine.balance,goldBefore);
 assert.equal(db.listings.some(l=>l.id===listed.id),false);
 const restarted=createBazarUsdcService({config:cfg,now:()=>nowAt,lojaReceiver:LOJA,getTransaction:async()=>{throw Error('sem rede');},fetch:async()=>{throw Error('sem rede');}});
 const board=await restarted.view(db,buyer,()=>'Vendedor');
 assert.equal(board.listings.length,1);
 assert.equal(board.listings[0].hero.skillLevels.precision,2);
 assert.equal(board.developerWallet,DEVELOPER_WALLET);
 const buyerEngine=engineWith([{...heroTemplate,id:9,skillLevels:{precision:0,swift:0}}]);
 const buyerGold=buyerEngine.balance;
 await assert.rejects(()=>bazar.reserve(db,seller,sellerEngine,listed.id),/próprio/);
 const sameWallet={id:'outro',name:'Outro',walletAddress:sellerAddr};
 await assert.rejects(()=>bazar.reserve(db,sameWallet,buyerEngine,listed.id),/próprio/);
 const order=await bazar.reserve(db,buyer,buyerEngine,listed.id);
 const again=await bazar.reserve(db,buyer,buyerEngine,listed.id);
 assert.equal(again.orderId,order.orderId);
 assert.equal(order.sellerMicro+order.feeMicro,order.priceMicro);
 assert.equal(order.sellerWallet,sellerAddr);
 assert.equal(order.developerWallet,DEVELOPER_WALLET);
 assert.equal(order.sellerAta,associatedTokenAddress(sellerAddr,cfg.mint));
 assert.equal(order.developerAta,associatedTokenAddress(DEVELOPER_WALLET,cfg.mint));
 const shown={...order};delete shown.transaction;delete shown.blockhash;delete shown.reference;
 const raw=JSON.stringify(shown);
 assert.equal(raw.includes('http'),false);
 assert.equal(raw.includes('rpc'),false);
 assert.equal(/private|secret/i.test(JSON.stringify(Object.keys(order))),false);
 const row=db.bazarUsdcOrders.find(o=>o.id===order.orderId);
 assert.equal(/private|secret/i.test(JSON.stringify(Object.keys(row))),false);
 const prefix=Buffer.from('302a300506032b6570032100','hex');
 const pub=crypto.createPublicKey({key:Buffer.concat([prefix,decodeAddress(row.reference)]),format:'der',type:'spki'});
 assert.equal(crypto.verify(null,Buffer.from(row.message,'base64'),pub,Buffer.from(row.referenceSignature,'base64')),true);
 const partial=Buffer.from(order.transaction,'base64');
 assert.equal(partial[0],2);
 assert.ok(partial.subarray(1,65).every(byte=>byte===0));
 assert.equal(partial.subarray(65,129).equals(Buffer.from(row.referenceSignature,'base64')),true);
 assert.equal(order.signatureSeen,null);
 assert.equal(again.transaction,order.transaction);
 assert.equal(again.reference,order.reference);
 const reservedCancel=await bazar.cancel(db,seller,sellerEngine,listed.id);
 assert.equal(reservedCancel.ok,false);
 assert.match(reservedCancel.error,/reservado/i);
 assert.equal(sellerEngine.player.heroes.some(h=>h.id===1),false);
 const other=engineWith([{...heroTemplate,id:8}]);
 const otherUser={id:'terceiro',name:'Terceiro',walletAddress:wallet()};
 await assert.rejects(()=>bazar.reserve(db,otherUser,other,listed.id),/reservou/);
 async function bad(patch,message){
  const sig=fakeSig();
  tx.set(sig,patch===null?null:mockTx(order,patch||{}));
  if(patch===null){
   const missing=await bazar.confirm(db,buyer,buyerEngine,{orderId:order.orderId,signature:sig});
   assert.equal(missing.ok,false);
   assert.equal(missing.persist,true);
   assert.match(missing.error,/finalizada|não encontrada/);
  }else await assert.rejects(()=>bazar.confirm(db,buyer,buyerEngine,{orderId:order.orderId,signature:sig}),message);
  assert.equal(buyerEngine.player.heroes.length,1);
  assert.equal(db.bazarUsdcListings[0].status,'reserved');
 }
 await bad({sellerMicro:order.sellerMicro-1},/duas transferências|não conserva|Valor|destinatário|incorret/i);
 await bad({legs:'seller'},/duas transferências/);
 await bad({sellerMicro:order.feeMicro,feeMicro:order.sellerMicro},/duas transferências/);
 await bad({mint:'4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'},/duas transferências/);
 await bad({sellerDest:order.payerAta,feeDest:order.payerAta},/duas transferências/);
 await bad({err:'InstructionError'},/falhou/);
 await bad({keys:[order.payer,order.sellerAta,order.developerAta,order.mint]},/Referência/);
 await bad({authority:'So11111111111111111111111111111111111111112',source:'So11111111111111111111111111111111111111112'},/origem/);
 await bad({sellerDecimals:5,feeDecimals:5},/duas transferências/);
 await bad({kind:'transfer'},/duas transferências/);
 await bad({kind:'balance'},/duas transferências/);
 await bad(null,/não encontrada/);
 const boom=fakeSig();tx.set(boom,'throw');
 await assert.rejects(()=>bazar.confirm(db,buyer,buyerEngine,{orderId:order.orderId,signature:boom}),/não respondeu/);
 assert.ok(calls.every(c=>c.rpc==='https://rpc.teste.invalid'));
 assert.equal(calls.some(c=>String(c.rpc).includes('solana.com')),false);
 const innerSig=fakeSig();tx.set(innerSig,mockTx(order,{inner:true}));
 const inner=await bazar.confirm(db,buyer,buyerEngine,{orderId:order.orderId,signature:innerSig});
 assert.equal(inner.delivered,true);
 assert.equal(buyerEngine.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 assert.equal(buyerEngine.player.heroes.find(h=>h.skillLevels?.precision===2).skillXpTicks,80);
 assert.equal(buyerEngine.player.heroes.find(h=>h.skillLevels?.precision===2).status,'idle');
 assert.equal(buyerEngine.player.heroes.find(h=>h.skillLevels?.precision===2).weaponId,undefined);
 const replay=await bazar.confirm(db,buyer,buyerEngine,{orderId:order.orderId,signature:innerSig});
 assert.equal(replay.already,true);
 assert.equal(buyerEngine.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 assert.equal(buyerEngine.balance,buyerGold);
 assert.equal(sellerEngine.balance,goldBefore);
 const fresh=createBazarUsdcService({config:cfg,now:()=>nowAt,lojaReceiver:LOJA,getTransaction:async(rpc,sig)=>{assert.equal(rpc,cfg.rpc);return tx.get(sig);},fetch:async()=>{throw Error('sem rede');}});
 const second=await fresh.confirm(db,buyer,buyerEngine,{orderId:order.orderId,signature:innerSig});
 assert.equal(second.already,true);
 assert.equal(buyerEngine.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 const weaponEngine=engineWith([{...heroTemplate,id:1}],[weapon({id:'vendida'})]);
 const weaponListed=await bazar.list(db,seller,weaponEngine,{kind:'weapon',weaponId:'vendida',priceUsdc:'10'});
 assert.equal(weaponListed.weapon.level,7);
 assert.equal(weaponListed.weapon.passive,'crit');
 assert.equal(weaponListed.sellerMicro,8_500_000);
 assert.equal(weaponListed.feeMicro,1_500_000);
 const weaponBuyer=engineWith([]);
 const weaponOrder=await bazar.reserve(db,buyer,weaponBuyer,weaponListed.id);
 const weaponSig=fakeSig();tx.set(weaponSig,mockTx(weaponOrder));
 const weaponSale=await bazar.confirm(db,buyer,weaponBuyer,{orderId:weaponOrder.orderId,signature:weaponSig});
 assert.equal(weaponSale.delivered,true);
 assert.equal(weaponBuyer.player.equipment.weapons.length,1);
 assert.equal(weaponBuyer.player.equipment.weapons[0].level,7);
 assert.equal(weaponBuyer.player.equipment.weapons[0].passive,'crit');
 assert.equal(weaponBuyer.player.equipment.weapons[0].failures,2);
 assert.equal(weaponBuyer.player.equipment.weapons[0].invested,40);
 assert.equal(weaponBuyer.player.equipment.weapons[0].heroId,null);
 assert.equal(weaponBuyer.player.equipment.weapons[0].favorite,false);
 assert.notEqual(weaponBuyer.player.equipment.weapons[0].id,'vendida');
 assert.equal(weaponEngine.player.equipment.weapons.some(w=>w.id==='vendida'),false);
 const reuse=fakeSig();tx.set(reuse,mockTx(order));
 const reuseOrder=await (async()=>{
  const eng=engineWith([{...heroTemplate,id:30}]);
  const row=await bazar.list(db,seller,eng,{kind:'hero',heroId:30,priceUsdc:'1'});
  return bazar.reserve(db,buyer,engineWith([]),row.id);
 })();
 tx.set(innerSig,mockTx(reuseOrder));
 await assert.rejects(()=>bazar.confirm(db,buyer,engineWith([]),{orderId:reuseOrder.orderId,signature:innerSig}),/já foi usada/);
 const cancelEngine=engineWith([{...heroTemplate,id:40}]);
 const cancelRow=await bazar.list(db,seller,cancelEngine,{kind:'hero',heroId:40,priceUsdc:'2'});
 assert.equal(calls.length>0,true);
 const callsAtCancel=calls.length;
 await bazar.cancel(db,seller,cancelEngine,cancelRow.id);
 assert.equal(calls.length,callsAtCancel);
 assert.equal(cancelEngine.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 assert.equal(cancelEngine.balance,goldBefore);
 function liveNet(){net.height=100;net.valid=true;net.fail.clear();net.truncated=false;net.signatures=[];net.lastValidBlockHeight=5000;}
 const lateEngine=engineWith([{...heroTemplate,id:50}]);
 const lateRow=await bazar.list(db,seller,lateEngine,{kind:'hero',heroId:50,priceUsdc:'3'});
 const lateBuyer=engineWith([]);
 const lateOrder=await bazar.reserve(db,buyer,lateBuyer,lateRow.id);
 nowAt+=120_000;
 await bazar.releaseExpired(db);
 assert.equal(db.bazarUsdcListings.find(l=>l.id===lateRow.id).status,'reserved');
 const lateDenied=await bazar.cancel(db,seller,lateEngine,lateRow.id);
 assert.equal(lateDenied.ok,false);
 assert.equal(lateEngine.player.heroes.some(h=>h.skillLevels?.precision===2),false);
 const lateSig=fakeSig();tx.set(lateSig,mockTx(lateOrder));net.signatures=[lateSig];
 const lateHeld=await bazar.cancel(db,seller,lateEngine,lateRow.id);
 assert.equal(lateHeld.ok,false);
 assert.equal(lateHeld.deliver,true);
 assert.equal(lateEngine.player.heroes.some(h=>h.skillLevels?.precision===2),false);
 const late=await bazar.confirm(db,buyer,lateBuyer,{orderId:lateOrder.orderId,signature:lateSig});
 assert.equal(late.delivered,true);
 assert.equal(lateBuyer.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 const lateAgain=await bazar.confirm(db,buyer,lateBuyer,{orderId:lateOrder.orderId,signature:lateSig});
 assert.equal(lateAgain.already,true);
 assert.equal(lateBuyer.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 liveNet();
 const openEngine=engineWith([{...heroTemplate,id:60}]);
 const openRow=await bazar.list(db,seller,openEngine,{kind:'hero',heroId:60,priceUsdc:'4'});
 const openBuyer=engineWith([]);
 const openOrder=await bazar.reserve(db,buyer,openBuyer,openRow.id);
 nowAt+=120_000;
 await bazar.releaseExpired(db);
 assert.equal(db.bazarUsdcListings.find(l=>l.id===openRow.id).status,'reserved');
 const openSig=fakeSig();tx.set(openSig,mockTx(openOrder));
 const opened=await bazar.confirm(db,buyer,openBuyer,{orderId:openOrder.orderId,signature:openSig});
 assert.equal(opened.delivered,true);
 assert.equal(openBuyer.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 assert.equal(openEngine.player.heroes.some(h=>h.id===60),false);
 const spaceEngine=engineWith([{...heroTemplate,id:80}]);
 const spaceRow=await bazar.list(db,seller,spaceEngine,{kind:'hero',heroId:80,priceUsdc:'6'});
 const spaceBuyer=engineWith([{...heroTemplate,id:1,skillLevels:{precision:0,swift:0}}]);
 const spaceOrder=await bazar.reserve(db,buyer,spaceBuyer,spaceRow.id);
 while(spaceBuyer.player.heroes.length<500)spaceBuyer.player.heroes.push({id:spaceBuyer.nextId++,status:'idle',rarity:0,skin:'swordsman',atk:1,atkSpd:1,dur:1,skills:[],skillLevels:{}});
 const spaceSig=fakeSig();tx.set(spaceSig,mockTx(spaceOrder));
 const waiting=await bazar.confirm(db,buyer,spaceBuyer,{orderId:spaceOrder.orderId,signature:spaceSig});
 assert.equal(waiting.ok,false);
 assert.match(waiting.error,/espaço/);
 assert.equal(waiting.persist,true);
 assert.equal(spaceBuyer.player.heroes.filter(h=>h.skillLevels?.precision===2).length,0);
 assert.equal(db.bazarUsdcSignatures.includes(spaceSig),false);
 const spaceCancel=await bazar.cancel(db,seller,spaceEngine,spaceRow.id);
 assert.equal(spaceCancel.ok,false);
 assert.equal(spaceCancel.deliver,true);
 assert.equal(spaceEngine.player.heroes.some(h=>h.skillLevels?.precision===2),false);
 await assert.rejects(()=>bazar.reserve(db,otherUser,engineWith([]),spaceRow.id),/reservou/);
 spaceBuyer.player.heroes.pop();
 const delivered=await bazar.confirm(db,buyer,spaceBuyer,{orderId:spaceOrder.orderId,signature:spaceSig});
 assert.equal(delivered.delivered,true);
 assert.equal(spaceBuyer.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 const dup=await bazar.confirm(db,buyer,spaceBuyer,{orderId:spaceOrder.orderId,signature:spaceSig});
 assert.equal(dup.already,true);
 assert.equal(spaceBuyer.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 const devSeller={id:'dev',name:'Dono',walletAddress:DEVELOPER_WALLET};
 const devEngine=engineWith([{...heroTemplate,id:90}]);
 const devDb={users:[devSeller,buyer],listings:[],bazarUsdcListings:[],bazarUsdcOrders:[],bazarUsdcSignatures:[]};
 databases.push(devDb);
 const devRow=await bazar.list(devDb,devSeller,devEngine,{kind:'hero',heroId:90,priceUsdc:'1'});
 assert.equal(devRow.payoutWallet,DEVELOPER_WALLET);
 assert.equal(devRow.payoutAta,devRow.developerAta);
 const devBuyer=engineWith([]);
 const devOrder=await bazar.reserve(devDb,buyer,devBuyer,devRow.id);
 assert.equal(devOrder.sellerAta,devOrder.developerAta);
 assert.notEqual(devOrder.sellerMicro,devOrder.feeMicro);
 const devSig=fakeSig();tx.set(devSig,mockTx(devOrder));
 const devSale=await bazar.confirm(devDb,buyer,devBuyer,{orderId:devOrder.orderId,signature:devSig});
 assert.equal(devSale.delivered,true);
 const both=verifySplit(mockTx(devOrder),{...devOrder,decimals:6,priceMicro:devOrder.priceMicro});
 assert.equal(both.ok,true);
 let proxyFetches=0;
 const proxy=createBazarUsdcService({config:cfg,fetch:async(url,init)=>{
  proxyFetches++;
  assert.equal(String(url),cfg.rpc);
  assert.equal(String(url).includes('solana.com'),false);
  const body=JSON.parse(init.body);
  if(body.method==='getFeeForMessage')return {ok:true,text:async()=>JSON.stringify({jsonrpc:'2.0',id:body.id,result:{value:5000}})};
  if(body.method==='getAccountInfo')return {ok:true,text:async()=>JSON.stringify({jsonrpc:'2.0',id:body.id,error:{code:-1,message:'https://api.mainnet-beta.solana.com forbidden'}})};
  throw Error('https://api.devnet.solana.com caiu');
 }});
 assert.equal((await proxy.proxyRpc({method:'getBalance',params:[]})).status,400);
 assert.equal(proxyFetches,0);
 assert.equal((await proxy.proxyRpc({method:'getAccountInfo',params:['x'.repeat(9000)]})).status,413);
 assert.equal(proxyFetches,0);
 const leaked=await proxy.proxyRpc({method:'getAccountInfo',params:['mint']});
 assert.equal(JSON.stringify(leaked).includes('solana.com'),false);
 assert.match(leaked.body.error.message,/não respondeu/);
 const fee=await proxy.proxyRpc({method:'getFeeForMessage',params:['abc',{commitment:'confirmed'}]});
 assert.equal(fee.body.result.value,5000);
 const down=await proxy.proxyRpc({method:'sendTransaction',params:['zz']});
 assert.equal(down.status,502);
 assert.equal(JSON.stringify(down).includes('solana.com'),false);
 let heroSeq=100;
 async function reservedSale(){
  liveNet();
  const id=++heroSeq;
  const eng=engineWith([{...heroTemplate,id}]);
  const listed=await bazar.list(db,seller,eng,{kind:'hero',heroId:id,priceUsdc:'1'});
  const buyerEng=engineWith([]);
  const placed=await bazar.reserve(db,buyer,buyerEng,listed.id);
  return {eng,listed,buyerEng,order:placed};
 }
 function expire(){net.height=9000;net.valid=false;net.signatures=[];net.fail.clear();net.truncated=false;}
 {
  const eng=engineWith([{...heroTemplate,id:++heroSeq}]);
  const listed=await bazar.list(db,seller,eng,{kind:'hero',heroId:heroSeq,priceUsdc:'1'});
  net.fail.add('getLatestBlockhash');
  await assert.rejects(()=>bazar.reserve(db,buyer,engineWith([]),listed.id),/não respondeu/);
  assert.equal(db.bazarUsdcListings.find(l=>l.id===listed.id).status,'open');
  assert.equal(db.bazarUsdcOrders.some(o=>o.listingId===listed.id),false);
  assert.equal(eng.player.heroes.length,0);
  net.fail.clear();
  await bazar.reserve(db,buyer,engineWith([]),listed.id);
  assert.equal(db.bazarUsdcListings.find(l=>l.id===listed.id).status,'reserved');
 }
 {
  const {eng,listed,buyerEng,order}=await reservedSale();
  const earlySig=fakeSig();tx.set(earlySig,mockTx(order,{finalized:false,confirmationStatus:'confirmed'}));
  const early=await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:earlySig});
  assert.equal(early.ok,false);assert.equal(early.persist,true);assert.match(early.error,/finalizada/);
  assert.equal(buyerEng.player.heroes.length,0);
  expire();
  const denied=await bazar.cancel(db,seller,eng,listed.id);
  assert.equal(denied.ok,false);
  assert.equal(eng.player.heroes.length,0);
  tx.set(earlySig,mockTx(order));net.signatures=[earlySig];
  const done=await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:earlySig});
  assert.equal(done.delivered,true);
 }
 {
  const {eng,listed,buyerEng,order}=await reservedSale();
  expire();
  const [first,second]=await Promise.allSettled([bazar.cancel(db,seller,eng,listed.id),bazar.cancel(db,seller,eng,listed.id)]);
  const restored= [first,second].filter(r=>r.status==='fulfilled'&&r.value.ok);
  assert.equal(restored.length,1);
  assert.equal([first,second].filter(r=>r.status==='rejected').length,1);
  assert.equal(eng.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
  const lateSig=fakeSig();tx.set(lateSig,mockTx(order));
  const after=await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:lateSig});
  assert.equal(after.ok,false);
  assert.match(after.error,/encerrado|não está mais reservado|custódia/);
  assert.equal(buyerEng.player.heroes.length,0);
  assert.equal(eng.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 }
 {
  const {eng,listed,buyerEng,order}=await reservedSale();
  const sig=fakeSig();tx.set(sig,mockTx(order));
  expire();net.signatures=[sig];
  const denied=await bazar.cancel(db,seller,eng,listed.id);
  assert.equal(denied.ok,false);assert.equal(denied.deliver,true);
  assert.equal(eng.player.heroes.length,0);
  const [a,b]=await Promise.all([bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig}),bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig})]);
  assert.equal([a,b].filter(r=>r.delivered).length,1);
  assert.equal([a,b].filter(r=>r.already).length,1);
  assert.equal(buyerEng.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 }
 {
  const {eng,listed}=await reservedSale();
  expire();
  net.fail.add('getBlockHeight');
  const down=await bazar.cancel(db,seller,eng,listed.id);
  assert.equal(down.ok,false);assert.match(down.error,/continua reservado/);assert.equal(eng.player.heroes.length,0);
  net.fail.delete('getBlockHeight');net.fail.add('isBlockhashValid');
  const mid=await bazar.cancel(db,seller,eng,listed.id);
  assert.equal(mid.ok,false);assert.equal(eng.player.heroes.length,0);
  net.fail.clear();
  const freed=await bazar.cancel(db,seller,eng,listed.id);
  assert.equal(freed.ok,true);
  assert.equal(eng.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 }
 {
  const {eng,listed}=await reservedSale();
  net.height=9000;net.valid=true;
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,false);
  net.height=100;net.valid=false;
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,false);
  assert.equal(eng.player.heroes.length,0);
  expire();
  const ghost=fakeSig();net.signatures=[ghost];
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,false);
  tx.set(ghost,'throw');
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,false);
  const callsBefore=calls.length;net.truncated=true;
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,false);
  assert.equal(calls.length,callsBefore);
  assert.equal(eng.player.heroes.length,0);
 }
 {
  const {eng,listed,buyerEng,order}=await reservedSale();
  const snap=JSON.parse(JSON.stringify(db));
  const revived=spawn();
  const sig=fakeSig();tx.set(sig,mockTx(order));
  const done=await revived.confirm(snap,buyer,buyerEng,{orderId:order.orderId,signature:sig});
  assert.equal(done.delivered,true);
  const snap2=JSON.parse(JSON.stringify(snap));
  const replay=await spawn().confirm(snap2,buyer,buyerEng,{orderId:order.orderId,signature:sig});
  assert.equal(replay.already,true);
  assert.equal(buyerEng.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
  assert.equal(db.bazarUsdcListings.find(l=>l.id===listed.id).status,'reserved');
 }
 {
  const {buyerEng,order}=await reservedSale();
  const sig=fakeSig();tx.set(sig,mockTx(order,{finalized:false}));
  const pending=await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig});
  assert.equal(pending.ok,false);
  const snap=JSON.parse(JSON.stringify(db));
  tx.set(sig,mockTx(order));
  const done=await spawn().confirm(snap,buyer,buyerEng,{orderId:order.orderId,signature:sig});
  assert.equal(done.delivered,true);
  const again=await spawn().confirm(JSON.parse(JSON.stringify(snap)),buyer,buyerEng,{orderId:order.orderId,signature:sig});
  assert.equal(again.already,true);
  assert.equal(buyerEng.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 }
 {
  const {eng,listed,buyerEng,order}=await reservedSale();
  const oldMessage=storedOrder(order).message,oldTx=order.transaction,oldReference=order.reference;
  const same=await bazar.reserve(db,buyer,buyerEng,listed.id);
  assert.equal(same.transaction,oldTx);
  expire();
  net.blockhash=bs58.encode(crypto.randomBytes(32));net.lastValidBlockHeight=20000;
  const rotated=await bazar.reserve(db,buyer,buyerEng,listed.id);
  assert.notEqual(rotated.transaction,oldTx);
  assert.notEqual(rotated.reference,oldReference);
  assert.equal(rotated.orderId,order.orderId);
  assert.equal(db.bazarUsdcListings.find(l=>l.id===listed.id).status,'reserved');
  net.height=100;net.valid=true;
  const staleSig=fakeSig();tx.set(staleSig,mockTx(order,{messageBase64:oldMessage}));
  await assert.rejects(()=>bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:staleSig}),/autorizada/);
  assert.equal(buyerEng.player.heroes.length,0);
  const newSig=fakeSig();tx.set(newSig,mockTx(order));
  assert.equal((await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:newSig})).delivered,true);
 }
 {
  const {eng,listed,buyerEng,order}=await reservedSale();
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,false);
  expire();
  await assert.rejects(()=>bazar.reserve(db,buyer,buyerEng,listed.id),/cancelamento/);
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,true);
  assert.equal(eng.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 }
 {
  const {eng,listed,buyerEng,order}=await reservedSale();
  const sig=fakeSig();tx.set(sig,mockTx(order));net.signatures=[sig];
  const again=await bazar.reserve(db,buyer,buyerEng,listed.id);
  assert.equal(again.reference,order.reference);
  assert.equal(again.signatureSeen,sig);
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).deliver,true);
  assert.equal((await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig})).delivered,true);
 }
 {
  const {eng,listed}=await reservedSale();
  expire();
  await assert.rejects(()=>bazar.reserve(db,otherUser,engineWith([]),listed.id),/reservou/);
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,true);
  assert.equal(eng.player.heroes.length,1);
 }
 {
  liveNet();
  const eng=engineWith([{...heroTemplate,id:++heroSeq}]);
  const listed=await bazar.list(db,seller,eng,{kind:'hero',heroId:heroSeq,priceUsdc:'1'});
  const before=fetchCalls.length;
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,true);
  assert.equal(fetchCalls.slice(before).includes('getBlockHeight'),false);
  assert.equal(fetchCalls.includes('sendTransaction'),false);
  assert.equal(eng.player.heroes.length,1);
 }
 {
  const {eng,listed,buyerEng,order}=await reservedSale();
  const row=storedOrder(order);
  const foreign=compileTransaction({feePayer:row.payer,recentBlockhash:row.blockhash,instructions:[
   createAtaIdempotentIx(row.payer,row.sellerWallet,row.mint,row.sellerAta),
   createAtaIdempotentIx(row.payer,row.developerWallet,row.mint,row.developerAta),
   transferCheckedIx(row.payerAta,row.mint,row.sellerAta,row.payer,row.sellerMicro,6,[row.reference]),
   transferCheckedIx(row.payerAta,row.mint,row.developerAta,row.payer,row.feeMicro,6,[row.reference]),
  ]});
  const foreignSig=fakeSig();tx.set(foreignSig,mockTx(order,{messageBase64:messageBytes(foreign).toString('base64')}));
  await assert.rejects(()=>bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:foreignSig}),/autorizada/);
  assert.equal(db.bazarUsdcListings.find(l=>l.id===listed.id).status,'reserved');
  expire();net.signatures=[foreignSig];
  assert.equal((await bazar.cancel(db,seller,eng,listed.id)).ok,true);
  assert.equal(buyerEng.player.heroes.length,0);
  assert.equal(eng.player.heroes.length,1);
 }
 {
  const {buyerEng,order}=await reservedSale();
  const blank=fakeSig();tx.set(blank,{slot:4,meta:{err:null},transaction:[order.transaction,'base64']});
  await assert.rejects(()=>bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:blank}),/autorizada|incompleta|não encontrada/);
  assert.equal(buyerEng.player.heroes.length,0);
  const full=Buffer.from(order.transaction,'base64');full[1]=7;
  const landed=fakeSig();tx.set(landed,{slot:9,meta:{err:null},transaction:[full.toString('base64'),'base64']});
  assert.equal((await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:landed})).delivered,true);
 }
 {
  const {buyerEng,order,listed}=await reservedSale();
  const listing=db.bazarUsdcListings.find(l=>l.id===listed.id);
  const sig=fakeSig();tx.set(sig,mockTx(order));
  db.bazarUsdcListings=db.bazarUsdcListings.filter(l=>l.id!==listed.id);
  const held=await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig});
  assert.equal(held.ok,false);assert.match(held.error,/não está mais reservado/);
  assert.equal(db.bazarUsdcSignatures.includes(sig),false);
  assert.equal(buyerEng.player.heroes.length,0);
  listing.status='open';listing.orderId=null;
  db.bazarUsdcListings.push(listing);
  assert.equal((await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig})).delivered,true);
 }
 {
  const {buyerEng,order,listed}=await reservedSale();
  const listing=db.bazarUsdcListings.find(l=>l.id===listed.id);
  listing.orderId='outro-pedido';
  const sig=fakeSig();tx.set(sig,mockTx(order));
  const blocked=await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig});
  assert.equal(blocked.ok,false);
  assert.equal(buyerEng.player.heroes.length,0);
  listing.orderId=order.orderId;
  assert.equal((await bazar.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig})).delivered,true);
 }
 {
  liveNet();
  const engA=engineWith([{...heroTemplate,id:++heroSeq}]);
  const listed=await bazar.list(db,seller,engA,{kind:'hero',heroId:heroSeq,priceUsdc:'1'});
  const [a,b]=await Promise.allSettled([bazar.reserve(db,buyer,engineWith([]),listed.id),bazar.reserve(db,otherUser,engineWith([]),listed.id)]);
  assert.equal(a.status==='fulfilled'&&b.status==='rejected'||b.status==='fulfilled'&&a.status==='rejected',true);
  assert.equal(db.bazarUsdcListings.find(l=>l.id===listed.id).status,'reserved');
 }
 {
  const {buyerEng,order}=await reservedSale();
  const full=Buffer.from(order.transaction,'base64');full[1]=9;
  const seen=[];
  const direct=createBazarUsdcService({config:cfg,now:()=>nowAt,lojaReceiver:LOJA,fetch:async(url,init)=>{
   const body=JSON.parse(init.body);seen.push(body.method);
   assert.equal(String(url).includes('solana.com'),false);
   if(body.method!=='getTransaction')throw Error('método inesperado');
   if(body.params[1].commitment!=='finalized'||body.params[1].encoding!=='base64')throw Error('compromisso errado');
   return rpcResult({slot:3,meta:{err:null},transaction:[full.toString('base64'),'base64']});
  }});
  const sig=fakeSig();
  assert.equal((await direct.confirm(db,buyer,buyerEng,{orderId:order.orderId,signature:sig})).delivered,true);
  assert.deepEqual(seen,['getTransaction']);
  assert.equal(buyerEng.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
 }
 assert.equal(db.bazarUsdcOrders.some(o=>o.status==='paid-unfulfilled'),false);
 assert.equal(devDb.bazarUsdcOrders.some(o=>o.status==='paid-unfulfilled'),false);
 assert.equal(fetchCalls.includes('sendTransaction'),false);
 const browserCalls=[];
 const browser=vm.runInNewContext(browserSource+'\n({build:mhSolanaBuildBazarTx,fee:mhSolanaNetworkFee})',{
  crypto,TextEncoder,Uint8Array,AbortController,setTimeout,clearTimeout,BigInt,DataView,ArrayBuffer,Map,btoa,atob:s=>Buffer.from(s,'base64').toString('binary'),fetch:async(url,init)=>{
   const body=JSON.parse(init.body);browserCalls.push({url:String(url),method:body.method});
   if(body.method==='sendTransaction'||body.method==='getLatestBlockhash')throw Error('não enviar');
   if(body.method==='getFeeForMessage')return {ok:true,json:async()=>({result:{value:5000}})};
   throw Error('método inesperado');
  }
 });
 const wire=Buffer.from(await browser.build(order,buyerAddr));
 function le(n){const b=Buffer.alloc(8);b.writeBigUInt64LE(BigInt(n));return b;}
 assert.equal(wire.toString('base64'),order.transaction);
 assert.equal(wire[0],2);
 assert.ok(wire.includes(Buffer.concat([Buffer.from([12]),le(order.sellerMicro),Buffer.from([6])])));
 assert.ok(wire.includes(Buffer.concat([Buffer.from([12]),le(order.feeMicro),Buffer.from([6])])));
 assert.ok(wire.includes(decodeAddress(order.reference)));
 assert.equal(await browser.fee(wire),5000);
 assert.deepEqual(browserCalls.map(c=>c.method),['getFeeForMessage']);
 assert.ok(browserCalls.every(c=>c.url==='/shared-api/bazar-usdc/rpc'));
 assert.equal(fetchCalls.some(url=>String(url).includes('solana.com')),false);
 console.log('Direto: reserva assinada, prova de expiração, entrega idempotente e transação simulada. Nenhuma rede Solana foi contatada.');
 await httpFlow();
 console.log('OK bazar USDC. devnet/mainnet não foram usados e nenhum SOL ou USDC foi gasto.');
})().catch(e=>{console.error(e);process.exit(1);});

async function httpFlow(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pacto-bazar-usdc-'));
 const tx=new Map();const calls=[];let fetches=0;
 const net={blockhash:bs58.encode(crypto.randomBytes(32)),lastValidBlockHeight:5000,height:100,valid:true,signatures:[]};
 async function getTransaction(rpc,sig){calls.push({rpc,sig});if(String(rpc).includes('solana.com'))throw Error('rede real');if(tx.get(sig)==='throw')throw Error('rede');return tx.has(sig)?tx.get(sig):null;}
 async function fetchImpl(url,init){
  fetches++;
  if(String(url).includes('solana.com'))throw Error('rede real');
  const body=init?.body?JSON.parse(init.body):{};
  if(body.method==='sendTransaction')throw Error('não enviar');
  if(body.method==='getLatestBlockhash')return rpcResult({value:{blockhash:net.blockhash,lastValidBlockHeight:net.lastValidBlockHeight}});
  if(body.method==='getBlockHeight')return rpcResult(net.height);
  if(body.method==='isBlockhashValid')return rpcResult({value:net.valid});
  if(body.method==='getSignaturesForAddress')return rpcResult(net.signatures.map(signature=>({signature})));
  throw Error('proxy desligado no teste');
 }
 let app=service({dir,fetch:fetchImpl,getTransaction});
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');app.handle(req,res,url);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 async function call(route,data,cookie=''){const response=await fetch(base+'/shared-api/'+route,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:response.status,value:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]??cookie};}
 function reload(mutator,options){
  app.close();
  const store=sharedStore(dir),db=store.load();
  if(mutator)mutator(db);
  store.save(db);store.close();
  app=service({dir,fetch:fetchImpl,getTransaction,...options});
 }
 try{
  const a=await call('register',{name:'Bazar Vendedor',password:'Test-bazar-vendedor-123'});
  const b=await call('register',{name:'Bazar Comprador',password:'Test-bazar-comprador-123'});
  const c=await call('register',{name:'Bazar Terceiro',password:'Test-bazar-terceiro-123'});
  assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(c.status,200);
  assert.equal(a.value.bazarUsdc.enabled,false);
  assert.equal(a.value.bazarUsdc.developerWallet,null);
  assert.equal(a.value.features.bazarUsdc,false);
  const refused=await call('bazar-usdc/anunciar',{kind:'hero',heroId:1,priceUsdc:'1',payoutWallet:LOJA},a.cookie);
  assert.equal(refused.status,400);
  assert.match(refused.value.error,/desligado/);
  assert.equal(fetches,0);
  assert.equal(calls.length,0);
  const viewOff=await call('bazar-usdc',undefined,b.cookie);
  assert.equal(viewOff.value.enabled,false);
  assert.equal(viewOff.value.developerWallet,null);
  assert.deepEqual(viewOff.value.listings,[]);
  const sellerAddr=wallet(),buyerAddr=wallet();
  reload(db=>{
   const seller=db.users.find(u=>u.name==='Bazar Vendedor'),buyer=db.users.find(u=>u.name==='Bazar Comprador'),third=db.users.find(u=>u.name==='Bazar Terceiro');
   const hero={...structuredClone(heroTemplate),id:1};
   const second={...structuredClone(heroTemplate),id:2,skillLevels:{precision:0,swift:0}};
   seller.walletAddress=sellerAddr;buyer.walletAddress=buyerAddr;third.walletAddress=wallet();
   seller.state.player.heroes=[hero,second];seller.state.nextId=20;seller.state.balance=80_000_000e6;
   seller.state.player.equipment={version:1,embers:0,receipts:{},weapons:[weapon({id:'ouro-arma'})]};
   buyer.state.player.heroes=[{...structuredClone(heroTemplate),id:1,skillLevels:{precision:0,swift:0}}];buyer.state.nextId=20;buyer.state.balance=80_000_000e6;
   buyer.state.player.equipment={version:1,embers:0,receipts:{},weapons:[]};
   for(const user of [seller,buyer,third])user.tutorial={version:1,completedAt:1,rewardClaimedAt:1,deferred:true,step:0};
  },{bazarConfig:{...load({enabled:true,orderTtlMs:60_000}),rpc:'https://rpc.teste.invalid'}});
  const quote=await call('bazar-usdc/cotar',{priceUsdc:'1,50'},a.cookie);
  assert.equal(quote.status,200);
  assert.equal(quote.value.quote.priceMicro,1_500_000);
  assert.equal(quote.value.quote.feeMicro,225_000);
  assert.equal(quote.value.quote.developerWallet,DEVELOPER_WALLET);
  const before=await call('state',undefined,a.cookie);
  const listed=await call('bazar-usdc/anunciar',{kind:'hero',heroId:1,priceUsdc:'1,50',payoutWallet:LOJA,developerWallet:LOJA,feeMicro:1,sellerMicro:9},a.cookie);
  assert.equal(listed.status,200);
  assert.equal(listed.value.bazarListing.payoutWallet,sellerAddr);
  assert.notEqual(listed.value.bazarListing.payoutWallet,LOJA);
  assert.equal(listed.value.bazarListing.developerWallet,DEVELOPER_WALLET);
  assert.equal(listed.value.bazarListing.hero.skillLevels.precision,2);
  assert.equal(listed.value.balance,before.value.balance);
  assert.equal(listed.value.features.bazarUsdc,true);
  const market=await call('market',undefined,b.cookie);
  assert.equal(market.value.listings.some(l=>l.id===listed.value.bazarListing.id),false);
  reload(db=>{const seller=db.users.find(u=>u.name==='Bazar Vendedor');seller.campaign={version:2,cleared:{},run:{status:'active',heroIds:[2],stage:1,lastAt:Date.now()+600000}};},{bazarConfig:{...load({enabled:true,orderTtlMs:60_000}),rpc:'https://rpc.teste.invalid'}});
  const blocked=await call('bazar-usdc/anunciar',{kind:'hero',heroId:2,priceUsdc:'1'},a.cookie);
  assert.equal(blocked.status,400);
  assert.match(blocked.value.error,/expedição/);
  reload(db=>{const seller=db.users.find(u=>u.name==='Bazar Vendedor');assert.equal(seller.state.player.heroes.some(h=>h.id===2),true);seller.campaign={version:2,cleared:{},run:null};seller.tower={version:'dungeon-v1',status:'active',paused:true,lastAt:Date.now()};},{bazarConfig:{...load({enabled:true,orderTtlMs:60_000}),rpc:'https://rpc.teste.invalid'}});
  const tower=await call('bazar-usdc/anunciar',{kind:'hero',heroId:2,priceUsdc:'1'},a.cookie);
  assert.equal(tower.status,400);
  assert.match(tower.value.error,/Torre/);
  reload(db=>{const seller=db.users.find(u=>u.name==='Bazar Vendedor');seller.tower=null;},{bazarConfig:{...load({enabled:true,orderTtlMs:60_000}),rpc:'https://rpc.teste.invalid'}});
  const gold=await call('market/list-weapon',{weaponId:'ouro-arma',price:1000},a.cookie);
  assert.equal(gold.status,200);
  const offers=await call('market',undefined,b.cookie);
  const offer=offers.value.listings.find(l=>l.weapon);
  assert.equal(offer.weapon.level,7);
  const bought=await call('market/buy',{id:offer.id},b.cookie);
  assert.equal(bought.status,200);
  assert.equal(bought.value.equipment.weapons[0].level,7);
  assert.equal(bought.value.equipment.weapons[0].passive,'crit');
  const usdc=await call('bazar-usdc',undefined,b.cookie);
  assert.equal(usdc.value.listings.length,1);
  assert.equal(usdc.value.listings[0].priceMicro,1_500_000);
  assert.equal(usdc.value.listings[0].sellerMicro,1_275_000);
  assert.equal(usdc.value.listings[0].feeMicro,225_000);
  const [first,second]=await Promise.all([call('bazar-usdc/reservar',{id:usdc.value.listings[0].id},b.cookie),call('bazar-usdc/reservar',{id:usdc.value.listings[0].id},c.cookie)]);
  const ok=[first,second].filter(r=>r.status===200);
  assert.equal(ok.length,1);
  assert.equal([first,second].filter(r=>r.status===400).length,1);
  const order=ok[0].value.bazarOrder;
  const winner=ok[0].cookie;
  assert.equal(order.sellerWallet,sellerAddr);
  assert.equal(order.developerWallet,DEVELOPER_WALLET);
  const shownOrder={...order};delete shownOrder.transaction;delete shownOrder.blockhash;delete shownOrder.reference;
  assert.equal(JSON.stringify(shownOrder).includes('http'),false);
  const sellerCancel=await call('bazar-usdc/cancelar',{id:usdc.value.listings[0].id},a.cookie);
  assert.equal(sellerCancel.status,409);
  assert.match(sellerCancel.value.error,/reservado/i);
  const stored=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8')).bazarUsdcOrders.find(o=>o.id===order.orderId);
  const badSig=fakeSig();tx.set(badSig,mockTx({...order,message:stored.message},{legs:'seller'}));
  const bad=await call('bazar-usdc/confirmar',{orderId:order.orderId,signature:badSig},winner);
  assert.equal(bad.status,400);
  assert.equal((await call('state',undefined,winner)).value.packet.player.heroes.filter(h=>h.skillLevels?.precision===2).length,0);
  const goodSig=fakeSig();tx.set(goodSig,mockTx({...order,message:stored.message}));
  const good=await call('bazar-usdc/confirmar',{orderId:order.orderId,signature:goodSig},winner);
  assert.equal(good.status,200);
  assert.equal(good.value.packet.player.heroes.filter(h=>h.skillLevels?.precision===2&&h.skillXpTicks===80).length,1);
  const replay=await call('bazar-usdc/confirmar',{orderId:order.orderId,signature:goodSig},winner);
  assert.equal(replay.status,200);
  assert.equal(replay.value.packet.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
  assert.ok(calls.every(c=>c.rpc==='https://rpc.teste.invalid'));
  reload(null,{bazarConfig:{...load({enabled:true,orderTtlMs:60_000}),rpc:'https://rpc.teste.invalid'}});
  const after=await call('state',undefined,winner);
  assert.equal(after.value.packet.player.heroes.filter(h=>h.skillLevels?.precision===2&&h.skillXpTicks===80).length,1);
  const sellerAfter=await call('state',undefined,a.cookie);
  assert.equal(sellerAfter.value.packet.player.heroes.some(h=>h.skillLevels?.precision===2),false);
  const replayAfter=await call('bazar-usdc/confirmar',{orderId:order.orderId,signature:goodSig},winner);
  assert.equal(replayAfter.status,200);
  assert.equal(replayAfter.value.packet.player.heroes.filter(h=>h.skillLevels?.precision===2).length,1);
  const self=await call('bazar-usdc/reservar',{id:usdc.value.listings[0].id},a.cookie);
  assert.equal(self.status,400);
  assert.match(self.value.error,/removido|próprio/);
  const secondListing=await call('bazar-usdc/anunciar',{kind:'hero',heroId:2,priceUsdc:'1'},a.cookie);
  assert.equal(secondListing.status,200);
  const reserved=await call('bazar-usdc/reservar',{id:secondListing.value.bazarListing.id},b.cookie);
  assert.equal(reserved.status,200);
  const row=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'),'utf8')).bazarUsdcOrders.find(o=>o.id===reserved.value.bazarOrder.orderId);
  const paidSig=fakeSig();tx.set(paidSig,mockTx({...reserved.value.bazarOrder,message:row.message}));net.signatures=[paidSig];
  const sellerLate=await call('bazar-usdc/cancelar',{id:secondListing.value.bazarListing.id},a.cookie);
  assert.equal(sellerLate.status,409);
  assert.match(sellerLate.value.error,/entregue/);
  const buyerAfter=await call('state',undefined,b.cookie);
  assert.equal(buyerAfter.value.packet.player.heroes.filter(h=>h.id!==1).length>=1,true);
  const sellerKept=await call('state',undefined,a.cookie);
  assert.equal(sellerKept.value.packet.player.heroes.some(h=>h.id===2),false);
  net.height=9000;net.valid=false;net.signatures=[];
  const third=await call('bazar-usdc/anunciar',{kind:'hero',heroId:sellerKept.value.packet.player.heroes[0]?.id??0,priceUsdc:'1'},a.cookie);
  if(third.status===200){
   const hold=await call('bazar-usdc/reservar',{id:third.value.bazarListing.id},b.cookie);
   assert.equal(hold.status,200);
   const cleared=await call('bazar-usdc/cancelar',{id:third.value.bazarListing.id},a.cookie);
   assert.equal(cleared.status,200);
  }
 }finally{app.close();server.close();}
}
