from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import base64,json,shutil
p=Path('previas-mobs/pixellab')
r=json.loads((p/'esqueleto-resposta.json').read_text(encoding='utf-8-sig'))
b=r['image']['base64'].split(',')[-1]
(p/'esqueleto.png').write_bytes(base64.b64decode(b))
src=Path('C:/Users/edson/.codex/generated_images/01a14b48-d2aa-76a0-9430-e3e064dee149/exec-6f697a36-e6a2-4772-a2f7-39893294661a.png')
shutil.copyfile(src,p.parent/'esqueleto-imagegen-original.png')
s=Image.open(src).convert('RGBA'); cells=[]
for i in range(8):
 cells.append(s.crop((round(i*s.width/8),0,round((i+1)*s.width/8),s.height)))
boxes=[c.getbbox() for c in cells]; top=min(b[1] for b in boxes); bottom=max(b[3] for b in boxes)
size=max(cells[0].width,bottom-top); y=(top+bottom-size)//2
ours=[c.crop(((c.width-size)//2,y,(c.width+size)//2,y+size)).resize((32,32),Image.Resampling.NEAREST) for c in cells]
sheet=Image.new('RGBA',(256,32))
for i,c in enumerate(ours):sheet.paste(c,(32*i,0))
sheet.save(p.parent/'esqueleto-imagegen-idle.png')
orig=Image.open(next(Path('minihero-offline/build').glob('skeleton-idle-*.png'))).convert('RGBA')
pix=Image.open(p/'esqueleto.png').convert('RGBA')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
out=Image.new('RGB',(960,390),'#10141d');d=ImageDraw.Draw(out)
d.text((480,18),'ESQUELETO — COMPARAÇÃO PARA APROVAÇÃO',font=font,fill='#ffc36c',anchor='mt')
for i,(name,im) in enumerate([('Original do jogo',orig.crop((0,0,32,32))),('Criado aqui',ours[0]),('PixelLab',pix)]):
 x=i*320;d.rounded_rectangle((x+12,62,x+308,334),radius=5,fill='#1c2230',outline='#45516a',width=2)
 im=im.resize((224,224),Image.Resampling.NEAREST);out.paste(im,(x+48,70),im)
 d.text((x+160,301),name,font=font,fill='#edf0f6',anchor='mt')
d.text((480,357),'Células de 32 × 32 pixels, ampliadas 7× sem suavização. Prévia; ainda não aplicada.',font=small,fill='#b8c5da',anchor='mt')
out.save(p.parent/'comparacao-esqueleto.png')
print('Comparação salva.')
