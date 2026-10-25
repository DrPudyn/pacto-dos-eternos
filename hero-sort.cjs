function applyHeroSort(source){
 const patch=(from,to)=>{if(!source.includes(from))throw Error('Ordenação: trecho não encontrado.');source=source.replace(from,to);};
 const keys=['atk','atkSpd','dur'],labels=['Ataque','Velocidade de ataque','Durabilidade'];
 patch('ms={stats:', 'ms={'+keys.flatMap(key=>['desc','asc'].map(dir=>`${key}_${dir}:(e,t)=>${dir==='desc'?`t.${key}-e.${key}`:`e.${key}-t.${key}`}||e.id-t.id,`)).join('')+'stats:');
 patch('return i.sort((e,t)=>vs[e.status]-vs[t.status]||o(e,t))','return i.sort((e,t)=>/^(atk|atkSpd|dur)_/.test(n)?o(e,t):vs[e.status]-vs[t.status]||o(e,t))');
 patch('[`newest`,`NEWEST`]]','[`newest`,`NEWEST`],'+keys.flatMap((key,i)=>['desc','asc'].map(dir=>JSON.stringify([key+'_'+dir,labels[i]+(dir==='desc'?' ↓':' ↑')]))).join(',')+']');
 const start=source.indexOf('function sC(){'),end=source.indexOf('function cC(',start);
 if(start<0||end<0)throw Error('Cabeçalho de heróis não encontrado.');
 source=source.slice(0,start)+`function sC(panel){let icon=(key,label)=>J('button',{class:'mh-roster-sort',html:Z(key,'icon',2),attrs:{type:'button',title:label,'aria-label':'Ordenar por '+label,'aria-pressed':String(WS.startsWith(key+'_'))},on:{click:()=>{WS=WS===key+'_desc'?key+'_asc':key+'_desc';panel.refresh();}}});return J('div',{class:'roster-row roster-head'},J('span'),J('span',{text:'Hero'}),icon('atk','Ataque'),icon('atkSpd','Velocidade de ataque'),icon('dur','Durabilidade'),J('span',{text:'Skills'}),J('span',{text:'Weapon'}));}`+source.slice(end);
 patch('sC(),...l.map','sC(n),...l.map');
 return source;
}
module.exports={applyHeroSort};
