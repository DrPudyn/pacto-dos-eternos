const crypto=require('crypto'),equipment=require('./equipment-rules.cjs');
function validatePrice(price){if(!Number.isSafeInteger(price)||price<1||price>100000000)throw Error('Preço deve ser um número inteiro de 1 a 100 milhões.');}
function listWeapon(db,user,engine,weaponId,price,at=Date.now()){
 validatePrice(price);
 if(db.listings.filter(l=>l.seller===user.id).length>=30)throw Error('Limite de 30 anúncios por jogador.');
 const book=equipment.book(engine.player),weapon=equipment.find(engine.player,weaponId);
 if(weapon.heroId!==null)throw Error('Desequipe a arma antes de anunciá-la.');
 if(weapon.favorite)throw Error('Remova a arma dos favoritos antes de anunciá-la.');
 const listing={id:crypto.randomUUID(),type:'weapon',seller:user.id,price,weapon:structuredClone(weapon),created:at};
 book.weapons=book.weapons.filter(w=>w.id!==weaponId);db.listings.push(listing);engine.syncEquipment();return listing;
}
function transferWeapon(db,user,engine,listing,sellerEngine,cancel,at=Date.now()){
 if(!db.listings.includes(listing)||listing.type!=='weapon'||!listing.weapon)throw Error('Esse anúncio já foi removido ou comprado.');
 if(cancel?listing.seller!==user.id:listing.seller===user.id)throw Error(cancel?'Você só pode cancelar seu anúncio.':'Você não pode comprar seu próprio anúncio.');
 const book=equipment.book(engine.player);if(book.weapons.length>=1000)throw Error('Mochila cheia: libere espaço antes de receber a arma.');
 const cost=listing.price*1e6;validatePrice(listing.price);
 if(!cancel){if(!sellerEngine)throw Error('Vendedor indisponível.');if(engine.balance<cost)throw Error('Saldo insuficiente.');if(!Number.isSafeInteger(sellerEngine.balance+cost))throw Error('Saldo do vendedor excede o limite permitido.');}
 const weapon={...structuredClone(listing.weapon),id:crypto.randomUUID(),heroId:null,favorite:false,version:(listing.weapon.version??0)+1};
 if(!cancel){engine.balance-=cost;sellerEngine.balance+=cost;db.trades.push({id:crypto.randomUUID(),type:'weapon',seller:listing.seller,buyer:user.id,price:listing.price,at});}
 book.weapons.push(weapon);db.listings=db.listings.filter(l=>l.id!==listing.id);engine.syncEquipment();return weapon;
}
function publicWeapon(weapon){return {...weapon,name:equipment.TITLES[weapon.skin][weapon.rarity],bonus:equipment.bonus(weapon),passiveName:equipment.PASSIVE_NAMES[weapon.passive]??null};}
module.exports={validatePrice,listWeapon,transferWeapon,publicWeapon};
