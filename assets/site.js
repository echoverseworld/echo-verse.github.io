/* ECHO VERSE -- gemeinsames Verhalten der Unterseiten (Archiv, Codex, Sendungs-Seiten, Dateiliste).
   Navigation (oben durchsichtig, beim Scrollen mit Hintergrund), Sendezaehler im Footer, Erscheinen beim Scrollen
   und das Entschluesseln von Text (Zeichen laufen von Zufall auf Klartext, wie die Kanalnamen der Startseite).
   Hier wird nichts gezaehlt und nichts gespeichert. */
(function(){
  var reduce=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var G="#%&@*+=/<>?0123456789ABCDEFXZ";
  /* Pruefansicht nur lokal: ?still schaltet die Erscheinen-Effekte ab (Headless-Fotos) */
  if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&/[?&]still\b/.test(location.search))document.documentElement.classList.add("still");

  /* Text unterhalb von root entschluesseln: der Klartext laeuft als Welle von vorn nach hinten durch alle
     Textknoten (Auszeichnungen bleiben erhalten). done() kommt am Ende, auch bei "Bewegung reduzieren". */
  function decode(root,ms,done){
    if(reduce||!root||!document.createTreeWalker){if(done)done();return;}
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,nodes=[],total=0;
    while((n=w.nextNode())){
      if(!n.nodeValue||!n.nodeValue.trim())continue;
      nodes.push({n:n,t:n.nodeValue,o:total});total+=n.nodeValue.length;
    }
    if(!total){if(done)done();return;}
    var t0=performance.now();
    (function step(){
      var k=(performance.now()-t0)/ms;
      for(var j=0;j<nodes.length;j++){
        var x=nodes[j];
        if(k>=1){x.n.nodeValue=x.t;continue;}
        var s=x.t,o="";
        for(var i=0;i<s.length;i++){
          var c=s.charAt(i);
          o+=(c===" "||c==="\n"||c==="\t"||k*1.3>(x.o+i)/total+.3)?c:G.charAt(Math.floor(Math.random()*G.length));
        }
        x.n.nodeValue=o;
      }
      if(k<1)setTimeout(step,45);else if(done)done();
    })();
  }
  window.ECHO_DECODE=decode;
  window.ECHO_REDUCE=reduce;

  var nav=document.getElementById("topnav");
  if(nav){
    var solid=function(){nav.classList.toggle("solid",(window.scrollY||window.pageYOffset)>24);};
    solid();window.addEventListener("scroll",solid,{passive:true});
  }

  /* Tage seit dem ersten Signal (06.07.2026) -- rein gerechnet */
  var tx=document.getElementById("txSince");
  if(tx){
    var d=Math.floor((Date.now()-Date.UTC(2026,6,6))/864e5);
    if(d>0){tx.textContent="STILL TRANSMITTING — "+d+" DAYS SINCE FIRST SIGNAL";tx.title="first signal: 2026-07-06";}
  }

  /* Titel mit data-decode entschluesseln sich beim Laden */
  var heads=document.querySelectorAll("[data-decode]");
  for(var h=0;h<heads.length;h++)decode(heads[h],900);

  var els=document.querySelectorAll(".reveal");
  if(!els.length)return;
  if(!("IntersectionObserver" in window)){for(var e=0;e<els.length;e++)els[e].classList.add("in");return;}
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target);}});
  },{threshold:.12});
  for(var r=0;r<els.length;r++)io.observe(els[r]);
})();
