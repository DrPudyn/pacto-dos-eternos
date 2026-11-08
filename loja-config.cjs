const {isWalletAddress}=require('./solana-auth.cjs');
const MINTS_MAINNET={
 usdc:'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
 usdt:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};
const MINTS_DEVNET={
 usdc:'4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
 usdt:'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUyNFbahB3uD9YHX',
};
function parseUsd(name,fallback){
 const raw=process.env[name];
 if(raw===undefined||raw==='')return fallback;
 const n=Number(raw);
 if(!Number.isFinite(n)||n<=0||n>1000)return fallback;
 return n;
}
function parseIntEnv(name,fallback){
 const raw=process.env[name];
 if(raw===undefined||raw==='')return fallback;
 const n=Number.parseInt(raw,10);
 if(!Number.isSafeInteger(n)||n<0||n>100)return fallback;
 return n;
}
function roundUsd(n){return Math.round(n*100)/100;}
function welcomePriceUsd(charUsd,weaponUsd,discount){
 const base=15*charUsd+15*weaponUsd;
 return roundUsd(base*(1-discount));
}
function load(options={}){
 const cluster=(process.env.LOJA_SOLANA_CLUSTER||'mainnet-beta').toLowerCase()==='devnet'?'devnet':'mainnet-beta';
 const receiver=(process.env.LOJA_CARTEIRA_RECEBEDORA||'').trim();
 const rpc=process.env.LOJA_SOLANA_RPC||(cluster==='devnet'?'https://api.devnet.solana.com':'https://api.mainnet-beta.solana.com');
 const enabled=isWalletAddress(receiver);
 const priceCharacterUsd=parseUsd('LOJA_PRECO_SELO_USD',0.5);
 const priceWeaponUsd=parseUsd('LOJA_PRECO_ARMA_USD',0.25);
 const welcomeDiscount=parseUsd('LOJA_PACOTE_DESCONTO',0.15);
 const welcomeLimit=parseIntEnv('LOJA_PACOTE_LIMITE_CONTA',1);
 const welcomePackUsd=process.env.LOJA_PRECO_PACOTE_USD!==undefined&&process.env.LOJA_PRECO_PACOTE_USD!==''?parseUsd('LOJA_PRECO_PACOTE_USD',9.56):welcomePriceUsd(priceCharacterUsd,priceWeaponUsd,welcomeDiscount);
 const mints=cluster==='devnet'?MINTS_DEVNET:MINTS_MAINNET;
 return {
  enabled,
  receiver:enabled?receiver:null,
  rpc,
  cluster,
  decimals:6,
  mints,
  welcomeDiscount,
  products:{
   character:{id:'character',label:'Selo de Personagem',priceUsd:priceCharacterUsd,currencyField:'mintCards',min:1,max:10,fixedQuantity:null},
   weapon:{id:'weapon',label:'Arma',subtitle:'Selo / caixa de arma',priceUsd:priceWeaponUsd,currencyField:'weaponSummons',min:1,max:10,fixedQuantity:null},
   welcome:{id:'welcome',label:'Pacote de Boas-Vindas',subtitle:'15 heróis + 15 armas sorteados',priceUsd:welcomePackUsd,currencyField:'bundle',min:1,max:1,fixedQuantity:1,highlight:true,badge:'-15%',purchaseLimit:welcomeLimit,heroes:15,weapons:15},
  },
  paymentOptions:[
   {id:'usdc',label:'USDC',mint:mints.usdc},
   {id:'usdt',label:'USDT',mint:mints.usdt},
  ],
  orderTtlMs:options.orderTtlMs??15*60*1000,
 };
}
function amountMicro(product,quantity,config){
 const meta=config.products[product];
 if(!meta)throw Error('Produto inválido.');
 if(meta.fixedQuantity!==null&&meta.fixedQuantity!==undefined){
  if(quantity!==meta.fixedQuantity)throw Error('Quantidade inválida para este produto.');
 }else if(!Number.isInteger(quantity)||quantity<meta.min||quantity>meta.max)throw Error('Quantidade inválida.');
 const usd=meta.priceUsd*(meta.fixedQuantity??quantity);
 const micro=Math.round(usd*1_000_000);
 if(micro<1)throw Error('Valor de pagamento inválido.');
 return micro;
}
module.exports={load,amountMicro,welcomePriceUsd,MINTS_MAINNET,MINTS_DEVNET};
