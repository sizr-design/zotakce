const spinBtn = document.getElementById("spinBtn");
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const adminBtn = document.getElementById("adminBtn");
const adminPanel = document.getElementById("adminPanel");
const addUser = document.getElementById("addUser");
const newUser = document.getElementById("newUser");
const userList = document.getElementById("userList");
const resetBtn = document.getElementById("resetBtn");
const winnerDiv = document.getElementById("winner");
const passwordPrompt = document.getElementById("passwordPrompt");
const checkPassword = document.getElementById("checkPassword");
const adminPasswordInput = document.getElementById("adminPassword");
const closeAdmin = document.getElementById("closeAdmin");

let users = JSON.parse(localStorage.getItem("users")) || [];
let winner = localStorage.getItem("winner") || null;
let isAdmin = false;

// --- Zvuky ---
const spinSound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_9d4e5b10cf.mp3?filename=click-124467.mp3");
const winSound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_70a80a85c5.mp3?filename=success-1-6297.mp3");

// --- Kreslení kola ---
function drawWheel() {
  const segments = users.length;
  const radius = canvas.width / 2;
  const step = (2 * Math.PI) / segments;

  for (let i = 0; i < segments; i++) {
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, i * step, (i + 1) * step);
    ctx.fillStyle = i % 2 === 0 ? "#00b894" : "#0984e3";
    ctx.fill();
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(i * step + step / 2);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(users[i], radius - 10, 5);
    ctx.restore();
  }
}

function updateWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (users.length > 0) drawWheel();
  spinBtn.disabled = users.length < 2 || !isAdmin;
  localStorage.setItem("users", JSON.stringify(users));
}

// --- Ovládání admina ---
adminBtn.addEventListener("click", () => {
  passwordPrompt.classList.remove("hidden");
});

checkPassword.addEventListener("click", () => {
  if (adminPasswordInput.value === "zotakce2025") {
    isAdmin = true;
    spinBtn.disabled = false;
    adminPanel.classList.remove("hidden");
    passwordPrompt.classList.add("hidden");
  } else {
    alert("Nesprávné heslo!");
  }
});

closeAdmin.addEventListener("click", () => {
  adminPanel.classList.add("hidden");
});

// --- Přidávání uživatelů ---
addUser.addEventListener("click", () => {
  const name = newUser.value.trim();
  if (name && !users.includes(name)) {
    users.push(name);
    const li = document.createElement("li");
    li.textContent = name;
    userList.appendChild(li);
    newUser.value = "";
    updateWheel();
  }
});

// --- Losování ---
spinBtn.addEventListener("click", () => {
  if (users.length < 2) return alert("Přidej aspoň 2 hráče!");
  spinBtn.disabled = true;

  spinSound.play();
  let randomIndex = Math.floor(Math.random() * users.length);
  winner = users[randomIndex];
  localStorage.setItem("winner", winner);

  setTimeout(() => {
    winSound.play();
    winnerDiv.textContent = "🎉 Vítěz: " + winner + " 🎉";
    winnerDiv.classList.remove("hidden");
    alert("Vítěz: " + winner + " 🎉");
  }, 2000);
});

// --- Resetování ---
resetBtn.addEventListener("click", () => {
  users = [];
  winner = null;
  userList.innerHTML = "";
  winnerDiv.textContent = "";
  localStorage.clear();
  updateWheel();
  alert("Losování bylo resetováno!");
});

// --- Načtení při otevření stránky ---
window.addEventListener("load", () => {
  updateWheel();
  if (winner) {
    winnerDiv.textContent = "🎉 Vítěz: " + winner + " 🎉";
    winnerDiv.classList.remove("hidden");
    setTimeout(() => {
      winSound.play(); // přehraje fanfáru po načtení
    }, 1000);
  }
});
