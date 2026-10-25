const assert=require('node:assert/strict');
const {mhCampaignATB}=require('./campaign-atb.js'),cfg=require('./campaign-config.cjs'),gear=require('./equipment-rules.cjs');
function battle(skills=[],levels={},extra={}) {return new mhCampaignATB([{heroId:1,skin:'archer',rarity:4,damage:100,window:1,maxDurability:500,durability:500,critChance:0,skills,skillLevels:levels,...extra}],cfg.stages[0],123);}
function hit(b){const h=b.units[0];h.pending={skill:'attack'};b.act(h);return b.events.at(-1).values[0];}
assert.equal(hit(battle()),hit(battle(['blacksmith','swift'],{blacksmith:3,swift:3})), 'Passivas de repouso e movimento não concedem dano genérico');
assert(hit(battle(['enemyDamage'],{enemyDamage:3}))>hit(battle(['enemyDamage'],{enemyDamage:0})));
const p=battle(['precision'],{precision:3});p.random=()=>0;hit(p);assert.equal(p.units[0].energy,500);
const f=battle(['fury'],{fury:3});f.units.filter(u=>u.side==='enemy').forEach(u=>u.hp=u.maxHp=99999);hit(f);hit(f);assert.equal(f.units[0].attacks,2);f.units[1].hp=0;hit(f);assert.equal(f.units[0].attacks,1);
assert(Math.abs(gear.bonus({rarity:4,level:10}).attack-.72)<1e-9);
console.log('OK: passivas específicas, níveis, precisão, fúria por alvo e armas +10.');

