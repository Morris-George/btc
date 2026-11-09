import sys, os, shutil, glob
src = sys.argv[1]; dst = sys.argv[2]
m = {
"9o68in":"index.html","wo1evl":"assets/css/main.css","l1m7ll":"assets/js/main.js","z2m4yt":"about/index.html",
"hktsys":"brands/index.html","nzw5dm":"brands/pandora/index.html","2objgb":"brands/gucci/index.html",
"er2j30":"retail/stores/index.html","ma9c5k":"retail/stores/pandora-citystars/index.html","cqsv4w":"leadership/index.html",
"4qo5jm":"careers/index.html","k8ttom":"contact/index.html","734nyc":"news/index.html","k020ya":"news/magazine/index.html",
"4jq37f":"business/index.html","6zo7n5":"achievements/index.html","rw53cs":"about/mission-vision-values/index.html",
"7xsfwc":"retail/index.html","2xwzyu":"resources/index.html","mjyjev":"search/index.html","25qhrp":"404.html",
"6phpta":"business/distribution/index.html","wtomp8":"business/group-companies/index.html","t5q2uq":"business/retail-management/index.html",
"wrt352":"business/customer-care/index.html","bt4k68":"brands/link-watches/index.html","0di54f":"brands/laderach/index.html","y630cg":"brands/tissot/index.html"}
for f in os.listdir(src):
    for k,v in m.items():
        if "-"+k+"-" in f:
            p=os.path.join(dst,v); os.makedirs(os.path.dirname(p),exist_ok=True); shutil.copy(os.path.join(src,f),p)
