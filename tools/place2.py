import sys, os, re, shutil
src, dst = sys.argv[1], sys.argv[2]
sizes = {14234:"heritage-family-portraits",126290:"heritage-lauria-shop",34236:"mag-airport-dfs",105056:"mag-candino",71374:"mag-casio-babyg",43020:"mag-casio-gshock",75078:"mag-cover",100648:"mag-hamilton-chrono",38724:"mag-hamilton-diver",133986:"mag-hamilton-field",166774:"mag-hamilton",93206:"mag-lacoste",145986:"mag-montblanc",28496:"mag-pandora-bracelet",117728:"mag-swatch-scubaqua",116068:"mag-tissot-prx",22636:"people-loria-wassef",19402:"people-managing-directors",90292:"store-btc",115238:"store-casio",54146:"store-laderach",105222:"store-link",195660:"store-pandora",80552:"store-rado"}
n=0
for f in os.listdir(src):
    p=os.path.join(src,f)
    if f.endswith('.webp'):
        s=os.path.getsize(p)
        if s in sizes:
            o=os.path.join(dst,'assets/img/photos',sizes[s]+'.webp'); os.makedirs(os.path.dirname(o),exist_ok=True); shutil.copy(p,o); n+=1
    elif f.endswith('.html'):
        t=open(p,encoding='utf-8').read()
        m=re.search(r'rel="canonical" href="https://www\.btcwatches\.com/([^"]*)"',t)
        if not m: print('no canon',f); continue
        rel=m.group(1)
        rel = rel + 'index.html' if (rel=='' or rel.endswith('/')) else rel
        o=os.path.join(dst,rel); os.makedirs(os.path.dirname(o) or dst,exist_ok=True); shutil.copy(p,o); n+=1
print(n)
