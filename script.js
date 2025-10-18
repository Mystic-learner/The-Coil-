// === THE COIL: Human Breath Grid Edition ===
// The grid breathes like it's alive. Minimal glow, longer rhythm. Pure cyber calm.

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
let pausedFlag = false;
let obstacles = [];
let difficultyLevel = 0;

let gridGlow = 0.08; // faint starting glow
let glowDir = 1;
let beatFlash = 0;
let dropPulse = 0;
let beatCount = 0;
let canMove = false;

const bpm = 120;
const beatInterval = (60 / bpm) * 1000;

const bgm = new Audio("assets/track1.mp3");
bgm.loop = true;
bgm.volume = 0.45;

// === INIT GAME ===
function initGame() {
  snake = [{ x: 5, y: 5 }];
  food = { x: 10, y: 10 };
  velocity = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  combo = 0;
  obstacles = [];
  difficultyLevel = 0;
  gridGlow = 0.08;
  glowDir = 1;
  beatFlash = 0;
  dropPulse = 0;
  beatCount = 0;
  canMove = false;
}

// === BEAT SYSTEM ===
function beatTick() {
  beatCount++;
  canMove = true;
  beatFlash = 0.6; // smaller light pulse now

  if (beatCount % 8 === 0) {
    dropPulse = 0.5; // subtle, not loud
    setTimeout(() => (dropPulse = 0), 400);
  }

  setTimeout(() => (canMove = false), beatInterval * 0.35);
}
setInterval(beatTick, beatInterval);

// === GRID BREATHING ===
function updateGridGlow() {
  gridGlow += 0.002 * glowDir; // slower breathing — deep inhale/exhale
  if (gridGlow >= 0.12 || gridGlow <= 0.04) glowDir *= -1;
}

// === DRAW ===
function draw() {
  // faint motion blur fade
  ctx.fillStyle = "rgba(5,5,10,0.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // breathing grid — feels alive, not glowing aggressively
  const gridAlpha = gridGlow + 0.03 * beatFlash + 0.05 * dropPulse;
  ctx.strokeStyle = `rgba(130,110,240,${gridAlpha})`;
  ctx.shadowColor = `rgba(120,100,230,${gridAlpha})`;
  ctx.shadowBlur = 1.5 * (1 + dropPulse); // barely-there glow
  for (let x = 0; x < canvas.width; x += tile) {
    for (let y = 0; y < canvas.height; y += tile) {
      ctx.strokeRect(x, y, tile, tile);
    }
  }
  ctx.shadowBlur = 0;

  // obstacles
  ctx.shadowColor = "#8e5cff";
  ctx.shadowBlur = 3 + 2 * dropPulse;
  ctx.fillStyle = "#6a1b9a";
  obstacles.forEach(o => ctx.fillRect(o.x * tile, o.y * tile, tile, tile));

  // food
  ctx.shadowColor = "#ffef75";
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#fff176";
  ctx.fillRect(food.x * tile, food.y * tile, tile, tile);

  // snake — glowing trail, smooth persistence
  ctx.shadowColor = "#cfc0ff";
  ctx.shadowBlur = 7 + 3 * dropPulse;
  snake.forEach((p, i) => {
    const alpha = 1 - i * 0.05;
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0.2, alpha)})`;
    ctx.fillRect(p.x * tile, p.y * tile, tile, tile);
  });
  ctx.shadowBlur = 0;

  hudScore.textContent = `SCORE: ${score}`;
  hudCombo.textContent = `COMBO: ${combo}`;

  beatFlash = Math.max(0, beatFlash - 0.03);
  updateGridGlow();
}

// === MOVE ===
function moveSnake() {
  if (!(nextDir.x === -velocity.x && nextDir.y === -velocity.y)) velocity = nextDir;

  const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };
  if (head.x < 0) head.x = cols - 1;
  if (head.y < 0) head.y = rows - 1;
  if (head.x >= cols) head.x = 0;
  if (head.y >= rows) head.y = 0;

  if (snake.some(p => p.x === head.x && p.y === head.y)) return resetGame();
  if (obstacles.some(o => o.x === head.x && o.y === head.y)) return resetGame();

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    combo++;
    spawnFood();
    checkDifficulty();
  } else {
    snake.pop();
  }
}

// === FOOD & OBSTACLES ===
function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (
    snake.some(p => p.x === newFood.x && p.y === newFood.y) ||
    obstacles.some(o => o.x === newFood.x && o.y === newFood.y)
  );
  food = newFood;
}

function spawnObstacle() {
  let newBlock;
  do {
    newBlock = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (
    snake.some(p => p.x === newBlock.x && p.y === newBlock.y) ||
    obstacles.some(o => o.x === newBlock.x && o.y === newBlock.y) ||
    (food.x === newBlock.x && food.y === newBlock.y)
  );
  obstacles.push(newBlock);
}

// === DIFFICULTY ===
function checkDifficulty() {
  if (score % 3 === 0) {
    difficultyLevel++;
    spawnObstacle();
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

// === CONTROL ===
function resetGame() {
  saveScore(score);
  initGame();
}

function togglePause() {
  pausedFlag = !pausedFlag;
  paused.classList.toggle("hidden", !pausedFlag);
  bgm.volume = pausedFlag ? 0.1 : 0.45;
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

// === START ===
startBtn.onclick = () => {
  menu.classList.add("hidden");
  initGame();
  bgm.play().catch(() => {});
};

// === LOOP ===
function loop() {
  if (!pausedFlag && canMove) moveSnake();
  draw();
  requestAnimationFrame(loop);
}
initGame();
loop();

