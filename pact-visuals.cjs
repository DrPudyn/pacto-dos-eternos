function applyPacts(source){
 const from=source.indexOf('function Mx('),to=source.indexOf('var Nx=',from);if(from<0||to<0)throw Error('Revelação original não encontrada.');
 source=source.slice(0,from)+'function Mx(e,t){mhPactReveal(e,t)}'+source.slice(to);
 const waitFrom=source.indexOf('function Ax('),waitTo=source.indexOf('function jx(',waitFrom);if(waitFrom<0||waitTo<0)throw Error('Espera da invocação não encontrada.');source=source.slice(0,waitFrom)+'function Ax(e){jx();}'+source.slice(waitTo);
 // Redirect the asset registry too, covering purchase, chest, fusion and menu images.
 for(const [old,next]of [['card-back','pact-seal.png'],['summon-cards','pact-book.png'],['summon-envelope','pact-book.png']]){
  const pattern=new RegExp('new URL\\(`'+old+'-[^`]+\\.png`,import.meta.url\\)','g');
  if(!pattern.test(source))throw Error('Asset de pacto não encontrado: '+old);
  source=source.replace(pattern,'new URL(`'+next+'`,import.meta.url)');
 }
 source=source.replaceAll('Z(`card`,','mhPactIcon(');
 return source;
}
module.exports={applyPacts};
