function applyLoadingExperience(source){
 const loadingGuard='if(!n)return{signedOut:()=>void 0,maintenance:()=>void 0};let r=n.querySelector';
 const paletteWait='if(!n)return{signedOut:()=>void 0,maintenance:()=>void 0};e.push(new Promise(resolve=>{let wait=()=>{let ready=window.__mhHeroRarityReady;if(ready)Promise.resolve(ready).then(resolve,resolve);else setTimeout(wait,25)};wait()}));let r=n.querySelector';
 if(!source.includes(loadingGuard))throw Error('Inicialização da tela de carregamento não encontrada.');
 source=source.replace(loadingGuard,paletteWait);
 const progress='let o=!1,s=!1,c=!1,l=0,u=()=>{let t=Math.round(l/Math.max(1,e.length)*100);';
 const paced='let o=!1,s=!1,c=!1,l=0,shown=0,started=Date.now(),timer=setInterval(()=>{if(o||s||c)return;let target=Math.min(94,Math.floor((Date.now()-started)/1800*94));if(target>shown){shown=target;r&&(r.style.width=shown+`%`),i&&(i.textContent=shown+`%`),n.setAttribute(`aria-valuenow`,String(shown))}},35),u=()=>{let t=o?100:Math.min(94,Math.max(shown,Math.round(l/Math.max(1,e.length)*90)));shown=Math.max(shown,t);t=shown;';
 if(!source.includes(progress))throw Error('Atualizador do progresso de carregamento não encontrado.');
 source=source.replace(progress,paced);
 const complete='Promise.race([Promise.allSettled(e),ZC(qC)]).then(()=>{o=!0,p()})';
 const pacedComplete='Promise.all([Promise.race([Promise.allSettled(e),ZC(qC)]),ZC(1800)]).then(()=>{o=!0;clearInterval(timer);shown=100;u();p()})';
 if(!source.includes(complete))throw Error('Conclusão do carregamento não encontrada.');
 return source.replace(complete,pacedComplete);
}
module.exports={applyLoadingExperience};
