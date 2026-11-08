async function rpcCall(rpcUrl,method,params,fetchImpl=globalThis.fetch){
 if(typeof fetchImpl!=='function')throw Error('Fetch indisponível para consultar a Solana.');
 const res=await fetchImpl(rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
 const body=await res.json().catch(()=>({}));
 if(!res.ok||body.error)throw Error(body.error?.message||'Falha na consulta RPC Solana.');
 return body.result;
}
async function getTransaction(rpcUrl,signature,fetchImpl){return rpcCall(rpcUrl,'getTransaction',[signature,{encoding:'jsonParsed',commitment:'confirmed',maxSupportedTransactionVersion:0}],fetchImpl);}
async function getLatestBlockhash(rpcUrl,fetchImpl){return rpcCall(rpcUrl,'getLatestBlockhash',[{commitment:'finalized'}],fetchImpl);}
module.exports={rpcCall,getTransaction,getLatestBlockhash};
