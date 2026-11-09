#!/usr/bin/env python3
"""Rebuild every page of the BTC Group site from the pristine copy in ../orig:
new head, header, full-screen menu, footer, scroll bezel; new homepage."""
import os, re, math, html as H
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import parts

ORIG = '/home/claude/orig'
OUT = '/home/claude/site'
V = '4'
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700'
         '&family=Instrument+Sans:wdth,wght@75..100,400..700&display=swap" rel="stylesheet">')

def flag(name):
    return ("var s=null;try{s=sessionStorage.getItem('%s')}catch(e){s=(' '+window.name+' ').indexOf(' %s ')>-1?'1':null}" % (name, name))

HEAD_JS = ("<script>(function(h){h.className+=' js';try{history.scrollRestoration='manual'}catch(e){}if(!location.hash)h.style.scrollBehavior='auto';"
           "try{if(sessionStorage.getItem('btc-t')){h.className+=' arriving';sessionStorage.removeItem('btc-t')}}catch(e){var n=' '+window.name+' ';if(n.indexOf(' btc-t ')>-1){h.className+=' arriving';window.name=n.replace(' btc-t ',' ').trim()}}"
           "%s})(document.documentElement)</script>")
HOME_FLAG = "var seen=null;try{seen=sessionStorage.getItem('btc-intro')}catch(e){seen=(' '+window.name+' ').indexOf(' btc-intro ')>-1?'1':null}if(!window.matchMedia||!matchMedia('(prefers-reduced-motion: reduce)').matches){h.className+=seen?' enter':' intro'}"

NAV = [
    ('', 'Home', 'index.html', []),
    ('about', 'About us', 'about/index.html', [('Our story', 'about/index.html'), ('Mission, vision & values', 'about/mission-vision-values/index.html')]),
    ('brands', 'Our brands', 'brands/index.html', [('All brands', 'brands/index.html'), ('Swiss luxury & mid-range', 'brands/index.html?category=Swiss+Luxury+%26+Mid-Range'), ('High-end luxury', 'brands/index.html?category=High-End+Luxury'), ('Fashion brands', 'brands/index.html?category=Fashion+Brands'), ('Link Watches brands', 'brands/index.html?category=Link+Watches+brands'), ('Jewellery & chocolate', 'brands/index.html?group=specialty')]),
    ('retail', 'Retail', 'retail/index.html', [('Retail operations', 'retail/index.html'), ('Store network', 'retail/stores/index.html')]),
    ('business', 'Our business', 'business/index.html', [('Overview', 'business/index.html'), ('Group companies', 'business/group-companies/index.html'), ('Distribution', 'business/distribution/index.html'), ('Retail management', 'business/retail-management/index.html'), ('Customer care', 'business/customer-care/index.html')]),
    ('leadership', 'Leadership', 'leadership/index.html', []),
    ('achievements', 'Achievements', 'achievements/index.html', []),
    ('careers', 'Careers', 'careers/index.html', []),
    ('news', 'News', 'news/index.html', [('News & updates', 'news/index.html'), ('BTC Magazine', 'news/magazine/index.html'), ('Media & resources', 'resources/index.html')]),
    ('contact', 'Contact us', 'contact/index.html', []),
]
QUICK = [('about', 'About', 'about/index.html'), ('brands', 'Brands', 'brands/index.html'), ('retail', 'Retail', 'retail/index.html'), ('business', 'Business', 'business/index.html'), ('news', 'News', 'news/index.html')]
MENU_IMG = {'': 'store-btc', 'about': 'heritage-lauria-shop', 'brands': 'mag-hamilton-chrono', 'retail': 'store-pandora', 'business': 'store-link', 'leadership': 'people-managing-directors', 'achievements': 'heritage-family-portraits', 'careers': 'store-laderach', 'news': 'mag-cover', 'contact': 'store-rado'}
SEC_ALIAS = {'resources': 'news', 'search': None}

ARROW = '<span aria-hidden="true">→</span>'
e = lambda s: H.escape(s, quote=True)

def header(R, sec):
    q = ''.join('<a href="%s%s"%s>%s</a>' % (R, u, ' class="is-active"' if k == sec else '', t) for k, t, u in QUICK)
    items = []
    for i, (k, t, u, subs) in enumerate(NAV):
        cur = ' class="is-active"' if k == sec else ''
        sub = ''
        if subs:
            sub = '<ul>' + ''.join('<li><a href="%s%s">%s</a></li>' % (R, e(su), e(st)) for st, su in subs) + '</ul>'
        items.append('<li%s style="--i:%d" data-img="%sassets/img/photos/%s.webp"><a href="%s%s">%s</a>%s</li>' % (cur, i, R, MENU_IMG.get(k, 'store-btc'), R, u, e(t), sub))
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header" id="top"><div class="bar">
 <a class="logo" href="{R}index.html" aria-label="BTC Group, home"><img src="{R}assets/img/logos/btc-mark.webp" alt="" width="688" height="514" decoding="async"><span class="logo-txt">Watches &amp; Jewelry<br><b>Since 1935</b></span></a>
 <nav class="quick" aria-label="Main sections">{q}</nav>
 <div class="bar-r">
  <span class="clock" title="Local time in Cairo"><i class="lume" aria-hidden="true"></i><span>Cairo</span> <time data-clock>--:--</time></span>
  <a class="icon-btn" href="{R}search/index.html" aria-label="Search the site"><svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="1.4"/></svg></a>
  <div class="lang"><button class="lang-btn" aria-expanded="false" aria-haspopup="true">EN <svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button><ul class="lang-menu"><li><span class="lang-item is-current" lang="en">English</span></li><li><span class="lang-item is-soon" lang="ar">العربية <em>Coming soon</em></span></li></ul></div>
  <button class="menu-btn" aria-expanded="false" aria-controls="site-menu"><span class="menu-word">Menu</span><span class="menu-lines" aria-hidden="true"><i></i><i></i></span></button>
 </div></div></header>
<div class="menu" id="site-menu" aria-hidden="true" inert><div class="menu-dial" aria-hidden="true"></div><div class="container menu-in">
 <nav aria-label="Primary"><ul class="mnav">{''.join(items)}</ul></nav>
 <aside class="menu-aside" style="--i:11"><div class="m-window" aria-hidden="true"><div class="m-win-in"></div><i class="m-bezel"></i></div><h3>Time in Cairo</h3><p class="m-time"><time data-clock>--:--</time></p><p>Watches and jewelry in Egypt since 1935.</p><address>19 Abbass El Akkad St., Nasr City, Cairo, Egypt<br><a href="tel:+20224015772">+20 2 2401 57 72</a><br><a href="mailto:btcmagazine@btc.com.eg">btcmagazine@btc.com.eg</a></address></aside>
</div></div>'''

def footer(R):
    return f'''<footer class="site-footer">
 <div class="container foot-cta"><div><p>Business and partnership inquiries</p><a class="foot-big" href="{R}contact/index.html">Work with BTC Group</a></div><a class="btn btn-line" href="{R}careers/index.html">Careers at BTC {ARROW}</a></div>
 <div class="container foot-grid">
  <div class="foot-brand"><img src="{R}assets/img/logos/btc-90.png" alt="BTC 90 years, 1935 – 2025" width="408" height="167" loading="lazy" decoding="async"><p>BTC Group is the family-owned group of companies that has been leading the watch and jewelry market in Egypt for over 90 years.</p></div>
  <div><h3>Company</h3><ul><li><a href="{R}about/index.html">About us</a></li><li><a href="{R}about/mission-vision-values/index.html">Mission, vision &amp; values</a></li><li><a href="{R}leadership/index.html">Leadership</a></li><li><a href="{R}achievements/index.html">Achievements</a></li><li><a href="{R}careers/index.html">Careers</a></li></ul></div>
  <div><h3>Explore</h3><ul><li><a href="{R}brands/index.html">Our brands</a></li><li><a href="{R}retail/index.html">Retail</a></li><li><a href="{R}retail/stores/index.html">Store network</a></li><li><a href="{R}business/index.html">Our business</a></li><li><a href="{R}news/index.html">News</a></li><li><a href="{R}resources/index.html">Media &amp; resources</a></li></ul></div>
  <div><h3>Contact</h3><address>19 Abbass El Akkad St., Nasr City, Cairo, Egypt<br><a href="tel:+20224015772">+20 2 2401 57 72</a><br><a href="mailto:btcmagazine@btc.com.eg">btcmagazine@btc.com.eg</a></address><p class="foot-social">Social media links to be added</p></div>
 </div>
 <div class="foot-mark" aria-hidden="true">Since 1935</div>
 <div class="container foot-base"><span>© 2026 BTC Group. All rights reserved.</span><span><a href="{R}search/index.html">Search</a><a href="{R}contact/index.html">Contact us</a></span></div>
</footer>
<button class="to-top" aria-label="Back to top" hidden><svg class="tt-ring" viewBox="0 0 58 58" aria-hidden="true"><circle class="t" cx="29" cy="29" r="26.5"/><circle class="p" cx="29" cy="29" r="26.5"/></svg><span class="tt-hand" aria-hidden="true"></span><span class="tt-pin" aria-hidden="true"></span></button>'''

# ---------------- sub-dials (chronograph numbers) ----------------
def subdial(val, mx, step, label, plus=True):
    parts = []
    for k in range(0, 26):
        v = mx * k / 25
        a = math.radians(-135 + 270 * k / 25)
        big = k % 5 == 0
        r1, r2 = (70 if big else 76), 86
        parts.append('<line class="sd-tick%s" x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f"/>' % (' big' if big else '', r1 * math.sin(a), -r1 * math.cos(a), r2 * math.sin(a), -r2 * math.cos(a)))
        if big:
            parts.append('<text class="sd-lab" x="%.2f" y="%.2f">%d</text>' % (58 * math.sin(a), -58 * math.cos(a), round(v)))
    a0, a1 = math.radians(-135), math.radians(-135 + 270 * val / mx)
    large = 1 if 270 * val / mx > 180 else 0
    arc = 'M%.2f %.2f A92 92 0 %d 1 %.2f %.2f' % (92 * math.sin(a0), -92 * math.cos(a0), large, 92 * math.sin(a1), -92 * math.cos(a1))
    svg = ('<svg viewBox="-100 -100 200 200" aria-hidden="true"><path d="M%.2f %.2f A92 92 0 1 1 %.2f %.2f" fill="none" stroke="rgba(238,232,220,.08)" stroke-width="2.5"/>'
           % (92 * math.sin(a0), -92 * math.cos(a0), 92 * math.sin(math.radians(135)), -92 * math.cos(math.radians(135))) +
           '<path class="sd-arc" d="%s" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:var(--arc,1);transition:stroke-dashoffset 2.4s cubic-bezier(.16,1,.3,1) .3s"/>' % arc +
           ''.join(parts) +
           '<g class="sd-hand"><polygon points="0,-80 3.6,0 0,16 -3.6,0"/><circle r="3" cy="12" fill="#000"/></g><circle class="sd-cap" r="6.5"/><circle r="2.2" fill="#000"/></svg>')
    num = '<span data-count="%d">%d</span><span class="plus" aria-hidden="true">+</span>' % (val, val)
    return ('<div class="sub" data-val="%d" data-max="%d"><div class="sub-dial reveal">%s</div><div class="num">%s</div><div class="lbl">%s</div></div>' % (val, mx, svg, num, label))

def chrono(head=True):
    h = ('<div class="chrono-head reveal"><p class="eyebrow">BTC Group today</p><h2>Ninety years on, the group in numbers</h2></div>' if head else '')
    return ('<section class="chrono" aria-label="BTC Group in numbers"><div class="container">%s<div class="chrono-grid">%s%s%s</div></div></section>'
            % (h, subdial(90, 100, 20, 'Years of success'), subdial(30, 50, 10, 'International and luxury brands'), subdial(35, 50, 10, 'Retail outlets and service centers across Egypt')))

# ---------------- the living dial ----------------
def dial_svg():
    o = []
    o.append('<svg class="dial-svg" viewBox="-500 -500 1000 1000" aria-hidden="true"><defs>'
             '<linearGradient id="dg-idx" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6f5934"/><stop offset=".48" stop-color="#f6e6c2"/><stop offset=".52" stop-color="#d9c08e"/><stop offset="1" stop-color="#7a6239"/></linearGradient>'
             '<linearGradient id="dg-hl" x1="0" x2="1"><stop offset="0" stop-color="#fbf0d4"/><stop offset="1" stop-color="#cfb27c"/></linearGradient>'
             '<linearGradient id="dg-hr" x1="0" x2="1"><stop offset="0" stop-color="#9c8152"/><stop offset="1" stop-color="#5d4a2b"/></linearGradient>'
             '<filter id="dg-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="6" dy="12" stdDeviation="7" flood-color="#000" flood-opacity=".8"/></filter>'
             '<filter id="dg-lume" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
             '</defs>')
    # rehaut numerals
    o.append('<g>')
    for i in range(1, 13):
        a = i * 30
        o.append('<text class="d-num" text-anchor="middle" transform="rotate(%d) translate(0,-452)">%02d</text>' % (a, i * 5))
    o.append('</g>')
    # minute / seconds track
    o.append('<g stroke="rgba(203,176,126,.55)">')
    for i in range(300):
        a = math.radians(i * 1.2)
        if i % 5 == 0:
            r1, r2, sw = (402, 432, 2.4) if i % 25 == 0 else (412, 432, 1.4)
        else:
            r1, r2, sw = 422, 432, .7
        o.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke-width="%s"/>' % (r1 * math.sin(a), -r1 * math.cos(a), r2 * math.sin(a), -r2 * math.cos(a), sw))
    o.append('</g><circle r="436" fill="none" stroke="rgba(203,176,126,.35)" stroke-width="1"/><circle r="398" fill="none" stroke="rgba(238,232,220,.06)" stroke-width="1"/>')
    # dial printing
    o.append('<text class="d-brand" text-anchor="middle" y="-196">BTC</text><text class="d-city" text-anchor="middle" y="-150">Cairo</text>'
             '<text class="d-since" text-anchor="middle" y="150">Since 1935</text><text class="d-sub" text-anchor="middle" y="184">WATCHES &amp; JEWELRY</text>')
    # applied indices (6 o'clock holds the date)
    o.append('<g filter="url(#dg-sh)">')
    for i in range(12):
        if i == 6:
            continue
        xs = [-28, 8] if i == 0 else [-10]
        w = 20
        for x in xs:
            o.append('<g transform="rotate(%d)"><rect x="%d" y="-388" width="%d" height="96" rx="2" fill="url(#dg-idx)"/><rect x="%d" y="-378" width="6" height="74" rx="1.5" class="lumefill" opacity=".92"/></g>' % (i * 30, x, w, x + 7))
    o.append('</g>')
    o.append('<g transform="translate(0,330)"><rect x="-40" y="-27" width="80" height="54" rx="5" fill="#f1ebdf" stroke="url(#dg-idx)" stroke-width="4"/><text class="d-date" text-anchor="middle" y="11" data-date>8</text></g>')
    # hands
    o.append('<g filter="url(#dg-sh)">'
             '<g class="h-hour"><polygon points="0,-250 -17,-10 0,34" fill="url(#dg-hl)"/><polygon points="0,-250 17,-10 0,34" fill="url(#dg-hr)"/><polygon points="0,-214 -6,-90 0,-74 6,-90" class="lumefill" filter="url(#dg-lume)"/></g>'
             '<g class="h-min"><polygon points="0,-372 -13,-10 0,38" fill="url(#dg-hl)"/><polygon points="0,-372 13,-10 0,38" fill="url(#dg-hr)"/><polygon points="0,-336 -5,-120 0,-104 5,-120" class="lumefill" filter="url(#dg-lume)"/></g>'
             '<g class="h-sec"><rect x="-2" y="-418" width="4" height="490" rx="2" fill="#e8d3a2"/><circle cy="-322" r="13" fill="none" stroke="#e8d3a2" stroke-width="4"/><circle cy="-322" r="9" class="lumefill" filter="url(#dg-lume)"/><circle cy="56" r="15" fill="#e8d3a2"/></g>'
             '<circle r="20" fill="#e8d3a2"/><circle r="8" fill="#16130e"/></g>')
    o.append('</svg>')
    return ''.join(o)

def loader_html():
    ticks = []
    for i in range(60):
        a = math.radians(i * 6)
        r1 = 86 if i % 5 == 0 else 91
        ticks.append('<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f" style="animation-delay:%.3fs"/>' % (r1 * math.sin(a), -r1 * math.cos(a), 96 * math.sin(a), -96 * math.cos(a), .15 + i * 0.028))
    return ('<div class="loader" aria-hidden="true"><div class="ld"><svg viewBox="-110 -110 220 220"><circle class="ld-track" r="100"/><circle class="ld-arc" r="100"/><g class="ld-ticks">%s</g></svg>'
            '<div class="ld-year">1935</div><p class="ld-name">BTC Group</p></div></div>' % ''.join(ticks))

def matched_div(s, start):
    i = s.index(start); depth = 0
    for m in re.finditer(r'<div\b|</div>', s[i:]):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0:
            return s[i:i + m.end()]
    raise ValueError(start)

# ---------------- homepage ----------------
def home_main(orig):
    tick = re.search(r'<div class="ticker-track">(.*?)</div></div>', orig, re.S).group(1)
    anchors = re.findall(r'<a href="([^"]+)" tabindex="0" aria-label="([^"]+)"><img src="([^"]+)" alt="[^"]*" width="(\d+)" height="(\d+)"', tick)
    seen, uniq = set(), []
    for a in anchors:
        if a[0] in seen: continue
        seen.add(a[0]); uniq.append(a)
    half = (len(uniq) + 1) // 2
    def plates(lst):
        return ''.join('<a href="%s" aria-label="%s"><img src="%s" alt="%s logo" width="%s" height="%s" loading="lazy" decoding="async"></a>' % (u, n, s, n, wd, ht) for u, n, s, wd, ht in lst)
    cards = re.findall(r'<a class="brand-card reveal" href="([^"]+)" data-cat="([^"]+)"[^>]*>\s*<span class="bc-logo"><img src="([^"]+)" alt="([^"]*)" width="(\d+)" height="(\d+)"[^>]*></span><span class="bc-meta"><span class="bc-name">([^<]+)</span>', orig)
    blist = ''.join('<li><a href="%s" data-logo="%s" data-cursor="View"><span class="bl-name">%s</span><span class="bl-cat">%s</span><span class="bl-plate"><img src="%s" alt="" width="%s" height="%s" loading="lazy" decoding="async"></span><span class="bl-go" aria-hidden="true"></span></a></li>' % (u, s, n, c, s, wd, ht) for u, c, s, alt, wd, ht, n in cards)
    eco = matched_div(orig, '<div class="eco reveal">')
    ico = {
        'dist': '<svg class="biz-ico" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="24" cy="24" r="21"/><path d="M3 24h42M24 3c6 6 9 13 9 21s-3 15-9 21M24 3c-6 6-9 13-9 21s3 15 9 21"/></svg>',
        'retail': '<svg class="biz-ico" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M6 18h36v24H6z"/><path d="M4 18l5-11h30l5 11"/><path d="M19 42V29h10v13"/></svg>',
        'group': '<svg class="biz-ico" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="24" cy="10" r="6"/><circle cx="9" cy="38" r="6"/><circle cx="39" cy="38" r="6"/><path d="M24 16v8M24 24L11 33M24 24l13 9"/></svg>',
        'care': '<svg class="biz-ico" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="24" cy="24" r="21"/><path d="M24 10v14l9 6"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>',
    }
    return f'''<main id="main">
{parts.light_hero()}

<section class="hs" id="years" aria-label="Ninety years of growth"><div class="hs-sticky">
 <div class="hs-track">
  <div class="hs-panel"><p class="eyebrow">Milestones</p><h2>Ninety years of growth</h2><p class="lead">From a single boutique in Fayoum to Egypt’s largest watch distributor.</p></div>
  <article class="hs-panel" id="ch-1935"><div class="hs-year" aria-hidden="true">1935</div><figure class="hs-fig bw"><img src="assets/img/photos/heritage-lauria-shop.webp" alt="The original Loria Shop in Fayoum" width="1254" height="949" loading="lazy" decoding="async"></figure><div class="hs-copy"><h3>1935. Loria Shop opens in Fayoum</h3><p>Mr. Loria Wassef opens his first watch and jewelry boutique under the name “Loria Shop” in Fayoum.</p></div></article>
  <article class="hs-panel" id="ch-1974"><div class="hs-year" aria-hidden="true">1974</div><figure class="hs-fig"><img src="assets/img/photos/store-swatch.webp" alt="A Swatch store" width="1600" height="1088" loading="lazy" decoding="async"></figure><div class="hs-copy"><h3>1974. Swatch Group distribution</h3><p>BTC becomes the major distributor for Swatch Group in Egypt.</p></div></article>
  <article class="hs-panel" id="ch-1976"><div class="hs-year" aria-hidden="true">1976</div><figure class="hs-fig"><img src="assets/img/photos/store-tissot.webp" alt="A Tissot boutique" width="1600" height="533" loading="lazy" decoding="async"></figure><div class="hs-copy"><h3>1976. Sole distributor for multinational watch companies</h3><p>BTC Trading becomes Egypt’s sole distributor for several multinational watch companies, including Swiss brands.</p></div></article>
  <article class="hs-panel" id="ch-2025"><div class="hs-year" aria-hidden="true">2025</div><figure class="hs-fig logo"><img src="assets/img/logos/btc-90.png" alt="BTC 90 years, 1935 – 2025" width="408" height="167" loading="lazy" decoding="async"></figure><div class="hs-copy"><h3>2025. BTC celebrates 90 years</h3><p>BTC marks its 90th anniversary (1935 – 2025), reflecting on a journey from a single boutique to Egypt’s largest watch distributor.</p></div></article>
  <article class="hs-panel" id="ch-recent"><div class="hs-year word" aria-hidden="true">Recent</div><figure class="hs-fig"><img src="assets/img/photos/store-pandora.webp" alt="A Pandora store in Egypt" width="1600" height="1066" loading="lazy" decoding="async"></figure><div class="hs-copy"><h3>Pandora and Läderach arrive</h3><p>Pandora lands in Egypt with 8 branches, and the Swiss chocolatier Läderach opens its first Egyptian boutique at Waterway 2, New Cairo. Both are operated by All Niche, a BTC Group company.</p></div></article>
  <article class="hs-panel upcoming" id="ch-2027"><div class="hs-year word" aria-hidden="true">2027</div><figure class="hs-fig"><img src="assets/img/photos/store-laderach.webp" alt="The Läderach boutique in New Cairo" width="573" height="855" loading="lazy" decoding="async" style="aspect-ratio:4/3"></figure><div class="hs-copy"><p class="hs-tag"><i class="lume" aria-hidden="true"></i>Coming mid 2027</p><h3>Pandora Marasem</h3><p>A new Pandora store at Al Marasem Fifth Square, New Cairo, is scheduled to open in mid 2027.</p></div></article>
  <div class="hs-panel end"><h2>The full history</h2><p class="lead">Every milestone, from the Loria Shop to today’s retail network.</p><div class="btn-row"><a class="btn btn-gold" href="achievements/index.html">All achievements {ARROW}</a><a class="btn" href="about/index.html">About BTC {ARROW}</a></div></div>
 </div>
 <div class="hs-rail" aria-hidden="true"><div class="hs-ruler"><span class="hs-mark" data-for="ch-1935">1935</span><span class="hs-mark" data-for="ch-1974">1974</span><span class="hs-mark" data-for="ch-1976">1976</span><span class="hs-mark" data-for="ch-2025">2025</span><span class="hs-mark" data-for="ch-recent">Recent</span><span class="hs-mark" data-for="ch-2027">2027</span><span class="hs-needle"></span></div></div>
</div></section>

{chrono()}

<section class="section alt" aria-labelledby="brands-h">
 <div class="container"><div class="sec-head row reveal"><div><p class="eyebrow">Our brands</p><h2 id="brands-h">30+ international and luxury brands</h2></div><a class="btn btn-gold" href="brands/index.html">View all brands {ARROW}</a></div></div>
 <div class="marquee" aria-label="Brand logos"><div class="mq-row" data-dir="-1"><div class="mq-track">{plates(uniq[:half])}</div></div><div class="mq-row" data-dir="1"><div class="mq-track">{plates(uniq[half:])}</div></div></div>
 <div class="container blist-wrap"><ul class="blist">{blist}</ul><div class="blist-float" aria-hidden="true"><img src="" alt=""></div></div>
</section>

<section class="section dark" aria-labelledby="eco-h"><div class="container"><div class="sec-head reveal"><p class="eyebrow light">Business ecosystem</p><h2 id="eco-h">One group, many businesses</h2><p>Companies and concepts of BTC Group.</p></div>
{eco}</div></section>

<section class="section" aria-labelledby="retail-h"><div class="container rh-grid">
 <div class="rh-copy reveal"><p class="eyebrow">Retail operations</p><h2 id="retail-h">A retail network across Egypt</h2>
  <div class="rh-big"><b><span data-count="35">35</span></b><span>retail outlets and service centers across Egypt</span></div>
  <ul class="regions">
   <li><a href="retail/stores/index.html?region=Cairo"><span class="rg-name">Cairo</span><span class="rg-meta">BTC stores and BTC Exclusive, brand boutiques, Link, Casio, Pandora, Läderach, BTC DFS at Cairo Airport and the service center</span><span class="bl-go" aria-hidden="true"></span></a></li>
   <li><a href="retail/stores/index.html?region=Giza"><span class="rg-name">Giza</span><span class="rg-meta">BTC, Link and Pandora stores</span><span class="bl-go" aria-hidden="true"></span></a></li>
   <li><a href="retail/stores/index.html?region=Alexandria"><span class="rg-name">Alexandria</span><span class="rg-meta">BTC and Pandora stores</span><span class="bl-go" aria-hidden="true"></span></a></li>
  </ul>
  <a class="btn btn-gold" href="retail/stores/index.html">Browse the store network {ARROW}</a></div>
 <div class="rh-map reveal">{parts.emap(STORES, 'teaser')}</div>
</div></section>

<section class="section dark mag-feature" aria-labelledby="mag-h"><div class="container split"><a class="mag-cover reveal" href="news/magazine/index.html" aria-label="Read the BTC Magazine online" data-cursor="Read"><img src="assets/img/photos/mag-cover.webp" alt="BTC Magazine 2025 cover, 90 years" width="596" height="789" loading="lazy" decoding="async"><span class="mag-badge">Read online</span></a>
 <div class="reveal"><p class="eyebrow light">BTC Magazine 2025</p><h2 id="mag-h">The watch magazine of Egypt</h2><p class="lead">The digital edition celebrating 90 years of BTC, with the letter from the CEO, brand news and the full store directory.</p><div class="btn-row"><a class="btn btn-gold" href="news/magazine/index.html">Read the magazine {ARROW}</a><a class="btn" href="resources/index.html">Media &amp; resources {ARROW}</a></div></div></div></section>
</main>'''

def load_brands():
    src = open(os.path.join(ORIG, 'brands/index.html'), encoding='utf-8').read()
    out, seen = [], set()
    for u, lg, nm in re.findall(r'<a class="brand-card reveal" href="\.\./brands/([^/]+)/index\.html"[^>]*>\s*<span class="bc-logo"><img src="([^"]+)"[^>]*></span><span class="bc-meta"><span class="bc-name">([^<]+)</span>', src):
        if u in seen or not os.path.exists(os.path.join(ORIG, 'brands', u, 'index.html')): continue
        seen.add(u); out.append((u, H.unescape(nm), lg.replace('../', '')))
    return out
BRANDS = load_brands()
STORES = parts.parse_stores(open(os.path.join(ORIG, 'retail/stores/index.html'), encoding='utf-8').read())

def section_of(rel):
    seg = rel.split('/')[0] if '/' in rel else ''
    if seg in SEC_ALIAS:
        return SEC_ALIAS[seg]
    return seg

def process(rel):
    src = open(os.path.join(ORIG, rel), encoding='utf-8').read()
    R = re.search(r'<body data-root="([^"]*)"', src).group(1)
    sec = section_of(rel) if rel != 'index.html' else ''
    is_home = rel == 'index.html'
    out = src
    # head
    out = re.sub(r'<script>try\{history\.scrollRestoration.*?</script>', HEAD_JS % (HOME_FLAG if is_home else ''), out, count=1, flags=re.S)
    out = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">.*?rel="stylesheet">', FONTS, out, count=1, flags=re.S)
    out = out.replace('assets/css/main.css"', 'assets/css/btc.css"').replace('assets/js/main.js"', 'assets/js/btc.js"')
    out = out.replace('<meta name="theme-color" content="#111111">', '<meta name="theme-color" content="#000000">')
    # header + menu
    out = re.sub(r'<a class="skip".*?</header>', lambda m: header(R, sec), out, count=1, flags=re.S)
    # footer + bezel
    out = re.sub(r'<footer class="site-footer">.*?</footer>\s*<button class="to-top".*?</button>', lambda m: footer(R), out, count=1, flags=re.S)
    # main
    if is_home:
        out = re.sub(r'<main id="main">.*?</main>', lambda m: home_main(src), out, count=1, flags=re.S)
        out = out.replace('<body data-root="" data-idx="index.html">', '<body data-root="" data-idx="index.html">' + loader_html(), 1)
        pass
    else:
        out = re.sub(r'<section class="stats">.*?</section>', lambda m: chrono(head=False), out, flags=re.S)
        out = parts.scene_hero(out)
        bm = re.match(r'brands/([^/]+)/index\.html$', rel)
        if bm:
            slug = bm.group(1)
            out = re.sub(r'<div class="bh-logo">(.*?)</div>', lambda m: parts.brand_dial(R, BRANDS, slug, '<div class="bh-logo">%s</div>' % m.group(1)), out, count=1, flags=re.S)
            logos = {b[0]: b[2] for b in BRANDS}
            def pn(m):
                href, rel_, small, name = m.group(1), m.group(2), m.group(3), m.group(4)
                sl = re.search(r'brands/([^/]+)/index', href)
                lg = logos.get(sl.group(1)) if sl else None
                plate = '<i class="pn-plate" aria-hidden="true"><img src="%s%s" alt="" loading="lazy" decoding="async"></i>' % (R, lg) if lg else ''
                return '<a href="%s" rel="%s"><small>%s</small><span>%s</span>%s</a>' % (href, rel_, small, name, plate)
            out = re.sub(r'<a href="([^"]+)" rel="(prev|next)"><small>([^<]*)</small><span>([^<]*)</span></a>', pn, out)
        if rel == 'retail/stores/index.html':
            out = parts.tag_store_sites(out)
            out = out.replace('<section class="section"><div class="container"><div class="filters" data-filter-root', '<section class="section em-sec" aria-label="Store map"><div class="container">%s</div></section>\n<section class="section"><div class="container"><div class="filters" data-filter-root' % parts.emap(STORES, 'full', R), 1)
    # copy polish: no appended arrows on text links / pager
    out = re.sub(r'(<[^>]*class="text-link"[^>]*>[^<]*?)\s*→', r'\1', out)
    out = re.sub(r'(class="text-link"[^>]*>[^<]*)\s*<span aria-hidden="true">→</span>', r'\1', out)
    out = re.sub(r'(<a [^>]*rel="prev"[^>]*><small>[^<]*</small><span>)← ', r'\1', out)
    out = re.sub(r'(<span>)← ([^<]*</span></a>)', r'\1\2', out)
    out = re.sub(r'(<a [^>]*><small>[^<]*</small><span>[^<]*?) →(</span>)', r'\1\2', out)
    if rel == 'news/magazine/index.html':
        out = out.replace('</div></div></div></div></section></main>', '</div></div></div></section></main>', 1)
    dst = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dst) or OUT, exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(out)
    return out

if __name__ == '__main__':
    n = 0
    for dp, dn, fn in os.walk(ORIG):
        for f in fn:
            if f.endswith('.html'):
                rel = os.path.relpath(os.path.join(dp, f), ORIG)
                process(rel); n += 1
    print('built', n, 'pages')
