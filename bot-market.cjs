const equipment=require('./equipment-rules.cjs'),market=require('./market-rules.cjs');
const HERO_PRICES=[1000,3500,15000,80000,1500000,15000000],WEAPON_PRICES=[600,2000,8000,40000,750000,8000000];
function price(kind,item){const base=(kind==='weapon'?WEAPON_PRICES:HERO_PRICES)[item.rarity];return Math.min(100000000,Math.round(base*(kind==='weapon'?1+(item.level??0)*.25:1)));}
function consign(db,user,engine,at){
 const week=require('./festival-service.cjs').period('week',at).id;
 if(user.botConsignment?.week!==week)user.botConsignment={week,issued:{}};
 const receipt=user.botConsignment;
 for(const rarity of [5,4])for(const kind of ['hero','weapon']){
  const key=kind+':'+rarity;if(receipt.issued[key]||db.listings.some(l=>l.seller===user.id&&l.source==='caravan'&&l[kind]?.rarity===rarity))continue;
  if(db.listings.filter(l=>l.seller===user.id).length>=30)continue;
  const crypto=require('crypto'),asset=kind==='hero'?engine.createMarketHero(rarity):{id:crypto.randomUUID(),skin:equipment.CLASSES[crypto.randomInt(4)],rarity,level:0,passive:null,heroId:null,favorite:false,failures:0,invested:0,version:0,createdAt:at};
  if(kind==='weapon')asset.passive=equipment.PASSIVES[asset.skin][crypto.randomInt(3)];
  db.listings.push({id:crypto.randomUUID(),type:kind,seller:user.id,source:'caravan',price:price(kind,asset),[kind]:asset,created:at});receipt.issued[key]=true;
 }
}
function trade({db,user,engine,at,action,purchase,listHero,contribute}){
 const player=engine.player,book=equipment.book(player),classes=equipment.CLASSES;
 function makeRoom(rarity){
  const offers=db.listings.filter(l=>l.seller===user.id);if(offers.length<30)return true;
  const old=offers.filter(l=>l.source!=='caravan'&&(l.weapon??l.hero).rarity<rarity).sort((a,b)=>(a.weapon??a.hero).rarity-(b.weapon??b.hero).rarity||a.price-b.price)[0];
  if(!old)return false;
  if(old.weapon){if(book.weapons.length>=1000)return false;market.transferWeapon(db,user,engine,old,null,true,at);}
  else{if(player.heroes.length>=500)return false;player.heroes.push({...structuredClone(old.hero),id:engine.nextId++,status:'idle',forgeSince:null});db.listings=db.listings.filter(l=>l.id!==old.id);}
  return true;
 }
 const skin=classes[(user.botMarketTurn??0)%classes.length];user.botMarketTurn=(user.botMarketTurn??0)+1;
 // Normal summons only: no changed odds or artificial legendary/mythic grants.
 const freeHeroes=Math.min(15,player.mintCards??0,Math.max(0,80-player.heroes.length));
 if(freeHeroes>0)action(engine,'summon/card',{count:freeHeroes});
 const freeWeapons=Math.min(15,equipment.tickets(player),1000-book.weapons.length),batch=n=>[15,10,5,1].find(c=>c<=n);
 if(freeWeapons>0)equipment.redeem(player,skin,batch(freeWeapons));
 const reserve=50000*1e6;
 if(player.porters.length&&player.blacksmiths.length&&engine.balance>reserve){
  if(player.heroes.length<60&&engine.balance>=reserve+12500*1e6)purchase(user,engine,'summon-5',at);
  if(book.weapons.length<100&&engine.balance>=reserve+5000*1e6){const opened=equipment.open(player,skin,5,engine.balance);engine.balance-=opened.gold*1e6;contribute(user,'bot-box:'+require('crypto').randomUUID(),opened.gold,'equipment-box',at);}
 }
 // Keep at least 15 combatants after consuming four heroes and receiving one.
 if(player.porters.length&&player.heroes.length>=18){
  for(let rarity=3;rarity>=0;rarity--){const group=player.heroes.filter(h=>h.rarity===rarity).sort((a,b)=>a.atk-b.atk).slice(0,4);if(group.length!==4||engine.balance<reserve+engine.fusionPrice(rarity))continue;
   const ownedWeaponIds=new Set(book.weapons.filter(w=>group.some(h=>h.id===w.heroId)).map(w=>w.id));
   for(const h of group)if(h.status!=='idle')action(engine,'heroes/deactivate',{heroId:h.id});
   action(engine,'fusion/choose',{heroIds:group.map(h=>h.id)});
   const count=player.heroes.length;purchase(user,engine,'fusion',at);
   if(player.heroes.length<count){for(const w of book.weapons)if(ownedWeaponIds.has(w.id)){w.heroId=null;w.version++;}engine.syncEquipment();break;}
  }
 }
 // Prioritize high-rarity offers while retaining fifteen heroes for farming.
 for(const h of [...player.heroes].filter(h=>h.rarity>=4).sort((a,b)=>b.rarity-a.rarity)){
  if(player.heroes.length<=15)break;
  if(!makeRoom(h.rarity))continue;
  if(h.status!=='idle')action(engine,'heroes/deactivate',{heroId:h.id});listHero(user,engine,h,price('hero',h),at);
 }
 for(const w of [...book.weapons].sort((a,b)=>b.rarity-a.rarity||b.level-a.level)){
  if(!makeRoom(w.rarity))continue;
  if(w.favorite)continue;
  if(w.heroId!==null){if(w.rarity<4)continue;const h=player.heroes.find(h=>h.id===w.heroId);if(h?.status==='working')action(engine,'heroes/deactivate',{heroId:h.id});equipment.unequip(player,w.id);}
  if(w.rarity<4&&db.listings.filter(l=>l.seller===user.id).length>=22)continue;
  if(w.rarity<4&&db.listings.some(l=>l.seller===user.id&&l.weapon?.skin===w.skin&&l.weapon?.rarity===w.rarity))continue;
  market.listWeapon(db,user,engine,w.id,price('weapon',w),at);
 }
 // Surplus low tiers remain fusion material. Sell only beyond the reserve limit.
 if(player.heroes.length>60){const h=[...player.heroes].sort((a,b)=>a.rarity-b.rarity||a.atk-b.atk)[0];if(h.status!=='idle')action(engine,'heroes/deactivate',{heroId:h.id});listHero(user,engine,h,price('hero',h),at);}
 // Recycle unlisted low-tier duplicates for the bots' own upgrades.
 const junk=book.weapons.filter(w=>w.rarity<3&&w.heroId===null&&!w.favorite).slice(0,100);if(book.weapons.length>80&&junk.length)equipment.dismantle(player,junk.map(w=>w.id));
 engine.syncEquipment();
}
module.exports={trade,consign,price,HERO_PRICES,WEAPON_PRICES};
