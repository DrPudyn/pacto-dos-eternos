const assert=require('assert/strict');
const {createEngine}=require('./shared-engine.cjs');
(async()=>{
 const run=createEngine(null,{random:()=>.9}),e=run.engine;
 assert.ok(e.player.heroes.every(h=>h.skin==='mage'&&h.range===3));
 const hero=e.player.heroes[0];hero.atk=200;hero.dur=120;hero.durability=600;
 assert.equal((await e.action('heroes/activate',{heroId:hero.id})).ok,true);
 e.live.startedAt-=240000;e.advance();assert.ok(e.live.battle.kills>0,'Mage projectile must deal damage');
 const saved=run.export(),restored=createEngine(saved);assert.equal(restored.engine.player.heroes[0].skin,'mage');
 await e.pay('summon-1');assert.equal(e.player.heroes.at(-1).skin,'mage');
 console.log('OK: mago invocado, ativado, combate com dano e salvamento restaurado.');
})().catch(e=>{console.error(e);process.exitCode=1;});
