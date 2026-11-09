/* BTC Group — motion engine ("Calibre 1935")
   Live Cairo time, smooth scroll, pinned chapters, cursor, magnetic pushers,
   split headlines, page curtains. Everything calms down for reduced motion. */
(function(){
  'use strict';
  var d=document,w=window,html=d.documentElement,body=d.body;
  html.classList.add('js');
  var mq=function(q){return !!(w.matchMedia&&w.matchMedia(q).matches)};
  var reduce=mq('(prefers-reduced-motion: reduce)'),fine=mq('(pointer: fine)')&&mq('(hover: hover)');
  var ss={get:function(k){try{return w.sessionStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{w.sessionStorage.setItem(k,v)}catch(e){}}};
  var clamp=function(v,a,b){return v<a?a:v>b?b:v};
  var $=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
  var VH=w.innerHeight,VW=w.innerWidth;

  /* ---------- open every page at the top (unless it links to an #anchor) ---------- */
  if(!location.hash){
    var moved=false,stopMove=function(){moved=true};
    ['wheel','touchstart','keydown','mousedown'].forEach(function(ev){w.addEventListener(ev,stopMove,{passive:true,once:true})});
    var top=function(){if(!moved)w.scrollTo(0,0)};
    top();d.addEventListener('DOMContentLoaded',top);w.addEventListener('load',top);
    [80,250,600].forEach(function(t){setTimeout(top,t)});
  }

  /* ---------- Cairo time ---------- */
  var tzOffset=0;
  function syncTz(){
    try{
      var now=new Date(),p={};
      new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric',hourCycle:'h23'}).formatToParts(now).forEach(function(x){p[x.type]=x.value});
      var asUtc=Date.UTC(+p.year,+p.month-1,+p.day,(+p.hour)%24,+p.minute,+p.second);
      tzOffset=Math.round((asUtc-now.getTime())/60000)*60000;
    }catch(e){tzOffset=-new Date().getTimezoneOffset()*60000}
  }
  syncTz();setInterval(syncTz,60000);
  function cairo(){var t=new Date(Date.now()+tzOffset);return {y:t.getUTCFullYear(),day:t.getUTCDate(),h:t.getUTCHours(),m:t.getUTCMinutes(),s:t.getUTCSeconds(),ms:t.getUTCMilliseconds()}}
  var pad=function(n){return(n<10?'0':'')+n};
  var clocks=$$('[data-clock]');
  function tickClocks(){var c=cairo();clocks.forEach(function(el){el.textContent=pad(c.h)+':'+pad(c.m)+(el.dataset.clock==='s'?':'+pad(c.s):'');el.setAttribute('datetime',pad(c.h)+':'+pad(c.m))})}
  if(clocks.length){tickClocks();setInterval(tickClocks,1000)}

  /* ---------- hero dial: hands set once from Cairo time, then rotated by CSS on the compositor ---------- */
  var hxDial=$('[data-hxdial]');
  function setDial(){var c=cairo(),sec=c.s+c.ms/1000,min=c.m+sec/60,hr=(c.h%12)+min/60;
    hxDial.style.setProperty('--ds',(-sec).toFixed(3)+'s');hxDial.style.setProperty('--dm',(-min*60).toFixed(2)+'s');hxDial.style.setProperty('--dh',(-hr*3600).toFixed(1)+'s');
    hxDial.classList.remove('run');void hxDial.offsetWidth;hxDial.classList.add('run')}
  if(hxDial){setDial();d.addEventListener('visibilitychange',function(){if(!d.hidden)setDial()})}

  /* ---------- smooth scroll engine ---------- */
  var S={y:w.scrollY,t:w.scrollY,on:false,lock:false,active:false};
  function maxY(){return Math.max(0,(d.scrollingElement||html).scrollHeight-w.innerHeight)}
  function innerScrollable(el,dy){
    while(el&&el!==body&&el!==html&&el.nodeType===1){
      if(el.hasAttribute('data-native-scroll'))return true;
      var oy=getComputedStyle(el).overflowY;
      if((oy==='auto'||oy==='scroll')&&el.scrollHeight>el.clientHeight+1){
        if(dy<0&&el.scrollTop>0)return true;
        if(dy>0&&el.scrollTop+el.clientHeight<el.scrollHeight-1)return true;
      }
      el=el.parentElement;
    }
    return false;
  }
  if(false){/* native scrolling: JS-driven wheel smoothing removed for speed */
    S.active=true;html.style.scrollBehavior='auto';
    w.addEventListener('wheel',function(e){
      if(e.ctrlKey||S.lock)return;
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      if(innerScrollable(e.target,e.deltaY))return;
      e.preventDefault();
      var dy=e.deltaY*(e.deltaMode===1?36:e.deltaMode===2?w.innerHeight:1);
      if(!S.on){S.y=w.scrollY;S.t=w.scrollY}
      S.t=clamp(S.t+dy,0,maxY());S.on=true;
    },{passive:false});
  }
  w.addEventListener('scroll',function(){if(!S.on){S.y=S.t=w.scrollY}},{passive:true});
  function scrollToY(y){
    y=clamp(y,0,maxY());
    if(S.active){S.y=w.scrollY;S.t=y;S.on=true}
    else w.scrollTo({top:y,behavior:reduce?'auto':'smooth'});
  }
  w.addEventListener('btc:scrollto',function(e){scrollToY(e.detail)});
  d.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;
    var id=a.getAttribute('href').slice(1);if(!id)return;
    var t=d.getElementById(id);if(!t)return;
    e.preventDefault();
    if(id==='main'){t.setAttribute('tabindex','-1');t.focus({preventScroll:true})}
    scrollToY(t.getBoundingClientRect().top+w.scrollY-(id==='main'?0:20));
  });

  /* ---------- header, menu, language ---------- */
  var header=$('.site-header'),menuBtn=$('.menu-btn'),menu=$('#site-menu');
  function setMenu(open){
    if(!menu)return;
    html.classList.toggle('menu-open',open);
    menuBtn.setAttribute('aria-expanded',open);
    var mw=$('.menu-word',menuBtn);if(mw)mw.textContent=open?'Close':'Menu';
    S.lock=open;S.on=false;
    if(open){menu.removeAttribute('inert');menu.setAttribute('aria-hidden','false');header.classList.remove('hide');setTimeout(function(){var f=$('a',menu);if(f)f.focus({preventScroll:true})},420)}
    else{menu.setAttribute('inert','');menu.setAttribute('aria-hidden','true')}
  }
  if(menuBtn)menuBtn.addEventListener('click',function(){setMenu(!html.classList.contains('menu-open'))});
  d.addEventListener('focusin',function(e){if(html.classList.contains('menu-open')&&!menu.contains(e.target)&&!header.contains(e.target)){var f=$('a',menu);if(f)f.focus()}});
  var lb=$('.lang-btn');
  if(lb)lb.addEventListener('click',function(e){e.stopPropagation();var l=lb.parentElement,o=l.classList.toggle('open');lb.setAttribute('aria-expanded',o)});
  d.addEventListener('click',function(e){if(!e.target.closest('.lang')){var l=$('.lang');if(l){l.classList.remove('open');if(lb)lb.setAttribute('aria-expanded','false')}}});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'){if(html.classList.contains('menu-open')){setMenu(false);menuBtn.focus()}$$('.open').forEach(function(x){x.classList.remove('open')})}});

  /* ---------- top nav: keep the current section in view on narrow screens ---------- */
  var qn=$('.quick'),qa=qn&&$('.is-active',qn);
  if(qa&&qn.scrollWidth>qn.clientWidth)qn.scrollLeft=Math.max(0,qa.offsetLeft-(qn.clientWidth-qa.offsetWidth)/2);

  /* ---------- top nav dropdown: on touch screens a tap opens the list instead of navigating ---------- */
  var touchNav=function(){return (w.matchMedia&&matchMedia('(hover: none)').matches)||w.innerWidth<=1100};
  $$('.nv.has-dd > a').forEach(function(a){a.addEventListener('click',function(e){
    if(!touchNav())return;e.preventDefault();var nv=a.parentNode,o=!nv.classList.contains('open');
    $$('.nv.open').forEach(function(x){x.classList.remove('open')});if(o)nv.classList.add('open')})});
  d.addEventListener('click',function(e){if(!e.target.closest('.nv.has-dd'))$$('.nv.open').forEach(function(x){x.classList.remove('open')})});

  /* ---------- page curtain ---------- */
  var ap=d.createElement('div');ap.className='aperture';ap.setAttribute('aria-hidden','true');body.appendChild(ap);
  if(html.classList.contains('arriving'))setTimeout(function(){html.classList.remove('arriving')},1200);
  d.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
    var h=a.getAttribute('href');if(!h||h.charAt(0)==='#'||/^(mailto:|tel:|javascript:)/i.test(h))return;
    var u;try{u=new URL(a.href,location.href)}catch(x){return}
    if(u.origin!==location.origin)return;
    if(u.pathname===location.pathname&&u.search===location.search)return;
    e.preventDefault();
    if(reduce){location.href=a.href;return}
    var cx=e.clientX,cy=e.clientY;if(!cx&&!cy){var ar=a.getBoundingClientRect();cx=ar.left+ar.width/2;cy=ar.top+ar.height/2}
    ap.style.setProperty('--ax',cx.toFixed(0)+'px');ap.style.setProperty('--ay',cy.toFixed(0)+'px');
    ss.set('btc-t','1');html.classList.add('leaving');
    setTimeout(function(){location.href=a.href},240);
  });
  w.addEventListener('pageshow',function(e){html.classList.remove('leaving');if(e.persisted){html.classList.remove('arriving','menu-open');S.lock=false}});

  /* ---------- split headlines into words ---------- */
  function splitWords(el){
    if(el.dataset.splitDone)return;el.dataset.splitDone='1';
    var n=0;
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(ch){
        if(ch.nodeType===3){
          var parts=ch.nodeValue.split(/(\s+)/),frag=d.createDocumentFragment();
          parts.forEach(function(p){
            if(!p)return;
            if(/^\s+$/.test(p)){frag.appendChild(d.createTextNode(p));return}
            var o=d.createElement('span');o.className='w';var i=d.createElement('span');i.className='wi';i.style.setProperty('--wi',n++);i.textContent=p;o.appendChild(i);frag.appendChild(o);
          });
          node.replaceChild(frag,ch);
        }else if(ch.nodeType===1&&ch.tagName!=='BR'){walk(ch)}
      });
    })(el);
    el.classList.add('split-wait');
  }
  var splitTargets=reduce?[]:$$('.hero h1,.mv-hero h1,.mv-ch h2,.page-hero h1,.sec-head h2,.hs-panel h2,.chrono-head h2,.split>div>h2,.rh-copy h2,.em-pane h2');
  splitTargets.forEach(splitWords);
  var splitIO='IntersectionObserver' in w?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!e.target.closest('.hero,.mv-hero')){e.target.classList.add('split-in');e.target.classList.remove('split-wait');splitIO.unobserve(e.target)}})},{threshold:.2}):null;
  splitTargets.forEach(function(el){if(splitIO)splitIO.observe(el);else el.classList.add('split-in')});
  function revealHeroTitle(){var h=$('.hero h1,.mv-hero h1');if(h)setTimeout(function(){h.classList.add('split-in');h.classList.remove('split-wait')},350)}

  /* ---------- reveals + counters + sub-dials ---------- */
  function count(el){
    if(el.dataset.done)return;el.dataset.done=1;
    var t=parseInt(el.dataset.count,10),s=performance.now(),dur=2200;
    if(reduce){el.textContent=t;return}
    (function f(n){var p=Math.min(1,(n-s)/dur),v=Math.round(t*(1-Math.pow(1-p,4)));el.textContent=v;if(p<1)requestAnimationFrame(f)})(s);
  }
  function onIn(el){
    el.classList.add('in');
    $$('[data-count]',el).forEach(count);
    var hand=$('.sd-hand',el.closest('.sub')||el);
    if(hand&&el.closest('.sub')){var sub=el.closest('.sub'),v=+sub.dataset.val,m=+sub.dataset.max;hand.style.transform='rotate('+(-135+270*clamp(v/m,0,1))+'deg)';sub.style.setProperty('--arc','0')}
  }
  var revIO='IntersectionObserver' in w&&!reduce?new IntersectionObserver(function(es){
    var batch=es.filter(function(e){return e.isIntersecting}).map(function(e){return e.target});
    batch.sort(function(a,b){var ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return (ra.top-rb.top)||(ra.left-rb.left)});
    batch.forEach(function(el,i){el.style.setProperty('--d',Math.min(i,6));onIn(el);revIO.unobserve(el)});
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'}):null;
  $$('.reveal').forEach(function(el){revIO?revIO.observe(el):onIn(el)});

  /* ---------- the living dial + loader ---------- */
  var dial=$('[data-dial]'),hero=$('.hero')||$('.mv');
  var hand={},heroP=0,heroVisible=true;
  var L={x:.5,y:.4,tx:.5,ty:.4,la:30,tla:30,mouse:false};
  if(dial){
    hand.h=$('.h-hour',dial);hand.m=$('.h-min',dial);hand.s=$('.h-sec',dial);
    var dateEl=$('[data-date]',dial);if(dateEl)dateEl.textContent=cairo().day;
    dial.addEventListener('animationend',function(){dial.style.animation='none'});
    if('IntersectionObserver' in w)new IntersectionObserver(function(es){heroVisible=es[0].isIntersecting}).observe(hero);
  }
  function drawDial(now){
    if(!dial||!heroVisible)return;
    var c=cairo(),s=c.s+c.ms/1000,m=c.m+s/60,h=(c.h%12)+m/60,spin=heroP*1080;
    hand.s.setAttribute('transform','rotate('+(s*6+spin*2).toFixed(2)+')');
    hand.m.setAttribute('transform','rotate('+(m*6+spin).toFixed(2)+')');
    hand.h.setAttribute('transform','rotate('+(h*30+spin/12).toFixed(2)+')');
    // light + tilt
    if(!L.mouse||reduce){L.tla=30+(now/1000)*6}
    L.la+=(L.tla-L.la)*.06;L.x+=(L.tx-L.x)*.06;L.y+=(L.ty-L.y)*.06;
    dial.style.setProperty('--la',L.la.toFixed(1)+'deg');
    dial.style.setProperty('--gx',(70-L.x*50).toFixed(1)+'%');
    dial.style.setProperty('--gy',(55-L.y*45).toFixed(1)+'%');
    if(!reduce){
      dial.style.setProperty('--ry',((L.x-.5)*12).toFixed(2)+'deg');
      dial.style.setProperty('--rx',((.5-L.y)*9).toFixed(2)+'deg');
      dial.style.setProperty('--sc',(1+heroP*.22).toFixed(3));
      dial.style.setProperty('--rot',(heroP*-24).toFixed(2)+'deg');
    }
  }
  if(dial&&fine&&!reduce){
    hero.addEventListener('pointermove',function(e){
      var r=dial.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      L.mouse=true;L.tx=clamp(e.clientX/VW,0,1);L.ty=clamp(e.clientY/VH,0,1);
      var a=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90;
      var diff=((a-L.tla)%360+540)%360-180;L.tla+=diff;
    });
    hero.addEventListener('pointerleave',function(){L.mouse=false;L.tx=.5;L.ty=.4});
  }
  var loader=$('.loader');
  function land(){html.classList.add('landed');revealHeroTitle()}
  if(loader&&html.classList.contains('intro')&&!reduce){
    var yEl=$('.ld-year',loader),y0=1935,y1=cairo().y,t0=performance.now(),D=1750,ended=false;
    body.style.overflow='hidden';
    var finish=function(){
      if(ended)return;ended=true;loader.classList.add('done');land();ss.set('btc-intro','1');body.style.overflow='';
      setTimeout(function(){html.classList.remove('intro');if(loader.parentNode)loader.parentNode.removeChild(loader)},1300);
    };
    (function run(n){var p=Math.min(1,(n-t0)/D),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;yEl.textContent=Math.round(y0+(y1-y0)*e);if(p<1&&!ended)requestAnimationFrame(run);else setTimeout(finish,380)})(t0);
    loader.addEventListener('click',finish);
  }else{
    html.classList.remove('intro');
    if(loader&&loader.parentNode)loader.parentNode.removeChild(loader);
    if(hero){ss.set('btc-intro','1');requestAnimationFrame(land)}
  }

  /* ---------- horizontal chapters ---------- */
  var hs=$('.hs'),HS={on:false};
  function layoutHS(){
    if(!hs)return;
    var track=$('.hs-track',hs);
    if(VW<=980||reduce){HS.on=false;hs.classList.add('static');hs.style.height='';track.style.transform='';return}
    hs.classList.remove('static');HS.on=true;HS.track=track;
    HS.dist=Math.max(0,track.scrollWidth-VW);
    hs.style.height=(HS.dist+VH)+'px';
    HS.top=hs.getBoundingClientRect().top+w.scrollY;
    HS.sd=!!(w.CSS&&CSS.supports&&CSS.supports('animation-timeline','scroll()'));
    HS.panels=$$('.hs-panel',hs).map(function(p){return {el:p,left:p.offsetLeft,w:p.offsetWidth,year:$('.hs-year',p),img:$('.hs-fig img',p)}});
    var ruler=$('.hs-ruler',hs);HS.rw=ruler?ruler.clientWidth:0;HS.needle=$('.hs-needle',hs);
    hs.style.setProperty('--hs-top',HS.top.toFixed(1));hs.style.setProperty('--hs-dist',HS.dist.toFixed(1));hs.style.setProperty('--hs-rw',HS.rw);hs.classList.toggle('sd',HS.sd);
    HS.marks=$$('.hs-mark',hs).map(function(m){
      var p=$('#'+m.dataset.for);var f=p?clamp((p.offsetLeft+p.offsetWidth/2-VW/2)/HS.dist,0,1):0;
      m.style.left=(f*100)+'%';return {el:m,f:f};
    });
  }
  function updateHS(y){
    if(!HS.on)return;
    var p=clamp((y-HS.top)/(HS.dist||1),0,1);
    if(!HS.sd){HS.track.style.transform='translate3d('+(-p*HS.dist).toFixed(1)+'px,0,0)';if(HS.needle)HS.needle.style.setProperty('--nx',(p*HS.rw).toFixed(1)+'px')}
    HS.marks.forEach(function(m){var on=p>=m.f-.015;if(m._on!==on){m._on=on;m.el.classList.toggle('on',on)}});
  }

  /* ---------- manifesto words ---------- */
  var mf=$('[data-words]'),mfWords=[];
  if(mf){
    var txt=mf.textContent.trim().split(/\s+/);mf.textContent='';
    txt.forEach(function(t,i){var s=d.createElement('span');s.className='mw';s.textContent=t;mf.appendChild(s);if(i<txt.length-1)mf.appendChild(d.createTextNode(' '))});
    mfWords=$$('.mw',mf);
    if(reduce)mfWords.forEach(function(x){x.classList.add('lit')});
  }
  function updateMF(){
    if(!mf||reduce)return;
    var r=mf.getBoundingClientRect(),p=clamp((VH*.85-r.top)/(r.height+VH*.35),0,1),n=Math.round(p*mfWords.length*1.08);
    for(var i=0;i<mfWords.length;i++){var on=i<n;if(mfWords[i]._on!==on){mfWords[i]._on=on;mfWords[i].classList.toggle('lit',on)}}
  }

  /* ---------- timelines ---------- */
  var tls=$$('.timeline');
  function updateTL(){
    tls.forEach(function(tl){
      var r=tl.getBoundingClientRect();if(r.bottom<-200||r.top>VH+200)return;
      var line=VH*.62;tl.style.setProperty('--fill',clamp((line-r.top)/r.height,0,1).toFixed(3));
      $$('.tl-item',tl).forEach(function(it){it.classList.toggle('passed',reduce||it.getBoundingClientRect().top<line)});
    });
  }

  /* ---------- parallax ---------- */
  var phImg=$('.ph-bg img'),pars=$$('[data-par]'),footMark=$('.foot-mark');
  function updatePar(y){
    if(reduce)return;
    if(phImg&&y<VH*1.2)phImg.style.setProperty('--py',(y*.28).toFixed(1)+'px');
    pars.forEach(function(el){var r=el.getBoundingClientRect();if(r.bottom<0||r.top>VH)return;var c=(r.top+r.height/2-VH/2)/VH;el.style.setProperty('--py',(c*-90).toFixed(1)+'px')});
    if(footMark){var r=footMark.getBoundingClientRect();if(r.top<VH){var p=clamp(1-(r.top)/(VH),0,1);footMark.style.setProperty('--sx',(-60+p*220).toFixed(1)+'%')}}
  }

  /* ---------- marquee ---------- */
  var rows=$$('.mq-row').map(function(r,i){
    var t=$('.mq-track',r);t.innerHTML+=t.innerHTML;
    $$('a',t).forEach(function(a,k){if(k>=t.children.length/2){a.setAttribute('tabindex','-1');a.setAttribute('aria-hidden','true')}});
    var o={el:t,x:0,dir:+r.dataset.dir||(i%2?1:-1),speed:1,target:1,half:0};
    r.addEventListener('mouseenter',function(){o.target=.15});r.addEventListener('mouseleave',function(){o.target=1});
    r.addEventListener('focusin',function(){o.target=0});r.addEventListener('focusout',function(){o.target=1});
    return o;
  });
  function measureRows(){rows.forEach(function(o){o.half=o.el.scrollWidth/2})}
  var vel=0;
  function updateRows(dt){
    if(reduce||!rows.length)return;
    rows.forEach(function(o){
      o.speed+=(o.target-o.speed)*.08;
      var v=(.45+Math.min(Math.abs(vel)*.06,7))*o.speed*o.dir*(dt/16.67);
      o.x+=v;if(o.half){if(o.x<=-o.half)o.x+=o.half;if(o.x>0)o.x-=o.half}
      o.el.style.transform='translate3d('+o.x.toFixed(2)+'px,0,0)';
    });
  }

  /* ---------- brand list: floating logo plate ---------- */
  var bl=$('.blist'),fl=$('.blist-float'),F={x:0,y:0,tx:0,ty:0,on:false,r:0};
  if(bl&&fl&&fine&&!reduce){
    var flImg=$('img',fl);
    $$('a',bl).forEach(function(a){a.addEventListener('mouseenter',function(){if(a.dataset.logo){flImg.src=a.dataset.logo;flImg.alt=''}fl.classList.add('on');F.on=true})});
    bl.addEventListener('mouseleave',function(){fl.classList.remove('on');F.on=false});
    bl.addEventListener('mousemove',function(e){if(!F.x){F.x=e.clientX;F.y=e.clientY}F.tx=e.clientX;F.ty=e.clientY});
  }
  function updateFloat(){
    if(!F.on&&!F.x)return;
    var px=F.x;F.x+=(F.tx-F.x)*.14;F.y+=(F.ty-F.y)*.14;F.r+=(clamp((F.x-px)*.5,-12,12)-F.r)*.12;
    fl.style.setProperty('--fx',F.x.toFixed(1)+'px');fl.style.setProperty('--fy',F.y.toFixed(1)+'px');fl.style.setProperty('--fr',F.r.toFixed(2)+'deg');
    fl.style.scale=F.on?'1':'.6';
  }

  /* ---------- cursor ---------- */
  var cur=null,C={x:-100,y:-100,rx:-100,ry:-100};
  if(fine&&!reduce){
    cur=d.createElement('div');cur.className='cursor';cur.setAttribute('aria-hidden','true');
    cur.innerHTML='<div class="cursor-ring"><span class="cursor-label"></span></div><div class="cursor-dot"></div>';
    body.appendChild(cur);html.classList.add('has-cursor');
    var ring=$('.cursor-ring',cur),dot=$('.cursor-dot',cur),lab=$('.cursor-label',cur);
    d.addEventListener('mousemove',function(e){C.x=e.clientX;C.y=e.clientY;if(!cur.classList.contains('on')){C.rx=C.x;C.ry=C.y;cur.classList.add('on')}},{passive:true});
    d.addEventListener('mouseleave',function(){cur.classList.remove('on')});
    d.addEventListener('mouseover',function(e){
      var t=e.target;
      var lbl=t.closest('[data-cursor]');
      var txt=t.closest('input,textarea,select,[contenteditable]');
      var lnk=t.closest('a,button,label,.chip,summary');
      cur.classList.toggle('is-label',!!lbl&&!txt);if(lbl)lab.textContent=lbl.dataset.cursor;
      cur.classList.toggle('is-text',!!txt);
      cur.classList.toggle('is-link',!!lnk&&!lbl&&!txt);
    });
  }
  function updateCursor(){
    if(!cur)return;
    C.rx+=(C.x-C.rx)*.2;C.ry+=(C.y-C.ry)*.2;
    ring.style.transform='translate3d('+C.rx.toFixed(1)+'px,'+C.ry.toFixed(1)+'px,0)';
    dot.style.transform='translate3d('+C.x+'px,'+C.y+'px,0)';
  }

  /* ---------- magnetic pushers, tilt plates, spotlight ---------- */
  if(fine&&!reduce){
    $$('.btn,.menu-btn,.icon-btn').forEach(function(b){
      b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.22).toFixed(1)+'px,'+((e.clientY-r.top-r.height/2)*.3).toFixed(1)+'px)'});
      b.addEventListener('mouseleave',function(){b.style.transform=''});
    });
    $$('.brand-card,.bh-logo,.mag-cover').forEach(function(c){
      var k=c.classList.contains('mag-cover')?14:c.classList.contains('bh-logo')?10:7;
      c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.setProperty('--try',((x-.5)*k).toFixed(2)+'deg');c.style.setProperty('--trx',((.5-y)*k).toFixed(2)+'deg')});
      c.addEventListener('mouseleave',function(){c.style.removeProperty('--try');c.style.removeProperty('--trx')});
    });
    d.addEventListener('pointermove',function(e){
      var c=e.target.closest&&e.target.closest('.card,.tile,.cta-card,.store-card,.person,.biz-item');if(!c)return;
      var r=c.getBoundingClientRect();c.style.setProperty('--px',(e.clientX-r.left)+'px');c.style.setProperty('--py',(e.clientY-r.top)+'px');
    },{passive:true});
  }

  /* ---------- scroll bezel ---------- */
  var tt=$('.to-top'),ttP=tt&&$('.p',tt),ttH=tt&&$('.tt-hand',tt);
  if(tt){tt.hidden=false;tt.addEventListener('click',function(){scrollToY(0)})}

  /* ---------- inner page heroes: aperture scenes ---------- */
  var scenes=[];
  function layoutScenes(){
    scenes.forEach(function(sc){
      sc.top=sc.el.getBoundingClientRect().top+w.scrollY;sc.span=Math.max(1,sc.el.offsetHeight-VH);
      if(sc.dial){var pr=sc.pin.getBoundingClientRect(),dr=sc.dial.getBoundingClientRect();
        sc.el.style.setProperty('--apx',(dr.left+dr.width/2-pr.left).toFixed(0)+'px');sc.el.style.setProperty('--apy',(dr.top+dr.height/2-pr.top).toFixed(0)+'px');sc.el.style.setProperty('--r0',(dr.width*.41).toFixed(0)+'px')}
    });
  }
  function updateScenes(){scenes.forEach(function(sc){var p=clamp((w.scrollY-sc.top)/sc.span,0,1);if(sc.p!==p){sc.p=p;sc.el.style.setProperty('--app',p.toFixed(4))}})}

  /* ---------- brand dial: name the brand under each tick ---------- */
  $$('.bh-dial').forEach(function(bd){
    var hv=$('.bd-hover',bd);
    $$('.bd-t',bd).forEach(function(t){
      t.addEventListener('mouseenter',function(){if(t.classList.contains('is-cur'))return;hv.textContent=t.getAttribute('data-name');bd.classList.add('peek')});
      t.addEventListener('mouseleave',function(){bd.classList.remove('peek')});
    });
  });

  /* ---------- menu: a window onto each section ---------- */
  var mwin=$('.m-win-in'),mbez=$('.m-bezel'),mItems=$$('.mnav>li[data-img]'),mImgs=null;
  function menuImgs(){
    if(mImgs||!mwin)return;mImgs=mItems.map(function(li){var im=new Image();im.alt='';im.decoding='async';im.src=li.dataset.img;mwin.appendChild(im);return im});
    var cur=mItems.findIndex(function(li){return li.classList.contains('is-active')});showMenu(cur<0?0:cur);
  }
  function showMenu(i){if(!mImgs)return;mImgs.forEach(function(im,k){im.classList.toggle('on',k===i)});if(mbez)mbez.style.setProperty('--mr',(i*36)+'deg')}
  if(menuBtn)menuBtn.addEventListener('click',menuImgs);
  mItems.forEach(function(li,i){li.addEventListener('mouseenter',function(){showMenu(i)});li.addEventListener('focusin',function(){showMenu(i)})});



  /* ---------- jeweller's loupe over photographs ---------- */
  var LP=null;
  if(fine&&!reduce){
    var lp=d.createElement('div');lp.className='loupe';lp.setAttribute('aria-hidden','true');body.appendChild(lp);
    LP={img:null,Z:2.4};
    var okImg=function(t){
      if(!t||t.tagName!=='IMG'||t.closest('.ph-bg,.mv,.bh-logo,.bc-logo,.mq-track,.identity,.logo,.blist-float,.m-window,.pn-plate,.bl-plate,.foot-brand,.hs-fig.logo,.loader,.rd-thumbs,.em-frame'))return false;
      var src=t.currentSrc||t.src||'';if(!/\/(photos|magazine)\//.test(src))return false;
      var r=t.getBoundingClientRect();return r.width>150&&r.height>110;
    };
    var hideLoupe=function(){if(!LP.img)return;LP.img=null;lp.classList.remove('on');html.classList.remove('loupe-on')};
    d.addEventListener('mousemove',function(e){
      var t=e.target;
      if(t!==LP.img){if(okImg(t)){LP.img=t;lp.style.backgroundImage='url("'+(t.currentSrc||t.src)+'")';lp.classList.add('on');html.classList.add('loupe-on')}else hideLoupe()}
      if(!LP.img)return;
      var im=LP.img,r=im.getBoundingClientRect(),nw=im.naturalWidth||r.width,nh=im.naturalHeight||r.height,fit=getComputedStyle(im).objectFit,sc,dw,dh;
      if(fit==='cover'||fit==='contain'){sc=fit==='cover'?Math.max(r.width/nw,r.height/nh):Math.min(r.width/nw,r.height/nh);dw=nw*sc;dh=nh*sc}else{dw=r.width;dh=r.height}
      var px=e.clientX-r.left-(r.width-dw)/2,py=e.clientY-r.top-(r.height-dh)/2,Z=LP.Z;
      lp.style.backgroundSize=(dw*Z).toFixed(0)+'px '+(dh*Z).toFixed(0)+'px';
      lp.style.backgroundPosition=(95-px*Z).toFixed(1)+'px '+(95-py*Z).toFixed(1)+'px';
      lp.style.translate=e.clientX+'px '+e.clientY+'px';
    },{passive:true});
    w.addEventListener('scroll',hideLoupe,{passive:true});d.addEventListener('mouseleave',hideLoupe);
  }

  /* ---------- Egypt store map ---------- */
  var maps=$$('[data-emap]').map(function(m){
    var o={el:m,mode:m.dataset.emap,svg:$('.em-svg',m),frame:$('.em-frame',m),pins:$$('.em-pin',m),V:{},view:'all',back:$('.em-back',m)};
    ['all','gc','alexandria'].forEach(function(k){var a=m.getAttribute('data-v-'+k);if(a)o.V[k]=a.split(' ').map(Number)});
    o.cur=o.V.all.slice();return o;
  });
  var viewOf=function(r){return r==='Alexandria'?'alexandria':r==='all'?'all':'gc'};
  function placeMap(o){
    var W=o.frame.clientWidth,H=o.frame.clientHeight,c=o.cur,sc=Math.min(W/c[2],H/c[3]),ox=(W-c[2]*sc)/2,oy=(H-c[3]*sc)/2;
    o.svg.setAttribute('viewBox',c.map(function(v){return v.toFixed(3)}).join(' '));
    o.pins.forEach(function(p){if(p.hidden)return;p.style.setProperty('--px',((+p.dataset.x-c[0])*sc+ox).toFixed(1)+'px');p.style.setProperty('--py',((+p.dataset.y-c[1])*sc+oy).toFixed(1)+'px')});
  }
  function placeMaps(){maps.forEach(placeMap)}
  function mapView(o,k,instant){
    if(!o.V[k])return;o.view=k;o.el.classList.toggle('zoomed',k!=='all');
    o.pins.forEach(function(p){var reg=p.classList.contains('em-region');p.hidden=k==='all'?!reg:(reg||viewOf(p.dataset.region)!==k)});
    if(o.back)o.back.hidden=k==='all';
    $$('.em-pane',o.el).forEach(function(pn){pn.hidden=pn.dataset.pane!==k});
    var from=o.cur.slice(),to=o.V[k],t0=performance.now(),D=instant||reduce?0:1100;
    (function step(n){var t=D?Math.min(1,(n-t0)/D):1,e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      var wv=Math.exp(Math.log(from[2])+(Math.log(to[2])-Math.log(from[2]))*e),f=(wv-from[2])/((to[2]-from[2])||1);
      if(!isFinite(f))f=e;
      o.cur=[from[0]+(to[0]-from[0])*f,from[1]+(to[1]-from[1])*f,wv,from[3]+(to[3]-from[3])*f];placeMap(o);if(t<1)requestAnimationFrame(step)})(t0);
  }
  maps.forEach(function(o){
    placeMap(o);
    if(o.mode==='teaser'){
      $$('.regions a').forEach(function(a){var m=/region=([^&]+)/.exec(a.getAttribute('href')||'');if(!m)return;var pin=$('.em-region[href*="region='+m[1]+'"]',o.el);
        if(pin){a.addEventListener('mouseenter',function(){pin.classList.add('on')});a.addEventListener('mouseleave',function(){pin.classList.remove('on')})}});
      return;
    }
    var FR=$('[data-filter-root]'),api=function(){return FR&&FR._api};
    var pickSite=function(key,reg){
      $$('[data-site]',o.el).forEach(function(b){b.classList.toggle('on',b.dataset.site===key)});
      var A=api();if(A)A.site(key,reg);
      if(VW<=980&&key!=='all'){var g=$('.store-grid');if(g)scrollToY(g.getBoundingClientRect().top+w.scrollY-140)}
    };
    o.el.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b||!o.el.contains(b))return;
      if(b.classList.contains('em-back')){mapView(o,'all');pickSite('all','all');return}
      if(b.dataset.site){mapView(o,viewOf(b.dataset.region));pickSite(b.dataset.site,b.dataset.region);return}
      if(b.dataset.region){mapView(o,viewOf(b.dataset.region));pickSite('all',b.dataset.region)}
    });
    if(FR)$$('.chip[data-g="region"]',FR).forEach(function(c){c.addEventListener('click',function(e){if(e.isTrusted){mapView(o,viewOf(c.dataset.f));$$('[data-site]',o.el).forEach(function(b){b.classList.remove('on')});var A=api();if(A)A.clearSite()}})});
    o.sync=function(reg){if(reg&&reg!=='all')mapView(o,viewOf(reg),true)};
  });

  /* ---------- the one loop ---------- */
  var lastY=-1,lastT=performance.now(),dirAcc=0,heroIn=$('.hero-in'),heroFoot=$('.hero-foot'),dialWrap=$('.dial-wrap');
  function frame(now){
    var dt=Math.min(64,now-lastT);lastT=now;
    if(S.on){
      var k=1-Math.pow(1-.1,dt/16.67);S.y+=(S.t-S.y)*k;
      if(Math.abs(S.t-S.y)<.5){S.y=S.t;S.on=false}
      w.scrollTo(0,S.y);
    }
    var y=w.scrollY,dy=lastY<0?0:y-lastY;
    vel+=(dy-vel)*.2;
    if(y!==lastY){
      if(header){
        header.classList.toggle('scrolled',y>24);
        dirAcc=(dy>0)===(dirAcc>0)?dirAcc+dy:dy;
        if(!html.classList.contains('menu-open')){if(dirAcc>60&&y>320)header.classList.add('hide');else if(dirAcc<-30||y<120)header.classList.remove('hide')}
      }
      if(tt){var mp=maxY(),pr=mp>0?y/mp:0;tt.classList.toggle('show',y>500);ttP.style.strokeDashoffset=(166*(1-pr)).toFixed(1);ttH.style.setProperty('--a',(pr*360).toFixed(1)+'deg')}
      if(hero){heroP=clamp(y/(hero.offsetHeight*.9),0,1);if(!reduce&&heroIn){heroIn.style.transform='translate3d(0,'+(heroP*-90).toFixed(1)+'px,0)';heroIn.style.opacity=(1-heroP*1.25).toFixed(3);heroFoot.style.opacity=(1-heroP*2.5).toFixed(3);dialWrap.style.opacity=(1-heroP*.75).toFixed(3)}}
      if(HS.on)html.classList.toggle('in-hs',y>HS.top-10&&y<HS.top+HS.dist+10);
      updateHS(y);updateMF();updateTL();updatePar(y);updateScenes();
      lastY=y;
    }
    drawDial(now);updateRows(dt);updateFloat();updateCursor();
    requestAnimationFrame(frame);
  }
  function relayout(){VH=w.innerHeight;VW=w.innerWidth;layoutHS();measureRows();layoutScenes();placeMaps();lastY=-1}
  w.addEventListener('resize',function(){clearTimeout(relayout._t);relayout._t=setTimeout(relayout,120)});
  w.addEventListener('load',relayout);
  relayout();
  requestAnimationFrame(frame);

  /* ---------- filters (brands + stores) ---------- */
  var fr=$('[data-filter-root]');
  if(fr){
    var items=$$('[data-items] > a'),q=$('[data-q]',fr),out=$('[data-count-out]',fr),empty=$('.empty'),kind=fr.dataset.kind==='store'?'store':'brand';
    var state={all:'all',region:'all',type:'all',text:'',site:'all'};
    var apply=function(){var n=0;items.forEach(function(it){var ok=true;
      if(kind==='brand'){var f=state.all;if(f!=='all'){ok=f.indexOf('group:')===0?it.dataset.div===f.slice(6):(it.dataset.cat||'').split('|').indexOf(f)>-1}}
      else{if(state.region!=='all'&&it.dataset.region!==state.region)ok=false;if(state.type!=='all'&&it.dataset.type!==state.type)ok=false;if(state.site!=='all'&&it.dataset.site!==state.site)ok=false}
      if(ok&&state.text&&it.dataset.name.indexOf(state.text)<0)ok=false;
      it.style.display=ok?'':'none';if(ok){n++;it.classList.add('in')}});
      out.textContent=n;if(empty)empty.hidden=n>0;relayout()};
    $$('.chip[data-f]',fr).forEach(function(c){c.addEventListener('click',function(){var g=c.dataset.g||'all';state[g]=c.dataset.f;if(kind==='store'&&g==='type'){state.text=c.dataset.q||'';if(q)q.value=state.text}$$('.chip',c.parentElement).forEach(function(x){x.classList.toggle('is-on',x===c);x.setAttribute('aria-pressed',x===c)});apply()})});
    if(q)q.addEventListener('input',function(){state.text=q.value.trim().toLowerCase();apply()});
    var setChip=function(g,val){$$('.chip[data-f]',fr).forEach(function(x){if((x.dataset.g||'all')!==g)return;var on=x.dataset.f===val;x.classList.toggle('is-on',on);x.setAttribute('aria-pressed',on)});state[g]=val};
    fr._api={site:function(key,reg){state.site=key;if(reg)setChip('region',reg);apply()},clearSite:function(){state.site='all';apply()}};
    var p=new URLSearchParams(location.search);
    var pick=function(g,val){var c=$$('.chip[data-f]',fr).filter(function(x){return (x.dataset.g||'all')===g&&x.dataset.f===val})[0];if(c)c.click()};
    if(kind==='brand'){if(p.get('category'))pick('all',p.get('category'));else if(p.get('group'))pick('all','group:'+p.get('group'))}
    else{if(p.get('q')&&q){var qc=$$('.chip[data-q]',fr).filter(function(x){return x.dataset.q===p.get('q').toLowerCase()})[0];if(qc)qc.click();else{q.value=p.get('q');state.text=q.value.trim().toLowerCase();apply()}}if(p.get('region')){pick('region',p.get('region'));maps.forEach(function(o){if(o.sync)o.sync(p.get('region'))})}if(p.get('type'))pick('type',p.get('type'))}
  }

  /* ---------- search page ---------- */
  var sq=d.getElementById('site-q');
  if(sq){var data=JSON.parse(d.getElementById('search-data').textContent),res=d.getElementById('results'),root=body.dataset.root||'';
    var esc=function(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
    var run=function(){var t=sq.value.trim().toLowerCase();if(!t){res.innerHTML='';return}
      var m=data.filter(function(x){return (x.t+' '+x.d).toLowerCase().indexOf(t)>-1}).slice(0,40);
      res.innerHTML=m.length?m.map(function(x){return '<li><a href="'+root+x.u.replace(/^\//,'')+(body.dataset.idx||'')+'"><b>'+(x.k?'<span class="k">'+x.k+'</span>':'')+esc(x.t)+'</b><small>'+esc(x.d)+'</small></a></li>'}).join(''):'<li class="small">Nothing matches “'+esc(sq.value)+'”. Try a brand, a mall or a city.</li>'};
    sq.addEventListener('input',run);var q0=new URLSearchParams(location.search).get('q');if(q0){sq.value=q0;run()}}

  /* ---------- magazine reader ---------- */
  var rd=$('[data-reader]');
  if(rd){var tot=+rd.dataset.total,base=rd.dataset.base,cp=1,im=$('.rd-img',rd),cnt=$('.rd-count',rd),jump=$('.rd-jump',rd),ths=$$('.rd-th',rd),strip=$('.rd-thumbs',rd);
    strip.setAttribute('data-native-scroll','');
    var go=function(n){n=Math.max(1,Math.min(tot,n));cp=n;im.src=base+'p-'+pad(n)+'.webp';im.alt='BTC Magazine 2025, page '+n;cnt.textContent='Page '+n+' of '+tot;jump.value=n;ths.forEach(function(t){t.classList.toggle('is-on',+t.dataset.p===n)});var t=ths[n-1];if(t)strip.scrollTo({left:t.offsetLeft-strip.clientWidth/2+t.clientWidth/2,behavior:'smooth'});[n+1,n+2].forEach(function(k){if(k<=tot){var x=new Image();x.src=base+'p-'+pad(k)+'.webp'}})};
    $('.prev',rd).addEventListener('click',function(){go(cp-1)});$('.next',rd).addEventListener('click',function(){go(cp+1)});
    ths.forEach(function(t){t.addEventListener('click',function(){go(+t.dataset.p)})});jump.addEventListener('change',function(){go(+jump.value||1)});
    d.addEventListener('keydown',function(e){if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowRight')go(cp+1);if(e.key==='ArrowLeft')go(cp-1)});
    var sx=0;im.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});im.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40)go(cp+(dx<0?1:-1))});
    $('.rd-full',rd).addEventListener('click',function(){var st=$('.rd-stage',rd);try{var r=(st.requestFullscreen||st.webkitRequestFullscreen).call(st);if(r&&r.catch)r.catch(function(){})}catch(e){}})}

  /* ---------- careers application form ---------- */
  var af=d.getElementById('apply-form');
  if(af)af.addEventListener('submit',function(e){e.preventDefault();var st=d.getElementById('apply-status');
    if(!af.checkValidity()){af.reportValidity();return}
    var big=false;$$('input[type=file]',af).forEach(function(i){Array.prototype.forEach.call(i.files,function(fl){if(fl.size>10*1024*1024)big=true})});
    if(big){st.textContent='Each file must be 10 MB or smaller.';return}
    var act=af.dataset.action;
    if(act){st.textContent='Sending…';fetch(act,{method:'POST',body:new FormData(af),headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw 0;af.reset();st.textContent='Application sent.'}).catch(function(){st.textContent='The application did not send. Email your documents to '+af.dataset.mailto+'.'})}
    else{var g=function(n){return af.elements[n].value};var cv=af.elements.cv.files[0];
      location.href='mailto:'+af.dataset.mailto+'?subject='+encodeURIComponent('Job application – '+g('name'))+'&body='+encodeURIComponent('Name: '+g('name')+'\nEmail: '+g('email')+'\nPhone: '+g('phone')+'\nPosition: '+g('position')+'\n\n'+g('message')+'\n\n(Please attach your CV'+(cv?': '+cv.name:'')+' and other documents to this email.)');
      st.textContent='Your email app should open with your details. Attach your CV and documents there, then send. If it does not open, email '+af.dataset.mailto+'.'}});
  /* ---------- contact form -> mailto ---------- */
  var f=$('form[data-mailto]');
  if(f)f.addEventListener('submit',function(e){e.preventDefault();var g=function(n){return f.elements[n]?f.elements[n].value:''};
    var bodyTxt='Name: '+g('name')+'\nEmail: '+g('email')+(g('company')?'\nCompany: '+g('company'):'')+'\n\n'+g('message');
    location.href='mailto:'+f.dataset.mailto+'?subject='+encodeURIComponent(g('type')+' – '+g('name'))+'&body='+encodeURIComponent(bodyTxt)});
})();
