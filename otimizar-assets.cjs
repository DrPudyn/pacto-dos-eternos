const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
function optimizeAssets(root){
 const candidates=[process.env.MINIHERO_PYTHON,process.env.USERPROFILE&&path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'),'python'].filter(Boolean);
 for(const python of candidates){try{execFileSync(python,['-c','from PIL import Image'],{stdio:'ignore',windowsHide:true});}catch{continue;}execFileSync(python,[path.join(__dirname,'otimizar-imagens.py'),root],{stdio:'inherit',windowsHide:true});return;}
 console.warn('Pillow não disponível: imagens originais preservadas; as variantes existentes continuam utilizáveis.');
}
module.exports={optimizeAssets};
