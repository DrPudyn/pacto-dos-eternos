const {isWalletAddress}=require('./solana-auth.cjs');
const {MINTS_MAINNET,MINTS_DEVNET}=require('./loja-config.cjs');
// Carteira do jogo informada pelo dono. A taxa de 15% só vai para este endereço.
// O líquido do vendedor vai para a carteira que ele já autenticou. Nunca para a carteira da loja.
const DEVELOPER_WALLET='BHSxkg3pmnmmMpiK77yPXgWokaJvSUJ3WynT12c2HjWx';
const FEE_BPS=1500;
const SELLER_BPS=8500;
const DECIMALS=6;
const MIN_MICRO=7;
const MAX_MICRO=1_000_000_000_000;
if(!isWalletAddress(DEVELOPER_WALLET))throw Error('Carteira do desenvolvedor inválida.');
// Divisão inteira, sem float:
// taxa = floor(preçoMicro * 15 / 100), com divisão de BigInt (trunca para zero).
// líquido = preçoMicro - taxa.
// taxa + líquido = preçoMicro, sempre.
// Abaixo de 7 microunidades (0,000007 USDC) a taxa ou o líquido seria zero, e o preço é recusado.
function splitMicro(priceMicro){
 if(!Number.isSafeInteger(priceMicro)||priceMicro<1)throw Error('Preço inválido.');
 const feeMicro=Number((BigInt(priceMicro)*BigInt(FEE_BPS))/10_000n);
 const sellerMicro=priceMicro-feeMicro;
 if(feeMicro<1||sellerMicro<1||feeMicro+sellerMicro!==priceMicro)throw Error('Preço baixo demais: a taxa de 15% ou o líquido do vendedor ficaria zero. O mínimo é 0,000007 USDC.');
 if(priceMicro>MAX_MICRO)throw Error('O preço máximo é 1.000.000 USDC.');
 return {priceMicro,feeMicro,sellerMicro,feeBps:FEE_BPS,sellerBps:SELLER_BPS};
}
function parsePriceUsdc(raw){
 if(typeof raw!=='string')throw Error('Informe o preço em USDC.');
 const text=raw.trim().replace(',','.');
 if(!/^\d{1,7}(\.\d{1,6})?$/.test(text))throw Error('Use um preço em USDC com até 6 casas decimais.');
 const [whole,frac='']=text.split('.');
 const micro=Number(whole)*1_000_000+Number((frac+'000000').slice(0,6));
 if(!Number.isSafeInteger(micro))throw Error('Preço inválido.');
 return splitMicro(micro);
}
function load(options={}){
 const cluster=(process.env.LOJA_SOLANA_CLUSTER||'mainnet-beta').toLowerCase()==='devnet'?'devnet':'mainnet-beta';
 const defaults=cluster==='devnet'?MINTS_DEVNET:MINTS_MAINNET;
 const usdcOverride=(process.env.LOJA_MINT_USDC||'').trim();
 if(usdcOverride&&!isWalletAddress(usdcOverride))throw Error('LOJA_MINT_USDC não é um mint válido.');
 const enabled=options.enabled??process.env.BAZAR_USDC==='1';
 return {
  enabled:!!enabled,
  developerWallet:DEVELOPER_WALLET,
  feeBps:FEE_BPS,
  sellerBps:SELLER_BPS,
  decimals:DECIMALS,
  minMicro:MIN_MICRO,
  maxMicro:MAX_MICRO,
  cluster,
  mint:usdcOverride||defaults.usdc,
  rpc:process.env.LOJA_SOLANA_RPC||(cluster==='devnet'?'https://api.devnet.solana.com':'https://api.mainnet-beta.solana.com'),
  orderTtlMs:options.orderTtlMs??15*60*1000,
 };
}
module.exports={load,splitMicro,parsePriceUsdc,DEVELOPER_WALLET,FEE_BPS,SELLER_BPS,MIN_MICRO,MAX_MICRO};
