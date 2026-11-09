import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        # intro loader frames (desktop)
        ctx=await b.new_context(viewport={'width':1440,'height':900})
        pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html')
        for i,t in enumerate([700,1500,2600]):
            await pg.wait_for_timeout(t if i==0 else t-[700,1500,2600][i-1])
            await pg.screenshot(path='intro-%d.png'%i)
        await pg.wait_for_timeout(1500)
        # open the menu
        await pg.click('.menu-btn'); await pg.wait_for_timeout(1400)
        await pg.screenshot(path='menu-0.png')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(900)
        # navigate via link to check curtain
        await pg.click('.quick a[href="about/index.html"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='curtain-0.png')
        await pg.wait_for_timeout(900); await pg.screenshot(path='curtain-1.png')
        await pg.wait_for_timeout(1500); await pg.screenshot(path='curtain-2.png')
        print('errors',errs)
        # mobile hero
        ctx2=await b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        await ctx2.add_init_script("try{sessionStorage.setItem('btc-intro','1')}catch(e){}")
        m=await ctx2.new_page(); await m.goto('http://localhost:8765/index.html'); await m.wait_for_timeout(3000)
        await m.screenshot(path='mh-0.png')
        await m.click('.menu-btn'); await m.wait_for_timeout(1300); await m.screenshot(path='mh-1.png')
        await b.close()
asyncio.run(main())
