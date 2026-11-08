const {accountKeys,parsedTransfers}=require('./loja-tx-verify.cjs');
function leg(rows,expect,destination,amount){
 return rows.find(row=>row.kind==='transferChecked'&&row.mint===expect.mint&&row.destination===destination&&String(row.amount)===String(amount)&&row.decimals===expect.decimals);
}
function fromPayer(row,expect){
 return row.authority===expect.payer||row.source===expect.payerAta;
}
// Uma transação só. As duas pernas de USDC precisam existir juntas; saldo parcial não conta.
// Isto confere os valores quando a transação vem parseada. A entrega do bazar também exige
// a mensagem exata autorizada pelo servidor; uma transferência parecida, com outra mensagem, não compra.
function verifySplit(tx,expect){
 if(!tx)return {ok:false,reason:'Transação não encontrada.'};
 if(tx.meta?.err)return {ok:false,reason:'A transação falhou na rede.'};
 if(!expect?.reference||!accountKeys(tx).includes(expect.reference))return {ok:false,reason:'Referência do pedido não encontrada na transação.'};
 if(expect.decimals!==6||!Number.isSafeInteger(expect.priceMicro)||!Number.isSafeInteger(expect.sellerMicro)||!Number.isSafeInteger(expect.feeMicro)||expect.sellerMicro<1||expect.feeMicro<1||expect.sellerMicro+expect.feeMicro!==expect.priceMicro)return {ok:false,reason:'A divisão do pedido não conserva o preço.'};
 const rows=parsedTransfers(tx).filter(row=>row.kind==='transferChecked');
 const seller=leg(rows,expect,expect.sellerAta,expect.sellerMicro);
 const fee=leg(rows,expect,expect.developerAta,expect.feeMicro);
 if(!seller||!fee||seller===fee)return {ok:false,reason:'A transação não contém as duas transferências de USDC, com valor, mint e destinatário corretos.'};
 if(!fromPayer(seller,expect)||!fromPayer(fee,expect))return {ok:false,reason:'A carteira de origem não confere.'};
 if(expect.sellerWallet&&expect.developerWallet&&expect.sellerAta===expect.developerAta&&expect.sellerWallet!==expect.developerWallet)return {ok:false,reason:'Destinatário do vendedor inconsistente.'};
 return {ok:true,slot:tx.slot??null,blockTime:tx.blockTime??null};
}
module.exports={verifySplit};
