const crypto=require('crypto');
const bs58=require('./bs58.cjs');
const PROGRAMS=require('./solana-programs.cjs');
const PDA_MARKER=Buffer.from('ProgramDerivedAddress');
function decodeAddress(text){
 if(typeof text!=='string'||text.length<32||text.length>44)throw Error('Endereço inválido.');
 const bytes=bs58.decode(text);
 if(bytes.length!==32)throw Error('Endereço inválido.');
 return bytes;
}
function encodeAddress(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length!==32)throw Error('Chave pública inválida.');
 return bs58.encode(bytes);
}
function findProgramAddress(seeds,programId){
 const program=decodeAddress(programId);
 const parts=seeds.map(seed=>{
  const buf=Buffer.isBuffer(seed)?seed:Buffer.from(seed);
  if(buf.length>32)throw Error('Semente maior que 32 bytes.');
  return buf;
 });
 for(let bump=255;bump>=0;bump--){
  const hash=crypto.createHash('sha256').update(Buffer.concat([...parts,Buffer.from([bump]),program,PDA_MARKER]));
  const candidate=hash.digest();
  if(!isOnCurve(candidate))return {address:encodeAddress(candidate),bump,bytes:candidate};
 }
 throw Error('Não foi possível derivar endereço do programa.');
}
const {ExtendedPoint}=require('./vendor-noble-ed25519/index.js');
function isOnCurve(bytes){
 try{ExtendedPoint.fromHex(bytes);return true;}catch{return false;}
}
function associatedTokenAddress(ownerAddress,mintAddress,tokenProgram=PROGRAMS.TOKEN_PROGRAM_ID,ataProgram=PROGRAMS.ASSOCIATED_TOKEN_PROGRAM_ID){
 const owner=decodeAddress(ownerAddress);
 const mint=decodeAddress(mintAddress);
 const token=decodeAddress(tokenProgram);
 const {address}=findProgramAddress([owner,token,mint],ataProgram);
 return address;
}
module.exports={decodeAddress,encodeAddress,findProgramAddress,associatedTokenAddress,isOnCurve};
