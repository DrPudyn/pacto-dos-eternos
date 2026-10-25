from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
items=[('wolf','Lobo'),('bat','Morcego'),('goblin','Goblin'),('skeleton','Esqueleto'),('troll','Troll'),('yeti','Yeti'),('cyclop','Ciclope'),('werewolf','Lobisomem')]
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
sheets=[(Image.open(next(Path('minihero-offline/build').glob(kind+'-idle-*.png'))).convert('RGBA'),name) for kind,name in items]
frames=[]
for tick in range(48):
    out=Image.new('RGB',(800,440),'#10141d');draw=ImageDraw.Draw(out)
    draw.text((400,18),'SPRITES ORIGINAIS — PRÉVIA PARA APROVAÇÃO',font=font,fill='#ffc36c',anchor='mt')
    for i,(sheet,name) in enumerate(sheets):
        x=(i%4)*200;y=50+(i//4)*190
        draw.rounded_rectangle((x+8,y+5,x+192,y+181),radius=5,fill='#1c2230',outline='#45516a',width=2)
        n=sheet.width//32;frame=tick%n
        sprite=sheet.crop((frame*32,0,frame*32+32,32)).resize((128,128),Image.Resampling.NEAREST)
        out.paste(sprite,(x+36,y+12),sprite)
        draw.text((x+100,y+145),name,font=font,fill='#edf0f6',anchor='mt')
    frames.append(out)
frames[0].save('previas-mobs/catalogo-mobs.png')
frames[0].save('previas-mobs/catalogo-mobs-animado.gif',save_all=True,append_images=frames[1:],duration=200,loop=0,optimize=False)
print('Prévia animada criada com oito sprites existentes; monstros do jogo não foram alterados.')
