import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900})
        await ctx.add_init_script("try{sessionStorage.setItem('btc-intro','1')}catch(e){}")
        pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html');await pg.wait_for_timeout(2500)
        H=await pg.evaluate('document.documentElement.scrollHeight');print('height',H)
        y=0;i=0
        while y<H and i<14:
            await pg.evaluate('y=>scrollTo(0,y)',y);await pg.wait_for_timeout(900)
            await pg.screenshot(path='tour-%02d.png'%i);y+=900;i+=1
        print('errors',errs)
        await b.close()
asyncio.run(main())
