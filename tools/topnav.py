"""Top navigation bar (replaces the old full-screen menu).
Every item of the former menu now lives in the header; items with sub-pages open a hover/focus dropdown."""
import html as H

# (section key, label, url, [(sub label, sub url), ...])
TOP = [
    ('about', 'About', 'about/index.html', [('Our story', 'about/index.html'), ('Mission, vision & values', 'about/mission-vision-values/index.html')]),
    ('brands', 'Brands', 'brands/index.html', [('All brands', 'brands/index.html'), ('Swiss luxury & mid-range', 'brands/index.html?category=Swiss+Luxury+%26+Mid-Range'), ('High-end luxury', 'brands/index.html?category=High-End+Luxury'), ('Fashion brands', 'brands/index.html?category=Fashion+Brands'), ('Link Watches brands', 'brands/index.html?category=Link+Watches+brands'), ('Jewellery & chocolate', 'brands/index.html?group=specialty')]),
    ('retail', 'Retail', 'retail/index.html', [('Retail operations', 'retail/index.html'), ('Store network', 'retail/stores/index.html')]),
    ('business', 'Business', 'business/index.html', [('Overview', 'business/index.html'), ('Group companies', 'business/group-companies/index.html'), ('Distribution', 'business/distribution/index.html'), ('Retail management', 'business/retail-management/index.html'), ('Customer care', 'business/customer-care/index.html')]),
    ('leadership', 'Leadership', 'leadership/index.html', []),
    ('achievements', 'Achievements', 'achievements/index.html', []),
    ('careers', 'Careers', 'careers/index.html', []),
    ('news', 'News', 'news/index.html', [('News & updates', 'news/index.html'), ('BTC Magazine', 'news/magazine/index.html'), ('Media & resources', 'resources/index.html')]),
    ('contact', 'Contact', 'contact/index.html', []),
]
e = lambda s: H.escape(s, quote=True)


def top_nav(R, sec):
    out = []
    for k, t, u, subs in TOP:
        cur = ' class="is-active"' if k == sec else ''
        a = '<a href="%s%s"%s>%s</a>' % (R, u, cur, e(t))
        if subs:
            dd = '<ul class="dd">' + ''.join('<li><a href="%s%s">%s</a></li>' % (R, e(su), e(st)) for st, su in subs) + '</ul>'
            out.append('<div class="nv has-dd">%s%s</div>' % (a, dd))
        else:
            out.append('<div class="nv">%s</div>' % a)
    return '<nav class="quick" aria-label="Main sections">%s</nav>' % ''.join(out)
