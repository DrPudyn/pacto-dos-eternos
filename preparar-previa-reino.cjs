const fs=require('fs'),path=require('path');
for(const out of ['minihero-offline/build','minihero-offline/shared-build']){
 fs.mkdirSync(out,{recursive:true});
 for(const name of ['realm-preview.html','realm-preview.css','realm-preview.js'])fs.copyFileSync(path.join('previa-reino',name),path.join(out,name));
 fs.copyFileSync('assets/realm-demon-preview-v3.png',path.join(out,'realm-demon-preview-v3.png'));
}
console.log('Prévia isolada: http://127.0.0.1:17841/shared-build/realm-preview.html');
for(const out of ["minihero-offline/build","minihero-offline/shared-build"])fs.copyFileSync("assets/realm-sky.png",path.join(out,"realm-sky.png"));
