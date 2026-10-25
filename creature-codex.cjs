const config=require('./campaign-config.cjs');
function book(u){return u.creatureCodex??={version:1,discovered:{},registered:{},active:{}};}
function valid(r,v){return Number.isInteger(r)&&r>=1&&r<=9&&Number.isInteger(v)&&v>=0&&v<5;}
function discover(u,r,v){if(valid(r,v))book(u).discovered[r+':'+v]??=Date.now();}
function migrate(u){for(const r of Object.keys(u.campaign?.cleared??{}).map(Number))for(let v=0;v<5;v++)discover(u,r,v);}
function register(u,r,v){if(!valid(r,v)||!book(u).discovered[r+':'+v])throw Error('Derrote esta criatura para descobri-la.');book(u).registered[r+':'+v]??=Date.now();}
function ready(u,r){return [0,1,2,3,4].every(v=>book(u).registered[r+':'+v]);}
function activate(u,r){if(!valid(r,0)||!ready(u,r))throw Error('Registre os quatro mobs e o boss deste castelo.');book(u).active[r]??=Date.now();}
function bonuses(u){let gold=0;for(let r=1;r<=9;r++)if(book(u).active[r]&&ready(u,r))gold+=.005;return {gold:Math.round(gold*1e6)/1e6};}
function view(u){migrate(u);const b=book(u);return {bonuses:bonuses(u),collections:config.stages.map(s=>({region:s.id,name:s.name,color:'#'+s.bestiary.color.toString(16).padStart(6,'0'),description:'+0,5% de Ouro dos mobs da Masmorra Automática',active:!!b.active[s.id]&&ready(u,s.id),entries:s.bestiary.names.map((name,variant)=>({region:s.id,variant,name,boss:variant===4,discovered:!!b.discovered[s.id+':'+variant],registered:!!b.registered[s.id+':'+variant]}))}))};}
module.exports={book,discover,migrate,register,activate,bonuses,view};
