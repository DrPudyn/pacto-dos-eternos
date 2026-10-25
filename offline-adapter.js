// Local single-player adapter. Appended inside the original game's module scope.
function startOffline() {
 const KEY='minihero.offline.v1';
 let saved; try {saved=JSON.parse(localStorage.getItem(KEY));}catch{}
 let player=saved?.player??{heroes:[],blacksmiths:[],blacksmithInService:null,porters:[],porterOn:false,chest:0,mintCards:3,repairedAt:Date.now()};
 let balance=saved?.balance??L(100000), seq=0, nextId=saved?.nextId??1, fusion=[], reveals=new Map();
 const grants={...(saved?.grants??{})};
 for(const hero of player.heroes)mhSkillNormalize(hero);
 if(!grants.house54000000){balance+=L(54000000);grants.house54000000=true;}
 if(!grants.extra1500000){balance+=L(1500000);grants.extra1500000=true;}
 if(!grants.extra1000){balance+=L(1000);grants.extra1000=true;}
 function makeHero(rarity){
  if(rarity===undefined){let roll=Math.random()*100;rarity=0;for(let i=0;i<Xt.length;i++){roll-=Xt[i].odds;if(roll<0){rarity=i;break;}}}
  let [min,max]=Xt[rarity].stats,stat=()=>Math.floor(min*10+Math.random()*(max-min)*10+1),skin=en[Math.floor(Math.random()*en.length)],dur=stat();
  let skills=[],pool=[...Qt];for(let i=0;i<=rarity&&pool.length;i++){let total=pool.reduce((a,k)=>a+Zt[k].weight,0),roll=Math.random()*total;let k=pool.find(k=>(roll-=Zt[k].weight)<0)??pool[0];skills.push(k);pool.splice(pool.indexOf(k),1);}
  return {id:nextId++,skin,rarity,atk:stat(),atkSpd:stat(),dur,range:nn(skin).range,skills,skillLevels:{},skillXpTicks:0,durability:rn(dur),status:'idle',restingSince:null,forgeSince:null,mintedAt:Date.now()};
 }
 if(!saved)for(let i=0;i<3;i++)player.heroes.push(makeHero(0));
 let live=saved?.battle?{startedAt:Date.now()-Math.floor(saved.battle.tick*1000/30),battle:gc.fromState(saved.battle)}:{startedAt:Date.now(),battle:gc.start(123456,[])};
 player.repairedAt=Date.now();
 // The battle requests a boss every 20 respawns, only if no other boss is alive/pending.
 live.battle.rollBoss=()=>true;
 live.battle.skillKillXpEnabled=true;
 live.battle.rarityMovementEnabled=true;
 live.battle.farmWavesEnabled=true;
 for(const actor of live.battle.heroes){const h=player.heroes.find(h=>h.id===actor.state.heroId);if(h){actor.state.skillLevels={...h.skillLevels};actor.state.skillXpTicks=h.skillXpTicks;}}
 function advance(){bc(player,live,Date.now());}
 function upgradeSkill(heroId,skill,expectedLevel){advance();const upgrade=mhSkillUpgrade(player,live.battle,heroId,skill,expectedLevel,balance);balance-=upgrade.coins*1e6;save();return upgrade;}
 function save(){localStorage.setItem(KEY,JSON.stringify({player,balance,nextId,grants,battle:live.battle.toState()}));}
 function packet(minted=[]){return {rulesVersion:31,seq:++seq,serverTime:Date.now(),player:structuredClone(player),hunt:{startedAt:live.startedAt,battle:live.battle.toState()},market:{...rr,listings:[]},sales:[],minted,referralCards:0,away:null,bossEvent:null,porterPrice:kn(player.porters.length),portersLeft:1000-player.porters.length,blacksmithsLeft:On.map(t=>t.supply),referral:null,withdrawals:null};}
 let game;
 let walletChanged=()=>{};
 const wallet={state:{account:'linked',address:'OfflinePlayer111111111111111111111111111',busy:false,waitingForWallet:false},onChange:fn=>{walletChanged=fn;return ()=>{};},signOut:()=>Promise.resolve(),signIn:()=>Promise.resolve()};
 function apply(minted=[]){let p=packet(minted);save();game.applyPacket(p,Date.now());game.onStatus('online');return {ok:true,value:p};}
 function err(error){return {ok:false,status:409,error};}
 function reconcile(){vc(live,player);}
 async function action(route,args={}){
  advance();let h=player.heroes.find(h=>h.id===args.heroId),minted=[];
  switch(route){
   case R.state: break;
   case R.activate: if(!h)return err('hero-not-found');if(player.heroes.filter(h=>h.status!=='idle').length>=50)return err('team-full');h.status=h.durability>=.5&&Rn(player)>0?'working':'resting';h.restingSince=Date.now();reconcile();break;
   case R.deactivate: if(!h)return err('hero-not-found');h.status='idle';h.forgeSince=null;reconcile();break;
   case R.work: for(let hero of player.heroes.filter(h=>args.heroIds?.includes(h.id))){if(Rn(player)>0&&hero.durability>=.5){hero.status='working';hero.forgeSince=null;}}reconcile();break;
   case R.rest: for(let hero of player.heroes.filter(h=>args.heroIds?.includes(h.id))){hero.status='resting';hero.restingSince=Date.now();}reconcile();break;
   case R.forge: if(!h)return err('hero-not-found');if(!An(player))return err('needs-blacksmith');if(Nn(player.heroes).length>=Mn(player))return err('forge-full');h.status='resting';h.forgeSince=Date.now();reconcile();break;
   case R.leaveForge: if(!h)return err('hero-not-found');h.forgeSince=null;break;
   case R.blacksmithInService: player.blacksmithInService=args.blacksmithId;break;
   case R.blacksmithOutOfService: player.blacksmithInService=null;for(let h of player.heroes)h.forgeSince=null;break;
   case R.porterSwitch: player.porterOn=!!args.on;break;
   case R.mintCard: if(player.mintCards<args.count)return err('no-mint-card');if(player.heroes.length+args.count>500)return err('hero-limit');player.mintCards-=args.count;for(let i=0;i<args.count;i++){let h=makeHero();player.heroes.push(h);minted.push(h.id);}break;
   case R.fusionChoose: fusion=[...args.heroIds];break;
   case R.summonReveal: {let ids=reveals.get(args.orderId)??[];reveals.delete(args.orderId);return apply(ids);}
   case R.marketBrowse: {let p=packet();p.page={kind:args.kind??'hero',grade:args.grade,sort:args.sort??'price',after:null,listings:[],more:false,counts:[]};game.applyPacket(p,Date.now());return {ok:true,value:p};}
   case R.marketCheapest: break;
   default: $("Esta função depende de outros jogadores ou da blockchain e não está disponível offline.",'info');return err('market-closed');
  }
  return apply(minted);
 }
 async function pay(product,opts={}){
  advance();let cost=0,minted=[];
  if(product.startsWith('summon-'))cost=Number(product.split('-')[1])*fn;
  else if(product.startsWith('blacksmith-'))cost=On[Number(product.split('-')[1])-1]?.price??Infinity;
  else if(product==='porter')cost=kn(player.porters.length)??Infinity;
  else if(product==='fusion'){if(!fusion.length||fusion.length%4)return {status:'failed',error:'fusion-not-chosen'};let selected=player.heroes.filter(h=>fusion.includes(h.id));if(selected.length!==fusion.length||selected.some(h=>h.status!=='idle'||h.rarity!==selected[0].rarity)||selected[0].rarity>=5)return {status:'failed',error:'fusion-hero-busy'};cost=Zn(selected[0].rarity,selected.length/4).price;}
  else return {status:'failed',error:'unknown-product'};
  if(balance<cost)return {status:'failed',error:'insufficient-token'};
  balance-=cost;
  if(product.startsWith('summon-')){let count=Number(product.split('-')[1]);if(player.heroes.length+count>500){balance+=cost;return {status:'failed',error:'hero-limit'};}for(let i=0;i<count;i++){let h=makeHero();player.heroes.push(h);minted.push(h.id);}}
  else if(product.startsWith('blacksmith-')){let id=nextId++;player.blacksmiths.push({id,tier:Number(product.split('-')[1]),mintedAt:Date.now()});if(player.blacksmithInService===null)player.blacksmithInService=id;}
  else if(product==='porter')player.porters.push({id:nextId++,mintedAt:Date.now()});
  else if(product==='fusion'){let rarity=player.heroes.find(h=>h.id===fusion[0]).rarity;player.heroes=player.heroes.filter(h=>!fusion.includes(h.id));for(let i=0;i<fusion.length/4;i++){let r=rarity+1;if(Xn(rarity)!==null&&Math.random()<.1)r=rarity+2;let h=makeHero(r);player.heroes.push(h);minted.push(h.id);}fusion=[];}
  let orderId=crypto.randomUUID();reveals.set(orderId,minted);apply(minted);walletChanged();return {status:'paid',orderId,signature:null};
 }
 const accountActions=document.createElement('div'),walletPanel=document.createElement('div');
 game=sT.start({root:document.getElementById('app'),accountActions,walletPanel,wallet,action,pay,walletBalance:async()=>({ok:true,value:{token:String(balance),sol:'0'}})});
 // Keep all original rendering and combat; replace remote-only actions with local equivalents.
 Zx=(ctx,item,callback)=>{let cost=item.kind==='porter'?kn(player.porters.length):item.kind==='fusion'?Zn(item.rarity,item.count).price:ax(item);dx({title:'PURCHASE • OFFLINE'},(body)=>{let buy=Y('main',async()=>{buy.disabled=true;cx();let result=await pay(Rx(item));if(result.status!=='paid')$(uo(result.error),'error');else if(item.kind!=='summon'&&item.kind!=='fusion')$('Compra com saldo local concluída.','success');callback?.(result);},'CONFIRM');body.append(Ux(item),J('p',{class:'page-note',text:`Custo: ${H(cost??0)} MHDG locais. Saldo: ${H(balance)}. Sem carteira, SOL ou dinheiro real.`}),buy,Y('alt',cx,'CANCEL'));});};
 wS=()=>{advance();balance+=player.chest;player.chest=0;apply();walletChanged();cx();$('Recompensas transferidas para seu saldo local. Sem valor real.','success');};
 KC=()=> $('Convites são uma função online. Seu progresso offline fica salvo neste PC.','info');
 apply();
 installForgeProgression({getCurrent:()=>({packet:{player},balance}),perform:async(route,data)=>{advance();if(route==='forge/upgrade'){const value=mhForgeUpgrade(player,data.tier,data.expectedLevel,balance);balance-=value.coins*1e6;}apply();return {};}});
 installSkillProgression({getCurrent:()=>({packet:{player},balance}),upgrade:async data=>{const result=upgradeSkill(data.heroId,data.skill,data.expectedLevel);apply();return result;}});
 setInterval(()=>{try{advance();apply();}catch(e){console.error('Offline save failed',e);}},3000);
 window.addEventListener('beforeunload',()=>{advance();save();});
 // Exposed only for local diagnostics and save backup, never a remote service.
 window.miniheroOffline={exportSave:()=>{advance();save();return JSON.parse(localStorage.getItem(KEY));}};
 const badge=document.createElement('div');badge.textContent='OFFLINE • SALVO NESTE PC';badge.style.cssText='position:fixed;bottom:4px;left:8px;z-index:8;font:10px monospace;color:#a9a9b8;pointer-events:none';document.body.append(badge);
}
startOffline();
