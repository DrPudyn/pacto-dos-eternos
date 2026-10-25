const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function sharedStore(dir,options={}){
 fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'jogadores.json'),sql=new DatabaseSync(path.join(dir,'jogadores.sqlite'));
 sql.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS game_state(singleton INTEGER PRIMARY KEY CHECK(singleton=1), payload TEXT NOT NULL, hash TEXT NOT NULL, previous_hash TEXT, version INTEGER NOT NULL); PRAGMA user_version=1;');
 let version=0,currentHash=null;
 function mirror(text){try{const temp=file+'.tmp';fs.writeFileSync(temp,text);if(fs.existsSync(file))fs.copyFileSync(file,file+'.bak');fs.renameSync(temp,file);}catch(e){console.error('O estado foi confirmado no SQLite, mas o espelho JSON precisa ser atualizado:',e.code??'erro de arquivo');}}
 function save(db){const text=JSON.stringify(db),nextHash=hash(text);sql.exec('BEGIN IMMEDIATE');try{const row=sql.prepare('SELECT version FROM game_state WHERE singleton=1').get();if((row?.version??0)!==version)throw Error('Outro servidor alterou os dados. Atualize antes de continuar.');sql.prepare('INSERT INTO game_state VALUES(1,?,?,?,?) ON CONFLICT(singleton) DO UPDATE SET payload=excluded.payload,hash=excluded.hash,previous_hash=excluded.previous_hash,version=excluded.version').run(text,nextHash,currentHash,version+1);options.beforeCommit?.();sql.exec('COMMIT');version++;currentHash=nextHash;}catch(e){sql.exec('ROLLBACK');throw e;}mirror(text);}
 function load(){const row=sql.prepare('SELECT * FROM game_state WHERE singleton=1').get(),text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;version=row?.version??0;currentHash=row?.hash??null;
  if(row&&hash(row.payload)!==row.hash)throw Error('A integridade do banco do jogo não pôde ser confirmada.');
  if(row&&(!text||hash(text)===row.hash||hash(text)===row.previous_hash)){if(!text||hash(text)!==row.hash)mirror(row.payload);return JSON.parse(row.payload);}
  const db=text?JSON.parse(text):{users:[],sessions:[],listings:[],trades:[]};
  // Explicit local JSON edits remain supported for owner tools and test fixtures.
  if(!row&&text&&!fs.existsSync(path.join(dir,'jogadores.pre-festival.json')))fs.copyFileSync(file,path.join(dir,'jogadores.pre-festival.json'));
  save(db);return db;
 }
 return {load,save,close:()=>sql.close()};
}
module.exports={sharedStore};
