const assert=require('assert/strict'),fs=require('fs');
const {smithPrices,porterPrice,summonPrice}=require('./economy-config.cjs');
const {createEngine}=require('./shared-engine.cjs');
(async()=>{
 const e=createEngine(null).engine;
 for(let i=0;i<smithPrices.length;i++){
  e.balance=2000000e6;const before=e.balance;
  assert.equal((await e.pay('blacksmith-'+(i+1))).status,'paid');
  assert.equal(before-e.balance,smithPrices[i]*1e6);
 }
 for(let i=0;i<2;i++){
  e.balance=2000000e6;const before=e.balance;
  assert.equal((await e.pay('porter')).status,'paid');
  assert.equal(before-e.balance,porterPrice*1e6);
 }
 for(const count of [1,5,10,15]){
  e.balance=2000000e6;const before=e.balance,heroes=e.player.heroes.length;
  assert.equal((await e.pay('summon-'+count)).status,'paid');
  assert.equal(before-e.balance,summonPrice*count*1e6);
  assert.equal(e.player.heroes.length,heroes+count);
 }
 for(const dir of ['build','shared-build']){
  const bundle=fs.readFileSync(`minihero-offline/${dir}/app-0-_Askj9.js`,'utf8');
  const table=bundle.slice(bundle.indexOf('On=['),bundle.indexOf('];function kn('));
  assert.deepEqual([...table.matchAll(/price:L\((\d+)\)/g)].map(m=>Number(m[1])),smithPrices);
  assert.ok(bundle.includes(`wn=L(${porterPrice}),Tn=L(0)`));
  assert.ok(bundle.includes(`fn=L(${summonPrice})`));
 }
 console.log('OK: ferreiros, Orc e quatro pacotes de invocação cobram os preços corretos; lojas offline e compartilhada correspondem ao servidor.');
})().catch(e=>{console.error(e);process.exitCode=1;});
