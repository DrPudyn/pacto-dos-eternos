from pathlib import Path
from PIL import Image
import hashlib
root=Path('assets/campaign-bestiary')
for region in range(1,10):
 for mob in range(5):
  hashes=[]
  for frame in range(4):
   p=root/f'enemy-{region}-{mob}-pixel-{frame}.png';im=Image.open(p).convert('RGBA');assert im.size==(96,96);assert im.getbbox();assert set(im.getchannel('A').getdata())<={0,255};hashes.append(hashlib.sha256(im.tobytes()).hexdigest())
  assert len(set(hashes))>1,(region,mob)
print('180 PNG frames validated; 45 animated creatures, transparent and pixel-aligned.')
