from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import json,shutil
root=Path('assets/battle-arenas');manifest=json.loads((root/'manifest.json').read_text())
contact=Image.new('RGB',(960,3*200),'#0b1824');d=ImageDraw.Draw(contact)
for key,name in manifest.items():
 i=int(key);src=Path(name);shutil.copy2(src,root/f'arena-{i}-source.png');im=Image.open(src).convert('RGB');im=ImageOps.fit(im,(640,360),method=Image.Resampling.NEAREST);im=im.quantize(colors=128,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB');im.resize((1280,720),Image.Resampling.NEAREST).save(root/f'battle-arena-{i}.png');tile=im.resize((320,180),Image.Resampling.NEAREST);x=(i-1)%3*320;y=(i-1)//3*200;contact.paste(tile,(x,y));d.text((x+8,y+182),str(i),fill='white')
contact.save(root/'arenas-contato.png');print('9 arenas prontas')
