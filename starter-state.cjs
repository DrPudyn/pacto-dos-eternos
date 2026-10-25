const {createEngine}=require('./shared-engine.cjs');
function starterState(){
 const state=createEngine(null).export();
 state.player.heroes=[];state.player.blacksmiths=[];state.player.blacksmithInService=null;
 state.player.porters=[];state.player.porterOn=false;state.player.chest=0;state.player.mintCards=15;state.player.weaponSummons=15;
 state.balance=0;state.nextId=1;state.grants={};state.stats={created:0,fusions:0,legendary:0,mythic:0};
 return state;
}
module.exports={starterState};
