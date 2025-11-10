// Zjistí, na které stránce se skript spouští
const isAdminPage = document.getElementById("admin") !== null;
const isMainPage = document.getElementById("hero") !== null;

// Pokud jsme na hlavní stránce, spustí se funkce pro přidávání hráčů
if (isMainPage) {
  console.log("Načtena hlavní stránka Zotakce");
  // tady nechej všechny staré funkce, které dělají:
  // - přidávání hráčů
  // - zobrazení kola
  // - losování
  // - zvuky výhry atd.
}

// Pokud jsme na admin stránce, spustí se funkce pro správce
if (isAdminPage) {
  console.log("Načtena admin stránka Zotakce");
  // tady nechej funkce, které ovládají:
  // - zamknutí přihlašování
  // - reset
  // - ruční losování
  // - nastavení času
}
// script.js for Zotakce
// - saves participants in localStorage
// - prevents duplicates and reserved admin name
// - fetches Roblox userId to show headshot thumbnail
// - draws simple wheel on canvas, spins to random winner
// - admin panel available at /admin490 (client-side show/hide)

const RESERVED_ADMIN = 'zotlfuof'; // reserved Roblox name (blocked)
const STORAGE_KEY = 'zotakce_players_v1';
let players = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let locked = false; // lock signups
let spinInProgress = false;
const winAudio = document.getElementById('winAudio');
const errAudio = document.getElementById('errAudio');

const usernameInput = document.getElementById('username');
const nickInput = document.getElementById('nick');
const addBtn = document.getElementById('addBtn');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeInfo = document.getElementById('closeInfo');
const overlay = document.getElementById('overlay');
const wheelSection = document.getElementById('wheelSection');
const hero = document.getElementById('hero');
const spinBtn = document.getElementById('spinBtn');

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const playersListDiv = document.getElementById('playersList');

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  renderPlayersList();
  drawWheel();
}
function showOverlay(msg, type='success', time=5000){
  overlay.className = 'overlay';
  overlay.classList.add(type === 'success' ? 'success' : 'error');
  overlay.textContent = msg;
  overlay.classList.remove('hidden');
  if(type === 'success'){ try{ winAudio.play(); }catch(e){} }
  else try{ errAudio.play(); }catch(e){}
  setTimeout(()=> overlay.classList.add('hidden'), time);
}

// basic roblox username -> userId lookup
async function fetchRobloxUser(username){
  try{
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({usernames:[username], excludeBannedUsers:false})
    });
    if(!res.ok) return null;
    const j = await res.json();
    if(j.data && j.data.length>0) return j.data[0].id;
    return null;
  }catch(e){
    return null;
  }
}

addBtn.addEventListener('click', async ()=>{
  if(locked){ showOverlay('Už se nelze zapojit. Losování probíhá.', 'error'); return; }
  const username = usernameInput.value.trim();
  const nick = nickInput.value.trim() || username;
  if(!username || username.length < 2){ showOverlay('Zadej platné Roblox jméno', 'error'); return; }
  if(username.toLowerCase() === RESERVED_ADMIN.toLowerCase()){ showOverlay('Tohle jméno je vyhrazené pro správce!', 'error'); return; }
  if(players.find(p=>p.username.toLowerCase()===username.toLowerCase())){ showOverlay('Už jste přihlášení.', 'error'); return; }

  // fetch id and headshot
  showOverlay('Ověřuji jméno…', 'success', 1200);
  const id = await fetchRobloxUser(username);
  if(!id){
    showOverlay('ŠPATNÉ JMÉNO', 'error', 5000);
    return;
  }
  const headshot = `https://www.roblox.com/headshot-thumbnail/image?userId=${id}&width=150&height=150&format=png`;
  players.push({username, nick, headshot, id});
  save();
  showOverlay('SPRÁVNÉ JMÉNO', 'success', 5000);
  usernameInput.value=''; nickInput.value='';
  // reveal wheel if hidden
  if(players.length>0){
    wheelSection.classList.remove('hidden');
  }
});

// info modal
infoBtn.addEventListener('click', ()=> infoModal.classList.remove('hidden'));
closeInfo.addEventListener('click', ()=> infoModal.classList.add('hidden'));

// draw wheel
function drawWheel(){
  const w = canvas.width = Math.min(600, Math.floor(window.innerWidth*0.9));
  const h = canvas.height = w;
  ctx.clearRect(0,0,w,h);
  const cx = w/2, cy = h/2, r = Math.min(cx,cy)-10;
  const n = Math.max(1, players.length);
  const colors = ['#FF7A7A','#FFC97A','#FFFB7A','#7AFFA9','#7AD0FF','#9B7AFF','#FF7ACC'];
  for(let i=0;i<n;i++){
    const start = (i/n)*Math.PI*2;
    const end = ((i+1)/n)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    // draw name
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(start + (end-start)/2);
    ctx.fillStyle = '#000';
    ctx.font = `${Math.max(12, Math.floor(r/10))}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(players[i].nick, r-10, 6);
    ctx.restore();
  }
  // pointer
  ctx.fillStyle='#fff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r - 20);
  ctx.lineTo(cx-12, cy - r + 8);
  ctx.lineTo(cx+12, cy - r + 8);
  ctx.closePath();
  ctx.fill();
}

// spin logic: rotate canvas via CSS transform on wrapper
let currentRotation = 0;
async function spinWheel(){
  if(spinInProgress || players.length===0) return;
  spinInProgress = true;
  // random target: choose index
  const idx = Math.floor(Math.random()*players.length);
  // compute angle so pointer lands on idx
  const n = players.length;
  const slice = 360 / n;
  // We want pointer at top (0 deg). Canvas slices are drawn starting at 0 radians (to the right), so we calibrate.
  // We'll rotate to: 360*spins + targetAngle
  const targetAngle = 270 - (idx * slice) - slice/2; // 270 so top aligns
  const spins = 5 + Math.floor(Math.random()*3);
  const final = spins*360 + targetAngle;
  const duration = 5000; // ms
  const start = performance.now();
  const startRot = currentRotation;
  function animate(now){
    const t = Math.min(1, (now-start)/duration);
    // ease out
    const ease = 1 - Math.pow(1-t,3);
    const rot = startRot + (final - startRot)*ease;
    canvas.style.transform = `rotate(${rot}deg)`;
    if(t<1) requestAnimationFrame(animate);
    else {
      currentRotation = final % 360;
      // winner idx
      const winner = players[idx];
      showOverlay(`Vyhrává: ${winner.nick} (@${winner.username})`, 'success', 7000);
      try{ winAudio.play(); }catch(e){}
      spinInProgress = false;
    }
  }
  requestAnimationFrame(animate);
}

// render players in admin list
function renderPlayersList(){
  playersListDiv.innerHTML = '';
  players.forEach((p, i)=>{
    const el = document.createElement('div');
    el.className = 'playerRow';
    el.style.display='flex'; el.style.alignItems='center'; el.style.gap='8px';
    el.style.padding='6px'; el.style.borderRadius='8px'; el.style.background='rgba(0,0,0,0.04)';
    const img = document.createElement('img'); img.src = p.headshot; img.width=48; img.height=48;
    img.style.borderRadius='8px'; img.style.objectFit='cover';
    const info = document.createElement('div'); info.innerHTML = `<strong>${p.nick}</strong><br><small>@${p.username}</small>`;
    const del = document.createElement('button'); del.textContent='Smazat'; del.className='btn';
    del.onclick = ()=>{ players.splice(i,1); save(); };
    el.appendChild(img); el.appendChild(info); el.appendChild(del);
    playersListDiv.appendChild(el);
  });
}

// admin controls (client side)
const lockBtn = document.getElementById('lockBtn');
const resetBtn = document.getElementById('resetBtn');
const forceSpin = document.getElementById('forceSpin');
const drawTimeInput = document.getElementById('drawTime');
const setTime = document.getElementById('setTime');

lockBtn && lockBtn.addEventListener('click', ()=>{
  locked = !locked;
  lockBtn.textContent = locked ? 'Odemknout přihlašování' : 'Zamknout přihlašování';
});
resetBtn && resetBtn.addEventListener('click', ()=>{
  if(confirm('Opravdu resetovat seznam?')){ players=[]; save(); showOverlay('Seznam vymazán','success'); wheelSection.classList.add('hidden'); }
});
forceSpin && forceSpin.addEventListener('click', ()=> spinWheel());
setTime && setTime.addEventListener('click', ()=>{
  const v = drawTimeInput.value;
  if(!v) return alert('Vyber čas');
  document.getElementById('drawTimeText').textContent = new Date(v).toLocaleString();
  showOverlay('Čas nastaven','success',2000);
});

// initial render + event listeners
document.addEventListener('DOMContentLoaded', ()=>{
  renderPlayersList();
  drawWheel();
  if(players.length>0) wheelSection.classList.remove('hidden');

  // show admin if path is /admin490
  if(location.pathname.includes('/admin490')){
    document.getElementById('admin').classList.remove('hidden');
    document.getElementById('hero').classList.add('hidden');
    document.getElementById('wheelSection').classList.remove('hidden');
  }
});

spinBtn && spinBtn.addEventListener('click', ()=>{
  // play click sound always
  try{ winAudio.currentTime=0; winAudio.play(); } catch(e){}
  spinWheel();
});

// simple request notification permission
if('Notification' in window){
  if(Notification.permission === 'default') Notification.requestPermission();
}
