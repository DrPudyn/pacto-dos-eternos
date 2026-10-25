const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('original-publico/app.js','utf8');
const core=src.slice(src.indexOf('var zt='),src.indexOf('function z(e,t)'));
const combat='var '+src.slice(src.indexOf('Os=Array.from'),src.indexOf('var Ec='));
let store=new Map(),lastPacket;
const el=()=>({style:{},append(){}});
const ctx={console,structuredClone,crypto:require('crypto').webcrypto,Date,Math,Set,Map,Uint8Array,Float64Array,Int32Array,BigInt,_:1e9,v:()=>null,r:{token:{decimals:6}},l:()=> 'mainnet',window:{addEventListener(){}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},document:{createElement:el,getElementById:el,body:el()},setInterval(){},sT:{start:()=>({applyPacket:p=>lastPacket=p,onStatus(){}})}};
vm.createContext(ctx);vm.runInContext(core+'\n'+combat,ctx);
let adapter=fs.readFileSync('offline-adapter.js','utf8').replace('const badge=document.createElement', 'window.test={action,pay,advance,player,live,get balance(){return balance;}};const badge=document.createElement');
vm.runInContext(adapter,ctx);
(async()=>{
 const t=ctx.window.test;assert.equal(t.player.heroes.length,3);
 t.player.heroes[0].atk=200;t.player.heroes[0].dur=120;t.player.heroes[0].durability=600;
 await t.action('heroes/activate',{heroId:1});assert.equal(t.player.heroes[0].status,'working');
 t.live.startedAt-=240000;t.advance();assert.ok(t.live.battle.tick>=7200);assert.ok(t.live.battle.kills>0);assert.ok(t.player.chest>0);
 let before=t.balance;let buy=await t.pay('summon-1');assert.equal(buy.status,'paid');assert.equal(t.balance,before-25000e6);assert.equal(t.player.heroes.length,4);assert.equal(lastPacket.minted.length,1);
 // Four idle heroes fuse into one next-rarity hero, at the original client price.
 for(const h of t.player.heroes){h.rarity=0;}await t.action('heroes/deactivate',{heroId:1});await t.action('fusion/choose',{heroIds:t.player.heroes.map(h=>h.id)});
 let f=await t.pay('fusion');assert.equal(f.status,'paid');assert.equal(t.player.heroes.length,1);assert.ok(t.player.heroes[0].rarity>=1);
 let state=JSON.parse(store.get('minihero.offline.v1'));assert.equal(state.player.heroes.length,1);assert.ok(state.battle.tick>0);
 let restored=ctx.gc;vm.runInContext(adapter,ctx);assert.equal(ctx.window.test.player.heroes.length,1);
 // Porter must place a damaged active hero in the forge and return it at 80%.
 const p=ctx.window.test;
 await p.pay('porter');await p.pay('blacksmith-1');await p.action('porter/switch',{on:true});
 const hero=p.player.heroes[0];hero.status='resting';hero.durability=1;hero.forgeSince=null;
 p.live.startedAt-=2000;p.advance();assert.ok(hero.forgeSince!==null,'Porter must assign damaged hero to forge');
 hero.durability=hero.dur*5*.8;hero.status='resting';
 p.live.startedAt-=2000;p.advance();assert.equal(hero.status,'working','Porter must send repaired hero to work');
 assert.ok(p.live.battle.activeHeroIds().has(hero.id));
 console.log('OK: Porter encaminha para forja e devolve ao combate com 80% de durabilidade.');
 console.log('OK: combate real, recompensas, invocacao, debito, fusao e restauracao do save.');
})().catch(e=>{console.error(e);process.exitCode=1;});

