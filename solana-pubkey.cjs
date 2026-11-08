const crypto=require('crypto');
const bs58=require('./bs58.cjs');
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
 for(let bump=255;bump>=0;bump--){
  const hash=crypto.createHash('sha256').update(Buffer.concat([...seeds.map(s=>Buffer.isBuffer(s)?s:Buffer.from(s)),Buffer.from([bump]),program]));
  const candidate=hash.digest();
  if(!isOnCurve(candidate))return {address:encodeAddress(candidate),bump,bytes:candidate};
 }
 throw Error('Não foi possível derivar endereço do programa.');
}
const {Point}=require('./vendor-noble-ed25519/index.js');
function isOnCurve(bytes){
 try{Point.fromHex(bytes);return true;}catch{return false;}
}
function associatedTokenAddress(ownerAddress,mintAddress,tokenProgram='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',ataProgram='ATokenGPvbdGVxr1b2dvdzs13Ldd6YcMNNbJp6YNn8p'){
 const owner=decodeAddress(ownerAddress);
 const mint=decodeAddress(mintAddress);
 const token=decodeAddress(tokenProgram);
 const {address}=findProgramAddress([owner,token,mint],ataProgram);
 return address;
}
module.exports={decodeAddress,encodeAddress,findProgramAddress,associatedTokenAddress,isOnCurve};
