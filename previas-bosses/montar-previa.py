from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,shutil
root=Path(__file__).parent
items=json.loads((root/'manifesto.json').read_text(encoding='utf-8-sig'))
font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',21)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
allframes=[]
for item in items:
 source=Path(item['path']);shutil.copyfile(source,root/(item['id']+'-original.png'))
 sheet=Image.open(source).convert('RGBA')
 cells=[sheet.crop((round(i*sheet.width/8),0,round((i+1)*sheet.width/8),sheet.height)) for i in range(8)]
 boxes=[c.getbbox() for c in cells];assert all(boxes),(item['id'],boxes)
 left=min(b[0] for b in boxes);right=max(b[2] for b in boxes)
 top=min(b[1] for b in boxes);bottom=max(b[3] for b in boxes)
 side=max(right-left,bottom-top)+4
 x=(left+right-side)//2;y=(top+bottom-side)//2
 frames=[c.crop((x,y,x+side,y+side)).resize((48,48),Image.Resampling.NEAREST) for c in cells]
 atlas=Image.new('RGBA',(384,48))
 for n,frame in enumerate(frames):atlas.paste(frame,(n*48,0))
 atlas.save(root/(item['id']+'-idle.png'))
 allframes.append(frames)
frames=[]
for tick in range(16):
 out=Image.new('RGB',(1056,750),'#10141d');draw=ImageDraw.Draw(out)
 draw.text((528,17),'NOVOS BOSSES — PRÉVIAS PARA APROVAÇÃO',font=font,fill='#ffc36c',anchor='mt')
 for n,(item,animation) in enumerate(zip(items,allframes)):
  x=n%3*352;y=55+n//3*328
  draw.rounded_rectangle((x+12,y+5,x+340,y+319),radius=7,fill='#1c2230',outline='#45516a',width=2)
  im=animation[tick%8].resize((240,240),Image.Resampling.NEAREST)
  out.paste(im,(x+56,y+12),im)
  draw.text((x+176,y+262),item['name'],font=font,fill='#edf0f6',anchor='mt')
  draw.text((x+176,y+291),item['note'],font=small,fill='#acbcd2',anchor='mt')
 draw.text((528,722),'Animações no lugar • 48 × 48 pixels • 5 quadros/s • Ainda não aplicadas no jogo',font=small,fill='#b8c5da',anchor='mt')
 frames.append(out)
frames[0].save(root/'bosses-previa.png')
frames[0].save(root/'bosses-animados.gif',save_all=True,append_images=frames[1:],duration=200,loop=0,optimize=False)
print('Prévia de seis bosses criada com oito quadros por personagem.')
