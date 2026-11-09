"""New building blocks for the BTC Group site: the movement hero, the Egypt store map,
the brand dial, and the aperture page hero."""
import re, math, html as H

e = lambda s: H.escape(s, quote=True)
ARROW = '<span aria-hidden="true">→</span>'

# ------------------------------------------------------------------ movement hero
CHAPTERS = [
    ('plate', 0, .13, .31, 'Mainplate', 'It started in 1935, with one boutique in Fayoum',
     'Mr. Loria Wassef opened his first watch and jewelry boutique under the name “Loria Shop” in Fayoum. Today BTC is Egypt’s largest watch distributor and the market leader of the watch industry in Egypt.',
     [('about/index.html', 'Read our story', 'btn'), ('leadership/index.html', 'Meet the family behind BTC', 'text-link')]),
    ('train', 1, .33, .51, 'Gear train', '30+ international and luxury brands',
     'From high-end Swiss watchmaking to affordable, trendy brands. BTC is the sole and major distributor of international watch and jewelry brands in Egypt.',
     [('brands/index.html', 'Explore our brands', 'btn btn-gold'), ('business/distribution/index.html', 'Distribution', 'text-link')]),
    ('bridges', 2, .53, .71, 'Bridges', 'A retail network across Egypt',
     '35 retail outlets and service centers across Egypt, in Cairo, Giza and Alexandria: BTC stores and BTC Exclusive, brand boutiques, Link, Casio, Pandora, Läderach and BTC DFS at Cairo Airport.',
     [('retail/stores/index.html', 'Browse the store network', 'btn'), ('business/retail-management/index.html', 'Retail management', 'text-link')]),
    ('balance', 3, .73, .91, 'Balance wheel', 'One group, many businesses',
     'BTC Trading, BTC Electronics, All Niche (Pandora and Läderach) and Link Watches, backed by a dedicated customer care department.',
     [('business/group-companies/index.html', 'Group companies', 'btn'), ('business/customer-care/index.html', 'Customer care', 'text-link')]),
]


def movement_hero():
    ch = []
    for key, anchor, a, b, part, title, text, links in CHAPTERS:
        btns = ''.join(('<a class="%s" href="%s">%s %s</a>' % (cls, u, t, ARROW)) if cls != 'text-link' else ('<a class="text-link" href="%s">%s</a>' % (u, t)) for u, t, cls in links)
        ch.append(f'<article class="mv-ch" id="mv-{key}" data-ch="{key}" data-anchor="{anchor}" data-from="{a}" data-to="{b}"><div class="mv-copy">'
                  f'<p class="mv-part"><i aria-hidden="true"></i>{part}</p><h2>{title}</h2><p>{text}</p><div class="btn-row">{btns}</div></div></article>')
    rail = ''.join(f'<li><button type="button" data-go="{k}"><i aria-hidden="true"></i><span>{p}</span></button></li>' for k, _, _, _, p, *_ in CHAPTERS)
    return f'''<section class="mv" id="top-movement" aria-label="Introduction">
 <div class="mv-stage" data-movement>
  <div class="mv-glow" aria-hidden="true"></div>
  <canvas class="mv-gl" aria-hidden="true"></canvas>
  <img class="mv-poster" src="assets/img/movement-poster.webp" alt="" width="1600" height="1000" decoding="async">
  <div class="mv-callout" aria-hidden="true"><svg><polyline points="0,0 0,0"/></svg><span class="mv-c-dot"><i></i><span class="mv-c-lab"></span></span></div>
  <div class="container mv-ui">
   <div class="mv-hero on" data-ch="hero" data-from="-1" data-to=".1">
    <p class="hero-kicker"><i class="lume" aria-hidden="true"></i>Watches and jewelry in Egypt since 1935</p>
    <h1>Leading the watch and jewelry market in Egypt for over 90 years</h1>
    <p class="lead">A family-owned group of companies offering 30+ international and luxury brands, from high-end Swiss watchmaking to affordable, trendy brands.</p>
    <div class="hero-cta"><a class="btn btn-gold" href="brands/index.html">Explore our brands {ARROW}</a><a class="btn btn-ghost" href="about/index.html">Our story {ARROW}</a></div>
   </div>
   {''.join(ch)}
  </div>
  <div class="container mv-foot"><span class="hero-time"><i class="lume" aria-hidden="true"></i>Cairo <time data-clock="s">--:--:--</time></span><button class="scroll-cue" type="button" data-go="plate"><i aria-hidden="true"></i><span>Scroll to open the movement</span></button><span class="mv-hint">Move the light with your cursor</span></div>
  <nav class="mv-rail" aria-label="Parts of the movement"><ol>{rail}</ol></nav>
 </div>
</section>'''



STORY = [('Since 1935', 0), ('Brands', 1), ('Retail', 2), ('The group', 3)]

def dial_svg():
    """A flat, line-drawn watch dial (static SVG). Only the three hand layers move, on the compositor."""
    ticks = []
    for i in range(60):
        if i % 5 == 0:
            continue
        a = math.radians(i * 6)
        s, c = math.sin(a), math.cos(a)
        ticks.append('<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f"/>' % (200 + s * 171, 200 - c * 171, 200 + s * 163, 200 - c * 163))
    idx = ['<rect class="ix" x="191.6" y="34" width="5.2" height="30" rx="1"/><rect class="ix" x="203.2" y="34" width="5.2" height="30" rx="1"/>']
    for h in range(1, 12):
        w = 6 if h % 3 == 0 else 4.4
        ln = 28 if h % 3 == 0 else 22
        idx.append('<rect class="ix" x="%.1f" y="36" width="%s" height="%s" rx="1" transform="rotate(%d 200 200)"/>' % (200 - w / 2, w, ln, h * 30))
    return ('<svg class="hx-face" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><defs>'
            '<radialGradient id="hxDial" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#1c2025"/><stop offset=".72" stop-color="#0d0f12"/><stop offset="1" stop-color="#060708"/></radialGradient>'
            '<linearGradient id="hxBezel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e0b6"/><stop offset=".45" stop-color="#8a7046"/><stop offset=".6" stop-color="#cbb07e"/><stop offset="1" stop-color="#4b3d27"/></linearGradient>'
            '<path id="hxTop" d="M 92 200 A 108 108 0 0 1 308 200"/><path id="hxBot" d="M 80 200 A 120 120 0 0 0 320 200"/></defs>'
            '<circle cx="200" cy="200" r="197" fill="url(#hxBezel)"/><circle cx="200" cy="200" r="190" fill="#050506"/><circle cx="200" cy="200" r="186" fill="url(#hxDial)"/>'
            '<circle class="ring" cx="200" cy="200" r="176"/><circle class="ring" cx="200" cy="200" r="158"/>'
            '<g class="ticks">' + ''.join(ticks) + '</g><g class="idx">' + ''.join(idx) + '</g>'
            '<circle class="ring faint" cx="200" cy="200" r="96"/>'
            '<text class="eng"><textPath href="#hxTop" startOffset="50%" text-anchor="middle">BTC GROUP</textPath></text>'
            '<text class="eng sm"><textPath href="#hxBot" startOffset="50%" text-anchor="middle">CAIRO · SINCE 1935</textPath></text></svg>')

def hand(cls, path):
    return '<div class="hx-hand %s" aria-hidden="true"><svg viewBox="0 0 400 400" focusable="false">%s</svg></div>' % (cls, path)

def light_hero():
    hands = (hand('hd-h', '<path class="hf" d="M200 92 L207 200 L200 214 L193 200 Z"/><path class="hl" d="M200 108 L202.6 176 L197.4 176 Z"/>') +
             hand('hd-m', '<path class="hf" d="M200 50 L205.5 200 L200 216 L194.5 200 Z"/><path class="hl" d="M200 66 L202 170 L198 170 Z"/>') +
             hand('hd-s', '<rect class="hsec" x="199.2" y="46" width="1.6" height="188"/><circle class="hsec" cx="200" cy="230" r="5"/><circle class="hcap" cx="200" cy="200" r="5.5"/>'))
    story = []
    for label, i in STORY:
        key, _a, _f, _t, _part, title, text, links = CHAPTERS[i]
        btns = ''.join(('<a class="%s" href="%s">%s %s</a>' % (cls, u, t, ARROW)) if cls != 'text-link' else ('<a class="text-link" href="%s">%s</a>' % (u, t)) for u, t, cls in links)
        story.append('<article class="hx-s reveal" id="intro-%s"><p class="eyebrow">%s</p><h2>%s</h2><p>%s</p><div class="btn-row">%s</div></article>' % (key, label, title, text, btns))
    return ('<section class="hx" id="top-movement" aria-label="Introduction">\n <div class="container hx-in">\n  <div class="hx-copy">\n'
            '   <p class="hero-kicker"><i class="lume" aria-hidden="true"></i>Watches and jewelry in Egypt since 1935</p>\n'
            '   <h1>Leading the watch and jewelry market in Egypt for over 90 years</h1>\n'
            '   <p class="lead">A family-owned group of companies offering 30+ international and luxury brands, from high-end Swiss watchmaking to affordable, trendy brands.</p>\n'
            '   <div class="hero-cta"><a class="btn btn-gold" href="brands/index.html">Explore our brands ' + ARROW + '</a><a class="btn btn-ghost" href="about/index.html">Our story ' + ARROW + '</a></div>\n  </div>\n'
            '  <figure class="hx-watch">\n   <div class="hx-crest"><svg class="hx-rings" viewBox="0 0 500 500" aria-hidden="true" focusable="false"><defs><linearGradient id="hxG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e0b6"/><stop offset=".5" stop-color="#8a7046"/><stop offset="1" stop-color="#cbb07e"/></linearGradient></defs><circle cx="250" cy="250" r="226" fill="none" stroke="url(#hxG)" stroke-width="1.4"/><circle cx="250" cy="250" r="204" fill="none" stroke="rgba(203,176,126,.22)"/><circle cx="250" cy="250" r="150" fill="none" stroke="rgba(203,176,126,.12)"/><g stroke="rgba(238,232,220,.38)" stroke-width="1.1"><line x1="250.00" y1="20.00" x2="250.00" y2="4.00"/><line x1="274.67" y1="15.29" x2="275.71" y2="5.35"/><line x1="299.07" y1="19.16" x2="301.15" y2="9.38"/><line x1="322.93" y1="25.55" x2="326.02" y2="16.04"/><line x1="345.99" y1="34.40" x2="350.06" y2="25.27"/><line x1="365.00" y1="50.81" x2="373.00" y2="36.96"/><line x1="388.72" y1="59.07" x2="394.60" y2="50.98"/><line x1="407.91" y1="74.62" x2="414.61" y2="67.19"/><line x1="425.38" y1="92.09" x2="432.81" y2="85.39"/><line x1="440.93" y1="111.28" x2="449.02" y2="105.40"/><line x1="449.19" y1="135.00" x2="463.04" y2="127.00"/><line x1="465.60" y1="154.01" x2="474.73" y2="149.94"/><line x1="474.45" y1="177.07" x2="483.96" y2="173.98"/><line x1="480.84" y1="200.93" x2="490.62" y2="198.85"/><line x1="484.71" y1="225.33" x2="494.65" y2="224.29"/><line x1="480.00" y1="250.00" x2="496.00" y2="250.00"/><line x1="484.71" y1="274.67" x2="494.65" y2="275.71"/><line x1="480.84" y1="299.07" x2="490.62" y2="301.15"/><line x1="474.45" y1="322.93" x2="483.96" y2="326.02"/><line x1="465.60" y1="345.99" x2="474.73" y2="350.06"/><line x1="449.19" y1="365.00" x2="463.04" y2="373.00"/><line x1="440.93" y1="388.72" x2="449.02" y2="394.60"/><line x1="425.38" y1="407.91" x2="432.81" y2="414.61"/><line x1="407.91" y1="425.38" x2="414.61" y2="432.81"/><line x1="388.72" y1="440.93" x2="394.60" y2="449.02"/><line x1="365.00" y1="449.19" x2="373.00" y2="463.04"/><line x1="345.99" y1="465.60" x2="350.06" y2="474.73"/><line x1="322.93" y1="474.45" x2="326.02" y2="483.96"/><line x1="299.07" y1="480.84" x2="301.15" y2="490.62"/><line x1="274.67" y1="484.71" x2="275.71" y2="494.65"/><line x1="250.00" y1="480.00" x2="250.00" y2="496.00"/><line x1="225.33" y1="484.71" x2="224.29" y2="494.65"/><line x1="200.93" y1="480.84" x2="198.85" y2="490.62"/><line x1="177.07" y1="474.45" x2="173.98" y2="483.96"/><line x1="154.01" y1="465.60" x2="149.94" y2="474.73"/><line x1="135.00" y1="449.19" x2="127.00" y2="463.04"/><line x1="111.28" y1="440.93" x2="105.40" y2="449.02"/><line x1="92.09" y1="425.38" x2="85.39" y2="432.81"/><line x1="74.62" y1="407.91" x2="67.19" y2="414.61"/><line x1="59.07" y1="388.72" x2="50.98" y2="394.60"/><line x1="50.81" y1="365.00" x2="36.96" y2="373.00"/><line x1="34.40" y1="345.99" x2="25.27" y2="350.06"/><line x1="25.55" y1="322.93" x2="16.04" y2="326.02"/><line x1="19.16" y1="299.07" x2="9.38" y2="301.15"/><line x1="15.29" y1="274.67" x2="5.35" y2="275.71"/><line x1="20.00" y1="250.00" x2="4.00" y2="250.00"/><line x1="15.29" y1="225.33" x2="5.35" y2="224.29"/><line x1="19.16" y1="200.93" x2="9.38" y2="198.85"/><line x1="25.55" y1="177.07" x2="16.04" y2="173.98"/><line x1="34.40" y1="154.01" x2="25.27" y2="149.94"/><line x1="50.81" y1="135.00" x2="36.96" y2="127.00"/><line x1="59.07" y1="111.28" x2="50.98" y2="105.40"/><line x1="74.62" y1="92.09" x2="67.19" y2="85.39"/><line x1="92.09" y1="74.62" x2="85.39" y2="67.19"/><line x1="111.28" y1="59.07" x2="105.40" y2="50.98"/><line x1="135.00" y1="50.81" x2="127.00" y2="36.96"/><line x1="154.01" y1="34.40" x2="149.94" y2="25.27"/><line x1="177.07" y1="25.55" x2="173.98" y2="16.04"/><line x1="200.93" y1="19.16" x2="198.85" y2="9.38"/><line x1="225.33" y1="15.29" x2="224.29" y2="5.35"/></g><g fill="#cbb07e"><circle cx="250" cy="22" r="3.4"/><circle cx="478" cy="250" r="2.4"/><circle cx="250" cy="478" r="2.4"/><circle cx="22" cy="250" r="2.4"/></g></svg>'
            '<div class="hx-plate"><img src="assets/img/logos/btc-mark.webp" alt="BTC" width="688" height="514" decoding="async"></div></div>\n'
            '   <figcaption class="hx-cap"><span class="hx-yr">Since 1935</span><span class="hx-sep" aria-hidden="true"></span><span><i class="lume" aria-hidden="true"></i>Cairo <time data-clock="s">--:--:--</time></span></figcaption>\n  </figure>\n </div>\n</section>\n'
            '<section class="hx-story" aria-label="BTC Group at a glance">\n <div class="container hx-grid">' + ''.join(story) + '</div>\n</section>')


# ------------------------------------------------------------------ Egypt store map
def proj(lon, lat):
    return ((lon - 24.6) * 89.26, (31.75 - lat) * 100)

OUTLINE = [(25.15, 31.67), (25.4, 31.52), (25.95, 31.62), (26.5, 31.48), (27.25, 31.38), (27.9, 31.15), (28.45, 31.02), (28.95, 30.85), (29.55, 30.95), (29.78, 31.08),
           (29.9, 31.19), (29.97, 31.25), (30.08, 31.33), (30.25, 31.38), (30.4, 31.46), (30.85, 31.56), (31.1, 31.6), (31.55, 31.53), (31.84, 31.52), (32.1, 31.36), (32.3, 31.27),
           (32.7, 31.08), (33.1, 31.12), (33.55, 31.12), (33.8, 31.13), (34.22, 31.32), (34.4, 30.9), (34.55, 30.4), (34.73, 29.95), (34.88, 29.5), (34.75, 29.2), (34.67, 28.98),
           (34.52, 28.5), (34.42, 28.1), (34.3, 27.85), (34.25, 27.73), (33.95, 27.95), (33.62, 28.24), (33.4, 28.55), (33.12, 29.03), (32.85, 29.4), (32.7, 29.62), (32.56, 29.95),
           (32.45, 29.9), (32.35, 29.6), (32.55, 29.2), (32.65, 29.05), (32.9, 28.65), (33.1, 28.35), (33.35, 28.0), (33.58, 27.65), (33.82, 27.25), (33.95, 26.75), (34.1, 26.4),
           (34.28, 26.1), (34.55, 25.6), (34.89, 25.07), (35.2, 24.5), (35.47, 23.95), (35.7, 23.85), (35.5, 23.45), (35.6, 23.13), (35.95, 22.75), (36.3, 22.4), (36.65, 22.23),
           (36.88, 22.0), (25.0, 22.0), (25.0, 29.4), (24.7, 30.15), (24.95, 31.0)]
NILE = [(31.35, 22.0), (31.6, 22.3), (31.95, 22.6), (32.35, 22.95), (32.6, 23.3), (32.8, 23.65), (32.88, 23.97), (32.9, 24.09), (32.93, 24.47), (32.87, 24.98), (32.55, 25.29),
        (32.64, 25.69), (32.72, 26.16), (32.24, 26.05), (31.9, 26.33), (31.7, 26.56), (31.18, 27.18), (30.85, 27.7), (30.75, 28.1), (30.95, 28.6), (31.1, 29.07), (31.2, 29.6), (31.23, 30.05), (31.2, 30.25)]
NILE_R = [(31.2, 30.25), (31.0, 30.5), (30.75, 30.85), (30.55, 31.15), (30.37, 31.46)]
NILE_D = [(31.2, 30.25), (31.25, 30.6), (31.4, 30.95), (31.6, 31.2), (31.82, 31.5)]
SITES = [  # key, label, lon, lat, region, match words (lower-case, against name + location)
    ('city-stars', 'City Stars Mall', 31.3460, 30.0727, 'Cairo', ['city stars', 'citystars']),
    ('el-akkad', 'El Akkad, Nasr City', 31.3405, 30.0590, 'Cairo', ['el akkad']),
    ('korba', 'Korba, Heliopolis', 31.3220, 30.0905, 'Cairo', ['korba']),
    ('service-center', 'Service Center, Heliopolis', 31.3340, 30.1010, 'Cairo', ['service center']),
    ('golf-city', 'Golf City Mall', 31.4650, 30.2050, 'Cairo', ['golf city']),
    ('festival-city', 'Cairo Festival City', 31.4080, 30.0290, 'Cairo', ['festival', 'cfc']),
    ('almaza', 'Almaza City Center', 31.3840, 30.0850, 'Cairo', ['almaza']),
    ('district-5', 'District 5', 31.4070, 29.9960, 'Cairo', ['district 5']),
    ('airport', 'Cairo International Airport', 31.4050, 30.1140, 'Cairo', ['airport']),
    ('point-90', 'Point 90', 31.4970, 30.0200, 'Cairo', ['point 90']),
    ('waterway', 'Waterway 2', 31.4730, 30.0330, 'Cairo', ['waterway']),
    ('marasem', 'Al Marasem Fifth Square', 31.5180, 30.0080, 'Cairo', ['marasem']),
    ('mall-of-arabia', 'Mall of Arabia', 30.9730, 30.0070, 'Giza', ['mall of arabia']),
    ('mall-of-egypt', 'Mall of Egypt', 31.0170, 29.9720, 'Giza', ['mall of egypt']),
    ('down-town', 'Down Town, Alexandria', 29.9000, 31.1990, 'Alexandria', ['down town']),
    ('city-center-alex', 'City Center Mall, Alexandria', 29.9330, 31.1660, 'Alexandria', ['city center']),
]
REGIONS = [('Alexandria', 29.92, 31.2, 'l'), ('Cairo', 31.40, 30.07, 'r'), ('Giza', 30.99, 29.99, 'l')]
VIEWS = {'all': (-30, -70, 1167, 1085), 'gc': (556, 134, 74, 66.6), 'alexandria': (467.5, 50.5, 14, 12.6)}
VIEW_OF = {'Cairo': 'gc', 'Giza': 'gc', 'Alexandria': 'alexandria'}
VIEW_NAME = {'gc': 'Greater Cairo', 'alexandria': 'Alexandria'}
SOON = {'marasem': 'Coming mid 2027'}


def site_of(name, loc, region):
    t = (name + ' ' + loc).lower()
    for key, label, lon, lat, reg, words in SITES:
        if reg == region and any(wd in t for wd in words):
            return key
    return ''


def parse_stores(src):
    return re.findall(r'<a class="store-card[^"]*" href="([^"]+)" data-region="([^"]+)" data-type="([^"]+)" data-name="([^"]+)">\s*<span class="sc-type">[^<]*</span><span class="sc-name">([^<]+)</span><span class="sc-loc">([^<]+)</span>', src)


def path_d(pts, close=False):
    xy = [proj(lo, la) for lo, la in pts]
    return 'M' + ' L'.join('%.1f %.1f' % p for p in xy) + (' Z' if close else '')


def emap(stores, mode, R=''):
    """mode 'full' (stores page, filters the list) or 'teaser' (links to the stores page)."""
    counts, regc = {}, {}
    for href, region, typ, dname, name, loc in stores:
        k = site_of(H.unescape(name), H.unescape(loc), region)
        counts[k] = counts.get(k, 0) + 1
        regc[region] = regc.get(region, 0) + 1
    svg = ('<svg class="em-svg" viewBox="0 0 1107 995" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>'
           '<pattern id="em-dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.1" fill="rgba(203,176,126,.32)"/></pattern>'
           '<radialGradient id="em-glow" cx="56%" cy="16%" r="40%"><stop offset="0" stop-color="rgba(168,240,217,.16)"/><stop offset="1" stop-color="rgba(168,240,217,0)"/></radialGradient></defs>'
           '<rect class="em-sea" x="-2000" y="-2000" width="5107" height="4995" fill="url(#em-glow)"/>'
           f'<path class="em-land" d="{path_d(OUTLINE, True)}"/><path class="em-land-dots" d="{path_d(OUTLINE, True)}" fill="url(#em-dots)"/>'
           f'<path class="em-nile" d="{path_d(NILE)}"/><path class="em-nile" d="{path_d(NILE_R)}"/><path class="em-nile" d="{path_d(NILE_D)}"/>'
           '<text class="em-sea-lab" x="300" y="-14">Mediterranean Sea</text><text class="em-sea-lab" x="990" y="600" transform="rotate(62 990 600)">Red Sea</text>'
           '<text class="em-nile-lab" x="700" y="640" transform="rotate(-70 700 640)">Nile</text></svg>')
    pins = []
    for name, lon, lat, side in REGIONS:
        x, y = proj(lon, lat)
        n = regc.get(name, 0)
        lab = f'<span class="em-lab">{name} <b>{n}</b></span>'
        if mode == 'teaser':
            pins.append(f'<a class="em-pin em-region s-{side}" href="{R}retail/stores/index.html?region={name}" data-x="{x:.1f}" data-y="{y:.1f}" aria-label="{name}: {n} stores"><i aria-hidden="true"></i>{lab}</a>')
        else:
            pins.append(f'<button type="button" class="em-pin em-region s-{side}" data-region="{name}" data-x="{x:.1f}" data-y="{y:.1f}" aria-label="Show {name}, {n} stores"><i aria-hidden="true"></i>{lab}</button>')
    lists = {'gc': [], 'alexandria': []}
    if mode == 'full':
        for key, label, lon, lat, reg, words in SITES:
            n = counts.get(key, 0)
            if not n:
                continue
            x, y = proj(lon, lat)
            side = 'l' if key in ('mall-of-arabia', 'korba', 'el-akkad', 'down-town', 'district-5', 'service-center') else 'r'
            soon = SOON.get(key)
            word = 'store' if n == 1 else 'stores'
            pins.append(f'<button type="button" class="em-pin em-site s-{side}{" soon" if soon else ""}" data-site="{key}" data-region="{reg}" data-x="{x:.2f}" data-y="{y:.2f}" style="--n:{n}" aria-label="{e(label)}: {n} {word}" hidden><i aria-hidden="true"></i><span class="em-lab">{e(label)} <b>{n}</b></span></button>')
            lists[VIEW_OF[reg]].append(f'<li><button type="button" data-site="{key}" data-region="{reg}">{e(label)} <small>{soon or ("%d %s" % (n, word))}</small></button></li>')
    views = ' '.join('data-v-%s="%s"' % (k, ' '.join(str(v) for v in vb)) for k, vb in VIEWS.items())
    if mode == 'teaser':
        return (f'<div class="emap em-teaser" data-emap="teaser" {views}><div class="em-frame">{svg}<div class="em-pins">{"".join(pins)}</div></div>'
                '<p class="em-note">Store positions are approximate.</p></div>')
    total = sum(regc.values())
    regs = ''.join(f'<li><button type="button" data-region="{nm}">{nm} <small>{regc.get(nm, 0)} stores</small></button></li>' for nm in ('Cairo', 'Giza', 'Alexandria'))
    panes = (f'<div class="em-pane" data-pane="all"><h2>Browse by city</h2><p>{total} stores listed in BTC’s materials. Choose a city, then a mall or street, to filter the list below.</p><ul class="em-list">{regs}</ul></div>'
             + ''.join(f'<div class="em-pane" data-pane="{v}" hidden><h2>{VIEW_NAME[v]}</h2><p>Choose a location to see its stores.</p><ul class="em-list">{"".join(lists[v])}</ul></div>' for v in ('gc', 'alexandria')))
    back = '<button type="button" class="em-back" hidden><span aria-hidden="true">←</span> All of Egypt</button>'
    return (f'<div class="emap em-full" data-emap="full" {views}><div><div class="em-frame">{svg}<div class="em-pins">{"".join(pins)}</div>{back}</div>'
            f'<p class="em-note">Store positions are approximate.</p></div><div class="em-panel" aria-live="polite">{panes}</div></div>')


def tag_store_sites(html_src):
    """add data-site to every store card so the map can filter by location."""
    def rep(m):
        name, loc, region = H.unescape(m.group(5)), H.unescape(m.group(6)), m.group(2)
        k = site_of(name, loc, region)
        return m.group(0).replace('data-region="%s"' % region, 'data-region="%s" data-site="%s"' % (region, k), 1)
    return re.sub(r'<a class="store-card[^"]*" href="([^"]+)" data-region="([^"]+)" data-type="([^"]+)" data-name="([^"]+)">\s*<span class="sc-type">[^<]*</span><span class="sc-name">([^<]+)</span><span class="sc-loc">([^<]+)</span>', rep, html_src)


# ------------------------------------------------------------------ brand dial
def brand_dial(R, brands, slug, logo_html):
    n = len(brands)
    idx = next((i for i, b in enumerate(brands) if b[0] == slug), 0)
    ticks = []
    for i, (sl, nm, logo) in enumerate(brands):
        a = (i - idx) / n * 360
        cls = 'bd-t is-cur' if i == idx else 'bd-t'
        ticks.append(f'<a class="{cls}" href="{R}brands/{sl}/index.html" tabindex="-1" data-name="{e(nm)}" transform="rotate({a:.2f})"><rect x="-2.2" y="-50" width="4.4" height="9" fill="transparent"/><line y1="-48" y2="{-43 if i == idx else -45.2}"/></a>')
    ring = (f'<svg class="bd-ring" viewBox="-50 -50 100 100" aria-hidden="true"><circle class="bd-track" r="41.6"/>'
            f'<g class="bd-ticks">{"".join(ticks)}</g><circle class="bd-cur" cy="-39.4" r="1.15"/></svg>')
    return (f'<div class="bh-dial" style="--bn:{n}">{ring}{logo_html}'
            f'<p class="bd-name" aria-hidden="true"><span class="bd-now">{e(brands[idx][1])}</span><span class="bd-hover"></span></p></div>')


# ------------------------------------------------------------------ aperture page hero
def scene_hero(out):
    def rep(m):
        cls, inner = m.group(1), m.group(2)
        return f'<section class="page-hero{cls} ph-scene"><div class="ph-pin">{inner}<div class="ph-ring" aria-hidden="true"></div></div></section>'
    return re.sub(r'<section class="page-hero([^"]*has-img[^"]*)">(.*?)</section>', rep, out, count=1, flags=re.S)
