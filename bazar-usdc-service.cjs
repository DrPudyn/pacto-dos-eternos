const crypto=require('crypto');
const bs58=require('./bs58.cjs');
const {isWalletAddress}=require('./solana-auth.cjs');
const {associatedTokenAddress}=require('./solana-pubkey.cjs');
const {getTransaction}=require('./solana-rpc.cjs');
const equipment=require('./equipment-rules.cjs');
const marketRules=require('./market-rules.cjs');
const {load,parsePriceUsdc}=require('./bazar-usdc-config.cjs');
const {verifySplit}=require('./bazar-usdc-verify.cjs');
const OFF='O bazar em USDC entre jogadores está desligado até a aprovação do dono.';
const RPC_FAIL='A rede Solana não respondeu. Tente novamente em instantes.';
function createBazarUsdcService(options={}){
 const config=options.config??load(options);
 const fetchImpl=options.fetch??globalThis.fetch;
 const getTx=options.getTransaction??((rpc,sig)=>getTransaction(rpc,sig,fetchImpl));
 const now=options.now??(()=>Date.now());
 const lojaReceiver=options.lojaReceiver??null;
 let tail=Promise.resolve();
 function serial(fn){
  const run=tail.then(fn,fn);
  tail=run.then(()=>{},()=>{});
  return run;
 }
 function ensure(db){
  db.bazarUsdcListings??=[];
  db.bazarUsdcOrders??=[];
  db.bazarUsdcSignatures??=[];
 }
 function assertOn(){if(!config.enabled)throw Error(OFF);}
 function referenceKey(){
  const pair=crypto.generateKeyPairSync('ed25519');
  return bs58.encode(pair.publicKey.export({type:'spki',format:'der'}).subarray(-32));
 }
 function ata(owner){return associatedTokenAddress(owner,config.mint);}
 function payoutOf(user){
  if(!isWalletAddress(user?.walletAddress))throw Error('Vincule sua carteira Solana para negociar em USDC. O jogo não guarda chave privada.');
  // O destino do vendedor é só a carteira já autenticada. lojaReceiver nunca entra no anúncio.
  void lojaReceiver;
  return user.walletAddress;
 }
 function countListings(db,userId){
  const gold=(db.listings??[]).filter(l=>l.seller===userId).length;
  const usdc=db.bazarUsdcListings.filter(l=>l.sellerId===userId&&(l.status==='open'||l.status==='reserved')).length;
  return gold+usdc;
 }
 function releaseExpired(db,at=now()){
  ensure(db);
  for(const order of db.bazarUsdcOrders){
   if(order.status!=='pending'||order.paymentSeen||!(order.expiresAt<=at))continue;
   order.status='expired';
   const listing=db.bazarUsdcListings.find(l=>l.id===order.listingId&&l.orderId===order.id);
   if(listing?.status==='reserved'){listing.status='open';listing.orderId=null;}
  }
 }
 function canReceive(engine,listing){
  if(listing.type==='hero')return engine.player.heroes.length<500;
  return equipment.book(engine.player).weapons.length<1000;
 }
 function spaceError(listing){return listing.type==='hero'?'Sem espaço para outro herói.':'Mochila cheia: libere espaço antes de receber a arma.';}
 function give(engine,listing){
  if(listing.type==='hero'){
   const hero={...structuredClone(listing.hero),id:engine.nextId++,status:'idle',forgeSince:null};
   delete hero.weaponId;delete hero.weaponBonus;delete hero.weaponName;delete hero.weaponLevel;
   engine.player.heroes.push(hero);
   engine.syncEquipment?.();
   return {type:'hero',id:hero.id,skills:[...(hero.skills??[])],skillLevels:structuredClone(hero.skillLevels??{}),skillXpTicks:hero.skillXpTicks??0};
  }
  const weapon={...structuredClone(listing.weapon),id:crypto.randomUUID(),heroId:null,favorite:false,version:(listing.weapon.version??0)+1};
  equipment.book(engine.player).weapons.push(weapon);
  engine.syncEquipment?.();
  return {type:'weapon',id:weapon.id,level:weapon.level,passive:weapon.passive??null,rarity:weapon.rarity,skin:weapon.skin};
 }
 function publicItem(listing){
  if(listing.type==='weapon')return {weapon:marketRules.publicWeapon(listing.weapon)};
  const hero=listing.hero;
  return {hero:{...hero,weaponId:undefined,weaponBonus:undefined,weaponName:undefined,weaponLevel:undefined}};
 }
 function publicListing(listing,user,nameOf){
  return {
   id:listing.id,type:listing.type,status:listing.status,seller:nameOf(listing.sellerId),mine:listing.sellerId===user.id,
   reservedByMe:listing.buyerId===user.id&&listing.status==='reserved',
   priceMicro:listing.priceMicro,sellerMicro:listing.sellerMicro,feeMicro:listing.feeMicro,
   feeBps:config.feeBps,sellerBps:config.sellerBps,
   payoutWallet:listing.payoutWallet,developerWallet:listing.developerWallet,
   mint:listing.mint,cluster:listing.cluster,decimals:config.decimals,createdAt:listing.createdAt,
   ...publicItem(listing),
  };
 }
 function presentOrder(order,listing){
   return {
   orderId:order.id,listingId:listing.id,reference:order.reference,status:order.status,paymentSeen:!!order.paymentSeen,
   signatureSeen:order.paymentSeen?order.signatureSeen:null,
   priceMicro:order.priceMicro,sellerMicro:order.sellerMicro,feeMicro:order.feeMicro,
   feeBps:config.feeBps,sellerBps:config.sellerBps,
   sellerWallet:order.sellerWallet,sellerAta:order.sellerAta,
   developerWallet:order.developerWallet,developerAta:order.developerAta,
   payer:order.payer,payerAta:order.payerAta,
   mint:order.mint,decimals:config.decimals,cluster:order.cluster,expiresAt:order.expiresAt,
   type:listing.type,...publicItem(listing),
  };
 }
 function publicConfig(){
  return {
   enabled:config.enabled,feeBps:config.feeBps,sellerBps:config.sellerBps,decimals:config.decimals,
   minMicro:config.minMicro,maxMicro:config.maxMicro,cluster:config.enabled?config.cluster:null,
   mint:config.enabled?config.mint:null,developerWallet:config.enabled?config.developerWallet:null,
  };
 }
 function view(db,user,nameOf=()=>'Jogador'){
  return serial(()=>{
   ensure(db);releaseExpired(db);
   const listings=config.enabled?db.bazarUsdcListings.filter(l=>l.status==='open'||l.status==='reserved').map(l=>publicListing(l,user,nameOf)):[];
   return {enabled:config.enabled,feeBps:config.feeBps,sellerBps:config.sellerBps,decimals:config.decimals,minMicro:config.minMicro,developerWallet:config.enabled?config.developerWallet:null,mint:config.enabled?config.mint:null,cluster:config.enabled?config.cluster:null,listings};
  });
 }
 function quote(raw){assertOn();const split=parsePriceUsdc(raw);return {...split,developerWallet:config.developerWallet,decimals:config.decimals,mint:config.mint,cluster:config.cluster};}
 function list(db,user,engine,input){
  return serial(()=>{
   assertOn();ensure(db);releaseExpired(db);
   const payout=payoutOf(user);
   const split=parsePriceUsdc(input?.priceUsdc);
   if(countListings(db,user.id)>=30)throw Error('Limite de 30 anúncios por jogador.');
   const kind=input?.kind;
   const listing={
    id:crypto.randomUUID(),escrowId:crypto.randomUUID(),sellerId:user.id,status:'open',orderId:null,buyerId:null,
    payoutWallet:payout,payoutAta:ata(payout),
    developerWallet:config.developerWallet,developerAta:ata(config.developerWallet),
    mint:config.mint,cluster:config.cluster,
    priceMicro:split.priceMicro,sellerMicro:split.sellerMicro,feeMicro:split.feeMicro,
    createdAt:now(),
   };
   if(kind==='hero'){
    const heroId=input.heroId;
    const hero=engine.player.heroes.find(h=>h.id===heroId);
    if(!hero||hero.status!=='idle')throw Error('Desative o herói antes de anunciá-lo. Heróis em combate, trabalhando, na torre ou em expedição não entram no bazar.');
    for(const weapon of equipment.book(engine.player).weapons)if(weapon.heroId===hero.id){weapon.heroId=null;weapon.version++;}
    delete hero.weaponId;delete hero.weaponBonus;delete hero.weaponName;delete hero.weaponLevel;
    engine.player.heroes=engine.player.heroes.filter(h=>h.id!==hero.id);
    engine.syncEquipment?.();
    listing.type='hero';
    listing.hero=structuredClone(hero);
   }else if(kind==='weapon'){
    const weapon=equipment.find(engine.player,input.weaponId);
    if(weapon.heroId!==null)throw Error('Desequipe a arma antes de anunciá-la.');
    if(weapon.favorite)throw Error('Remova a arma dos favoritos antes de anunciá-la.');
    equipment.book(engine.player).weapons=equipment.book(engine.player).weapons.filter(w=>w.id!==weapon.id);
    engine.syncEquipment?.();
    listing.type='weapon';
    listing.weapon=structuredClone(weapon);
   }else throw Error('Escolha um herói ou uma arma.');
   db.bazarUsdcListings.push(listing);
   return publicListing(listing,user,()=>user.name??'Jogador');
  });
 }
 function restore(engine,listing){
  if(listing.type==='hero'){
   const hero={...structuredClone(listing.hero),id:engine.nextId++,status:'idle',forgeSince:null};
   delete hero.weaponId;delete hero.weaponBonus;delete hero.weaponName;delete hero.weaponLevel;
   engine.player.heroes.push(hero);
  }else{
   equipment.book(engine.player).weapons.push({...structuredClone(listing.weapon),id:crypto.randomUUID(),heroId:null,favorite:false,version:(listing.weapon.version??0)+1});
  }
  engine.syncEquipment?.();
 }
 function cancel(db,user,engine,id){
  return serial(()=>{
   assertOn();ensure(db);releaseExpired(db);
   const listing=db.bazarUsdcListings.find(l=>l.id===id);
   if(!listing)throw Error('Esse anúncio já foi removido ou comprado.');
   if(listing.sellerId!==user.id)throw Error('Você só pode cancelar seu anúncio.');
   if(listing.status!=='open'||listing.orderId)throw Error('Este anúncio está reservado. Não dá para cancelar depois da reserva ou do pagamento.');
   restore(engine,listing);
   listing.status='cancelled';
   db.bazarUsdcListings=db.bazarUsdcListings.filter(l=>l.id!==listing.id);
   return {cancelled:listing.id};
  });
 }
 function reserve(db,user,engine,id){
  return serial(()=>{
   assertOn();ensure(db);releaseExpired(db);
   const buyerWallet=payoutOf(user);
   const listing=db.bazarUsdcListings.find(l=>l.id===id);
   if(!listing||(listing.status!=='open'&&listing.status!=='reserved'))throw Error('Esse anúncio já foi removido ou comprado.');
   if(listing.sellerId===user.id||buyerWallet===listing.payoutWallet)throw Error('Você não pode comprar seu próprio anúncio.');
   if(listing.mint!==config.mint||listing.cluster!==config.cluster)throw Error('Este anúncio foi feito em outra rede. O vendedor precisa cancelar e anunciar de novo.');
   if(listing.developerWallet!==config.developerWallet)throw Error('A taxa deste anúncio não aponta para a carteira do jogo.');
   const sellerAta=ata(listing.payoutWallet),developerAta=ata(config.developerWallet);
   if(sellerAta!==listing.payoutAta||developerAta!==listing.developerAta)throw Error('Destinatário inconsistente. O anúncio precisa ser refeito.');
   const existing=db.bazarUsdcOrders.find(o=>o.listingId===listing.id&&o.buyerId===user.id&&(o.status==='pending'||o.status==='paid-waiting-space')&&listing.orderId===o.id);
   if(existing)return presentOrder(existing,listing);
   if(listing.status!=='open'||listing.orderId)throw Error('Outro jogador já reservou este anúncio.');
   if(!canReceive(engine,listing))throw Error(spaceError(listing));
   const at=now();
   const order={
    id:crypto.randomUUID(),listingId:listing.id,escrowId:listing.escrowId,buyerId:user.id,sellerId:listing.sellerId,
    status:'pending',paymentSeen:false,signature:null,signatureSeen:null,
    reference:referenceKey(),
    priceMicro:listing.priceMicro,sellerMicro:listing.sellerMicro,feeMicro:listing.feeMicro,
    sellerWallet:listing.payoutWallet,sellerAta,developerWallet:config.developerWallet,developerAta,
    payer:buyerWallet,payerAta:ata(buyerWallet),
    mint:config.mint,cluster:config.cluster,createdAt:at,expiresAt:at+config.orderTtlMs,
   };
   listing.status='reserved';listing.orderId=order.id;listing.buyerId=user.id;
   db.bazarUsdcOrders.push(order);
   return presentOrder(order,listing);
  });
 }
 function holding(db,order,listing){
  if(!listing)return false;
  if(listing.orderId===order.id&&(listing.status==='reserved'||listing.status==='open'))return true;
  return listing.status==='open'&&!listing.orderId&&listing.escrowId===order.escrowId;
 }
 async function confirmNow(db,user,engine,{orderId,signature}){
  assertOn();ensure(db);
  if(typeof signature!=='string'||!/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(signature))throw Error('Assinatura da transação inválida.');
  const order=db.bazarUsdcOrders.find(o=>o.id===orderId&&o.buyerId===user.id);
  if(!order)throw Error('Pedido não encontrado.');
  if(order.status==='completed'&&order.signature===signature)return {ok:true,persist:false,already:true,delivery:order.delivery,sellerId:order.sellerId};
  if(order.status==='paid-unfulfilled')return {ok:false,persist:false,error:order.reason};
  if(db.bazarUsdcSignatures.includes(signature))throw Error('Esta transação já foi usada em outro pedido.');
  const listing=db.bazarUsdcListings.find(l=>l.id===order.listingId);
  let tx;
  try{tx=await getTx(config.rpc,signature);}
  catch{throw Error('A rede Solana não respondeu. Nenhum item foi entregue; a reserva continua.');}
  const expect={
   reference:order.reference,mint:order.mint,decimals:config.decimals,priceMicro:order.priceMicro,
   sellerMicro:order.sellerMicro,feeMicro:order.feeMicro,sellerAta:order.sellerAta,developerAta:order.developerAta,
   sellerWallet:order.sellerWallet,developerWallet:order.developerWallet,payer:order.payer,payerAta:order.payerAta,
  };
  const check=verifySplit(tx,expect);
  if(!check.ok)throw Error(check.reason);
  order.paymentSeen=true;order.signatureSeen=signature;order.slot=check.slot;
  if(!holding(db,order,listing)){
   order.status='paid-unfulfilled';
   order.reason='O USDC foi reconhecido, mas o item já não estava reservado para este pedido. Nada foi entregue outra vez e não há reembolso automático, porque o jogo não tem custódia.';
   order.signature=signature;
   db.bazarUsdcSignatures.push(signature);
   return {ok:false,persist:true,error:order.reason,sellerId:order.sellerId};
  }
  if(!canReceive(engine,listing)){
   order.status='paid-waiting-space';
   if(listing.status==='open'){listing.status='reserved';listing.orderId=order.id;listing.buyerId=user.id;}
   return {ok:false,persist:true,error:spaceError(listing)+' O pagamento já foi visto. Libere espaço e confirme de novo com a mesma transação. Nada foi entregue ainda.',sellerId:order.sellerId};
  }
  if(listing.status==='open'){listing.status='reserved';listing.orderId=order.id;listing.buyerId=user.id;}
  const delivery=give(engine,listing);
  listing.status='completed';
  order.status='completed';order.signature=signature;order.completedAt=now();order.delivery=delivery;
  db.bazarUsdcSignatures.push(signature);
  db.bazarUsdcListings=db.bazarUsdcListings.filter(l=>l.id!==listing.id);
  return {ok:true,persist:true,already:false,delivered:true,delivery,sellerId:order.sellerId};
 }
 function confirm(db,user,engine,input){return serial(()=>confirmNow(db,user,engine,input));}
 const rpcMethods=new Set(['getLatestBlockhash','getAccountInfo','getFeeForMessage','sendTransaction','getSignatureStatuses']);
 function rpcDenied(status,error){return {status,body:{error}};}
 function publicRpcError(message){
  const text=typeof message==='string'?message.trim():'';
  if(!text||text.length>300||/access forbidden|failed to fetch|networkerror|load failed|\b403\b|api\.mainnet|api\.devnet|solana\.com|https?:\/\//i.test(text)||(config.rpc&&text.includes(config.rpc)))return RPC_FAIL;
  return text;
 }
 async function proxyRpc(payload){
  const raw=JSON.stringify(payload??null);
  if(Buffer.byteLength(raw)>8192)return rpcDenied(413,'A consulta à rede Solana é grande demais.');
  if(!config.enabled)return rpcDenied(503,OFF);
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return rpcDenied(400,'Consulta inválida.');
  if(!rpcMethods.has(payload.method))return rpcDenied(400,'Essa consulta à rede Solana não é permitida.');
  if(payload.params!==undefined&&(!Array.isArray(payload.params)||payload.params.length>3))return rpcDenied(400,'Consulta inválida.');
  const id=typeof payload.id==='string'||typeof payload.id==='number'?payload.id:1;
  let res,body;
  try{
   res=await fetchImpl(config.rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id,method:payload.method,params:payload.params??[]})});
   if(!res||typeof res.text!=='function')throw Error('sem corpo');
   const text=await res.text();
   if(typeof text!=='string'||Buffer.byteLength(text)>262144)throw Error('resposta grande');
   body=JSON.parse(text);
  }catch{return rpcDenied(502,RPC_FAIL);}
  if(!res.ok||!body||typeof body!=='object'||Array.isArray(body))return rpcDenied(502,RPC_FAIL);
  if(body.error)return {status:200,body:{jsonrpc:'2.0',id,error:{code:Number.isInteger(body.error.code)?body.error.code:-32000,message:publicRpcError(body.error.message)}}};
  if(!Object.prototype.hasOwnProperty.call(body,'result'))return rpcDenied(502,RPC_FAIL);
  return {status:200,body:{jsonrpc:'2.0',id,result:body.result}};
 }
 return {config,publicConfig,view,quote,list,cancel,reserve,confirm,proxyRpc,releaseExpired:db=>serial(()=>{ensure(db);releaseExpired(db);})};
}
module.exports={createBazarUsdcService,OFF};
