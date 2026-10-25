const {gzipSync}=require('node:zlib');
const {acceptsEncoding}=require('./static-assets.cjs');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {createEngine}=require('./shared-engine.cjs');
const codex=require('./codex-rules.cjs');
const weaponCodex=require('./weapon-codex.cjs');
const equipment=require('./equipment-rules.cjs');
const marketRules=require('./market-rules.cjs');
const MILLION=1e6;
function service(options={}){
 const dir=options.dir??path.join(__dirname,'dados-compartilhados');fs.mkdirSync(dir,{recursive:true});
 const file=path.join(dir,'jogadores.json');
 const store=require('./shared-store.cjs').sharedStore(dir),clock=options.now??Date.now;let db=store.load(),festival,handling=false;
 db.inviteCode??=crypto.randomBytes(6).toString('hex');
 const runtime=new Map(),attempts=new Map(),presence=new Map(),ticketAttempts=new Map(),chatRetentionMs=30*60*1000;
 db.tickets??=[];
 db.chatMessages??=[];const chatEpoch=crypto.randomUUID();let chatSequence=Math.max(0,...db.chatMessages.map(m=>m.id??0));
 function onlineSnapshot(user){const at=clock();presence.set(user.id,at);for(const [id,seen]of presence)if(at-seen>=300000)presence.delete(id);return {onlineCount:presence.size,online:db.users.filter(u=>presence.has(u.id)).map(u=>u.name),presenceAt:at};}
 const tower=require('./tower-service.cjs').towerService({onExperience:(user,gains)=>actor(user).awardSkillXp(gains),onCombat:(user,event)=>festival.combat(user,event),onFloor:(user,event)=>festival.tower(user,event)});
 function power(user){const heroes=runtime.get(user.id)?.engine.player.heroes??user.state?.player?.heroes??[];return [...heroes,...db.listings.filter(l=>l.seller===user.id&&l.hero&&l.source!=='caravan').map(l=>l.hero)].reduce((n,h)=>n+([1,3,10,35,120,400][h.rarity]??0),0);}
 function initFestival(){return require('./festival-service.cjs').festivalService(db,{now:clock,power,balance:u=>runtime.get(u.id)?.engine.balance??u.state?.balance??0,credit:(u,coins)=>{const e=runtime.get(u.id)?.engine;if(e)e.balance+=coins*MILLION;else u.state.balance+=coins*MILLION;}});}
 festival=initFestival();
 const campaign=require('./campaign-service.cjs').campaignService({actor,onBoss:(user,event)=>festival.combat(user,event),now:clock});

 function persist(){for(const [id,r]of runtime){const user=db.users.find(u=>u.id===id);if(user){codex.discover(user,r.engine.player.heroes);weaponCodex.discover(user,r.engine.player.equipment?.weapons);user.state=r.export();}}try{store.save(db);}catch(error){runtime.clear();tower.reset();campaign.reset();db=store.load();festival=initFestival();throw Error('A operação não pôde ser confirmada. Nenhum pagamento parcial foi mantido.');}}
 function pruneChat(at=clock()){const previous=db.chatMessages.length;db.chatMessages=db.chatMessages.filter(m=>Number.isFinite(m.at)&&m.at>=at-chatRetentionMs);return db.chatMessages.length!==previous;}
 if(pruneChat())persist();
 function actor(user){let r=runtime.get(user.id);if(!r){if(user.state){const stats=user.state.stats??={};for(const [key,rarity]of [['legendary',4],['mythic',5]])if(stats[key]===undefined)stats[key]=user.state.player.heroes.filter(h=>h.rarity===rarity).length+db.listings.filter(l=>l.seller===user.id&&l.source!=='caravan'&&l.hero?.rarity===rarity).length;}r=createEngine(user.state??require('./starter-state.cjs').starterState(),{codexBonuses:codex.bonuses(user),cleared:()=>user.campaign?.cleared,onCombat:event=>{festival.combat(user,event);if(event.farmMob)require('./creature-codex.cjs').discover(user,event.farmMob.region,event.farmMob.variant);}});runtime.set(user.id,r);}weaponCodex.discover(user,r.engine.player.equipment?.weapons);festival.join(user,clock());codex.discover(user,r.engine.player.heroes);codex.discover(user,db.listings.filter(l=>l.seller===user.id&&l.hero&&l.source!=='caravan').map(l=>l.hero));r.engine.player.campaignFarmMultiplier=require('./campaign-config.cjs').farmMultiplier(user.campaign?.cleared);r.engine.player.creatureFarmGoldBonus=require('./creature-codex.cjs').bonuses(user).gold;r.tick();return r.engine;}
 const botProfiles=[{key:'arena-bot-1',name:'IA Arashi'},{key:'arena-bot-2',name:'IA Fênix'},{key:'arena-bot-3',name:'IA Lobo'}];
 function ensureBots(){for(const profile of botProfiles){const existing=db.users.find(u=>u.botKey===profile.key);let name=profile.name,suffix=2;while(db.users.some(u=>u!==existing&&u.name.toLocaleLowerCase()===name.toLocaleLowerCase()))name=profile.name+' '+suffix++;if(existing){existing.name=name;existing.isBot=true;existing.canImport=false;existing.isTicketAdmin=false;existing.imported=true;continue;}db.users.push({id:crypto.randomUUID(),name,botKey:profile.key,isBot:true,canImport:false,isTicketAdmin:false,imported:true,state:require('./starter-state.cjs').starterState(),tutorial:require('./tutorial-rules.cjs').create()});}}
 function botAction(engine,route,args){try{const pending=engine.action(route,args);if(pending&&typeof pending.catch==='function')pending.catch(error=>console.error('Falha na ação de bot:',error.message));}catch(error){console.error('Falha na ação de bot:',error.message);}}
 function botListHero(user,engine,hero,price,at){if(!hero||hero.status!=='idle'||db.listings.filter(l=>l.seller===user.id).length>=30)return false;for(const weapon of equipment.book(engine.player).weapons)if(weapon.heroId===hero.id){weapon.heroId=null;weapon.version++;}delete hero.weaponId;delete hero.weaponBonus;delete hero.weaponName;delete hero.weaponLevel;engine.player.heroes=engine.player.heroes.filter(h=>h.id!==hero.id);engine.syncEquipment();db.listings.push({id:crypto.randomUUID(),seller:user.id,price,hero:structuredClone(hero),created:at});festival.updatePower(user,at);return true;}
 function botBuyUpgrade(user,engine,at){const player=engine.player;if(player.heroes.length!==15)return false;const weakest=[...player.heroes].sort((a,b)=>a.rarity-b.rarity||a.atk-b.atk)[0];const offers=db.listings.filter(l=>{const seller=db.users.find(u=>u.id===l.seller);return seller&&!seller.isBot&&l.seller!==user.id&&Number.isSafeInteger(l.price)&&l.price>0&&l.hero?.rarity>weakest.rarity&&player.heroes.length<500&&l.price*MILLION<=engine.balance*.2;}).sort((a,b)=>b.hero.rarity-a.hero.rarity||a.price-b.price);const listing=offers[0];if(!listing)return false;const seller=db.users.find(u=>u.id===listing.seller);if(!seller)return false;const sellerEngine=actor(seller),cost=listing.price*MILLION;engine.balance-=cost;sellerEngine.balance+=cost;player.heroes.push({...listing.hero,id:engine.nextId++,status:'idle',forgeSince:null});db.trades.push({id:crypto.randomUUID(),seller:seller.id,buyer:user.id,price:listing.price,at});db.listings=db.listings.filter(l=>l.id!==listing.id);const weakestNow=[...player.heroes].sort((a,b)=>a.rarity-b.rarity||a.atk-b.atk)[0];if(weakestNow.status==='working')botAction(engine,'heroes/deactivate',{heroId:weakestNow.id});if(weakestNow.status==='idle')botListHero(user,engine,weakestNow,Math.max(1,1000*(weakestNow.rarity+1)),at);engine.syncEquipment();festival.updatePower(user,at);festival.updatePower(seller,at);return true;}
 function botEquipAvailable(engine){const player=engine.player;for(const hero of player.heroes){if(hero.status!=='idle'||player.equipment?.weapons?.some(w=>w.heroId===hero.id))continue;const weapon=equipment.book(player).weapons.find(w=>w.heroId===null&&w.skin===hero.skin);if(weapon)try{equipment.equip(player,weapon.id,hero.id);}catch{}}engine.syncEquipment();}
 function botPurchase(user,engine,product,at){const before=engine.balance,oldIds=new Set(engine.player.heroes.map(h=>h.id)),pending=engine.pay(product),spent=(before-engine.balance)/MILLION,minted=engine.player.heroes.filter(h=>!oldIds.has(h.id));pending.then(out=>{if(out.status!=='paid')return;const source=product.startsWith('blacksmith-')?'forge':product==='porter'?'porter':product==='fusion'?'fusion':'summon';if(spent>0)festival.contribute(user,'purchase:'+out.orderId,spent,source,at);if(product==='fusion')festival.fusion(user,out.orderId,minted,at);festival.updatePower(user,at);}).catch(error=>console.error('Falha na compra de bot:',error.message));}
 function botMaintainForges(user,engine,at){
  const player=engine.player,prices=require('./economy-config.cjs');
  if(!player.blacksmiths.length&&engine.balance>=prices.smithPrices[0]*MILLION)botPurchase(user,engine,'blacksmith-1',at);
  if(!player.porters.length&&engine.balance>=prices.porterPrice*MILLION)botPurchase(user,engine,'porter',at);
  if(player.porters.length&&!player.porterOn)botAction(engine,'porter/switch',{on:true});
  if(player.blacksmiths.length&&!player.blacksmiths.some(f=>f.id===player.blacksmithInService))botAction(engine,'blacksmith/in-service',{blacksmithId:player.blacksmiths[0].id});
  const entries=engine.forgeView().entries,slots=entries.reduce((sum,f)=>sum+f.owned*f.slots,0);
  if(player.porters.length){const next=entries.find(f=>!f.owned);if(next&&engine.balance>=(prices.smithPrices[next.tier-1]+25000)*MILLION)botPurchase(user,engine,'blacksmith-'+next.tier,at);else if(slots<15&&engine.balance>=(prices.smithPrices[0]+25000)*MILLION)botPurchase(user,engine,'blacksmith-1',at);}
  if(!player.porters.length){
   let working=player.heroes.filter(h=>h.status==='working').length,used=player.heroes.filter(h=>h.status==='resting'&&h.forgeSince!=null).length;
   for(const hero of [...player.heroes].sort((a,b)=>b.rarity-a.rarity||b.atk-a.atk))if(hero.status==='resting'){
    if(hero.durability>=hero.dur*5*.8&&working<15){botAction(engine,'heroes/work',{heroIds:[hero.id]});working++;}
    else if(hero.forgeSince==null&&hero.durability<hero.dur*5&&used<slots){botAction(engine,'heroes/forge',{heroId:hero.id});used++;}
   }
  }
  festival.updatePower(user,at);
 }
 function playBot(user,engine,at){const player=engine.player;if(!user.botLoadoutVersion){const missing=Math.max(0,15-player.heroes.length),summoned=Math.min(missing,player.mintCards??0);if(summoned)botAction(engine,'summon/card',{count:summoned});const team=player.heroes.slice(0,15);for(const hero of team)if(hero.status==='working')botAction(engine,'heroes/deactivate',{heroId:hero.id});for(const hero of team){if(player.equipment?.weapons?.some(w=>w.heroId===hero.id)||(player.weaponSummons??0)<1)continue;const opened=equipment.redeem(player,hero.skin,1),weapon=opened.weapons[0];equipment.equip(player,weapon.id,hero.id);}engine.syncEquipment();for(const hero of team)if(hero.status==='idle')botAction(engine,'heroes/activate',{heroId:hero.id});user.botStarted=true;user.botLoadoutVersion=1;user.botNextActionAt=at+60000;return;}if(at<(user.botNextActionAt??0))return;
  if(Number.isSafeInteger(player.chest)&&player.chest>0){engine.balance+=player.chest;player.chest=0;}
  botMaintainForges(user,engine,at);
  require('./bot-market.cjs').consign(db,user,engine,at);
  require('./bot-market.cjs').trade({db,user,engine,at,action:botAction,purchase:botPurchase,listHero:botListHero,contribute:(...args)=>festival.contribute(...args)});
  festival.updatePower(user,at);
  if(player.porters.length)botBuyUpgrade(user,engine,at);
  // Invest earned gold in combat skills as soon as a full XP segment is available.
  const skills=require('./skill-progression.cjs'),priority=['bossDamage','enemyDamage','precision','fury','execute','swift'];let skillBudget=player.porters.length?3:0;
  for(const hero of [...player.heroes].sort((a,b)=>b.rarity-a.rarity||b.atk-a.atk)){if(skillBudget<1)break;for(const skill of priority){const level=skills.mhSkillLevel(hero,skill),cost=skills.mhSkillCosts[level+1];if(level<3&&hero.skills.includes(skill)&&(hero.skillXpTicks??0)>=skills.mhSkillXpStep&&engine.balance>=cost*MILLION+5000*MILLION){try{engine.upgradeSkill(hero.id,skill,level);festival.contribute(user,'skill:'+crypto.randomUUID(),cost,'skill',at);skillBudget--;break;}catch{}}}}
  // Upgrade one equipped weapon at a time, keeping a gold reserve for skills and market trades.
  const weapon=equipment.book(player).weapons.filter(w=>w.heroId!==null&&w.level<10).sort((a,b)=>b.rarity-a.rarity||b.level-a.level)[0];if(weapon&&player.porters.length){const cost=equipment.cost(weapon),hero=player.heroes.find(h=>h.id===weapon.heroId);if(cost&&equipment.book(player).embers>=cost.embers&&engine.balance>=cost.gold*MILLION+25000*MILLION){if(hero?.status==='working')botAction(engine,'heroes/deactivate',{heroId:hero.id});if(hero?.status==='idle'){try{const upgrade=equipment.upgrade(player,weapon.id,weapon.version,engine.balance);engine.balance-=upgrade.gold*MILLION;festival.contribute(user,'equipment:'+crypto.randomUUID(),upgrade.gold,'equipment-upgrade',at);}catch{}}}}
  botEquipAvailable(engine);
  // Re-enter Tower whenever the previous attempt ends; its best floor feeds the public ranking.
  if(user.tower?.status!=='active'&&player.heroes.length>=15&&player.heroes.slice(0,15).every(h=>h.durability>=.5))try{tower.start(user,player.heroes,player.heroes.slice(0,15).map(h=>h.id));}catch{}
  for(const hero of player.heroes.slice(0,15))if(hero.status==='idle'&&hero.durability>=.5)botAction(engine,'heroes/activate',{heroId:hero.id});user.botNextActionAt=at+60000;}
 function applyPendingBonuses(){
  const pendingFile=path.join(dir,'bonus-pendentes.json');if(!fs.existsSync(pendingFile))return;
  const awards=JSON.parse(fs.readFileSync(pendingFile,'utf8'));if(!Array.isArray(awards))return;let changed=false;
  for(const award of awards){if(typeof award.id!=='string'||!Number.isSafeInteger(award.coins)||award.coins<1||award.coins>100000000)continue;const user=db.users.find(u=>u.name===award.name);if(!user||user.appliedAwards?.includes(award.id))continue;const e=actor(user);if(!Number.isSafeInteger(e.balance+award.coins*MILLION))continue;e.balance+=award.coins*MILLION;(user.appliedAwards??=[]).push(award.id);changed=true;}
  if(changed)persist();
 }
 function applyPendingEvents(){
  const eventsFile=path.join(dir,'eventos-pendentes.json');if(!fs.existsSync(eventsFile))return;
  const events=JSON.parse(fs.readFileSync(eventsFile,'utf8'));if(!Array.isArray(events))return;let changed=false;
  for(const event of events){if(typeof event.id!=='string'||event.kind!=='spawn-boss')continue;const user=db.users.find(u=>u.name===event.name);if(!user||user.appliedEvents?.includes(event.id))continue;const e=actor(user);if(!e.live.battle.monsters.some(m=>m.boss&&!m.dead)){e.live.battle.pendingBossHp=100000;e.live.battle.pendingBossFestivalExcluded=true;e.live.battle.placeBoss(100000);}(user.appliedEvents??=[]).push(event.id);changed=true;}
  if(changed)persist();
 }
 function authenticate(req){const token=req.headers.cookie?.match(/(?:^|;\s*)mh_session=([a-f0-9]{64})(?:;|$)/)?.[1];const hash=token&&crypto.createHash('sha256').update(token).digest('hex');const s=db.sessions.find(s=>s.hash===hash&&s.expires>Date.now());return s&&db.users.find(u=>u.id===s.userId);}
 function result(res,status,value,headers={}){let data=Buffer.from(JSON.stringify(value));const encoding=res.mhAcceptEncoding??'';if(data.length>1024&&acceptsEncoding(encoding,'gzip')){data=gzipSync(data,{level:1});headers['Content-Encoding']='gzip';}res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Vary:'Accept-Encoding','Content-Length':data.length,...headers});res.end(data);}
 async function body(req){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>2e6)throw Error('Requisição muito grande.');}return data?JSON.parse(data):{};}
 function publicListing(l){const u=db.users.find(u=>u.id===l.seller);return {id:l.id,seller:u?.name??'Jogador',mine:false,price:l.price,type:l.type??'hero',source:l.source,hero:l.hero,weapon:l.weapon?marketRules.publicWeapon(l.weapon):undefined};}
 function isAdmin(user){return !!user?.canImport&&user.name?.toLocaleLowerCase()==='admin';}
 function ticketAdmin(user){return isAdmin(user);}
 function payload(user,minted=[]){const online=onlineSnapshot(user);const e=actor(user);const packet=e.packet(minted);packet.seq=user.packetSequence=Math.max(Date.now(),(user.packetSequence??0)+1);packet.market.open=true;const admin=isAdmin(user);return {tutorial:require('./tutorial-rules.cjs').view(user),farmMobPool:require('./monster-visuals.cjs').farmMobPool(user.campaign?.cleared),name:user.name,...online,balance:e.balance,isOwner:admin,canReviewTickets:admin,features:{tower:true,codex:true,festival:true,equipment:true},equipment:equipment.view(e.player),powerTotal:power(user),rankingAvatar:user.rankingAvatar??require('./festival-service.cjs').AVATAR_DEFAULT,codex:{...codex.view(user),creatures:require('./creature-codex.cjs').view(user),weapons:weaponCodex.view(user),forge:e.forgeView()},canImport:admin&&!user.imported,packet,stats:{...e.stats,kills:e.live.battle.kills,bosses:e.live.battle.bossesKilled}};}
 function issue(user,req){const token=crypto.randomBytes(32).toString('hex');db.sessions=db.sessions.filter(s=>s.expires>Date.now());db.sessions.push({hash:crypto.createHash('sha256').update(token).digest('hex'),userId:user.id,expires:Date.now()+30*86400000});persist();const secure=req.headers['x-forwarded-proto']==='https';return {'Set-Cookie':`mh_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${secure?'; Secure':''}`};}
 async function handleRequest(req,res,url){
  if(!url.pathname.startsWith('/shared-api/'))return false;
  res.mhAcceptEncoding=req.headers['accept-encoding']??'';
  try{
   applyPendingBonuses();
   applyPendingEvents();
   if(req.method!=='POST'&&req.method!=='GET'){result(res,405,{error:'Método inválido.'});return true;}
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){result(res,403,{error:'Origem inválida.'});return true;}
   const route=url.pathname.slice('/shared-api/'.length),data=req.method==='POST'?await body(req):{};
   if(advanceFestival(clock()))persist();
   const localRequest=/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host??'')&&!req.headers['cf-connecting-ip']&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
   if(route==='host-info'){result(res,localRequest?200:403,localRequest?{inviteCode:db.inviteCode}:{error:'Disponível somente no PC que hospeda.'});return true;}
   if(route==='register'||route==='login'){
    if(req.method!=='POST'){result(res,405,{});return true;}
    const ip=req.socket.remoteAddress,key=ip+':'+route,old=attempts.get(key),rate=old&&old.until>Date.now()?old:{count:0,until:Date.now()+60000};rate.count++;attempts.set(key,rate);if(rate.count>12){result(res,429,{error:'Aguarde um minuto antes de tentar novamente.'});return true;}
    const name=typeof data.name==='string'?data.name.trim():'',password=data.password;
    if(!/^[\p{L}\p{N} _-]{2,20}$/u.test(name)||typeof password!=='string'||password.length<8||password.length>128){result(res,400,{error:'Use um nome de 2 a 20 caracteres e senha de 8 a 128 caracteres.'});return true;}
    let user=db.users.find(u=>u.name.toLocaleLowerCase()===name.toLocaleLowerCase());
    if(route==='login'&&user?.isBot){result(res,401,{error:'Este perfil é um jogador automático.'});return true;}
    if(route==='register'){
     if(user){result(res,409,{error:'Esse nome já está em uso.'});return true;}
     const salt=crypto.randomBytes(16).toString('hex');const pass=(await new Promise((resolve,reject)=>crypto.scrypt(password,salt,64,(err,key)=>err?reject(err):resolve(key)))).toString('hex');
     // First account made on the host may import its existing offline progress.
     if(db.users.some(u=>u.name.toLocaleLowerCase()===name.toLocaleLowerCase())){result(res,409,{error:'Esse nome já está em uso.'});return true;}
     const localHost=/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host??'')&&!req.headers['cf-connecting-ip'];
     user={id:crypto.randomUUID(),name,salt,pass,canImport:!db.users.some(u=>u.canImport)&&localHost&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip),imported:true,state:null,tutorial:require('./tutorial-rules.cjs').create()};db.users.push(user);const starting=actor(user);starting.player.mintCards=0;starting.player.weaponSummons=0;
    }else{
     const key=await new Promise((resolve,reject)=>crypto.scrypt(password,user?.salt??'dummy',64,(err,key)=>err?reject(err):resolve(key)));
     if(!user||!crypto.timingSafeEqual(key,Buffer.from(user.pass,'hex'))){result(res,401,{error:'Nome ou senha incorretos.'});return true;}
    }
    const headers=issue(user,req);result(res,200,payload(user),headers);return true;
   }
   if(route==='password-reset'){
    if(req.method!=='POST'){result(res,405,{});return true;}
    const ip=req.socket.remoteAddress,key=ip+':password-reset',old=attempts.get(key),rate=old&&old.until>Date.now()?old:{count:0,until:Date.now()+60000};rate.count++;attempts.set(key,rate);if(rate.count>10){result(res,429,{error:'Aguarde um minuto antes de tentar novamente.'});return true;}
    const name=typeof data.name==='string'?data.name.trim():'',code=typeof data.code==='string'?data.code.trim().toUpperCase():'',password=data.password;
    if(!/^[\p{L}\p{N} _-]{2,20}$/u.test(name)||!/^[A-F0-9]{16}$/.test(code)||typeof password!=='string'||password.length<8||password.length>128){result(res,400,{error:'Confira o nome, o código e use uma nova senha de 8 a 128 caracteres.'});return true;}
    const target=db.users.find(u=>u.name.toLocaleLowerCase()===name.toLocaleLowerCase()),digest=crypto.createHash('sha256').update(code).digest();
    const saved=target?.passwordReset;
    if(!saved||!Number.isFinite(saved.expiresAt)||saved.expiresAt<=clock()||typeof saved.hash!=='string'||!/^[a-f0-9]{64}$/.test(saved.hash)||!crypto.timingSafeEqual(digest,Buffer.from(saved.hash,'hex'))){result(res,400,{error:'Código inválido ou expirado. Peça um novo código ao dono do jogo.'});return true;}
    const salt=crypto.randomBytes(16).toString('hex');target.salt=salt;target.pass=(await new Promise((resolve,reject)=>crypto.scrypt(password,salt,64,(err,key)=>err?reject(err):resolve(key)))).toString('hex');delete target.passwordReset;
    db.sessions=db.sessions.filter(s=>s.userId!==target.id);
    const headers=issue(target,req);result(res,200,payload(target),headers);return true;
   }
   const user=authenticate(req);if(!user){result(res,401,{error:'Entre no seu perfil para continuar.'});return true;}
   if(route==='tickets'&&req.method==='POST'){
    const title=typeof data.title==='string'?data.title.trim():'',description=typeof data.description==='string'?data.description.trim():'',category=data.category;
    if(!['bug','visual','balance','other'].includes(category)||title.length<4||title.length>90||description.length<15||description.length>1200||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(title+description)){result(res,400,{error:'Informe um título de 4 a 90 caracteres e uma descrição de 15 a 1200 caracteres.'});return true;}
    const now=clock(),attempt=ticketAttempts.get(user.id)??[];while(attempt.length&&now-attempt[0]>=86400000)attempt.shift();if(attempt.length>=8){result(res,429,{error:'Você já enviou o limite diário de 8 relatos. Tente novamente amanhã.'});return true;}
    attempt.push(now);ticketAttempts.set(user.id,attempt);const ticket={id:crypto.randomUUID(),player:user.name,userId:user.id,category,title,description,createdAt:now,status:'open',updatedAt:now};db.tickets.push(ticket);persist();result(res,201,{ticket:{...ticket}});return true;
   }
   if(route==='admin/tickets'&&req.method==='GET'){
    if(!ticketAdmin(user)){result(res,403,{error:'Apenas a equipe do jogo pode consultar os relatos.'});return true;}
    result(res,200,{tickets:db.tickets.slice(-250).reverse()});return true;
   }
   if(route==='admin/tickets/status'&&req.method==='POST'){
    if(!ticketAdmin(user)){result(res,403,{error:'Apenas a equipe do jogo pode atualizar os relatos.'});return true;}
    if(!['open','in_progress','resolved'].includes(data.status)){result(res,400,{error:'Estado de ticket inválido.'});return true;}
    const ticket=db.tickets.find(t=>t.id===data.id);if(!ticket){result(res,404,{error:'Relato não encontrado.'});return true;}ticket.status=data.status;ticket.updatedAt=clock();persist();result(res,200,{ticket});return true;
   }
   if(route==='chat'){
    if(pruneChat())persist();
    if(req.method==='POST'){
     const text=typeof data.text==='string'?data.text.trim():'',clientId=typeof data.clientId==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(data.clientId)?data.clientId:null;
     if(!text||text.length>240||/[\x00-\x1f\x7f]/.test(text)){result(res,400,{error:'Escreva uma mensagem de até 240 caracteres.'});return true;}
     const duplicate=clientId&&db.chatMessages.some(m=>m.userId===user.id&&m.clientId===clientId);
     if(!duplicate){
      const at=clock();
      db.chatMessages.push({id:++chatSequence,name:user.name,text,at,userId:user.id,clientId});persist();
     }
    }
    result(res,200,{chatEpoch,messages:db.chatMessages.map(({id,name,text,at})=>({id,name,text,at})),...onlineSnapshot(user)});return true;
   }
   if(route==='logout'){if(req.method!=='POST'){result(res,405,{});return true;}const token=req.headers.cookie?.match(/mh_session=([a-f0-9]{64})/)?.[1],hash=token&&crypto.createHash('sha256').update(token).digest('hex');db.sessions=db.sessions.filter(s=>s.hash!==hash);presence.delete(user.id);persist();result(res,200,{ok:true},{'Set-Cookie':'mh_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});return true;}
   if(route==='presence'){result(res,200,onlineSnapshot(user));return true;}
   const engine=actor(user);
   if(route.startsWith('tutorial/')){
    const tutorial=require('./tutorial-rules.cjs');let outcome;
    if(route==='tutorial/state'&&req.method==='GET')tutorial.view(user);
    else if(req.method!=='POST')throw Error('Método inválido para o tutorial.');
    else if(route==='tutorial/advance')tutorial.advance(user,data.expectedStep);
    else if(route==='tutorial/complete')outcome=tutorial.complete(user,engine.player);
    else if(route==='tutorial/defer')tutorial.defer(user);
    else if(route==='tutorial/resume')tutorial.resume(user);
    else throw Error('Ação do tutorial inválida.');
    persist();result(res,200,{...payload(user),tutorialResult:outcome??null});return true;
   }
   if(route.startsWith('campaign/')){
    let value;if(route==='campaign/state'&&req.method==='GET'){campaign.tick(user);value=campaign.view(user);}
    else if(route==='campaign/start'&&req.method==='POST')value=campaign.start(user,data);
    else if(route==='campaign/ability'&&req.method==='POST')value=campaign.ability(user,data);
    else if(route==='campaign/target'&&req.method==='POST')value=campaign.target(user,data);
    else if(route==='campaign/abandon'&&req.method==='POST')value=campaign.abandon(user,data);
    else throw Error('Ação da campanha inválida.');
    persist();result(res,200,value);return true;
   }
   if(campaign.active(user)&&((route==='action')||route==='market/list'||route==='market/list-weapon'||route==='market/buy'||route==='market/cancel'||route==='tower/start'||route==='skills/upgrade'||route==='purchase'&&data.product==='fusion'||route.startsWith('equipment/')&&req.method==='POST'))throw Error('Finalize a expedição para alterar o time, skills ou equipamentos.');
   if(route.startsWith('equipment/')){
    if(route==='equipment/state'&&req.method==='GET'){persist();result(res,200,payload(user));return true;}
    if(req.method!=='POST'||!['equipment/open','equipment/redeem','equipment/upgrade','equipment/equip','equipment/unequip','equipment/favorite','equipment/dismantle'].includes(route))throw Error('Ação de equipamento inválida.');
    if(typeof data.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(data.requestId))throw Error('Identificador de ação inválido.');
    const receipts=user.equipmentReceipts??={},old=receipts[data.requestId];
    const signature=JSON.stringify([route,Object.entries(data).filter(([k])=>k!=='requestId').sort(([a],[b])=>a.localeCompare(b))]);
    if(old){if(old.signature!==signature)throw Error('Esta ação já foi usada com outros dados.');result(res,200,{...payload(user),equipmentResult:old.result});return true;}
    let outcome,source;
    if(route==='equipment/open'){outcome=equipment.open(engine.player,data.skin,data.count,engine.balance);source='equipment-box';}
    else if(route==='equipment/redeem'){outcome=equipment.redeem(engine.player,data.skin,data.count);}
    else if(route==='equipment/upgrade'){outcome=equipment.upgrade(engine.player,data.weaponId,data.expectedVersion,engine.balance);source='equipment-upgrade';}
    else if(route==='equipment/equip'){outcome=equipment.equip(engine.player,data.weaponId,data.heroId);}
    else if(route==='equipment/unequip'){equipment.unequip(engine.player,data.weaponId);outcome={weaponId:data.weaponId};}
    else if(route==='equipment/favorite'){if(typeof data.favorite!=='boolean')throw Error('Favorito inválido.');const w=equipment.find(engine.player,data.weaponId);if(w.favorite!==data.favorite){w.favorite=data.favorite;w.version++;}outcome={weaponId:w.id,favorite:w.favorite};}
    else outcome=equipment.dismantle(engine.player,data.weaponIds);
    if(outcome.gold){engine.balance-=outcome.gold*MILLION;festival.contribute(user,'equipment:'+data.requestId,outcome.gold,source,clock());}
    engine.syncEquipment();receipts[data.requestId]={signature,result:outcome,at:clock()};persist();result(res,200,{...payload(user),equipmentResult:outcome});return true;
   }
   if(route==='festival'&&req.method==='GET'){const value=festival.view(user,clock());persist();result(res,200,value);return true;}
   if(route==='festival/avatar'&&req.method==='POST'){user.rankingAvatar=festival.avatarConfig(data.avatar);persist();result(res,200,{avatar:user.rankingAvatar});return true;}
   if(['forge/upgrade','forge/register','forge/activate'].includes(route)){
    if(req.method!=='POST'){result(res,405,{});return true;}
    let upgrade;if(route==='forge/upgrade'){upgrade=engine.upgradeForge(data.tier,data.expectedLevel);festival.contribute(user,'forge:'+crypto.randomUUID(),upgrade.coins,'forge',clock());}
    else if(route==='forge/register')engine.registerForge(data.tier,data.level);else engine.activateForge(data.index);
    persist();result(res,200,{...payload(user),...(upgrade?{forgeUpgrade:upgrade}:{})});return true;
   }
   if(route==='skills/upgrade'){
    if(req.method!=='POST'){result(res,405,{error:'Método inválido.'});return true;}
    const upgrade=engine.upgradeSkill(data.heroId,data.skill,data.expectedLevel);festival.contribute(user,'skill:'+crypto.randomUUID(),upgrade.coins,'skill',clock());persist();result(res,200,{...payload(user),upgrade});return true;
   }
   if(route==='codex/creatures/register'||route==='codex/creatures/activate'){
    if(req.method!=='POST'){result(res,405,{error:'Método inválido.'});return true;}
    const creatures=require('./creature-codex.cjs');creatures.migrate(user);
    if(route.endsWith('/register'))creatures.register(user,data.region,data.variant);
    else {creatures.activate(user,data.region);engine.setCodexBonuses(codex.bonuses(user));engine.syncEquipment();}
    persist();result(res,200,payload(user));return true;
   }
   if(route==='codex/weapons/register'||route==='codex/weapons/activate'){
    if(req.method!=='POST'){result(res,405,{error:'Método inválido.'});return true;}
    if(route.endsWith('/register'))weaponCodex.register(user,data.skin,data.rarity);
    else {weaponCodex.activate(user,data.rarity);engine.setCodexBonuses(codex.bonuses(user));engine.syncEquipment();}
    persist();result(res,200,payload(user));return true;
   }
   if(route==='codex/register'||route==='codex/activate'){
    if(req.method!=='POST'){result(res,405,{error:'Método inválido.'});return true;}
    if(route==='codex/register')codex.register(user,data.skin,data.rarity);
    else {codex.activate(user,data.rarity);engine.setCodexBonuses(codex.bonuses(user));engine.syncEquipment();}
    persist();result(res,200,payload(user));return true;
   }
   if(route==='admin/access-link'){
    if(!isAdmin(user)){result(res,403,{error:'Disponível apenas para a conta ADMIN.'});return true;}
    if(req.method!=='POST'){result(res,405,{error:'Método inválido.'});return true;}
    const url=await require('./gerenciar-compartilhado.cjs').getAccessLink();result(res,200,{url});return true;
   }
   if(route==='admin/password-reset'){
    if(!ticketAdmin(user)){result(res,403,{error:'Disponível apenas para o dono ou a equipe do jogo.'});return true;}
    if(req.method!=='POST'){result(res,405,{error:'Método inválido.'});return true;}
    const name=typeof data.name==='string'?data.name.trim():'',target=db.users.find(u=>u.name.toLocaleLowerCase()===name.toLocaleLowerCase());
    if(!target||target.isBot){result(res,404,{error:'Perfil não encontrado.'});return true;}
    const code=crypto.randomBytes(8).toString('hex').toUpperCase();target.passwordReset={hash:crypto.createHash('sha256').update(code).digest('hex'),expiresAt:clock()+15*60*1000};persist();result(res,200,{name:target.name,code,expiresInMinutes:15});return true;
   }
   if(route.startsWith('tower/')){
    let value;
    if(route==='tower/state'&&req.method==='GET'){tower.tick(user);value=tower.view(user);}
    else if(route==='tower/start'&&req.method==='POST')value=tower.start(user,engine.player.heroes,data.heroIds);
    else if(route==='tower/abandon'&&req.method==='POST')value=tower.abandon(user);
    else if(route==='tower/pause'&&req.method==='POST')value=tower.pause(user);
    else {result(res,405,{error:'Ação inválida.'});return true;}
    persist();result(res,200,value);return true;
   }
   if(route==='session'||route==='state'){const p=payload(user);persist();result(res,200,p);return true;}
   if(route==='leaderboard'){
    const rows=db.users.map(u=>{const e=actor(u);return {name:u.name,created:e.stats.created,fusions:e.stats.fusions,legendary:e.stats.legendary,mythic:e.stats.mythic,kills:e.live.battle.kills,bosses:e.live.battle.bossesKilled,tower:u.towerBest?.version==='dungeon-v1'?u.towerBest.floor:0};});persist();result(res,200,{rows});return true;
   }
   if(route==='admin/players'){
    if(!isAdmin(user)){result(res,403,{error:'Painel disponível apenas para a conta ADMIN.'});return true;}
    if(req.method!=='GET'){result(res,405,{error:'Método inválido.'});return true;}
    const players=db.users.filter(u=>!u.isBot).map(u=>({name:u.name,balance:actor(u).balance/MILLION})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));persist();result(res,200,{players});return true;
   }
   if(route==='admin/boss'){
    if(!isAdmin(user)){result(res,403,{error:'Disponível apenas para a conta ADMIN.'});return true;}
    if(req.method!=='POST'){result(res,405,{error:'Método inválido.'});return true;}
    const recipient=db.users.find(u=>u.name===data.name);if(!recipient)throw Error('Jogador não encontrado.');
    const skin=data.boss??'random';if(skin!=='random'&&!require('./boss-visuals.cjs').bosses.includes(skin))throw Error('Escolha um boss válido.');
    const battle=actor(recipient).live.battle;
    if(battle.pendingBossHp||battle.monsters.some(m=>m.boss&&!m.dead))throw Error('Esse jogador já tem um boss vivo ou aguardando espaço.');
    battle.pendingBossFestivalExcluded=true;battle.pendingBossSkin=skin==='random'?null:skin;battle.pendingBossHp=100000;battle.placeBoss(100000);persist();result(res,200,{...payload(user),boss:{recipient:recipient.name,skin}});return true;
   }
   if(route==='admin/credit'){
    if(!isAdmin(user)){result(res,403,{error:'Painel disponível apenas para a conta ADMIN.'});return true;}
    if(req.method!=='POST'){result(res,405,{error:'Método inválido.'});return true;}
    const name=typeof data.name==='string'?data.name.trim():'',recipient=db.users.find(u=>u.name.toLocaleLowerCase()===name.toLocaleLowerCase());
    if(!recipient){result(res,404,{error:'Esse jogador ainda não criou um perfil.'});return true;}
    if(!Number.isSafeInteger(data.coins)||data.coins<1||data.coins>100000000)throw Error('Informe uma quantidade inteira de 1 a 100 milhões de moedas.');
    const target=actor(recipient),amount=data.coins*MILLION;if(!Number.isSafeInteger(target.balance+amount))throw Error('O saldo do jogador atingiria o limite permitido.');
    target.balance+=amount;(db.coinGrants??=[]).push({id:crypto.randomUUID(),issuer:user.id,recipient:recipient.id,coins:data.coins,at:Date.now()});
    persist();result(res,200,{...payload(user),credit:{recipient:recipient.name,coins:data.coins,balance:target.balance/MILLION}});return true;
   }
   if(route==='market'&&req.method==='GET'){result(res,200,{listings:db.listings.map(l=>({...publicListing(l),mine:l.seller===user.id}))});return true;}
   if(req.method!=='POST'){result(res,405,{});return true;}
   if(route==='import'){
    if(!isAdmin(user)||user.imported||db.listings.some(l=>l.seller===user.id)){result(res,403,{error:'Importação disponível apenas uma vez para a conta ADMIN.'});return true;}
    const s=data.state;if(!s||!Number.isSafeInteger(s.balance)||s.balance<0||!s.player||!Array.isArray(s.player.heroes)||s.player.heroes.length>500||!s.battle)throw Error('Salvamento inválido.');
    const imported=createEngine(s,{codexBonuses:codex.bonuses(user),cleared:()=>user.campaign?.cleared,onCombat:event=>{festival.combat(user,event);if(event.farmMob)require('./creature-codex.cjs').discover(user,event.farmMob.region,event.farmMob.variant);}});imported.export();runtime.set(user.id,imported);user.imported=true;festival.updatePower(user,clock(),true);persist();result(res,200,payload(user));return true;
   }
   if(route==='action'){
    if(!['state','heroes/activate','heroes/deactivate','heroes/work','heroes/rest','heroes/forge','heroes/leave-forge','blacksmith/in-service','blacksmith/out-of-service','porter/switch','summon/card','fusion/choose'].includes(data.route))throw Error('Ação inválida.');
    const args=data.args??{};
    if(['heroes/work','heroes/rest','fusion/choose'].includes(data.route)&&(!Array.isArray(args.heroIds)||args.heroIds.length>500||new Set(args.heroIds).size!==args.heroIds.length||args.heroIds.some(id=>!Number.isSafeInteger(id)||!engine.player.heroes.some(h=>h.id===id))))throw Error('Seleção de heróis inválida.');
    if(['heroes/work','heroes/rest'].includes(data.route)&&args.heroIds.some(id=>engine.player.heroes.find(h=>h.id===id).status==='idle'))throw Error('Ative os heróis selecionados primeiro.');
    if(data.route==='summon/card'){if(args.all===true){args.count=Math.min(engine.player.mintCards??0,Math.max(0,500-engine.player.heroes.length));if(args.count<1)throw Error(engine.player.heroes.length>=500?'Exército cheio: máximo de 500 heróis.':'Sem Selos de Pacto para abrir.');delete args.all;}else if(![1,5,10].includes(args.count))throw Error('Quantidade de selos inválida.');}
    if(data.route==='porter/switch'&&(typeof args.on!=='boolean'||!engine.player.porters.length))throw Error('Porter indisponível.');
    if(data.route.startsWith('blacksmith/')&&!engine.player.blacksmiths.some(b=>b.id===args.blacksmithId))throw Error('Ferreiro não encontrado.');
    if(['heroes/forge','heroes/leave-forge'].includes(data.route)&&!engine.player.heroes.some(h=>h.id===args.heroId&&h.status!=='idle'))throw Error('Ative o herói primeiro.');
    const out=await engine.action(data.route,args);if(out.ok){engine.syncEquipment();festival.updatePower(user,clock());}persist();result(res,out.ok?200:409,out.ok?payload(user,out.value?.minted??[]):{error:out.error});return true;
   }
   if(route==='purchase'){
    if(typeof data.product!=='string'||!(/^(summon-(1|5|10|15)|blacksmith-[1-6]|porter|fusion)$/.test(data.product)))throw Error('Compra inválida.');
    const before=engine.balance,out=await engine.pay(data.product);const reveal=out.status==='paid'?await engine.action('summon/reveal',{orderId:out.orderId}):null;
    if(out.status==='paid'){const spent=(before-engine.balance)/MILLION;const source=data.product==='fusion'?'fusion':data.product.startsWith('blacksmith-')?'forge':data.product==='porter'?'porter':data.product.startsWith('summon-')?'summon':null;if(source&&spent>0)festival.contribute(user,'purchase:'+out.orderId,spent,source,clock());if(data.product==='fusion'){const ids=new Set(reveal?.value?.minted??[]);festival.fusion(user,out.orderId,engine.player.heroes.filter(h=>ids.has(h.id)),clock());}engine.syncEquipment();festival.updatePower(user,clock());}
    persist();result(res,out.status==='paid'?200:409,out.status==='paid'?{...payload(user,reveal?.value?.minted??[]),purchase:out}:{error:out.error});return true;
   }
   if(route==='withdraw'){engine.balance+=engine.player.chest;engine.player.chest=0;persist();result(res,200,payload(user));return true;}
   if(route==='market/list-weapon'){
    marketRules.listWeapon(db,user,engine,data.weaponId,data.price,clock());persist();result(res,200,payload(user));return true;
   }
   if(route==='market/list'){
    const hero=engine.player.heroes.find(h=>h.id===data.heroId);if(!hero||hero.status!=='idle')throw Error('Desative o herói antes de anunciá-lo.');
    if(!Number.isSafeInteger(data.price)||data.price<1||data.price>100000000)throw Error('Preço deve ser um número inteiro de 1 a 100 milhões.');
    if(db.listings.filter(l=>l.seller===user.id).length>=30)throw Error('Limite de 30 anúncios por jogador.');
    for(const w of equipment.book(engine.player).weapons)if(w.heroId===hero.id){w.heroId=null;w.version++;}delete hero.weaponId;delete hero.weaponBonus;delete hero.weaponName;delete hero.weaponLevel;engine.player.heroes=engine.player.heroes.filter(h=>h.id!==hero.id);engine.syncEquipment();db.listings.push({id:crypto.randomUUID(),seller:user.id,price:data.price,hero:structuredClone(hero),created:Date.now()});festival.updatePower(user,clock());persist();result(res,200,payload(user));return true;
   }
   if(route==='market/buy'||route==='market/cancel'){
    const listing=db.listings.find(l=>l.id===data.id);if(!listing)throw Error('Esse anúncio já foi removido ou comprado.');
    if(listing.type==='weapon'){
     const seller=db.users.find(u=>u.id===listing.seller);
     if(!seller)throw Error('Vendedor indisponível.');
     marketRules.transferWeapon(db,user,engine,listing,route==='market/buy'?actor(seller):null,route==='market/cancel',clock());persist();result(res,200,payload(user));return true;
    }
    if(engine.player.heroes.length>=500)throw Error('Sem espaço para outro herói.');
    if(route==='market/cancel'){
     if(listing.seller!==user.id)throw Error('Você só pode cancelar seu anúncio.');
     const hero={...listing.hero,id:engine.nextId++,status:'idle',forgeSince:null};engine.player.heroes.push(hero);
    }else{
     if(listing.seller===user.id)throw Error('Você não pode comprar seu próprio anúncio.');
     const cost=listing.price*MILLION;if(engine.balance<cost)throw Error('Saldo insuficiente.');
     const seller=db.users.find(u=>u.id===listing.seller);if(!seller)throw Error('Vendedor indisponível.');const sellerEngine=actor(seller);
     // No awaits here: debit, credit, transfer and removal form one server operation.
     engine.balance-=cost;sellerEngine.balance+=cost;engine.player.heroes.push({...listing.hero,id:engine.nextId++,status:'idle',forgeSince:null});
     db.trades.push({id:crypto.randomUUID(),seller:seller.id,buyer:user.id,price:listing.price,at:Date.now()});
    }
    db.listings=db.listings.filter(l=>l.id!==listing.id);engine.syncEquipment();festival.updatePower(user,clock());const sellerUser=db.users.find(u=>u.id===listing.seller);if(sellerUser)festival.updatePower(sellerUser,clock());persist();result(res,200,payload(user));return true;
   }
   result(res,404,{error:'Recurso não encontrado.'});return true;
  }catch(e){result(res,400,{error:e instanceof SyntaxError?'Dados inválidos.':e.message});return true;}
 }
 function advanceFestival(at=clock()){
  for(const user of db.users){const engine=actor(user);if(user.isBot){presence.set(user.id,at);playBot(user,engine,at);}if(user.tower?.status==='active')tower.tick(user,at);if(campaign.active(user))campaign.tick(user,at);}
  return festival.tick(at);
 }
 function advanceTowers(at=clock()){if(handling)return false;advanceFestival(at);return db.users.length>0;}
 let queue=Promise.resolve();
 function handle(req,res,url){if(!url.pathname.startsWith('/shared-api/'))return Promise.resolve(false);const task=queue.then(async()=>{handling=true;try{return await handleRequest(req,res,url);}finally{handling=false;}});queue=task.catch(()=>{});return task;}
 ensureBots();persist();
 return {handle,persist,advanceTowers,close:()=>store.close()};
}
module.exports={service};
