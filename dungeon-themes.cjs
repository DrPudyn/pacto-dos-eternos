function addDungeonThemes(source){
 const old='var pr=[{name:`Stone Halls`,floor:11515820,wall:16777215,block:11975082,element:`wind`},{name:`Frost Crypt`,floor:10273766,wall:12837631,block:10930410,element:`ice`},{name:`Ember Vault`,floor:14918270,wall:16762017,block:14259051,element:`fire`},{name:`Moss Ruins`,floor:10339722,wall:13494964,block:10008961,element:`earth`}],mr=.8';
 const next='var pr=[{name:`Stone Halls`,floor:11515820,wall:16777215,block:11975082,element:`wind`},{name:`Frost Crypt`,floor:10273766,wall:12837631,block:10930410,element:`ice`},{name:`Ember Vault`,floor:14918270,wall:16762017,block:14259051,element:`fire`},{name:`Moss Ruins`,floor:10339722,wall:13494964,block:10008961,element:`earth`},{name:`Vampire Castle`,floor:7822654,wall:13617393,block:6632250,element:`fire`}],mr=.8';
 if(!source.includes(old))throw Error('Biome palette target missing');source=source.replace(old,next);
 const mob='Ay={slime:{name:`Green Slime`';
 if(!source.includes(mob))throw Error('Monster metadata target missing');
 source=source.replace(mob,'Ay={vampire:{name:`Vampire`,idle:{frames:8,rows:1}},slime:{name:`Green Slime`');
 const add=(from,to)=>{if(!source.includes(from))throw Error('Snow layer target missing');source=source.replace(from,to);};
 add('this.glowTexture=this.createGlowTexture(),this.app.stage.addChild', 'this.glowTexture=this.createGlowTexture(),this.snow=new nm,this.app.stage.addChild');
 add('this.world.addChild(this.floor,this.blocks,this.darkness,this.lights,this.monsterLayer', 'this.world.addChild(this.floor,this.blocks,this.darkness,this.lights,this.snow,this.monsterLayer');
 add('applyBiome(e){this.tinted.floor.forEach', 'renderSnow(e,on){this.snow.clear();if(!on)return;for(let i=0;i<18;i++){let x=(i*83+Math.floor(e*(5+i%3)*7))%640+25,y=(i*47+Math.floor(e*(9+i%4)*5))%330+16,s=i%5===0?2:1;this.snow.rect(x,y,s,s).fill({color:15071487,alpha:i%4===0?.5:.24})}}applyBiome(e){this.tinted.floor.forEach');
 add('this.darkness.alpha=i.darkness,this.renderMagic(i.cast,i.element,i.swap)', 'this.darkness.alpha=i.darkness,this.renderSnow(r,i.biome.name===`Frost Crypt`),this.renderMagic(i.cast,i.element,i.swap)');
 add('i=yr(r);i.index', 'i=yr(r+(this.biomeElapsedOffset??0));i.index');
 return source;
}
module.exports={addDungeonThemes};
