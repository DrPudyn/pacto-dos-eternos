const {decodeAddress}=require('./solana-pubkey.cjs');
const bs58=require('./bs58.cjs');
function accountKeys(tx){
 const message=tx?.transaction?.message;
 if(!message) return [];
 const keys=message.accountKeys||[];
 return keys.map(k=> (typeof k==='string'?k:k.pubkey));
}
function referencesPresent(keys,reference){
 if(!reference)return false;
 const want=reference.trim();
 return keys.some(k=>k===want);
}
function parsedTransfers(tx){
 const out=[];
 const instructions=tx?.transaction?.message?.instructions||[];
 const inner=tx?.meta?.innerInstructions||[];
 const all=[...instructions];
 for(const group of inner)all.push(...(group.instructions||[]));
 for(const ix of all){
  const parsed=ix.parsed;
  if(!parsed)continue;
  const type=parsed.type;
  const info=parsed.info||{};
  if(type==='transferChecked'){
   out.push({kind:'transferChecked',source:info.source,destination:info.destination,mint:info.mint,amount:info.tokenAmount?.amount??info.amount,decimals:info.tokenAmount?.decimals??info.decimals,authority:info.authority});
  }else if(type==='transfer'&&info.mint){
   out.push({kind:'transfer',source:info.source,destination:info.destination,mint:info.mint,amount:info.tokenAmount?.amount??info.amount,decimals:info.tokenAmount?.decimals,authority:info.authority??info.owner});
  }
 }
 const pre=tx?.meta?.preTokenBalances||[];
 const post=tx?.meta?.postTokenBalances||[];
 if(!out.length&&pre.length&&post.length){
  for(const after of post){
   const before=pre.find(b=>b.accountIndex===after.accountIndex&&b.mint===after.mint);
   const delta=Number(after.uiTokenAmount?.amount??0)-Number(before?.uiTokenAmount?.amount??0);
   if(delta>0)out.push({kind:'balance',destination:after.owner,mint:after.mint,amount:String(delta),decimals:after.uiTokenAmount?.decimals});
  }
 }
 return out;
}
function verifyPayment(tx,expect){
 if(!tx) return {ok:false,reason:'Transação não encontrada.'};
 if(tx.meta?.err) return {ok:false,reason:'A transação falhou na rede.'};
 const keys=accountKeys(tx);
 if(!referencesPresent(keys,expect.reference)) return {ok:false,reason:'Referência do pedido não encontrada na transação.'};
 const transfers=parsedTransfers(tx).filter(row=>row.mint===expect.mint);
 const match=transfers.find(row=>{
  const amount=String(row.amount??'');
  if(amount!==String(expect.amountMicro))return false;
  if(row.decimals!==undefined&&row.decimals!==expect.decimals)return false;
  if(expect.destinationAta&&row.destination&&row.destination!==expect.destinationAta)return false;
  return true;
 });
 if(!match){
  const totalToMerchant=transfers.filter(t=>t.mint===expect.mint&&String(t.amount)===String(expect.amountMicro));
  if(!totalToMerchant.length)return {ok:false,reason:'Valor ou token incorreto.'};
 }
 if(expect.payer&&tx.transaction?.message?.accountKeys){
  const signers=tx.transaction.message.accountKeys.filter((k,i)=>typeof k==='object'?k.signer:tx.transaction.message.header?.numRequiredSignatures>i);
  const payerList=signers.map(k=>typeof k==='string'?k:k.pubkey);
  if(payerList.length&&!payerList.includes(expect.payer)&&expect.payerAta){
   const ok=transfers.some(t=>t.authority===expect.payer||t.source===expect.payerAta);
   if(!ok)return {ok:false,reason:'Carteira de origem não confere.'};
  }
 }
 const slot=tx.slot??null;
 const blockTime=tx.blockTime??null;
 return {ok:true,slot,blockTime};
}
function decodeSignature(input){
 if(typeof input!=='string'||input.length<80||input.length>100)throw Error('Assinatura inválida.');
 return bs58.decode(input);
}
module.exports={verifyPayment,accountKeys,parsedTransfers,decodeSignature};
