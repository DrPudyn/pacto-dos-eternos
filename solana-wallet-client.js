function mhSolanaProviders(){
 const rows=[];
 const seen=new Set();
 function add(name,provider){if(!provider||seen.has(provider))return;seen.add(provider);rows.push({name,provider});}
 if(globalThis.phantom?.solana?.isPhantom)add('Phantom',globalThis.phantom.solana);
 if(globalThis.solana?.isPhantom)add('Phantom',globalThis.solana);
 if(globalThis.solflare?.isSolflare)add('Solflare',globalThis.solflare);
 if(globalThis.backpack)add('Backpack',globalThis.backpack);
 if(globalThis.solana&&!globalThis.solana.isPhantom)add('Solana',globalThis.solana);
 return rows;
}
function mhSolanaPickProvider(){
 const providers=mhSolanaProviders();
 if(!providers.length)throw Error('Nenhuma carteira Solana encontrada. Instale Phantom, Solflare ou Backpack.');
 if(providers.length===1)return providers[0].provider;
 const pick=prompt('Escolha a carteira:\n'+providers.map((row,i)=>`${i+1}. ${row.name}`).join('\n'),'1');
 const index=Number(pick)-1;
 return (providers[index]??providers[0]).provider;
}
function mhSolanaShortAddress(address){return typeof address==='string'&&address.length>10?address.slice(0,4)+'…'+address.slice(-4):address??'';}
async function mhSolanaConnect(){
 const provider=mhSolanaPickProvider();
 if(!provider?.connect)throw Error('A carteira não suporta conexão neste navegador.');
 const result=await provider.connect();
 const address=result?.publicKey?.toBase58?.()??provider.publicKey?.toBase58?.();
 if(!address)throw Error('Não foi possível ler o endereço da carteira.');
 return {provider,address};
}
async function mhSolanaSignMessage(provider,message){
 if(!provider?.signMessage)throw Error('A carteira não suporta assinatura de mensagem. Atualize a extensão.');
 const encoded=new TextEncoder().encode(message);
 const signed=await provider.signMessage(encoded,'utf8');
 const signature=signed?.signature;
 if(!signature)throw Error('A carteira não devolveu a assinatura.');
 return signature;
}
