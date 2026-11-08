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
  return {orderId:order.id,reference:order.reference,amountMicro:order.amountMicro,amountUsd,quantity:order.quantity,product:order.product,productLabel:meta.label,paymentMint:order.paymentMint,receiver:config.receiver,destinationAta:order.destinationAta,sourceAta:order.sourceAta,decimals:config.decimals,expiresAt:order.expiresAt,cluster:config.cluster};
 }
 const rpcMethods=new Set(['getLatestBlockhash','getAccountInfo','getTokenAccountsByOwner','sendTransaction','getSignatureStatuses']);
 const rpcFail='A rede Solana não respondeu. Tente novamente em instantes.';
 function rpcDenied(status,error){return {status,body:{error}};}
 function publicRpcError(message){
  const text=typeof message==='string'?message.trim():'';
  if(!text||text.length>300||/access forbidden|failed to fetch|networkerror|load failed|\b403\b|api\.mainnet|api\.devnet|solana\.com|https?:\/\//i.test(text)||(config.rpc&&text.includes(config.rpc)))return rpcFail;
  return text;
 }
 async function proxyRpc(payload){
  const raw=JSON.stringify(payload??null);
  if(Buffer.byteLength(raw)>8192)return rpcDenied(413,'A consulta à rede Solana é grande demais.');
  if(!config.enabled||!config.rpc)return rpcDenied(503,'Loja em breve.');
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
  }catch{return rpcDenied(502,rpcFail);}
  if(!res.ok||!body||typeof body!=='object'||Array.isArray(body))return rpcDenied(502,rpcFail);
  if(body.error)return {status:200,body:{jsonrpc:'2.0',id,error:{code:Number.isInteger(body.error.code)?body.error.code:-32000,message:publicRpcError(body.error.message)}}};
  if(!Object.prototype.hasOwnProperty.call(body,'result'))return rpcDenied(502,rpcFail);
  return {status:200,body:{jsonrpc:'2.0',id,result:body.result}};
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
 return {config,publicView,createOrder,confirmOrder,pruneOrders,proxyRpc};
}
module.exports={createLojaService};
