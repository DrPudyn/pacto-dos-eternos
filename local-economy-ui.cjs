// UI-only names and pixel icons; persisted currency fields remain compatible.
const coin='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#4c2814" d="M5 0h6v1h3v3h1v8h-1v3h-3v1H5v-1H2v-3H1V4h1V1h3z"/><path fill="#d68b19" d="M5 1h6v1h2v3h1v6h-1v3h-2v1H5v-1H3v-3H2V5h1V2h2z"/><path fill="#ffe477" d="M5 2h6v1h2v3h-1V4h-2V3H6v1H4v7H3V5h1V3h1z"/><path fill="#ffbe32" d="M6 4h4v1h2v6h-2v2H6v-1H4V6h2z"/><path fill="#fff1a1" d="M7 5h2v5H7z"/><path fill="#9c5719" d="M6 11h4v1H6z"/></svg>';
const chest='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 20 16" shape-rendering="crispEdges"><path fill="#251923" d="M3 1h14v1h2v3h1v9h-1v2H1v-2H0V5h1V2h2z"/><path fill="#99512c" d="M3 2h14v1h1v4H2V3h1z"/><path fill="#d78b45" d="M4 3h12v1h1v2H3V4h1z"/><path fill="#663526" d="M2 8h16v6H2z"/><path fill="#a35b30" d="M3 9h14v3H3z"/><path fill="#edb64c" d="M3 2h2v12H3zm12 0h2v12h-2zM1 7h18v2H1zm1 6h16v2H2z"/><path fill="#ffe18c" d="M3 2h2v3H3zm12 0h2v3h-2zM1 7h18v1H1z"/><path fill="#302032" d="M8 6h4v6H8z"/><path fill="#ffda6b" d="M9 7h2v4H9z"/><path fill="#8b522a" d="M9 9h2v1H9z"/></svg>';
const chestOpen='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" shape-rendering="crispEdges"><path fill="#251923" d="M3 0h14v1h2v8h1v10h-1v2H1v-2H0V9h1V1h2z"/><path fill="#99512c" d="M3 1h14v1h1v5H2V2h1z"/><path fill="#663526" d="M5 2h10v4H5z"/><path fill="#edb64c" d="M3 1h2v7H3zm12 0h2v7h-2zM2 6h16v2H2z"/><path fill="#ffe18c" d="M3 1h2v2H3zm12 0h2v2h-2zM2 6h16v1H2z"/><path fill="#402226" d="M2 9h16v5H2z"/><path fill="#e3a72f" d="M4 10h4V9h4v1h4v3H4z"/><path fill="#ffe78b" d="M5 10h2v1H5zm4-1h2v1H9zm4 1h2v1h-2z"/><path fill="#663526" d="M2 14h16v5H2z"/><path fill="#a35b30" d="M3 15h14v2H3z"/><path fill="#edb64c" d="M3 13h2v6H3zm12 0h2v6h-2zM1 12h18v2H1zm1 6h16v2H2z"/><path fill="#ffe18c" d="M1 12h18v1H1z"/><path fill="#302032" d="M8 12h4v5H8z"/><path fill="#ffda6b" d="M9 13h2v3H9z"/></svg>';
function applyLocalEconomy(source){
 const from='function W(e){';
 if(!source.includes(from))throw Error('Asset resolver missing');
 source=source.replace(from,from+'if(e===`ui/forge-entrance.png`)return new URL(`./forge-6-lv1.png`,import.meta.url).href;');
 const urls={'ui/mhdg.png':'data:image/svg+xml,'+encodeURIComponent(coin),'ui/chest-closed.png':'data:image/svg+xml,'+encodeURIComponent(chest),'ui/chest-open.png':'data:image/svg+xml,'+encodeURIComponent(chestOpen)};
 source=source.replace(from,from+Object.entries(urls).map(([name,url])=>`if(e===${JSON.stringify(name)})return ${JSON.stringify(url)};`).join(''));
 source=source.replaceAll('Paid from your wallet, with a studio fee of ${qo(BigInt(_n(fx)))} SOL.','Pago com Ouro do seu saldo.')
 .replaceAll('Paid from your wallet, with a studio fee of ${qo(BigInt(hn))} SOL.','Pago com Ouro do seu saldo.')
 .replace('X(o,e.chest<vn?`Withdraw from ${H(vn)} MHDG`:`To your wallet`)','X(o,``)')
 .replaceAll('`HERO RESCUE`','`PERGAMINHOS`').replaceAll('`From bosses and invites`','`Cada pergaminho invoca 1 herói. Ganhe mais derrotando bosses na Masmorra.`')
 .replace('X(l,go(n))','X(l,``)')
 .replace('X(a,go(t))','X(a,`Máximo de 500 heróis no exército.`)')
 .replace('class:`chest-note`,text:`Cada pergaminho invoca 1 herói. Ganhe mais derrotando bosses na Masmorra.`','class:`chest-note`,style:{textAlign:`center`},text:`Cada pergaminho invoca 1 herói. Ganhe mais derrotando bosses na Masmorra.`')
 .replaceAll('`WITHDRAW`','`COLETAR`').replaceAll('MHDG','Ouro');
 return source;
}
function updateEconomyStyles(css){
 const open='data:image/svg+xml,'+encodeURIComponent(chestOpen);
 css=css.replace(/\.panel-chest \.panel-title:before\{[^}]*\}/g,`.panel-chest .panel-title:before{content:"";width:40px;height:42px;image-rendering:pixelated;background:url("${open}") center/contain no-repeat}`);
 return css;
}
module.exports={applyLocalEconomy,updateEconomyStyles};
