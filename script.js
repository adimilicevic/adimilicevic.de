(() => {
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  let W=0,H=0,dpr=1,stars=[];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    dpr=Math.min(devicePixelRatio||1,2);
    W=innerWidth; H=innerHeight;
    canvas.width=Math.floor(W*dpr); canvas.height=Math.floor(H*dpr);
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.max(70,Math.min(220,Math.floor(W*H/8500)));
    stars=Array.from({length:count},()=>({
      x:Math.random()*W,y:Math.random()*H*.58,
      r:Math.random()*.9+.2,a:Math.random()*.7+.18,
      tw:Math.random()*Math.PI*2,s:Math.random()*.35+.08
    }));
  }
  addEventListener('resize',resize,{passive:true}); resize();

  function skyAndSea(t){
    const horizon=H*.585;
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#02050d'); g.addColorStop(.36,'#071225');
    g.addColorStop(.54,'#18334b'); g.addColorStop(.585,'#d88a63');
    g.addColorStop(.64,'#24495c'); g.addColorStop(1,'#031b2b');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    // subtle stars
    for(const s of stars){
      const alpha=s.a*(.72+.28*Math.sin(t*.001*s.s*8+s.tw));
      ctx.globalAlpha=alpha;
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;

    // restrained horizon glow
    const hg=ctx.createRadialGradient(W*.5,horizon,2,W*.5,horizon,W*.48);
    hg.addColorStop(0,'rgba(255,211,174,.30)');
    hg.addColorStop(.18,'rgba(247,159,112,.10)');
    hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=hg; ctx.fillRect(0,horizon-80,W,160);

    // animated ocean
    ctx.save();
    ctx.beginPath(); ctx.rect(0,horizon,W,H-horizon); ctx.clip();
    for(let layer=0;layer<9;layer++){
      const y0=horizon+layer*H*.047;
      ctx.beginPath();
      const amp=2.0+layer*.75;
      const speed=.00032+layer*.000025;
      for(let x=0;x<=W+10;x+=10){
        const y=y0+Math.sin(x*.012+ t*speed + layer*1.7)*amp
          +Math.sin(x*.0037-t*speed*.7+layer)*amp*.55;
        if(x===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.strokeStyle=`rgba(176,215,224,${.055+layer*.012})`;
      ctx.lineWidth=1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function frame(t){
    skyAndSea(t);
    if(!reduced) requestAnimationFrame(frame);
  }
  frame(0);

  // Pong
  const court=document.getElementById('pong');
  const player=document.getElementById('player');
  const computer=document.getElementById('computer');
  const ball=document.getElementById('ball');
  const ps=document.getElementById('playerScore');
  const cs=document.getElementById('computerScore');
  const hint=document.getElementById('hint');

  let pw=0,ph=0,py=.5,cy=.5,bx=.5,by=.5,vx=.55,vy=.31;
  let playerScore=0,computerScore=0,last=performance.now(),running=true,keys={};

  function dims(){ pw=court.clientWidth; ph=court.clientHeight; }
  addEventListener('resize',dims,{passive:true}); dims();

  function setPlayerFromY(y){
    const r=court.getBoundingClientRect();
    py=Math.max(.10,Math.min(.90,(y-r.top)/r.height));
    hint.style.opacity=0;
  }
  court.addEventListener('pointermove',e=>setPlayerFromY(e.clientY));
  court.addEventListener('pointerdown',()=>{hint.style.opacity=0; court.focus();});
  addEventListener('keydown',e=>{
    keys[e.key.toLowerCase()]=true;
    if(['arrowup','arrowdown','w','s',' '].includes(e.key.toLowerCase())) e.preventDefault();
    hint.style.opacity=0;
    if(e.key===' ' && !running){ reset(); running=true; last=performance.now(); }
  });
  addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

  function resetBall(dir){
    bx=.5; by=.5;
    const angle=(Math.random()*.75-.375);
    vx=.48*dir; vy=Math.sin(angle)*.62;
  }
  function reset(){
    playerScore=computerScore=0; ps.textContent='0'; cs.textContent='0';
    py=cy=.5; resetBall(Math.random()<.5?1:-1); hint.textContent='MOVE MOUSE · W/S · ↑/↓'; hint.style.opacity=.45;
  }
  function point(forPlayer){
    if(forPlayer) playerScore++; else computerScore++;
    ps.textContent=playerScore; cs.textContent=computerScore;
    if(playerScore>=7 || computerScore>=7){
      running=false; hint.textContent='CLICK / SPACE TO RESTART'; hint.style.opacity=.8;
      return;
    }
    resetBall(forPlayer?1:-1);
  }

  court.addEventListener('click',()=>{
    if(!running){reset();running=true;last=performance.now();}
  });

  function render(){
    const phh=ph*.18;
    player.style.top=(py*100-phh/ph*50)+'%';
    computer.style.top=(cy*100-phh/ph*50)+'%';
    ball.style.left=(bx*100)+'%'; ball.style.top=(by*100)+'%';
  }

  function loop(now){
    const dt=Math.min(32,now-last); last=now;
    if(running){
      const step=dt/16.67;
      if(keys['arrowup']||keys['w']) py=Math.max(.09,py-.018*step);
      if(keys['arrowdown']||keys['s']) py=Math.min(.91,py+.018*step);

      const target=by;
      cy += Math.max(-.012,Math.min(.012,(target-cy)))*step;
      cy=Math.max(.09,Math.min(.91,cy));

      bx += vx*.0017*dt;
      by += vy*.0017*dt;
      if(by<.018){by=.018;vy=Math.abs(vy)}
      if(by>.982){by=.982;vy=-Math.abs(vy)}

      const paddleHalf=.09;
      if(bx<.035 && vx<0){
        if(Math.abs(by-py)<paddleHalf+.02){bx=.035;vx=Math.abs(vx)*1.035;vy += (by-py)*.75}
        else if(bx<-.02) point(false);
      }
      if(bx>.965 && vx>0){
        if(Math.abs(by-cy)<paddleHalf+.02){bx=.965;vx=-Math.abs(vx)*1.035;vy += (by-cy)*.75}
        else if(bx>1.02) point(true);
      }
      vy=Math.max(-.9,Math.min(.9,vy));
    }
    render();
    requestAnimationFrame(loop);
  }
  render(); requestAnimationFrame(loop);
})();
