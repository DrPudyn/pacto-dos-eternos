const crypto=require('crypto');
const bs58=require('./bs58.cjs');
const {isWalletAddress}=require('./solana-auth.cjs');
const {associatedTokenAddress}=require('./solana-pubkey.cjs');
const {rpcCall}=require('./solana-rpc.cjs');
const {buildBazarPayment,messageBytes,partialBazarWire}=require('./solana-tx-build.cjs');
const equipment=require('./equipment-rules.cjs');
const marketRules=require('./market-rules.cjs');
const {load,parsePriceUsdc}=require('./bazar-usdc-config.cjs');
const {verifySplit}=require('./bazar-usdc-verify.cjs');
const OFF='O bazar em USDC entre jogadores está desligado até a aprovação do dono.';
const RPC_FAIL='A rede Solana não respondeu. Tente novamente em instantes.';
// O banco do jogo e a Solana não são uma transação só. A entrega observa a transação
// finalizada e depois grava o banco. Até essa gravação o item segue reservado; um
// reinício se acerta confirmando de novo. Não há custódia, reembolso nem programa
// on-chain. O servidor assina só a referência, descarta a chave e não envia a transação.
// Só a mensagem exata que ele autorizou compra o item. O relógio do processo não libera
// a reserva. Liberar exige, juntos: altura finalizada maior que lastValidBlockHeight,
// isBlockhashValid falso nessa mesma finalização, e nenhuma transação finalizada da
// referência que seja essa mensagem. Resposta ausente, truncada, não finalizada ou
// discordante mantém o bloqueio. Confiar no que o RPC chama de finalized é um limite
// real. Um processo só serializa os pedidos. Encher o índice da referência pode segurar
// o item; não o vende duas vezes.
const LIVE='O bloco desta reserva ainda pode receber a transação. O item continua reservado.';
const UNKNOWN='A rede Solana não comprovou que esta reserva expirou sem pagamento. O item continua reservado.';
const PAID='O pagamento desta reserva foi finalizado na rede. O item continua reservado para o comprador.';
function createBazarUsdcService(options={}){
 const config=options.config??load(options);
 const fetchImpl=options.fetch??globalThis.fetch;
 const getTx=options.getTransaction??(async(rpc,sig)=>rpcCall(rpc,'getTransaction',[sig,{encoding:'base64',commitment:'finalized',maxSupportedTransactionVersion:0}],fetchImpl));
 const now=options.now??(()=>Date.now());
 const chain=options.chain??{
  async latestBlockhash(){
   const result=await rpcCall(config.rpc,'getLatestBlockhash',[{commitment:'finalized'}],fetchImpl);
   const value=result?.value;
   if(!value||typeof value.blockhash!=='string'||!Number.isSafeInteger(value.lastValidBlockHeight)||value.lastValidBlockHeight<0)throw Error(RPC_FAIL);
   let bytes;try{bytes=bs58.decode(value.blockhash);}catch{throw Error(RPC_FAIL);}
   if(bytes.length!==32)throw Error(RPC_FAIL);
   return {blockhash:value.blockhash,lastValidBlockHeight:value.lastValidBlockHeight};
  },
  async finalizedHeight(){
   const height=await rpcCall(config.rpc,'getBlockHeight',[{commitment:'finalized'}],fetchImpl);
   if(!Number.isSafeInteger(height)||height<0)throw Error(RPC_FAIL);
   return height;
  },
  async blockhashValid(blockhash){
   const result=await rpcCall(config.rpc,'isBlockhashValid',[blockhash,{commitment:'finalized'}],fetchImpl);
   if(typeof result?.value!=='boolean')throw Error(RPC_FAIL);
   return result.value;
  },
  async signatures(address){
   const rows=await rpcCall(config.rpc,'getSignaturesForAddress',[address,{commitment:'finalized',limit:1000}],fetchImpl);
   if(!Array.isArray(rows))throw Error(RPC_FAIL);
   if(rows.length>=1000)return {truncated:true,signatures:[]};
   if(rows.some(row=>!row||typeof row.signature!=='string'))throw Error(RPC_FAIL);
   return {truncated:false,signatures:rows.map(row=>row.signature)};
  },
  async transaction(signature){return adapt(await getTx(config.rpc,signature));},
 };
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
 function sameBytes(left,right){
  if(!left||!right||left.length!==right.length)return false;
  return crypto.timingSafeEqual(left,right);
 }
 function adapt(raw){
  if(!raw)return null;
  const err=raw.meta?.err??raw.err??null;
  const status=raw.confirmationStatus;
  const finalized=raw.finalized!==false&&status!=='confirmed'&&status!=='processed';
  let message=null,buyerSigned=true,referenceSigned=true,referenceSignature=null;
  if(typeof raw.messageBase64==='string')message=Buffer.from(raw.messageBase64,'base64');
  else if(Array.isArray(raw.transaction)&&typeof raw.transaction[0]==='string'){
   const wire=Buffer.from(raw.transaction[0],'base64');
   message=messageBytes(wire);
   buyerSigned=wire.length>=65&&!wire.subarray(1,65).every(byte=>byte===0);
   referenceSigned=wire.length>=129&&wire[0]===2&&!wire.subarray(65,129).every(byte=>byte===0);
   if(referenceSigned)referenceSignature=wire.subarray(65,129);
  }
  const parsed=raw.transaction&&!Array.isArray(raw.transaction)&&raw.transaction.message?raw:null;
  return {slot:raw.slot??null,err,finalized,message,buyerSigned,referenceSigned,referenceSignature,parsed};
 }
 function classify(tx,order){
  if(!tx)return 'missing';
  if(tx.finalized===false)return 'pending';
  if(!tx.buyerSigned||!tx.referenceSigned||!tx.message||!order.message)return 'unreadable';
  let expected;try{expected=Buffer.from(order.message,'base64');}catch{return 'unreadable';}
  if(!sameBytes(tx.message,expected))return 'other';
  if(tx.referenceSignature&&order.referenceSignature){
   let authorized;try{authorized=Buffer.from(order.referenceSignature,'base64');}catch{return 'unreadable';}
   if(!sameBytes(tx.referenceSignature,authorized))return 'other';
  }
  if(tx.err)return 'failed';
  return 'paid';
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
 function releaseExpired(){
  // O relógio do processo não libera anúncio. Só uma prova finalizada da rede pode.
 }
 async function prove(order){
  let height,valid,found;
  try{
   height=await chain.finalizedHeight();
   valid=await chain.blockhashValid(order.blockhash);
   found=await chain.signatures(order.reference);
  }catch{return {status:'unknown',error:UNKNOWN};}
  if(!Number.isSafeInteger(height)||typeof valid!=='boolean'||!found||found.truncated||!Array.isArray(found.signatures))return {status:'unknown',error:UNKNOWN};
  for(const sig of found.signatures){
   let tx;try{tx=await chain.transaction(sig);}catch{return {status:'unknown',error:UNKNOWN};}
   const kind=classify(tx,order);
   if(kind==='paid')return {status:'paid',signature:sig,error:PAID};
   // A assinatura está no índice, mas a transação não pôde ser lida ou ainda não é final.
   if(kind==='missing'||kind==='pending'||kind==='unreadable')return {status:'unknown',error:UNKNOWN};
  }
  if(order.signaturePending&&!found.signatures.includes(order.signaturePending)){
   let tx;try{tx=await chain.transaction(order.signaturePending);}catch{return {status:'unknown',error:UNKNOWN};}
   const kind=classify(tx,order);
   if(kind==='paid')return {status:'paid',signature:order.signaturePending,error:PAID};
   if(kind==='pending'||kind==='unreadable')return {status:'unknown',error:UNKNOWN};
  }
  const expired=height>order.lastValidBlockHeight&&valid===false;
  const live=height<=order.lastValidBlockHeight&&valid===true;
  if(expired)return {status:'clear'};
  if(live)return {status:'live',error:LIVE};
  return {status:'unknown',error:UNKNOWN};
 }
 async function authorize(buyerWallet,listing){
  let block;try{block=await chain.latestBlockhash();}catch{throw Error('A rede Solana não respondeu. Nenhum anúncio foi reservado.');}
  const pair=crypto.generateKeyPairSync('ed25519');
  const reference=bs58.encode(pair.publicKey.export({type:'spki',format:'der'}).subarray(-32));
  const sellerAta=ata(listing.payoutWallet),developerAta=ata(config.developerWallet),payerAta=ata(buyerWallet);
  const wire=buildBazarPayment({
   payer:buyerWallet,sellerWallet:listing.payoutWallet,developerWallet:config.developerWallet,
   sellerAta,developerAta,payerAta,mint:config.mint,sellerMicro:listing.sellerMicro,feeMicro:listing.feeMicro,
   reference,blockhash:block.blockhash,
  });
  const message=messageBytes(wire);
  const signature=crypto.sign(null,message,pair.privateKey);
  if(signature.length!==64||!crypto.verify(null,message,pair.publicKey,signature))throw Error('Não foi possível autorizar a reserva.');
  return {
   reference,referenceSignature:signature.toString('base64'),message:Buffer.from(message).toString('base64'),
   blockhash:block.blockhash,lastValidBlockHeight:block.lastValidBlockHeight,sellerAta,developerAta,payer:buyerWallet,payerAta,
  };
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
   mint:order.mint,decimals:config.decimals,cluster:order.cluster,
   blockhash:order.blockhash,lastValidBlockHeight:order.lastValidBlockHeight,
   transaction:partialBazarWire(order.message,order.referenceSignature).toString('base64'),
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
   ensure(db);
   const listings=config.enabled?db.bazarUsdcListings.filter(l=>l.status==='open'||l.status==='reserved').map(l=>publicListing(l,user,nameOf)):[];
   return {enabled:config.enabled,feeBps:config.feeBps,sellerBps:config.sellerBps,decimals:config.decimals,minMicro:config.minMicro,developerWallet:config.enabled?config.developerWallet:null,mint:config.enabled?config.mint:null,cluster:config.enabled?config.cluster:null,listings};
  });
 }
 function quote(raw){assertOn();const split=parsePriceUsdc(raw);return {...split,developerWallet:config.developerWallet,decimals:config.decimals,mint:config.mint,cluster:config.cluster};}
 function list(db,user,engine,input){
  return serial(()=>{
   assertOn();ensure(db);
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
  return serial(async()=>{
   assertOn();ensure(db);
   const listing=db.bazarUsdcListings.find(l=>l.id===id);
   if(!listing)throw Error('Esse anúncio já foi removido ou comprado.');
   if(listing.sellerId!==user.id)throw Error('Você só pode cancelar seu anúncio.');
   if(listing.status==='open'&&!listing.orderId){
    restore(engine,listing);
    listing.status='cancelled';
    db.bazarUsdcListings=db.bazarUsdcListings.filter(l=>l.id!==listing.id);
    return {ok:true,persist:true,cancelled:listing.id};
   }
   const order=db.bazarUsdcOrders.find(o=>o.id===listing.orderId&&o.listingId===listing.id);
   if(!order)return {ok:false,persist:false,error:'A reserva deste anúncio está inconsistente. O item continua bloqueado.'};
   if(order.paymentSeen||order.status==='paid-waiting-space'||order.status==='completed'){
    return {ok:false,persist:false,deliver:!!order.signatureSeen&&order.status!=='completed',buyerId:order.buyerId,orderId:order.id,signature:order.signatureSeen,sellerId:order.sellerId,error:'O pagamento deste comprador já foi finalizado. O item continua reservado para ele. Não há cancelamento nem segunda venda.'};
   }
   const proof=await prove(order);
   if(proof.status==='paid'){
    order.paymentSeen=true;order.signatureSeen=proof.signature;
    return {ok:false,persist:true,deliver:true,buyerId:order.buyerId,orderId:order.id,signature:proof.signature,sellerId:order.sellerId,error:proof.error};
   }
   if(proof.status!=='clear'){order.cancelRequested=true;return {ok:false,persist:true,error:proof.error};}
   order.status='closed';order.closedReason='blockhash-expired-without-payment';
   restore(engine,listing);
   listing.status='cancelled';
   db.bazarUsdcListings=db.bazarUsdcListings.filter(l=>l.id!==listing.id);
   return {ok:true,persist:true,cancelled:listing.id};
  });
 }
 function reserve(db,user,engine,id){
  return serial(async()=>{
   assertOn();ensure(db);
   const buyerWallet=payoutOf(user);
   const listing=db.bazarUsdcListings.find(l=>l.id===id);
   if(!listing||(listing.status!=='open'&&listing.status!=='reserved'))throw Error('Esse anúncio já foi removido ou comprado.');
   if(listing.sellerId===user.id||buyerWallet===listing.payoutWallet)throw Error('Você não pode comprar seu próprio anúncio.');
   if(listing.mint!==config.mint||listing.cluster!==config.cluster)throw Error('Este anúncio foi feito em outra rede. O vendedor precisa cancelar e anunciar de novo.');
   if(listing.developerWallet!==config.developerWallet)throw Error('A taxa deste anúncio não aponta para a carteira do jogo.');
   const sellerAta=ata(listing.payoutWallet),developerAta=ata(config.developerWallet);
   if(sellerAta!==listing.payoutAta||developerAta!==listing.developerAta)throw Error('Destinatário inconsistente. O anúncio precisa ser refeito.');
   const existing=db.bazarUsdcOrders.find(o=>o.listingId===listing.id&&o.buyerId===user.id&&(o.status==='pending'||o.status==='paid-waiting-space'||o.status==='payment-held')&&listing.orderId===o.id);
   if(existing){
    if(existing.paymentSeen||existing.status==='paid-waiting-space')return presentOrder(existing,listing);
    const proof=await prove(existing);
    if(proof.status==='paid'){existing.paymentSeen=true;existing.signatureSeen=proof.signature;return presentOrder(existing,listing);}
    if(proof.status==='clear'&&existing.cancelRequested)throw Error('O vendedor pediu o cancelamento e a rede comprovou que não houve pagamento. O item volta ao vendedor quando o cancelamento for concluído.');
    if(proof.status!=='clear')return presentOrder(existing,listing);
    Object.assign(existing,await authorize(buyerWallet,listing),{signaturePending:null});
    return presentOrder(existing,listing);
   }
   if(listing.status!=='open'||listing.orderId)throw Error('Outro jogador já reservou este anúncio.');
   if(!canReceive(engine,listing))throw Error(spaceError(listing));
   const authorized=await authorize(buyerWallet,listing);
   const order={
    id:crypto.randomUUID(),listingId:listing.id,escrowId:listing.escrowId,buyerId:user.id,sellerId:listing.sellerId,
    status:'pending',paymentSeen:false,signature:null,signatureSeen:null,signaturePending:null,cancelRequested:false,
    priceMicro:listing.priceMicro,sellerMicro:listing.sellerMicro,feeMicro:listing.feeMicro,
    sellerWallet:listing.payoutWallet,developerWallet:config.developerWallet,
    mint:config.mint,cluster:config.cluster,createdAt:now(),...authorized,
   };
   listing.status='reserved';listing.orderId=order.id;listing.buyerId=user.id;
   db.bazarUsdcOrders.push(order);
   return presentOrder(order,listing);
  });
 }
 function bind(listing,order){
  if(!listing||listing.escrowId!==order.escrowId)return false;
  if(listing.status!=='reserved'&&listing.status!=='open')return false;
  if(listing.orderId&&listing.orderId!==order.id)return false;
  listing.status='reserved';listing.orderId=order.id;listing.buyerId=order.buyerId;
  return true;
 }
 async function confirmNow(db,user,engine,{orderId,signature}){
  assertOn();ensure(db);
  if(typeof signature!=='string'||!/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(signature))throw Error('Assinatura da transação inválida.');
  const order=db.bazarUsdcOrders.find(o=>o.id===orderId&&o.buyerId===user.id);
  if(!order)throw Error('Pedido não encontrado.');
  if(order.status==='completed'&&order.signature===signature)return {ok:true,persist:false,already:true,delivery:order.delivery,sellerId:order.sellerId};
  if(order.status==='completed')throw Error('Este pedido já foi concluído.');
  if(db.bazarUsdcSignatures.includes(signature)||db.bazarUsdcOrders.some(o=>o.id!==order.id&&(o.signature===signature||o.signatureSeen===signature||o.signaturePending===signature)))throw Error('Esta transação já foi usada em outro pedido.');
  let tx;
  try{tx=await chain.transaction(signature);}
  catch{throw Error('A rede Solana não respondeu. Nenhum item foi entregue; a reserva continua.');}
  if(!tx||tx.finalized===false){
   order.signaturePending=signature;
   return {ok:false,persist:true,error:'A transação ainda não foi finalizada na rede. O item continua reservado para este pedido. Confirme de novo depois da finalização. Nada foi entregue.',sellerId:order.sellerId};
  }
  const kind=classify(tx,order);
  if(kind!=='paid'){
   if(order.status==='closed')return {ok:false,persist:false,error:'Este pedido já foi encerrado sem pagamento finalizado. Nada foi entregue.',sellerId:order.sellerId};
   if(kind==='failed')throw Error('A transação falhou na rede. Nada foi entregue e a reserva continua.');
   throw Error(kind==='missing'?'Transação não encontrada. Nada foi entregue e a reserva continua.':'Esta transação não é a autorizada para este pedido. Nada foi entregue e a reserva continua.');
  }
  if(tx.parsed){
   const check=verifySplit(tx.parsed,{
    reference:order.reference,mint:order.mint,decimals:config.decimals,priceMicro:order.priceMicro,
    sellerMicro:order.sellerMicro,feeMicro:order.feeMicro,sellerAta:order.sellerAta,developerAta:order.developerAta,
    sellerWallet:order.sellerWallet,developerWallet:order.developerWallet,payer:order.payer,payerAta:order.payerAta,
   });
   if(!check.ok)throw Error(check.reason+' Nada foi entregue e a reserva continua.');
  }
  order.paymentSeen=true;order.signatureSeen=signature;order.slot=tx.slot??null;
  const listing=db.bazarUsdcListings.find(l=>l.id===order.listingId);
  if(!bind(listing,order)){
   order.status='payment-held';
   return {ok:false,persist:true,error:'O pagamento foi finalizado, mas o item não está mais reservado só para este pedido. Nada foi entregue outra vez e a assinatura não autoriza uma segunda venda. Não há reembolso automático, porque o jogo não tem custódia.',sellerId:order.sellerId};
  }
  if(!canReceive(engine,listing)){
   order.status='paid-waiting-space';
   return {ok:false,persist:true,error:spaceError(listing)+' O pagamento já foi finalizado. Libere espaço e confirme de novo com a mesma transação. O item continua reservado e nada foi entregue ainda.',sellerId:order.sellerId};
  }
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
