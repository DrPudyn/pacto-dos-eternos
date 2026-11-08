const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {promisify}=require('node:util');
const brotli=promisify(zlib.brotliCompress),gzip=promisify(zlib.gzip);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const FIXED_ASSETS=new Set(['/compartilhado.html','/shared.css','/icon-192.png','/icon-512.png','/manifest.webmanifest','/mapa-vivo.html']);
const SHARED_BUILD=/^\/shared-build\/[A-Za-z0-9_.-]+$/;
const MAPA_VIVO=/^\/mapa-vivo(?:\/[A-Za-z0-9_-]+)+\.(?:mjs|js|css|png|json|webp)$/;
function allowedAsset(name){
 if(typeof name!=='string'||name.length>200||!name.startsWith('/'))return false;
 if(name.includes('..')||name.includes('\\')||name.includes('\0')||name.includes('%'))return false;
 return FIXED_ASSETS.has(name)||SHARED_BUILD.test(name)||MAPA_VIVO.test(name);
}
function acceptsEncoding(header,name){return (header??'').split(',').some(part=>{const [token,...params]=part.trim().toLowerCase().split(';');const quality=params.find(p=>p.trim().startsWith('q='));return token.trim()===name&&(!quality||Number(quality.trim().slice(2))>0);});}
function staticAssets(root,{maxBytes=64*1024*1024}={}){
 const cache=new Map(),pending=new Map();let used=0;
 async function read(file,stat,encoding){
  const key=file+':'+stat.mtimeMs+':'+stat.size+':'+encoding;
  if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
  if(pending.has(key))return pending.get(key);
  const job=(async()=>{let data=await fs.promises.readFile(file);if(encoding==='br')data=await brotli(data,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:4}});else if(encoding==='gzip')data=await gzip(data,{level:4});
   if(data.length<=maxBytes){while(used+data.length>maxBytes&&cache.size){const oldest=cache.keys().next().value;used-=cache.get(oldest).length;cache.delete(oldest);}cache.set(key,data);used+=data.length;}return data;})();
  pending.set(key,job);try{return await job;}finally{pending.delete(key);}
 }
 const rootResolved=path.resolve(root);
 function miss(res,status){res.writeHead(status,{'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Referrer-Policy':'same-origin'});res.end();}
 return async function serve(req,res,name){
  if(!allowedAsset(name)){miss(res,404);return;}
  if(!['GET','HEAD'].includes(req.method)){miss(res,405);return;}
  try{
   let file=path.resolve(path.join(root,name));
   if(file!==rootResolved&&!file.startsWith(rootResolved+path.sep)){miss(res,404);return;}
   let stat=await fs.promises.stat(file);if(!stat.isFile()){miss(res,404);return;}
   let ext=path.extname(file);
   if(ext==='.png'&&/image\/webp/i.test(req.headers.accept??'')){
    const variant=file.slice(0,-4)+'.webp';try{const webp=await fs.promises.stat(variant);if(webp.mtimeMs>=stat.mtimeMs&&webp.size<stat.size){file=variant;stat=webp;ext='.webp';}}catch{}
   }
   const accepted=req.headers['accept-encoding']??'',compressible=['.html','.js','.mjs','.css','.json','.webmanifest'].includes(ext),encoding=compressible&&stat.size>1024?(acceptsEncoding(accepted,'br')?'br':acceptsEncoding(accepted,'gzip')?'gzip':''):'';
   const etag='W/"'+stat.size.toString(16)+'-'+Math.trunc(stat.mtimeMs).toString(16)+'-'+ext.slice(1)+'-'+encoding+'"';
   const headers={'Content-Type':types[ext]??'application/octet-stream','Cache-Control':['.png','.webp','.woff2','.mp3'].includes(ext)?'public, max-age=300, must-revalidate':'no-cache',ETag:etag,'Last-Modified':stat.mtime.toUTCString(),Vary:'Accept, Accept-Encoding','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin','X-Permitted-Cross-Domain-Policies':'none','Content-Security-Policy':"default-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"};
   if((req.headers['x-forwarded-proto']??'')==='https')headers['Strict-Transport-Security']='max-age=15552000';
   if(encoding)headers['Content-Encoding']=encoding;
   if(req.headers['if-none-match']?.split(',').map(x=>x.trim()).includes(etag)){res.writeHead(304,headers);res.end();return;}
   const data=await read(file,stat,encoding);headers['Content-Length']=data.length;res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:data);
  }catch(e){miss(res,e.code==='ENOENT'||e.code==='ENOTDIR'||e.code==='EISDIR'?404:500);}
 };
}
module.exports={staticAssets,acceptsEncoding,allowedAsset};
