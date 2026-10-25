import urllib.request,re,pathlib,concurrent.futures,json
base='https://dg.minihero.org/'
root=pathlib.Path('minihero-offline');root.mkdir(exist_ok=True)
seen=set();pending={'index.html'};errors=[]
def get(p):
 try:
  data=urllib.request.urlopen(base+('' if p=='index.html' else p),timeout=40).read()
  dest=root/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
  refs=set()
  if p.endswith(('.html','.js','.css','.webmanifest')):
   s=data.decode('utf-8')
   for m in re.finditer(r'''["'`](\.?\.?/?[A-Za-z0-9_./-]+\.(?:js|css|png|webp|woff2?|mp3|ogg|wav|webmanifest))["'`]''',s):
    ref=m.group(1)
    if ref.startswith('/') : q=ref[1:]
    elif ref.startswith('./assets/'): continue
    else:q=str(pathlib.PurePosixPath(p).parent/ref).replace('\\','/')
    q=q.replace('/./','/').removeprefix('./')
    refs.add(q)
   if p.endswith('.css'):
    for ref in re.findall(r'url\(["\']?([^\)"\']+)',s):
     if not ref.startswith('data:'):refs.add(str(pathlib.PurePosixPath(p).parent/ref).replace('/./','/'))
  return p,refs,None
 except Exception as e:return p,set(),str(e)
while pending:
 batch=pending-seen;pending=set()
 if not batch:break
 seen.update(batch)
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  for p,refs,err in pool.map(get,batch):
   if err:errors.append([p,err])
   pending.update(refs-seen)
 print('Baixados/verificados:',len(seen),'pendentes:',len(pending),'erros:',len(errors),flush=True)
(root/'download-report.json').write_text(json.dumps({'files':sorted(seen),'errors':errors},indent=2))
