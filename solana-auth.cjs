const crypto=require('crypto');
const bs58=require('./bs58.cjs');
const NONCE_TTL_MS=5*60*1000;
const MESSAGE_PREFIX='Pacto dos Eternos quer confirmar sua carteira Solana.\n\n';
function isWalletAddress(text){
 return typeof text==='string'&&text.length>=32&&text.length<=44&&/^[1-9A-HJ-NP-Za-km-z]+$/.test(text);
}
function pubkeyBytes(address){
 const bytes=bs58.decode(address);
 if(bytes.length!==32)throw Error('Endereço de carteira inválido.');
 return bytes;
}
function verifySignature(address,message,signature){
 if(!isWalletAddress(address))return false;
 if(!message||typeof message!=='string'||message.length>2000)return false;
 let sig;
 try{
  sig=Buffer.isBuffer(signature)?signature:bs58.decode(typeof signature==='string'?signature:'');
 }catch{return false;}
 if(sig.length!==64)return false;
 try{
  const key=pubkeyBytes(address);
  const keyObject=crypto.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),key]),format:'der',type:'spki'});
  const data=Buffer.from(message,'utf8');
  return crypto.verify(null,data,keyObject,sig);
 }catch{return false;}
}
function challengeMessage(address,nonce,issuedAt,expiresAt){
 return `${MESSAGE_PREFIX}Carteira: ${address}\nNonce: ${nonce}\nEmitido: ${issuedAt}\nExpira: ${expiresAt}`;
}
function createAuth(options={}){
 const now=options.now??Date.now;
 const pending=new Map();
 function purge(at=now()){for(const [key,row]of pending)if(row.expiresAt<=at)pending.delete(key);}
 function issueChallenge(address){
 if(!isWalletAddress(address))throw Error('Endereço de carteira inválido.');
 purge();
 const nonce=crypto.randomBytes(16).toString('hex'),issuedAt=new Date(now()).toISOString(),expiresAt=new Date(now()+NONCE_TTL_MS).toISOString();
 const message=challengeMessage(address,nonce,issuedAt,expiresAt);
 const row={nonce,message,issuedAt,expiresAt,expiresAtMs:now()+NONCE_TTL_MS};
 pending.set(address,row);
 return {address,nonce,message,issuedAt,expiresAt,expiresInSeconds:Math.floor(NONCE_TTL_MS/1000)};
 }
 function consumeChallenge(address,message){
 purge();
 const row=pending.get(address);
 if(!row||row.message!==message||row.expiresAtMs<=now())return false;
 pending.delete(address);
 return true;
 }
 return {issueChallenge,consumeChallenge,verifySignature,isWalletAddress,purge};
}
module.exports={createAuth,verifySignature,isWalletAddress,challengeMessage};
