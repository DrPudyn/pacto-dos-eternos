from PIL import Image
from pathlib import Path
import shutil
out=Path('assets/campaign-bestiary');src=Path(r'C:/Users/edson/.codex/generated_images/01a14b48-d2aa-76a0-9430-e3e064dee149/exec-12aab894-cf75-4b6f-8549-0dc8e3096c85.png')
im=Image.open(src).convert('RGBA');shutil.copy2(src,out/'forest-pixel-v2-source.png');print(im.size)
xs=[0,.22,.39,.585,.79,1];ys=[0,.30,.52,.74,1]
for col in range(5):
 frames=[]
 for row in range(4):
  cell=im.crop((round(xs[col]*im.width),round(ys[row]*im.height),round(xs[col+1]*im.width),round(ys[row+1]*im.height)))
  alpha=cell.getchannel('A').point(lambda v:255 if v>100 else 0);cell.putalpha(alpha);cell=cell.crop(cell.getbbox());frames.append(cell)
 scale=21/max(max(f.size) for f in frames)
 for row,cell in enumerate(frames):
  size=(max(1,round(cell.width*scale)),max(1,round(cell.height*scale)));cell=cell.resize(size,Image.Resampling.NEAREST)
  alpha=cell.getchannel('A');cell=cell.convert('RGB').quantize(colors=20,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGBA');cell.putalpha(alpha)
  canvas=Image.new('RGBA',(24,24));canvas.alpha_composite(cell,((24-cell.width)//2,23-cell.height));canvas=canvas.resize((96,96),Image.Resampling.NEAREST)
  canvas.save(out/f'enemy-1-{col}-pixel-{row}.png')
  if row==0:canvas.save(out/f'enemy-1-{col}.png')
print('20 frames, 24x24 logical pixels')
