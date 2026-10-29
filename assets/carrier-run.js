/* ECHO VERSE -- "Carrier Run" (E1024, Idee D14 in 95_Management/IDEEN_WEBSITE.md).

   Endlosspiel mit eigener Mechanik: die Traegerin laeuft auf der Signalwelle, springt ueber Stille (Luecken) und Rauschen,
   und Sendertore oeffnen nur auf ihrer eigenen Frequenz -- mit 1-5 bzw. den Farbknoepfen schaltet man den Sender um
   (auf der Startseite schaltet der Empfaenger mit, bei Ton also auch die Musik). Jede Runde bringt je Kanal eine andere
   Traegerin (Owner-Entscheid Variante c): Haar, Frisur und Haut wechseln, Kanalfarbe und Merkmal bleiben (Kopfhoerer,
   Kappe, Sonne, Halo, Goldring). Keine Requests, kein Server; nur der eigene Rekord liegt im Browser (localStorage).
   Start: ECHO_CARRIER_RUN.open() -- von der toten Frequenz 108.0, dem Terminal-Befehl "run" und der 404-Seite. */
(function(){
"use strict";

/* ---------- Sprites (20x26, Raster mit fuehrenden Punkten; Entwurf vom 29.10.) ---------- */
var SW=20,SH=26;
function grid(rows,y0){var g=[];for(var i=0;i<rows.length;i++)g[y0+i]=rows[i];return g;}
var BODY=grid(["......kkkkkkkk","....kssssssssssk","....kssssssssssk","....ksEEssssEEsk","....kseWssssWesk","....kbssssssssbk",
  "....ksssssmssssk",".....kssssssssk","........kssk","....kccCccccCcck","...ksccccccccccsk","...ksccccaaccccsk",
  "...kkCCCCCCCCCCkk","....kCCCCCCCCCCk"],4);
var LEGS=[grid([".....kssk..kssk",".....kssk..kssk",".....kddk..kddk","....kdddk..kdddk","....kkkkk..kkkkk"],18),
          grid(["......kssk.kssk","......kssk..kssk",".....kddk...kddk","....kdddk...kdddk","....kkkk....kkkkk"],18)];
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
/* Traegerin dieser Runde fuer einen Kanal (Variante c) -- als kleines Bild vorgerendert, je Laufbild eins */
function carrier(c){
  var v={back:c.back,acc:c.acc,face:c.face,hair:pick(c.hairs),pal:P(c.pal)},sk=pick(SKIN),hc=pick(c.hc);
  v.pal.s=sk[0];v.pal.b=c.face==="android"?sk[0]:sk[1];v.pal.h=hc[0];v.pal.H=hc[1];
  return [0,1].map(function(fr){var cv=document.createElement("canvas");cv.width=SW+6;cv.height=SH+4;drawChar(cv.getContext("2d"),v,3,2,fr);return cv;});
}
function paint(x,g,pal,ox,oy){
  for(var y=0;y<SH;y++){var r=g[y];if(!r)continue;
    for(var i=0;i<r.length&&i<SW;i++){var ch=r.charAt(i);if(ch===".")continue;var c=pal[ch];if(!c)continue;x.fillStyle=c;x.fillRect(ox+i,oy+y,1,1);}}
}
function drawChar(x,v,ox,oy,fr){
  var cx=9.5+ox,cy=8.5+oy,yy,xx,d;
  if(v.back==="ring"){x.fillStyle=v.pal.g;for(yy=-2;yy<SH;yy++)for(xx=-2;xx<SW+2;xx++){d=Math.hypot(xx+.5-9.5,yy+.5-8.5);if(Math.abs(d-9.2)<.62)x.fillRect(ox+xx,oy+yy,1,1);}}
  if(v.back==="sun"){for(yy=0;yy<SH;yy++)for(xx=0;xx<SW;xx++){d=Math.hypot(xx+.5-14.2,yy+.5-6);if(d<5.2){var t=d/5.2;x.fillStyle=t<.55?"#FFD27A":t<.8?"#FFAE57":"#FF7A59";x.fillRect(ox+xx,oy+yy,1,1);}}}
  var hs=HAIR[v.hair];
  if(hs.back)paint(x,hs.back,v.pal,ox,oy);
  paint(x,BODY,v.pal,ox,oy);paint(x,LEGS[fr],v.pal,ox,oy);
  if(FACE[v.face])paint(x,FACE[v.face],v.pal,ox,oy);
  if(v.acc!=="cap")paint(x,hs.front,v.pal,ox,oy);
  if(v.acc)paint(x,ACC[v.acc],v.pal,ox,oy);
}

/* ---------- Spielwelt ---------- */
var GW=320,GH=180,GROUND=148,PX=52,VMAX=230;
var G=null;          /* Laufzeit-Objekt, erst beim Oeffnen */
var BEST_KEY="echo.carrierRun.best";
function bestGet(){try{return +(localStorage.getItem(BEST_KEY)||0);}catch(e){return 0;}}
function bestSet(v){try{localStorage.setItem(BEST_KEY,String(v));}catch(e){}}
function chByKey(k){for(var i=0;i<CH.length;i++)if(CH[i].key===k)return CH[i];return CH[0];}
function rcv(){return window.ECHO_RECEIVER||null;}

function build(){
  /* Handy hochkant: engerer Ausschnitt (220 statt 320 px) -- Figuren rund 1,5x groesser, Hoechsttempo etwas niedriger */
  GW=window.innerWidth<600?220:320;VMAX=GW<300?195:230;
  var ov=document.createElement("div");ov.className="cr";ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Carrier Run");
  ov.innerHTML=
    '<div class="cr-top"><span class="cr-st" id="crSt">95.3 FM // ECHO FREQUENCY</span><span class="cr-sc">SCORE <b id="crSc">0</b> · BEST <b id="crBest">0</b></span>'+
    '<button type="button" class="cr-x" id="crX" aria-label="Back to the archive">✕</button></div>'+
    '<div class="cr-stage"><canvas id="crCv" width="'+GW+'" height="'+GH+'"></canvas>'+
    '<div class="cr-msg" id="crMsg"></div></div>'+
    '<div class="cr-pad" id="crPad"></div>'+
    '<p class="cr-help" id="crHelp">SPACE / TAP jump (hold = higher) · 1–5 switch station · gates open only on their own frequency · M sound · ESC exit</p>';
  document.body.appendChild(ov);
  var pad=ov.querySelector("#crPad");
  CH.forEach(function(c,i){
    var b=document.createElement("button");b.type="button";b.className="cr-k";b.style.setProperty("--c",c.col);
    b.innerHTML="<span>"+(i+1)+"</span>"+c.fq;b.setAttribute("aria-label",c.name);
    b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();switchTo(i);});
    pad.appendChild(b);
  });
  var cv=ov.querySelector("#crCv");
  G={ov:ov,cv:cv,x:cv.getContext("2d"),msg:ov.querySelector("#crMsg"),st:ov.querySelector("#crSt"),sc:ov.querySelector("#crSc"),best:ov.querySelector("#crBest"),
     pad:pad,state:"ready",raf:0,lt:0};
  G.x.imageSmoothingEnabled=false;
  ov.querySelector("#crX").addEventListener("click",close);
  cv.addEventListener("pointerdown",function(e){e.preventDefault();press();});
  cv.addEventListener("pointerup",release);cv.addEventListener("pointercancel",release);
  G.msg.addEventListener("pointerdown",function(e){e.preventDefault();press();});
  /* Sterne und ferne Tuerme (Parallaxe) einmal wuerfeln */
  G.stars=[];for(var i=0;i<90;i++)G.stars.push([Math.random()*GW,Math.random()*(GROUND-30),Math.random()]);
  G.towers=[];for(var tx=0;tx<GW*3;){var w=8+Math.random()*18,h=18+Math.random()*52;G.towers.push([tx,w,h,Math.random()]);tx+=w+2+Math.random()*10;}
  window.addEventListener("resize",fit);
}
function fit(){
  if(!G)return;
  var aw=window.innerWidth*.96,ah=window.innerHeight-(window.innerWidth<700?190:150);
  var s=Math.min(aw/GW,ah/GH);if(s>=2)s=Math.floor(s);s=Math.max(1,s);
  G.cv.style.width=Math.round(GW*s)+"px";G.cv.style.height=Math.round(GH*s)+"px";
}

/* ---------- Runde ---------- */
function newRun(){
  G.carriers=CH.map(carrier);
  var r=rcv(),cur=r&&r.current?r.current():null,ci=0;
  for(var i=0;i<CH.length;i++)if(CH[i].key===cur)ci=i;
  G.ci=ci;G.flash=0;
  G.p={y:GROUND,vy:0,ground:true,coyote:0,buf:0,hold:false,frT:0,fr:0};
  G.dist=0;G.speed=92;G.t=0;G.frags=0;G.score=0;
  G.obs=[];G.nextX=GW+60;G.lastGate=-1e9;
  hudStation();G.sc.textContent="0";G.best.textContent=bestGet();
}
function hudStation(){var c=CH[G.ci];G.st.textContent=c.fq+" FM // "+c.name;G.ov.style.setProperty("--c",c.col);
  [].forEach.call(G.pad.children,function(b,i){b.classList.toggle("on",i===G.ci);});}
function switchTo(i){
  if(!G||i===G.ci||i<0||i>=CH.length)return;
  G.ci=i;G.flash=.16;hudStation();
  var r=rcv();if(r&&r.station)r.station(CH[i].key);   /* der Empfaenger schaltet mit (bei Ton: die Musik) */
  if(G.state==="ready")start();
}
function press(){
  if(!G)return;
  if(G.state==="ready"){start();}
  else if(G.state==="over"){if(G.t-G.overAt>.5){newRun();start();}return;}
  G.p.buf=.12;G.p.hold=true;
}
function release(){if(G)G.p.hold=false;}
function start(){G.state="run";G.msg.classList.remove("on");G.lt=0;}

/* Hindernisse: Stille (Luecke), Rauschwolke am Boden, Rauschband in Sprunghoehe (spaeter), Sendertor (ab 12 s) */
function spawn(){
  var sp=G.speed,x=G.nextX,o,r=Math.random(),gap=Math.max(118,sp*1.55)+Math.random()*sp*.9;
  if(G.t>12&&x-G.lastGate>sp*3.2&&r<.3){
    var k;do{k=Math.floor(Math.random()*CH.length);}while(k===G.ci&&Math.random()<.85);
    o={type:"gate",x:x,w:10,k:k};G.lastGate=x;gap+=sp*.5;
  }else if(r<.58){o={type:"gap",x:x,w:Math.min(26+sp*.18+Math.random()*sp*.16,74)};}
  else if(G.t>40&&r<.72){o={type:"band",x:x,w:22+Math.random()*16,y:GROUND-30-Math.random()*6,h:6};}
  else{o={type:"cloud",x:x,w:11+Math.floor(Math.random()*9),h:9+Math.floor(Math.random()*5)};}
  G.obs.push(o);
  /* Fragmente als Bogen ueber manchen Hindernissen */
  if(Math.random()<.45){for(var f=0;f<3;f++)G.obs.push({type:"frag",x:x+(o.w||8)/2-10+f*10,y:GROUND-26-[0,7,0][f]});}
  G.nextX=x+(o.w||0)+gap;
}
function groundAt(wx){for(var i=0;i<G.obs.length;i++){var o=G.obs[i];if(o.type==="gap"&&wx>o.x+2&&wx<o.x+o.w-2)return false;}return true;}

function step(dt){
  G.t+=dt;
  if(G.flash>0)G.flash-=dt;
  if(G.state!=="run")return;
  G.speed=Math.min(VMAX,92+G.t*2.4);
  var dx=G.speed*dt;G.dist+=dx;
  while(G.nextX<G.dist+GW+40)spawn();
  var p=G.p;
  /* Springen: Puffer + Koyote-Zeit, Halten = hoeher */
  p.buf-=dt;p.coyote-=dt;
  var feet=G.dist+PX+10,onG=p.y>=GROUND-.5&&p.y<=GROUND+2&&(groundAt(feet-4)||groundAt(feet+4));
  if(onG){p.coyote=.09;}
  if(p.buf>0&&p.coyote>0){p.vy=-232;p.coyote=0;p.buf=0;p.ground=false;}
  var g=p.vy<0&&p.hold?560:980;
  p.vy+=g*dt;p.y+=p.vy*dt;
  var over=groundAt(feet-4)||groundAt(feet+4);
  if(p.y>=GROUND&&p.vy>=0&&over&&p.y<GROUND+8){p.y=GROUND;p.vy=0;p.ground=true;}else p.ground=false;
  if(p.y>GH+30)return die("lost in the silence");
  /* Laufbild */
  p.frT+=dt*G.speed/92;if(p.frT>.13){p.frT=0;p.fr^=1;}
  /* Kollision (Trefferbox kleiner als die Figur) */
  var hx0=G.dist+PX+6,hx1=G.dist+PX+14,hy0=p.y-21,hy1=p.y-1;
  for(var i=G.obs.length-1;i>=0;i--){
    var o=G.obs[i];
    if(o.x+(o.w||4)<G.dist-20){G.obs.splice(i,1);continue;}
    if(o.type==="cloud"&&hx1>o.x+2&&hx0<o.x+o.w-2&&hy1>GROUND-o.h+2)return die("swallowed by static");
    if(o.type==="band"&&hx1>o.x+2&&hx0<o.x+o.w-2&&hy0<o.y+o.h&&hy1>o.y)return die("jumped into the noise");
    if(o.type==="gate"&&!o.done&&hx1>o.x&&hx0<o.x+o.w){if(o.k!==G.ci)return die("wrong frequency — gate "+CH[o.k].fq+" stayed shut");o.done=true;G.frags+=2;}
    if(o.type==="frag"&&!o.got&&hx1>o.x-2&&hx0<o.x+3&&hy0<o.y+3&&hy1>o.y-2){o.got=true;G.frags++;}
  }
  G.score=Math.floor(G.dist/8)+G.frags*25;
  G.sc.textContent=G.score;
}
function die(why){
  G.state="over";G.overAt=G.t;G.flash=.35;
  var best=bestGet(),rec=G.score>best;if(rec){bestSet(G.score);G.best.textContent=G.score;}
  G.msg.innerHTML='<b>SIGNAL LOST</b><span>…'+why+'</span><span>SCORE '+G.score+(rec?' · NEW RECORD':' · BEST '+best)+'</span><em>SPACE / TAP — run again</em>';
  G.msg.classList.add("on");
}

/* ---------- Zeichnen ---------- */
function rgba(hex,a){var n=parseInt(hex.slice(1),16);return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")";}
function draw(){
  var x=G.x,c=CH[G.ci],cam=G.dist,t=G.t,i;
  x.fillStyle="#020307";x.fillRect(0,0,GW,GH);
  /* Sterne */
  for(i=0;i<G.stars.length;i++){var s=G.stars[i],sx=((s[0]-cam*.03*s[2])%GW+GW)%GW;x.fillStyle="rgba(170,185,220,"+(.08+s[2]*.25)+")";x.fillRect(Math.floor(sx),Math.floor(s[1]),1,1);}
  /* ferne Tuerme mit wenigen Lichtern in Senderfarbe */
  var tw=GW*3;
  for(i=0;i<G.towers.length;i++){var T=G.towers[i],bx=((T[0]-cam*.18)%tw+tw)%tw-40;if(bx>GW||bx+T[1]<0)continue;
    x.fillStyle="#0a0d17";x.fillRect(Math.floor(bx),GROUND-T[2],Math.ceil(T[1]),T[2]);
    if(T[3]>.55){x.fillStyle=rgba(c.col,.35);x.fillRect(Math.floor(bx+3),GROUND-T[2]+6,1,1);x.fillRect(Math.floor(bx+T[1]-4),GROUND-T[2]+14,1,1);}}
  /* Signalwelle (Boden) */
  var beat=Math.exp(-((t*c.bpm/60)%1)*4);
  for(var sx2=0;sx2<GW;sx2++){
    var wx=cam+sx2;if(!groundAt(wx))continue;
    var wy=GROUND+Math.round(Math.sin(wx*.075+t*2)*1.2+Math.sin(wx*.21-t*3)*beat*1.4);
    x.fillStyle=rgba(c.col,.9);x.fillRect(sx2,wy,1,1);
    x.fillStyle=rgba(c.col,.16);x.fillRect(sx2,wy+1,1,GH-wy);
  }
  /* Hindernisse */
  for(i=0;i<G.obs.length;i++){var o=G.obs[i],ox=Math.floor(o.x-cam);if(ox>GW+10||ox+(o.w||4)<-10)continue;
    if(o.type==="cloud"){for(var n=0;n<o.w*o.h*.7;n++){var rx=Math.random()*o.w,ry=Math.random()*o.h;
        if((rx-o.w/2)*(rx-o.w/2)/(o.w*o.w/4)+(ry-o.h/2)*(ry-o.h/2)/(o.h*o.h/4)>1)continue;
        x.fillStyle="rgba(205,212,228,"+(.25+Math.random()*.6)+")";x.fillRect(ox+Math.floor(rx),GROUND-o.h+Math.floor(ry),1,1);}}
    else if(o.type==="band"){for(var m=0;m<o.w*3;m++){x.fillStyle="rgba(205,212,228,"+(.2+Math.random()*.5)+")";x.fillRect(ox+Math.floor(Math.random()*o.w),Math.floor(o.y+Math.random()*o.h),1,1);}}
    else if(o.type==="gate"){var gc=CH[o.k].col,open=o.k===G.ci;
      x.fillStyle=rgba(gc,open?.35:.95);x.fillRect(ox,GROUND-44,2,44);x.fillRect(ox+o.w-2,GROUND-44,2,44);x.fillRect(ox,GROUND-44,o.w,2);
      if(!open){for(var gy=GROUND-42;gy<GROUND;gy+=3){x.fillStyle=rgba(gc,.5+.3*Math.sin(t*12+gy));x.fillRect(ox+2,gy,o.w-4,1);}}
      x.fillStyle=gc;x.font="6px monospace";x.fillText((o.k+1)+"·"+CH[o.k].fq,ox-6,GROUND-48);}
    else if(o.type==="frag"&&!o.got){x.fillStyle=rgba(c.col,.95);x.fillRect(ox,o.y-1,1,3);x.fillRect(ox-1,o.y,3,1);}
    else if(o.type==="gap"&&ox>-60){x.fillStyle="rgba(139,147,168,.35)";x.font="5px monospace";if(o.w>40)x.fillText("SILENCE",ox+o.w/2-10,GROUND+12);}
  }
  /* Traegerin */
  var p=G.p,img=G.carriers[G.ci][p.ground?p.fr:1];
  x.drawImage(img,PX-2,Math.round(p.y-25));
  /* Senderwechsel / Verlust: kurzes Rauschen */
  if(G.flash>0){var k2=Math.min(1,G.flash/.16);for(var q=0;q<900*k2;q++){x.fillStyle="rgba(220,226,240,"+Math.random()*.5+")";x.fillRect(Math.floor(Math.random()*GW),Math.floor(Math.random()*GH),1,1);}}
}
function loop(ts){
  if(!G||!G.open)return;
  var t=ts/1000,dt=G.lt?Math.min(.033,t-G.lt):.016;G.lt=t;
  if(!document.hidden){step(dt);draw();}
  G.raf=requestAnimationFrame(loop);
}

/* ---------- Tasten (Erfassungsphase: das Spiel bekommt sie vor Empfaenger und Terminal) ---------- */
function onKey(e){
  if(!G||!G.open)return;
  var k=e.key;
  if(k==="Escape"){e.preventDefault();e.stopPropagation();close();return;}
  if(k===" "||k==="ArrowUp"||k==="w"||k==="W"){e.preventDefault();e.stopPropagation();if(!e.repeat)press();return;}
  if(k>="1"&&k<="5"&&k.length===1){e.preventDefault();e.stopPropagation();switchTo(+k-1);return;}
  if((k==="m"||k==="M")&&rcv()&&rcv().listen){e.preventDefault();e.stopPropagation();var r=rcv();r.listen(!r.state().au.on);return;}
  e.stopPropagation();
}
function onKeyUp(e){if(!G||!G.open)return;if(e.key===" "||e.key==="ArrowUp"||e.key==="w"||e.key==="W"){release();e.stopPropagation();}}
function onVis(){if(G&&G.open)G.lt=0;}

function open(){
  if(!G)build();
  if(G.open)return;
  G.open=true;G.ov.classList.add("on");document.body.classList.add("cr-on");
  var r=rcv();if(r&&r.pause)r.pause(true);   /* Empfaenger rechnet nicht mit, die Musik laeuft weiter */
  fit();newRun();G.state="ready";
  G.msg.innerHTML='<b>CARRIER RUN</b><span>the archive is sending. keep the carrier alive.</span><span>jump the silence · dodge the static · gates open only on their own frequency</span><em>SPACE / TAP — start'+(r&&r.listen?' · M — sound':'')+'</em>';
  G.msg.classList.add("on");
  window.addEventListener("keydown",onKey,true);window.addEventListener("keyup",onKeyUp,true);
  document.addEventListener("visibilitychange",onVis);
  G.lt=0;G.raf=requestAnimationFrame(loop);
}
function close(){
  if(!G||!G.open)return;
  G.open=false;cancelAnimationFrame(G.raf);
  G.ov.classList.remove("on");document.body.classList.remove("cr-on");
  window.removeEventListener("keydown",onKey,true);window.removeEventListener("keyup",onKeyUp,true);
  document.removeEventListener("visibilitychange",onVis);
  var r=rcv();if(r&&r.pause)r.pause(false);
}

/* Stil einmal einhaengen (Startseite und 404 teilen dieses Modul) */
var css=document.createElement("style");
css.textContent=
".cr{position:fixed;inset:0;z-index:120;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:12px 8px;"+
"background:rgba(2,3,7,.94);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:'Share Tech Mono',ui-monospace,monospace;color:#dfe4f0;--c:#22D3EE;touch-action:none}"+
".cr.on{display:flex}body.cr-on{overflow:hidden}"+
".cr-top{display:flex;align-items:center;gap:14px;width:min(960px,96vw);font-size:.66rem;letter-spacing:.18em;color:#8b93a8}"+
".cr-st{color:var(--c);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cr-sc b{color:#dfe4f0;font-weight:400}"+
".cr-x{background:none;border:1px solid rgba(160,180,220,.2);color:#8b93a8;width:32px;height:32px;border-radius:2px;cursor:pointer;font:inherit}.cr-x:hover{color:#fff}"+
".cr-stage{position:relative;line-height:0}"+
".cr canvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges;border:1px solid rgba(160,180,220,.14);border-bottom-color:var(--c);border-radius:2px;cursor:pointer}"+
".cr-msg{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:.7em;text-align:center;line-height:1.5;padding:12px;background:rgba(2,3,7,.55);cursor:pointer}"+
".cr-msg.on{display:flex}.cr-msg b{font-weight:400;font-size:clamp(1rem,3.4vw,1.6rem);letter-spacing:.3em;color:var(--c);text-shadow:0 0 18px var(--c)}"+
".cr-msg span{font-size:.66rem;letter-spacing:.12em;color:#a9b0c2}.cr-msg em{font-style:normal;font-size:.62rem;letter-spacing:.2em;color:#dfe4f0;margin-top:.4em}"+
".cr-pad{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}"+
".cr-k{--c:#22D3EE;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:54px;padding:6px 8px;background:rgba(4,6,11,.6);border:1px solid rgba(160,180,220,.18);border-bottom:2px solid var(--c);border-radius:2px;color:#8b93a8;font:inherit;font-size:.6rem;letter-spacing:.1em;cursor:pointer;touch-action:manipulation}"+
".cr-k span{color:var(--c);font-size:.8rem}.cr-k.on{color:#fff;background:rgba(255,255,255,.06);box-shadow:0 0 14px -4px var(--c)}"+
".cr-help{font-size:.58rem;letter-spacing:.1em;color:#565e72;text-align:center;max-width:96vw}"+
"@media (hover:none){.cr-help{display:none}.cr-k{min-width:60px;padding:10px 8px}}";
document.head.appendChild(css);

window.ECHO_CARRIER_RUN={open:open,close:close};
/* Pruefhilfe nur lokal: Spielzeit von Hand weiterdrehen (die Vorschau der Claude-App haelt Animations-Frames an) */
if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname))window.ECHO_CARRIER_RUN.test={
  step:function(dt,n){for(var i=0;i<(n||1);i++)step(dt);draw();return this.state();},
  press:press,release:release,switchTo:switchTo,
  state:function(){return G?{state:G.state,t:+G.t.toFixed(2),dist:Math.round(G.dist),speed:Math.round(G.speed),y:Math.round(G.p.y),ci:CH[G.ci].key,
    score:G.score,frags:G.frags,obs:G.obs.map(function(o){return o.type+"@"+Math.round(o.x-G.dist)+(o.type==="gate"?":"+CH[o.k].key:"");}).slice(0,8),msg:G.msg.textContent.slice(0,60)}:null;}
};
})();
