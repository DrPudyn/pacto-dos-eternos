// Execute somente com o servidor parado e após solicitação explícita do dono.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {sharedStore}=require('./shared-store.cjs'),{starterState}=require('./starter-state.cjs');
if(!process.argv.includes('--confirm'))throw Error('Use --confirm apenas após autorização explícita para zerar o progresso.');
const dir=path.join(__dirname,'dados-compartilhados'),stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=path.join(__dirname,'backups','reset-geral-'+stamp);
fs.mkdirSync(backup,{recursive:true});fs.cpSync(dir,path.join(backup,'dados-compartilhados'),{recursive:true});
const store=sharedStore(dir);
try{
 const db=store.load(),at=Date.now(),count=db.users.length;
 for(const user of db.users){
  const identity={id:user.id,name:user.name,salt:user.salt,pass:user.pass,canImport:!!user.canImport,imported:true,packetSequence:user.packetSequence??0,appliedAwards:user.appliedAwards??[],appliedEvents:user.appliedEvents??[]};
  if(user.festivalDisqualified)identity.festivalDisqualified=true;
  for(const key of Object.keys(user))delete user[key];Object.assign(user,identity,{state:starterState(),resetAt:at});
 }
 db.listings=[];db.trades=[];delete db.festival;
 (db.resetHistory??=[]).push({at,users:count,starterScrolls:0,backup:path.relative(__dirname,backup)});
 store.save(db);
 for(const file of ['bonus-pendentes.json','eventos-pendentes.json'])if(fs.existsSync(path.join(dir,file)))fs.writeFileSync(path.join(dir,file),'[]');
 const saved=store.load();assert.equal(saved.users.length,count);
 for(const u of saved.users){assert.equal(u.state.balance,0);assert.equal(u.state.player.heroes.length,0);assert.equal(u.state.player.mintCards,0);assert.equal(u.state.player.blacksmiths.length,0);assert.equal(u.state.player.porters.length,0);assert.equal(u.codex,undefined);assert.equal(u.tower,undefined);}
 console.log(JSON.stringify({resetAccounts:count,heroes:0,gold:0,scrollsPerAccount:0,backup}));
}finally{store.close();}
