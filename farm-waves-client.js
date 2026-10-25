function mhFarmWaveBiome(state){const index=((state.farmWave??1)-1)%pr.length;return {index,biome:pr[index],darkness:.16,cast:null,element:pr[index].element,swap:state.farmWave??1};}
function mhFarmWaveVisual(renderer,state,time){
 if(!state.farmWavesEnabled){if(renderer.farmCurtain)renderer.farmCurtain.visible=false;return;}
 if(!renderer.farmCurtain){renderer.farmCurtain=new nm();renderer.world.addChild(renderer.farmCurtain);}
 const clear=state.farmWaveClearAt,started=state.farmWaveStartedAt??0;
 const alpha=clear!=null?Math.min(1,Math.max(0,(time-clear-.65)/.75)):started>0?Math.max(0,1-(time-started)/.65):0;
 const g=renderer.farmCurtain;g.clear();g.visible=alpha>0;if(alpha>0)g.rect(0,0,jy,My).fill({color:0x07101c,alpha});
}
