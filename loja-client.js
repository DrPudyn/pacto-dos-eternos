function mhLojaUsd(n){return Number(n).toLocaleString('pt-BR',{style:'currency',currency:'USD'});}
function mhLojaToken(amountMicro,decimals){return (amountMicro/10**decimals).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:6});}
function installLoja({root,getCurrent,perform,getWallet}){
 let panel=null;
 function open(){
  const loja=getCurrent()?.loja;
  if(!loja)return;
  cx();
  const soon=loja.soon||!loja.enabled;
  dx({title:'LOJA DOS ETERNOS',className:'loja-dialog eternal-menu',fixed:true},body=>{
   panel=body;body.classList.add('loja-body');
   const intro=J('p',{class:'loja-intro',text:soon?'Pagamentos on-chain em breve.':'Compre selos e armas com USDC ou USDT na Solana.'});
   const balance=J('div',{class:'loja-balances'},J('p',{class:'loja-balance-line',text:'Inventário: '}),J('ul',{class:'loja-balance-list'}));
   const message=J('p',{class:'loja-message',attrs:{role:'status'}});
   const grid=J('div',{class:'loja-products'});
   const payBox=J('section',{class:'loja-checkout'},J('h3',{text:'Pagamento'}),J('label',{text:'Token'}),J('select',{class:'loja-token'}),J('label',{text:'Quantidade (selos/armas)'}),J('input',{class:'loja-qty',attrs:{type:'number',min:'1',max:'10',value:'1'}}),J('p',{class:'loja-total'}),J('button',{class:'loja-pay primary',attrs:{type:'button'},text:'PAGAR COM CARTEIRA'}));
   body.append(intro,balance,grid,payBox,message);
   if(soon){grid.append(J('p',{class:'loja-soon',text:'Em breve'}));payBox.hidden=true;return;}
   let selected='character',busy=false,order=null;
   const products=loja.products??{};
   for(const [key,item]of Object.entries(products)){
    const card=J('button',{class:'loja-product'+(item.highlight?' loja-product-highlight':''),attrs:{type:'button','data-product':key,'aria-pressed':String(key===selected)}},
     ...(item.badge?[J('span',{class:'loja-badge',text:item.badge})]:[]),
     J('span',{class:'loja-product-art'},key==='welcome'?J('img',{attrs:{src:new URL('./loja-welcome.png',import.meta.url).href,alt:''}}):key==='weapon'?J('img',{attrs:{src:new URL('./weapon-chest-closed.png',import.meta.url).href,alt:''}}):J('img',{attrs:{src:W('ui/card-back.png'),alt:''}})),
     J('strong',{text:item.label}),J('span',{class:'loja-product-price',text:mhLojaUsd(item.priceUsd)+(item.fixedQuantity?'' : ' / un.')}),...(item.subtitle?[J('small',{text:item.subtitle})]:[]),...(item.id==='welcome'&&!item.available?[J('small',{class:'loja-product-sold',text:'Já adquirido nesta conta'})]:[]));
    card.onclick=()=>{if(busy||item.id==='welcome'&&!item.available)return;selected=key;for(const b of grid.querySelectorAll('.loja-product'))b.setAttribute('aria-pressed',String(b.dataset.product===selected));paint();};
    grid.append(card);
   }
   const tokenSelect=payBox.querySelector('.loja-token');
   for(const opt of loja.paymentOptions??[])tokenSelect.append(J('option',{attrs:{value:opt.mint},text:opt.label}));
   const qtyInput=payBox.querySelector('.loja-qty');
   const total=payBox.querySelector('.loja-total');
   const payBtn=payBox.querySelector('.loja-pay');
   function paintBalances(){
    const eq=getCurrent()?.equipment??{};
    balance.querySelector('.loja-balance-list').replaceChildren(
     J('li',{text:`Selos de Personagem: ${(eq.characterSeals??getCurrent()?.packet?.player?.mintCards??0).toLocaleString('pt-BR')}`}),
     J('li',{text:`Selos de Arma: ${(eq.weaponSummons??0).toLocaleString('pt-BR')}`}),
    );
   }
   function paint(){
    paintBalances();
    const item=products[selected];
    if(!item)return;
    const fixed=item.fixedQuantity===1;
    qtyInput.hidden=fixed;qtyInput.previousElementSibling.hidden=fixed;
    if(fixed)qtyInput.value='1';
    const qty=fixed?1:Math.max(item.min,Math.min(item.max,Number(qtyInput.value)||1));
    qtyInput.value=String(qty);
    const usd=item.priceUsd*(fixed?1:qty);
    total.textContent=`Total: ${mhLojaUsd(usd)} · ${mhLojaToken(Math.round(usd*1_000_000),loja.decimals)} USDC/USDT`;
    payBtn.disabled=busy||selected==='welcome'&&!item.available;
   }
   qtyInput.oninput=paint;
   tokenSelect.onchange=()=>{order=null;};
   paint();
   payBtn.onclick=async()=>{
    if(busy)return;busy=true;message.textContent='';payBtn.disabled=true;
    try{
     const item=products[selected];
     const quantity=item.fixedQuantity??Math.max(item.min,Math.min(item.max,Number(qtyInput.value)||1));
     const value=await perform('loja/pedido',{product:selected,quantity,paymentMint:tokenSelect.value});
     order=value.lojaOrder;
     const provider=getWallet?.();
     if(!provider)throw Error('Conecte a carteira Phantom, Solflare ou Backpack.');
     const bytes=await mhSolanaBuildLojaTx(order,provider.publicKey?.toBase58?.()??order.payer??getCurrent().walletAddress);
     const signature=await mhSolanaSendPayment(provider,bytes,order.rpc);
     const confirmed=await perform('loja/confirmar',{orderId:order.orderId,signature});
     message.textContent='Compra confirmada!';
     if(confirmed.lojaResult?.granted?.revelation)mhLojaRevealWelcome(confirmed.lojaResult.granted.revelation,{getCurrent,panels:globalThis.mhLojaRevealCtx});
     else paint();
    }catch(e){message.textContent=e.message||'Falha no pagamento.';paint();}
    finally{busy=false;}
   };
  });
 }
 return {open,refresh:()=>panel?null:null};
}
async function mhSolanaSendPayment(provider,bytes,rpc){
 const tx={serialize:()=>bytes,signatures:[]};
 if(provider.signAndSendTransaction){
  const out=await provider.signAndSendTransaction(tx);
  return out?.signature||out;
 }
 if(provider.signTransaction){
  const signed=await provider.signTransaction(tx);
  const raw=signed.serialize();
  const sig=await fetch(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'sendTransaction',params:[mhSolanaEncode58(raw),{encoding:'base58',preflightCommitment:'confirmed'}]})}).then(r=>r.json());
  if(sig.error)throw Error(sig.error.message||'Envio rejeitado.');
  return sig.result;
 }
 throw Error('A carteira não suporta envio de transação.');
}
function mhLojaRevealWelcome(revelation,ctx){
 const heroes=revelation.heroes??[];
 const weapons=revelation.weapons??[];
 if(heroes.length)mhPactReveal({panels:ctx?.panels??{heroes:()=>{}}},heroes);
 if(weapons.length&&typeof revealLoot==='function')setTimeout(()=>revealLoot(weapons),heroes.length?1200:0);
}
