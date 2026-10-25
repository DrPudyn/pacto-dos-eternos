const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const file of ['minihero-offline/build/app-0-_Askj9.js','minihero-offline/shared-build/app-0-_Askj9.js']){
 const source=fs.readFileSync(file,'utf8'),start=source.indexOf('clearActors(){'),end=source.indexOf('resize(e){',start);
 assert.ok(start>=0&&end>start);const method=vm.runInNewContext('({'+source.slice(start,end)+'})').clearActors;
 const live=new Set();function sprite(){const s={destroy(){live.delete(s);}};live.add(s);return s;}
 const number={text:sprite(),spark:sprite(),impact:{sprite:sprite()},burst:{sprite:sprite()}};
 const renderer={heroes:new Map([['hero',{container:sprite()}]]),monsters:new Map([['monster',{container:sprite()}]]),arrows:new Map([['arrow',sprite()]]),numbers:new Map([['hit',number]]),coinPopups:new Map([['coin',sprite()]])};
 method.call(renderer);assert.equal(live.size,0,'Efeitos de área devem ser removidos ao recriar a cena');assert.equal(renderer.numbers.size,0);
}
console.log('OK: a limpeza da cena remove impacto, brilho, texto, projétil, moedas e efeito de área nas duas versões.');
