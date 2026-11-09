import asyncio,sys
from playwright.async_api import async_playwright
from PIL import Image
pages=sys.argv[2:];out=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900})
        await ctx.add_init_script("try{sessionStorage.setItem('btc-intro','1')}catch(e){}")
        shots=[];errs=[]
        for pgp in pages:
            path,_,y=pgp.partition('@');y=int(y or 0)
            pg=await ctx.new_page();pg.on('pageerror',lambda e,pp=path:errs.append(pp+': '+str(e)))
            await pg.goto('http://localhost:8765/'+path);await pg.wait_for_timeout(1800)
            if y: await pg.evaluate('y=>scrollTo(0,y)',y);await pg.wait_for_timeout(1600)
            f='/tmp/s_%d.png'%len(shots);await pg.screenshot(path=f);shots.append(f);await pg.close()
        await b.close()
        ims=[Image.open(f).resize((720,450)) for f in shots]
        cols=2;rows=(len(ims)+1)//2
        sh=Image.new('RGB',(cols*730,rows*460),(60,60,60))
        for i,im in enumerate(ims): sh.paste(im,((i%cols)*730,(i//cols)*460))
        sh.save(out);print('errors',errs)
asyncio.run(main())
