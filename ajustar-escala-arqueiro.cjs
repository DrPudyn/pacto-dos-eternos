const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const SHEETS=['archer-idle.png','archer-walk.png','archer-attack.png'];
const TARGET={feet:19,height:15,centerX:16,top:4};
function normalizeSheets(){
 const script=`
from PIL import Image
import os
TARGET_FEET=${TARGET.feet}
TARGET_H=${TARGET.height}
TARGET_CX=${TARGET.centerX}
TARGET_TOP=${TARGET.top}
def bbox(frame):
 px=frame.load(); xs,ys=[],[]
 for y in range(32):
  for x in range(32):
   if px[x,y][3]>0: xs.append(x); ys.append(y)
 if not xs: return None
 return min(xs),min(ys),max(xs),max(ys)
def paste_frame(content):
 out=Image.new('RGBA',(32,32),(0,0,0,0))
 x0=round(TARGET_CX-content.width/2)
 y0=TARGET_FEET-content.height+1
 if y0<TARGET_TOP: y0=TARGET_TOP
 out.paste(content,(x0,y0),content)
 return out
for name in ${JSON.stringify(SHEETS)}:
 path=os.path.join('assets/arqueiro',name)
 im=Image.open(path).convert('RGBA')
 # Base scale from idle frame 0 footprint vs target body height.
 ref=bbox(im.crop((0,0,32,32)))
 if not ref: raise SystemExit('empty archer sheet '+name)
 _,y0,_,y1=ref
 scale=TARGET_H/max(1,y1-y0+1)
 w,h=im.width//32,im.height//32
 out=Image.new('RGBA',im.size,(0,0,0,0))
 for row in range(h):
  for col in range(w):
   frame=im.crop((col*32,row*32,col*32+32,row*32+32))
   b=bbox(frame)
   if not b:
    out.paste(frame,(col*32,row*32))
    continue
   crop=frame.crop(b)
   nw=max(1,round(crop.width*scale))
   nh=max(1,round(crop.height*scale))
   scaled=crop.resize((nw,nh),Image.Resampling.NEAREST)
   out.paste(paste_frame(scaled),(col*32,row*32))
 out.save(path)
 print('normalized',path,im.size)
`;
 const python=spawnSync('python3',['-c',script],{stdio:'inherit'}).status;
 if(python)throw Error('Falha ao normalizar sprites do arqueiro.');
}
module.exports={normalizeSheets,SHEETS,TARGET};
