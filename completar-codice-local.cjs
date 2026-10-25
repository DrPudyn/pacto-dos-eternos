const fs=require('fs'),path=require('path');
const {sharedStore}=require('./shared-store.cjs');
const store=sharedStore(path.join(__dirname,'dados-compartilhados'));
try{
 const db=store.load(),user=db.users.find(u=>u.name==='JUKA'&&u.canImport);
 if(!user)throw Error('Conta JUKA não encontrada.');
 const backup=path.join(__dirname,'dados-compartilhados','codice-juka-antes-'+Date.now()+'.json');
 fs.writeFileSync(backup,JSON.stringify({codex:user.codex,weaponCodex:user.weaponCodex,forgeCodex:user.state.player.forgeCodex},null,2));
 const now=Date.now();
 for(const rules of [require('./codex-rules.cjs'),require('./weapon-codex.cjs')]){
  const book=rules.book(user);
  for(let rarity=0;rarity<6;rarity++)for(const skin of ['swordsman','spearman','archer','mage']){
   book.discovered[rarity+':'+skin]??=now;book.registered[rarity+':'+skin]??=now;
  }
 }
 const forge=user.state.player.forgeCodex??={};
 for(const field of ['discovered','registered','active','stageDiscovered','stageRegistered'])forge[field]??={};
 for(let tier=1;tier<=6;tier++){
  forge.discovered[tier]??=now;forge.registered[tier]??=now;
  for(let level=1;level<=3;level++){forge.stageDiscovered[tier+':'+level]??=now;forge.stageRegistered[tier+':'+level]??=now;}
 }
 store.save(db);
 console.log('JUKA: 24 heróis, 24 armas e 18 evoluções de forja registrados. Bônus disponíveis para ativação manual. Backup salvo.');
}finally{store.close();}
