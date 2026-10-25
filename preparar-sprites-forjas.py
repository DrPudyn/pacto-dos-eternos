"""Pack the approved transparent three-cell strips into aligned game assets."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parent
GENERATED = Path(r'C:\Users\edson\.codex\generated_images\01a14b48-d2aa-76a0-9430-e3e064dee149')
SOURCES = [
    'exec-cc3dc8d1-c247-4075-8be1-c6c4b72e2e6b.png',
    'exec-a82467a1-8e24-4d8b-9f7e-8204cad81ce6.png',
    'exec-3315ae99-5648-4eb6-819c-ba18b9a6dbc0.png',
    'exec-d9af51dc-e38a-45ae-99e7-82a5a41b0a10.png',
    'exec-e4a1b9a8-940e-4c0e-9d4c-9e71fa002015.png',
    'exec-ee76f5ad-d1bf-438c-b09f-43da2acf900f.png',
]
dest = ROOT / 'assets' / 'forjas'
dest.mkdir(parents=True, exist_ok=True)
manifest = []
for tier, filename in enumerate(SOURCES, 1):
    source = GENERATED / filename
    saved = dest / f'source-{tier}.png'
    if source.exists():
        saved.write_bytes(source.read_bytes())
    sheet = Image.open(saved).convert('RGBA')
    assert sheet.getchannel('A').getextrema()[0] == 0, 'Source must have alpha transparency'
    crops = []
    for index in range(3):
        tile = sheet.crop((round(index*sheet.width/3), 0, round((index+1)*sheet.width/3), sheet.height))
        bbox = tile.getchannel('A').getbbox()
        assert bbox is not None
        crops.append(tile.crop(bbox))
    scale = min(174/max(p.width for p in crops), 174/max(p.height for p in crops))
    for level, sprite in enumerate(crops, 1):
        size = (max(1, round(sprite.width*scale)), max(1, round(sprite.height*scale)))
        sprite = sprite.resize(size, Image.Resampling.NEAREST)
        canvas = Image.new('RGBA', (192, 192))
        canvas.alpha_composite(sprite, ((192-size[0])//2, 184-size[1]))
        name = f'forge-{tier}-lv{level}.png'
        canvas.save(dest/name)
        manifest.append({'tier': tier, 'level': level, 'file': name, 'size': [192,192]})
(dest/'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('18 transparent sprites packed, same scale per forge and aligned baselines.')
