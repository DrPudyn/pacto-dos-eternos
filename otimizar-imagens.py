"""Build-only WebP variants. Original artwork and sprite-sheet dimensions stay intact."""
import concurrent.futures, hashlib, io, json, os, re, sys, time
from pathlib import Path
from PIL import Image

root=Path(sys.argv[1]).resolve()
manifest_file=root/'.image-variants.json'
try: previous=json.loads(manifest_file.read_text(encoding='utf-8'))
except (OSError,ValueError): previous={}
limits={'quick-action-updates-v2.png':256,'quick-action-ticket-v2.png':256,'pact-backpack.png':256,'pact-book.png':384}
files=[p for p in root.glob('*.png') if p.stat().st_size>=65536]

def convert(source):
 data=source.read_bytes();limit=limits.get(source.name,0)
 background=bool(re.match(r'^(refuge-|campaign-(world|arena|frontier)|battle-arena-|realm-demon-preview|pacto-dos-eternos-login|pact-hall)',source.name))
 signature=hashlib.sha256(data+str((limit,background)).encode()+b'-webp-v2').hexdigest()
 target=source.with_suffix('.webp');old=previous.get(source.name,{})
 if old.get('hash')==signature and target.exists() and target.stat().st_size<len(data):
  os.utime(target,None);return source.name,{'hash':signature,'original':len(data),'optimized':target.stat().st_size}
 image=Image.open(io.BytesIO(data));image.load()
 if limit and max(image.size)>limit:
  factor=limit/max(image.size);image=image.resize((round(image.width*factor),round(image.height*factor)),Image.Resampling.NEAREST)
 out=io.BytesIO()
 if background:image.save(out,format='WEBP',quality=96,method=5,alpha_quality=100)
 else:image.save(out,format='WEBP',lossless=True,method=4,exact=True)
 result=out.getvalue()
 if len(result)<len(data):target.write_bytes(result);return source.name,{'hash':signature,'original':len(data),'optimized':len(result)}
 return source.name,{'hash':signature,'original':len(data),'optimized':len(data)}

records={};started=time.monotonic()
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 for index,(name,record) in enumerate(pool.map(convert,files),1):
  records[name]=record
  if index%20==0:print(f'Imagens otimizadas: {index}/{len(files)}',flush=True)
manifest_file.write_text(json.dumps(records),encoding='utf-8')
before=sum(r['original'] for r in records.values());after=sum(r['optimized'] for r in records.values())
print(f'Variantes de imagem: {before/1048576:.1f} MB -> {after/1048576:.1f} MB ({(1-after/max(1,before))*100:.0f}% menos), {time.monotonic()-started:.1f}s.',flush=True)
