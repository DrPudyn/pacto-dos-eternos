const names=['Stone Halls','Frost Crypt','Ember Vault','Moss Ruins','Vampire Castle'];
function mapFor(floor=1){return {name:names[(floor-1)%names.length],width:41,height:21,blocked:Array.from({length:861},(_,i)=>{const x=i%41,y=Math.floor(i/41);return +(x===0||y===0||x===40||y===20||x%2===0&&y%2===0);})};}
function tiersFor(floor){const scale=Math.pow(1.09,Math.min(200,floor-1));return [{hp:Math.round(200*scale),mhdg:0,weight:50,kinds:['slime']},{hp:Math.round(400*scale),mhdg:0,weight:30,kinds:['blueslime']},{hp:Math.round(800*scale),mhdg:0,weight:15,kinds:['orc']},{hp:Math.round(1600*scale),mhdg:0,weight:5,kinds:['minotaur']}];}
module.exports={mapFor,tiersFor};
