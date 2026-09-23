(() => {
  const world=document.getElementById("world"), ctx=world.getContext("2d");
  const dpr=Math.min(2,devicePixelRatio||1);
  let W=innerWidth,H=innerHeight,scrollY=0,stars=[],t=0;

  function resize(){
    W=innerWidth;H=innerHeight;
    world.width=W*dpr;world.height=H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:Math.max(65,Math.floor(W*H/14500))},()=>({
      x:Math.random()*W,y:Math.random()*H*.58,r:Math.random()*1.2+.25,a:Math.random()*.7+.15,s:Math.random()*.0007+.00025
    }));
  }
  function drawWorld(){
    t+=.008;ctx.clearRect(0,0,W,H);
    const scroll=scrollY/(Math.max(1,document.body.scrollHeight-H));
    const horizon=H*(.62-scroll*.16);
    const g=ctx.createRadialGradient(W*.53,horizon*.48,0,W*.53,horizon*.48,Math.max(W,H)*.7);
    g.addColorStop(0,"rgba(32,75,91,.16)");g.addColorStop(.5,"rgba(7,28,42,.04)");g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

    const starOpacity=Math.max(0,1-scroll*1.5);
    for(const s of stars){
      const a=s.a*(.65+.35*Math.sin(t*s.s*900+s.x));
      ctx.fillStyle=`rgba(230,239,236,${a*starOpacity})`;
      ctx.beginPath();ctx.arc(s.x,(s.y-scroll*H*.08),s.r,0,Math.PI*2);ctx.fill();
    }

    const waterTop=H*(.67-scroll*.10);
    const waves=9;
    for(let i=0;i<waves;i++){
      const y=waterTop+i*H*.038;
      ctx.beginPath();ctx.moveTo(0,y);
      for(let x=0;x<=W;x+=18){
        const yy=y+Math.sin(x*.008+i+t*.65)*2.2+Math.sin(x*.021-t*.35)*1.1;
        ctx.lineTo(x,yy);
      }
      ctx.strokeStyle=`rgba(105,165,171,${.09-i*.006})`;
      ctx.lineWidth=1;ctx.stroke();
    }
    requestAnimationFrame(drawWorld);
  }
  addEventListener("resize",resize);addEventListener("scroll",()=>scrollY=scrollY||window.scrollY,{passive:true});
  scrollY=window.scrollY;resize();drawWorld();

  const court=document.getElementById("court"),canvas=document.getElementById("pong"),pctx=canvas.getContext("2d");
  const score=document.getElementById("score"),start=document.getElementById("start"),restart=document.getElementById("restart");
  let cw=800,ch=430,cdpr=1,last=0,raf=0,started=false,over=false;
  const s={p:.5,c:.5,x:.5,y:.5,vx:.5,vy:.18,ps:0,cs:0};

  function resizeGame(){
    const r=court.getBoundingClientRect();cw=Math.max(320,r.width);ch=Math.max(200,r.height);
    cdpr=Math.min(2,devicePixelRatio||1);canvas.width=cw*cdpr;canvas.height=ch*cdpr;
    pctx.setTransform(cdpr,0,0,cdpr,0,0);draw();
  }
  function resetBall(dir){s.x=.5;s.y=.5;s.vx=.5*dir;s.vy=Math.random()*.32-.16}
  function resetGame(){s.p=.5;s.c=.5;s.ps=0;s.cs=0;started=false;over=false;start.textContent="MOVE TO PLAY";start.style.opacity=1;resetBall(Math.random()<.5?1:-1);score.textContent="0 — 0"}
  function move(y){const r=court.getBoundingClientRect();s.p=Math.max(.12,Math.min(.88,(y-r.top)/r.height));if(!started&&!over){started=true;start.style.opacity=0}}
  court.addEventListener("pointermove",e=>move(e.clientY));court.addEventListener("pointerdown",e=>move(e.clientY));restart.addEventListener("click",resetGame);addEventListener("resize",resizeGame);

  function draw(){
    pctx.clearRect(0,0,cw,ch);pctx.fillStyle="#e9f0ec";
    for(let y=10;y<ch;y+=24)pctx.fillRect(cw/2-1,y,2,11);
    const ph=Math.max(40,ch*.18);
    pctx.fillRect(22,s.p*ch-ph/2,6,ph);pctx.fillRect(cw-28,s.c*ch-ph/2,6,ph);
    pctx.beginPath();pctx.arc(s.x*cw,s.y*ch,3.5,0,Math.PI*2);pctx.fill();
  }
  function end(text){over=true;start.textContent=text+" · RESTART";start.style.opacity=1}
  function tick(now){
    if(!last)last=now;const dt=Math.min(.032,(now-last)/1000);last=now;
    if(started&&!over){
      s.x+=s.vx*dt;s.y+=s.vy*dt;
      if(s.y<.02){s.y=.02;s.vy=Math.abs(s.vy)}if(s.y>.98){s.y=.98;s.vy=-Math.abs(s.vy)}
      s.c+=(s.y-s.c)*Math.min(1,dt*4);
      const ph=Math.max(40,ch*.18),pt=s.p-ph/(2*ch),pb=s.p+ph/(2*ch),ct=s.c-ph/(2*ch),cb=s.c+ph/(2*ch);
      if(s.x<.05&&s.x>.035&&s.y>pt&&s.y<pb){s.x=.05;s.vx=Math.abs(s.vx)*1.035;s.vy+=(s.y-s.p)*.55}
      if(s.x>.95&&s.x<.965&&s.y>ct&&s.y<cb){s.x=.95;s.vx=-Math.abs(s.vx)*1.035;s.vy+=(s.y-s.c)*.55}
      if(s.x<-.02){s.cs++;score.textContent=`${s.ps} — ${s.cs}`;s.cs>=7?end("CPU WINS"):resetBall(1)}
      if(s.x>1.02){s.ps++;score.textContent=`${s.ps} — ${s.cs}`;s.ps>=7?end("YOU WIN"):resetBall(-1)}
    }
    draw();raf=requestAnimationFrame(tick)
  }
  resizeGame();resetGame();raf=requestAnimationFrame(tick);
  addEventListener("beforeunload",()=>cancelAnimationFrame(raf));
  document.getElementById("year").textContent=new Date().getFullYear();
})();