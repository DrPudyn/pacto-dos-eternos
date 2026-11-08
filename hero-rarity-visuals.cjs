function applyRarityClothes(source){const replace=(a,b)=>{if(!source.includes(a))throw Error('Rarity clothes patch missing: '+a.slice(0,90));source=source.replace(a,b);};
 replace('function lb(e,t){','function lb(e,t,rarity){');
 replace('return ub(W(`heroes/${n}-idle.png`),','return ub(mhHeroRarityUrl(n,`idle`,rarity),');
 replace('a=ub(W(`heroes/${tn(e.skin)?e.skin:`swordsman`}-idle.png`),','a=ub(mhHeroRarityUrl(tn(e.skin)?e.skin:`swordsman`,`idle`,e.rarity),');
 source=source.replaceAll('lb(e.skin,3)','lb(e.skin,3,e.rarity)').replaceAll('lb(e.hero.skin,3)','lb(e.hero.skin,3,e.hero.rarity)');
 replace('i.sprite.texture=this.crop(`heroes/${l}-attack`,n*32,t*32,32,32)','i.sprite.texture=mhRarityCrop(this,`heroes/${l}-attack`,e.rarity,n*32,t*32,32,32)');
 replace('i.sprite.texture=this.crop(`heroes/${l}-${r}`,s*32,n*32,32,32)','i.sprite.texture=mhRarityCrop(this,`heroes/${l}-${r}`,e.rarity,s*32,n*32,32,32)');
 replace('i.container.zIndex=i.container.y;let o=','i.container.zIndex=i.container.y;mhMythicTrail(this,i,e,t);mhRarityAura(this,i,e,t);let o=');
 replace('if(a.spark.clear(),!a.impact','if(a.spark.clear(),mhMythicCritical(this,a,r,i),!a.impact');
 return source;
}
module.exports={applyRarityClothes};
