from PIL import Image
from pathlib import Path
from collections import deque
import shutil
src=Path(r'C:/Users/edson/.codex/generated_images/01a14b48-d2aa-76a0-9430-e3e064dee149')
out=Path('assets/campaign-bestiary');out.mkdir(exist_ok=True)
names=['08e387b8-ccfa-447d-a2a3-d19497183a14','6a2b4a55-d806-4690-9da8-1f6095010b58','eaa8a3fc-e0d6-4374-b4dc-c904af879d7b']
for pack,name in enumerate(names):
 im=Image.open(src/f'exec-{name}.png').convert('RGBA');print(name,im.size)
 shutil.copy2(src/f'exec-{name}.png',out/f'family-{pack+1}.png')
 xs=([0,285/1619,585/1619,890/1619,1220/1619,1] if pack==0 else [0,287/1619,581/1619,891/1619,1225/1619,1]) if pack<2 else [0,.17,.355,.55,.72,1];ys=([0,330/971,637/971,1] if pack==0 else [0,349/971,665/971,1]) if pack<2 else [0,.35,.675,1]
 for row in range(3):
  for col in range(5):
   tile=im.crop((int(xs[col]*im.width),int(ys[row]*im.height),int(xs[col+1]*im.width),int(ys[row+1]*im.height)))
   alpha=tile.getchannel('A');pix=alpha.load();seen=set();components=[]
   for yy in range(tile.height):
    for xx in range(tile.width):
     if pix[xx,yy]<20 or (xx,yy) in seen: continue
     comp=[];queue=deque([(xx,yy)]);seen.add((xx,yy))
     while queue:
      x,y=queue.popleft();comp.append((x,y))
      for dx,dy in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1)]:
       nx,ny=x+dx,y+dy
       if 0<=nx<tile.width and 0<=ny<tile.height and (nx,ny) not in seen and pix[nx,ny]>=20:seen.add((nx,ny));queue.append((nx,ny))
     components.append(comp)
   biggest=max(components,key=len);mask=Image.new('L',tile.size);mp=mask.load()
   for comp in components:
    if comp is biggest or (len(comp)>len(biggest)*.02 and all(2<x<tile.width-3 and 2<y<tile.height-3 for x,y in comp)):
     for x,y in comp:mp[x,y]=pix[x,y]
   tile.putalpha(mask);box=tile.getbbox();tile=tile.crop(box);tile.thumbnail((88,88),Image.Resampling.NEAREST)
   canvas=Image.new('RGBA',(96,96));canvas.alpha_composite(tile,((96-tile.width)//2,96-tile.height-4));canvas.save(out/f'enemy-{pack*3+row+1}-{col}.png')
