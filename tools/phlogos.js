const sharp=require('/opt/npm-tools/node_modules/sharp');const fs=require('fs');
const lines=fs.readFileSync('/home/claude/tools/logos.txt','utf8').trim().split('\n');const seen=new Set();
(async()=>{for(const l of lines){const m=l.match(/logos\/([a-z0-9-]+)\.webp" alt="([^"]*?)( logo)?" width="(\d+)" height="(\d+)"/);if(!m)continue;const [_,slug,name,,w,h]=m;const out='assets/img/logos/'+slug+'.webp';if(seen.has(out)||fs.existsSync(out))continue;seen.add(out);
const W=+w,H=+h,fs2=Math.min(H*0.42,W/(name.length*0.62));const n=name.replace(/&amp;/g,"and").replace(/&/g,"and");
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia,serif" font-size="${fs2}" letter-spacing="2" fill="#141210">${n.toUpperCase()}</text></svg>`;
await sharp(Buffer.from(svg)).webp().toFile(out);}
// panasonic & link
for(const [s,n,w,h] of [['panasonic','PANASONIC',361,86],['link','LINK',268,107]]){const out='assets/img/logos/'+s+'.webp';if(fs.existsSync(out))continue;await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="bold" font-size="${h*0.5}" fill="#141210">${n}</text></svg>`)).webp().toFile(out)}
console.log(fs.readdirSync('assets/img/logos').length)})();
