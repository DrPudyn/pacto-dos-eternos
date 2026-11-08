function mhLojaUsd(n){return 'US$ '+Number(n).toFixed(2);}
function mhLojaToken(amountMicro,decimals){return (amountMicro/10**decimals).toFixed(2);}
function installLoja({root,getCurrent,perform,getWallet}){
 let panel=null;
 function syncHud(){
  if(document.getElementById('hud-loja'))return;
  const button=J('button',{class:'hud-loja',attrs:{id:'hud-loja',type:'button','aria-label':'Abrir loja','data-no-translate':'true'}},
   J('img',{class:'hud-loja-art',attrs:{src:new URL('./loja-saco.png',import.meta.url).href,alt:'',draggable:'false'}}),
   J('span',{text:'LOJA'}));
  button.onclick=()=>open();
  document.body.append(button);
 }
 const arts={
  character:new URL('./loja-selo.png',import.meta.url).href,
  weapon:new URL('./loja-arma.png',import.meta.url).href,
  welcome:new URL('./loja-pacote.png',import.meta.url).href,
 };
 function open(){
  const loja=getCurrent()?.loja;
  if(!loja)return;
  cx();
  const soon=loja.soon||!loja.enabled;
  dx({title:'LOJA DOS ETERNOS',className:'loja-dialog eternal-menu',fixed:true},body=>{
   panel=body;body.classList.add('loja-body');
   const intro=J('p',{class:'loja-intro',text:soon?'A loja abre assim que a carteira recebedora estiver configurada.':'O mercador do Refúgio guarda selos e armas. O pagamento sai da carteira em USDC.'});
   const balance=J('div',{class:'loja-balances'},J('p',{class:'loja-balance-line',text:'Inventário'}),J('ul',{class:'loja-balance-list'}));
   const message=J('p',{class:'loja-message',attrs:{role:'status'}});
   const grid=J('div',{class:'loja-ledger'});
   const qtyBox=J('div',{class:'loja-qty-box'},J('span',{class:'loja-qty-label',text:'Quantidade'}));
   const qtyRow=J('div',{class:'loja-qty',attrs:{role:'group','aria-label':'Quantidade de 1 a 10'}});
   const total=J('p',{class:'loja-total'});
   const payRow=J('div',{class:'loja-pay-row'});
   const payBox=J('section',{class:'loja-checkout'},J('h3',{text:'Pagamento'}),qtyBox,total,payRow);
   qtyBox.append(qtyRow);
   body.append(intro,balance,grid,payBox,message);
   const products=loja.products??{};
   if(!Object.keys(products).length){grid.append(J('p',{class:'loja-soon',text:'Em breve'}));payBox.hidden=true;return;}
   let selected=products.character?'character':Object.keys(products)[0],qty=1,busy=false;
   for(const [key,item]of Object.entries(products)){
    const sold=item.id==='welcome'&&!item.available;
    const card=J('button',{class:'loja-ware'+(item.highlight?' is-bundle':'')+(sold?' is-sold':''),attrs:{type:'button','data-product':key,'aria-pressed':String(key===selected)}},
     J('span',{class:'loja-ware-art'},J('img',{attrs:{src:arts[key]||arts.character,alt:'',draggable:'false'}})),
     J('span',{class:'loja-ware-copy'},
      J('strong',{text:item.label}),
      ...(item.subtitle?[J('small',{text:item.subtitle})]:[]),
      ...(sold?[J('small',{class:'loja-ware-sold',text:'Já adquirido nesta conta'})]:[])),
     J('span',{class:'loja-ware-price'},
      ...(item.badge?[J('span',{class:'loja-ware-badge',text:item.badge})]:[]),
      J('b',{text:mhLojaUsd(item.priceUsd)}),
      J('i',{text:item.fixedQuantity?'o pacto':'cada'})));
    card.onclick=()=>{if(busy||sold)return;selected=key;for(const b of grid.querySelectorAll('.loja-ware'))b.setAttribute('aria-pressed',String(b.dataset.product===selected));paint();};
    grid.append(card);
   }
   for(let n=1;n<=10;n++){
    const chip=J('button',{class:'loja-qty-chip',attrs:{type:'button','data-qty':String(n),'aria-pressed':String(n===1)},text:String(n)});
    chip.onclick=()=>{if(busy)return;qty=n;paint();};
    qtyRow.append(chip);
   }
   for(const opt of loja.paymentOptions??[]){
    const btn=J('button',{class:'loja-pay loja-pay-'+opt.id,attrs:{type:'button','data-mint':opt.mint},text:'PAGAR COM '+opt.label});
    btn.onclick=()=>pay(opt.mint,opt.label);
    payRow.append(btn);
   }
   if(!(loja.paymentOptions??[]).length)payBox.hidden=true;
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
    qtyBox.hidden=fixed;
    if(fixed)qty=1;
    qty=Math.max(item.min??1,Math.min(item.max??10,qty));
    for(const chip of qtyRow.querySelectorAll('.loja-qty-chip'))chip.setAttribute('aria-pressed',String(Number(chip.dataset.qty)===qty));
    const units=fixed?1:qty;
    const usd=item.priceUsd*units;
    const token=mhLojaToken(Math.round(usd*1_000_000),loja.decimals??6);
    total.textContent=`Total: ${mhLojaUsd(usd)} · paga ${token} USDC`;
    const blocked=busy||soon||(selected==='welcome'&&!item.available);
    for(const btn of payRow.querySelectorAll('.loja-pay'))btn.disabled=blocked;
   }
   async function pay(mint,label){
    if(busy||soon)return;busy=true;message.textContent='';paint();
    try{
     const item=products[selected];
     const quantity=item.fixedQuantity??qty;
     const value=await perform('loja/pedido',{product:selected,quantity,paymentMint:mint});
     const order=value.lojaOrder;
     const provider=getWallet?.();
     if(!provider)throw Error('Conecte a carteira Phantom, Solflare ou Backpack.');
     const bytes=await mhSolanaBuildLojaTx(order,provider.publicKey?.toBase58?.()??order.payer??getCurrent().walletAddress);
     const signature=await mhSolanaSendPayment(provider,bytes);
     const confirmed=await perform('loja/confirmar',{orderId:order.orderId,signature});
     message.textContent='Pagamento em '+label+' confirmado.';
     if(confirmed.lojaResult?.granted?.revelation)mhLojaRevealWelcome(confirmed.lojaResult.granted.revelation,{getCurrent,panels:globalThis.mhLojaRevealCtx});
     else paint();
    }catch(e){
     const raw=String(e?.message||'');
     message.textContent=!raw||/failed to fetch|networkerror|load failed|access forbidden/i.test(raw)?'A rede Solana não respondeu. Tente novamente em instantes.':raw;
    }
    finally{busy=false;paint();}
   }
   paint();
   if(soon){message.textContent='Pagamentos on-chain em breve.';for(const btn of payRow.querySelectorAll('.loja-pay'))btn.disabled=true;}
  });
 }
 syncHud();
 return {open,refresh:()=>panel?null:null,sync:syncHud};
}
async function mhSolanaSendPayment(provider,bytes){
 const tx={serialize:()=>bytes,signatures:[]};
 if(provider.signTransaction){
  const signed=await provider.signTransaction(tx);
  return mhSolanaRpc('sendTransaction',[mhSolanaEncode58(signed.serialize()),{encoding:'base58',preflightCommitment:'confirmed'}]);
 }
 if(provider.signAndSendTransaction){
  const out=await provider.signAndSendTransaction(tx);
  return out?.signature||out;
 }
 throw Error('A carteira não suporta envio de transação.');
}
function mhLojaRevealWelcome(revelation,ctx){
 const heroes=revelation.heroes??[];
 const weapons=revelation.weapons??[];
 if(heroes.length)mhPactReveal({panels:ctx?.panels??{heroes:()=>{}}},heroes);
 if(weapons.length&&typeof revealLoot==='function')setTimeout(()=>revealLoot(weapons),heroes.length?1200:0);
}
