/* ECHO VERSE -- transmission files (sig/*.html).
   1) Player: nothing is requested from YouTube until the visitor clicks (same rule as on the tuner page).
   2) Footer counter: days since the first signal (2026-07-06) -- computed, nothing is counted or stored. */
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
  var el=document.getElementById("txSince");
  if(el){
    var d=Math.floor((Date.now()-Date.UTC(2026,6,6))/864e5);
    if(d>0){el.textContent="STILL TRANSMITTING — "+d+" DAYS SINCE FIRST SIGNAL";el.title="first signal: 2026-07-06";}
  }
})();
