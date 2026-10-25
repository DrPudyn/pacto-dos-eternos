const assert=require('node:assert/strict');
const {createEngine}=require('./shared-engine.cjs');
function fixture(){const e=createEngine(null).engine;const base=e.player.heroes[0];e.player.heroes=[];e.player.blacksmiths=[{id:900,tier:6},{id:901,tier:1}];e.player.blacksmithInService=900;e.player.porters=[{id:902}];e.player.porterOn=true;let id=1;const add=(fields={})=>{const h={...structuredClone(base),id:id++,skin:'swordsman',rarity:1,atk:40,atkSpd:40,dur:100,durability:100,status:'resting',forgeSince:null,restingSince:1,skills:[],skillLevels:{},...fields};e.player.heroes.push(h);return h;};return {e,add};}
async function step(e){e.live.startedAt-=1000;await e.action('state');}
(async()=>{
 const {e,add}=fixture();for(let i=0;i<15;i++)add({status:'working',durability:500});
 const epic=add({id:257,rarity:3,atk:109,atkSpd:112,dur:104,durability:501});
 const strong=add({rarity:3,atk:108,durability:100});for(let i=0;i<19;i++)add({atk:20+i,durability:100});
 const full=add({durability:500});await step(e);
 assert.equal(epic.status,'working','Épico fora da forja com 96% substitui um trabalhador mais fraco');
 assert.equal(epic.forgeSince,null);assert.equal(e.player.heroes.filter(h=>h.status==='working').length,15);
 assert.notEqual(strong.forgeSince,null,'Herói forte abaixo de 80% recebe vaga');assert.equal(full.forgeSince,null,'Energia cheia não ocupa forja');
 assert.equal(e.player.heroes.filter(h=>h.forgeSince!==null).length,18,'Fila respeita as vagas das duas forjas');
 const slow=e.player.heroes.filter(h=>h.forgeSince!==null).sort((a,b)=>a.atk-b.atk)[0];
 const beforeStrong=strong.durability,beforeSlow=slow.durability;e.player.repairedAt=Date.now()-60000;await e.action('state');
 assert.ok(strong.durability-beforeStrong>16.9,'Mais forte recebe taxa da forja mais rápida');
 assert.ok(slow.durability-beforeSlow<2.1,'Mais fraco recebe taxa da forja mais lenta');
 const second=fixture();for(let i=0;i<15;i++)second.add({rarity:4,status:'working',durability:500});const waiting=second.add({durability:425});await step(second.e);assert.equal(waiting.status,'resting','Herói mais fraco não expulsa equipe mais forte');assert.notEqual(waiting.forgeSince,null,'Quem aguarda acima de 80% também pode reparar na forja');
 const off=fixture();off.e.player.porterOn=false;const h=off.add({durability:450});await step(off.e);assert.equal(h.status,'resting');assert.equal(h.forgeSince,null);
 const boundary=fixture();const at80=boundary.add({durability:400}),below80=boundary.add({durability:395});await step(boundary.e);assert.equal(at80.status,'working','80% exatos liberam o retorno');assert.equal(below80.status,'resting','Abaixo de 80% continua reparando');assert.notEqual(below80.forgeSince,null);
 const empty=fixture();for(let i=0;i<20;i++)empty.add({durability:450,atk:100-i});await step(empty.e);assert.equal(empty.e.player.heroes.filter(h=>h.status==='working').length,15,'Preenche até 15 vagas sem trocar os recém-enviados por mais fracos');
 console.log('OK: retorno fora da forja aos 80%, substituição por força, limite 15, vagas de reparo, forja rápida para os mais fortes, espera acima de 80%, energia cheia e Lúmina desligada.');
})().catch(e=>{console.error(e);process.exitCode=1;});
