const smithPrices=[5000,40000,120000,300000,600000,1200000];
const porterPrice=20000;
const summonPrice=2500;
function applyPrices(source){
 const start=source.indexOf('On=['),end=source.indexOf('];function kn(',start);
 if(start<0||end<0)throw Error('Tabela de preços dos ferreiros não encontrada.');
 let count=0;
 const table=source.slice(start,end).replace(/price:L\([^)]*\)/g,()=>`price:L(${smithPrices[count++]})`);
 if(count!==smithPrices.length)throw Error('Quantidade inesperada de ferreiros.');
 source=source.slice(0,start)+table+source.slice(end);
 const porter='wn=L(125e4),Tn=L(12500)';
 if(!source.includes(porter))throw Error('Preço do Ajudante Orc não encontrado.');
 source=source.replace(porter,`wn=L(${porterPrice}),Tn=L(0)`);
 if(!source.includes('fn=L(25e3)'))throw Error('Preço da invocação não encontrado.');
 return source.replace('fn=L(25e3)',`fn=L(${summonPrice})`);
}
module.exports={smithPrices,porterPrice,summonPrice,applyPrices};
