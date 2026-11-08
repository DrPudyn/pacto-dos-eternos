// Shrink and rename the shipped browser bundle. No eval/new Function:
// the page CSP allows wasm-unsafe-eval only, so the output must stay plain script.
const fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const KEYWORDS=new Set('break case catch class const continue debugger default delete do else export extends false finally for function if import in instanceof let new null return static super switch this throw true try typeof var void while with yield await of'.split(' '));
const PUNCS=['>>>=','===','!==','>>>','<<=','>>=','**=','&&=','||=','??=','==','!=','<=','>=','=>','++','--','&&','||','??','?.','<<','>>','**','+=','-=','*=','/=','%=','&=','|=','^=','<','>','=','!','~','?',':','.',',',';','(',')','[',']','{','}','+','-','*','/','%','&','|','^'];
const EXPR_END=new Set([')',']','}','++','--']);
const CONTINUES=new Set(['(',')','[',']','{','}','.','?.',',',';',':','=>','=','+=','-=','*=','/=','%=','&=','|=','^=','&&=','||=','??=','==','===','!=','!==','<','>','<=','>=','&&','||','??','?','+','-','*','/','%','&','|','^','!','~','<<','>>','>>>','**','++','--']);
function isWord(value){return /^[A-Za-z0-9_$]+$/.test(value);}
function startsRegex(prev){
 if(!prev)return true;
 if(prev.k==='tmpl'&&prev.v.endsWith('${'))return true;
 if(prev.k==='num'||prev.k==='str'||prev.k==='tmpl'||prev.k==='regex')return false;
 if(prev.k==='punc')return !EXPR_END.has(prev.v);
 if(prev.k==='word')return KEYWORDS.has(prev.v)&&!new Set(['this','true','false','null','super']).has(prev.v);
 return true;
}
function tokenize(code){
 const tokens=[],n=code.length;let i=0,pendingNl=false;
 const mode=['code'],exprDepth=[];
 const push=token=>{token.nl=pendingNl;pendingNl=false;tokens.push(token);};
 while(i<n){
  if(mode.at(-1)==='tmpl'){
   const start=i;let j=code[i]==='`'?i+1:i;
   while(j<n){
    if(code[j]==='\\'){j+=2;continue;}
    if(code[j]==='`'){push({k:'tmpl',v:code.slice(start,j+1)});i=j+1;mode.pop();break;}
    if(code[j]==='$'&&code[j+1]==='{'){push({k:'tmpl',v:code.slice(start,j+2)});i=j+2;mode[mode.length-1]='expr';exprDepth.push(1);break;}
    j++;
   }
   if(j>=n)throw Error('Template sem fim.');
   continue;
  }
  const c=code[i];
  if(c==='\n'){pendingNl=true;i++;continue;}
  if(c===' '||c==='\t'||c==='\r'||c==='\f'){i++;continue;}
  if(c==='/'&&code[i+1]==='/'){i+=2;while(i<n&&code[i]!=='\n')i++;continue;}
  if(c==='/'&&code[i+1]==='*'){i+=2;while(i<n&&!(code[i]==='*'&&code[i+1]==='/')){if(code[i]==='\n')pendingNl=true;i++;}i+=2;continue;}
  if(c==='\''||c==='"'){const q=c;let j=i+1;while(j<n){if(code[j]==='\\'){j+=2;continue;}if(code[j]==='\n')throw Error('Quebra de linha dentro de texto.');if(code[j]===q)break;j++;}if(code[j]!==q)throw Error('Texto sem fim.');push({k:'str',v:code.slice(i,j+1)});i=j+1;continue;}
  if(c==='`'){mode.push('tmpl');continue;}
  if(mode.at(-1)==='expr'&&(c==='{'||c==='}')){
   if(c==='{')exprDepth[exprDepth.length-1]++;
   else{exprDepth[exprDepth.length-1]--;if(exprDepth[exprDepth.length-1]===0){exprDepth.pop();mode[mode.length-1]='tmpl';continue;}}
  }
  const prev=tokens[tokens.length-1];
  if(c==='/'&&startsRegex(prev)){let j=i+1,cls=false;while(j<n){if(code[j]==='\\'){j+=2;continue;}if(code[j]==='\n')throw Error('Regex sem fim.');if(code[j]==='[')cls=true;else if(code[j]===']')cls=false;else if(code[j]==='/'&&!cls)break;j++;}if(code[j]!=='/')throw Error('Regex sem fim.');j++;while(/[a-z]/i.test(code[j]??''))j++;push({k:'regex',v:code.slice(i,j)});i=j;continue;}
  if(/[0-9]/.test(c)||(c==='.'&&/[0-9]/.test(code[i+1]??''))){let j=i;if(/^0[xXoObB]/.test(code.slice(i,i+2)))j+=2;while(j<n&&(/[0-9a-fA-F_]/.test(code[j])||(code[j]==='.'&&/[0-9]/.test(code[j+1]??''))||((code[j]==='e'||code[j]==='E')&&/[0-9+-]/.test(code[j+1]??''))||((code[j]==='+'||code[j]==='-')&&(code[j-1]==='e'||code[j-1]==='E'))))j++;if(code[j]==='n')j++;push({k:'num',v:code.slice(i,j)});i=j;continue;}
  if(/[\p{ID_Start}$_]/u.test(c)){let j=i+1;while(j<n&&/[\p{ID_Continue}$]/u.test(code[j]))j++;push({k:'word',v:code.slice(i,j)});i=j;continue;}
  const punc=PUNCS.find(item=>code.startsWith(item,i));
  if(!punc)throw Error('Símbolo não reconhecido perto de '+JSON.stringify(code.slice(i,i+12)));
  push({k:'punc',v:punc});i+=punc.length;
 }
 if(mode.length!==1)throw Error('Template sem fim.');
 return tokens;
}
function canEnd(token){
 if(!token)return false;
 if(token.k==='num'||token.k==='str'||token.k==='tmpl'||token.k==='regex')return true;
 if(token.k==='word')return !KEYWORDS.has(token.v)||['this','true','false','null','super','break','continue'].includes(token.v);
 if(token.k==='punc')return EXPR_END.has(token.v);
 return false;
}
function needsSemi(prev,token){
 if(!token.nl||!prev)return false;
 if(prev.k==='tmpl'&&prev.v.endsWith('${'))return false;
 if(token.k==='word'&&(token.v==='else'||token.v==='catch'||token.v==='finally'))return false;
 if(token.v==='while'&&prev.v==='}')return false;
 if(prev.k==='word'&&['return','throw','break','continue','yield'].includes(prev.v))return true;
 if((token.v==='++'||token.v==='--')&&canEnd(prev))return true;
 if((prev.v==='++'||prev.v==='--')&&(token.k==='word'||token.k==='num'||token.k==='str'||token.k==='tmpl'||token.k==='regex'||token.v==='('||token.v==='['||token.v==='{'||token.v==='/'||token.v==='!'||token.v==='~'||token.v==='+'))return true;
 if(prev.k==='punc'&&CONTINUES.has(prev.v)&&prev.v!=='++'&&prev.v!=='--'&&prev.v!=='}'&&prev.v!==')'&&prev.v!==']')return false;
 if(token.k==='punc'&&['(', '[', '.', '?.', ',', ';', '=>'].includes(token.v))return false;
 return canEnd(prev)&&(token.k!=='punc'||token.v==='/'||token.v==='!'||token.v==='~'||token.v==='+'||token.v==='-'||token.v==='{'||token.v==='['||token.v==='(');
}
function needsSpace(prev,token){
 if(!prev)return false;
 if(isWord(prev.v)&&isWord(token.v))return true;
 const pair=prev.v.slice(-1)+token.v[0];
 if(['?.','??','++','--','==','!=','<=','>=','&&','||','+=','-=','*=','/=','%=','&=','|=','^=','<<','>>','**','=>','/*','*/','//'].includes(pair))return true;
 return false;
}
function obfuscate(code){
 const tokens=tokenize(code),used=new Set(tokens.filter(token=>token.k==='word').map(token=>token.v));
 const protectedNames=new Set();
 for(const token of tokens)if(token.k==='str'||token.k==='tmpl'||token.k==='regex'){for(const match of token.v.matchAll(/\b(?:mh[A-Z]|miniHero)[A-Za-z0-9_]*/g))protectedNames.add(match[0]);}
 const names=[...new Set(tokens.filter(token=>token.k==='word'&&/^(?:mh[A-Z]|miniHero)[A-Za-z0-9_]*$/.test(token.v)&&!protectedNames.has(token.v)).map(token=>token.v))].sort((a,b)=>b.length-a.length);
 const map=new Map();let serial=0;
 for(const name of names){let next;do{next='m'+serial.toString(36);serial++;}while(used.has(next)||KEYWORDS.has(next));used.add(next);map.set(name,next);}
 let out='',prev=null;
 for(const token of tokens){
  const value=token.k==='word'&&map.has(token.v)?map.get(token.v):token.v;
  const emitted={...token,v:value};
  if(out){if(needsSemi(prev,token))out+=';';else if(needsSpace(prev,emitted))out+=' ';}
  out+=value;prev=emitted;
 }
 return out;
}
function obfuscateFile(file){
 const source=fs.readFileSync(file,'utf8'),output=obfuscate(source),tmp=path.join(os.tmpdir(),'pacto-obf-'+crypto.randomBytes(4).toString('hex')+'.js');
 fs.writeFileSync(tmp,output);
 const moduleFile=/\b(?:import|export)\b/.test(output);
 const check=spawnSync(process.execPath,moduleFile?['--check','--input-type=module']:['--check',tmp],{input:moduleFile?output:undefined,encoding:'utf8'});
 if(check.status!==0){fs.unlinkSync(tmp);throw Error('A ofuscação quebrou '+file+': '+(check.stderr||check.stdout));}
 // No Windows, rename não substitui um arquivo existente (EPERM/EEXIST).
 try{fs.renameSync(tmp,file);}catch(e){if(e.code!=='EPERM'&&e.code!=='EEXIST'&&e.code!=='EBUSY')throw e;fs.copyFileSync(tmp,file);fs.unlinkSync(tmp);}
 const before=source.length,after=output.length;
 console.log('Cliente ofuscado: '+file+' ('+before+' → '+after+' bytes).');
}
module.exports={obfuscate,obfuscateFile};
