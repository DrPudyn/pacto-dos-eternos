const crypto=require('crypto');
const equipment=require('./equipment-rules.cjs');
const {CLASSES,ODDS,PASSIVES,book,weaponName,bonus}=equipment;
function rollWeapon(player,rng=Math.random){
 if(book(player).weapons.length>=1000)throw Error('Mochila cheia: máximo de 1.000 armas.');
 const skin=CLASSES[Math.floor(rng()*CLASSES.length)];
 let roll=Math.floor(rng()*10000),rarity=0;
 while(rarity<5&&roll>=ODDS[rarity])roll-=ODDS[rarity++];
 const passive=rarity>=2?PASSIVES[skin][Math.min(2,Math.floor(rng()*3))]:null;
 const weapon={id:crypto.randomUUID(),skin,rarity,level:0,passive,heroId:null,favorite:false,failures:0,invested:0,version:0,createdAt:Date.now()};
 book(player).weapons.push(weapon);
 return weapon;
}
async function grantHeroSummons(engine,count){
 const player=engine.player;
 if(player.heroes.length+count>500)throw Error('Exército cheio: máximo de 500 heróis.');
 const before=new Set(player.heroes.map(h=>h.id));
 const saved=player.mintCards??0;
 player.mintCards=saved+count;
 const minted=[];
 for(let i=0;i<count;i++){
  const out=await engine.action('summon/card',{count:1});
  if(!out.ok)throw Error(out.error||'Falha ao sortear herói.');
  if(Array.isArray(out.value?.minted))for(const id of out.value.minted)minted.push(id);
 }
 player.mintCards=saved;
 const heroes=player.heroes.filter(h=>!before.has(h.id));
 if(heroes.length!==count)throw Error('Sorteio de heróis incompleto.');
 return heroes;
}
function grantWeaponSummons(player,count,rng=Math.random){
 const weapons=[];
 for(let i=0;i<count;i++)weapons.push(rollWeapon(player,rng));
 return weapons;
}
async function grantWelcomePack(engine){
 const player=engine.player;
 const heroes=await grantHeroSummons(engine,15);
 const weapons=grantWeaponSummons(player,15);
 engine.syncEquipment?.();
 return {
  heroes:heroes.map(h=>({...h})),
  weapons:weapons.map(w=>({...w,name:weaponName(w),bonus:bonus(w)})),
 };
}
module.exports={rollWeapon,grantHeroSummons,grantWeaponSummons,grantWelcomePack};
