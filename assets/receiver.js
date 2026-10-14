/* ECHO VERSE -- Empfaenger "Signal Lock" (Hero der Startseite).

   Die Startseite ist ein Radio: je Sender ein Artwork mit Tiefenkarte (dieselbe Schaetzung wie DepthFlow in
   den Videos), 2,5D-Parallax mit Maus und langsamer Kamerafahrt, Lichtpuls im Takt des Kanals (ECHO Drift
   mit Beat-Zoom wie im Video), das Riesen-Wort des Senders steht HINTER der Figur (Tiefentest im Shader).
   Senderwechsel: das Bild zerfaellt in Rauschen, die Nadel wandert ueber die Skala, das neue Bild wird vom
   Fokuspunkt aus rekonstruiert. Tote Frequenzen bleiben tot (Easteregg wie bisher).

   Ohne WebGL2 laeuft eine CSS-Fassung (Bild + Ueberblendung), bei prefers-reduced-motion steht das Bild still
   und wechselt nur auf Klick. Keine Requests nach aussen, nichts wird gespeichert. Ton nur nach Klick auf
   SOUND (synthetisches FM-Rauschen wie W8-Lite, E558). */
(function(){
"use strict";

var hero=document.getElementById("hero");
var canvas=hero&&hero.querySelector(".rx-canvas");
var dial=hero&&hero.querySelector(".rx-dial");
if(!hero||!canvas||!dial)return;

/* ---------- Bildparameter je Sender ----------
   focus  Fokuspunkt im Bild (0..1): Gesicht bzw. Halo -- dort steht die Figur im Bild, von dort startet die Rekonstruktion
   tdy    Lage des Riesen-Worts relativ zum Fokuspunkt (Anteil der Bildschirmhoehe, negativ = darueber)
   tx,ts  Querversatz und Groesse des Worts (nur quer, hochkant steht es mittig in voller Breite)
   tls    Sperrung in em; tgap = Luecke in der Wortmitte in em (das Wort teilt sich um einen mittig stehenden Kopf)
   tdepth Tiefe des Worts (0 fern .. 1 nah): alles, was naeher ist, verdeckt es -- gemessen zwischen Figur und
          Hintergrund (Tiefe am Gesicht: Frequency .52, Drift .69, Pulse .71, Vigil .54, Aurora .31 -- Aurora: Fluegel .37)
   bpm    Takt des Lichtpulses; half = nur jeder zweite Schlag (ruhige Kanaele)
   zoom   Beat-Zoom (nur ECHO Drift), zbeats = ein Zoom alle n Schlaege -- weich an, langsam aus (Owner E926: "bei weitem langsamer") */
var LOOK={
  frequency:{hex:"#22D3EE",word:"FREQUENCY",focus:[.47,.30],tdy:-.17,tx:0,ts:1,tdepth:.30,bpm:100,half:true,glow:.55,zoom:0},
  drift:{hex:"#FF2D9B",word:"DRIFT",focus:[.36,.24],tdy:-.10,tx:.28,ts:.62,tdepth:.40,bpm:140,half:false,glow:.85,zoom:.016,zbeats:4},
  pulse:{hex:"#7C5CFF",word:"PULSE",focus:[.68,.25],tdy:-.06,tx:-.13,ts:.84,tdepth:.42,bpm:122,half:true,glow:.6,zoom:0},
  vigil:{hex:"#FF9E3D",word:"VIGIL",focus:[.52,.25],tdy:-.04,tx:-.31,ts:.5,tdepth:.20,bpm:132,half:true,glow:.7,zoom:0},
  aurora:{hex:"#F5F2EA",word:"AURORA",focus:[.50,.20],tdy:0,tx:0,ts:1,tgap:1.05,tdepth:.41,bpm:130,half:true,glow:.6,zoom:0}
};
var HOLD=9.0;          /* Sekunden je Sender im Suchlauf */
var ASSET_V="1";       /* Version der Bilder in assets/hero -- beim Tausch hochzaehlen (auch in index.html: preload + --amb) */
var REVEAL=1.5;        /* Sekunden fuer die Rekonstruktionswelle */
var DEAD_LINES=[
  "…fragment corrupted. reconstruction impossible. for now.",
  "…static. but something moved in the noise.",
  "…this frequency remembers being alive.",
  "…signal lost in 20▓▓. recovery queued.",
  "…nothing here. and yet you keep tuning.",
  "…archive sector sealed. clearance: ECHO only.",
  "…terminal handshake available. press ~"
];

/* ---------- Hilfsfunktionen ---------- */
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function easeOutQuad(t){t=clamp(t,0,1);return 1-(1-t)*(1-t);}
function easeInOut(t){t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function rgb(hex){var n=parseInt(hex.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
/* Eine Uhr fuer alles (Sekunden); toff verschiebt sie nur in der Pruefhilfe step() */
var toff=0;
function now(){return performance.now()/1000+toff;}
var REDUCE=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var SAVE=!!(navigator.connection&&navigator.connection.saveData);

/* Skala: Frequenz <-> Position (Prozent). Stueckweise linear ueber die Senderplaetze der alten Skala --
   so bleiben 106.5 und 107.9 auch auf dem Handy auseinander, und Ziehen bleibt stetig. */
var ANCH=[[87.5,0],[89.2,7],[91.7,22],[95.3,38],[97.1,50],[100.4,66],[103.8,79],[106.5,88.5],[107.9,96],[108.0,100]];
function posOf(f){
  for(var i=1;i<ANCH.length;i++){if(f<=ANCH[i][0]){var a=ANCH[i-1],b=ANCH[i];return lerp(a[1],b[1],(f-a[0])/(b[0]-a[0]));}}
  return 100;
}
function freqOf(p){
  for(var i=1;i<ANCH.length;i++){if(p<=ANCH[i][1]){var a=ANCH[i-1],b=ANCH[i];return lerp(a[0],b[0],(p-a[1])/(b[1]-a[1]));}}
  return 108;
}

/* ---------- Sender aus der Skala lesen (Namen, Band, Genres aus den Kanal-Panels -- eine Quelle) ---------- */
var stEls=[].slice.call(dial.querySelectorAll(".rx-st"));
var ST=stEls.map(function(el,i){
  var key=el.getAttribute("data-key")||"",L=LOOK[key];
  var s={i:i,el:el,key:key,fq:parseFloat(el.getAttribute("data-fq")),dead:!L};
  el.style.left=posOf(s.fq)+"%";
  if(!L)return s;
  for(var k in L)s[k]=L[k];
  s.col=rgb(s.hex);
  var p=document.getElementById(key);
  s.panel=p;
  s.name=(p&&p.querySelector(".ch-name")||{}).textContent||("ECHO "+key.toUpperCase());
  s.band=(p&&p.querySelector(".ch-band")||{}).textContent||"";
  s.genres=p?[].slice.call(p.querySelectorAll(".chip")).slice(0,3).map(function(c){return c.textContent;}):[];
  var yt=p&&p.querySelector("a.btn[href*='youtube.com']");
  s.yt=yt?yt.getAttribute("href"):"";
  s.imgUrl="assets/hero/"+key+".jpg?v="+ASSET_V;
  s.depUrl="assets/hero/"+key+"_depth.jpg?v="+ASSET_V;
  return s;
});
var LIVE=ST.filter(function(s){return !s.dead;});
if(!LIVE.length)return;
function rising(s){return s.el.classList.contains("rising");}

/* ---------- DOM des HUD ---------- */
var $=function(id){return document.getElementById(id);};
var elFq=$("rxFq"),elName=$("rxName"),elBand=$("rxBand"),elStatus=$("rxStatus"),elPlay=$("rxPlay"),elOpen=$("rxOpen");
var elNeedle=hero.querySelector(".rx-needle"),elMsg=$("deadMsg"),elLive=$("rxLive"),elWord=hero.querySelector(".rx-word");
var root=document.documentElement;

/* Entschluesseln: Zeichen laufen von links nach rechts von Zufall auf Klartext */
var GLY="#%&@*+=/<>?0123456789ABCDEFXZ";
var decodeT=new WeakMap();
function decode(el,text,ms){
  if(!el)return;
  if(REDUCE||!ms){el.textContent=text;return;}
  var t0=performance.now(),id={};
  decodeT.set(el,id);
  (function step(){
    if(decodeT.get(el)!==id)return;
    var k=(performance.now()-t0)/ms,out="";
    for(var i=0;i<text.length;i++){
      var c=text.charAt(i);
      out+=(c===" "||k*1.25>i/text.length+.25)?c:GLY.charAt(Math.floor(Math.random()*GLY.length));
    }
    el.textContent=out;
    if(k<1)setTimeout(step,40);else el.textContent=text;
  })();
}

/* ---------- Ton (nur nach Klick auf SOUND) ---------- */
var AU={on:false,ctx:null,master:null,ng:null,bp:null,wob:null};
function audioInit(){
  if(AU.ctx)return true;
  try{
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    var c=AU.ctx=new AC();
    AU.master=c.createGain();AU.master.gain.value=.12;AU.master.connect(c.destination);
    var n=c.sampleRate*2,buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=Math.random()*2-1;
    var src=c.createBufferSource();src.buffer=buf;src.loop=true;
    AU.bp=c.createBiquadFilter();AU.bp.type="bandpass";AU.bp.Q.value=.9;AU.bp.frequency.value=1800;
    AU.ng=c.createGain();AU.ng.gain.value=0;
    src.connect(AU.bp);AU.bp.connect(AU.ng);AU.ng.connect(AU.master);src.start();
    /* Wobble der Mittenfrequenz wie beim alten Tuner-Rauschen */
    AU.wob=setInterval(function(){if(AU.ctx&&AU.on)AU.bp.frequency.setTargetAtTime(1000+Math.random()*2000,AU.ctx.currentTime,.06);},130);
    return true;
  }catch(e){return false;}
}
function audioStatic(level){
  if(!AU.on||!AU.ctx)return;
  AU.ng.gain.setTargetAtTime(clamp(level,0,1)*.9,AU.ctx.currentTime,.035);
}
function audioBlip(){
  if(!AU.on||!AU.ctx)return;
  try{
    var c=AU.ctx,t=c.currentTime+.02,o=c.createOscillator(),g=c.createGain();
    o.type="sine";o.frequency.setValueAtTime(600,t);o.frequency.linearRampToValueAtTime(880,t+.2);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.7,t+.02);g.gain.linearRampToValueAtTime(0,t+.2);
    o.connect(g);g.connect(AU.master);o.start(t);o.stop(t+.22);
  }catch(e){}
}
var sndBtn=$("sndBtn");
if(sndBtn&&(window.AudioContext||window.webkitAudioContext)){
  sndBtn.hidden=false;
  sndBtn.addEventListener("click",function(){
    if(!AU.on){
      if(!audioInit())return;
      if(AU.ctx.state==="suspended")AU.ctx.resume();
      AU.on=true;
    }else{
      AU.on=false;
      if(AU.ng)AU.ng.gain.setTargetAtTime(0,AU.ctx.currentTime,.03);
    }
    sndBtn.setAttribute("aria-pressed",AU.on?"true":"false");
    sndBtn.querySelector(".sl").textContent=AU.on?"SOUND ON":"SOUND OFF";
    if(AU.on)audioStatic(staticLevel());
  });
}

/* ---------- Laden: Bild + Tiefenkarte je Sender ---------- */
function loadImg(url){
  return new Promise(function(res,rej){
    var im=new Image();
    im.decoding="async";
    im.onload=function(){(im.decode?im.decode():Promise.resolve()).then(function(){res(im);},function(){res(im);});};
    im.onerror=function(){rej(new Error(url));};
    im.src=url;
  });
}
function load(s){
  if(s.loading)return s.loading;
  s.loading=Promise.all([loadImg(s.imgUrl),loadImg(s.depUrl)]).then(function(r){
    s.im=r[0];s.dm=r[1];s.iw=s.im.naturalWidth;s.ih=s.im.naturalHeight;
    /* Fokus-Tiefe: Tiefenwert am Fokuspunkt -> dort steht die Figur still, der Rest dreht sich darum */
    try{
      var c=document.createElement("canvas");c.width=96;c.height=54;
      var x=c.getContext("2d");x.drawImage(s.dm,0,0,96,54);
      var px=x.getImageData(clamp(Math.round(s.focus[0]*96)-1,0,93),clamp(Math.round(s.focus[1]*54)-1,0,51),3,3).data,sum=0;
      for(var i=0;i<px.length;i+=4)sum+=px[i];
      s.fdepth=clamp(sum/9/255,.35,.95);
    }catch(e){s.fdepth=.7;}
    s.ready=true;
    return s;
  });
  s.loading.catch(function(){s.failed=true;});
  return s.loading;
}

/* ---------- Riesen-Wort als Textur (weiss mit Leuchten; Farbe kommt im Shader dazu) ---------- */
var txt=document.createElement("canvas"),tx=txt.getContext("2d");
var TW=2048,TH=512;
function sizeText(){
  var w=hero.clientWidth;
  var nTW=w>900?2048:1024;
  if(nTW!==TW||txt.width!==nTW){TW=nTW;TH=nTW/4;txt.width=TW;txt.height=TH;}
}
var curLs=.1,curGap=0;
function drawWord(word,prog){
  tx.clearRect(0,0,TW,TH);
  if(!word)return;
  var n=word.length,ls=curLs,gap=curGap,fs=TH*.78,half=Math.floor(n/2);
  tx.font="400 "+fs+"px 'Share Tech Mono',ui-monospace,monospace";
  var cw=tx.measureText("M").width,total=n*cw+(n-1)*ls*fs+gap*fs;
  if(total>TW*.94){fs*=TW*.94/total;tx.font="400 "+fs+"px 'Share Tech Mono',ui-monospace,monospace";cw=tx.measureText("M").width;total=n*cw+(n-1)*ls*fs+gap*fs;}
  var x0=(TW-total)/2,y=TH*.53;
  tx.textBaseline="middle";tx.textAlign="left";
  var chars=[];
  for(var i=0;i<n;i++){
    var c=word.charAt(i);
    if(prog<1&&c!==" "&&prog*1.3<i/n+.3)c=GLY.charAt(Math.floor(Math.random()*GLY.length));
    chars.push(c);
  }
  var g=tx.createLinearGradient(0,y-fs*.45,0,y+fs*.45);
  g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.55,"rgba(255,255,255,.9)");g.addColorStop(1,"rgba(255,255,255,.55)");
  for(var pass=0;pass<2;pass++){
    tx.shadowColor="rgba(255,255,255,.9)";
    tx.shadowBlur=pass?fs*.04:fs*.22;
    tx.fillStyle=pass?g:"rgba(255,255,255,.55)";
    for(var j=0;j<n;j++)tx.fillText(chars[j],x0+j*(cw+ls*fs)+(j>=half?gap*fs:0),y);
  }
  tx.shadowBlur=0;
}

/* ---------- WebGL2 ---------- */
var gl=null,prog=null,U={},quad=null,TXT_TEX=null;
var VS="#version 300 es\nin vec2 p;out vec2 vUv;void main(){vUv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
var FS=[
"#version 300 es",
"precision highp float;",
"in vec2 vUv;out vec4 o;",
"uniform vec2 uRes;uniform float uTime;uniform vec2 uCam;",
"uniform sampler2D uImgA,uDepA,uImgB,uDepB,uTxt;",
"uniform vec4 uFrmA,uFrmB;uniform float uFocA,uFocB,uLodA,uLodB,uHasA,uHasB;",
"uniform vec2 uZcA,uZcB;uniform float uZoomA,uZoomB;",
"uniform vec3 uSigA,uSigB;uniform float uBeatA,uBeatB,uGlowA,uGlowB;",
"uniform float uLoss,uMode,uWave;uniform vec2 uOrigin;",
"uniform vec4 uTxtRect;uniform float uTxtDepth,uTxtOn,uTxtLod;uniform vec3 uTxtTint;uniform int uSteps;",
"float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}",
"vec2 toImg(vec4 f,vec2 s){return (s-.5)*f.xy+f.zw;}",
/* Steep-Parallax: von nah (1) nach fern (0) laufen, erste Oberflaeche nehmen, dann linear verfeinern */
"vec3 march(sampler2D dep,vec4 f,vec2 s,float foc){",
"  float L=1.,st=1./float(uSteps);",
"  vec2 p=s-uCam*(L-foc);float d=textureLod(dep,toImg(f,p),0.).r;",
"  vec2 pp=p;float pl=L,pd=d;",
"  for(int i=0;i<32;i++){if(i>=uSteps||d>=L)break;pp=p;pl=L;pd=d;L-=st;p=s-uCam*(L-foc);d=textureLod(dep,toImg(f,p),0.).r;}",
"  float a=pl-pd,b=d-L,t=clamp(a/max(a+b,1e-4),0.,1.);",
"  return vec3(mix(pp,p,t),mix(pd,d,t));",
"}",
"vec3 scene(sampler2D img,sampler2D dep,vec4 f,float foc,float lod,vec2 zc,float zoom,vec2 s,float beat,float glow){",
"  s=zc+(s-zc)/zoom;",
"  vec3 m=march(dep,f,s,foc);vec2 iu=toImg(f,m.xy);",
"  vec3 c=textureLod(img,iu,lod).rgb;",
"  vec3 bl=textureLod(img,iu,lod+3.6).rgb;",
"  float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),sat=(mx-mn)/max(mx,1e-3);",
"  float mask=smoothstep(.42,.85,mx)*smoothstep(.2,.6,sat);",
"  c+=c*mask*beat*glow*.85;",
"  float lb=dot(bl,vec3(.299,.587,.114));",
"  c+=bl*smoothstep(.3,.9,lb)*(.2+beat*glow*.45);",
/* Riesen-Wort: Ebene in der Tiefe uTxtDepth -- alles Naehere verdeckt es */
"  vec2 ts=s-uCam*(uTxtDepth-foc);vec2 tu=(ts-uTxtRect.xy)/uTxtRect.zw;",
"  vec4 t=textureLod(uTxt,clamp(tu,0.,1.),uTxtLod);",
"  float inb=step(0.,tu.x)*step(tu.x,1.)*step(0.,tu.y)*step(tu.y,1.);",
"  float vis=1.-smoothstep(uTxtDepth-.02,uTxtDepth+.02,textureLod(dep,iu,0.).g);",
"  float sl=.86+.14*sin(gl_FragCoord.y*1.9);",
"  float a=t.a*inb*vis*uTxtOn;",
"  vec3 tc=t.rgb*uTxtTint*sl;",
"  c=mix(c,tc,a*.88);c+=tc*a*.3;",
"  return c;",
"}",
"vec3 stat(vec2 s,vec3 tint){",
"  vec2 px=s*uRes;float t=floor(uTime*48.);",
"  float n=h12(floor(px/1.6)+t*vec2(13.1,7.7));",
"  float ln=h12(vec2(floor(px.y/2.),t));",
"  float v=pow(mix(n,ln,.25),1.7);",
"  float band=smoothstep(.06,0.,abs(fract(s.y*.6-uTime*.21)-.5));",
"  vec3 c=vec3(v*.55+band*.07);",
"  return mix(c,c*tint*1.6,.3);",
"}",
"vec2 quant(vec2 s,float bs){return (floor(s*uRes/bs)+.5)*bs/uRes;}",
"void main(){",
"  vec2 s=vUv;float asp=uRes.x/uRes.y;vec3 col;",
"  if(uMode<.5){",
"    vec3 a=vec3(0.);float L=uLoss;",
"    if(uHasA>.5){",
"      vec2 q=s;",
"      if(L>.001){float bs=mix(1.,44.,L*L);q=quant(s,bs);",
"        q.x+=(h12(vec2(floor(s.y*uRes.y/(5.+bs)),floor(uTime*26.)))-.5)*.11*L*L;}",
"      a=scene(uImgA,uDepA,uFrmA,uFocA,uLodA,uZcA,uZoomA,q,uBeatA,uGlowA);",
"      a*=vec3(1.+L*.5,1.-L*.25,1.+L*.35);",
"    }",
"    float k=uHasA>.5?smoothstep(.22,1.,L):1.;",
"    col=mix(a,stat(s,uSigA),k);",
"  }else{",
"    float r=length((s-uOrigin)*vec2(asp,1.));",
"    float ins=1.-smoothstep(uWave-.012,uWave+.012,r);",
"    float e=smoothstep(uWave-.32,uWave,r);",
"    vec2 q=s;float bs=mix(1.,30.,e*e);if(bs>1.5)q=quant(s,bs);",
"    vec3 b=scene(uImgB,uDepB,uFrmB,uFocB,uLodB,uZcB,uZoomB,q,uBeatB,uGlowB);",
"    col=mix(stat(s,uSigB),b,ins);",
"    float ring=exp(-pow((r-uWave)/.008,2.)),ring2=exp(-pow((r-uWave*.86)/.025,2.))*.3;",
"    col+=uSigB*(ring*1.7+ring2)+vec3(ring*.35);",
"  }",
"  col+=(h12(s*uRes+fract(uTime*7.31)*391.)-.5)*.032;",
"  vec2 v=s-.5;col*=1.-dot(v*vec2(1.05,1.),v*vec2(1.05,1.))*.5;",
"  o=vec4(col,1.);",
"}"
].join("\n");

function compile(type,src){
  var sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);
  if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){
    if(window.console)console.warn("[ECHO receiver] shader:",gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}
function glInit(){
  try{
    gl=canvas.getContext("webgl2",{antialias:false,alpha:false,depth:false,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:!!TEST,powerPreference:"high-performance"});
  }catch(e){gl=null;}
  if(!gl)return false;
  var vs=compile(gl.VERTEX_SHADER,VS),fs=compile(gl.FRAGMENT_SHADER,FS);
  if(!vs||!fs)return false;
  prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);
  gl.bindAttribLocation(prog,0,"p");gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){if(window.console)console.warn("[ECHO receiver] link:",gl.getProgramInfoLog(prog));return false;}
  gl.useProgram(prog);
  quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  ["uRes","uTime","uCam","uImgA","uDepA","uImgB","uDepB","uTxt","uFrmA","uFrmB","uFocA","uFocB","uLodA","uLodB","uHasA","uHasB",
   "uZcA","uZcB","uZoomA","uZoomB","uSigA","uSigB","uBeatA","uBeatB","uGlowA","uGlowB","uLoss","uMode","uWave","uOrigin",
   "uTxtRect","uTxtDepth","uTxtOn","uTxtLod","uTxtTint","uSteps"].forEach(function(n){U[n]=gl.getUniformLocation(prog,n);});
  gl.uniform1i(U.uImgA,0);gl.uniform1i(U.uDepA,1);gl.uniform1i(U.uImgB,2);gl.uniform1i(U.uDepB,3);gl.uniform1i(U.uTxt,4);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
  TXT_TEX=gl.createTexture();
  /* 1x1-Platzhalter, damit kein Sampler leer ist */
  BLANK=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,BLANK);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
  canvas.addEventListener("webglcontextlost",function(e){e.preventDefault();toCss();},false);
  return true;
}
var BLANK=null;
function makeTex(src,mip){
  var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  if(mip){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}
  else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  return t;
}
/* Texturen nur fuer die Sender auf dem Schirm; auf kleinen Geraeten hoechstens drei im Speicher */
var resident=[];
function ensureTex(s){
  if(s.tex)return true;
  if(!s.ready)return false;
  s.tex=makeTex(s.im,true);s.dtex=makeTex(s.dm,false);
  resident.push(s);
  var cap=Math.min(screen.width,screen.height)<700?3:8;
  for(var guard=0;resident.length>cap&&guard<resident.length;guard++){
    var old=resident.shift();
    if(old===A||old===B||old===s){resident.push(old);continue;}
    gl.deleteTexture(old.tex);gl.deleteTexture(old.dtex);old.tex=old.dtex=null;
  }
  return true;
}
var txtDirty=true;
function uploadText(){
  gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,TXT_TEX);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,txt);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  txtDirty=false;
}

/* ---------- Geometrie ---------- */
var W=0,H=0,DPR=1,QUAL=1;
function resize(){
  var r=hero.getBoundingClientRect();
  var cw=Math.max(1,Math.round(r.width)),ch=Math.max(1,Math.round(r.height));
  DPR=Math.min(window.devicePixelRatio||1,2)*QUAL;
  var px=cw*ch*DPR*DPR,MAX=2.6e6;
  if(px>MAX)DPR*=Math.sqrt(MAX/px);
  W=Math.max(1,Math.round(cw*DPR));H=Math.max(1,Math.round(ch*DPR));
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
  sizeText();txtDirty=true;drawWord(curWord,wordProg);
}
function portrait(){return W/H<1;}
/* kleines Geraet (Handy, kleines Tablet): weniger Tiefenschritte, hoechstens 30 Bilder je Sekunde */
function small(){return Math.min(screen.width,screen.height)<700;}
/* Radius der Rekonstruktionswelle (0..1 Fortschritt) -- bis ueber die fernste Bildecke hinaus */
function waveAt(w){return easeOutQuad(w)*(Math.sqrt(Math.pow(W/H,2)+1)+.1);}
/* Bildausschnitt: "cover", Fokuspunkt an eine feste Stelle des Schirms (oben Mitte, frei vom HUD), Rand fuer Parallax */
function frameFor(s,zoom){
  var R=W/H,I=s.iw/s.ih,sx=1,sy=1;
  if(R>I)sy=I/R;else sx=R/I;
  sx/=zoom;sy/=zoom;
  var tgt=portrait()?[.5,.34]:[.5,.40];
  var m=.014;
  var cx=clamp(s.focus[0]-(tgt[0]-.5)*sx,sx/2+m,1-sx/2-m);
  var cy=clamp(s.focus[1]-(tgt[1]-.5)*sy,sy/2+m,1-sy/2-m);
  return[sx,sy,cx,cy];
}
function focalScreen(s,f){return[(s.focus[0]-f[2])/f[0]+.5,(s.focus[1]-f[3])/f[1]+.5];}
function lodFor(s,f){return Math.max(0,Math.log2(f[0]*s.iw/W));}
/* Rechteck des Riesen-Worts in Schirm-Koordinaten (Leinwand 4:1, gesamte Breite, Hoehe begrenzt) */
function textRect(s,fs){
  var pr=portrait(),pw=W*.98,ph=pw/4,maxh=H*(pr?.24:.44);
  if(ph>maxh){ph=maxh;pw=ph*4;}
  if(!pr){pw*=s.ts||1;ph*=s.ts||1;}
  var w=pw/W,h=ph/H;
  var cx=pr?.5:.5+(s.tx||0);
  var cy=clamp(fs[1]+s.tdy,.10+h*.32,.62-h*.3);
  return[cx-w/2,cy-h/2,w,h];
}

/* ---------- Zustand ---------- */
var A=null,B=null;          /* A = Sender auf dem Schirm, B = Sender in der Rekonstruktion */
var ghost=null;             /* Geisterbild auf toten Frequenzen */
var f=87.5;                 /* Nadel */
var phase="boot",pt=0;      /* boot | sweep | acquire | reveal | idle | dead | drag | void */
var sweep={from:87.5,to:87.5,dur:1,target:null};
var loss=1,wave=0,lockAt=0,auto=!REDUCE,lastUser=-1e9,curWord="",wordProg=1,wordT0=0,deadAt=0;
var cam=[0,0],camT=[0,0],mouseAt=-1e9,booted=false,started=false;
var visible=true,running=false,lastT=0;

function staticLevel(){
  if(phase==="sweep"||phase==="acquire"||phase==="void"||phase==="boot")return 1;
  if(phase==="dead")return .8;
  if(phase==="drag")return loss;
  if(phase==="reveal")return clamp(1-wave/1.2,0,1)*.6;
  return 0;
}
/* nur an der Wurzel setzen: dort laeuft die Ueberblendung (@property --sig in index.html), alles erbt sie */
function setRxColor(hex){root.style.setProperty("--sig",hex);}
function announce(t){if(elLive)elLive.textContent=t;}
function hud(s){
  dial.querySelectorAll(".rx-st").forEach(function(e){e.classList.toggle("on",!!s&&e===s.el);});
  hero.classList.toggle("rx-scan",!s);
  if(!s){elStatus.textContent="SCANNING";hero.setAttribute("data-state","scan");return;}
  if(s.dead){
    setRxColor("#8b93a8");
    decode(elName,"SIGNAL LOST",500);
    elBand.textContent="NO CARRIER ON "+s.fq.toFixed(1);
    elStatus.textContent="DEAD";hero.setAttribute("data-state","dead");
    elPlay.hidden=true;elOpen.hidden=true;
    return;
  }
  setRxColor(s.hex);
  decode(elName,s.name,650);
  elBand.textContent=[s.band].concat(s.genres).join(" · ");
  var r=rising(s);
  elStatus.textContent=r?"RISING":"LIVE";
  hero.setAttribute("data-state",r?"rising":"live");
  elPlay.hidden=false;elOpen.hidden=false;
  if(r){elPlay.textContent="SUBSCRIBE ↗";elPlay.href=s.yt||("#"+s.key);elPlay.target="_blank";elPlay.rel="noopener";}
  else{elPlay.textContent="▶ PLAY LATEST";elPlay.href="#"+s.key;elPlay.removeAttribute("target");elPlay.removeAttribute("rel");}
  elPlay.setAttribute("data-key",s.key);
  elOpen.href="#"+s.key;
  announce("Tuned to "+s.fq.toFixed(1)+" FM — "+s.name+(r?", rising":", live"));
}
function setWord(word,ls,gap){curLs=ls||.1;curGap=gap||0;curWord=word||"";wordProg=REDUCE?1:0;wordT0=now();drawWord(curWord,wordProg);txtDirty=true;if(elWord)elWord.textContent=curWord;}
function setNeedle(){
  var p=posOf(f);
  if(elNeedle)elNeedle.style.left=p+"%";
  if(elFq)elFq.textContent=f.toFixed(1);
}
function nearestLive(fq){var best=null,bd=1e9;LIVE.forEach(function(s){var d=Math.abs(s.fq-fq);if(d<bd){bd=d;best=s;}});return[best,bd];}
function nearestAny(fq){var best=null,bd=1e9;ST.forEach(function(s){var d=Math.abs(s.fq-fq);if(d<bd){bd=d;best=s;}});return[best,bd];}
function nextLive(s,dir){
  var i=LIVE.indexOf(s);
  if(i<0){var n=LIVE.filter(function(x){return dir>0?x.fq>f:x.fq<f;});return n.length?(dir>0?n[0]:n[n.length-1]):LIVE[dir>0?0:LIVE.length-1];}
  return LIVE[(i+dir+LIVE.length)%LIVE.length];
}
function userActed(){lastUser=now();auto=false;}

function tuneTo(s,opts){
  opts=opts||{};
  if(!s)return;
  if(!s.dead)load(s);
  if(MODE==="css"){cssTune(s);return;}
  if(REDUCE){
    f=s.fq;setNeedle();
    if(s.empty)voidIn();
    else if(s.dead)deadIn(s);
    else{phase="acquire";B=s;pt=now();if(elMsg)elMsg.classList.remove("show");}
    kick();return;
  }
  sweep.from=f;sweep.to=s.fq;sweep.target=s;
  sweep.dur=opts.fast?.45:clamp(.55+Math.abs(s.fq-f)*.05,.6,1.25);
  phase="sweep";pt=now();
  if(elMsg)elMsg.classList.remove("show");
  hud(null);
  kick();
}
function deadIn(s){
  phase="dead";pt=deadAt=now();
  ghost=LIVE.filter(function(x){return x.ready;});
  ghost=ghost.length?ghost[Math.floor(Math.random()*ghost.length)]:null;
  A=ghost&&ensureTex(ghost)?ghost:null;
  setWord("");
  hud(s);
  if(elMsg){elMsg.textContent="["+s.fq.toFixed(1)+" FM] "+DEAD_LINES[Math.floor(Math.random()*DEAD_LINES.length)];elMsg.classList.add("show");}
  announce(s.fq.toFixed(1)+" FM, signal lost");
}
function revealStart(s){
  B=s;phase="reveal";pt=now();wave=0;
  setWord(s.word,s.tls,s.tgap);hud(s);audioBlip();
}
function lockDone(){
  A=B;B=null;phase="idle";pt=lockAt=now();loss=0;wave=0;
  hero.classList.add("rx-locked");
  /* naechsten Sender schon laden (nicht im Datensparmodus) */
  if(!SAVE){var n=nextLive(A,1);load(n);}
}

/* ---------- Ziehen auf der Skala ---------- */
var dragging=false,dragId=null;
function fAt(clientX){
  var r=dial.getBoundingClientRect();
  return clamp(freqOf(clamp((clientX-r.left)/r.width*100,0,100)),87.5,108);
}
dial.addEventListener("pointerdown",function(e){
  if(e.button!==0)return;
  if(e.target.closest&&e.target.closest(".rx-st"))return;   /* Klick auf einen Sender = Abstimmen, kein Ziehen */
  dragging=true;dragId=e.pointerId;userActed();
  try{dial.setPointerCapture(e.pointerId);}catch(_){}
  f=fAt(e.clientX);phase="drag";pt=now();
  if(elMsg)elMsg.classList.remove("show");
  hud(null);setWord("");
  e.preventDefault();
});
dial.addEventListener("pointermove",function(e){if(dragging&&e.pointerId===dragId){f=fAt(e.clientX);if(REDUCE)kick();}});
function dragEnd(e){
  if(!dragging||(e&&e.pointerId!==dragId))return;
  dragging=false;userActed();
  var na=nearestAny(f);
  /* schon klar auf dem Sender: direkt einrasten, ohne erneutes Rauschen */
  if(!na[0].dead&&na[0]===A&&na[1]<.35){f=A.fq;phase="idle";lockAt=now();loss=Math.min(loss,.3);setWord(A.word,A.tls,A.tgap);hud(A);audioBlip();hero.classList.add("rx-locked");kick();}
  else if(na[1]<.75){tuneTo(na[0],{fast:true});}
  else{voidIn();kick();}
}
/* Leere Frequenz: nur Rauschen */
function voidIn(){
  phase="void";pt=now();hud(null);setWord("");
  if(elMsg){elMsg.textContent="["+f.toFixed(1)+" FM] …nothing on this frequency. static only.";elMsg.classList.add("show");}
  announce(f.toFixed(1)+" FM, static only");
}
dial.addEventListener("pointerup",dragEnd);
dial.addEventListener("pointercancel",dragEnd);

/* Sender anklicken: abstimmen statt springen (ohne JS bleiben es Anker auf die Panels) */
ST.forEach(function(s){
  s.el.addEventListener("click",function(e){
    e.preventDefault();userActed();
    tuneTo(s);
  });
});
/* Tastatur: Pfeile auf der Skala = naechster Sender (auch die toten) */
dial.addEventListener("keydown",function(e){
  var k=e.key;if(k!=="ArrowRight"&&k!=="ArrowLeft"&&k!=="Home"&&k!=="End")return;
  e.preventDefault();userActed();
  var cur=nearestAny(f)[0],i=ST.indexOf(cur);
  var n=k==="Home"?ST[0]:k==="End"?ST[ST.length-1]:ST[clamp(i+(k==="ArrowRight"?1:-1),0,ST.length-1)];
  n.el.focus();tuneTo(n);
});
/* Abspielen: zum Panel und den Player dort starten (Klick des Besuchers = Freigabe fuer YouTube) */
if(elPlay)elPlay.addEventListener("click",function(e){
  var key=elPlay.getAttribute("data-key");
  if(elPlay.target==="_blank"||!key)return;
  var panel=document.getElementById(key);if(!panel)return;
  e.preventDefault();
  panel.scrollIntoView({behavior:REDUCE?"auto":"smooth"});
  var face=panel.querySelector(".player-face");
  if(face)setTimeout(function(){face.click();},REDUCE?0:450);
});

/* Maus = Kamera (nur feine Zeiger); ohne Maus faehrt die Kamera langsam selbst */
window.addEventListener("pointermove",function(e){
  if(e.pointerType!=="mouse")return;
  var r=hero.getBoundingClientRect();
  if(e.clientY>r.bottom)return;
  camT[0]=clamp((e.clientX-r.left)/r.width*2-1,-1,1);
  camT[1]=clamp((e.clientY-r.top)/r.height*2-1,-1,1);
  mouseAt=now();
},{passive:true});

/* ---------- Ablauf je Bild ---------- */
function update(t,dt){
  /* Wort entschluesseln */
  if(wordProg<1){wordProg=clamp((t-wordT0)/.75,0,1);drawWord(curWord,wordProg);txtDirty=true;}
  /* Kamera: Maus, sonst langsame Kreisfahrt wie der DepthFlow-Loop */
  var idle=clamp((t-mouseAt-1.5)/2,0,1);
  var dx=lerp(camT[0],Math.sin(t*.23)*.85,idle),dy=lerp(camT[1],Math.cos(t*.17)*.55,idle);
  var k=1-Math.exp(-dt*3.2);cam[0]+=(dx-cam[0])*k;cam[1]+=(dy-cam[1])*k;

  if(phase==="boot"){
    loss=1;
    if(booted&&!started&&LIVE[0].ready){started=true;tuneTo(LIVE[0]);}
  }else if(phase==="sweep"){
    var u=(t-pt)/sweep.dur;
    f=lerp(sweep.from,sweep.to,easeInOut(u));
    loss=clamp(loss+dt*4,0,1);
    if(u>=1){
      f=sweep.to;
      if(sweep.target.empty)voidIn();
      else if(sweep.target.dead)deadIn(sweep.target);
      else{phase="acquire";B=sweep.target;pt=t;}
    }
  }else if(phase==="acquire"){
    loss=1;
    if(B.failed){phase="void";pt=t;hud(null);if(elMsg){elMsg.textContent="["+B.fq.toFixed(1)+" FM] …signal too weak. try again.";elMsg.classList.add("show");}}
    else if(B.ready&&ensureTex(B)){
      if(REDUCE){A=B;B=null;setWord(A.word,A.tls,A.tgap);hud(A);phase="idle";lockAt=t;loss=0;hero.classList.add("rx-locked");}
      else revealStart(B);
    }
  }else if(phase==="reveal"){
    var w=(t-pt)/REVEAL;
    wave=waveAt(w);
    if(w>=1)lockDone();
  }else if(phase==="idle"){
    loss=Math.max(0,loss-dt*3);
    if(!auto&&t-lastUser>30&&visible)auto=!REDUCE;
    if(auto&&t-lockAt>HOLD&&visible){tuneTo(nextLive(A,1));}
  }else if(phase==="dead"){
    loss=.8+.12*Math.sin(t*5.3)+.06*Math.sin(t*13.7);
    if(t-deadAt>5&&(auto||t-lastUser>8)){auto=!REDUCE;tuneTo(nextLive(null,1));}
  }else if(phase==="drag"){
    var nl=nearestLive(f),s=nl[0],d=nl[1];
    if(s&&!s.dead){load(s);if(s.ready&&ensureTex(s))A=s;}
    loss=A&&A===s?smooth(d/.9):1;
    if(A&&A===s&&d<.35&&curWord!==s.word)setWord(s.word,s.tls,s.tgap);
    if(d>=.35&&curWord)setWord("");
  }else if(phase==="void"){
    loss=1;
    if(t-pt>6&&t-lastUser>6){auto=!REDUCE;tuneTo(nearestLive(f)[0]);}
  }
  setNeedle();
  audioStatic(staticLevel());
}

function beatOf(s,t){
  if(!s||REDUCE)return 0;
  var per=60/s.bpm*(s.half?2:1),ph=(t%per)/per;
  return Math.exp(-ph*(s.half?3.2:5.5));
}
/* Beat-Zoom: ein Puls je zbeats Schlaege, ~18 % der Periode weich hinein, der Rest langsam (Kosinus) zurueck */
function zoomOf(s,t){
  if(!s||!s.zoom||REDUCE)return 0;
  var per=60/s.bpm*(s.zbeats||1),ph=(t%per)/per,att=.18;
  return ph<att?easeOutQuad(ph/att):.5+.5*Math.cos(Math.PI*(ph-att)/(1-att));
}
function setLayer(s,which,t){
  var unit=which==="A"?0:2;
  if(!s||!s.tex){
    gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,BLANK);
    gl.activeTexture(gl.TEXTURE1+unit);gl.bindTexture(gl.TEXTURE_2D,BLANK);
    gl.uniform1f(U["uHas"+which],0);
    gl.uniform3fv(U["uSig"+which],s&&s.col?s.col:[.55,.58,.66]);
    return null;
  }
  var since=Math.max(0,t-(which==="A"?lockAt:pt));
  var zoom=1.045+(REDUCE?0:.045*smooth(since/(HOLD+2)));
  var fr=frameFor(s,zoom);
  gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,s.tex);
  gl.activeTexture(gl.TEXTURE1+unit);gl.bindTexture(gl.TEXTURE_2D,s.dtex);
  gl.uniform1f(U["uHas"+which],1);
  gl.uniform4fv(U["uFrm"+which],fr);
  gl.uniform1f(U["uFoc"+which],s.fdepth||.7);
  gl.uniform1f(U["uLod"+which],lodFor(s,fr));
  var fs=focalScreen(s,fr);
  gl.uniform2fv(U["uZc"+which],fs);
  var b=beatOf(s,t);
  gl.uniform1f(U["uZoom"+which],1+(s.zoom||0)*zoomOf(s,t));
  gl.uniform3fv(U["uSig"+which],s.col);
  gl.uniform1f(U["uBeat"+which],b);
  gl.uniform1f(U["uGlow"+which],s.glow||.6);
  return{fr:fr,fs:fs};
}
function render(t){
  if(!gl)return;
  if(txtDirty)uploadText();
  gl.viewport(0,0,W,H);
  gl.uniform2f(U.uRes,W,H);
  gl.uniform1i(U.uSteps,small()||QUAL<.8?12:20);
  gl.uniform1f(U.uTime,t);
  var amp=REDUCE?0:(portrait()?.034:.03);
  gl.uniform2f(U.uCam,cam[0]*amp,cam[1]*amp*.6);
  var la=setLayer(phase==="dead"?ghost:A,"A",t);
  var lb=setLayer(B,"B",t);
  var owner=phase==="reveal"?B:A,lo=phase==="reveal"?lb:la;
  gl.uniform1f(U.uMode,phase==="reveal"&&lb?1:0);
  gl.uniform1f(U.uLoss,phase==="boot"||!la?1:loss);
  gl.uniform1f(U.uWave,wave);
  gl.uniform2fv(U.uOrigin,lb?lb.fs:[.5,.4]);
  if(owner&&lo&&curWord&&phase!=="dead"&&W/H>=.9){
    var tr=textRect(owner,lo.fs);
    gl.uniform4fv(U.uTxtRect,tr);
    gl.uniform1f(U.uTxtDepth,owner.tdepth);
    gl.uniform1f(U.uTxtOn,1);
    gl.uniform1f(U.uTxtLod,Math.max(0,Math.log2(TW/(tr[2]*W))));
    gl.uniform3fv(U.uTxtTint,owner.col);
  }else gl.uniform1f(U.uTxtOn,0);
  gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,TXT_TEX);
  gl.drawArrays(gl.TRIANGLES,0,6);
}

/* Bildfrequenz im Blick: ist das Geraet zu langsam, rechnet der Empfaenger mit weniger Pixeln */
var perf={n:0,sum:0};
function frame(ts){
  running=false;
  if(!visible||document.hidden)return;
  var t=now();
  if(small()&&lastT&&t-lastT<1/32){schedule();return;}
  var dt=lastT?Math.min(.1,t-lastT):.016;lastT=t;
  update(t,dt);
  render(t);
  /* nur echte Bildabstaende werten: >0,1 s heisst gedrosselt (Hintergrund-Tab, Energiesparen), nicht "GPU zu langsam" */
  if(dt<.1){perf.n++;perf.sum+=dt;}
  if(perf.n>=90){
    var avg=perf.sum/perf.n;perf.n=perf.sum=0;
    if(avg>(small()?.05:.034)&&QUAL>.55){QUAL=Math.max(.55,QUAL*.8);resize();}
  }
  schedule();
}
function schedule(){if(!running&&visible&&!document.hidden&&MODE==="gl"&&!REDUCE){running=true;requestAnimationFrame(frame);}}
/* Ruhe-Modus (reduced motion): kein Dauerlauf -- gerechnet wird nur bei Zustandswechseln */
function kick(){
  if(!REDUCE){schedule();return;}
  var tries=0;
  (function step(){
    var t=now();update(t,.016);render(t);
    if(phase==="acquire"&&tries++<200)setTimeout(step,60);
  })();
}

/* ---------- CSS-Fassung (kein WebGL2) ---------- */
var MODE="gl",cssA=null,cssB=null,cssFront=0,cssTimer=null,cssTok=0;
function toCss(){
  MODE="css";hero.classList.add("nogl");
  var box=hero.querySelector(".rx-css");
  if(!box)return;
  cssA=box.children[0];cssB=box.children[1];
  if(phase==="boot"||!A){cssTune(LIVE[0]);}else cssTune(A);
}
function cssTune(s){
  f=s.fq;setNeedle();
  if(s.dead){
    hud(s);hero.classList.add("rx-static");
    if(elMsg){elMsg.textContent="["+s.fq.toFixed(1)+" FM] "+DEAD_LINES[Math.floor(Math.random()*DEAD_LINES.length)];elMsg.classList.add("show");}
    clearTimeout(cssTimer);
    if(!REDUCE)cssTimer=setTimeout(function(){auto=true;cssTune(nextLive(null,1));},6000);
    return;
  }
  if(elMsg)elMsg.classList.remove("show");
  hero.classList.add("rx-static");
  var tok=++cssTok;   /* ueberholte Ladevorgaenge verwerfen */
  load(s).then(function(){
    if(tok!==cssTok)return;
    var el=cssFront?cssA:cssB,other=cssFront?cssB:cssA;cssFront=1-cssFront;
    el.style.backgroundImage="url('"+s.imgUrl+"')";
    el.style.backgroundPosition=(s.focus[0]*100)+"% "+(s.focus[1]*100)+"%";
    other.classList.remove("on");el.classList.add("on");
    setTimeout(function(){hero.classList.remove("rx-static");},REDUCE?0:260);
    A=s;setWord(s.word,s.tls,s.tgap);hud(s);lockAt=now();hero.classList.add("rx-locked");
    clearTimeout(cssTimer);
    if(!REDUCE)cssTimer=setTimeout(function(){if(auto&&visible)cssTune(nextLive(A,1));else if(!auto)cssTimer=setTimeout(function(){auto=true;cssTune(nextLive(A,1));},30000);},HOLD*1000);
  },function(){});
}

/* ---------- Start ---------- */
function start(){
  if(!glInit()){toCss();}
  else{
    resize();
    window.addEventListener("resize",function(){resize();if(REDUCE)kick();});
  }
  hero.classList.add("rx-on");
  if(TEST&&/[?&]rxcss/.test(location.search)&&MODE==="gl"){gl=null;toCss();}
  if(TEST){testView(TEST[1]);return;}
  load(LIVE[0]).then(function(){if(MODE==="gl")kick();},function(){toCss();});
  /* Boot-Zeilen der Startseite abwarten (Ereignis aus dem Boot-Skript), spaetestens nach 2,4 s */
  function go(){booted=true;if(MODE==="gl")kick();}
  if(window.ECHO_BOOTED)go();
  else{document.addEventListener("echo:booted",go,{once:true});setTimeout(go,2400);}
  if(MODE==="gl")kick();
  /* Nur rechnen, solange der Empfaenger zu sehen ist */
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(es){
      visible=es[0].isIntersecting;
      if(visible){lastT=0;kick();}
    },{threshold:0}).observe(hero);
  }
  document.addEventListener("visibilitychange",function(){if(!document.hidden){lastT=0;kick();}});
  /* Schrift erst nach dem Laden ins Wort zeichnen */
  if(document.fonts&&document.fonts.load){
    document.fonts.load("400 100px 'Share Tech Mono'").then(function(){drawWord(curWord,wordProg);txtDirty=true;if(REDUCE)kick();});
  }
}
/* Pruefansicht, nur in der lokalen Vorschau (localhost/127.0.0.1, wie ?anomaly beim Boot): ein Zustand, einmal gerechnet --
   fuer Bildschirmfotos aus einem Headless-Browser, in dem requestAnimationFrame ruht. Auf der echten Seite wirkungslos.
   ?rx=drift[,sek][,camx,camy]  Sender eingerastet (sek nach dem Einrasten; Kamera -1..1)
   ?rx=reveal,pulse,0.4          Rekonstruktion bei 40 %
   ?rx=89.2  bzw. ?rx=99.0       tote bzw. leere Frequenz */
var TEST=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?/[?&]rx=([^&]+)/.exec(location.search):null;
/* Bild rechnen und zusaetzlich als <img> ablegen: Headless-Bildschirmfotos erwischen die WebGL-Leinwand sonst nicht */
function snap(){
  render(now());
  setTimeout(function(){
    render(now());
    try{var im=document.createElement("img");im.src=canvas.toDataURL("image/png");im.alt="";
      im.style.cssText="position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none";
      hero.insertBefore(im,canvas.nextSibling);}catch(e){}
  },250);
}
function testView(arg){
  var p=decodeURIComponent(arg).split(","),t=now();
  auto=false;lastUser=t+1e6;mouseAt=t+1e6;booted=started=true;
  var rev=p[0]==="reveal";if(rev)p.shift();
  var s=ST.filter(function(x){return x.key===p[0];})[0];
  if(!s){var fq=parseFloat(p[0]);if(isNaN(fq))return;f=fq;setNeedle();
    var na=nearestAny(fq);
    var d=na[1]<.15?na[0]:null;
    load(LIVE[0]).then(function(){if(d&&d.dead){deadIn(d);}else voidIn();loss=phase==="dead"?.84:1;if(MODE==="gl")snap();});
    return;}
  var fontP=document.fonts&&document.fonts.load?document.fonts.load("400 100px 'Share Tech Mono'"):Promise.resolve();
  Promise.all([load(s),fontP]).then(function(){
    f=s.fq;setNeedle();
    if(MODE!=="gl"){cssTune(s);return;}
    ensureTex(s);setWord(s.word,s.tls,s.tgap);wordProg=1;drawWord(s.word,1);txtDirty=true;hud(s);
    var x=parseFloat(p[2])||0,y=parseFloat(p[3])||0;cam[0]=camT[0]=x;cam[1]=camT[1]=y;
    if(rev){B=s;phase="reveal";var w=parseFloat(p[1])||.4;pt=t-w*REVEAL;wave=waveAt(w);}
    else{A=s;phase="idle";loss=0;lockAt=t-(parseFloat(p[1])||3);hero.classList.add("rx-locked");}
    snap();
  });
}
setNeedle();
start();

/* Schnittstelle: tune(f) fuer den Terminal-Befehl 'tune <freq>' (jede Frequenz des Bandes, tote und leere inklusive);
   step/state sind Pruefhilfen fuer eine verdeckte Vorschau, in der requestAnimationFrame ruht (Bild von Hand weiterdrehen). */
window.ECHO_RECEIVER={
  tune:function(fq){
    fq=clamp(Math.round(+fq*10)/10,87.5,108);userActed();
    var na=nearestAny(fq);
    var s=na[1]<.15?na[0]:{fq:fq,empty:true,dead:true};
    if(s.empty&&(MODE==="css"||REDUCE)){f=fq;setNeedle();voidIn();return fq;}
    tuneTo(s);return s.key||s.fq;
  },
  step:function(sec,n){n=n||1;for(var i=0;i<n;i++){toff+=sec;update(now(),sec);}render(now());return phase+" "+f.toFixed(1)+(A?" A="+A.key:"")+(B?" B="+B.key:"");},
  bench:function(n){if(!gl)return null;n=n||20;var t0=performance.now();var px=new Uint8Array(4);for(var i=0;i<n;i++){render(now());gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}return +((performance.now()-t0)/n).toFixed(2)+" ms/Bild bei "+W+"x"+H;},
  state:function(){return{phase:phase,f:f,A:A&&A.key,B:B&&B.key,loss:loss,wave:wave,mode:MODE,W:W,H:H,auto:auto,qual:QUAL};}
};
})();
