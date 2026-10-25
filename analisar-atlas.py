# Read-only analysis of the generated PNG. Writes sprite-frame metadata, never modifies pixels.
from PIL import Image
from collections import deque
import json,math
im=Image.open('assets/weapon-atlas-v2.png').convert('RGBA');W,H=im.size
alpha=im.getchannel('A');mask=bytearray(1 if a>80 else 0 for a in alpha.getdata());groups=[]
for p in range(W*H):
 if not mask[p]:continue
 mask[p]=0;q=deque([p]);pts=[]
 while q:
  i=q.popleft();x=i%W;y=i//W;pts.append((x,y))
  for n in (i-1 if x else -1,i+1 if x<W-1 else -1,i-W if y else -1,i+W if y<H-1 else -1):
   if n>=0 and mask[n]:mask[n]=0;q.append(n)
 if len(pts)>12:groups.append(pts)
large=sorted(groups,key=len,reverse=True)[:24]
centers=[(sum(x for x,y in g)/len(g),sum(y for x,y in g)/len(g)) for g in large]
rows=sorted(range(24),key=lambda i:centers[i][1]);ordered=[]
for r in range(4):ordered+=sorted(rows[r*6:r*6+6],key=lambda i:centers[i][0])
# Floating crystals belong to their nearest primary sprite.
for g in groups:
 if len(g)>=min(map(len,large)):continue
 cx=sum(x for x,y in g)/len(g);cy=sum(y for x,y in g)/len(g)
 d,i=min((min((cx-x)**2+(cy-y)**2 for x,y in large[k][::max(1,len(large[k])//200)]),k) for k in range(24))
 if d<80**2:large[i]+=g

def hull(points):
 points=sorted(set(points));cross=lambda o,a,b:(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);lo=[];hi=[]
 for p in points:
  while len(lo)>=2 and cross(lo[-2],lo[-1],p)<=0:lo.pop()
  lo.append(p)
 for p in reversed(points):
  while len(hi)>=2 and cross(hi[-2],hi[-1],p)<=0:hi.pop()
  hi.append(p)
 return lo[:-1]+hi[:-1]
frames=[]
for i in ordered:
 g=large[i];x0=min(x for x,y in g);x1=max(x for x,y in g);y0=min(y for x,y in g);y1=max(y for x,y in g);side=max(x1-x0+1,y1-y0+1)+24;left=(x0+x1+1-side)/2;top=(y0+y1+1-side)/2
 # Convex clipping excludes neighboring weapons in the packed atlas; padding expands a few pixels around outlines.
 poly=hull([(x+dx,y+dy) for x,y in hull(g) for dx,dy in [(-3,-3),(3,-3),(3,3),(-3,3)]])
 frames.append({'x':round(left,2),'y':round(top,2),'s':side,'clip':','.join(f'{(x-left)/side*100:.3f}% {(y-top)/side*100:.3f}%' for x,y in poly)})
open('assets/weapon-atlas-v2.frames.json','w').write(json.dumps({'width':W,'height':H,'frames':frames},separators=(',',':')))
print('Atlas analisado:',W,H,'componentes grandes:',[len(large[i]) for i in ordered]);print('Frames:',len(frames))
