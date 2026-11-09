/* BTC Group — "Calibre 1935"
   A watch movement built by hand in WebGL2: procedural gilt wheels, champagne bridges
   with Côtes de Genève, a perlage mainplate, rubies, blued screws, a 3 Hz balance that
   drives the escapement, and a rotor that scrolling winds. Scroll opens it into four
   chapters. No libraries. */
(function(){
'use strict';
var d=document,w=window,html=d.documentElement;
var stage=d.querySelector('[data-movement]');if(!stage)return;
var section=stage.closest('.mv')||stage;
var canvas=stage.querySelector('canvas');
var mq=function(q){return !!(w.matchMedia&&w.matchMedia(q).matches)};
var reduce=mq('(prefers-reduced-motion: reduce)'),fine=mq('(pointer: fine)')&&mq('(hover: hover)');
var gl=null;
try{gl=canvas.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'})}catch(e){}
if(!gl){html.classList.add('no-gl');section.classList.add('flow');return}
html.classList.add('has-gl');if(reduce)section.classList.add('flow');

var PI=Math.PI,TAU=PI*2;
var clamp=function(v,a,b){return v<a?a:v>b?b:v},lerp=function(a,b,t){return a+(b-a)*t};
var smooth=function(t){t=clamp(t,0,1);return t*t*(3-2*t)};
var eOut=function(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3)};
var eBack=function(t){t=clamp(t,0,1);var c=2.2;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};

/* =================== geometry =================== */
function Geo(){this.p=[];this.n=[];this.k=[]}
Geo.prototype.v=function(a){this.p.push(a[0],a[1],a[2]);this.n.push(a[3],a[4],a[5]);this.k.push(a[6])};
Geo.prototype.tri=function(a,b,c){this.v(a);this.v(b);this.v(c)};
Geo.prototype.quad=function(a,b,c,e){this.v(a);this.v(b);this.v(c);this.v(a);this.v(c);this.v(e)};
Geo.prototype.add=function(g,tx,ty,tz,ang){
  var c=Math.cos(ang||0),s=Math.sin(ang||0);
  for(var i=0;i<g.p.length;i+=3){
    var x=g.p[i],y=g.p[i+1],nx=g.n[i],ny=g.n[i+1];
    this.p.push(x*c-y*s+tx,x*s+y*c+ty,g.p[i+2]+tz);this.n.push(nx*c-ny*s,nx*s+ny*c,g.n[i+2]);
  }
  for(i=0;i<g.k.length;i++)this.k.push(g.k[i]);
  return this;
};

/* a ring / disc / gear: prof(theta) gives the outer radius */
function ring(g,prof,ri,z0,z1,segs,o){
  o=o||{};var kt=o.kt==null?0:o.kt,kw=o.kw==null?1:o.kw,flat=o.flat!==false,bev=o.bev||0,i;
  var P=[];for(i=0;i<=segs;i++){var t=i/segs*TAU,r=prof(t);P.push([Math.cos(t)*r,Math.sin(t)*r,t,r])}
  var zt=z1-bev,s=Math.SQRT1_2;
  for(i=0;i<segs;i++){
    var a=P[i],b=P[i+1],ca=Math.cos(a[2]),sa=Math.sin(a[2]),cb=Math.cos(b[2]),sb=Math.sin(b[2]);
    var ra=a[3]-bev,rb=b[3]-bev;
    if(ri>0)g.quad([ri*ca,ri*sa,z1,0,0,1,kt],[ra*ca,ra*sa,z1,0,0,1,kt],[rb*cb,rb*sb,z1,0,0,1,kt],[ri*cb,ri*sb,z1,0,0,1,kt]);
    else g.tri([0,0,z1,0,0,1,kt],[ra*ca,ra*sa,z1,0,0,1,kt],[rb*cb,rb*sb,z1,0,0,1,kt]);
    var ex=b[0]-a[0],ey=b[1]-a[1],el=Math.hypot(ex,ey)||1,nx=ey/el,ny=-ex/el;
    var na=flat?[nx,ny]:[ca,sa],nb=flat?[nx,ny]:[cb,sb];
    g.quad([a[0],a[1],z0,na[0],na[1],0,kw],[b[0],b[1],z0,nb[0],nb[1],0,kw],[b[0],b[1],zt,nb[0],nb[1],0,kw],[a[0],a[1],zt,na[0],na[1],0,kw]);
    if(bev>0)g.quad([a[0],a[1],zt,na[0]*s,na[1]*s,s,2],[b[0],b[1],zt,nb[0]*s,nb[1]*s,s,2],[rb*cb,rb*sb,z1,nb[0]*s,nb[1]*s,s,2],[ra*ca,ra*sa,z1,na[0]*s,na[1]*s,s,2]);
    if(ri>0)g.quad([ri*cb,ri*sb,z0,-cb,-sb,0,kw],[ri*ca,ri*sa,z0,-ca,-sa,0,kw],[ri*ca,ri*sa,z1,-ca,-sa,0,kw],[ri*cb,ri*sb,z1,-cb,-sb,0,kw]);
  }
  return g;
}
var circ=function(r){return function(){return r}};
function tooth(R,N,ad,de){
  var m=2*R/N,rr=R-(de||1.25)*m,rt=R+(ad||1)*m;
  return function(t){var u=((t/TAU*N)%1+1)%1,c=Math.abs(u-.5)*2;if(c>=.56)return rr;var x=c/.56;return rr+(rt-rr)*Math.sqrt(Math.max(0,1-Math.pow(x,2.6)))};
}
function clubTooth(R,N){
  var rr=R*.74;
  return function(t){var u=((t/TAU*N)%1+1)%1;
    if(u<.5)return rr;if(u<.56)return rr+(R*.84-rr)*((u-.5)/.06);if(u<.8)return R*.84+R*.16*((u-.56)/.24);if(u<.86)return R;return rr};
}
function sawTooth(R,N){
  var m=2*R/N,rr=R-m*.9,rt=R+m*.5;
  return function(t){var u=((t/TAU*N)%1+1)%1;return u<.82?rr+(rt-rr)*(u/.82):rt-(rt-rr)*((u-.82)/.18)};
}
function spokes(g,n,r0,r1,wd,z0,z1,a0){
  for(var k=0;k<n;k++){
    var a=a0+k*TAU/n,c=Math.cos(a),s=Math.sin(a),px=-s*wd/2,py=c*wd/2;
    var A=[c*r0+px,s*r0+py],B=[c*r1+px,s*r1+py],C=[c*r1-px,s*r1-py],D=[c*r0-px,s*r0-py];
    g.quad([D[0],D[1],z1,0,0,1,0],[C[0],C[1],z1,0,0,1,0],[B[0],B[1],z1,0,0,1,0],[A[0],A[1],z1,0,0,1,0]);
    g.quad([A[0],A[1],z0,-s,c,0,2],[B[0],B[1],z0,-s,c,0,2],[B[0],B[1],z1,-s,c,0,2],[A[0],A[1],z1,-s,c,0,2]);
    g.quad([C[0],C[1],z0,s,-c,0,2],[D[0],D[1],z0,s,-c,0,2],[D[0],D[1],z1,s,-c,0,2],[C[0],C[1],z1,s,-c,0,2]);
  }
  return g;
}
/* a wheel: toothed rim + hub + spokes */
function wheel(R,N,o){
  var g=new Geo(),prof=o.prof||tooth(R,N);
  ring(g,prof,o.ri,o.z0,o.z1,N*(o.res||12),{});
  ring(g,circ(o.hub),o.hole||0,o.z0,o.z1,48,{flat:false,kw:2});
  spokes(g,o.sp||4,o.hub*.92,o.ri+.02,o.sw||.36,o.z0,o.z1-.004,o.sa||0);
  return g;
}
function cyl(r,z0,z1,segs,o){return ring(new Geo(),circ(r),0,z0,z1,segs||32,Object.assign({flat:false},o||{}))}
/* jewel: gold chaton + domed ruby */
function jewel(r){
  var c=ring(new Geo(),circ(r),r*.58,0,.07,40,{flat:false,kw:2,kt:2});
  var rb=new Geo(),R=r*.58,h=.11,seg=32,rings=5,i,j;
  for(i=0;i<seg;i++){
    var a=i/seg*TAU,b=(i+1)/seg*TAU,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
    rb.quad([R*ca,R*sa,0,ca,sa,0,1],[R*cb,R*sb,0,cb,sb,0,1],[R*cb,R*sb,.03,cb,sb,0,1],[R*ca,R*sa,.03,ca,sa,0,1]);
    for(j=0;j<rings;j++){
      var t0=j/rings,t1=(j+1)/rings,r0=R*Math.cos(t0*PI/2),r1=R*Math.cos(t1*PI/2),z0=.03+h*Math.sin(t0*PI/2),z1=.03+h*Math.sin(t1*PI/2);
      var n0=[Math.cos(t0*PI/2),Math.sin(t0*PI/2)],n1=[Math.cos(t1*PI/2),Math.sin(t1*PI/2)];
      rb.quad([r0*ca,r0*sa,z0,n0[0]*ca,n0[0]*sa,n0[1],4],[r0*cb,r0*sb,z0,n0[0]*cb,n0[0]*sb,n0[1],4],[r1*cb,r1*sb,z1,n1[0]*cb,n1[0]*sb,n1[1],4],[r1*ca,r1*sa,z1,n1[0]*ca,n1[0]*sa,n1[1],4]);
    }
  }
  return {chaton:c,ruby:rb};
}
/* blued screw with a real slot */
function screw(r){
  var g=new Geo(),h=.2,sl=.07,seg=28,i;
  ring(g,circ(r),0,0,h-.06,seg,{flat:false,kt:3});
  for(var side=-1;side<=1;side+=2){
    var pts=[];for(i=0;i<=14;i++){var a=-PI/2+i/14*PI;var x=Math.cos(a)*r,y=Math.sin(a)*r;if(x<sl)x=sl;pts.push([x*side,y*side])}
    for(i=0;i<pts.length-1;i++){
      var A=pts[i],B=pts[i+1];
      g.tri([sl*side,0,h,0,0,1,0],[A[0],A[1],h,0,0,1,0],[B[0],B[1],h,0,0,1,0]);
      var nx=(A[0]+B[0])/2,ny=(A[1]+B[1])/2,nl=Math.hypot(nx,ny)||1;
      g.quad([A[0],A[1],h-.06,nx/nl,ny/nl,0,2],[B[0],B[1],h-.06,nx/nl,ny/nl,0,2],[B[0],B[1],h,nx/nl,ny/nl,0,2],[A[0],A[1],h,nx/nl,ny/nl,0,2]);
    }
    g.quad([sl*side,-r,h-.06,-side,0,0,1],[sl*side,r,h-.06,-side,0,0,1],[sl*side,r,h,-side,0,0,1],[sl*side,-r,h,-side,0,0,1]);
  }
  return g;
}
function box(g,cx,cy,ang,len,wid,z0,z1,k){
  var c=Math.cos(ang),s=Math.sin(ang),hx=len/2,hy=wid/2;
  var P=[[-hx,-hy],[hx,-hy],[hx,hy],[-hx,hy]].map(function(q){return [cx+q[0]*c-q[1]*s,cy+q[0]*s+q[1]*c]});
  g.quad([P[0][0],P[0][1],z1,0,0,1,k||0],[P[1][0],P[1][1],z1,0,0,1,k||0],[P[2][0],P[2][1],z1,0,0,1,k||0],[P[3][0],P[3][1],z1,0,0,1,k||0]);
  for(var i=0;i<4;i++){var A=P[i],B=P[(i+1)%4],ex=B[0]-A[0],ey=B[1]-A[1],l=Math.hypot(ex,ey),nx=ey/l,ny=-ex/l;
    g.quad([A[0],A[1],z0,nx,ny,0,2],[B[0],B[1],z0,nx,ny,0,2],[B[0],B[1],z1,nx,ny,0,2],[A[0],A[1],z1,nx,ny,0,2])}
  return g;
}

/* ---------- signed distance shapes -> beveled plates ---------- */
var sd={
  c:function(cx,cy,r){return function(x,y){return Math.hypot(x-cx,y-cy)-r}},
  cap:function(ax,ay,bx,by,r){return function(x,y){var px=x-ax,py=y-ay,bax=bx-ax,bay=by-ay,h=clamp((px*bax+py*bay)/(bax*bax+bay*bay),0,1);return Math.hypot(px-bax*h,py-bay*h)-r}},
  u:function(fs,k){return function(x,y){var v=fs[0](x,y);for(var i=1;i<fs.length;i++){var b=fs[i](x,y),h=clamp(.5+.5*(b-v)/k,0,1);v=b*(1-h)+v*h-k*h*(1-h)}return v}},
  sub:function(f,g,k){return function(x,y){var a=-f(x,y),b=g(x,y),h=clamp(.5+.5*(b-a)/k,0,1);return -(b*(1-h)+a*h-k*h*(1-h))}}
};
function contour(f,bb,h){
  var x0=bb[0],y0=bb[1],nx=Math.ceil((bb[2]-x0)/h)+1,ny=Math.ceil((bb[3]-y0)/h)+1,v=new Float32Array(nx*ny),i,j;
  for(j=0;j<ny;j++)for(i=0;i<nx;i++)v[j*nx+i]=f(x0+i*h,y0+j*h);
  var P={},next={};
  function ep(id,ax,ay,va,bx,by,vb){if(!P[id]){var t=va/(va-vb);P[id]=[ax+(bx-ax)*t,ay+(by-ay)*t]}return id}
  function seg(a,b,cx,cy,cin){
    var A=P[a],B=P[b],cr=(B[0]-A[0])*(cy-A[1])-(B[1]-A[1])*(cx-A[0]);
    if((cr>0)===cin)next[a]=b;else next[b]=a;
  }
  for(j=0;j<ny-1;j++)for(i=0;i<nx-1;i++){
    var a=v[j*nx+i],b=v[j*nx+i+1],c=v[(j+1)*nx+i+1],e=v[(j+1)*nx+i];
    var X=x0+i*h,Y=y0+j*h,E=[];
    if((a<0)!==(b<0))E.push(ep('h'+i+'_'+j,X,Y,a,X+h,Y,b));
    if((b<0)!==(c<0))E.push(ep('v'+(i+1)+'_'+j,X+h,Y,b,X+h,Y+h,c));
    if((e<0)!==(c<0))E.push(ep('h'+i+'_'+(j+1),X,Y+h,e,X+h,Y+h,c));
    if((a<0)!==(e<0))E.push(ep('v'+i+'_'+j,X,Y,a,X,Y+h,e));
    if(E.length===2){
      var A0=P[E[0]],B0=P[E[1]],ca=(B0[0]-A0[0])*(Y-A0[1])-(B0[1]-A0[1])*(X-A0[0]);
      if(Math.abs(ca)>1e-12)seg(E[0],E[1],X,Y,a<0);else seg(E[0],E[1],X+h,Y+h,c<0);
    }
    else if(E.length===4){var ctr=(a+b+c+e)/4<0;// order: B R T L
      if((a<0)===ctr){seg(E[0],E[1],X+h,Y,b<0);seg(E[2],E[3],X,Y+h,e<0)}else{seg(E[3],E[0],X,Y,a<0);seg(E[1],E[2],X+h,Y+h,c<0)}}
  }
  var best=null,ba=0,seen={};
  Object.keys(next).forEach(function(s){
    if(seen[s])return;var loop=[],cur=s,guard=0;
    while(cur&&!seen[cur]&&guard++<100000){seen[cur]=1;loop.push(P[cur]);cur=next[cur]}
    var ar=0;for(var k=0;k<loop.length;k++){var p=loop[k],q=loop[(k+1)%loop.length];ar+=p[0]*q[1]-q[0]*p[1]}
    if(ar>ba){ba=ar;best=loop}
  });
  return best||[];
}
function resample(loop,ds,f){
  var L=[0],i;for(i=1;i<=loop.length;i++){var a=loop[i-1],b=loop[i%loop.length];L.push(L[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]))}
  var tot=L[L.length-1],n=Math.max(12,Math.round(tot/ds)),out=[],k=0;
  for(i=0;i<n;i++){var t=i/n*tot;while(L[k+1]<t)k++;var a2=loop[k],b2=loop[(k+1)%loop.length],u=(t-L[k])/((L[k+1]-L[k])||1);
    var x=a2[0]+(b2[0]-a2[0])*u,y=a2[1]+(b2[1]-a2[1])*u,e=1e-3,gx=f(x+e,y)-f(x-e,y),gy=f(x,y+e)-f(x,y-e),gl2=Math.hypot(gx,gy)||1;
    out.push([x,y,gx/gl2,gy/gl2])}
  return out;
}
function earcut(pts){
  var n=pts.length,V=[],tris=[],i;for(i=0;i<n;i++)V.push(i);
  var vi=0,miss=0;
  function cross(o,a,b){return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])}
  while(V.length>3){
    var m=V.length,i0=V[(vi+m-1)%m],i1=V[vi%m],i2=V[(vi+1)%m],A=pts[i0],B=pts[i1],C=pts[i2],ok=cross(A,B,C)>1e-10;
    if(ok&&miss<m){for(var j=0;j<m;j++){var q=V[j];if(q===i0||q===i1||q===i2)continue;var Pq=pts[q];
      if(cross(A,B,Pq)>=0&&cross(B,C,Pq)>=0&&cross(C,A,Pq)>=0){ok=false;break}}}
    if(ok||miss>=2*m){if(ok)tris.push(i0,i1,i2);V.splice(vi%m,1);miss=0}else{vi++;miss++}
  }
  if(V.length===3)tris.push(V[0],V[1],V[2]);
  return tris;
}
function plate(f,bb,z0,z1,bev,o){
  o=o||{};var x,y,b2=[1e9,1e9,-1e9,-1e9],st=.25;
  for(x=bb[0];x<=bb[2];x+=st)for(y=bb[1];y<=bb[3];y+=st)if(f(x,y)<st){if(x<b2[0])b2[0]=x;if(y<b2[1])b2[1]=y;if(x>b2[2])b2[2]=x;if(y>b2[3])b2[3]=y}
  bb=[b2[0]-.5,b2[1]-.5,b2[2]+.5,b2[3]+.5];
  var g=new Geo(),loop=resample(contour(f,bb,o.h||.1),o.ds||.2,f),n=loop.length,i,s=Math.SQRT1_2,zt=z1-bev;
  var Q=loop.map(function(p){return [p[0]-p[2]*bev,p[1]-p[3]*bev]});
  var T=earcut(Q);for(i=0;i<T.length;i+=3){var a=Q[T[i]],b=Q[T[i+1]],c=Q[T[i+2]];g.tri([a[0],a[1],z1,0,0,1,0],[b[0],b[1],z1,0,0,1,0],[c[0],c[1],z1,0,0,1,0])}
  for(i=0;i<n;i++){var A=loop[i],B=loop[(i+1)%n],qa=Q[i],qb=Q[(i+1)%n];
    g.quad([A[0],A[1],zt,A[2]*s,A[3]*s,s,2],[B[0],B[1],zt,B[2]*s,B[3]*s,s,2],[qb[0],qb[1],z1,B[2]*s,B[3]*s,s,2],[qa[0],qa[1],z1,A[2]*s,A[3]*s,s,2]);
    g.quad([A[0],A[1],z0,A[2],A[3],0,1],[B[0],B[1],z0,B[2],B[3],0,1],[B[0],B[1],zt,B[2],B[3],0,1],[A[0],A[1],zt,A[2],A[3],0,1])}
  return g;
}

/* =================== the calibre =================== */
var BAR=[-5.6,3.1],CEN=[0,0],THI=[3.4,-3.8],FOU=[7.5,-2.2],ESC=[8.6,-5.95],PAL=[6,-7.46],BAL=[2.5,-9.5],CRW=[-7.5,-2.4];
var RAT={bar:5.2,cenP:1.2,cen:4.2,thiP:.9,thi:3.6,fouP:.8,fou:3.3,escP:.6,ratchet:3.4,crownW:2.4};
var ZB=[3.75,4.55],ZC=[5.75,6.4];
var BRIDGES=[
  sd.sub(sd.u([sd.c(BAR[0],BAR[1],4.3),sd.cap(BAR[0],BAR[1],CRW[0],CRW[1],2.25),sd.cap(BAR[0],BAR[1],-10.6,7.2,1.15),sd.cap(CRW[0],CRW[1],-11.8,-4.4,1.05)],1.1),sd.c(0,0,4.75),.7),
  sd.u([sd.cap(0,0,THI[0],THI[1],1.15),sd.cap(THI[0],THI[1],FOU[0],FOU[1],1.1),sd.cap(0,0,1.6,6.6,1.0),sd.cap(FOU[0],FOU[1],11.9,.9,1.0),sd.c(0,0,1.45)],.95),
  sd.u([sd.cap(PAL[0],PAL[1],ESC[0],ESC[1],.82),sd.cap(ESC[0],ESC[1],12.3,-6.9,.95),sd.c(ESC[0],ESC[1],1.15)],.8)
];
var COCK=sd.u([sd.c(BAL[0],BAL[1],1.55),sd.cap(BAL[0],BAL[1],-3.7,-11.8,.95),sd.c(-3.7,-11.8,1.55)],1.2);
var SCREWS_B=[[-10.6,7.2],[-11.8,-4.4],[1.6,6.6],[11.9,.9],[12.3,-6.9],[-8.7,4.3]],SCREW_C=[[-3.7,-11.8]];
var JEWELS_B=[CEN,THI,FOU,ESC,PAL];

function buildCalibre(){
  var parts=[],g,i;
  function part(geo,mat,layer,o){o=o||{};parts.push({geo:geo,mat:mat,layer:layer,px:o.at?o.at[0]:0,py:o.at?o.at[1]:0,pz:o.pz||0,spin:o.spin||null,axis:o.axis||'z',tex:o.tex||0,dyn:o.dyn||0,anchor:o.anchor});}
  // mainplate
  part(ring(new Geo(),circ(15),0,0,1.2,220,{flat:false,bev:.22}),'plate',0,{tex:1});
  // winding stem + crown, along the x axis at 9 o'clock
  g=new Geo();var stem=cyl(.32,-16.4,-10.2,20,{kt:2});rotX(stem);g.add(stem,0,0,0);part(g,'steel',0,{pz:.7});
  var crown=ring(new Geo(),tooth(1.0,22,.5,.6),0,-.7,.7,22*8,{kt:2});rotX(crown);part(crown,'gold',0,{at:[-17.3,0],pz:.7,spin:'crown',axis:'x'});
  // barrel
  g=new Geo();ring(g,tooth(RAT.bar,80),4.35,1.3,3.0,80*10,{});ring(g,circ(4.37),.5,2.6,2.92,90,{flat:false,kw:2});part(g,'gold',1,{at:BAR,spin:'bar'});
  // centre, third, fourth, escape
  part(wheel(RAT.cen,72,{ri:3.55,hub:.95,hole:.18,z0:2.0,z1:2.3,sp:4,sw:.44,sa:.3}),'gold',1,{at:CEN,spin:'cen'});
  part(ring(new Geo(),tooth(RAT.cenP,12,.9,1),0,1.2,2.0,12*10,{}),'steel',1,{at:CEN,spin:'cen'});
  part(wheel(RAT.thi,70,{ri:2.98,hub:.72,hole:.14,z0:2.55,z1:2.85,sp:4,sw:.36,sa:.1}),'gold',1,{at:THI,spin:'thi'});
  part(ring(new Geo(),tooth(RAT.thiP,10,.9,1),0,1.2,2.55,10*10,{}),'steel',1,{at:THI,spin:'thi'});
  part(wheel(RAT.fou,68,{ri:2.72,hub:.66,hole:.13,z0:3.05,z1:3.35,sp:5,sw:.3,sa:.5}),'gold',1,{at:FOU,spin:'fou'});
  part(ring(new Geo(),tooth(RAT.fouP,10,.9,1),0,1.2,3.05,10*10,{}),'steel',1,{at:FOU,spin:'fou'});
  part(wheel(2.3,15,{prof:clubTooth(2.3,15),ri:1.5,hub:.46,hole:.1,z0:2.3,z1:2.5,sp:4,sw:.22,res:40,sa:.2}),'steel',1,{at:ESC,spin:'esc'});
  part(ring(new Geo(),tooth(RAT.escP,8,.9,1),0,1.2,2.3,8*10,{}),'steel',1,{at:ESC,spin:'esc'});
  // pallet fork, built around its own pivot
  var pe=function(x,y){return [x-PAL[0],y-PAL[1]]};
  var e1=pe(6.33,-5.75),e2=pe(7.72,-8.1),lv=pe(3.4,-9.0);
  var fork=sd.u([sd.c(0,0,.48),sd.cap(0,0,e1[0],e1[1],.26),sd.cap(0,0,e2[0],e2[1],.26),sd.cap(0,0,lv[0],lv[1],.17),sd.c(lv[0],lv[1],.32)],.35);
  part(plate(fork,[-3.5,-2.6,2.6,2.6],2.35,2.6,.06,{h:.04,ds:.07}),'steel',1,{at:PAL,spin:'pal'});
  g=new Geo();box(g,e1[0],e1[1],1.1,.42,.2,2.3,2.72,4);box(g,e2[0],e2[1],-.4,.42,.2,2.3,2.72,4);part(g,'ruby',1,{at:PAL,spin:'pal'});
  // bridges
  var bb=[-16,-15,15,15];
  BRIDGES.forEach(function(f,k){part(plate(f,bb,ZB[0],ZB[1],.17),'bridge',2,{tex:k===0?1:0})});
  // jewels + screws on the bridges
  var jc=new Geo(),jr=new Geo(),sc=new Geo(),J=jewel(.62);
  JEWELS_B.forEach(function(p){jc.add(J.chaton,p[0],p[1],ZB[1]);jr.add(J.ruby,p[0],p[1],ZB[1])});
  SCREWS_B.forEach(function(p,k){sc.add(screw(.46),p[0],p[1],ZB[1],k*1.37)});
  part(jc,'chaton',2);part(jr,'ruby',2);part(sc,'blued',2);
  // ratchet + crown wheel on the barrel bridge
  g=ring(new Geo(),sawTooth(RAT.ratchet,60),0,ZB[1],ZB[1]+.36,60*8,{});g.add(screw(.85),0,0,ZB[1]+.36,.6);
  part(g,'snail',2,{at:BAR,spin:'ratchet'});
  g=ring(new Geo(),tooth(RAT.crownW,36),.55,ZB[1],ZB[1]+.32,36*10,{});g.add(screw(.5),0,0,ZB[1]+.32,0);
  part(g,'snail',2,{at:CRW,spin:'crownw'});
  // balance: rim, arms, timing screws, roller, staff
  g=new Geo();ring(g,circ(3.82),3.32,4.7,5.12,128,{flat:false,kw:2});ring(g,circ(.5),.12,4.7,5.12,24,{flat:false,kw:2});spokes(g,3,.46,3.34,.34,4.7,5.116,PI/6);
  for(i=0;i<18;i++){var a=i/18*TAU;box(g,Math.cos(a)*4.0,Math.sin(a)*4.0,a,.42,.22,4.76,5.06,2)}
  ring(g,circ(.72),0,4.2,4.33,32,{flat:false,kw:2});var ip=cyl(.09,4.0,4.2,10);g.add(ip,0,.52,0);
  part(g,'balance',3,{at:BAL,spin:'bal',anchor:[-3.8,0,5.12]});
  part(cyl(.15,3.9,5.9,16,{kt:2}),'steel',3,{at:BAL,spin:'bal'});
  // hairspring (rebuilt every frame)
  parts.push({geo:null,mat:'spring',layer:3,px:BAL[0],py:BAL[1],pz:0,spin:null,axis:'z',tex:0,dyn:1});
  // balance cock with its jewel, screw and regulator
  part(plate(COCK,[-6,-14.5,5,-6.5],ZC[0],ZC[1],.16),'bridge',4);
  g=new Geo();g.add(J.chaton,BAL[0],BAL[1],ZC[1]);part(g,'chaton',4);
  g=new Geo();g.add(J.ruby,BAL[0],BAL[1],ZC[1]);part(g,'ruby',4);
  g=new Geo();SCREW_C.forEach(function(p){g.add(screw(.5),p[0],p[1],ZC[1],.4)});part(g,'blued',4);
  g=new Geo();box(g,BAL[0]+1.25,BAL[1]-.55,-.42,2.6,.16,ZC[1],ZC[1]+.07,0);box(g,BAL[0]-1.0,BAL[1]+.45,-.42,1.0,.14,ZC[1],ZC[1]+.07,0);part(g,'steel',4);
  // rotor: a skeletal rose-gold arc on one arm, built around the centre
  var rotorF=sd.u([sd.c(0,0,2.2),sd.cap(0,0,12.6,0,.95),function(x,y){var r=Math.hypot(x,y),a=Math.abs(Math.atan2(y,x)),H=1.38;if(a<=H)return Math.abs(r-13.5)-1.05;return Math.hypot(Math.abs(x)*0+x-13.5*Math.cos(H),Math.abs(y)-13.5*Math.sin(H))-1.05}],.9);
  g=plate(rotorF,[-3,-15,15.2,15],7.0,7.5,.18,{h:.08,ds:.16});
  ring(g,circ(1.65),.9,7.5,7.62,48,{flat:false,kw:2,kt:3});
  [0,2.1,4.2].forEach(function(a,k){g.add(screw(.3),Math.cos(a)*1.25,Math.sin(a)*1.25,7.62,k)});
  part(g,'rose',5,{spin:'rotor',tex:2});
  g=new Geo();g.add(screw(.62),0,0,7.62,.2);part(g,'blued',5,{spin:'rotor'});
  return parts;
}
function rotX(g){for(var i=0;i<g.p.length;i+=3){var y=g.p[i+1],z=g.p[i+2],x=g.p[i];g.p[i]=z;g.p[i+1]=y;g.p[i+2]=-x;var nx=g.n[i],nz=g.n[i+2];g.n[i]=nz;g.n[i+2]=-nx}return g}

/* hairspring geometry */
var HS={turns:10,seg:36,r0:.62,r1:2.95,z:5.42,wd:.06,ht:.16};
HS.n=HS.turns*HS.seg;HS.verts=HS.n*12;HS.pos=new Float32Array(HS.verts*3);HS.nrm=new Float32Array(HS.verts*3);HS.k=new Float32Array(HS.verts);
function springFill(theta){
  var P=HS.pos,N=HS.nrm,K=HS.k,o=0,i;
  function put(x,y,z,nx,ny,nz,k){P[o*3]=x;P[o*3+1]=y;P[o*3+2]=z;N[o*3]=nx;N[o*3+1]=ny;N[o*3+2]=nz;K[o]=k;o++}
  var prev=null;
  for(i=0;i<=HS.n;i++){
    var t=i/HS.n,r=HS.r0+(HS.r1-HS.r0)*t,a=.4+HS.turns*TAU*t+theta*(1-t),c=Math.cos(a),s=Math.sin(a);
    var cur={ix:c*(r-HS.wd/2),iy:s*(r-HS.wd/2),ox:c*(r+HS.wd/2),oy:s*(r+HS.wd/2),c:c,s:s};
    if(prev){
      var z1=HS.z,z0=HS.z-HS.ht;
      put(prev.ix,prev.iy,z1,0,0,1,2);put(prev.ox,prev.oy,z1,0,0,1,2);put(cur.ox,cur.oy,z1,0,0,1,2);
      put(prev.ix,prev.iy,z1,0,0,1,2);put(cur.ox,cur.oy,z1,0,0,1,2);put(cur.ix,cur.iy,z1,0,0,1,2);
      put(prev.ox,prev.oy,z0,prev.c,prev.s,0,1);put(cur.ox,cur.oy,z0,cur.c,cur.s,0,1);put(cur.ox,cur.oy,z1,cur.c,cur.s,0,1);
      put(prev.ox,prev.oy,z0,prev.c,prev.s,0,1);put(cur.ox,cur.oy,z1,cur.c,cur.s,0,1);put(prev.ox,prev.oy,z1,prev.c,prev.s,0,1);
    }
    prev=cur;
  }
}

/* =================== GL plumbing =================== */
function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
function prog(vs,fs){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));
  gl.bindAttribLocation(p,0,'a_pos');gl.bindAttribLocation(p,1,'a_nrm');gl.bindAttribLocation(p,2,'a_k');gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  var u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(var i=0;i<n;i++){var inf=gl.getActiveUniform(p,i);u[inf.name.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,inf.name)}
  return {p:p,u:u}}
function upload(geo,dyn){
  var vao=gl.createVertexArray();gl.bindVertexArray(vao);var bufs=[];
  [[geo.p,3],[geo.n,3],[geo.k,1]].forEach(function(a,i){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,a[0] instanceof Float32Array?a[0]:new Float32Array(a[0]),dyn?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,a[1],gl.FLOAT,false,0,0);bufs.push(b)});
  gl.bindVertexArray(null);return {vao:vao,count:geo.p.length/3,bufs:bufs}}

var VS='#version 300 es\nlayout(location=0) in vec3 a_pos;layout(location=1) in vec3 a_nrm;layout(location=2) in float a_k;\n'+
'uniform mat4 u_m,u_vp,u_lvp;out vec3 v_w;out vec3 v_n;out vec3 v_l;out float v_k;out vec4 v_s;\n'+
'void main(){vec4 wp=u_m*vec4(a_pos,1.);v_w=wp.xyz;v_n=mat3(u_m)*a_nrm;v_l=a_pos;v_k=a_k;v_s=u_lvp*wp;gl_Position=u_vp*wp;}';
var FS='#version 300 es\nprecision highp float;precision highp sampler2DShadow;\n'+
'in vec3 v_w;in vec3 v_n;in vec3 v_l;in float v_k;in vec4 v_s;\n'+
'uniform mat4 u_m;uniform vec3 u_eye,u_ld,u_f0;uniform float u_rough,u_dim,u_alpha,u_exp,u_txOn,u_hl;uniform int u_fin,u_type;uniform float u_lq;\n'+
'uniform sampler2DShadow u_sh;uniform sampler2D u_tx;uniform vec4 u_txr;out vec4 o;\n'+
'const float PI=3.14159265;\n'+
'vec3 envL(vec3 R,float r){float wd=.05+r*.75;\n'+
' float sky=max(R.z,0.)*.34+.05;\n'+
' float top=smoothstep(.8-wd,.93+wd*.1,dot(R,normalize(vec3(-.55,.62,1.))));\n'+
' float s1=(1.-smoothstep(0.,.06+wd*.55,abs(dot(R,normalize(vec3(.93,.37,0.))))))*smoothstep(-.1,.5,R.z);\n'+
' float s2=(1.-smoothstep(0.,.05+wd*.55,abs(dot(R,normalize(vec3(-.62,.78,0.))))))*smoothstep(.05,.65,R.z);\n'+
' float low=smoothstep(.35,-.1,R.z);\n'+
' return vec3(1.,.95,.88)*sky+vec3(1.,.94,.84)*top*1.9+vec3(.86,.9,1.)*s1*.95+vec3(1.,.84,.62)*s2*.7+vec3(.1,.075,.05)*low;}\n'+
'float shadowF(){vec3 p=v_s.xyz/v_s.w*.5+.5;if(p.z>1.||p.x<0.||p.x>1.||p.y<0.||p.y>1.)return 1.;vec2 ts=1./vec2(textureSize(u_sh,0));float s=0.;if(u_lq>.5)return texture(u_sh,vec3(p.xy,p.z-.0009));\n'+
' for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)s+=texture(u_sh,vec3(p.xy+vec2(float(x),float(y))*ts*1.3,p.z-.0009));return s/9.;}\n'+
'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
'void main(){\n'+
' mat3 nm=mat3(u_m);vec3 N=normalize(v_n);vec3 V=normalize(u_eye-v_w);vec3 f0=u_f0;float rough=u_rough,aniso=0.,cav=1.;vec3 T=normalize(nm*vec3(1.,0.,0.));\n'+
' vec2 p=v_l.xy;float kd=v_k;\n'+
' if(kd<.5){\n'+
'  if(u_fin==1){vec2 D=normalize(vec2(1.,-.42));vec2 Pp=vec2(-D.y,D.x);float s=dot(p,Pp)/1.08;float f=fract(s)-.5;\n'+
'   N=normalize(nm*normalize(vec3(Pp*f*.5,1.)));T=normalize(nm*vec3(D,0.));aniso=.8;rough=.24;cav=.9+.1*smoothstep(.5,.42,abs(f));\n'+
'   rough+=.05*hash(floor(vec2(dot(p,D)*40.,s*3.)));}\n'+
'  else if(u_fin==2){float sp=.56;vec2 g=floor(p/sp);vec2 bq=vec2(9.);float bo=-1e9;\n'+
'   for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 cc=g+vec2(float(i),float(j));vec2 q=p-(cc+.5)*sp;float od=cc.y*997.+cc.x;if(length(q)<sp*.8&&od>bo){bo=od;bq=q;}}\n'+
'   float r=length(bq);vec2 tg=r>1e-4?vec2(-bq.y,bq.x)/r:vec2(1.,0.);N=normalize(nm*normalize(vec3(-bq*.1,1.)));T=normalize(nm*vec3(tg,0.));aniso=.9;rough=.28;\n'+
'   cav=.9+.1*smoothstep(sp*.8,sp*.6,r);}\n'+
'  else if(u_fin==3||u_fin==4){float r=length(p);vec2 tg=r>1e-4?vec2(-p.y,p.x)/r:vec2(1.,0.);T=normalize(nm*vec3(tg,0.));aniso=u_fin==3?.75:.9;\n'+
'   if(u_fin==4){float a=atan(p.y,p.x);cav=.82+.18*sin(r*34.+a*1.);}}\n'+
' }else if(kd<1.5){rough=max(.1,rough*.55);}\n'+
' else if(kd<2.5){rough=.04;}\n'+
' else if(kd<3.5){cav=.12;}\n'+
' else{rough=.03;}\n'+
' if(u_txOn>.5&&kd<.5){vec2 uv=(p-u_txr.xy)/u_txr.zw;float m=texture(u_tx,uv).r;\n'+
'  vec3 fill=u_fin==2?vec3(1.,.8,.45):f0*.32;f0=mix(f0,fill,m);rough=mix(rough,u_fin==2?.18:.5,m);aniso*=1.-m;cav=mix(cav,u_fin==2?1.:.7,m);}\n'+
' if(u_type==2){f0=mix(vec3(.07,.16,.66),vec3(.38,.12,.6),pow(1.-max(dot(N,V),0.),1.4));}\n'+
' vec3 L=normalize(u_ld);vec3 H=normalize(L+V);\n'+
' vec3 B=normalize(cross(N,T));T=normalize(cross(B,N));\n'+
' float NoL=max(dot(N,L),0.),NoV=max(dot(N,V),1e-3),NoH=max(dot(N,H),0.),VoH=max(dot(V,H),0.);\n'+
' float a=max(rough*rough,.0015),at=max(a*(1.-aniso*.8),.0012),ab=max(a*(1.+aniso*3.),.0012);\n'+
' float ToH=dot(T,H),BoH=dot(B,H);float dd=ToH*ToH/(at*at)+BoH*BoH/(ab*ab)+NoH*NoH;float D=1./(PI*at*ab*dd*dd);\n'+
' float a2=a*a;float Vis=.5/max(NoL*sqrt(NoV*NoV*(1.-a2)+a2)+NoV*sqrt(NoL*NoL*(1.-a2)+a2),1e-4);\n'+
' vec3 F=f0+(1.-f0)*pow(1.-VoH,5.);\n'+
' vec3 S=B;vec3 at2=cross(S,V);vec3 an=cross(at2,S);vec3 bent=normalize(mix(N,an,aniso*.7));vec3 R=reflect(-V,bent);\n'+
' vec3 Fe=f0+(max(vec3(1.-rough),f0)-f0)*pow(1.-NoV,5.);\n'+
' float shd=shadowF();vec3 lc=vec3(1.,.95,.86)*3.2;\n'+
' vec3 col;\n'+
' if(u_type==1){vec3 base=vec3(.5,.012,.03);col=base*(NoL*.9*shd+.08)*1.4+vec3(.95,.05,.08)*pow(1.-NoV,1.2)*.22+vec3(.9,.04,.06)*.05;\n'+
'  vec3 Fd=vec3(.07)+.93*pow(1.-NoV,5.);col+=Fd*envL(R,.04)*.9+D*Vis*NoL*lc*.08*shd;}\n'+
' else{col=D*Vis*F*NoL*lc*shd+Fe*envL(R,rough)*mix(.4,1.,shd);\n'+
'  vec3 L2=normalize(vec3(.72,-.46,.52));vec3 H2=normalize(L2+V);float NoL2=max(dot(N,L2),0.),NoH2=max(dot(N,H2),0.),VoH2=max(dot(V,H2),0.);\n'+
'  float To2=dot(T,H2),Bo2=dot(B,H2);float dd2=To2*To2/(at*at)+Bo2*Bo2/(ab*ab)+NoH2*NoH2;float D2=1./(PI*at*ab*dd2*dd2);\n'+
'  float Vs2=.5/max(NoL2*sqrt(NoV*NoV*(1.-a2)+a2)+NoV*sqrt(NoL2*NoL2*(1.-a2)+a2),1e-4);vec3 F2=f0+(1.-f0)*pow(1.-VoH2,5.);\n'+
'  col+=D2*Vs2*F2*NoL2*vec3(.6,.72,1.)*1.25*mix(.55,1.,shd);\n'+
'  col+=f0*(.012+.03*max(N.z,0.))*mix(.6,1.,shd);}\n'+
' col*=cav;\n'+
' col+=vec3(1.,.82,.55)*pow(1.-NoV,4.)*u_hl*.18;\n'+
' col*=u_exp;col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);col=pow(clamp(col,0.,1.),vec3(1./2.2));\n'+
' float lum=dot(col,vec3(.3,.59,.11));col=mix(col,vec3(lum)*.85,u_dim*.55);col*=mix(1.,.26,u_dim);\n'+
' o=vec4(col*u_alpha,u_alpha);}';
var VS_D='#version 300 es\nlayout(location=0) in vec3 a_pos;uniform mat4 u_m,u_lvp;void main(){gl_Position=u_lvp*u_m*vec4(a_pos,1.);}';
var FS_D='#version 300 es\nprecision mediump float;void main(){}';

var P,PD,parts,shTex,shFbo,SHN=fine?2048:1024,tex=[null,null,null];
var MAT={
  plate:{f0:[.2,.205,.22],rough:.32,fin:2,type:0},
  gold:{f0:[1.0,.72,.33],rough:.3,fin:3,type:0},
  balance:{f0:[.98,.7,.42],rough:.24,fin:3,type:0},
  bridge:{f0:[.9,.84,.7],rough:.26,fin:1,type:0},
  steel:{f0:[.62,.63,.66],rough:.16,fin:3,type:0},
  snail:{f0:[.68,.69,.72],rough:.22,fin:4,type:0},
  ruby:{f0:[.07,.07,.07],rough:.04,fin:0,type:1},
  blued:{f0:[.1,.2,.6],rough:.14,fin:0,type:2},
  rose:{f0:[.98,.66,.55],rough:.26,fin:3,type:0},
  chaton:{f0:[1.0,.78,.42],rough:.08,fin:0,type:0},
  spring:{f0:[.7,.72,.78],rough:.12,fin:0,type:0}
};
var springMesh;
try{
  P=prog(VS,FS);PD=prog(VS_D,FS_D);
  parts=buildCalibre();
  parts.forEach(function(pt){
    if(pt.dyn){springFill(0);pt.mesh=upload({p:HS.pos,n:HS.nrm,k:HS.k},true);springMesh=pt.mesh}
    else{pt.mesh=upload(pt.geo,false);pt.geo=null}
  });
  shTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shTex);
  gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,SHN,SHN);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
  shFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shTex,0);
  gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}catch(err){if(w.console)console.warn('Movement unavailable:',err);html.classList.remove('has-gl');html.classList.add('no-gl');section.classList.add('flow');return}

/* ---------- engravings (drawn to canvas, filled with gold in the shader) ---------- */
var TXR=[null,[-16,-16,32,32],[-16,-16,32,32]];
function arcText(ctx,S,txt,r,mid,size,inward,track){
  var k=S/32;ctx.font='600 '+Math.round(size*k)+'px "Instrument Sans","Helvetica Neue",Arial,sans-serif';
  var widths=txt.split('').map(function(ch){return ctx.measureText(ch).width+track*k}),tot=widths.reduce(function(a,b){return a+b},0)-track*k;
  var ang=mid-(tot/2)/(r*k)*(inward?1:-1);
  for(var i=0;i<txt.length;i++){
    var half=widths[i]/2/(r*k);ang+=inward?half:-half;
    var x=Math.cos(ang)*r,y=Math.sin(ang)*r,X=(x+16)*k,Y=(16-y)*k;
    ctx.save();ctx.translate(X,Y);ctx.rotate(inward?Math.atan2(-Math.cos(ang),-Math.sin(ang)):Math.atan2(Math.cos(ang),Math.sin(ang)));
    ctx.fillText(txt[i],0,0);ctx.restore();ang+=inward?half:-half;
  }
}
function makeTex(draw){
  var S=fine?2048:1024,cv=d.createElement('canvas');cv.width=cv.height=S;var ctx=cv.getContext('2d');
  ctx.fillStyle='#000';ctx.fillRect(0,0,S,S);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';draw(ctx,S);
  var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,gl.RED,gl.UNSIGNED_BYTE,cv);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  var ext=gl.getExtension('EXT_texture_filter_anisotropic');if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,8);
  return t;
}
function buildTextures(){
  tex[1]=makeTex(function(ctx,S){
    arcText(ctx,S,'BTC GROUP',13.95,PI*.66,.62,false,.32);
    arcText(ctx,S,'CAIRO',13.95,PI*.49,.62,false,.32);
    arcText(ctx,S,'SINCE 1935',13.95,PI*.31,.62,false,.32);
    arcText(ctx,S,'WATCHES & JEWELRY',13.95,PI*1.5,.5,true,.24);
    arcText(ctx,S,'BTC',5.3,PI*1.25,.7,true,.1);
  });
  tex[2]=makeTex(function(ctx,S){arcText(ctx,S,'BTC GROUP',13.45,0,.9,true,.36)});
  dirty=true;
}

/* =================== matrices =================== */
function M4(){var m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m}
function mul(a,b){var r=new Float32Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];r[i*4+j]=s}return r}
function persp(fy,as,n,f,sx,sy){var t=1/Math.tan(fy/2),m=new Float32Array(16);m[0]=t/as;m[5]=t;m[8]=-sx;m[9]=-sy;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m}
function ortho(l,r,b,t,n,f){var m=M4();m[0]=2/(r-l);m[5]=2/(t-b);m[10]=-2/(f-n);m[12]=-(r+l)/(r-l);m[13]=-(t+b)/(t-b);m[14]=-(f+n)/(f-n);return m}
function view(eye,rt,up,fw){var m=M4();m[0]=rt[0];m[4]=rt[1];m[8]=rt[2];m[1]=up[0];m[5]=up[1];m[9]=up[2];m[2]=-fw[0];m[6]=-fw[1];m[10]=-fw[2];
  m[12]=-(rt[0]*eye[0]+rt[1]*eye[1]+rt[2]*eye[2]);m[13]=-(up[0]*eye[0]+up[1]*eye[1]+up[2]*eye[2]);m[14]=(fw[0]*eye[0]+fw[1]*eye[1]+fw[2]*eye[2]);return m}
function norm(v){var l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function lookAt(eye,tgt){var f=norm([tgt[0]-eye[0],tgt[1]-eye[1],tgt[2]-eye[2]]),up0=Math.abs(f[2])>.999?[0,1,0]:[0,0,1],r=norm(cross(f,up0)),u=cross(r,f);return view(eye,r,u,f)}
function model(px,py,pz,a,axis){var m=M4(),c=Math.cos(a),s=Math.sin(a);
  if(axis==='x'){m[5]=c;m[6]=s;m[9]=-s;m[10]=c}else{m[0]=c;m[1]=s;m[4]=-s;m[5]=c}
  m[12]=px;m[13]=py;m[14]=pz;return m}

/* =================== scroll choreography =================== */
var LAYER=[0,5.5,11,15.2,19,25];
function K(p,ex,el,az,zm,t,dims,hl){return {p:p,ex:ex,el:el,az:az,zm:zm,t:t,dims:dims,hl:hl||[0,0,0,0,0,0]}}
var Z=[0,0,0,0,0,0],DIM=.82;
var KEYS=[
  K(0,   0,  60,-16,1,   [0,0,3],Z),
  K(.08, 0,  56,-20,1.02,[0,0,3],Z),
  K(.19,.6,  30,-30,1.0, [0,0,9.5],[0,DIM,DIM,DIM,DIM,.9],[1,0,0,0,0,0]),
  K(.29,.64, 27,-38,1.04,[0,0,9.5],[0,DIM,DIM,DIM,DIM,.9],[1,0,0,0,0,0]),
  K(.39,.86, 34,-46,1.28,[2.4,-1.6,7.6],[DIM,0,DIM,DIM,DIM,1],[0,1,0,0,0,0]),
  K(.49,.88, 32,-56,1.36,[2.4,-1.6,7.6],[DIM,0,DIM,DIM,DIM,1],[0,1,0,0,0,0]),
  K(.59,.86, 40, 16,1.2, [0,0,12.5],[DIM,DIM,0,DIM,DIM,1],[0,0,1,0,0,0]),
  K(.69,.86, 38, 26,1.24,[0,0,12.5],[DIM,DIM,0,DIM,DIM,1],[0,0,1,0,0,0]),
  K(.79,.66, 38,-14,1.7, [2.2,-9.5,14.2],[.9,.9,.9,0,0,1],[0,0,0,1,1,0]),
  K(.89,.66, 36, -6,1.82,[2.2,-9.5,14.2],[.9,.9,.9,0,0,1],[0,0,0,1,1,0]),
  K(1,   0,  78,  0,.98, [0,0,3],Z)
];
function sample(p){
  var i=0;while(i<KEYS.length-2&&p>KEYS[i+1].p)i++;
  var a=KEYS[i],b=KEYS[i+1],t=smooth((p-a.p)/(b.p-a.p));
  var o={ex:lerp(a.ex,b.ex,t),el:lerp(a.el,b.el,t),az:lerp(a.az,b.az,t),zm:lerp(a.zm,b.zm,t),t:[lerp(a.t[0],b.t[0],t),lerp(a.t[1],b.t[1],t),lerp(a.t[2],b.t[2],t)],dims:[],hl:[]};
  for(var k=0;k<6;k++){o.dims.push(lerp(a.dims[k],b.dims[k],t));o.hl.push(lerp(a.hl[k],b.hl[k],t))}
  return o;
}

/* =================== live state =================== */
var S={p:0,pv:0,ptr:[0,0],ptrT:[0,0],rot:{a:-PI/2+.6,v:0},wind:0,beat:-1,intro:1,introOn:false,t0:0,lastY:w.scrollY,visible:true,azNow:-16};
var dirty=true,W=1,H=1,dpr=1,mobile=false,Q=1,stW=1,stH=1,fr=0,acc=0,nAcc=0,calm=0,shT=0;
var chapters=Array.prototype.slice.call(section.querySelectorAll('[data-ch]'));
var rail=Array.prototype.slice.call(section.querySelectorAll('[data-go]'));
var callout=section.querySelector('.mv-callout'),cDot=callout&&callout.querySelector('.mv-c-dot'),cLine=callout&&callout.querySelector('polyline'),cLab=callout&&callout.querySelector('.mv-c-lab');
var ANCH=[[-9.9,-9.9,1.2,0,'Mainplate'],[THI[0]+2.6,THI[1]-1.6,2.85,1,'Gear train'],[FOU[0]+1.2,FOU[1]+.5,ZB[1],2,'Bridges'],[BAL[0]-3.6,BAL[1]+.6,5.12,3,'Balance wheel']];

function resize(){
  var r=stage.getBoundingClientRect();mobile=r.width<760;
  stW=r.width;stH=r.height;dpr=Math.min(w.devicePixelRatio||1,mobile?2:2)*Q;
  var px=r.width*r.height*dpr*dpr,cap=mobile?1.8e6:2.8e6;if(px>cap)dpr*=Math.sqrt(cap/px);
  W=Math.max(1,Math.round(r.width*dpr));H=Math.max(1,Math.round(r.height*dpr));
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
  dirty=true;
}
function progress(){
  if(reduce)return 0;
  var r=section.getBoundingClientRect(),span=r.height-w.innerHeight;
  return span>0?clamp(-r.top/span,0,1):0;
}

/* =================== frame =================== */
var lastT=0,VPm=null,beatN=-1;function t0f(n){return n/1000}
function frame(now){
  requestAnimationFrame(frame);
  var t=now/1000,dt=lastT?Math.min(.05,t-lastT):.016;lastT=t;
  if(!S.visible||d.hidden)return;
  if(reduce&&!dirty)return;
  // on-demand: only draw while the page is being moved (scroll, swipe, pointer, intro, rotor swing)
  var y=w.scrollY,dy=y-S.lastY;S.lastY=y;
  var pT=w.BTCMovement&&w.BTCMovement.force!=null?w.BTCMovement.force:progress();
  var moving=dirty||dy!==0||pT!==S.p;
  dirty=false;
  if(moving)S.actUntil=now+90;
  if(now>(S.actUntil||0))return;
  S.vt=(S.vt||0)+dt;t=S.vt;
S.p=pT;
  S.ptr[0]+=(S.ptrT[0]-S.ptr[0])*(1-Math.pow(.02,dt));S.ptr[1]+=(S.ptrT[1]-S.ptr[1])*(1-Math.pow(.02,dt));

  var k=sample(S.p);
  // intro assembly
  var intro=S.intro;
  if(S.introOn&&!reduce){intro=S.intro=clamp((now-S.t0)/2300,0,1)}

  // escapement: 3 Hz balance, 6 beats a second
  var f=3,amp=reduce?0:3.85,tb=reduce?0:S.p*40;
  var theta=amp*Math.sin(TAU*f*tb);
  var beats=reduce?0:Math.floor(tb*2*f),since=tb-beats/(2*f),step=beats+eBack(since/.035);
  if(beats!==beatN&&!reduce){beatN=beats;if(S.visible&&intro>.95)w.dispatchEvent(new CustomEvent('btc:beat',{detail:beats}))}
  var E=-step*TAU/30,pal=((beats%2)?1:-1)*.11*eOut(since/.02)+((beats%2)?-1:1)*.11*(1-eOut(since/.02));
  var fou=-E*RAT.escP/RAT.fou,thi=-fou*RAT.fouP/RAT.thi,cen=-thi*RAT.thiP/RAT.cen,bar=-cen*RAT.cenP/RAT.bar;
  S.rot.a=-PI/2+.6+S.p*TAU*2.5;S.wind=S.p*34;
  var ang={bal:theta,esc:E,fou:fou,thi:thi,cen:cen,bar:bar,pal:pal,rotor:S.rot.a,ratchet:S.wind,crownw:-S.wind*RAT.ratchet/RAT.crownW,crown:S.wind*3.2};

  // camera
  var asp=W/H,fov=26*PI/180,th=Math.tan(fov/2);
  var ry=mobile?Math.min(.88*asp,.6):.8,sx=mobile?0:.4,sy=mobile?.4:0;
  if(mobile&&S.p>.1&&S.p<.95)sy=lerp(.4,.42,smooth((S.p-.1)/.06));
  var D=16.5/(th*ry)/k.zm;
  var el=(k.el+S.ptr[1]*5)*PI/180,az=(k.az+S.ptr[0]*7)*PI/180;S.azNow=k.az+S.ptr[0]*7;
  var h=[Math.sin(az),-Math.cos(az),0],eye=[k.t[0]+D*(Math.cos(el)*h[0]),k.t[1]+D*(Math.cos(el)*h[1]),k.t[2]+D*Math.sin(el)];
  var rt=[Math.cos(az),Math.sin(az),0],fw=norm([k.t[0]-eye[0],k.t[1]-eye[1],k.t[2]-eye[2]]),up=cross(rt,fw);
  var V=view(eye,rt,up,fw),Pm=persp(fov,asp,D*.25,D*2.4+60,sx,sy);VPm=mul(Pm,V);
  // light follows the pointer
  var lx=S.ptr[0]*1.2-.55,ly=S.ptr[1]*1.1+.85,ld=norm([rt[0]*lx+up[0]*ly-fw[0]*.9,rt[1]*lx+up[1]*ly-fw[1]*.9,rt[2]*lx+up[2]*ly-fw[2]*.9]);
  if(ld[2]<.35){ld[2]=.35;ld=norm(ld)}
  var lc=[0,0,11],le=[lc[0]+ld[0]*70,lc[1]+ld[1]*70,lc[2]+ld[2]*70],LVP=mul(ortho(-30,30,-30,30,10,150),lookAt(le,lc));

  // per-part transforms
  var Ms=parts.map(function(pt,i){
    var L=pt.layer,ex=k.ex*LAYER[L],ia=1;
    if(intro<1){var li=clamp((intro*1.35-L*.07),0,1),e=eOut(li);ex+=(1-e)*(10+L*7);ia=e}
    pt._a=ia*(1-clamp((k.dims[L]-.9)/.1,0,1)*.9);
    var a=pt.spin?ang[pt.spin]||0:0;if(intro<1&&pt.spin&&pt.spin!=='rotor')a+=(1-eOut(intro))*2.2;
    return model(pt.px,pt.py,pt.pz+ex,a,pt.axis);
  });
  if(springMesh){springFill(theta);gl.bindBuffer(gl.ARRAY_BUFFER,springMesh.bufs[0]);gl.bufferSubData(gl.ARRAY_BUFFER,0,HS.pos);gl.bindBuffer(gl.ARRAY_BUFFER,springMesh.bufs[1]);gl.bufferSubData(gl.ARRAY_BUFFER,0,HS.nrm)}

  // shadow pass
  {gl.bindFramebuffer(gl.FRAMEBUFFER,shFbo);gl.viewport(0,0,SHN,SHN);gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,3);
  gl.useProgram(PD.p);gl.uniformMatrix4fv(PD.u.u_lvp,false,LVP);
  parts.forEach(function(pt,i){if(pt._a<.6)return;gl.uniformMatrix4fv(PD.u.u_m,false,Ms[i]);gl.bindVertexArray(pt.mesh.vao);gl.drawArrays(gl.TRIANGLES,0,pt.mesh.count)});
  gl.disable(gl.POLYGON_OFFSET_FILL);}
  // main pass
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(P.p);var u=P.u;
  gl.uniformMatrix4fv(u.u_vp,false,VPm);gl.uniformMatrix4fv(u.u_lvp,false,LVP);gl.uniform3fv(u.u_eye,eye);gl.uniform3fv(u.u_ld,ld);
  gl.uniform1f(u.u_exp,.92);gl.uniform1f(u.u_lq,0);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shTex);gl.uniform1i(u.u_sh,0);gl.uniform1i(u.u_tx,1);
  gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  parts.forEach(function(pt,i){
    var m=MAT[pt.mat];
    gl.uniformMatrix4fv(u.u_m,false,Ms[i]);gl.uniform3fv(u.u_f0,m.f0);gl.uniform1f(u.u_rough,m.rough);gl.uniform1i(u.u_fin,m.fin);gl.uniform1i(u.u_type,m.type);
    gl.uniform1f(u.u_dim,k.dims[pt.layer]);gl.uniform1f(u.u_hl,k.hl[pt.layer]);gl.uniform1f(u.u_alpha,pt._a);
    if(pt._a<.999)gl.enable(gl.BLEND);else gl.disable(gl.BLEND);
    var tx=pt.tex&&tex[pt.tex];gl.uniform1f(u.u_txOn,tx?1:0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tx||null);if(tx)gl.uniform4fv(u.u_txr,TXR[pt.tex]);
    gl.bindVertexArray(pt.mesh.vao);gl.drawArrays(gl.TRIANGLES,0,pt.mesh.count);
  });
  gl.bindVertexArray(null);

  overlay(k);
}

/* ---------- chapters, callout, rail ---------- */
var curCh=null;
function project(x,y,z){var m=VPm,cx=m[0]*x+m[4]*y+m[8]*z+m[12],cy=m[1]*x+m[5]*y+m[9]*z+m[13],cw=m[3]*x+m[7]*y+m[11]*z+m[15];return [(cx/cw*.5+.5)*stW,(1-(cy/cw*.5+.5))*stH]}
function overlay(k){
  var p=S.p,on=null;
  chapters.forEach(function(c){var a=+c.dataset.from,b=+c.dataset.to,act=p>=a&&p<b;if(act)on=c;if(c._on!==act){c._on=act;c.classList.toggle('on',act)}});
  if(on!==curCh){curCh=on;rail.forEach(function(r){r.classList.toggle('on',on&&r.dataset.go===on.dataset.ch)})}
  var inCh=p>.1&&p<.93;if(stage._in!==inCh){stage._in=inCh;stage.classList.toggle('in-ch',inCh)}
  var inMv=S.visible&&p<.985;if(S._inMv!==inMv){S._inMv=inMv;html.classList.toggle('in-mv',inMv)}
  if(!callout)return;
  var idx=on?+on.dataset.anchor:-1;
  if(idx<0||isNaN(idx)||reduce){callout.classList.remove('on');return}
  var A=ANCH[idx],z=A[2]+k.ex*LAYER[A[3]],s=project(A[0],A[1],z),lab=on.querySelector('.mv-part'),pr=(lab||on).getBoundingClientRect(),sr=stage.getBoundingClientRect();
  var tx=pr.right-sr.left+14,ty=pr.top-sr.top+pr.height/2;
  callout.classList.add('on');
  cDot.style.transform='translate('+s[0].toFixed(1)+'px,'+s[1].toFixed(1)+'px)';
  var cr=on.querySelector('.mv-copy').getBoundingClientRect(),ex=Math.max(tx,cr.right-sr.left+36);if(mobile||s[0]<ex+40)ex=tx;
  cLine.setAttribute('points',tx.toFixed(1)+','+ty.toFixed(1)+' '+ex.toFixed(1)+','+ty.toFixed(1)+' '+s[0].toFixed(1)+','+s[1].toFixed(1));
  if(cLab.textContent!==A[4])cLab.textContent=A[4];
}

/* ---------- events ---------- */
stage.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var r=stage.getBoundingClientRect();
  });
stage.addEventListener('pointerleave',function(){S.ptrT=[0,0];dirty=true});
rail.forEach(function(b){b.addEventListener('click',function(){
  var c=section.querySelector('[data-ch="'+b.dataset.go+'"]');if(!c)return;
  var mid=(+c.dataset.from+ +c.dataset.to)/2,top=section.getBoundingClientRect().top+w.scrollY,span=section.offsetHeight-w.innerHeight;
  w.dispatchEvent(new CustomEvent('btc:scrollto',{detail:top+span*mid}));
})});
if('IntersectionObserver' in w)new IntersectionObserver(function(es){S.visible=es[0].isIntersecting;dirty=true;if(!S.visible){S._inMv=false;html.classList.remove('in-mv')}}).observe(section);
if('ResizeObserver' in w)new ResizeObserver(resize).observe(stage);else w.addEventListener('resize',resize);
w.addEventListener('scroll',function(){dirty=true},{passive:true});
canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();html.classList.add('no-gl');section.classList.add('flow')});
chapters.forEach(function(c){if(c.dataset.ch==='hero')return;c.addEventListener('focusin',function(){if(c._on||section.classList.contains('flow'))return;
  var mid=(+c.dataset.from+ +c.dataset.to)/2,top=section.getBoundingClientRect().top+w.scrollY,span=section.offsetHeight-w.innerHeight;w.scrollTo(0,top+span*mid)})});

function startIntro(){S.intro=1}
(function(){var yrs=d.getElementById('years');if(!yrs||reduce)return;
  var b=d.createElement('button');b.type='button';b.className='mv-skip';b.textContent='Skip to our timeline';
  b.addEventListener('click',function(){var top=yrs.getBoundingClientRect().top+w.scrollY;w.dispatchEvent(new CustomEvent('btc:scrollto',{detail:top}))});
  stage.appendChild(b)})();
if(reduce){S.intro=1}
else if(html.classList.contains('intro')){
  var mo=new MutationObserver(function(){if(html.classList.contains('landed')){mo.disconnect();startIntro()}});mo.observe(html,{attributes:true,attributeFilter:['class']});
  setTimeout(startIntro,4200);
}else requestAnimationFrame(function(){startIntro()});

resize();buildTextures();
if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){buildTextures()});
requestAnimationFrame(frame);
w.BTCMovement={state:S,sample:sample};
})();
