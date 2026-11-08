const MH_SOLANA_PROGRAMS={TOKEN_PROGRAM_ID:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',ASSOCIATED_TOKEN_PROGRAM_ID:'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',SYSTEM_PROGRAM_ID:'11111111111111111111111111111111'};
const MH_SOLANA_PDA_MARKER=new TextEncoder().encode('ProgramDerivedAddress');
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
 for(let i=0;i<text.length-1&&text[i]==='1';i++)bytes.push(0);
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
 let out='';
 for(let i=0;i<source.length-1&&source[i]===0;i++)out+='1';
 return out+digits.reverse().map(d=>ALPHABET[d]).join('');
}
function mhSolanaIsOnCurve(bytes){
 const P=2n**255n-19n;
 const D=37095705934669439343138083508754565189542113879843219016388785533085940283555n;
 const mod=a=>{const r=a%P;return r>=0n?r:r+P;};
 const pow=(b,e)=>{let r=1n,x=b%P;while(e){if(e&1n)r=r*x%P;x=x*x%P;e>>=1n;}return r;};
 if(bytes.length!==32)return false;
 let y=0n;
 for(let i=0;i<31;i++)y|=BigInt(bytes[i])<<(8n*BigInt(i));
 y|=BigInt(bytes[31]&0x7f)<<248n;
 if(y>=P)return false;
 const y2=mod(y*y),u=mod(y2-1n),v=mod(D*y2+1n);
 const x2=mod(u*pow(v,P-2n));
 const leg=pow(x2,(P-1n)/2n);
 if(leg!==0n&&leg!==1n)return false;
 if(x2===0n&&(bytes[31]&0x80)!==0)return false;
 return true;
}
async function mhSolanaAta(owner,mint){
 const ownerBytes=mhSolanaDecode58(owner);
 const mintBytes=mhSolanaDecode58(mint);
 const tokenBytes=mhSolanaDecode58(MH_SOLANA_PROGRAMS.TOKEN_PROGRAM_ID);
 const ataProg=mhSolanaDecode58(MH_SOLANA_PROGRAMS.ASSOCIATED_TOKEN_PROGRAM_ID);
 for(let bump=255;bump>=0;bump--){
  const hash=await mhSolanaSha256([ownerBytes,tokenBytes,mintBytes,new Uint8Array([bump]),ataProg,MH_SOLANA_PDA_MARKER]);
  if(!mhSolanaIsOnCurve(hash))return mhSolanaEncode58(hash);
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
const MH_SOLANA_RPC_FAIL='A rede Solana não respondeu. Tente novamente em instantes.';
async function mhSolanaRpc(method,params,path){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),20000);
 let res,body;
 try{
  res=await fetch(path||'/shared-api/loja/rpc',{method:'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  body=await res.json();
 }catch{throw Error(MH_SOLANA_RPC_FAIL);}
 finally{clearTimeout(timeout);}
 const fault=body?.error;
 if(!res.ok||fault){
  const message=typeof fault==='string'?fault:fault?.message;
  throw Error(typeof message==='string'&&message&&!/failed to fetch|networkerror|load failed|access forbidden/i.test(message)?message:MH_SOLANA_RPC_FAIL);
 }
 if(!body||!Object.prototype.hasOwnProperty.call(body,'result'))throw Error(MH_SOLANA_RPC_FAIL);
 return body.result;
}
async function mhSolanaBuildLojaTx(order,payer){
 const block=await mhSolanaRpc('getLatestBlockhash',[{commitment:'finalized'}]);
 const blockhash=block?.value?.blockhash;
 if(!blockhash)throw Error('Não foi possível obter o bloco da Solana. Tente novamente em instantes.');
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
function mhSolanaWireMessage(wire){
 const count=wire[0]&0x7f;
 return wire.slice(1+count*64);
}
// O jogo autoriza a mensagem e o bloco. O navegador só pede à carteira que assine esse wire.
async function mhSolanaBuildBazarTx(order,payer){
 if(!order?.transaction||order.sellerMicro+order.feeMicro!==order.priceMicro)throw Error('Pedido sem a transação autorizada pelo jogo. Reserve o anúncio de novo.');
 if(payer&&order.payer&&payer!==order.payer)throw Error('A transação autorizada é da carteira vinculada a este perfil.');
 const raw=atob(order.transaction);
 const wire=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)wire[i]=raw.charCodeAt(i)&255;
 if(wire[0]!==2)throw Error('A transação autorizada está incompleta. Reserve o anúncio de novo.');
 let signed=false;
 for(let i=65;i<129;i++)if(wire[i]!==0)signed=true;
 if(!signed)throw Error('A transação autorizada está incompleta. Reserve o anúncio de novo.');
 return wire;
}
async function mhSolanaNetworkFee(wire){
 const message=mhSolanaWireMessage(wire);
 let binary='';
 for(const byte of message)binary+=String.fromCharCode(byte);
 const result=await mhSolanaRpc('getFeeForMessage',[btoa(binary),{commitment:'confirmed'}],'/shared-api/bazar-usdc/rpc');
 return Number.isInteger(result?.value)?result.value:null;
}
