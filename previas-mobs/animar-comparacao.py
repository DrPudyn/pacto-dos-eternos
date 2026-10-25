from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,base64,io
p=Path('previas-mobs');r=json.loads((p/'pixellab/animacao-resultado.json').read_text(encoding='utf-8-sig'))
assert r['status']=='completed',r['status']
images=[]
def walk(v):
 if isinstance(v,dict):
  if 'base64' in v:
   images.append(Image.open(io.BytesIO(base64.b64decode(v['base64'].split(',')[-1]))).convert('RGBA'))
  else:
   for x in v.values():walk(x)
 elif isinstance(v,list):
  for x in v:walk(x)
walk(r['last_response'])
assert images,'No embedded frames'
if len(images)==1 and images[0].width>32:
 s=images[0];images=[s.crop((i*32,0,(i+1)*32,32)) for i in range(s.width//32)]
for i,im in enumerate(images):im.save(p/f'pixellab/esqueleto-idle-{i}.png')
orig=Image.open(next(Path('minihero-offline/build').glob('skeleton-idle-*.png'))).convert('RGBA')
ours=Image.open(p/'esqueleto-imagegen-idle.png').convert('RGBA')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
frames=[]
for t in range(32):
 out=Image.new('RGB',(960,390),'#10141d');d=ImageDraw.Draw(out)
 d.text((480,18),'ESQUELETO — PRÉVIA ANIMADA',font=font,fill='#ffc36c',anchor='mt')
 a=t%(orig.width//32);b=t%8
 for i,(name,im) in enumerate([('Original do jogo',orig.crop((a*32,0,(a+1)*32,32))),('Criado aqui',ours.crop((b*32,0,(b+1)*32,32))),('PixelLab',images[t%len(images)])]):
  x=i*320;d.rounded_rectangle((x+12,62,x+308,334),radius=5,fill='#1c2230',outline='#45516a',width=2)
  im=im.resize((224,224),Image.Resampling.NEAREST);out.paste(im,(x+48,70),im)
  d.text((x+160,301),name,font=font,fill='#edf0f6',anchor='mt')
 d.text((480,357),'Animação no lugar • 5 quadros/s • 32 × 32 pixels ampliados • Ainda não aplicada',font=small,fill='#b8c5da',anchor='mt')
 frames.append(out)
frames[0].save(p/'comparacao-esqueleto-animada.gif',save_all=True,append_images=frames[1:],duration=200,loop=0,optimize=False)
print('GIF saved:',len(images),'PixelLab frames')
