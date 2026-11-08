const crypto=require('crypto');
const {load,amountMicro}=require('./loja-config.cjs');
const {associatedTokenAddress}=require('./solana-pubkey.cjs');
const {getTransaction}=require('./solana-rpc.cjs');
const {verifyPayment}=require('./loja-tx-verify.cjs');
const {grantWelcomePack}=require('./loja-grants.cjs');
const equipment=require('./equipment-rules.cjs');
const bs58=require('./bs58.cjs');
function createLojaService(options={}){
 const config=options.config??load(options);
 const fetchImpl=options.fetch??globalThis.fetch;
 const getTx=options.getTransaction??((rpc,sig)=>getTransaction(rpc,sig,fetchImpl));
 const now=options.now??(()=>Date.now());
 function purchases(user){return user.lojaPurchases??(user.lojaPurchases={});}
 function publicView(user){
  const products=Object.fromEntries(Object.entries(config.products).map(([k,v])=>{
   const row={id:v.id,label:v.label,subtitle:v.subtitle??null,priceUsd:v.priceUsd,min:v.min,max:v.max,fixedQuantity:v.fixedQuantity??null,highlight:!!v.highlight,badge:v.badge??null};
   if(v.id==='welcome'){
    const bought=purchases(user).welcome??0;
    row.purchaseLimit=v.purchaseLimit??1;
    row.purchased=bought;
    row.available=bought<(v.purchaseLimit??1);
   }
   return [k,row];
  }));
  return {
   enabled:config.enabled,
   soon:!config.enabled,
   cluster:config.cluster,
   rpc:config.enabled?config.rpc:null,
   receiver:config.receiver,
   decimals:config.decimals,
   mints:config.mints,
   paymentOptions:config.paymentOptions,
   welcomeDiscount:config.welcomeDiscount,
   products,
  };
 }
 function ensureDb(db){db.lojaOrders??=[];db.lojaUsedSignatures??=[];}
 function pruneOrders(db,at=now()){
  db.lojaOrders=db.lojaOrders.filter(o=>o.status==='completed'||o.expiresAt>at-86400000);
 }
 function assertWelcomeAvailable(user){
  const meta=config.products.welcome;
  const bought=purchases(user).welcome??0;
  if(bought>=(meta.purchaseLimit??1))throw Error('Este pacote já foi comprado nesta conta.');
 }
 function createOrder(db,user,{product,quantity,paymentMint}){
  ensureDb(db);
  if(!config.enabled)throw Error('Loja em breve.');
  const meta=config.products[product];
  if(!meta)throw Error('Produto inválido.');
  if(!user.walletAddress)throw Error('Conecte sua carteira Solana para comprar na loja.');
  if(product==='welcome')assertWelcomeAvailable(user);
  if(paymentMint!==config.mints.usdc)throw Error('A loja aceita apenas USDC.');
  const qty=meta.fixedQuantity??quantity;
  const micro=amountMicro(product,qty,config);
  const at=now();
  const open=db.lojaOrders.find(o=>o.userId===user.id&&o.status==='pending'&&o.product===product&&o.quantity===qty&&o.paymentMint===paymentMint&&o.amountMicro===micro&&o.expiresAt>at);
  if(open)return presentOrder(open,meta,config);
  const referenceKeypair=crypto.generateKeyPairSync('ed25519');
  const referenceBytes=referenceKeypair.publicKey.export({type:'spki',format:'der'}).subarray(-32);
  const reference=bs58.encode(referenceBytes);
  const id=crypto.randomUUID();
  const destinationAta=associatedTokenAddress(config.receiver,paymentMint);
  const sourceAta=associatedTokenAddress(user.walletAddress,paymentMint);
  const order={id,userId:user.id,product,quantity:qty,paymentMint,amountMicro:micro,reference,destinationAta,sourceAta,payer:user.walletAddress,payerAta:sourceAta,status:'pending',signature:null,createdAt:at,expiresAt:at+config.orderTtlMs};
  db.lojaOrders.push(order);
  return presentOrder(order,meta,config);
 }
 function presentOrder(order,meta,config){
  const amountUsd=meta.priceUsd*(meta.fixedQuantity??order.quantity);
  return {orderId:order.id,reference:order.reference,amountMicro:order.amountMicro,amountUsd,quantity:order.quantity,product:order.product,productLabel:meta.label,paymentMint:order.paymentMint,receiver:config.receiver,destinationAta:order.destinationAta,sourceAta:order.sourceAta,decimals:config.decimals,expiresAt:order.expiresAt,cluster:config.cluster,rpc:config.rpc};
 }
 async function fulfill(db,user,engine,order){
  const product=config.products[order.product];
  const player=engine.player;
  if(product.currencyField==='mintCards'){
   if(!Number.isSafeInteger(player.mintCards))player.mintCards=0;
   if(player.mintCards+order.quantity>20000)throw Error('Limite de selos no inventário.');
   player.mintCards+=order.quantity;
   return {product:order.product,quantity:order.quantity,label:product.label,revelation:null};
  }
  if(product.currencyField==='weaponSummons'){
   if(!Number.isSafeInteger(player.weaponSummons))player.weaponSummons=0;
   if(player.weaponSummons+order.quantity>20000)throw Error('Limite de baús no inventário.');
   player.weaponSummons+=order.quantity;
   return {product:order.product,quantity:order.quantity,label:product.label,revelation:null};
  }
  if(product.currencyField==='bundle'){
   assertWelcomeAvailable(user);
   const revelation=await grantWelcomePack(engine);
   purchases(user).welcome=(purchases(user).welcome??0)+1;
   return {product:order.product,quantity:1,label:product.label,revelation};
  }
  throw Error('Produto não configurado.');
 }
 let confirmChain=Promise.resolve();
 function confirmOrder(db,user,engine,input){
  const run=confirmChain.then(()=>confirmOrderNow(db,user,engine,input));
  confirmChain=run.then(()=>{},()=>{});
  return run;
 }
 async function confirmOrderNow(db,user,engine,{orderId,signature}){
  ensureDb(db);
  pruneOrders(db);
  if(!config.enabled)throw Error('Loja indisponível.');
  if(typeof signature!=='string'||!/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(signature))throw Error('Assinatura da transação inválida.');
  const order=db.lojaOrders.find(o=>o.id===orderId&&o.userId===user.id);
  if(!order)throw Error('Pedido não encontrado.');
  if(order.status==='completed'&&order.signature===signature)return {already:true,order,granted:order.grantSnapshot};
  if(db.lojaUsedSignatures.includes(signature))throw Error('Esta transação já foi usada em outro pedido.');
  if(order.status!=='pending')throw Error('Pedido já encerrado.');
  if(order.expiresAt<=now()){order.status='expired';throw Error('Pedido expirado. Crie um novo pedido.');}
  if(order.paymentMint!==config.mints.usdc)throw Error('A loja aceita apenas USDC.');
  if(order.product==='welcome')assertWelcomeAvailable(user);
  let tx;
  try{tx=await getTx(config.rpc,signature);}
  catch{throw Error('A rede Solana não respondeu. Nenhum item foi entregue; o pedido continua aberto.');}
  const check=verifyPayment(tx,{reference:order.reference,mint:order.paymentMint,amountMicro:order.amountMicro,decimals:config.decimals,destinationAta:order.destinationAta,payer:order.payer,payerAta:order.payerAta||order.sourceAta});
  if(!check.ok)throw Error(check.reason);
  const granted=await fulfill(db,user,engine,order);
  order.status='completed';
  order.signature=signature;
  order.completedAt=now();
  order.slot=check.slot;
  order.grantSnapshot=granted;
  db.lojaUsedSignatures.push(signature);
  engine.syncEquipment?.();
  if(granted.revelation?.weapons)equipment.reconcile(engine.player);
  return {already:false,order,granted};
 }
 return {config,publicView,createOrder,confirmOrder,pruneOrders};
}
module.exports={createLojaService};
