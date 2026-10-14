/* ECHO VERSE -- Archivseite (archive.html; W5, W6, Signal-Atlas E932).
   1) Signal-Atlas im Kopf: jede veroeffentlichte Sendung als Kamm auf ihrer FM-Zahl. Quer liegt das alte FM-Band
      (87.5-108), in die Tiefe der Sendetag: vorn die neuesten, ganz hinten das erste Signal (06.07.2026).
      Zeichensprache wie der Signalraum der Startseite (E927-E930): Linien fast unsichtbar, Farbe nur an den
      Sendungen, Raender weich, die Kaemme atmen langsam. Maus: Kamm lesen, Klick oeffnet die Sendungs-Seite;
      am Handy zeigt der erste Tipp, der zweite oeffnet. Der Filter blendet die anderen Kanaele ab.
   2) Raster der Sendungen bzw. Fragmente, Filter, Leuchtkasten mit Blaettern.
   Daten: assets/archive.json (schreibt der taegliche Archiv-Job). Nichts nach aussen, nichts gespeichert. */
(function(){
"use strict";
var CH_CLASS={frequency:"freq",drift:"drift",pulse:"pulse",vigil:"vigil",aurora:"aurora"};
var CH_RGB={frequency:[34,211,238],drift:[255,45,155],pulse:[124,92,255],vigil:[255,158,61],aurora:[245,242,234]};
var CH_HEX={frequency:"#22D3EE",drift:"#FF2D9B",pulse:"#7C5CFF",vigil:"#FF9E3D",aurora:"#F5F2EA"};
var CARRIER={frequency:95.3,drift:97.1,pulse:100.4,vigil:106.5,aurora:107.9};
var LABEL={frequency:"FREQUENCY",drift:"DRIFT",pulse:"PULSE",vigil:"VIGIL",aurora:"AURORA"};
var ORDER=["frequency","drift","pulse","vigil","aurora"];
var reduce=!!window.ECHO_REDUCE;
var TEST=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&window.URLSearchParams?new URLSearchParams(location.search):null;

function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function pad3(v){return String(v).length>=3?String(v):("00"+v).slice(-3);}
function pad4(v){return ("000"+v).slice(-4);}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function hash1(n){var x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function vnoise(x){var i=Math.floor(x),u=x-i;u=u*u*(3-2*u);return (hash1(i)*(1-u)+hash1(i+1)*u)*2-1;}
function rgba(c,a){return "rgba("+c[0]+","+c[1]+","+c[2]+","+(+a).toFixed(3)+")";}
function dayNum(s){var p=String(s).split("-");return Date.UTC(+p[0],(+p[1])-1,+p[2])/864e5;}
var MONTHS=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

var grid=document.getElementById("grid");
var statusLine=document.getElementById("statusLine"),statCount=document.getElementById("statCount"),statBand=document.getElementById("statBand");
var empties={pulse:document.getElementById("emptyPulse"),vigil:document.getElementById("emptyVigil"),aurora:document.getElementById("emptyAurora")};
var emptyGeneric=document.getElementById("emptyGeneric"),loadError=document.getElementById("loadError");
var tabs=[].slice.call(document.querySelectorAll(".tab"));
var views=document.getElementById("views"),viewBtns=[].slice.call(document.querySelectorAll(".view"));
var DATA=null,filter="all",view="signals",shown=[];

function station(it){return (DATA.channels[it.channel]||{}).fm||String(CARRIER[it.channel]||"")||it.fm;}
function cls(it){return CH_CLASS[it.channel]||"freq";}
function watch(it){return "https://www.youtube.com/watch?v="+encodeURIComponent(it.youtube_id);}

/* ── Raster ───────────────────────────────────────── */
function card(it){
  var a=el("a","card "+cls(it));
  if(it.page){a.href=it.page;}else{a.href=watch(it);a.target="_blank";a.rel="noopener";}
  a.setAttribute("aria-label","ECHO "+it.fm+" — "+(it.fragment||"untitled")+", "+(LABEL[it.channel]||"")+", "+it.published+(it.page?" — open transmission file":" — open on YouTube"));
  var th=el("div","thumb vf"),img=document.createElement("img");
  img.src=it.thumb;img.loading="lazy";img.decoding="async";img.width=480;img.height=270;img.alt="";
  th.appendChild(img);th.appendChild(el("span","tag","SIG "+it.fm));
  if(it.duration)th.appendChild(el("span","dur",it.duration));
  var body=el("div","body");
  body.appendChild(el("div","ttl",it.fragment||it.title||"UNTITLED"));
  if(it.genres)body.appendChild(el("div","gen",it.genres));
  var meta=el("div","meta"),b=el("b",null,LABEL[it.channel]||"");
  meta.appendChild(b);meta.appendChild(document.createTextNode(" · TX "+it.published+" · VOL."+pad3(it.volume)));
  body.appendChild(meta);
  a.appendChild(th);a.appendChild(body);
  return a;
}
function capInto(node,it){
  node.textContent="FRG-"+station(it)+"/"+pad4(it.volume)+" — ";
  node.appendChild(el("b",null,it.fragment||"UNTITLED"));
}
function frag(it,idx){
  var t=el("button","fragt vf "+cls(it));t.type="button";
  t.setAttribute("aria-label","Recovered fragment — "+(it.fragment||"untitled")+" — enlarge");
  var img=document.createElement("img");
  img.src=it.art;img.loading="lazy";img.decoding="async";img.width=1280;img.height=720;img.alt="";
  var cap=el("span","cap");capInto(cap,it);
  t.appendChild(img);t.appendChild(cap);
  t.addEventListener("click",function(){openLb(idx);});
  return t;
}
function pool(){return DATA.items.filter(function(it){return view==="signals"||it.art;});}

/* Erscheinen erst im Blick: das Bild baut sich dann von oben auf (CSS .in) */
var cio=null;
if(!reduce&&"IntersectionObserver" in window){
  cio=new IntersectionObserver(function(es){
    var k=0;
    es.forEach(function(en){
      if(!en.isIntersecting)return;
      cio.unobserve(en.target);
      var n=en.target;setTimeout(function(){n.classList.add("in");},Math.min(k++*70,420));
    });
  },{rootMargin:"0px 0px -4% 0px"});
}
function counts(){
  var c={all:0};ORDER.forEach(function(k){c[k]=0;});
  pool().forEach(function(it){c.all++;if(c[it.channel]!==undefined)c[it.channel]++;});
  tabs.forEach(function(t){var ct=t.querySelector(".ct");if(ct)ct.textContent=" ["+(c[t.getAttribute("data-filter")]||0)+"]";});
  var live=0,rising=0;
  ORDER.forEach(function(k){if(DATA.items.some(function(it){return it.channel===k;}))live++;else rising++;});
  statCount.textContent=c.all;
  statusLine.textContent=(view==="signals"?"TRANSMISSIONS LOGGED":"FRAGMENTS RECOVERED")+" · "+live+" LIVE"+(rising?" · "+rising+" RISING":"");
}
function render(){
  grid.innerHTML="";
  emptyGeneric.classList.remove("on");
  for(var k in empties)empties[k].classList.remove("on");
  if(!DATA)return;
  shown=pool().filter(function(it){return filter==="all"||it.channel===filter;});
  if(!shown.length){
    (view==="signals"&&empties[filter]?empties[filter]:emptyGeneric).classList.add("on");
    return;
  }
  shown.forEach(function(it,i){
    var c=view==="signals"?card(it):frag(it,i);
    grid.appendChild(c);
    if(cio)cio.observe(c);else c.classList.add("in");
  });
}
function setView(v,fromUser){
  view=v;
  viewBtns.forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-view")===v?"true":"false");});
  if(fromUser&&window.history&&history.replaceState)history.replaceState(null,"",v==="fragments"?"#fragments":location.pathname+location.search);
  counts();render();
}
function setFilter(f){
  filter=f;
  tabs.forEach(function(o){o.setAttribute("aria-pressed",o.getAttribute("data-filter")===f?"true":"false");});
  document.documentElement.style.setProperty("--sig",CH_HEX[f]||"#22D3EE");
  render();
  AT.filterChanged();
}
viewBtns.forEach(function(b){b.addEventListener("click",function(){setView(b.getAttribute("data-view"),true);});});
tabs.forEach(function(t){t.addEventListener("click",function(){setFilter(t.getAttribute("data-filter"));});});

/* ── Leuchtkasten (Fragmente), blaettern mit Pfeilen ── */
var lb=document.getElementById("lightbox"),lbImg=lb.querySelector("img"),lbCap=lb.querySelector(".lb-cap");
var lbPlay=lb.querySelector(".lb-play"),lbFile=lb.querySelector(".lb-file"),lbIdx=-1;
function openLb(i){
  var it=shown[i];if(!it)return;lbIdx=i;
  lb.className="on "+cls(it);
  lbImg.src=it.art;lbImg.alt="Recovered fragment — "+(it.fragment||"untitled");
  lbCap.textContent="";capInto(lbCap,it);
  lbCap.appendChild(el("span","lb-meta","recovered with SIG "+it.fm+" — TX "+it.published));
  lbPlay.href=watch(it);
  if(it.page){lbFile.href=it.page;lbFile.hidden=false;}else{lbFile.hidden=true;}
}
function closeLb(){lb.className="";lbImg.src="";lbIdx=-1;}
function stepLb(d){if(lbIdx<0||!shown.length)return;openLb((lbIdx+d+shown.length)%shown.length);}
lb.addEventListener("click",function(e){
  if(e.target.closest(".lb-step")){stepLb(e.target.closest(".lb-prev")?-1:1);return;}
  if(e.target.closest("a"))return;
  closeLb();
});
document.addEventListener("keydown",function(e){
  if(lbIdx<0)return;
  if(e.key==="Escape")closeLb();
  else if(e.key==="ArrowLeft")stepLb(-1);
  else if(e.key==="ArrowRight")stepLb(1);
});

/* ── Signal-Atlas ─────────────────────────────────── */
var AT=(function(){
  var cv=document.getElementById("atlas"),head=document.getElementById("atlasHead"),space=head?head.querySelector(".atlas-space"):null;
  var tip=document.getElementById("atlasTip"),hint=document.getElementById("atlasHint");
  var A={ok:false,filterChanged:function(){}};
  var cx=null;
  try{cx=cv&&cv.getContext("2d");}catch(e){cx=null;}
  if(!cx||!space||typeof Path2D==="undefined"){if(cv)cv.hidden=true;return A;}
  var LO=86.2,HI=109.3,B0=87.5,B1=108,SIG=.15;   /* Zeilen reichen etwas ueber das Band hinaus und laufen dort aus */
  var S={w:0,h:0,dpr:1,M:420,x0:0,x1:0,by:0,hy:0,vx:0,small:false,rows:[],items:[],t0:0,raf:0,vis:true,last:0,
         cam:0,camT:0,hover:null,pin:null,touch:false,wt:{},tgt:{},fixed:null,lt:0};
  ORDER.forEach(function(k){S.wt[k]=1;S.tgt[k]=1;});
  function now(){return S.fixed!=null?S.fixed:(performance.now()/1000-S.t0);}

  function setData(items){
    var byDate={};
    S.items=items.filter(function(it){return it.published&&isFinite(parseFloat(it.fm));});
    S.items.forEach(function(it,k){
      it._fm=parseFloat(it.fm);
      it._h=.62+.3*hash1(k*3.7+it._fm*.13);
      it._ph=hash1(k*1.31+.5)*6.2832;
      it._sp=.45+.35*hash1(k*5.17+1.9);
      (byDate[it.published]=byDate[it.published]||[]).push(it);
    });
    var dates=Object.keys(byDate).sort();
    if(!dates.length)return;
    S.first=dates[0];S.last=dates[dates.length-1];
    /* je Sendetag eine Zeile (alt -> neu); Zeitmarken: erste Zeile je Monat, dazu erstes und letztes Signal */
    S.all=dates.map(function(ds,ri){return{date:ds,day:dayNum(ds),items:byDate[ds],seed:ri*7.31+3.3,mon:+ds.split("-")[1]};});
    var seen={};
    S.all.forEach(function(r){if(!seen[r.mon]){seen[r.mon]=1;r.mark=MONTHS[r.mon-1];}});
    if(S.all.length>1)S.all[S.all.length-1].mark="LATEST "+S.all[S.all.length-1].date.slice(5);
    S.t0=performance.now()/1000;
    A.ok=true;
    S.mode=null;
    resize();
    start();
  }
  /* Am Handy nur die letzten Sendetage (sonst draengen sich 148 Kaemme auf 340 px); Tiefe 0 = neueste Zeile */
  var MOBILE_ROWS=18;
  function layout(){
    var rows=S.small?S.all.slice(-MOBILE_ROWS):S.all.slice();
    var last=rows[rows.length-1].day,span=Math.max(1,last-rows[0].day);
    rows.forEach(function(r){r.d=(last-r.day)/span;});
    rows.sort(function(a,b){return b.d-a.d;});   /* von hinten nach vorn zeichnen */
    S.rows=rows;
  }
  function prep(){
    /* je Sendung ihr Fenster in den Abtastwerten der Zeile (Gauss-Kamm), je Zeile ein ruhiges Grundrauschen */
    var M=S.M,per=(M-1)/(HI-LO),sg=SIG*per,half=Math.ceil(4*sg);
    S.items.forEach(function(it){
      var c=(it._fm-LO)*per,i0=Math.max(0,Math.floor(c-half)),i1=Math.min(M-1,Math.ceil(c+half)),g=new Float32Array(i1-i0+1);
      for(var i=i0;i<=i1;i++){var dd=(i-c)/sg;g[i-i0]=Math.exp(-.5*dd*dd);}
      it._c=c;it._i0=i0;it._i1=i1;it._g=g;
    });
    S.all.forEach(function(r){
      var rp=new Float32Array(M);
      for(var i=0;i<M;i++)rp[i]=.012*vnoise(i*.07+r.seed)+.006*vnoise(i*.29+r.seed*2.1);
      r.rp=rp;r.a=new Float32Array(M);
    });
  }
  function resize(){
    var r=head.getBoundingClientRect(),sp=space.getBoundingClientRect();
    S.dpr=Math.min(window.devicePixelRatio||1,2);
    S.w=Math.max(1,Math.round(r.width*S.dpr));S.h=Math.max(1,Math.round(r.height*S.dpr));
    if(cv.width!==S.w||cv.height!==S.h){cv.width=S.w;cv.height=S.h;}
    S.small=r.width<761;
    if(S.small){S.x0=(sp.left-r.left+6)*S.dpr;S.x1=(sp.right-r.left-14)*S.dpr;}   /* Achsenzahlen bleiben im Bild */
    else{var ext=Math.min(36,(sp.left-r.left)*.6);S.x0=(sp.left-r.left-ext)*S.dpr;S.x1=(sp.right-r.left+ext)*S.dpr;}
    S.by=(sp.bottom-r.top-30)*S.dpr;
    S.hy=(sp.top-r.top+(S.small?14:12))*S.dpr;   /* Horizont unter dem Text: das Feld liegt nicht hinter der Schrift */
    S.vx=(S.x0+S.x1)/2;
    var mode=S.small?"s":"l";
    if(mode!==S.mode){S.mode=mode;layout();}
    var M=S.small?260:420;
    if(M!==S.M||!S.all[0].rp){S.M=M;prep();}
    if(reduce||S.fixed!=null)draw();
  }
  /* Band -> x der vordersten Zeile */
  function fx(f){return S.x0+(S.x1-S.x0)*(f-B0)/(B1-B0);}
  function zy(d){return S.by-(S.by-S.hy)*(1-1/(1+d*1.15))/(1-1/2.15);}
  function zs(d){return 1-d*.3;}
  function ease(x){x=clamp(x,0,1);return 1-Math.pow(1-x,3);}

  function draw(){
    if(!A.ok)return;
    var t=now(),c=cx,dpr=S.dpr,M=S.M,w=S.w,i,k;
    var dt=S.lt?clamp(t-S.lt,0,.1):0;S.lt=t;
    ORDER.forEach(function(ch){S.wt[ch]+=(S.tgt[ch]-S.wt[ch])*(dt?1-Math.exp(-dt/.28):1);});
    S.cam+=(S.camT-S.cam)*(dt?1-Math.exp(-dt/.9):1);
    var vx=S.vx+S.cam*(S.x1-S.x0)*.035,DY=S.by-S.hy,AH=DY*(S.small?.36:.42);
    var xlo=fx(LO),xhi=fx(HI),e0=(B0-LO)/(HI-LO),e1=(B1-LO)/(HI-LO);
    var intro=reduce||S.fixed!=null?99:t,marks=[];
    for(i=0;i<S.items.length;i++)S.items[i]._x=null;   /* nur gezeichnete Kaemme sind waehlbar */
    c.clearRect(0,0,w,S.h);
    for(var ri=0;ri<S.rows.length;ri++){
      var row=S.rows[ri],d=row.d,sc=zs(d),yb=zy(d),ah=AH*(1-d*.68),fd=1-d;
      var rise=ease((intro-(d>0?(1-d):1)*1.1)/.9);   /* vom ersten Signal nach vorn, die neuesten zuletzt */
      var a=row.a;
      for(i=0;i<M;i++)a[i]=row.rp[i]*(.4+.6*rise);
      for(k=0;k<row.items.length;k++){
        var it=row.items[k],wt=S.wt[it.channel]==null?1:S.wt[it.channel];
        var br=reduce?1:1+.05*Math.sin(t*it._sp+it._ph);
        var H=it._h*br*rise*(.3+.7*wt)*(it===S.hover?1.12:1);
        it._H=H;
        for(i=it._i0;i<=it._i1;i++)a[i]+=H*it._g[i-it._i0];
      }
      var xl=vx+(xlo-vx)*sc,xr=vx+(xhi-vx)*sc,step=(xr-xl)/(M-1);
      var path=new Path2D();
      for(i=0;i<M;i++){var x=xl+step*i,y=yb-a[i]*ah;if(i)path.lineTo(x,y);else path.moveTo(x,y);}
      /* Flaeche unter der Linie verdeckt die Zeilen dahinter */
      var fill=new Path2D(path);fill.lineTo(xr,yb+2*dpr);fill.lineTo(xl,yb+2*dpr);fill.closePath();
      c.fillStyle="rgba(4,6,11,"+(.55+.4*fd).toFixed(3)+")";c.fill(fill);
      /* Grundlinie: fast unsichtbar, an den Enden ausgeblendet */
      var ab=.012+.06*fd*fd,gl=c.createLinearGradient(xl,0,xr,0);
      gl.addColorStop(0,"rgba(150,165,205,0)");gl.addColorStop(e0,"rgba(150,165,205,"+ab.toFixed(3)+")");
      gl.addColorStop(e1,"rgba(150,165,205,"+ab.toFixed(3)+")");gl.addColorStop(1,"rgba(150,165,205,0)");
      c.strokeStyle=gl;c.lineWidth=(.55+.55*fd)*dpr;c.stroke(path);
      /* Kaemme in der Farbe ihres Kanals; die Vergangenheit verblasst nach hinten */
      var ka=.07+.82*Math.pow(fd,1.8);
      for(k=0;k<row.items.length;k++){
        var q=row.items[k],qw=S.wt[q.channel]==null?1:S.wt[q.channel],col=CH_RGB[q.channel]||[200,210,230];
        var mix=[Math.round(130+(col[0]-130)*qw),Math.round(140+(col[1]-140)*qw),Math.round(165+(col[2]-165)*qw)];
        var hot=q===S.hover,al=ka*(.22+.78*qw)*(S.hover&&!hot?.75:1);
        if(hot)al=1;
        var seg=new Path2D(),i0=q._i0,i1=q._i1;
        for(i=i0;i<=i1;i++){var sx=xl+step*i,sy=yb-a[i]*ah;if(i>i0)seg.lineTo(sx,sy);else seg.moveTo(sx,sy);}
        var g=c.createLinearGradient(xl+step*i0,0,xl+step*i1,0);
        g.addColorStop(0,rgba(mix,0));g.addColorStop(.5,rgba(mix,al));g.addColorStop(1,rgba(mix,0));
        if(hot||(fd>.93&&qw>.5)){c.save();c.globalAlpha=hot?.5:.28;c.strokeStyle=g;c.lineWidth=(hot?7:5)*dpr;c.stroke(seg);c.restore();}
        c.strokeStyle=g;c.lineWidth=(hot?2.2:(.7+1.1*fd))*dpr;c.stroke(seg);
        /* Lage merken: Spitze und Grundlinie fuer Maus und Hinweis */
        q._x=xl+step*q._c;q._top=yb-q._H*ah;q._yb=yb;q._d=d;q._spx=step*SIG*(M-1)/(HI-LO);
      }
      /* Zeitmarke am rechten Ende der Zeile (gezeichnet nach allen Zeilen, sonst verdecken die vorderen sie) */
      /* nicht am Horizont: dort steht die Anzeige mit dem ersten Signal schon direkt darueber */
      if(row.mark&&!S.small&&rise>.5&&d<.97)marks.push([row.mark,vx+(fx(B1+.5)-vx)*sc,yb,.22+.4*fd]);
    }
    c.font=Math.round(9*dpr)+"px 'Share Tech Mono',ui-monospace,monospace";c.textBaseline="middle";c.textAlign="left";
    marks.forEach(function(m){c.fillStyle="rgba(139,147,168,"+m[3].toFixed(3)+")";c.fillText(m[0],m[1],m[2]);});
    /* Achse unter der vordersten Zeile: MHz, die fuenf Traeger als Rauten */
    var by=S.by;
    c.font=Math.round(9.5*dpr)+"px 'Share Tech Mono',ui-monospace,monospace";c.textBaseline="top";c.textAlign="center";
    for(var f=88;f<=108;f++){
      var x=vx+(fx(f)-vx)*zs(0),lab=f%2===0&&(!S.small||f%4===0);
      c.fillStyle="rgba(139,147,168,"+(lab?.4:.18)+")";
      c.fillRect(Math.round(x),by+6*dpr,Math.max(1,Math.round(dpr*.8)),(lab?6:3)*dpr);
      if(lab){c.fillStyle="rgba(139,147,168,.55)";c.fillText(String(f),x,by+15*dpr);}
    }
    ORDER.forEach(function(ch){
      var x=vx+(fx(CARRIER[ch])-vx)*zs(0),col=CH_RGB[ch],qw=S.wt[ch];
      c.fillStyle=rgba(col,.25+.6*qw);
      c.beginPath();c.moveTo(x,by+1*dpr);c.lineTo(x+3*dpr,by+4*dpr);c.lineTo(x,by+7*dpr);c.lineTo(x-3*dpr,by+4*dpr);c.closePath();c.fill();
    });
    /* gewaehlte Sendung: Strahl von der Grundlinie zur Spitze */
    var h=S.hover;
    if(h&&h._x!=null){
      var hc=CH_RGB[h.channel]||[200,210,230],gb=c.createLinearGradient(0,h._yb+5*dpr,0,h._top-14*dpr);
      gb.addColorStop(0,rgba(hc,.85));gb.addColorStop(1,rgba(hc,0));
      c.strokeStyle=gb;c.lineWidth=1.4*dpr;c.shadowColor=rgba(hc,.8);c.shadowBlur=6*dpr;
      c.beginPath();c.moveTo(h._x,h._yb+5*dpr);c.lineTo(h._x,h._top-14*dpr);c.stroke();c.shadowBlur=0;
      c.fillStyle=rgba(hc,1);c.beginPath();c.arc(h._x,h._top,2.6*dpr,0,6.2832);c.fill();
      placeTip();
    }
  }
  function frame(){
    S.raf=0;
    if(!S.vis||document.hidden)return;
    var t=performance.now();
    if(t-S.last>=(S.small?40:31)){S.last=t;draw();}
    S.raf=requestAnimationFrame(frame);
  }
  function start(){if(reduce||S.fixed!=null){draw();return;}if(!S.raf)S.raf=requestAnimationFrame(frame);}

  /* ── Maus und Finger ── */
  function pick(mx,my){
    var best=null,bd=1e9,dpr=S.dpr,X=mx*dpr,Y=my*dpr,i,it;
    for(i=0;i<S.items.length;i++){
      it=S.items[i];
      if(it._x==null||(S.wt[it.channel]||0)<.5)continue;
      var hw=Math.max(7*dpr,it._spx*1.7);
      if(Math.abs(X-it._x)<=hw&&Y>=it._top-10*dpr&&Y<=it._yb+6*dpr){
        var sc=it._d*1000+Math.abs(X-it._x);       /* die vorderste zuerst */
        if(sc<bd){bd=sc;best=it;}
      }
    }
    if(best)return best;
    var lim=(S.touch?40:28)*dpr;lim*=lim;
    for(i=0;i<S.items.length;i++){
      it=S.items[i];
      if(it._x==null||(S.wt[it.channel]||0)<.5)continue;
      var dx=X-it._x,dy=Y-it._top,dd=dx*dx+dy*dy;
      if(dd<lim&&dd<bd){bd=dd;best=it;}
    }
    return best;
  }
  function setHover(it){
    if(it===S.hover)return;
    S.hover=it;
    cv.classList.toggle("hot",!!it);
    if(!it){tip.hidden=true;}
    else{
      tip.className="atlas-tip "+cls(it);
      tip.href=it.page||watch(it);
      if(it.page){tip.removeAttribute("target");tip.removeAttribute("rel");}else{tip.target="_blank";tip.rel="noopener";}
      tip.textContent="";
      tip.appendChild(el("b",null,"ECHO "+it.fm));
      tip.appendChild(document.createTextNode(" — "+(it.fragment||"UNTITLED")+(it.page?" ▸":" ↗")));
      var s=el("span");s.appendChild(el("i",null,LABEL[it.channel]||""));
      s.appendChild(document.createTextNode(" · VOL."+pad3(it.volume)+" · "+it.published));
      tip.appendChild(s);
      tip.hidden=false;
    }
    if(reduce||S.fixed!=null)draw();
  }
  function placeTip(){
    var h=S.hover;if(!h||tip.hidden)return;
    var x=h._x/S.dpr,y=h._top/S.dpr,W=head.clientWidth,tw=tip.offsetWidth||260;
    x=clamp(x,tw/2+12,W-tw/2-12);
    tip.style.left=x+"px";tip.style.top=Math.max(y,tip.offsetHeight+80)+"px";
  }
  function local(e){var r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];}
  cv.addEventListener("pointermove",function(e){
    if(e.pointerType==="touch")return;
    S.touch=false;
    var p=local(e);
    S.camT=clamp((p[0]/(S.w/S.dpr))*2-1,-1,1);
    setHover(pick(p[0],p[1]));
  });
  cv.addEventListener("pointerleave",function(e){if(e.pointerType!=="touch"){S.camT=0;setHover(null);}});
  cv.addEventListener("pointerdown",function(e){S.touch=e.pointerType==="touch";});
  cv.addEventListener("click",function(e){
    var p=local(e),it=pick(p[0],p[1]);
    if(!it){if(S.touch)setHover(null);return;}
    if(S.touch&&it!==S.pin){S.pin=it;setHover(it);return;}   /* am Handy: erster Tipp zeigt, zweiter oeffnet */
    if(it.page)location.href=it.page;else window.open(watch(it),"_blank","noopener");
  });
  if(hint&&window.matchMedia&&window.matchMedia("(hover: none)").matches)hint.textContent="tap a signal to read it · tap again to open its file";
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(es){S.vis=es[0].isIntersecting;if(S.vis&&A.ok)start();}).observe(head);
  }
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&A.ok)start();});
  window.addEventListener("resize",function(){if(A.ok)resize();});

  A.setData=setData;
  A.filterChanged=function(){
    ORDER.forEach(function(ch){S.tgt[ch]=filter==="all"||filter===ch?1:.12;});
    if(S.hover&&S.tgt[S.hover.channel]<.5)setHover(null);
    if(reduce||S.fixed!=null){ORDER.forEach(function(ch){S.wt[ch]=S.tgt[ch];});draw();}
  };
  /* Pruefansicht (nur localhost): ?at=12 friert den Atlas bei 12 s ein, &ahover=3 zeigt Sendung Nr. 3 */
  A.test=function(){
    if(!TEST||!TEST.has("at"))return;
    S.fixed=parseFloat(TEST.get("at"))||12;S.lt=0;
    ORDER.forEach(function(ch){S.wt[ch]=S.tgt[ch];});
    draw();
    var hv=TEST.get("ahover");
    if(hv!=null&&S.items[+hv]){setHover(S.items[+hv]);draw();placeTip();}
  };
  A.draw=draw;A.S=S;
  return A;
})();

fetch("assets/archive.json")
  .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();})
  .then(function(data){
    DATA=data;
    var hasArt=data.items.some(function(it){return it.art;});
    views.hidden=!hasArt;
    var dates=data.items.map(function(it){return it.published;}).filter(Boolean).sort();
    if(dates.length)statBand.textContent="FIRST SIGNAL "+dates[0]+" · LATEST "+dates[dates.length-1];
    if(TEST&&TEST.get("afilter"))setFilter(TEST.get("afilter"));
    setView(hasArt&&location.hash==="#fragments"?"fragments":"signals",false);
    if(AT.setData){AT.setData(data.items);AT.filterChanged();if(AT.test)AT.test();}
    window.ECHO_ATLAS=AT;
  })
  .catch(function(){
    statusLine.textContent="INDEX OFFLINE";
    loadError.classList.add("on");
  });
})();
