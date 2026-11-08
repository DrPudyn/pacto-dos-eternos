const {decodeAddress}=require('./solana-pubkey.cjs');
const bs58=require('./bs58.cjs');
const PROGRAMS=require('./solana-programs.cjs');
function encodeCompactU16(n){
 const out=[];
 let rem=n;
 while(true){
  let elem=rem&0x7f;
  rem>>=7;
  if(rem)elem|=0x80;
  out.push(elem);
  if(!rem)break;
 }
 return Buffer.from(out);
}
function sortKey(a,b){
 if(a.isSigner!==b.isSigner)return a.isSigner?-1:1;
 if(a.isWritable!==b.isWritable)return a.isWritable?-1:1;
 return 0;
}
function compileTransaction({feePayer,recentBlockhash,instructions}){
 const map=new Map();
 function note(pubkey,isSigner,isWritable){
  const k=pubkey;
  const row=map.get(k);
  if(!row)map.set(k,{pubkey:k,isSigner,isWritable});
  else{row.isSigner=row.isSigner||isSigner;row.isWritable=row.isWritable||isWritable;}
 }
 note(feePayer,true,true);
 for(const ix of instructions){
  note(ix.programId,false,false);
  for(const acc of ix.accounts)note(acc.pubkey,acc.isSigner,acc.isWritable);
 }
 const keys=[...map.values()].sort(sortKey);
 const indexOf=pk=>keys.findIndex(k=>k.pubkey===pk);
 const header={
  numRequiredSignatures:keys.filter(k=>k.isSigner).length,
  numReadonlySignedAccounts:keys.filter(k=>k.isSigner&&!k.isWritable).length,
  numReadonlyUnsignedAccounts:keys.filter(k=>!k.isSigner&&!k.isWritable).length,
 };
 const accountBytes=Buffer.concat(keys.map(k=>decodeAddress(k.pubkey)));
 let blockhashBytes;
 try{blockhashBytes=decodeAddress(recentBlockhash);}catch{blockhashBytes=bs58.decode(recentBlockhash);}
 if(blockhashBytes.length!==32)throw Error('Blockhash inválido.');
 const compiled=[];
 for(const ix of instructions){
  compiled.push({
   programIdIndex:indexOf(ix.programId),
   accounts:ix.accounts.map(a=>indexOf(a.pubkey)),
   data:ix.data,
  });
 }
 const message=Buffer.concat([
  Buffer.from([header.numRequiredSignatures,header.numReadonlySignedAccounts,header.numReadonlyUnsignedAccounts]),
  encodeCompactU16(keys.length),
  accountBytes,
  blockhashBytes,
  encodeCompactU16(compiled.length),
  ...compiled.flatMap(ix=>[
   Buffer.from([ix.programIdIndex]),
   encodeCompactU16(ix.accounts.length),
   Buffer.from(ix.accounts),
   encodeCompactU16(ix.data.length),
   ix.data,
  ]),
 ]);
 const signatures=header.numRequiredSignatures;
 const sig=Buffer.alloc(signatures*64);
 return Buffer.concat([encodeCompactU16(signatures),sig,message]);
}
function createAtaIdempotentIx(payer,owner,mint,ata){
 return {programId:PROGRAMS.ASSOCIATED_TOKEN_PROGRAM_ID,data:Buffer.from([1]),accounts:[
  {pubkey:payer,isSigner:true,isWritable:true},
  {pubkey:ata,isSigner:false,isWritable:true},
  {pubkey:owner,isSigner:false,isWritable:false},
  {pubkey:mint,isSigner:false,isWritable:false},
  {pubkey:PROGRAMS.SYSTEM_PROGRAM_ID,isSigner:false,isWritable:false},
  {pubkey:PROGRAMS.TOKEN_PROGRAM_ID,isSigner:false,isWritable:false},
 ]};
}
function transferCheckedIx(source,mint,destination,owner,amountMicro,decimals,extraReadonly=[]){
 const data=Buffer.alloc(10);
 data[0]=12;
 data.writeBigUInt64LE(BigInt(amountMicro),1);
 data[9]=decimals;
 return {programId:PROGRAMS.TOKEN_PROGRAM_ID,data,accounts:[
  {pubkey:source,isSigner:false,isWritable:true},
  {pubkey:mint,isSigner:false,isWritable:false},
  {pubkey:destination,isSigner:false,isWritable:true},
  {pubkey:owner,isSigner:true,isWritable:false},
  ...extraReadonly.map(pubkey=>({pubkey,isSigner:false,isWritable:false})),
 ]};
}
function buildLojaPayment({payer,receiver,sourceAta,destAta,mint,amountMicro,decimals,reference,blockhash}){
 return compileTransaction({
  feePayer:payer,
  recentBlockhash:blockhash,
  instructions:[
   createAtaIdempotentIx(payer,receiver,mint,destAta),
   transferCheckedIx(sourceAta,mint,destAta,payer,amountMicro,decimals,reference?[reference]:[]),
  ],
 });
}
module.exports={compileTransaction,createAtaIdempotentIx,transferCheckedIx,buildLojaPayment,encodeCompactU16};
