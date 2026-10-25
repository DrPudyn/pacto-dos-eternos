from pathlib import Path
from PIL import Image
import json,shutil
root=Path('assets/campaign-bestiary');manifest=json.loads((root/'pixel-manifest.json').read_text())
def cuts(alpha,n,axis):
 w,h=alpha.size;length=w if axis==0 else h;other=h if axis==0 else w;pixels=alpha.load();scores=[sum(pixels[i,j]>100 for j in range(other)) if axis==0 else sum(pixels[j,i]>100 for j in range(other)) for i in range(length)]
 result=[0]
 for k in range(1,n):
  expected=length*k/n;radius=int(length*(.06 if axis==0 else .085));candidates=range(max(result[-1]+1,int(expected)-radius),min(length-1,int(expected)+radius));best=min(candidates,key=lambda i:(sum(scores[max(0,i-2):i+3]),abs(i-expected)));result.append(best)
 return result+[length]
for region,name in manifest.items():
 region=int(region);src=Path(name);im=Image.open(src).convert('RGBA');shutil.copy2(src,root/f'pixel-region-{region}-source.png');xs,ys=cuts(im.getchannel('A'),5,0),cuts(im.getchannel('A'),4,1);
 if region==9:ys=[0,405,630,855,im.height]
 print(region,im.size,xs,ys)
 for col in range(5):
  frames=[]
  for row in range(4):
   cell=im.crop((xs[col],ys[row],xs[col+1],ys[row+1]));cell.putalpha(cell.getchannel('A').point(lambda v:255 if v>100 else 0));box=cell.getbbox()
   if not box:raise ValueError((region,col,row))
   frames.append(cell.crop(box))
  scale=21/max(max(f.size) for f in frames)
  for row,cell in enumerate(frames):
   cell=cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.NEAREST);alpha=cell.getchannel('A');cell=cell.convert('RGB').quantize(colors=20,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGBA');cell.putalpha(alpha)
   canvas=Image.new('RGBA',(24,24));canvas.alpha_composite(cell,((24-cell.width)//2,23-cell.height));canvas=canvas.resize((96,96),Image.Resampling.NEAREST);canvas.save(root/f'enemy-{region}-{col}-pixel-{row}.png')
   if row==0:canvas.save(root/f'enemy-{region}-{col}.png')
