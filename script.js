(() => {
  const stage = document.getElementById("pongStage");
  const canvas = document.getElementById("pongCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const message = document.getElementById("pongMessage");
  const restart = document.getElementById("restart");
  const year = document.getElementById("year");

  year.textContent = new Date().getFullYear();

  let W = 800, H = 440, dpr = 1;
  let animationFrame = 0;
  let last = 0;
  let started = false;
  let gameOver = false;
  const state = {
    player: 0.5,
    cpu: 0.5,
    ballX: 0.5,
    ballY: 0.5,
    vx: 0.48,
    vy: 0.18,
    playerScore: 0,
    cpuScore: 0
  };

  function resize() {
    const rect = stage.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.max(210, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function updateScore() {
    scoreEl.textContent = `${state.playerScore} — ${state.cpuScore}`;
  }

  function resetBall(direction) {
    state.ballX = 0.5;
    state.ballY = 0.5;
    state.vx = 0.48 * direction;
    state.vy = (Math.random() * 0.34) - 0.17;
  }

  function restartGame() {
    state.playerScore = 0;
    state.cpuScore = 0;
    state.player = 0.5;
    state.cpu = 0.5;
    started = false;
    gameOver = false;
    message.textContent = "MOVE TO PLAY";
    message.style.opacity = "1";
    resetBall(Math.random() < 0.5 ? 1 : -1);
    updateScore();
  }

  function movePlayer(clientY) {
    const rect = stage.getBoundingClientRect();
    state.player = Math.max(0.12, Math.min(0.88, (clientY - rect.top) / rect.height));
    if (!started && !gameOver) {
      started = true;
      message.style.opacity = "0";
    }
  }

  stage.addEventListener("pointermove", e => movePlayer(e.clientY));
  stage.addEventListener("pointerdown", e => movePlayer(e.clientY));
  restart.addEventListener("click", restartGame);
  window.addEventListener("resize", resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#101010";

    for (let y = 12; y < H; y += 25) {
      ctx.fillRect(W / 2 - 1, y, 2, 12);
    }

    const paddleW = 7;
    const paddleH = Math.max(42, H * 0.18);
    const ballSize = 7;

    ctx.fillRect(24, state.player * H - paddleH / 2, paddleW, paddleH);
    ctx.fillRect(W - 31, state.cpu * H - paddleH / 2, paddleW, paddleH);

    ctx.beginPath();
    ctx.arc(state.ballX * W, state.ballY * H, ballSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function tick(timestamp) {
    if (!last) last = timestamp;
    const dt = Math.min(0.032, (timestamp - last) / 1000);
    last = timestamp;

    if (started && !gameOver) {
      state.ballX += state.vx * dt;
      state.ballY += state.vy * dt;

      if (state.ballY < 0.02) {
        state.ballY = 0.02;
        state.vy = Math.abs(state.vy);
      }
      if (state.ballY > 0.98) {
        state.ballY = 0.98;
        state.vy = -Math.abs(state.vy);
      }

      const cpuTarget = state.ballY + state.vy * 0.12;
      state.cpu += (cpuTarget - state.cpu) * Math.min(1, dt * 4.0);

      const paddleH = Math.max(42, H * 0.18);
      const pTop = state.player - paddleH / (2 * H);
      const pBottom = state.player + paddleH / (2 * H);

      if (state.ballX < 0.047 && state.ballX > 0.035 &&
          state.ballY > pTop && state.ballY < pBottom) {
        state.ballX = 0.047;
        state.vx = Math.abs(state.vx) * 1.035;
        state.vy += (state.ballY - state.player) * 0.55;
      }

      const cTop = state.cpu - paddleH / (2 * H);
      const cBottom = state.cpu + paddleH / (2 * H);

      if (state.ballX > 0.953 && state.ballX < 0.965 &&
          state.ballY > cTop && state.ballY < cBottom) {
        state.ballX = 0.953;
        state.vx = -Math.abs(state.vx) * 1.035;
        state.vy += (state.ballY - state.cpu) * 0.55;
      }

      if (state.ballX < -0.02) {
        state.cpuScore++;
        updateScore();
        if (state.cpuScore >= 7) endGame("CPU WINS");
        else resetBall(1);
      }

      if (state.ballX > 1.02) {
        state.playerScore++;
        updateScore();
        if (state.playerScore >= 7) endGame("YOU WIN");
        else resetBall(-1);
      }
    }

    draw();
    animationFrame = requestAnimationFrame(tick);
  }

  function endGame(text) {
    gameOver = true;
    message.textContent = `${text} · RESTART`;
    message.style.opacity = "1";
  }

  resize();
  restartGame();
  animationFrame = requestAnimationFrame(tick);

  window.addEventListener("beforeunload", () => cancelAnimationFrame(animationFrame));
})();
