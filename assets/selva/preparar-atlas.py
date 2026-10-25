from PIL import Image
src=Image.open('assets/selva/atlas-original.png').convert('RGBA')
# The generated atlas has variable row heights; retain each full animation row.
bounds=[(0,160),(160,326),(326,447),(447,573),(573,720),(720,839),(839,1031),(1031,src.height)]
atlas=Image.new('RGBA',(256,256))
for row,(y0,y1) in enumerate(bounds):
    for col in range(8):
        cell=src.crop((round(col*src.width/8),y0,round((col+1)*src.width/8),y1))
        cell=cell.resize((32,32),Image.Resampling.NEAREST)
        atlas.alpha_composite(cell,(col*32,row*32))
atlas.save('minihero-offline/build/jungle-atlas.png')
print('Atlas da selva: 8x8 células de 32px RGBA.')
