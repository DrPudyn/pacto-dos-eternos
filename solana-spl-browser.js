const MH_SOLANA_PROGRAMS={TOKEN_PROGRAM_ID:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',ASSOCIATED_TOKEN_PROGRAM_ID:'ATokenGPvbdGVxr1b2dvdzs13Ldd6YcMNNbJp6YNn8p',SYSTEM_PROGRAM_ID:'11111111111111111111111111111111'};
async function mhSolanaSha256(parts){
 const data=new Uint8Array(parts.reduce((n,p)=>n+(p?.length??p?.byteLength??0),0));
 let o=0;
 for(const p of parts){const chunk=p instanceof Uint8Array?p:new Uint8Array(p);data.set(chunk,o);o+=chunk.length;}
 const digest=await crypto.subtle.digest('SHA-256',data);
 return new Uint8Array(digest);
}
function mhSolanaDecode58(text){
 const ALPHABET='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
 const bytes=[0];
 for(let i=0;i<text.length;i++){
  const value=ALPHABET.indexOf(text[i]);
  if(value<0)throw Error('Endereço inválido.');
  for(let j=0;j<bytes.length;j++)bytes[j]*=58;
  bytes[0]+=value;
  let carry=0;
  for(let j=0;j<bytes.length;j++){bytes[j]+=carry;carry=bytes[j]>>8;bytes[j]&=255;}
  while(carry){bytes.push(carry&255);carry>>=8;}
 }
 for(let i=0;i<text.length&&text[i]==='1';i++)bytes.push(0);
 return new Uint8Array(bytes.reverse());
}
function mhSolanaEncode58(buffer){
 const ALPHABET='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
 const source=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
 if(!source.length)return '';
 const digits=[0];
 for(let i=0;i<source.length;i++){
  let carry=source[i];
  for(let j=0;j<digits.length;j++){const x=digits[j]*256+carry;digits[j]=x%58;carry=(x/58)|0;}
  while(carry){digits.push(carry%58);carry=(carry/58)|0;}
 }
 let zeros=0;while(zeros<source.length&&!source[zeros])zeros++;
 return '1'.repeat(zeros)+digits.reverse().map(d=>ALPHABET[d]).join('');
}
async function mhSolanaIsOnCurve(bytes){
 try{
  const key=new Uint8Array(12+32);
  key.set([0x30,0x2a,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x03,0x21,0x00]);
  key.set(bytes,12);
  await crypto.subtle.importKey('spki',key,{name:'Ed25519'},false,['verify']);
  return true;
 }catch{return false;}
}
async function mhSolanaAta(owner,mint){
 const ownerBytes=mhSolanaDecode58(owner);
 const mintBytes=mhSolanaDecode58(mint);
 const tokenBytes=mhSolanaDecode58(MH_SOLANA_PROGRAMS.TOKEN_PROGRAM_ID);
 const ataProg=mhSolanaDecode58(MH_SOLANA_PROGRAMS.ASSOCIATED_TOKEN_PROGRAM_ID);
 for(let bump=255;bump>=0;bump--){
  const hash=await mhSolanaSha256([ownerBytes,tokenBytes,mintBytes,new Uint8Array([bump]),ataProg]);
  if(!(await mhSolanaIsOnCurve(hash)))return mhSolanaEncode58(hash);
 }
 throw Error('ATA indisponível.');
}
function mhSolanaCompactU16(n){
 const out=[];let rem=n;
 while(true){let elem=rem&0x7f;rem>>=7;if(rem)elem|=0x80;out.push(elem);if(!rem)break;}
 return new Uint8Array(out);
}
function mhSolanaSortKeys(a,b){
 if(a.isSigner!==b.isSigner)return a.isSigner?-1:1;
 if(a.isWritable!==b.isWritable)return a.isWritable?-1:1;
 return 0;
}
function mhSolanaCompileTx({feePayer,recentBlockhash,instructions}){
 const map=new Map();
 const note=(pubkey,isSigner,isWritable)=>{const row=map.get(pubkey);if(!row)map.set(pubkey,{pubkey,isSigner,isWritable});else{row.isSigner=row.isSigner||isSigner;row.isWritable=row.isWritable||isWritable;}};
 note(feePayer,true,true);
 for(const ix of instructions){note(ix.programId,false,false);for(const acc of ix.accounts)note(acc.pubkey,acc.isSigner,acc.isWritable);}
 const keys=[...map.values()].sort(mhSolanaSortKeys);
 const indexOf=pk=>keys.findIndex(k=>k.pubkey===pk);
 const header={numRequiredSignatures:keys.filter(k=>k.isSigner).length,numReadonlySignedAccounts:keys.filter(k=>k.isSigner&&!k.isWritable).length,numReadonlyUnsignedAccounts:keys.filter(k=>!k.isSigner&&!k.isWritable).length};
 const accountBytes=new Uint8Array(keys.length*32);
 keys.forEach((k,i)=>accountBytes.set(mhSolanaDecode58(k.pubkey),i*32));
 const blockhash=mhSolanaDecode58(recentBlockhash);
 const parts=[new Uint8Array([header.numRequiredSignatures,header.numReadonlySignedAccounts,header.numReadonlyUnsignedAccounts]),mhSolanaCompactU16(keys.length),accountBytes,blockhash,mhSolanaCompactU16(instructions.length)];
 for(const ix of instructions){
  parts.push(new Uint8Array([indexOf(ix.programId)]),mhSolanaCompactU16(ix.accounts.length),new Uint8Array(ix.accounts.map(a=>indexOf(a.pubkey))),mhSolanaCompactU16(ix.data.length),ix.data);
 }
 const total=parts.reduce((n,p)=>n+p.length,0);
 const message=new Uint8Array(total);
 let o=0;for(const p of parts){message.set(p,o);o+=p.length;}
 const wire=new Uint8Array(1+64+message.length);
 wire[0]=1;
 wire.set(message,1+64);
 return wire;
}
function mhSolanaAtaIx(payer,owner,mint,ata){
 return {programId:MH_SOLANA_PROGRAMS.ASSOCIATED_TOKEN_PROGRAM_ID,data:new Uint8Array([1]),accounts:[
  {pubkey:payer,isSigner:true,isWritable:true},{pubkey:ata,isSigner:false,isWritable:true},{pubkey:owner,isSigner:false,isWritable:false},{pubkey:mint,isSigner:false,isWritable:false},
  {pubkey:MH_SOLANA_PROGRAMS.SYSTEM_PROGRAM_ID,isSigner:false,isWritable:false},{pubkey:MH_SOLANA_PROGRAMS.TOKEN_PROGRAM_ID,isSigner:false,isWritable:false},
 ]};
}
function mhSolanaTransferCheckedIx(source,mint,destination,owner,amountMicro,decimals,extra=[]){
 const data=new Uint8Array(10);data[0]=12;
 const view=new DataView(data.buffer);view.setBigUint64(1,BigInt(amountMicro),true);data[9]=decimals;
 return {programId:MH_SOLANA_PROGRAMS.TOKEN_PROGRAM_ID,data,accounts:[
  {pubkey:source,isSigner:false,isWritable:true},{pubkey:mint,isSigner:false,isWritable:false},{pubkey:destination,isSigner:false,isWritable:true},{pubkey:owner,isSigner:true,isWritable:false},
  ...extra.map(pubkey=>({pubkey,isSigner:false,isWritable:false})),
 ]};
}
async function mhSolanaBuildLojaTx(order,payer){
 const block=await fetch(order.rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getLatestBlockhash',params:[{commitment:'finalized'}]})}).then(r=>r.json());
 const blockhash=block?.result?.value?.blockhash;
 if(!blockhash)throw Error('Não foi possível obter blockhash da Solana.');
 const sourceAta=order.sourceAta;
 if(!sourceAta)throw Error('Pedido sem conta de origem. Crie o pedido novamente.');
 return mhSolanaCompileTx({
  feePayer:payer,
  recentBlockhash:blockhash,
  instructions:[
   mhSolanaAtaIx(payer,order.receiver,order.paymentMint,order.destinationAta),
   mhSolanaTransferCheckedIx(sourceAta,order.paymentMint,order.destinationAta,payer,order.amountMicro,order.decimals,[order.reference]),
  ],
 });
}
