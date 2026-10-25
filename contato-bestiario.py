from PIL import Image,ImageDraw
from pathlib import Path
out=Path('assets/campaign-bestiary');sheet=Image.new('RGB',(640,9*130),'#101927');d=ImageDraw.Draw(sheet)
for r in range(9):
 for c in range(5):
  im=Image.open(out/f'enemy-{r+1}-{c}.png');sheet.paste(im,(c*128+16,r*130),im);d.text((c*128+20,r*130+100),f'{r+1} / {c+1}',fill='white')
sheet.save(out/'bestiario.png')
