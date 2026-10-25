function applyAssistant(source){
 const sprites=[
  ['J(`span`,{class:`porter-loop`})','mhAssistantSprite()'],
  ['J(`img`,{class:`porter-sprite`,attrs:{src:W(`ui/porter.png`),alt:``}})','mhAssistantSprite()'],
  ['J(`img`,{class:`shortcut-porter`,attrs:{src:W(`ui/porter.png`),alt:``}})','mhAssistantSprite("shortcut-porter")'],
  ['J(`img`,{class:`market-porter-face`,attrs:{src:W(`ui/porter.png`),alt:``}})','mhAssistantSprite("market-porter-face")']
 ];
 for(const [from,to]of sprites){if(!source.includes(from))throw Error('Visual do ajudante não encontrado: '+from);source=source.replaceAll(from,to);}
 source=source.replace('function Ux(e){','function Ux(e){if(e.kind===`porter`)return J(`span`,{class:`buy-art buy-art-porter`},mhAssistantSprite());');
 return source;
}
module.exports={applyAssistant};
