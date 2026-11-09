import asyncio, sys, json
from playwright.async_api import async_playwright
# usage: shot.py page outprefix [w h] [scrolls...] [--intro] [--reduce]
args = sys.argv[1:]
flags = [a for a in args if a.startswith('--')]
args = [a for a in args if not a.startswith('--')]
page_path, out = args[0], args[1]
W, Hh = int(args[2]) if len(args) > 2 else 1440, int(args[3]) if len(args) > 3 else 900
scrolls = args[4:] or ['0']

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': W, 'height': Hh}, device_scale_factor=1,
                                  reduced_motion='reduce' if '--reduce' in flags else 'no-preference',
                                  has_touch=W < 800, is_mobile=W < 800)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' else None)
        if '--intro' not in flags:
            await ctx.add_init_script("try{sessionStorage.setItem('btc-intro','1')}catch(e){}")
        await pg.goto('http://localhost:8765/' + page_path, wait_until='load')
        await pg.wait_for_timeout(3200 if '--intro' not in flags else 600)
        for i, y in enumerate(scrolls):
            await pg.evaluate('''y=>{var m=/^([^+]+)?\+?(-?\d+)?$/.exec(y);var base=0;if(m[1]&&isNaN(+m[1])){var el=document.querySelector(m[1]);base=el.getBoundingClientRect().top+scrollY}else if(m[1]){base=+m[1]}window.scrollTo(0,base+(+(m[2]||0)))}''', y)
            await pg.wait_for_timeout(1700)
            await pg.screenshot(path='%s-%d.png' % (out, i))
        if errs: print('ERRORS', json.dumps(errs[:8]))
        await b.close()
asyncio.run(main())
