(() => {
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  let w=0,h=0,dpr=1,stars=[],last=performance.now(),t=0;

  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    w=innerWidth; h=innerHeight;
    canvas.width=w*dpr; canvas.height=h*dpr;
    canvas.style.width=w+"px"; canvas.style.height=h+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.min(430,Math.floor(w*h/5200));
    stars=Array.from({length:count},()=>({
      x:Math.random()*w,y:Math.random()*h*.72,r:Math.random()*1.25+.18,
      a:Math.random()*.7+.18,s:(Math.random()-.5)*.018,
      drift:(Math.random()-.5)*.035,phase:Math.random()*Math.PI*2
    }));
  }
  function draw(now){
    const dt=Math.min(40,now-last); last=now; t+=dt;
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      s.x+=s.drift*dt;
      if(s.x<-3)s.x=w+3;if(s.x>w+3)s.x=-3;
      const tw=.75+.25*Math.sin(t*.0012+s.phase);
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(235,245,255,${s.a*tw})`;ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); addEventListener("resize",resize,{passive:true}); requestAnimationFrame(draw);

  // Pong: mouse controls the left paddle, computer controls the right.
  const court=document.getElementById("court"), player=document.getElementById("player"),
        cpu=document.getElementById("cpu"), ball=document.getElementById("ball"),
        ps=document.getElementById("playerScore"), cs=document.getElementById("cpuScore"),
        hint=document.getElementById("hint");
  let cw=0,ch=0,px=0,cy=0,bx=0,by=0,vx=0,vy=0,scoreP=0,scoreC=0,playing=false,lastPong=performance.now();

  function resetBall(dir){
    cw=court.clientWidth;ch=court.clientHeight;
    bx=cw/2;by=ch/2;vx=(dir||1)*(4.2+Math.random()*1.1);vy=(Math.random()-.5)*3.6;
  }
  function layout(){
    cw=court.clientWidth;ch=court.clientHeight;
    px=ch/2;cy=ch/2;resetBall(1);render();
  }
  function render(){
    player.style.top=px+"px";cpu.style.top=cy+"px";
    ball.style.left=bx+"px";ball.style.top=by+"px";
    ps.textContent=scoreP;cs.textContent=scoreC;
  }
  function start(){
    if(!playing){playing=true;hint.style.opacity="0";lastPong=performance.now();requestAnimationFrame(loop)}
  }
  function movePlayer(clientY){
    const r=court.getBoundingClientRect();
    px=Math.max(38,Math.min(ch-38,clientY-r.top));
    start();render();
  }
  court.addEventListener("pointermove",e=>movePlayer(e.clientY));
  court.addEventListener("pointerdown",e=>movePlayer(e.clientY));
  window.addEventListener("resize",layout);
  function loop(now){
    if(!playing)return;
    const dt=Math.min(2,(now-lastPong)/16.67);lastPong=now;
    bx+=vx*dt;by+=vy*dt;
    if(by<7){by=7;vy=Math.abs(vy)} if(by>ch-7){by=ch-7;vy=-Math.abs(vy)}
    // CPU follows with a little delay.
    const target=by;
    cy += Math.max(-3.5,Math.min(3.5,(target-cy)*.09))*dt;
    const paddleHalf=34;
    if(bx<30 && bx>16 && Math.abs(by-px)<paddleHalf+8 && vx<0){
      bx=30;vx=Math.abs(vx)*1.035;vy += (by-px)*.075;
    }
    if(bx>cw-30 && bx<cw-16 && Math.abs(by-cy)<paddleHalf+8 && vx>0){
      bx=cw-30;vx=-Math.abs(vx)*1.035;vy += (by-cy)*.075;
    }
    if(bx<-20){scoreC++;round(1);return}
    if(bx>cw+20){scoreP++;round(-1);return}
    render();requestAnimationFrame(loop);
  }
  function round(dir){
    if(scoreP>=7||scoreC>=7){
      playing=false;hint.textContent=scoreP>scoreC?"YOU WIN — CLICK TO RESTART":"CPU WINS — CLICK TO RESTART";
      hint.style.opacity="1";return;
    }
    resetBall(dir);render();requestAnimationFrame(loop);
  }
  court.addEventListener("click",()=>{if(!playing){if(scoreP>=7||scoreC>=7){scoreP=0;scoreC=0;hint.textContent="MOVE MOUSE TO PLAY";resetBall(Math.random()<.5?1:-1);render()}start()}});
  layout();
})();
