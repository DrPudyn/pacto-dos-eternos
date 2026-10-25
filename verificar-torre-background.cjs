const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const {createEngine}=require('./shared-engine.cjs'),{towerService}=require('./tower-service.cjs'),{service}=require('./shared-service.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'minihero-tower-bg-'));
try{
 const sample=createEngine(null).engine.player.heroes[0];
 const heroes=Array.from({length:15},(_,i)=>({...sample,id:i+1,atk:300,dur:400,durability:2000,skills:[]}));
 const user={id:'background-test'};towerService().start(user,heroes,heroes.map(h=>h.id));
 fs.writeFileSync(path.join(dir,'jogadores.json'),JSON.stringify({users:[user],sessions:[],listings:[],trades:[]}));
 const app=service({dir}),start=user.tower.lastAt;
 // No HTTP requests or Tower screen polling during this simulated minute.
 for(let i=1;i<=60;i++)app.advanceTowers(start+i*1000);
 app.persist();app.close();const saved=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'))).users[0];
 assert.ok(saved.tower.ticks>1000);assert.ok(saved.tower.kills>0);assert.ok(saved.tower.completed>0);
 const restored=service({dir});restored.advanceTowers(start+61000);restored.persist();restored.close();
 const after=JSON.parse(fs.readFileSync(path.join(dir,'jogadores.json'))).users[0];
 assert.ok(after.tower.ticks>=saved.tower.ticks);assert.ok(after.tower.kills>=saved.tower.kills);
 console.log('OK: Torre progride sem consultas, completa andares, salva e restaura em segundo plano.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
