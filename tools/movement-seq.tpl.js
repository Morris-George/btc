/* BTC Group — "Calibre 1935" scroll sequence
   The movement was modelled in 3D and pre-rendered to a short image sequence that scrubs with
   the scroll. No live 3D, no idle work: the page only draws while you scroll. */
(function(){
'use strict';
var d=document,w=window,html=d.documentElement;
var stage=d.querySelector('[data-movement]');if(!stage)return;
var section=stage.closest('.mv')||stage;
var canvas=stage.querySelector('canvas');
var mq=function(q){return !!(w.matchMedia&&w.matchMedia(q).matches)};
var reduce=mq('(prefers-reduced-motion: reduce)');
var ctx=canvas&&canvas.getContext&&canvas.getContext('2d',{alpha:false});
if(!ctx){html.classList.add('no-gl');section.classList.add('flow');return}
var PI=Math.PI,N=96;
var clamp=function(v,a,b){return v<a?a:v>b?b:v};
var ANCHD=__ANCH__;
var ANAMES=['Mainplate','Gear train','Bridges','Balance wheel'];

var S={p:0,visible:true,beat:-1,lastY:w.scrollY};
var dirty=true,W=1,H=1,stW=1,stH=1,mobile=false,kind='d',imgs=[],ok=[],geo={ox:0,oy:0,iw:1,ih:1},started=false;
var chapters=Array.prototype.slice.call(section.querySelectorAll('[data-ch]'));
var rail=Array.prototype.slice.call(section.querySelectorAll('[data-go]'));
var callout=section.querySelector('.mv-callout'),cDot=callout&&callout.querySelector('.mv-c-dot'),cLine=callout&&callout.querySelector('polyline'),cLab=callout&&callout.querySelector('.mv-c-lab');

/* ---------- frames ---------- */
function load(i,cb){
  if(imgs[i])return;var im=new Image();imgs[i]=im;im.decoding='async';
  im.onload=function(){ok[i]=true;dirty=true;if(cb)cb()};
  im.src='assets/img/mv/'+kind+'-'+('00'+i).slice(-3)+'.webp';
}
function loadAll(){
  var order=[],i;for(i=0;i<N;i+=8)order.push(i);for(i=0;i<N;i+=4)if(order.indexOf(i)<0)order.push(i);for(i=0;i<N;i+=2)if(order.indexOf(i)<0)order.push(i);for(i=0;i<N;i++)if(order.indexOf(i)<0)order.push(i);
  var n=reduce?1:order.length,k=0;
  (function next(){ if(k>=n)return;var i=order[k++];load(i,null);var im=imgs[i];if(im.complete)setTimeout(next,0);else{im.addEventListener('load',next);im.addEventListener('error',next)}})();
}
function nearest(i){for(var r=0;r<N;r++){if(ok[i-r])return i-r;if(ok[i+r])return i+r}return -1}

function resize(){
  var r=stage.getBoundingClientRect();stW=r.width;stH=r.height;mobile=stW<760;
  var nk=mobile?'m':'d';if(nk!==kind||!started){kind=nk;imgs=[];ok=[];started=true;if(!html.classList.contains('has-gl')){}loadAll()}
  var dpr=Math.min(w.devicePixelRatio||1,1.75);
  W=Math.max(1,Math.round(r.width*dpr));H=Math.max(1,Math.round(r.height*dpr));
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
  dirty=true;
}
function progress(){
  if(reduce)return 0;
  var r=section.getBoundingClientRect(),span=r.height-w.innerHeight;
  return span>0?clamp(-r.top/span,0,1):0;
}
function draw(p){
  var f=p*(N-1),i0=Math.floor(f),fr=f-i0,a=nearest(i0);if(a<0)return;
  var im=imgs[a],sc=Math.max(W/im.naturalWidth,H/im.naturalHeight),iw=im.naturalWidth*sc,ih=im.naturalHeight*sc,ox=(W-iw)/2,oy=(H-ih)/2;
  geo.ox=ox/W;geo.oy=oy/H;geo.iw=iw/W;geo.ih=ih/H;
  ctx.globalAlpha=1;ctx.drawImage(im,ox,oy,iw,ih);
  var i1=Math.min(N-1,i0+1);if(fr>.02&&i1!==a&&ok[i1]){ctx.globalAlpha=fr;ctx.drawImage(imgs[i1],ox,oy,iw,ih);ctx.globalAlpha=1}
  if(!html.classList.contains('has-gl'))html.classList.add('has-gl');
}

/* ---------- frame loop: only while the scroll moves ---------- */
var lastT=0;
function frame(now){
  requestAnimationFrame(frame);
  var dt=lastT?Math.min(.05,(now-lastT)/1000):.016;lastT=now;
  if(!S.visible||d.hidden)return;
  var pT=progress();
  if(!dirty&&pT===S.p)return;
  dirty=false;
  S.p+=(pT-S.p)*(reduce?1:1-Math.pow(.0004,dt));if(Math.abs(pT-S.p)<2e-4)S.p=pT;else dirty=true;
  draw(S.p);
  var beats=Math.floor(S.p*240);if(beats!==S.beat){S.beat=beats;w.dispatchEvent(new CustomEvent('btc:beat',{detail:beats}))}
  overlay();
}

/* ---------- chapters, callout, rail ---------- */
var curCh=null;
function anchorAt(idx){
  var A=ANCHD[kind],f=S.p*(N-1),i0=Math.floor(f),i1=Math.min(N-1,i0+1),t=f-i0,a=A[i0][idx],b=A[i1][idx];
  var nx=a[0]+(b[0]-a[0])*t,ny=a[1]+(b[1]-a[1])*t;
  return [(geo.ox+nx*geo.iw)*stW,(geo.oy+ny*geo.ih)*stH];
}
function overlay(){
  var p=S.p,on=null;
  chapters.forEach(function(c){var a=+c.dataset.from,b=+c.dataset.to,act=p>=a&&p<b;if(act)on=c;if(c._on!==act){c._on=act;c.classList.toggle('on',act)}});
  if(on!==curCh){curCh=on;rail.forEach(function(r){r.classList.toggle('on',on&&r.dataset.go===on.dataset.ch)})}
  var inCh=p>.1&&p<.93;if(stage._in!==inCh){stage._in=inCh;stage.classList.toggle('in-ch',inCh)}
  var inMv=S.visible&&p<.985;if(S._inMv!==inMv){S._inMv=inMv;html.classList.toggle('in-mv',inMv)}
  if(!callout)return;
  var idx=on?+on.dataset.anchor:-1;
  if(idx<0||isNaN(idx)||reduce||!ANCHD[kind]){callout.classList.remove('on');return}
  var s=anchorAt(idx),lab=on.querySelector('.mv-part'),pr=(lab||on).getBoundingClientRect(),sr=stage.getBoundingClientRect();
  var tx=pr.right-sr.left+14,ty=pr.top-sr.top+pr.height/2;
  callout.classList.add('on');
  cDot.style.transform='translate('+s[0].toFixed(1)+'px,'+s[1].toFixed(1)+'px)';
  var cr=on.querySelector('.mv-copy').getBoundingClientRect(),ex=Math.max(tx,cr.right-sr.left+36);if(mobile||s[0]<ex+40)ex=tx;
  cLine.setAttribute('points',tx.toFixed(1)+','+ty.toFixed(1)+' '+ex.toFixed(1)+','+ty.toFixed(1)+' '+s[0].toFixed(1)+','+s[1].toFixed(1));
  if(cLab.textContent!==ANAMES[idx])cLab.textContent=ANAMES[idx];
}

/* ---------- events ---------- */
rail.forEach(function(b){b.addEventListener('click',function(){
  var c=section.querySelector('[data-ch="'+b.dataset.go+'"]');if(!c)return;
  var mid=(+c.dataset.from+ +c.dataset.to)/2,top=section.getBoundingClientRect().top+w.scrollY,span=section.offsetHeight-w.innerHeight;
  w.dispatchEvent(new CustomEvent('btc:scrollto',{detail:top+span*mid}));
})});
if('IntersectionObserver' in w)new IntersectionObserver(function(es){S.visible=es[0].isIntersecting;dirty=true;if(!S.visible){S._inMv=false;html.classList.remove('in-mv')}}).observe(section);
if('ResizeObserver' in w)new ResizeObserver(resize).observe(stage);else w.addEventListener('resize',resize);
w.addEventListener('scroll',function(){dirty=true},{passive:true});
chapters.forEach(function(c){if(c.dataset.ch==='hero')return;c.addEventListener('focusin',function(){if(c._on||section.classList.contains('flow'))return;
  var mid=(+c.dataset.from+ +c.dataset.to)/2,top=section.getBoundingClientRect().top+w.scrollY,span=section.offsetHeight-w.innerHeight;w.scrollTo(0,top+span*mid)})});
(function(){var yrs=d.getElementById('years');if(!yrs||reduce)return;
  var b=d.createElement('button');b.type='button';b.className='mv-skip';b.textContent='Skip to our timeline';
  b.addEventListener('click',function(){var top=yrs.getBoundingClientRect().top+w.scrollY;w.dispatchEvent(new CustomEvent('btc:scrollto',{detail:top}))});
  stage.appendChild(b)})();
if(reduce)section.classList.add('flow');
resize();requestAnimationFrame(frame);
w.BTCMovement={state:S};
})();
