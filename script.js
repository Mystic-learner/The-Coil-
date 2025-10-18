// === THE COIL (fixed render + spawn visibility) ===

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const leaderboard = document.getElementById("leaderboard");
const leaderBtn = document.getElementById("leaderBtn");
const scoresList = document.getElementById("scoresList");
const backFromLeader = document.getElementById("backFromLeader");
const clearScores = document.getElementById("clearScores");
const hudScore = document.getElementById("score");
const hudCombo = document.getElementById("combo");
const paused = document.getElementById("paused");

const tile = 20;
const rows = canvas.height / tile;
const cols = canvas.width / tile;

let snake = [];
let food = {};
let velocity = {};
let nextDir = {};
let score = 0;
let combo = 0;
let canMove = false;
let beatFlash = 0;
let pausedFlag = false;

const bpm = 120;
const beatInterval = (60 / bpm) * 1000;

const bgm = new Audio("assets/track1.mp3");
bgm.loop = true;
bgm.volume = 0.5;

// === GAME INITIALIZER ===
function initGame() {
  snake = [{ x: 5, y: 5 }];
  food = { x: 10, y: 10 };
  velocity = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  combo = 0;
  canMove = false;
  beatFlash = 0;
}

// === BEAT SYSTEM ===
function beatTick() {
  canMove = true;
  beatFlash = 1;
  setTimeout(() => (canMove = false), 250);
}
setInterval(beatTick, beatInterval);

// === GRID ===
function drawGrid() {
  ctx.strokeStyle = "rgba(150,150,255,0.08)";
  for (let x = 0; x < canvas.width; x += tile) {
    for (let y = 0; y < canvas.height; y += tile) {
      ctx.strokeRect(x, y, tile, tile);
    }
  }
}

// === DRAW ===
function draw() {
  ctx.fillStyle = `rgba(0,0,0,${beatFlash > 0 ? 0.5 : 0.2})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // background grid first
  drawGrid();

  ctx.shadowBlur = 8;

  // food (neon yellow)
  ctx.shadowColor = "#ffff33";
  ctx.fillStyle = "#ffff33";
  ctx.fillRect(food.x * tile, food.y * tile, tile, tile);

  // snake (white glow)
  ctx.shadowColor = "#f5f5f5";
  ctx.fillStyle = "#ffffff";
  snake.forEach(p => ctx.fillRect(p.x * tile, p.y * tile, tile, tile));

  ctx.shadowBlur = 0;

  // HUD
  hudScore.textContent = `SCORE: ${score}`;
  hudCombo.textContent = `COMBO: ${combo}`;
  beatFlash = Math.max(0, beatFlash - 0.1);
}

// === MOVEMENT ===
function moveSnake() {
  if (!(nextDir.x === -velocity.x && nextDir.y === -velocity.y)) velocity = nextDir;

  const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };
  if (head.x < 0) head.x = cols - 1;
  if (head.y < 0) head.y = rows - 1;
  if (head.x >= cols) head.x = 0;
  if (head.y >= rows) head.y = 0;

  // collision with self
  for (let part of snake) {
    if (part.x === head.x && part.y === head.y) {
      resetGame();
      return;
    }
  }

  snake.unshift(head);

  // eat
  if (head.x === food.x && head.y === food.y) {
    score++;
    combo++;
    food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } else {
    snake.pop();
  }
}

// === INPUT ===
let keyMap = {
  up: ["arrowup", "d"],
  down: ["arrowdown", "x"],
  left: ["arrowleft", "z"],
  right: ["arrowright", "c"]
};
document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (k === "p") return togglePause();
  if (k === "r") return resetGame();

  if (keyMap.up.includes(k) && velocity.y === 0) nextDir = { x: 0, y: -1 };
  if (keyMap.down.includes(k) && velocity.y === 0) nextDir = { x: 0, y: 1 };
  if (keyMap.left.includes(k) && velocity.x === 0) nextDir = { x: -1, y: 0 };
  if (keyMap.right.includes(k) && velocity.x === 0) nextDir = { x: 1, y: 0 };

  if (bgm.paused) bgm.play().catch(() => {});
});

// === GAME CONTROLS ===
function resetGame() {
  saveScore(score);
  initGame();
}

function togglePause() {
  pausedFlag = !pausedFlag;
  paused.classList.toggle("hidden", !pausedFlag);
  bgm.volume = pausedFlag ? 0.1 : 0.5;
}

// === LEADERBOARD ===
function getScores() {
  try {
    return JSON.parse(localStorage.getItem("coil_scores") || "[]");
  } catch {
    return [];
  }
}
function saveScore(value) {
  const arr = getScores();
  arr.push({ score: value, ts: Date.now() });
  arr.sort((a, b) => b.score - a.score);
  localStorage.setItem("coil_scores", JSON.stringify(arr.slice(0, 10)));
}
function renderScores() {
  const arr = getScores();
  scoresList.innerHTML = arr.length
    ? arr.map((s, i) => `<li>${i + 1}. ${s.score}</li>`).join("")
    : "<li>No scores yet</li>";
}
leaderBtn.onclick = () => {
  menu.classList.add("hidden");
  leaderboard.classList.remove("hidden");
  renderScores();
};
backFromLeader.onclick = () => {
  leaderboard.classList.add("hidden");
  menu.classList.remove("hidden");
};
clearScores.onclick = () => {
  localStorage.removeItem("coil_scores");
  renderScores();
};

// === START GAME ===
startBtn.onclick = () => {
  menu.classList.add("hidden");
  initGame();
  bgm.play().catch(() => {});
};

// === MAIN LOOP ===
function loop() {
  if (!pausedFlag && canMove) moveSnake();
  draw();
  requestAnimationFrame(loop);
}
initGame();
loop();

