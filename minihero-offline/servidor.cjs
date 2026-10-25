const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname,port=17840;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg','.json':'application/json'};
http.createServer((req,res)=>{
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);return res.end();}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 if(file===root)file=path.join(root,'index.html');
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; media-src 'self' blob:"});res.end(data);});
}).listen(port,'127.0.0.1',()=>console.log('Mini Hero offline: http://127.0.0.1:'+port)).on('error',e=>{if(e.code==='EADDRINUSE')console.log('O jogo já está aberto em http://127.0.0.1:'+port);else console.error(e);});
