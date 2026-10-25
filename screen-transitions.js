// One fade controller for navigation; confirmation dialogs keep their normal behavior.
let mhNavigationFade=null;
function mhScreenTransition(change){
 if(mhNavigationFade)return Promise.resolve().then(change);
 const veil=document.createElement('div');veil.className='game-navigation-fade';veil.setAttribute('aria-hidden','true');document.body.append(veil);mhNavigationFade=veil;
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 return (async()=>{try{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{veil.classList.add('covered');resolve();})));await sleep(reduced?0:140);await change();
  // Show the destination promptly; its own loading UI handles slow connections.
  await new Promise(resolve=>requestAnimationFrame(resolve));
  const images=[...document.querySelectorAll('.page img,.tower-screen img,.modal-backdrop img,.gear-modal-backdrop img,.campaign-screen img,dialog[open] img')].filter(i=>!i.complete&&i.getClientRects().length).slice(0,12);
  const urls=new Set([...document.querySelectorAll('.page,.tower-screen,.campaign-body,.refuge-choice-icon>*,.codex-book')].filter(n=>n.getClientRects().length).flatMap(n=>[...getComputedStyle(n).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1])));
  const backgrounds=[...urls].slice(0,6).map(url=>{const i=new Image();i.src=url;return i.decode().catch(()=>{});});
  await Promise.race([Promise.all([...images.map(i=>i.decode().catch(()=>{})),...backgrounds]),sleep(650)]);
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 }finally{veil.classList.remove('covered');await sleep(reduced?0:200);veil.remove();if(mhNavigationFade===veil)mhNavigationFade=null;}})();
}
function mhInstallScreenTransitions(){
 if(document.documentElement.dataset.navigationFade)return;document.documentElement.dataset.navigationFade='1';let replay=false;
 const selector='.refuge-destination:not(.refuge-dungeon),.refuge-choices .cta,.modal-backdrop:has(.refuge-choices) .close-btn,.codex-close,.shortcuts .shortcut,.page-modes button,.back-btn,.tower-header button,.campaign-header button,.campaign-stage,.campaign-result-panel button,.tower-result button,#codex-launcher,#gear-backpack';
 document.addEventListener('click',e=>{if(replay||e.defaultPrevented||e.button!==0)return;const button=e.target.closest?.(selector);if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;e.preventDefault();e.stopImmediatePropagation();if(mhNavigationFade)return;mhScreenTransition(()=>{replay=true;try{button.click();}finally{replay=false;}}).catch(console.error);},true);
 document.addEventListener('keydown',e=>{if(replay||e.defaultPrevented||e.key!=='Escape'||document.querySelector('.modal-backdrop,dialog[open]')||e.target.matches?.('input,textarea,select'))return;if(!document.querySelector('.page,.tower-screen'))return;e.preventDefault();e.stopImmediatePropagation();mhScreenTransition(()=>{replay=true;try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));}finally{replay=false;}}).catch(console.error);},true);
}
