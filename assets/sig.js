/* ECHO VERSE -- Sendungs-Seiten (sig/*.html).
   1) Player: nichts wird von YouTube geladen, bevor jemand klickt (gleiche Regel wie auf der Startseite).
   2) Zeitleiste und Tracklist zeigen gemeinsam auf denselben Titel (Maus oder Fokus); ein Klick auf einen
      Balken oeffnet den Titel bei YouTube an seiner Stelle, wie der Zeitstempel in der Liste.
   Navigation, Sendezaehler und Erscheinen kommen aus site.js. Hier wird nichts gezaehlt oder gespeichert. */
(function(){
  var p=document.querySelector(".player[data-yt]");
  if(p){
    var face=p.querySelector(".player-face");
    if(face)face.addEventListener("click",function(){
      var f=document.createElement("iframe");
      f.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(p.getAttribute("data-yt"))+"?autoplay=1&rel=0";
      f.title=face.getAttribute("data-title")||"ECHO transmission";
      f.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.referrerPolicy="strict-origin-when-cross-origin";
      f.allowFullscreen=true;
      p.innerHTML="";
      p.appendChild(f);
    });
  }

  var tl=document.querySelector(".tl"),list=document.querySelector(".tracks");
  if(!tl||!list)return;
  var bars=tl.querySelectorAll("i"),rows=list.querySelectorAll("li"),hot=-1;
  function set(k){
    if(k===hot)return;
    if(hot>=0){if(bars[hot])bars[hot].classList.remove("hot");if(rows[hot])rows[hot].classList.remove("hot");}
    hot=k;
    if(k>=0){if(bars[k])bars[k].classList.add("hot");if(rows[k])rows[k].classList.add("hot");}
  }
  function rowK(e){var li=e.target.closest&&e.target.closest("li[data-k]");return li?+li.getAttribute("data-k"):-1;}
  list.addEventListener("mouseover",function(e){var k=rowK(e);if(k>=0)set(k);});
  list.addEventListener("mouseleave",function(){set(-1);});
  list.addEventListener("focusin",function(e){var k=rowK(e);if(k>=0)set(k);});
  list.addEventListener("focusout",function(){set(-1);});
  tl.addEventListener("mousemove",function(e){
    var r=tl.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,k=-1;
    for(var i=0;i<bars.length;i++){
      var l=parseFloat(bars[i].style.left),w=parseFloat(bars[i].style.width);
      if(x>=l&&x<l+w){k=i;break;}
    }
    set(k);
    tl.style.cursor=k>=0?"pointer":"";
  });
  tl.addEventListener("mouseleave",function(){set(-1);});
  tl.addEventListener("click",function(){
    var a=hot>=0&&rows[hot]?rows[hot].querySelector("a"):null;
    if(a)window.open(a.href,"_blank","noopener");
  });
})();
