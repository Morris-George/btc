import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1440,'height':900})
        await ctx.add_init_script("try{sessionStorage.setItem('btc-intro','1')}catch(e){}")
        pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html');await pg.wait_for_timeout(2500)
        await pg.mouse.move(1300,200,steps=12);await pg.wait_for_timeout(900)
        print('dial vars',await pg.evaluate("(()=>{var d=document.querySelector('.dial');return [d.style.getPropertyValue('--la'),d.style.getPropertyValue('--rx'),d.style.getPropertyValue('--ry')]})()"))
        await pg.screenshot(path='i-hero.png')
        for i in range(6): await pg.mouse.wheel(0,300);await pg.wait_for_timeout(120)
        await pg.wait_for_timeout(1200);print('scrollY after wheel',await pg.evaluate('scrollY'))
        # brand list hover
        y=await pg.evaluate("document.querySelector('.blist').getBoundingClientRect().top+scrollY-200")
        await pg.evaluate('y=>scrollTo(0,y)',y);await pg.wait_for_timeout(800)
        box=await pg.locator('.blist a').nth(2).bounding_box()
        await pg.mouse.move(box['x']+200,box['y']+box['height']/2,steps=10);await pg.wait_for_timeout(700)
        await pg.mouse.move(box['x']+260,box['y']+box['height']/2+5,steps=5);await pg.wait_for_timeout(600)
        await pg.screenshot(path='i-blist.png')
        # brands filter
        await pg.goto('http://localhost:8765/brands/index.html');await pg.wait_for_timeout(1500)
        await pg.click('.chip[data-f="High-End Luxury"]');await pg.wait_for_timeout(300)
        print('brand count',await pg.text_content('[data-count-out]'))
        await pg.goto('http://localhost:8765/retail/stores/index.html?region=Giza');await pg.wait_for_timeout(1500)
        print('giza stores',await pg.text_content('[data-count-out]'))
        await pg.goto('http://localhost:8765/search/index.html?q=pandora');await pg.wait_for_timeout(1500)
        print('search results',await pg.locator('#results li').count())
        await pg.goto('http://localhost:8765/news/magazine/index.html');await pg.wait_for_timeout(1500)
        await pg.click('[data-reader] .next');await pg.wait_for_timeout(300)
        print('reader',await pg.text_content('.rd-count'))
        # anchor link from home
        await pg.goto('http://localhost:8765/index.html');await pg.wait_for_timeout(2000)
        await pg.click('.scroll-cue');await pg.wait_for_timeout(2500)
        print('after cue',await pg.evaluate('scrollY'),await pg.evaluate("Math.round(document.getElementById('story').getBoundingClientRect().top+scrollY)"))
        print('errors',errs)
        await b.close()
asyncio.run(main())
