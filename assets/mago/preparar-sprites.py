from PIL import Image
from pathlib import Path
src=Image.open('assets/mago/mago-atlas-original.png').convert('RGBA')
for action,offset in [('idle',0),('walk',4),('attack',8)]:
    sheet=Image.new('RGBA',(512,128))
    for row in range(4):
        for col in range(16):
            cell=src.crop((round(col*src.width/16),round((offset+row)*src.height/12),round((col+1)*src.width/16),round((offset+row+1)*src.height/12)))
            cell=cell.resize((16,16),Image.Resampling.NEAREST)
            sheet.alpha_composite(cell,(col*32+8,row*32+4))
    sheet.save('minihero-offline/build/mage-'+action+'.png')
print('3 folhas RGBA de 512x128: idle, walk, attack.')
