const input = document.getElementById("username");
const addUserBtn = document.getElementById("addUser");
const list = document.getElementById("userList");
const message = document.getElementById("message");
const drawBtn = document.getElementById("drawWinner");
const winnerDiv = document.getElementById("winner");

const soundWin = document.getElementById("soundWin");
const soundLose = document.getElementById("soundLose");

let users = [];

addUserBtn.addEventListener("click", () => {
  const name = input.value.trim();
  if (!name) {
    message.textContent = "❌ Zadej jméno!";
    soundLose.play();
    return;
  }
  if (users.includes(name)) {
    message.textContent = "⚠️ Tento hráč už je přihlášený!";
    soundLose.play();
    return;
  }
  users.push(name);
  const li = document.createElement("li");
  li.textContent = name;
  list.appendChild(li);
  message.textContent = "✅ Přihlášeno!";
  soundWin.play();
  input.value = "";
});

drawBtn.addEventListener("click", () => {
  if (users.length === 0) {
    message.textContent = "❌ Není nikdo přihlášený!";
    soundLose.play();
    return;
  }
  const winner = users[Math.floor(Math.random() * users.length)];
  winnerDiv.innerHTML = `<h2>🥳 Výherce: ${winner} 🥳</h2>`;
  soundWin.play();
});
