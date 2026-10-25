const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createEngine}=require('./shared-engine.cjs');
const source=fs.readFileSync('minihero-offline/shared-build/app-0-_Askj9.js','utf8');
const core=source.slice(source.indexOf('var zt='),source.indexOf('function z(e,t)'));
const combat='var '+source.slice(source.indexOf('Os=Array.from'),source.indexOf('var Ec='));
function browserBattle(state){const context={Math,Date,Set,Map,Uint8Array,Float64Array,Int32Array,BigInt,_:1e9,v:()=>null,r:{token:{decimals:6}},l:()=> 'mainnet',STATE:structuredClone(state)};vm.createContext(context);return new vm.Script(core+'\n'+combat+'\n gc.fromState(STATE)').runInContext(context,{timeout:5000});}
(async()=>{
 const e=createEngine(null).engine,base=structuredClone(e.player.heroes[0]);e.player.heroes=[{...base,id:1,rarity:5,skills:['swift'],skillLevels:{swift:3},atk:150,dur:100,durability:500,status:'idle'},{...base,id:2,rarity:0,skills:[],skillLevels:{},atk:15,dur:100,durability:500,status:'idle'}];
 await e.action('heroes/activate',{heroId:1});await e.action('heroes/activate',{heroId:2});
 const server=e.live.battle,client=browserBattle(server.toState());
 assert.equal(client.rarityMovementEnabled,true);assert.equal(client.skillKillXpEnabled,true);assert.equal(client.farmWavesEnabled,true);assert.equal(client.snapshot().rarityMovementEnabled,true);
 const end=server.tick+90;server.advanceTo(end);client.advanceTo(end);
 const positions=b=>b.heroes.map(h=>({id:h.state.id,x:h.state.x,y:h.state.y,action:h.state.action,xp:h.state.skillXpTicks}));
 assert.deepEqual(JSON.parse(JSON.stringify(positions(client))),JSON.parse(JSON.stringify(positions(server))),'Predição do navegador e servidor concordam com Mítico e Passos Rápidos máximos');
 const wave=createEngine(null).engine.live.battle;wave.heroes=[];const initial=wave.monsterSeq;
 for(const mob of wave.monsters.slice(0,20)){mob.hp=0;mob.dead=true;mob.hitAt=wave.elapsed;}wave.advanceTo(wave.tick+30);
 assert.equal(wave.monsterSeq,initial,'Vinte mortes parciais não geram reposições');assert.equal(wave.monsters.length,8,'Cadáveres somem após a animação');
 for(const mob of wave.monsters){mob.hp=0;mob.dead=true;mob.hitAt=wave.elapsed;}wave.advanceTo(wave.tick+1);assert.notEqual(wave.farmWaveClearAt,null);
 const paused=browserBattle(wave.toState());const next=wave.tick+62;wave.advanceTo(next);paused.advanceTo(next);
 assert.equal(wave.farmWave,2);assert.equal(wave.monsters.filter(m=>!m.dead).length,28);assert.equal(wave.respawns,1);assert.equal(paused.farmWave,2);
 assert.deepEqual(JSON.parse(JSON.stringify(paused.monsters)),JSON.parse(JSON.stringify(wave.monsters)),'Retomar durante a transição gera a mesma leva');
 for(let i=0;i<19;i++){for(const mob of wave.monsters){mob.hp=0;mob.dead=true;mob.hitAt=wave.elapsed;}wave.advanceTo(wave.tick+63);}
 assert.equal(wave.respawns,20);assert.equal(wave.monsters.filter(m=>m.boss&&!m.dead).length,1,'Boss natural continua aparecendo na vigésima renovação');
 const noWave=browserBattle({...wave.toState(),farmWavesEnabled:false,rarityMovementEnabled:false});assert.equal(noWave.snapshot().farmWavesEnabled,false);
 console.log('OK: predição sincronizada, velocidade mítica preservada, cadáveres removidos, nenhuma reposição parcial, transição persistida, nova leva completa e boss a cada 20 renovações.');
})().catch(error=>{console.error(error);process.exitCode=1;});
