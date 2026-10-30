/* ECHO VERSE -- "Carrier Run" (E1024, Idee D14 in 95_Management/IDEEN_WEBSITE.md).

   Endlosspiel mit eigener Mechanik: die Traegerin laeuft auf der Signalwelle, springt ueber Stille (Luecken) und Rauschen,
   und Sendertore oeffnen nur auf ihrer eigenen Frequenz: kurz davor leuchtet im Spielfeld ein Kaestchen mit dem Gesicht
   der Traegerin auf (Owner-Idee Quicktime-Event); Zahl druecken oder Kaestchen antippen, bevor es erlischt, schaltet den Sender
   (Figur, Farbe und Chiptune wechseln mit; auf der Startseite stellt sich auch der Empfaenger um). Jede Runde bringt je
   Kanal eine andere Traegerin (Owner-Entscheid Variante c): Haar, Frisur und Haut wechseln, Kanalfarbe und Merkmal bleiben
   (Kopfhoerer, Kappe, Sonne, Halo, Goldring).

   Feinschliff nach Owner-Test (30.10.): Tore sind volle Sperren mit Ansage und Lehr-Zeitlupe ("man bleibt da immer haengen"),
   gerechnet wird in voller Bildschirmaufloesung, die Figuren laufen durch Scale2x ("arg zu pixelig ... klobig"),
   Soundeffekte und je Kanal ein eigener Chiptune aus WebAudio ("es fehlen soundeffekte bzw. hintergrundmusik").
   Ton startet erst mit dem ersten Druck im Spiel; ein laufender Live Carrier pausiert solange.
   Keine Requests, kein Server; nur der eigene Rekord liegt im Browser (localStorage).
   Start: ECHO_CARRIER_RUN.open() -- von der toten Frequenz 108.0, dem Terminal-Befehl "run" und der 404-Seite. */
(function(){
"use strict";

/* ---------- Sprites (20x26, Raster mit fuehrenden Punkten; Entwurf vom 29.10.)
   Gezeichnete Figuren mit erwachsenen Proportionen wurden am 30.10. probiert, Owner: "gefallen wir net - wir bleiben beim alten design". */
var SW=20,SH=26;
function grid(rows,y0){var g=[];for(var i=0;i<rows.length;i++)g[y0+i]=rows[i];return g;}
var BODY=grid(["......kkkkkkkk","....kssssssssssk","....kssssssssssk","....ksEEssssEEsk","....kseWssssWesk","....kbssssssssbk",
  "....ksssssmssssk",".....kssssssssk","........kssk","....kccCccccCcck","...ksccccccccccsk","...ksccccaaccccsk",
  "...kkCCCCCCCCCCkk","....kCCCCCCCCCCk"],4);
/* Beine: 0/1 Schritt, 2 Durchgang, 3 Sprung (angezogen) */
var LEGS=[grid([".....kssk..kssk",".....kssk..kssk",".....kddk..kddk","....kdddk..kdddk","....kkkkk..kkkkk"],18),
          grid(["......kssk.kssk","......kssk..kssk",".....kddk...kddk","....kdddk...kdddk","....kkkk....kkkkk"],18),
          grid(["......ksssk","......ksssk",".......kddk","......kdddk","......kkkkk"],18),
          grid([".....kssk.kssk",".....kddk.kddk","....kdddk.kdddk","....kkkkk.kkkkk"],18)];
var FACE={closed:grid(["....kssssssssssk","....kskksssskksk"],7),android:grid(["....kssssssssssk","....kskksssskksk","....kossssssssok"],7)};
var HAIR={
  short:{front:grid(["......kkkkkkkk",".....khhhhhhhhk","....khhhHHhhhhhk","....khhhhhhhhhhk","....kh........hk","....kh........hk"],3)},
  bob:{front:grid(["......kkkkkkkk",".....khhhhhhhhk","....khhHHhhhhhhk","...khhhhhhhhhhhhk","...khh........hhk","...khh........hhk",
    "...khh........hhk","...khh........hhk","...kkk........kkk"],3)},
  long:{back:grid([".....khhhhhhhhk","...khhhhhhhhhhhhk","...khhhhhhhhhhhhk","...khhhhhhhhhhhhk","...khhhhhhhhhhhhk","...khhhhhhhhhhhhk",
    "...khhhhhhhhhhhhk","...khhhhhhhhhhhhk",".khhh..........hhhk",".khhh..........hhhk",".khhh..........hhhk",".khhh..........hhhk",
    ".kHhh..........hhHk",".kkk............kkk"],4),
    front:grid(["......kkkkkkkk",".....khhhhhhhhk","....khhhHHhhhhhk","....khhhhhhhhhhk","....kh........hk","....kh........hk",
    "....kh........hk","....kh........hk","....kh........hk"],3)}
};
var ACC={
  phones:grid(["......PPPPPPPP",".....P........P",".....P........P","","...PP..........PP","...PQ..........QP","...PP..........PP"],2),
  cap:grid(["......kkkkkkkk",".....kppppppppk","....kppppqqppppk","....kqqqqqqqqqqqkkk"],2),
  halo:grid(["......oooooooo",".....o........o","......oooooooo"],0)
};
var BASE={k:"#0B0B14",s:"#F8D2B8",b:"#F1A4A0",m:"#B9505A",W:"#FFFFFF",E:"#0B0B14",d:"#262838"};
function P(o){var p={},k;for(k in BASE)p[k]=BASE[k];for(k in o)p[k]=o[k];return p;}
var CH=[
  {key:"frequency",fq:"95.3",name:"ECHO FREQUENCY",col:"#22D3EE",bpm:100,acc:"phones",face:"open",hairs:["short","bob","long"],
   pal:P({c:"#22D3EE",C:"#0E7490",a:"#F0ABFC",e:"#22D3EE",P:"#E879F9",Q:"#22D3EE"}),
   hc:[["#24204F","#5A55A8"],["#E879F9","#FBCFE8"],["#0E7490","#67E8F9"],["#3B3366","#7C73C9"]]},
  {key:"drift",fq:"97.1",name:"ECHO DRIFT",col:"#FF2D9B",bpm:140,acc:"cap",face:"open",hairs:["long","short"],
   pal:P({c:"#1E1B2B",C:"#121019",a:"#FF2D9B",e:"#FF2D9B",p:"#FF2D9B",q:"#B3176B",d:"#FF2D9B"}),
   hc:[["#3A2F52","#6E5C94"],["#FF2D9B","#FF9ACD"],["#F5F5F5","#FFFFFF"],["#7C2D12","#C2410C"]]},
  {key:"pulse",fq:"100.4",name:"ECHO PULSE",col:"#7C5CFF",bpm:122,acc:null,back:"sun",face:"open",hairs:["bob","short","long"],
   pal:P({c:"#7C5CFF",C:"#5636D6",a:"#FFD27A",e:"#7C5CFF"}),
   hc:[["#4A2E22","#8A5A3C"],["#C2410C","#FB923C"],["#1F1B3A","#5B4FA8"],["#F5D0A9","#FFF1DC"]]},
  {key:"vigil",fq:"106.5",name:"ECHO VIGIL",col:"#FF9E3D",bpm:132,acc:"halo",face:"android",hairs:["long","short","bob"],
   pal:P({c:"#24201E",C:"#141110",a:"#FF9E3D",e:"#FF9E3D",o:"#FF9E3D"}),
   hc:[["#C9CCD6","#F1F3F8"],["#57534E","#A8A29E"],["#7C2D12","#FF9E3D"],["#E7E5E4","#FFFFFF"]]},
  {key:"aurora",fq:"107.9",name:"ECHO AURORA",col:"#F5F2EA",bpm:130,acc:null,back:"ring",face:"open",hairs:["long","bob","short"],
   pal:P({c:"#F5F2EA",C:"#CFC6B4",a:"#F5C542",e:"#E0A928",g:"#F5C542",k:"#1A1612"}),
   hc:[["#F4F1EA","#FFE9A8"],["#FDE68A","#FFF7D6"],["#E9D5FF","#FAF5FF"],["#CBD5E1","#F8FAFC"]]}
];
var SKIN=[["#F8D2B8","#F1A4A0"],["#EDBE9A","#E59A8C"],["#C98F69","#C77B6E"],["#8E5B3F","#A0614F"],["#F3DDD0","#F0B9B0"]];
function pick(a){return a[Math.floor(Math.random()*a.length)];}

/* Scale2x (EPX): rundet Treppen ab, ohne die Figur zu verwischen -- zweimal angewandt = 4-fache Aufloesung */
function scale2x(src){
  var w=src.width,h=src.height,s=src.getContext("2d").getImageData(0,0,w,h).data;
  var o=document.createElement("canvas");o.width=w*2;o.height=h*2;
  var c=o.getContext("2d"),d=c.createImageData(w*2,h*2),D=d.data;
  function at(x,y){x=x<0?0:x>=w?w-1:x;y=y<0?0:y>=h?h-1:y;return (y*w+x)*4;}
  function eq(a,b){return s[a]===s[b]&&s[a+1]===s[b+1]&&s[a+2]===s[b+2]&&s[a+3]===s[b+3];}
  function put(x,y,i){var j=(y*w*2+x)*4;D[j]=s[i];D[j+1]=s[i+1];D[j+2]=s[i+2];D[j+3]=s[i+3];}
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    var E=at(x,y),B=at(x,y-1),Dn=at(x-1,y),F=at(x+1,y),H=at(x,y+1),e0=E,e1=E,e2=E,e3=E;
    if(!eq(B,H)&&!eq(Dn,F)){
      if(eq(Dn,B))e0=Dn;
      if(eq(B,F))e1=F;
      if(eq(Dn,H))e2=Dn;
      if(eq(H,F))e3=F;
    }
    put(x*2,y*2,e0);put(x*2+1,y*2,e1);put(x*2,y*2+1,e2);put(x*2+1,y*2+1,e3);
  }
  c.putImageData(d,0,0);return o;
}
/* Traegerin dieser Runde fuer einen Kanal (Variante c): vier Bein-Stellungen, jede auf 4-fache Aufloesung gerechnet */
function carrier(c){
  var v={back:c.back,acc:c.acc,face:c.face,hair:pick(c.hairs),pal:P(c.pal)},sk=pick(SKIN),hc=pick(c.hc);
  v.pal.s=sk[0];v.pal.b=c.face==="android"?sk[0]:sk[1];v.pal.h=hc[0];v.pal.H=hc[1];
  return [0,1,2,3].map(function(fr){
    var cv=document.createElement("canvas");cv.width=SW+6;cv.height=SH+4;
    drawChar(cv.getContext("2d",{willReadFrequently:true}),v,3,2,fr);
    return scale2x(scale2x(cv));
  });
}
function paint(x,g,pal,ox,oy){
  for(var y=0;y<SH;y++){var r=g[y];if(!r)continue;
    for(var i=0;i<r.length&&i<SW;i++){var ch=r.charAt(i);if(ch===".")continue;var c=pal[ch];if(!c)continue;x.fillStyle=c;x.fillRect(ox+i,oy+y,1,1);}}
}
function drawChar(x,v,ox,oy,fr){
  var yy,xx,d;
  if(v.back==="ring"){x.fillStyle=v.pal.g;for(yy=-2;yy<SH;yy++)for(xx=-2;xx<SW+2;xx++){d=Math.hypot(xx+.5-9.5,yy+.5-8.5);if(Math.abs(d-9.2)<.62)x.fillRect(ox+xx,oy+yy,1,1);}}
  if(v.back==="sun"){for(yy=0;yy<SH;yy++)for(xx=0;xx<SW;xx++){d=Math.hypot(xx+.5-14.2,yy+.5-6);if(d<5.2){var t=d/5.2;x.fillStyle=t<.55?"#FFD27A":t<.8?"#FFAE57":"#FF7A59";x.fillRect(ox+xx,oy+yy,1,1);}}}
  var hs=HAIR[v.hair];
  if(hs.back)paint(x,hs.back,v.pal,ox,oy);
  paint(x,BODY,v.pal,ox,oy);paint(x,LEGS[fr],v.pal,ox,oy);
  if(FACE[v.face])paint(x,FACE[v.face],v.pal,ox,oy);
  if(v.acc!=="cap")paint(x,hs.front,v.pal,ox,oy);
  if(v.acc)paint(x,ACC[v.acc],v.pal,ox,oy);
}

/* ---------- Ton: Effekte und je Kanal ein Chiptune (WebAudio, keine Dateien) ----------
   Eigene Kompositionen im Stil des Kanals, keine Umsetzungen echter Songs: Rechteck/Puls/Dreieck/Rauschen wie auf alten
   Konsolen. Ein 64-Schritte-Raster (4 Takte in 16teln) laeuft durch; beim Senderwechsel tauscht nur das Muster, der Takt
   bleibt. Akkorde: [Grundton MIDI, Typ]; arp/bass = Muster je 16 Schritte; lead = [Schritt, MIDI, Laenge]. */
var CHORD={m:[0,3,7,12],M:[0,4,7,12],m7:[0,3,7,10],M7:[0,4,7,11]};
var THEME=[
  {bpm:100,chords:[[57,"m"],[53,"M"],[60,"M"],[55,"M"]],kick:[0,8],snare:[4,12],hat:[0,2,4,6,8,10,12,14],
   bass:[1,0,1,0,1,0,1,1,1,0,1,0,1,0,2,0],arp:[0,1,2,3,2,1,0,1,0,1,2,3,2,1,0,1],arpW:"pulse",
   lead:[[0,76,6],[6,74,2],[8,72,4],[12,69,4],[16,72,6],[22,74,2],[24,76,8],[32,79,6],[38,76,2],[40,72,8],[48,74,6],[54,71,2],[56,67,8]]},
  {bpm:140,chords:[[48,"m"],[48,"m"],[44,"M"],[43,"m"]],kick:[0,3,6,10,11],snare:[8],hat:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
   bass:[1,0,0,1,0,0,1,0,0,0,1,1,0,0,0,0],arp:[],arpW:"pulse",leadW:"thin",
   lead:[[0,72,2],[3,75,2],[6,79,2],[8,77,2],[11,75,2],[14,72,2],[16,72,2],[19,75,2],[22,79,2],[24,80,3],[28,79,3],[32,72,2],[35,75,2],[38,79,2],[40,77,2],[43,75,2],[46,72,2],[48,67,2],[51,70,2],[54,74,2],[56,75,4],[60,74,4]]},
  {bpm:122,chords:[[50,"m7"],[55,"m7"],[58,"M7"],[57,"m7"]],kick:[0,4,8,12],snare:[4,12],hat:[2,6,10,14],
   bass:[0,0,1,1,0,0,1,0,0,0,1,1,0,0,2,0],arp:[],stab:[3,6,11],arpW:"pulse",leadW:"tri",
   lead:[[0,74,8],[12,77,4],[16,79,8],[28,77,4],[32,81,8],[44,79,4],[48,76,12]]},
  {bpm:132,chords:[[41,"m"],[41,"m"],[41,"m"],[44,"M"]],kick:[0,4,8,12],snare:[],hat:[2,6,10,14],
   bass:[0,1,1,1,0,1,1,1,0,1,1,1,0,1,2,1],arp:[],stab:[6,14],arpW:"pulse",leadW:"tri",
   lead:[[0,77,14],[16,80,14],[32,77,14],[48,75,14]]},
  {bpm:130,chords:[[62,"m"],[58,"M"],[65,"M"],[60,"M"]],kick:[0,4,8,12],snare:[4,12],hat:[2,6,10,14],
   bass:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],arp:[0,1,2,3,0,1,2,3,1,2,3,2,1,2,3,2],arpW:"square",
   lead:[[0,81,8],[8,77,8],[16,82,8],[24,77,8],[32,84,8],[40,81,8],[48,79,16]]}
];
var SND={ctx:null,master:null,noise:null,thin:null,duty:null,on:true,timer:null,next:0,step:0,playing:false};
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
function sndInit(){
  if(SND.ctx)return true;
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    var c=SND.ctx=new AC();
    var comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=5;comp.connect(c.destination);
    SND.master=c.createGain();SND.master.gain.value=SND.on?.42:0;SND.master.connect(comp);
    var n=c.sampleRate,buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=Math.random()*2-1;
    SND.noise=buf;
    SND.duty=pulseWave(c,.25);SND.thin=pulseWave(c,.125);
    return true;
  }catch(e){return false;}
}
/* Pulswelle mit Tastgrad d (Fourier-Reihe) -- der typische NES-Klang */
function pulseWave(c,d){
  var N=32,re=new Float32Array(N),im=new Float32Array(N);
  for(var i=1;i<N;i++)im[i]=(2/(i*Math.PI))*Math.sin(i*Math.PI*d);
  return c.createPeriodicWave(re,im);
}
function tone(t,f,dur,kind,vol,slideTo){
  var c=SND.ctx,o=c.createOscillator(),g=c.createGain();
  if(kind==="pulse")o.setPeriodicWave(SND.duty);else if(kind==="thin")o.setPeriodicWave(SND.thin);else o.type=kind==="tri"?"triangle":kind;
  o.frequency.setValueAtTime(f,t);
  if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);
  g.gain.setValueAtTime(vol,t+Math.max(.005,dur*.5));g.gain.linearRampToValueAtTime(0,t+dur);
  o.connect(g);g.connect(SND.master);o.start(t);o.stop(t+dur+.01);
}
function noiseHit(t,dur,vol,hp){
  var c=SND.ctx,s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();
  s.buffer=SND.noise;f.type="highpass";f.frequency.value=hp;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(SND.master);s.start(t,Math.random()*.5);s.stop(t+dur+.01);
}
function playStep(i,t,sd){
  var T=THEME[G.ci],s16=i%16,bar=Math.floor(i/16)%4,ch=T.chords[bar],tones=CHORD[ch[1]],k;
  var has=function(a){return a&&a.indexOf(s16)>=0;};
  if(has(T.kick))tone(t,150,.11,"tri",.5,45);
  if(has(T.snare))noiseHit(t,.11,.2,1800);
  if(has(T.hat)&&G.t>2)noiseHit(t,.03,.06,7000);
  var b=T.bass[s16];
  if(b)tone(t,mtof(ch[0]-24+(b===2?12:0)),sd*1.7,"tri",.3);
  if(G.t>4&&T.arp.length&&T.arp[s16]>=0)tone(t,mtof(ch[0]+12+tones[T.arp[s16]]),sd*.85,T.arpW,.07);
  if(has(T.stab))for(k=0;k<3;k++)tone(t,mtof(ch[0]+12+tones[k]),sd*1.4,"pulse",.05);
  if(G.t>9)for(k=0;k<T.lead.length;k++){var L=T.lead[k];if(L[0]===i)tone(t,mtof(L[1]),sd*L[2]*.9,T.leadW||"pulse",.1);}
}
function sched(){
  if(!SND.ctx||!SND.playing||!G)return;
  /* gedrosselter Timer (Hintergrund-Tab): nicht alle verpassten Schritte auf einmal nachholen */
  if(SND.next<SND.ctx.currentTime-.05)SND.next=SND.ctx.currentTime+.05;
  while(SND.next<SND.ctx.currentTime+.14){
    var sd=60/THEME[G.ci].bpm/4;
    playStep(SND.step,SND.next,sd);
    SND.next+=sd;SND.step=(SND.step+1)%64;
  }
}
function musicStart(){
  if(!sndInit())return;
  if(SND.ctx.state==="suspended")SND.ctx.resume();
  SND.step=0;SND.next=SND.ctx.currentTime+.06;SND.playing=true;
  if(!SND.timer)SND.timer=setInterval(sched,30);
}
function musicStop(){SND.playing=false;if(SND.timer){clearInterval(SND.timer);SND.timer=null;}}
/* Effekte: alle kurz, im Klang der Musik */
function sfx(n){
  if(!SND.ctx||!SND.on)return;
  var t=SND.ctx.currentTime+.005;
  if(n==="jump")tone(t,330,.13,"pulse",.13,760);
  else if(n==="frag"){tone(t,988,.05,"pulse",.1);tone(t+.05,1319,.1,"pulse",.1);}
  else if(n==="switch"){noiseHit(t,.09,.14,2500);tone(t+.02,523,.05,"square",.07);tone(t+.07,784,.07,"square",.07);}
  else if(n==="gate"){tone(t,523,.08,"pulse",.1);tone(t+.08,659,.08,"pulse",.1);tone(t+.16,784,.14,"pulse",.1);}
  else if(n==="qte"){tone(t,880,.07,"pulse",.09);tone(t+.09,880,.07,"pulse",.09);}
  else if(n==="miss"){tone(t,196,.16,"square",.09,120);}
  else if(n==="lost"){noiseHit(t,.5,.3,500);tone(t,440,.5,"square",.13,55);}
}
function soundToggle(){
  SND.on=!SND.on;
  if(SND.master&&SND.ctx)SND.master.gain.setTargetAtTime(SND.on?.42:0,SND.ctx.currentTime,.02);
  if(G&&G.mute){G.mute.textContent=SND.on?"♪":"×♪";G.mute.setAttribute("aria-pressed",SND.on?"false":"true");}
}

/* ---------- Spielwelt (Logik in 320x180 bzw. 220x180, gezeichnet in voller Aufloesung) ---------- */
var GW=320,GH=180,GROUND=148,PX=52,VMAX=230,R=3,QS=32,LEGSEQ=[0,2,1,2];
var G=null;          /* Laufzeit-Objekt, erst beim Oeffnen */
var BEST_KEY="echo.carrierRun.best";
var TOUCH=window.matchMedia&&window.matchMedia("(hover:none)").matches;
function bestGet(){try{return +(localStorage.getItem(BEST_KEY)||0);}catch(e){return 0;}}
function bestSet(v){try{localStorage.setItem(BEST_KEY,String(v));}catch(e){}}
function rcv(){return window.ECHO_RECEIVER||null;}

function build(){
  /* Handy hochkant: engerer Ausschnitt (220 statt 320) -- Figuren rund 1,5x groesser, Hoechsttempo etwas niedriger */
  GW=window.innerWidth<600?220:320;VMAX=GW<300?195:230;
  var ov=document.createElement("div");ov.className="cr";ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Carrier Run");
  ov.innerHTML=
    '<div class="cr-top"><span class="cr-st" id="crSt">95.3 FM // ECHO FREQUENCY</span><span class="cr-sc">SCORE <b id="crSc">0</b> · BEST <b id="crBest">0</b></span>'+
    '<button type="button" class="cr-x" id="crMute" aria-label="Sound on or off" aria-pressed="false">♪</button>'+
    '<button type="button" class="cr-x" id="crX" aria-label="Back to the archive">✕</button></div>'+
    '<div class="cr-stage"><canvas id="crCv" width="'+GW+'" height="'+GH+'"></canvas>'+
    '<div class="cr-msg" id="crMsg"></div></div>'+
    '<p class="cr-help" id="crHelp">SPACE / TAP jump (hold = higher) · a box lights up before each gate: press its number or tap it before it fades · M sound · ESC exit</p>';
  document.body.appendChild(ov);
  var cv=ov.querySelector("#crCv");
  G={ov:ov,cv:cv,x:cv.getContext("2d"),msg:ov.querySelector("#crMsg"),st:ov.querySelector("#crSt"),sc:ov.querySelector("#crSc"),best:ov.querySelector("#crBest"),
     mute:ov.querySelector("#crMute"),state:"ready",raf:0,lt:0};
  ov.querySelector("#crX").addEventListener("click",close);
  G.mute.addEventListener("click",soundToggle);
  cv.addEventListener("pointerdown",function(e){e.preventDefault();
    var r=cv.getBoundingClientRect(),q=G.qte;
    /* Treffer aufs Kaestchen schaltet den Sender, sonst springt die Traegerin */
    if(q&&q.state==="on"&&G.state==="run"){var lx=(e.clientX-r.left)/r.width*GW,ly=(e.clientY-r.top)/r.height*GH;
      if(lx>q.x-QS/2-7&&lx<q.x+QS/2+7&&ly>q.y-QS/2-7&&ly<q.y+QS/2+7){answer(q.k);return;}}
    press();});
  cv.addEventListener("pointerup",release);cv.addEventListener("pointercancel",release);
  G.msg.addEventListener("pointerdown",function(e){e.preventDefault();press();});
  G.msg.addEventListener("pointerup",release);
  /* Sterne und zwei Reihen ferner Tuerme (Parallaxe) einmal wuerfeln */
  G.stars=[];for(var i=0;i<120;i++)G.stars.push([Math.random()*GW,Math.random()*(GROUND-20),Math.random(),Math.random()*6.28]);
  function towers(minH,maxH){var a=[],tx=0;while(tx<GW*3){var w=8+Math.random()*20,h=minH+Math.random()*(maxH-minH),l=[];
      for(var n=0;n<h/5;n++)if(Math.random()<.32)l.push([1.5+Math.random()*(w-3),3+Math.random()*(h-5)]);
      a.push({x:tx,w:w,h:h,l:l});tx+=w+1+Math.random()*9;}return a;}
  G.far=towers(26,70);G.near=towers(14,44);
  window.addEventListener("resize",fit);
}
/* Anzeigegroesse festlegen und die Leinwand in echten Bildschirmpixeln rechnen -- daher scharf statt klobig */
function fit(){
  if(!G)return;
  var aw=window.innerWidth*.96,ah=window.innerHeight-(window.innerWidth<700?120:110);
  var s=Math.max(1,Math.min(aw/GW,ah/GH));
  G.cv.style.width=Math.round(GW*s)+"px";G.cv.style.height=Math.round(GH*s)+"px";
  R=Math.min(4,Math.max(2,Math.ceil(s*(window.devicePixelRatio||1))));
  G.cv.width=GW*R;G.cv.height=GH*R;
}

/* ---------- Runde ---------- */
function newRun(){
  G.carriers=CH.map(carrier);
  var r=rcv(),cur=r&&r.current?r.current():null,ci=0;
  for(var i=0;i<CH.length;i++)if(CH[i].key===cur)ci=i;
  G.ci=ci;G.flash=0;G.ts=1;G.qte=null;G.nextGateT=12;
  G.p={y:GROUND,vy:0,ground:true,coyote:0,buf:0,hold:false,frT:0,fr:0};
  G.dist=0;G.speed=92;G.t=0;G.frags=0;G.score=0;G.gates=0;G.pop=[];
  G.obs=[];G.nextX=GW+60;
  G.teach=bestGet()<800;     /* Zeitlupe am ersten Tor, bis der Rekord zeigt, dass man es kennt */
  hudStation();G.sc.textContent="0";G.best.textContent=bestGet();
}
function hudStation(){var c=CH[G.ci];G.st.textContent=c.fq+" FM // "+c.name;G.ov.style.setProperty("--c",c.col);}
function switchTo(i){
  if(!G||i===G.ci||i<0||i>=CH.length)return;
  G.ci=i;G.flash=.14;hudStation();sfx("switch");
  var r=rcv();if(r&&r.station)r.station(CH[i].key);
}
/* Quicktime: richtige Zahl bzw. Kaestchen getroffen -- Sender schaltet, Tor oeffnet. Schnell = PERFECT */
function answer(k){
  var q=G&&G.qte;if(!q||q.state!=="on"||G.state!=="run")return;
  if(k!==q.k){sfx("miss");return;}
  var fast=q.left/q.T>.55;
  q.state="hit";q.fx=.35;switchTo(q.k);
  G.frags+=fast?4:2;G.pop.push({x:q.x,y:q.y-QS/2-3,s:fast?"PERFECT +100":"+50",t:.8,d:.8});
}
function press(){
  if(!G)return;
  if(G.state==="ready"){start();}
  else if(G.state==="over"){if(G.t-G.overAt>.5){newRun();start();}return;}
  G.p.buf=.12;G.p.hold=true;
}
function release(){if(G)G.p.hold=false;}
function start(){G.state="run";G.msg.classList.remove("on");G.lt=0;musicStart();}

/* Hindernisse: Stille (Luecke), Rauschwolke am Boden, Rauschband in Sprunghoehe (ab 40 s), Sendertor (ab 12 s) */
function spawn(){
  var sp=G.speed,x=G.nextX,o,r=Math.random(),gap=Math.max(118,sp*1.55)+Math.random()*sp*.9;
  if(G.t>=G.nextGateT){
    var k;do{k=Math.floor(Math.random()*CH.length);}while(k===G.ci);
    o={type:"gate",x:x,w:12,k:k};G.nextGateT=G.t+10+Math.random()*5;gap+=sp*.5;   /* Owner: "bissl arg oft" -- alle 10-15 s statt etwa 8 */
  }else if(r<.58){o={type:"gap",x:x,w:Math.min(26+sp*.18+Math.random()*sp*.16,74)};}
  else if(G.t>40&&r<.72){o={type:"band",x:x,w:22+Math.random()*16,y:GROUND-30-Math.random()*6,h:6};}
  else{o={type:"cloud",x:x,w:12+Math.floor(Math.random()*9),h:10+Math.floor(Math.random()*5)};}
  G.obs.push(o);
  if(o.type!=="gate"&&Math.random()<.45){for(var f=0;f<3;f++)G.obs.push({type:"frag",x:x+(o.w||8)/2-10+f*10,y:GROUND-28-[0,7,0][f]});}
  G.nextX=x+(o.w||0)+gap;
}
function groundAt(wx){for(var i=0;i<G.obs.length;i++){var o=G.obs[i];if(o.type==="gap"&&wx>o.x+2&&wx<o.x+o.w-2)return false;}return true;}
function nextGate(){var b=null;for(var i=0;i<G.obs.length;i++){var o=G.obs[i];if(o.type==="gate"&&!o.done&&o.x+o.w>G.dist+PX&&(!b||o.x<b.x))b=o;}return b;}

function step(dt){
  G.t+=dt;
  if(G.flash>0)G.flash-=dt;
  for(var q=G.pop.length-1;q>=0;q--){G.pop[q].t-=dt;if(G.pop[q].t<=0)G.pop.splice(q,1);}
  if(G.state!=="run")return;
  /* Quicktime: vor jedem Tor ein Kaestchen; das Fenster schrumpft mit der Zeit, beim ersten Tor Zeitlupe */
  var ng=nextGate(),q=G.qte;
  if(ng&&!ng.asked&&ng.k!==G.ci&&!q){
    var lead=ng.x-(G.dist+PX+14),win=Math.max(1,1.75-G.t*.005);
    if(lead<G.speed*win){ng.asked=true;
      q=G.qte={k:ng.k,T:win-.15,left:win-.15,state:"on",fx:0,x:GW*(.42+Math.random()*.42),y:34+Math.random()*50};sfx("qte");}
  }
  var slow=G.teach&&G.gates===0&&q&&q.state==="on";
  G.ts+=((slow?.22:1)-G.ts)*Math.min(1,dt*7);
  dt*=G.ts;
  if(q){
    if(q.state==="on"){q.left-=dt;if(q.left<=0){q.state="miss";q.fx=.4;sfx("miss");}}
    else{q.fx-=dt;if(q.fx<=0)G.qte=null;}
  }
  G.speed=Math.min(VMAX,92+G.t*2.4);
  var dx=G.speed*dt;G.dist+=dx;
  while(G.nextX<G.dist+GW+40)spawn();
  var p=G.p;
  /* Springen: Puffer + Koyote-Zeit, Halten = hoeher */
  p.buf-=dt;p.coyote-=dt;
  var feet=G.dist+PX+10,onG=p.y>=GROUND-.5&&p.y<=GROUND+2&&(groundAt(feet-4)||groundAt(feet+4));
  if(onG)p.coyote=.09;
  if(p.buf>0&&p.coyote>0){p.vy=-232;p.coyote=0;p.buf=0;p.ground=false;sfx("jump");}
  var g=p.vy<0&&p.hold?560:980;
  p.vy+=g*dt;p.y+=p.vy*dt;
  var over=groundAt(feet-4)||groundAt(feet+4);
  if(p.y>=GROUND&&p.vy>=0&&over&&p.y<GROUND+8){p.y=GROUND;p.vy=0;p.ground=true;}else p.ground=false;
  if(p.y>GH+30)return die("lost in the silence");
  /* Laufbild */
  p.frT+=dt*G.speed/92;if(p.frT>.085){p.frT=0;p.fr=(p.fr+1)%4;}
  /* Kollision (Trefferbox kleiner als die Figur) */
  var hx0=G.dist+PX+6,hx1=G.dist+PX+14,hy0=p.y-21,hy1=p.y-1;
  for(var i=G.obs.length-1;i>=0;i--){
    var o=G.obs[i];
    if(o.x+(o.w||4)<G.dist-20){G.obs.splice(i,1);continue;}
    if(o.type==="cloud"&&hx1>o.x+2&&hx0<o.x+o.w-2&&hy1>GROUND-o.h+2)return die("swallowed by static");
    if(o.type==="band"&&hx1>o.x+2&&hx0<o.x+o.w-2&&hy0<o.y+o.h&&hy1>o.y)return die("jumped into the noise");
    if(o.type==="gate"&&!o.done&&hx1>o.x&&hx0<o.x+o.w){
      if(o.k!==G.ci)return die("the box faded — gate "+CH[o.k].fq+" stayed shut");
      o.done=true;G.gates++;sfx("gate");}
    if(o.type==="frag"&&!o.got&&hx1>o.x-2&&hx0<o.x+3&&hy0<o.y+3&&hy1>o.y-2){o.got=true;G.frags++;sfx("frag");G.pop.push({x:PX+14,y:p.y-30,s:"+25",t:.5,d:.5});}
  }
  G.score=Math.floor(G.dist/8)+G.frags*25;
  G.sc.textContent=G.score;
}
function die(why){
  G.state="over";G.overAt=G.t;G.flash=.35;G.qte=null;
  musicStop();sfx("lost");
  var best=bestGet(),rec=G.score>best;if(rec){bestSet(G.score);G.best.textContent=G.score;}
  G.msg.innerHTML='<b>SIGNAL LOST</b><span>…'+why+'</span><span>SCORE '+G.score+(rec?' · NEW RECORD':' · BEST '+best)+'</span><em>'+(TOUCH?'TAP':'SPACE / TAP')+' — run again</em>';
  G.msg.classList.add("on");
}

/* ---------- Zeichnen ---------- */
function rgba(hex,a){var n=parseInt(hex.slice(1),16);return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")";}
function layer(x,list,par,cam,base,col,glow,c){
  var tw=GW*3,i;
  for(i=0;i<list.length;i++){var T=list[i],bx=((T.x-cam*par)%tw+tw)%tw-30;if(bx>GW||bx+T.w<0)continue;
    x.fillStyle=col;x.fillRect(bx,base-T.h,T.w,T.h);
    x.fillStyle=rgba(c,glow);for(var l=0;l<T.l.length;l++)x.fillRect(bx+T.l[l][0],base-T.h+T.l[l][1],.8,1.1);}
}
function draw(){
  var x=G.x,c=CH[G.ci],cam=G.dist,t=G.t,i;
  x.setTransform(R,0,0,R,0,0);
  /* Himmel: Nacht, am Horizont das Licht des Senders */
  x.fillStyle="#03040a";x.fillRect(0,0,GW,GH);   /* deckend: sonst addiert sich der durchscheinende Himmel Bild fuer Bild auf */
  var sky=x.createLinearGradient(0,50,0,GROUND);sky.addColorStop(0,rgba(c.col,0));sky.addColorStop(1,rgba(c.col,.2));
  x.fillStyle=sky;x.fillRect(0,50,GW,GROUND-50);
  for(i=0;i<G.stars.length;i++){var s=G.stars[i],sx=((s[0]-cam*.02*s[2])%GW+GW)%GW;
    x.fillStyle="rgba(190,205,235,"+(.1+s[2]*.35+Math.sin(t*1.4+s[3])*.1).toFixed(3)+")";x.fillRect(sx,s[1],.7,.7);}
  layer(x,G.far,.07,cam,GROUND,"#0a0f1c",.26,c.col);
  layer(x,G.near,.18,cam,GROUND,"#070b15",.5,c.col);
  /* Signalwelle: mehrere weiche Linien, faellt an der Stille ab */
  var beat=Math.exp(-((t*c.bpm/60)%1)*4),gaps=[];
  for(i=0;i<G.obs.length;i++)if(G.obs[i].type==="gap")gaps.push(G.obs[i]);
  function edge(wx){var d=1e9;for(var k=0;k<gaps.length;k++){var g=gaps[k];d=Math.min(d,Math.abs(wx-g.x),Math.abs(wx-(g.x+g.w)));}return d;}
  function wave(wx,off){var d=edge(wx),drop=d<10?(1-d/10)*(1-d/10)*12:0;
    return GROUND+off+Math.sin(wx*.075+t*2+off)*1.3+Math.sin(wx*.21-t*3)*beat*1.6+drop;}
  /* Bodenflaeche */
  var segs=[],open=null,sx2;
  for(sx2=0;sx2<=GW;sx2+=1.5){var on=groundAt(cam+sx2);if(on&&!open){open=[sx2,sx2];segs.push(open);}else if(on)open[1]=sx2;else open=null;}
  var fill=x.createLinearGradient(0,GROUND,0,GH);fill.addColorStop(0,rgba(c.col,.26));fill.addColorStop(1,rgba(c.col,.02));
  segs.forEach(function(sg){
    x.beginPath();x.moveTo(sg[0],GH);
    for(var q=sg[0];q<=sg[1];q+=1.5)x.lineTo(q,wave(cam+q,0));
    x.lineTo(sg[1],GH);x.closePath();x.fillStyle=fill;x.fill();
    [[9,.1,.6],[4.5,.24,.6],[0,.2,3.2],[0,1,.9]].forEach(function(L){
      x.beginPath();for(var q2=sg[0];q2<=sg[1];q2+=1.5){var y=wave(cam+q2,L[0]);if(q2===sg[0])x.moveTo(q2,y);else x.lineTo(q2,y);}
      x.strokeStyle=rgba(c.col,L[1]);x.lineWidth=L[2];x.lineJoin="round";x.stroke();});
  });
  /* Hindernisse */
  x.textAlign="center";
  for(i=0;i<G.obs.length;i++){var o=G.obs[i],ox=o.x-cam;if(ox>GW+12||ox+(o.w||4)<-12)continue;
    if(o.type==="cloud"){
      var cx=ox+o.w/2,cy=GROUND-o.h/2+1,rg=x.createRadialGradient(cx,cy,1,cx,cy,o.w*.75);
      rg.addColorStop(0,"rgba(190,200,222,.28)");rg.addColorStop(1,"rgba(190,200,222,0)");x.fillStyle=rg;x.fillRect(cx-o.w,cy-o.w,o.w*2,o.w*2);
      for(var n=0;n<o.w*o.h*1.4;n++){var a=Math.random()*6.28,r2=Math.sqrt(Math.random());
        x.fillStyle="rgba(228,233,245,"+(.3+Math.random()*.65).toFixed(2)+")";x.fillRect(cx+Math.cos(a)*r2*o.w*.55,cy+Math.sin(a)*r2*o.h*.55,.6,.6);}}
    else if(o.type==="band"){
      x.fillStyle="rgba(190,200,222,.14)";x.fillRect(ox,o.y-2,o.w,o.h+4);
      for(var m=0;m<o.w*5;m++){x.fillStyle="rgba(228,233,245,"+(.25+Math.random()*.6).toFixed(2)+")";x.fillRect(ox+Math.random()*o.w,o.y+Math.random()*o.h,.6,.6);}}
    else if(o.type==="gate"){drawGate(x,o,ox,t);}
    else if(o.type==="frag"&&!o.got){
      var fy=o.y+Math.sin(t*5+o.x)*1.2,fx=ox+.5;
      x.fillStyle=rgba(c.col,.22);x.beginPath();x.arc(fx,fy,3.4,0,6.3);x.fill();
      x.fillStyle="#fff";x.beginPath();x.moveTo(fx,fy-2.2);x.lineTo(fx+1.5,fy);x.lineTo(fx,fy+2.2);x.lineTo(fx-1.5,fy);x.closePath();x.fill();}
    else if(o.type==="gap"&&o.w>38){x.fillStyle="rgba(139,147,168,.55)";x.font="5px 'Share Tech Mono',monospace";x.fillText("S I L E N C E",ox+o.w/2,GROUND+13);}
  }
  /* Traegerin: Schatten, Bild mit Schein in Senderfarbe */
  var p=G.p,imgs=G.carriers[G.ci],img=p.ground||G.state==="ready"?imgs[LEGSEQ[p.fr]]:imgs[3];
  if(p.ground){x.fillStyle="rgba(0,0,0,.4)";x.beginPath();x.ellipse(PX+10,GROUND+1,8,1.6,0,0,6.3);x.fill();}
  var bob=p.ground&&G.state==="run"?(p.fr%2?-.5:0):0;
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
  x.shadowColor=rgba(c.col,.55);x.shadowBlur=3*R;
  x.drawImage(img,PX-2,p.y-25+bob,SW+6,SH+4);
  x.shadowBlur=0;
  /* Punkte-Einblendung */
  x.font="7px 'Share Tech Mono',monospace";
  for(i=0;i<G.pop.length;i++){var u=G.pop[i],k=u.t/u.d;x.fillStyle=rgba(c.col,k.toFixed(2));x.fillText(u.s,u.x,u.y-(1-k)*10);}
  if(G.qte)drawQte(x,G.qte,t);
  /* Senderwechsel / Verlust: kurzes Rauschen */
  if(G.flash>0){var k2=Math.min(1,G.flash/.14),cnt=Math.floor(700*k2);
    for(var q=0;q<cnt;q++){x.fillStyle="rgba(225,230,244,"+(Math.random()*.5).toFixed(2)+")";x.fillRect(Math.random()*GW,Math.random()*GH,.8,.8);}}
  /* leichte Vignette */
  var v=x.createRadialGradient(GW/2,GH/2,GH*.5,GW/2,GH/2,GW*.72);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.5)");x.fillStyle=v;x.fillRect(0,0,GW,GH);
}
/* Quicktime-Kaestchen: Gesicht der Traegerin, Rand laeuft ab wie eine Uhr, zuletzt flackert es */
function drawQte(x,q,t){
  var c=CH[q.k],k=q.state==="on"?Math.max(0,q.left/q.T):0,X=q.x-QS/2,Y=q.y-QS/2,fx=q.state==="on"?1:Math.max(0,q.fx/(q.state==="hit"?.35:.4));
  if(q.state==="on"&&k<.28&&Math.sin(t*38)<-.2)return;
  x.save();x.globalAlpha=q.state==="on"?1:fx;
  if(q.state==="hit"){var gr=(1-fx)*12;x.strokeStyle=c.col;x.lineWidth=1.2;x.strokeRect(X-gr,Y-gr,QS+2*gr,QS+2*gr);}
  x.fillStyle="rgba(2,3,7,.82)";x.fillRect(X,Y,QS,QS);
  /* Kopf der Traegerin aus dem Laufbild */
  var img=G.carriers[q.k][0],sw=img.width,cw=sw*.7;
  x.save();x.beginPath();x.rect(X+1,Y+1,QS-2,QS-2);x.clip();
  if(q.state==="miss")x.globalAlpha=fx*.4;
  x.drawImage(img,(sw-cw)/2,0,cw,cw,X+1.5,Y+1.5,QS-3,QS-3);x.restore();
  /* Zeitrand */
  x.strokeStyle=rgba(c.col,.25);x.lineWidth=1;x.strokeRect(X,Y,QS,QS);
  if(q.state==="on"){var per=QS*4;x.strokeStyle=c.col;x.lineWidth=1.6;x.setLineDash([per*k,per]);x.shadowColor=c.col;x.shadowBlur=2.5*R;
    x.strokeRect(X,Y,QS,QS);x.setLineDash([]);x.shadowBlur=0;}
  /* Zahl bzw. Hinweis */
  x.font="11px 'Share Tech Mono',monospace";x.textAlign="center";
  if(!TOUCH){x.fillStyle="rgba(2,3,7,.85)";x.fillRect(X+QS-10,Y+QS-12,10,12);x.fillStyle=c.col;x.fillText(String(q.k+1),X+QS-5,Y+QS-2.5);}
  if(q.state==="on"&&G.teach&&G.gates===0){x.font="7px 'Share Tech Mono',monospace";x.fillStyle="#fff";
    x.fillText(TOUCH?"TAP THE BOX":"PRESS "+(q.k+1),q.x,Y+QS+9);}
  x.restore();
}
/* Sendertor: reicht bis an den oberen Rand -- darueber kommt man nicht, nur der richtige Sender macht es auf */
function drawGate(x,o,ox,t){
  var c=CH[o.k],open=o.k===G.ci||o.done,cx=ox+o.w/2;
  if(!open){
    var f=x.createLinearGradient(ox,0,ox+o.w,0);f.addColorStop(0,rgba(c.col,.5));f.addColorStop(.5,rgba(c.col,.14));f.addColorStop(1,rgba(c.col,.5));
    x.fillStyle=f;x.fillRect(ox,0,o.w,GROUND+1);
    for(var y=(t*46)%6-6;y<GROUND;y+=6){x.fillStyle=rgba(c.col,.55);x.fillRect(ox,y,o.w,.7);}
  }
  x.fillStyle=rgba(c.col,open?.3:.25);x.fillRect(ox-1.5,0,2.6,GROUND+1);x.fillRect(ox+o.w-1.1,0,2.6,GROUND+1);
  x.fillStyle=rgba(c.col,open?.45:1);x.fillRect(ox-.6,0,.9,GROUND+1);x.fillRect(ox+o.w-.3,0,.9,GROUND+1);
  /* Schild: Tastennummer gross, Frequenz darunter */
  x.fillStyle="rgba(2,3,7,.82)";x.beginPath();x.arc(cx,40,10,0,6.3);x.fill();
  x.strokeStyle=rgba(c.col,open?.4:1);x.lineWidth=1;x.beginPath();x.arc(cx,40,10,0,6.3);x.stroke();
  x.fillStyle=rgba(c.col,open?.5:1);x.font="13px 'Share Tech Mono',monospace";x.fillText(open?"✓":String(o.k+1),cx,44.5);
  x.font="6.5px 'Share Tech Mono',monospace";x.fillStyle="rgba(2,3,7,.8)";x.fillRect(cx-12,53,24,8.5);
  x.fillStyle=rgba(c.col,open?.5:1);x.fillText(c.fq,cx,59.5);
}
function loop(ts){
  if(!G||!G.open)return;
  var t=ts/1000,dt=G.lt?Math.min(.033,t-G.lt):.016;G.lt=t;
  if(!document.hidden){if(!G.frozen)step(dt);draw();}
  G.raf=requestAnimationFrame(loop);
}

/* ---------- Tasten (Erfassungsphase: das Spiel bekommt sie vor Empfaenger und Terminal) ---------- */
function onKey(e){
  if(!G||!G.open)return;
  var k=e.key;
  if(k==="Escape"){e.preventDefault();e.stopPropagation();close();return;}
  if(k===" "||k==="ArrowUp"||k==="w"||k==="W"){e.preventDefault();e.stopPropagation();if(!e.repeat)press();return;}
  if(k>="1"&&k<="5"&&k.length===1){e.preventDefault();e.stopPropagation();answer(+k-1);return;}
  if(k==="m"||k==="M"){e.preventDefault();e.stopPropagation();soundToggle();return;}
  e.stopPropagation();
}
function onKeyUp(e){if(!G||!G.open)return;if(e.key===" "||e.key==="ArrowUp"||e.key==="w"||e.key==="W"){release();e.stopPropagation();}}
function onVis(){if(!G||!G.open)return;G.lt=0;
  if(document.hidden){if(G.state==="run")musicStop();}else if(G.state==="run"&&!SND.playing)musicStart();}

function open(){
  if(!G)build();
  if(G.open)return;
  G.open=true;G.ov.classList.add("on");document.body.classList.add("cr-on");
  var r=rcv();
  if(r&&r.pause)r.pause(true);   /* Empfaenger rechnet nicht mit */
  /* Live Carrier pausiert, solange der Chiptune laeuft; beim Schliessen geht er weiter */
  G.wasOn=!!(r&&r.state&&r.state().au.on);if(G.wasOn)r.listen(false);
  fit();newRun();G.state="ready";
  G.msg.innerHTML='<b>CARRIER RUN</b><span>the archive is sending. keep the carrier alive.</span><span>jump the silence · dodge the static · when a box lights up, hit it before it fades</span><em>'+(TOUCH?'TAP — start':'SPACE / TAP — start · M — sound')+'</em>';
  G.msg.classList.add("on");
  window.addEventListener("keydown",onKey,true);window.addEventListener("keyup",onKeyUp,true);
  document.addEventListener("visibilitychange",onVis);
  G.lt=0;draw();G.raf=requestAnimationFrame(loop);
}
function close(){
  if(!G||!G.open)return;
  G.open=false;cancelAnimationFrame(G.raf);musicStop();
  G.ov.classList.remove("on");document.body.classList.remove("cr-on");
  window.removeEventListener("keydown",onKey,true);window.removeEventListener("keyup",onKeyUp,true);
  document.removeEventListener("visibilitychange",onVis);
  var r=rcv();if(r&&r.pause)r.pause(false);
  if(G.wasOn&&r)r.listen(true);
}

/* Stil einmal einhaengen (Startseite und 404 teilen dieses Modul) */
var css=document.createElement("style");
css.textContent=
".cr{position:fixed;inset:0;z-index:120;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:12px 8px;"+
"background:rgba(2,3,7,.95);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:'Share Tech Mono',ui-monospace,monospace;color:#dfe4f0;--c:#22D3EE;touch-action:none}"+
".cr.on{display:flex}body.cr-on{overflow:hidden}"+
".cr-top{display:flex;align-items:center;gap:10px;width:min(960px,96vw);font-size:.66rem;letter-spacing:.18em;color:#8b93a8}"+
".cr-st{color:var(--c);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cr-sc{white-space:nowrap}.cr-sc b{color:#dfe4f0;font-weight:400}"+
".cr-x{flex:none;background:none;border:1px solid rgba(160,180,220,.2);color:#8b93a8;width:32px;height:32px;border-radius:2px;cursor:pointer;font:inherit}.cr-x:hover{color:#fff}"+
".cr-stage{position:relative;line-height:0}"+
".cr canvas{display:block;border:1px solid rgba(160,180,220,.14);border-bottom-color:var(--c);border-radius:3px;cursor:pointer;box-shadow:0 0 40px -14px var(--c)}"+
".cr-msg{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:.7em;text-align:center;line-height:1.5;padding:12px;background:rgba(2,3,7,.5);cursor:pointer}"+
".cr-msg.on{display:flex}.cr-msg b{font-weight:400;font-size:clamp(1rem,3.4vw,1.6rem);letter-spacing:.3em;color:var(--c);text-shadow:0 0 18px var(--c)}"+
".cr-msg span{font-size:.66rem;letter-spacing:.12em;color:#c3c9d8}.cr-msg em{font-style:normal;font-size:.62rem;letter-spacing:.2em;color:#fff;margin-top:.4em}"+
".cr-help{font-size:.58rem;letter-spacing:.1em;color:#565e72;text-align:center;max-width:96vw}"+
"@media (hover:none){.cr-help{display:none}}";
document.head.appendChild(css);

window.ECHO_CARRIER_RUN={open:open,close:close};
/* Pruefhilfe nur lokal: Spielzeit von Hand weiterdrehen (die Vorschau der Claude-App haelt Animations-Frames an) */
if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname))window.ECHO_CARRIER_RUN.test={
  step:function(dt,n){for(var i=0;i<(n||1);i++)step(dt);draw();return this.state();},
  press:press,release:release,answer:answer,sfx:sfx,freeze:function(on){G.frozen=on!==false;},
  sound:function(){return {ctx:SND.ctx&&SND.ctx.state,playing:SND.playing,on:SND.on,step:SND.step};},
  state:function(){return G?{state:G.state,t:+G.t.toFixed(2),dist:Math.round(G.dist),speed:Math.round(G.speed),y:Math.round(G.p.y),ci:CH[G.ci].key,ts:+G.ts.toFixed(2),R:R,qte:G.qte&&{k:G.qte.k,state:G.qte.state,left:+G.qte.left.toFixed(2),x:Math.round(G.qte.x),y:Math.round(G.qte.y)},
    score:G.score,frags:G.frags,gates:G.gates,obs:G.obs.filter(function(o){return o.type!=="frag";}).map(function(o){return o.type+"@"+Math.round(o.x-G.dist)+(o.type==="gate"?":"+CH[o.k].key:"");}).slice(0,6),msg:G.msg.textContent.slice(0,70)}:null;}
};
})();
