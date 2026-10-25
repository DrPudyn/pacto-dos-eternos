function mhFitShopPage(page){
 if(!page?.matches('.page')||!['ARMAMENTOS','SUMMON','BLACKSMITHS','AJUDANTE ORC','AJUDANTE','PORTER'].includes(page.getAttribute('aria-label')))return;
 page.style.overflow='clip';page.style.overscrollBehavior='none';
 let content=page.querySelector(':scope > .mh-fixed-shop');
 if(!content){content=document.createElement('div');content.className='mh-fixed-shop';content.style.cssText='display:flow-root;overflow:clip;margin:0 auto;';content.append(...page.childNodes);page.append(content);page.addEventListener('wheel',event=>event.preventDefault(),{passive:false});}
 content.style.zoom='1';content.style.width='100%';
 const styles=getComputedStyle(page),height=page.clientHeight-parseFloat(styles.paddingTop)-parseFloat(styles.paddingBottom),availableWidth=page.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight);
 // Grids have a minimum readable width. Include their overflow before scaling,
 // otherwise narrow screens crop the right-hand buttons instead of fitting them.
 const width=Math.max(content.offsetWidth,content.scrollWidth);
 content.style.width=width+'px';const naturalHeight=content.offsetHeight;
 content.style.zoom=String(Math.min(1,height/Math.max(1,naturalHeight),availableWidth/Math.max(1,width)));page.scrollTop=0;
}
window.addEventListener('resize',()=>document.querySelectorAll('.page').forEach(mhFitShopPage));
