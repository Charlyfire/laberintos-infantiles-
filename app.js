'use strict';
const $ = selector => document.querySelector(selector);
const levels = [
  { n: 4, label: 'Muy fácil', icon: '🌱', maxPath: 10 },
  { n: 5, label: 'Fácil', icon: '🌼', maxPath: 16 },
  { n: 7, label: 'Medio', icon: '🌳', maxPath: 30 },
  { n: 9, label: 'Un reto', icon: '🏕️', maxPath: 81 }
];
const worlds = {
  forest: { title: '¡Ayuda a Zorrito a llegar a casa!', label: 'AVENTURA EN EL BOSQUE', player: '🦊', goal: '🏡', mission: 'De Zorrito a su casita', name: 'Zorrito', win: 'Zorrito ya está en casa. ¡Qué gran explorador!' },
  sea: { title: '¡Lleva a Burbujas hasta el coral!', label: 'AVENTURA EN EL OCÉANO', player: '🐠', goal: '🪸', mission: 'De Burbujas al coral', name: 'Burbujas', win: 'Burbujas ha llegado al coral. ¡Lo has hecho genial!' },
  space: { title: '¡Ayuda al cohete a llegar a la Luna!', label: 'AVENTURA EN EL ESPACIO', player: '🚀', goal: '🌕', mission: 'Del cohete a la Luna', name: 'el cohete', win: '¡Aterrizaje perfecto! La Luna te da la bienvenida.' }
};
const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
const canvas = $('#maze'), ctx = canvas.getContext('2d');
let level = 0, world = 'forest', cells = [], player = 0, trail = [0], won = false, hintCells = [], hintTimer, soundOn = false, audioContext, dragging = false;
const bounds = { pad: 28, size: 544 };
function neighbor(index, direction, n = levels[level].n) {
  const x = index % n + dirs[direction][0], y = Math.floor(index / n) + dirs[direction][1];
  return x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x;
}
function buildMaze(n) {
  const maze = Array.from({ length: n*n }, () => [true,true,true,true]);
  const visited = new Set([0]), stack = [0];
  while (stack.length) {
    const current = stack[stack.length-1];
    const choices = dirs.map((_, d) => ({ d, next: neighbor(current,d,n) })).filter(v => v.next !== -1 && !visited.has(v.next));
    if (!choices.length) { stack.pop(); continue; }
    const { d, next } = choices[Math.floor(Math.random()*choices.length)];
    maze[current][d] = false; maze[next][(d+2)%4] = false;
    visited.add(next); stack.push(next);
  }
  return maze;
}
function findPath(from, to, maze = cells, n = levels[level].n) {
  const previous = new Map([[from,-1]]), queue = [from];
  for (let i=0; i<queue.length; i++) {
    const current = queue[i];
    if (current === to) break;
    for (let d=0;d<4;d++) {
      const next = neighbor(current,d,n);
      if (!maze[current][d] && next !== -1 && !previous.has(next)) { previous.set(next,current); queue.push(next); }
    }
  }
  if (!previous.has(to)) return [];
  const path=[]; for(let at=to;at!==-1;at=previous.get(at)) path.push(at);
  return path.reverse();
}
function generate() {
  clearTimeout(hintTimer); hintCells=[]; won=false; player=0; trail=[0];
  const { n, maxPath } = levels[level];
  let best, shortest=Infinity;
  for(let attempt=0;attempt<80;attempt++) {
    const candidate=buildMaze(n), length=findPath(0,n*n-1,candidate,n).length;
    if(length<shortest) { best=candidate; shortest=length; }
    if(length<=maxPath) break;
  }
  cells=best;
  $('#hint').disabled=false;
  $('#status').textContent='¡Tu aventura empieza aquí!';
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  $('#confetti').replaceChildren();
  updateLabels(); draw();
}
function updateLabels() {
  const w=worlds[world];
  document.body.dataset.world=world;
  $('#game-title').textContent=w.title; $('#world-label').textContent=w.label;
  $('#mission').textContent=w.mission;
  const label=$('.scene-label'); label.firstElementChild.textContent=w.player; label.lastElementChild.textContent=w.goal;
  $('#level-badge').textContent=levels[level].icon+' '+levels[level].label;
  canvas.setAttribute('aria-label',`Laberinto de ${levels[level].n} por ${levels[level].n}. Mueve a ${w.name} usando las flechas, los botones o las casillas vecinas.`);
}
function center(index) { const cell=bounds.size/levels[level].n; return [bounds.pad+(index%levels[level].n+.5)*cell,bounds.pad+(Math.floor(index/levels[level].n)+.5)*cell]; }
function drawPath(path, color, width, dotted) {
  if(!path.length)return;
  ctx.beginPath(); path.forEach((v,i)=>{const [x,y]=center(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dotted?[4,11]:[]);ctx.stroke();ctx.setLineDash([]);
}
function draw() {
  const css=getComputedStyle(document.body), n=levels[level].n, cell=bounds.size/n;
  ctx.clearRect(0,0,600,600);ctx.fillStyle=css.getPropertyValue('--board');ctx.fillRect(0,0,600,600);
  ctx.fillStyle=world==='forest'?'#eef3d8':world==='sea'?'#dbf2f5':'#eee4f8';
  const [gx,gy]=center(n*n-1); ctx.beginPath();ctx.arc(gx,gy,cell*.35,0,Math.PI*2);ctx.fill();
  drawPath(trail,world==='forest'?'#e6ce81':world==='sea'?'#f0ce88':'#dcc3f1',Math.max(8,cell*.15),false);
  drawPath([player,...hintCells],css.getPropertyValue('--trail'),Math.max(5,cell*.12),true);
  ctx.strokeStyle=css.getPropertyValue('--wall');ctx.lineWidth=n>=7?7:10;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
  for(let i=0;i<cells.length;i++) {
    const x=bounds.pad+i%n*cell,y=bounds.pad+Math.floor(i/n)*cell;
    if(cells[i][0]) { ctx.moveTo(x,y);ctx.lineTo(x+cell,y); }
    if(cells[i][3]) { ctx.moveTo(x,y);ctx.lineTo(x,y+cell); }
    if(i%n===n-1&&cells[i][1]) {ctx.moveTo(x+cell,y);ctx.lineTo(x+cell,y+cell);}
    if(Math.floor(i/n)===n-1&&cells[i][2]) {ctx.moveTo(x,y+cell);ctx.lineTo(x+cell,y+cell);}
  }ctx.stroke();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${Math.min(64,cell*.58)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.fillText(worlds[world].goal,gx,gy+2);
  const [px,py]=center(player);ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.arc(px,py,cell*.34,0,Math.PI*2);ctx.fill();ctx.fillText(worlds[world].player,px,py+2);
  if(won){ctx.strokeStyle='#dfb344';ctx.lineWidth=4;ctx.beginPath();ctx.arc(px,py,cell*.39,0,Math.PI*2);ctx.stroke();}
}
function tone(frequency, duration=.08, delay=0) {
  if(!soundOn)return;
  try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const osc=audioContext.createOscillator(), gain=audioContext.createGain(), now=audioContext.currentTime+delay;osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+duration);}catch{/* Sonidos opcionales: el juego sigue disponible. */}
}
function move(d) {
  if(!Number.isInteger(d)||d<0||d>3||won)return false;
  const next=neighbor(player,d);
  if(cells[player][d]||next===-1){$('#status').textContent='Por ahí hay una pared. ¡Prueba otro camino!';return false;}
  player=next;const old=trail.indexOf(next);if(old>=0)trail=trail.slice(0,old+1);else trail.push(next);
  clearTimeout(hintTimer);hintCells=[];tone(370+player%4*60);draw();
  $('#status').textContent='¡Sigue explorando!';
  if(player===cells.length-1)win();
  return true;
}
function showHint() {
  if(won)return;
  clearTimeout(hintTimer);hintCells=findPath(player,cells.length-1).slice(1,3);draw();
  $('#status').textContent='Sigue los puntitos dorados. ¡Tú puedes!';
  hintTimer=setTimeout(()=>{hintCells=[];draw();$('#status').textContent='Puedes pedir otra pista cuando quieras.';},4000);
}
function restart() {
  clearTimeout(hintTimer);hintCells=[];player=0;trail=[0];won=false;$('#hint').disabled=false;$('#status').textContent='¡Vamos a intentarlo otra vez!';draw();
}
function win() {
  won=true;$('#hint').disabled=true;$('#status').textContent='¡Has llegado! ¡Lo has conseguido!';draw();
  $('#win-message').textContent=worlds[world].win;$('#win-dialog').showModal();
  [523,659,784,1047].forEach((f,i)=>tone(f,.22,i*.13));
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){for(let i=0;i<38;i++){const p=document.createElement('i');p.className='confetti-piece';p.style.left=Math.random()*100+'%';p.style.background=['#e6b956','#75a579','#e79271','#9bbacc'][i%4];p.style.animationDelay=Math.random()*.6+'s';$('#confetti').append(p);}setTimeout(()=>$('#confetti').replaceChildren(),3400);}
}
function setLevel(value) { if(!Number.isInteger(value)||!levels[value])throw new Error('Nivel inválido');level=value;document.querySelectorAll('[data-level]').forEach(b=>{const selected=Number(b.dataset.level)===level;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});generate(); }
function setWorld(value) {if(!Object.hasOwn(worlds,value))throw new Error('Aventura inválida');world=value;document.querySelectorAll('.world').forEach(b=>{const selected=b.dataset.world===world;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});generate();}
function pointerMove(event) {
  const rect=canvas.getBoundingClientRect(), x=(event.clientX-rect.left)*600/rect.width, y=(event.clientY-rect.top)*600/rect.height, n=levels[level].n,cell=bounds.size/n;
  const tx=Math.floor((x-bounds.pad)/cell),ty=Math.floor((y-bounds.pad)/cell);
  if(tx<0||ty<0||tx>=n||ty>=n)return;
  const px=player%n,py=Math.floor(player/n);let d,steps;
  if(tx===px&&ty!==py){d=ty>py?2:0;steps=Math.abs(ty-py);}else if(ty===py&&tx!==px){d=tx>px?1:3;steps=Math.abs(tx-px);}else return;
  for(let i=0;i<steps;i++)if(!move(d))break;
}
document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>setLevel(Number(b.dataset.level))));
document.querySelectorAll('.world').forEach(b=>b.addEventListener('click',()=>setWorld(b.dataset.world)));
document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.dir))));
$('#generate').addEventListener('click',generate);$('#hint').addEventListener('click',showHint);$('#restart').addEventListener('click',restart);$('#next').addEventListener('click',generate);
$('#help').addEventListener('click',()=>$('#help-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#sound').addEventListener('click',()=>{soundOn=!soundOn;$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound').setAttribute('aria-label',soundOn?'Desactivar sonidos':'Activar sonidos');$('#sound').title=soundOn?'Desactivar sonidos':'Activar sonidos';tone(660,.16);});
document.addEventListener('keydown',event=>{if(document.querySelector('dialog[open]')||event.altKey||event.ctrlKey||event.metaKey)return;const map={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};if(Object.hasOwn(map,event.key)){event.preventDefault();move(map[event.key]);}});
canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;dragging=true;canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);pointerMove(event);});
canvas.addEventListener('pointermove',event=>{if(dragging)pointerMove(event);});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('lostpointercapture',()=>dragging=false);
window.addEventListener('resize',draw);
generate();
// Acciones opcionales para navegadores que admitan WebMCP.
if(document.modelContext?.registerTool){const lifetime=new AbortController();for(const tool of [
{name:'crear_laberinto',description:'Crea un laberinto nuevo y actualiza la partida visible. nivel: 0 (3 años), 1 (4 años), 2 (5 años), 3 (6–7 años).',inputSchema:{type:'object',properties:{nivel:{type:'integer',minimum:0,maximum:3},aventura:{type:'string',enum:['forest','sea','space']}},additionalProperties:false},execute(input){if(!input||typeof input!=='object')throw new Error('Opciones inválidas');if(input.nivel!==undefined&&(!Number.isInteger(input.nivel)||!levels[input.nivel]))throw new Error('Nivel inválido');if(input.aventura!==undefined&&!Object.hasOwn(worlds,input.aventura))throw new Error('Aventura inválida');if(input.nivel!==undefined)level=input.nivel;if(input.aventura!==undefined)world=input.aventura;setLevel(level);setWorld(world);return{nivel:level,aventura:world,casillas:cells.length};}},
{name:'leer_partida_laberinto',description:'Consulta el nivel, la aventura y la posición actual sin cambiar la partida.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(){return{nivel:level,aventura:world,posicion:player,completado:won};}}
]){try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,untrustedContentHint:false,...tool.annotations}},{signal:lifetime.signal})).catch(()=>{});}catch{}}window.addEventListener('pagehide',()=>lifetime.abort(),{once:true});}
