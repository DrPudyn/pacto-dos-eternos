// Run the same game rules in Node, with no browser or client-supplied outcomes.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
let source=require('./equipment-rules.cjs').applyCombatRules(require('./forge-rules.cjs').applyForgeRules(require('./skill-progression.cjs').applySkillProgression(require('./codex-rules.cjs').applyCombatRules(require('./economy-config.cjs').applyPrices(require('./hero-config.cjs').addMage(fs.readFileSync(path.join(__dirname,'original-publico/app.js'),'utf8')))))));
source=require('./hero-movement.cjs').applyMovementRules(source);
source=require('./farm-waves.cjs').applyWaveRules(source);
source=source.replace('e.chest+=r.mhdg-c,','e.chest+=Math.round((r.mhdg-c)*(e.campaignFarmMultiplier??1)*(1+(e.creatureFarmGoldBonus??0))),');
const core=source.slice(source.indexOf('var zt='),source.indexOf('function z(e,t)'));
const combat='var '+source.slice(source.indexOf('Os=Array.from'),source.indexOf('var Ec='));
let adapter=fs.readFileSync(path.join(__dirname,'offline-adapter.js'),'utf8');
adapter=adapter.slice(0,adapter.indexOf(" const accountActions=document.createElement"));
adapter=adapter.replace(/ if\(!grants\.[^\n]+\n/g,'');
adapter=adapter.replace(' let game;',' let game={applyPacket(){},onStatus(){}};');
adapter=adapter.replace('const grants={...(saved?.grants??{})};',"const grants={...(saved?.grants??{})};\n const stats={created:saved?.stats?.created??(saved?.player?.heroes?.length??0),fusions:saved?.stats?.fusions??0,legendary:saved?.stats?.legendary??(saved?.player?.heroes?.filter(h=>h.rarity===4).length??0),mythic:saved?.stats?.mythic??(saved?.player?.heroes?.filter(h=>h.rarity===5).length??0)};");
adapter=adapter.replace(' function makeHero(rarity){',' function makeHero(rarity){stats.created++;');
adapter=adapter.replace('  let [min,max]=Xt[rarity].stats', '  if(rarity===4)stats.legendary++;if(rarity===5)stats.mythic++;\n  let [min,max]=Xt[rarity].stats');
adapter=adapter.replace("else if(product==='fusion'){let rarity=", "else if(product==='fusion'){stats.fusions+=fusion.length/4;let rarity=");
adapter=adapter.replace('player,balance,nextId,grants,battle:', 'player,balance,nextId,grants,stats,battle:');
adapter+=` return {action,pay,packet,advance,save,upgradeSkill,createMarketHero(rarity){if(rarity!==4&&rarity!==5)throw Error("Raridade de consignação inválida.");const before={...stats},hero=makeHero(rarity);Object.assign(stats,before);return hero;},fusionPrice:rarity=>rarity>=0&&rarity<4?Zn(rarity,1).price:Infinity,forgeTick:at=>mhForgeAdvanceXp(player,at),forgeView:()=>mhForgeView(player,miniHeroCodexBonuses.repair??0),registerForge(tier,level){mhForgeRegister(player,tier,level);},activateForge(index){mhForgeActivate(player,index);},upgradeForge(tier,expectedLevel){advance();const value=mhForgeUpgrade(player,tier,expectedLevel,balance);balance-=value.coins*1e6;save();return value;},awardSkillXp:gains=>mhSkillAward(player,live.battle,gains),setCodexBonuses(value){miniHeroCodexBonuses=value;for(const h of live.battle.heroes)Object.assign(h.state,miniHeroCodexStats(h.state.rarity));},get player(){return player;},get live(){return live;},get balance(){return balance;},set balance(n){balance=n;},get nextId(){return nextId;},set nextId(n){nextId=n;},stats,export(){save();return JSON.parse(localStorage.getItem(KEY));}};\n}\nstartOffline();`;
const program=new vm.Script(core+'\n'+combat+'\n'+adapter);
function createEngine(state,options={}){
 const store=new Map();if(state)store.set('minihero.offline.v1',JSON.stringify(state));
 const math=Object.create(Math);math.random=options.random??Math.random;
 const context={console,structuredClone,crypto:crypto.webcrypto,Date,Math:math,Set,Map,Uint8Array,Float64Array,Int32Array,BigInt,_:1e9,v:()=>null,r:{token:{decimals:6}},l:()=> 'mainnet',localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},$:()=>{}};
 vm.createContext(context);const engine=program.runInContext(context,{timeout:5000});
 engine.setCodexBonuses(options.codexBonuses??{});
 const gear=require('./equipment-rules.cjs'),weaponCombat=vm.runInContext('mhWeaponCombat',context);
 engine.syncEquipment=()=>{gear.reconcile(engine.player);for(const a of engine.live.battle.heroes){const h=engine.player.heroes.find(h=>h.id===a.state.heroId);if(h)Object.assign(a.state,weaponCombat(h));}};
 engine.syncEquipment();
 const syncFarmMobPool=()=>{engine.live.battle.farmMobPool=require('./monster-visuals.cjs').farmMobPool(options.cleared?.());};
 syncFarmMobPool();
 engine.player.festivalBattleId??=crypto.randomUUID();
 if(options.onCombat){const battle=engine.live.battle,strike=battle.strike.bind(battle);battle.strike=(hero,monster,...args)=>{const dead=monster.dead;const out=strike(hero,monster,...args);if(!dead&&monster.dead)options.onCombat({stream:'dungeon:'+engine.player.festivalBattleId,sequence:battle.eventId,at:Math.floor(engine.live.startedAt+battle.elapsed*1000),kind:monster.kind,farmMob:!monster.boss?(()=>{const pool=require('./monster-visuals.cjs').farmMobPool(options.cleared?.());let hash=2166136261;for(const c of String(monster.id)+':'+String(monster.spawnedAt))hash=Math.imul(hash^c.charCodeAt(0),16777619);return pool[(hash>>>0)%pool.length];})():null,boss:!!monster.boss,artificial:!!monster.festivalExcluded});return out;};}
 let last=Date.now();
 return {engine,tick(){const now=Date.now();engine.forgeTick(now);if(now-last>30000){engine.live.startedAt=now-Math.floor(engine.live.battle.tick*1000/30);engine.player.repairedAt=now;}else{syncFarmMobPool();engine.advance();}last=now;},export:()=>engine.export()};
}
function createTowerBattle(team,floor,seed,state,codexBonuses={}){
 const {mapFor,tiersFor}=require('./tower-world.cjs'),tiers=tiersFor(floor);
 const context={Math,Date,Set,Map,Uint8Array,Float64Array,Int32Array,BigInt,_:1e9,CODEX_BONUSES:codexBonuses,TEAM:structuredClone(team),SEED:seed,STATE:state?structuredClone(state):null,TIERS:tiers};
 vm.createContext(context);
 const battle=new vm.Script(core+'\n'+combat+'\nvar tower=STATE?gc.fromState(STATE,TIERS):gc.start(SEED,TEAM.filter(h=>h.durability>=.5).map((h,i)=>ln(h,i)),TIERS);tower.respawn=()=>{};tower.rollBoss=()=>false;tower;').runInContext(context,{timeout:5000});
 if(!state){battle.monsters=battle.monsters.slice(0,Math.min(28,10+floor*2));if(floor%5===0){const hp=Math.round(100000*Math.pow(1.09,Math.min(200,floor-5)));battle.placeBoss(hp);const boss=battle.monsters.find(m=>m.boss);if(!boss)throw Error('Sem espaço para o Giant.');boss.maxHp=boss.hp;}}
 require('./tower-bestiary.cjs').assign(battle,floor,seed);
 return {battle,map:mapFor(floor)};
}
function createCampaignBattle(team,config,seed,state,codexBonuses={}){
 const context={Math,Date,Set,Map,Uint8Array,Float64Array,Int32Array,BigInt,_:1e9,CODEX_BONUSES:codexBonuses,TEAM:structuredClone(team),CFG:config,SEED:seed,STATE:state?structuredClone(state):null};
 vm.createContext(context);
 const battle=new vm.Script(fs.readFileSync(path.join(__dirname,'campaign-defense.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'campaign-tactics.js'),'utf8')+'\n'+core+'\n'+combat+`\n
 var campaign=STATE?gc.fromState(STATE):gc.start(SEED,TEAM.map((h,i)=>ln(h,i)));
 campaign.respawn=()=>{};campaign.rollBoss=()=>false;campaign.pendingBossHp=null;

 if(!STATE){
  campaign.monsters=campaign.monsters.slice(0,CFG.count);
  for(const m of campaign.monsters){m.hp=m.maxHp=CFG.hp;m.kind=CFG.kind;m.mhdg=(CFG.monsterGold??0)*1e6;m.boss=false;}
 }

 mhInstallCampaignTactics(campaign,CFG,STATE);
 mhCampaignDefense(campaign,CFG.bossDefense);
 campaign;`).runInContext(context,{timeout:5000});
 return battle;
}
function createCampaignATBBattle(team,config,seed,state,bonuses={}){const {mhCampaignATB}=require('./campaign-atb.js');if(state?.format==='atb-v1')return new mhCampaignATB([],config,seed,state);const native=createCampaignBattle(team,config,seed,null,bonuses);return new mhCampaignATB(native.heroes.map(h=>h.state),config,seed);}
module.exports={createEngine,createTowerBattle,createCampaignBattle,createCampaignATBBattle};
