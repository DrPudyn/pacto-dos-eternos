// Pixel-native spell palette, icons and multi-stage VFX, shared by every arena.
function mhATBStyle(unit,region,skill={id:'attack'}){
 const hero={swordsman:['#f6e8bf','#e99c38','#fff9df'],spearman:['#77dce9','#2c91b8','#e8fbff'],archer:['#a5e664','#38784c','#efffc9'],mage:['#70baff','#355de2','#e5f6ff']};
 const themes=[['#70cb7e','#9e383f','#e6ed9a'],['#69cafa','#db8c39','#dcfaff'],['#f0be65','#b95d29','#ffedac'],['#ff8a37','#b83e25','#ffe592'],['#a690ee','#514ac0','#ddd0ff'],['#64d5cb','#467b9b','#d6fff5'],['#ff7250','#b82e41','#ffcd6b'],['#e9d19b','#a14863','#f9f0d1'],['#ff5a62','#a72450','#ffe19c']];
 const p=unit?.side==='hero'?hero[unit.skin]??hero.mage:themes[region-1];let type=unit?.side==='hero'?({swordsman:'steel',spearman:'ice',archer:'wind',mage:'arcane'})[unit.skin]:['nature','crystal','sand','fire','void','soul','fire','holy','blood'][region-1];
 if(skill.id==='heal')return{primary:unit?.skin==='mage'?'#7ce9da':'#a5eb89',shade:'#296f73',light:'#edffcc',type:'heal'};
 if(skill.id==='buff')return{primary:unit?.skin==='archer'?'#91e6d4':unit?.skin==='mage'?'#7eb8ff':'#ffd978',shade:p[1],light:'#fff3c6',type:unit?.skin==='archer'?'haste':unit?.skin==='mage'?'rune':'guard'};
 return{primary:p[0],shade:p[1],light:p[2],type};
}
function mhATBIcon(unit,skill,region,size=32){
 const canvas=document.createElement('canvas');canvas.width=24;canvas.height=24;canvas.className='atb-skill-icon';canvas.setAttribute('aria-hidden','true');const c=canvas.getContext('2d'),p=mhATBStyle(unit,region,skill);c.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};rect(1,1,22,22,'#081525');rect(2,2,20,20,p.shade);rect(3,3,18,18,'#122639');rect(3,3,18,1,p.primary);
 if(skill.id==='heal'){rect(8,6,8,14,'#12212c');rect(9,8,6,10,p.primary);rect(10,5,4,3,'#e1c58a');rect(11,10,2,6,p.light);rect(9,12,6,2,p.light);rect(15,7,2,2,'#fffbe7');}
 else if(skill.id==='buff'){if(p.type==='haste'){for(let x=6;x<18;x+=6){rect(x,8,3,2,p.light);rect(x+2,10,3,2,p.primary);rect(x+4,12,3,2,p.primary);rect(x+2,14,3,2,p.primary);rect(x,16,3,2,p.light);}}else if(p.type==='rune'){c.strokeStyle=p.primary;c.lineWidth=2;c.strokeRect(7,7,10,10);rect(10,4,4,3,p.light);rect(10,17,4,3,p.light);rect(4,10,3,4,p.light);rect(17,10,3,4,p.light);rect(10,10,4,4,p.primary);}else{rect(7,6,10,9,p.shade);rect(8,7,8,8,p.primary);rect(9,15,6,2,p.primary);rect(11,17,2,2,p.primary);rect(10,8,2,7,p.light);rect(8,9,8,2,p.light);}}
 else if(unit.skin==='swordsman'||/steel|blood/.test(p.type)){for(let i=0;i<9;i++){rect(15-i,5+i,3,3,'#06111e');rect(16-i,5+i,2,2,p.light);}rect(6,14,7,2,p.primary);rect(7,16,2,3,p.shade);}
 else if(unit.skin==='spearman'||p.type==='ice'){for(let i=0;i<11;i++)rect(6+i,17-i,2,2,p.shade);rect(15,5,4,4,p.primary);rect(17,4,3,3,p.light);rect(13,8,3,3,p.primary);}
 else if(unit.skin==='archer'||p.type==='wind'){c.strokeStyle=p.primary;c.lineWidth=2;c.beginPath();c.moveTo(8,5);c.lineTo(16,12);c.lineTo(8,19);c.stroke();rect(8,6,1,13,p.light);rect(5,11,14,2,p.light);rect(17,10,3,4,p.primary);}
 else{for(let y=5;y<20;y++)for(let x=5;x<20;x++){const d=Math.abs(x-12)+Math.abs(y-12);if(d<7)rect(x,y,1,1,d<3?p.light:d<5?p.primary:p.shade);}rect(6,5,2,2,p.primary);rect(17,17,2,2,p.primary);}
 canvas.style.width=size+'px';canvas.style.height=size+'px';return canvas;
}
function mhATBVFX(ctx,event,time,state,position,region){
 const age=time-event.at;if(age<0||age>1.45)return;const source=state.units.find(u=>u.id===event.source);if(!source)return;const style=mhATBStyle(source,region,{id:event.kind}),from=position(source),seed=[...event.effect].reduce((n,c)=>(n*33+c.charCodeAt(0))>>>0,1),charge=Math.min(1,age/.28),travel=Math.max(0,Math.min(1,(age-.18)/.35)),impact=Math.max(0,(age-.48)/.8);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=Math.min(1,(1.45-age)*3);ctx.lineCap='square';
 const pixel=(x,y,w,h,color,alpha=1)=>{ctx.globalAlpha=alpha*Math.min(1,(1.45-age)*3);ctx.fillStyle=color;ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,w,h);};
 const line=(points,color,width=3,alpha=1)=>{ctx.globalAlpha=alpha*Math.min(1,(1.45-age)*3);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x/2)*2,Math.round(y/2)*2):ctx.moveTo(Math.round(x/2)*2,Math.round(y/2)*2));ctx.stroke();};
 if(age<.48){for(let k=0;k<12;k++){const a=k*Math.PI/6+age*3,r=34*(1-charge)+10;pixel(from.x+Math.cos(a)*r,from.y-45+Math.sin(a)*r,3,3,style.primary,.7);}}
 for(const [index,id] of event.targets.entries()){const target=state.units.find(u=>u.id===id);if(!target)continue;const to=position(target),center={x:to.x,y:to.y-48},radius=target.boss?92:48;
  if(event.kind==='buff'){
   // Ascending lightning follows the silhouette; no rectangular frame.
   for(let bolt=0;bolt<7;bolt++){const x=to.x-radius+bolt*radius/3,phase=(age*100+bolt*23)%130,y=to.y-phase;line([[x,y+20],[x+7,y+10],[x+1,y+10],[x+11,y-9],[x+5,y-9],[x+13,y-27]],bolt%2?style.primary:style.light,bolt%2?3:2,.8);pixel(x+5,y-36,3,5,style.light,.65);}
   ctx.globalAlpha=.35;ctx.strokeStyle=style.primary;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(to.x,to.y+3,radius*(.8+.15*Math.sin(age*5)),12,0,0,Math.PI*2);ctx.stroke();
  }else if(event.kind==='heal'){
   for(let k=0;k<13;k++){const a=k*2.4+age,rr=18+(k%4)*9,x=to.x+Math.cos(a)*rr,y=to.y-((age*95+k*17)%125);pixel(x,y,4,4,k%3?style.primary:style.light,.9);if(k%4===0){pixel(x-4,y+2,12,3,style.light);pixel(x+1,y-3,3,12,style.light);}}
   for(let ring=0;ring<3;ring++){const r=20+((age*40+ring*15)%45);ctx.globalAlpha=.3*(1-(r-20)/45);ctx.strokeStyle=style.primary;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(to.x,to.y+2,r,r*.22,0,0,Math.PI*2);ctx.stroke();}
  }else{
   const type=style.type,melee=/steel|blood/.test(type)||/bite|fang|axe|execution|demon|charge|slash/.test(event.effect);
   if(melee&&age>.25){const t=Math.min(1,(age-.25)/.45);for(let arc=0;arc<3;arc++){const points=[];for(let k=0;k<8;k++){const a=-1.6+k*.28+t*.7,r=radius+arc*9;points.push([center.x+Math.cos(a)*r-radius*.4,center.y+Math.sin(a)*r]);}line(points,arc===1?style.light:style.primary,arc===1?5:3,1-impact*.6);}if(impact>0)for(let k=0;k<14;k++){const a=k*2.3,r=impact*(30+k%4*16);pixel(center.x+Math.cos(a)*r,center.y+Math.sin(a)*r,3,6,k%2?style.primary:style.light,1-impact);}}
   else if(/spore|venom|curse|web/.test(event.effect)&&age>.25){for(let k=0;k<19;k++){const a=k*2.4+age*.8,r=18+impact*55,x=center.x+Math.cos(a)*r,y=center.y+Math.sin(a)*r*.6-age*18;pixel(x,y,5+k%3*2,5+k%3*2,k%3?'#98b95b':'#d5e59c',.6);if(k%5===0)line([[x,y],[x+6,y-4],[x+9,y]],'#cee29b',2,.7);}}
   else if(type==='wind'||/arrow|pierce|pick|royal/.test(event.effect)){const direction=Math.atan2(center.y-from.y+45,center.x-from.x),x=from.x+(center.x-from.x)*travel,y=from.y-45+(center.y-from.y+45)*travel;if(travel<1){for(let k=5;k>=0;k--){const tx=x-Math.cos(direction)*k*8,ty=y-Math.sin(direction)*k*8;pixel(tx,ty,k<2?8:3,k<2?4:2,k<2?style.light:style.primary,1-k*.12);}line([[x-10,y-6],[x+10,y],[x-10,y+6]],style.primary,4);line([[x-26,y-6],[x-18,y],[x-26,y+6]],style.light,3);}if(impact>0){for(let k=0;k<9;k++){const a=k*.8,r=impact*65;line([[center.x+Math.cos(a)*r,center.y+Math.sin(a)*r],[center.x+Math.cos(a)*(r+8),center.y+Math.sin(a)*(r+8)]],k%2?style.primary:style.light,3,1-impact);}}}
   else if(/nature|sand/.test(type)&&age>.3){for(let spike=0;spike<7;spike++){const x=to.x-radius+spike*radius/3,h=Math.max(0,Math.sin(Math.min(1,(age-.3)/.8)*Math.PI))*(32+(spike%3)*18);line([[x,to.y],[x+4,to.y-h*.4],[x-2,to.y-h*.7],[x+6,to.y-h]],style.shade,9);line([[x+2,to.y-2],[x+6,to.y-h]],style.primary,4);}for(let k=0;k<10;k++)pixel(to.x+Math.sin(k*7)*radius,to.y-((age*60+k*12)%90),4,3,style.light,.6);}
   else{
    const x=from.x+(center.x-from.x)*travel,y=from.y-45+(center.y-from.y+45)*travel-Math.sin(travel*Math.PI)*28;
    if(travel<1){for(let tail=6;tail>=0;tail--){const t=Math.max(0,travel-tail*.035),tx=from.x+(center.x-from.x)*t,ty=from.y-45+(center.y-from.y+45)*t-Math.sin(t*Math.PI)*28,size=3+(6-tail);pixel(tx-size/2,ty-size/2,size,size,tail<2?style.light:style.primary,1-tail*.12);}if(type==='ice'||type==='crystal')line([[x-15,y],[x,y-12],[x+15,y],[x,y+12],[x-15,y]],style.light,3);}
    if(impact>0){const count=12+seed%7;for(let k=0;k<count;k++){const a=k*Math.PI*2/count+(seed%9)*.1,r=impact*(radius+30),size=Math.max(2,8-impact*6);pixel(center.x+Math.cos(a)*r,center.y+Math.sin(a)*r*.75,size,size,k%3?style.primary:style.light,1-impact*.8);}if(type==='fire'){for(let k=0;k<9;k++){const x=center.x+Math.sin(k*2.4)*radius*.6,y=to.y-(age-.4)*95-k%3*12;pixel(x,y,8,12,k%2?'#ffc55b':'#f46d32',1-impact);pixel(x+2,y,3,7,'#fff0ad',1-impact);}}else if(type==='soul'||type==='holy'){for(let k=0;k<4;k++){const x=center.x-35+k*23;line([[x,to.y],[x,to.y-100*(1-impact)]],k%2?style.light:style.primary,3,1-impact);}}else{const points=[];for(let k=0;k<=8;k++){const a=k*Math.PI/4;points.push([center.x+Math.cos(a)*impact*radius,center.y+Math.sin(a)*impact*radius]);}line(points,style.light,3,1-impact);}}
   }
  }
  if(age>.42){const value=event.values[index]??0,text=value?(event.kind==='heal'?'+':'−')+value:'↑';ctx.globalAlpha=Math.min(1,(1.45-age)*3);ctx.font='26px BattleTitle';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#071320';ctx.strokeText(text,to.x,to.y-108-age*22);ctx.fillStyle=event.kind==='heal'?style.primary:style.light;ctx.fillText(text,to.x,to.y-108-age*22);}
 }
 ctx.restore();
}
