from pathlib import Path
p=Path('preparar-bestiario.py');s=p.read_text();s=s.replace("from pathlib import Path", "from pathlib import Path\nfrom collections import deque")
s=s.replace("xs=[0,.177,.359,.550,.722,1];ys=[0,.35,.675,1]", "xs=([0,285/1619,585/1619,890/1619,1220/1619,1] if pack==0 else [0,287/1619,581/1619,891/1619,1225/1619,1]) if pack<2 else [0,.17,.355,.55,.72,1];ys=([0,330/971,637/971,1] if pack==0 else [0,349/971,665/971,1]) if pack<2 else [0,.35,.675,1]")
s=s.replace("box=tile.getbbox();tile=tile.crop(box);", """alpha=tile.getchannel('A');pix=alpha.load();seen=set();components=[]
   for yy in range(tile.height):
    for xx in range(tile.width):
     if pix[xx,yy]<20 or (xx,yy) in seen: continue
     comp=[];queue=deque([(xx,yy)]);seen.add((xx,yy))
     while queue:
      x,y=queue.popleft();comp.append((x,y))
      for dx,dy in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1)]:
       nx,ny=x+dx,y+dy
       if 0<=nx<tile.width and 0<=ny<tile.height and (nx,ny) not in seen and pix[nx,ny]>=20:seen.add((nx,ny));queue.append((nx,ny))
     components.append(comp)
   biggest=max(components,key=len);mask=Image.new('L',tile.size);mp=mask.load()
   for comp in components:
    if comp is biggest or (len(comp)>len(biggest)*.02 and all(2<x<tile.width-3 and 2<y<tile.height-3 for x,y in comp)):
     for x,y in comp:mp[x,y]=pix[x,y]
   tile.putalpha(mask);box=tile.getbbox();tile=tile.crop(box);""")
p.write_text(s)
