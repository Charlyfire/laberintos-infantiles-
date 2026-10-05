/* Geometría independiente de pantalla: las coordenadas se expresan en casillas. */
(function(root){
'use strict';
const directions=[[0,-1],[1,0],[0,1],[-1,0]];
const levels=[
 {cols:6,rows:3,label:'Primeros pasos',difficulty:'Inicio',icon:'🌱',minPath:8,maxPath:12,minChoices:1,branchDepth:1,minTurns:0,minTempting:0,resumeRadius:.48},
 {cols:8,rows:4,label:'Paseo por el bosque',difficulty:'Fácil',icon:'🌼',minPath:11,maxPath:20,minChoices:2,branchDepth:1,minTurns:0,minTempting:0,resumeRadius:.42},
 {cols:10,rows:5,label:'Exploradores',difficulty:'Medio',icon:'🌳',minPath:16,maxPath:32,minChoices:4,branchDepth:2,minTurns:0,minTempting:0,resumeRadius:.33},
 {cols:12,rows:6,label:'Aventureros',difficulty:'Desafío',icon:'🏕️',minPath:22,maxPath:52,minChoices:5,branchDepth:3,minTurns:0,minTempting:0,resumeRadius:.30},
 {cols:14,rows:7,label:'Expertos',difficulty:'Difícil',icon:'🧭',minPath:30,maxPath:60,minChoices:6,branchDepth:3,minTurns:10,minTempting:2,resumeRadius:.30},
 {cols:16,rows:8,label:'Estrategas',difficulty:'Muy difícil',icon:'🗺️',minPath:40,maxPath:80,minChoices:8,branchDepth:4,minTurns:14,minTempting:3,resumeRadius:.29},
 {cols:18,rows:9,label:'Maestros del camino',difficulty:'Experto',icon:'🏔️',minPath:48,maxPath:95,minChoices:9,branchDepth:4,minTurns:18,minTempting:4,resumeRadius:.28},
 {cols:20,rows:10,label:'El gran reto',difficulty:'Extremo',icon:'🏆',minPath:56,maxPath:115,minChoices:10,branchDepth:5,minTurns:22,minTempting:5,resumeRadius:.28},
 {cols:28,rows:14,label:'Laberinto maestro',difficulty:'Adultos',icon:'🧠',adult:true,minPath:100,maxPath:190,minChoices:16,branchDepth:6,minTurns:35,minTempting:8,resumeRadius:.27}
];
const clearance=.125;
function neighbor(i,d,cols,rows){const x=i%cols+directions[d][0],y=Math.floor(i/cols)+directions[d][1];return x<0||y<0||x>=cols||y>=rows?-1:y*cols+x;}
// Un árbol aleatorio de Kruskal reparte cruces por todo el tablero.
function carve(cols,rows,random=Math.random){
 const cells=Array.from({length:cols*rows},()=>[true,true,true,true]),parents=cells.map((_,i)=>i),edges=[];
 for(let i=0;i<cells.length;i++)for(const d of [1,2]){const next=neighbor(i,d,cols,rows);if(next>=0)edges.push({at:i,next,d});}
 for(let i=edges.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[edges[i],edges[j]]=[edges[j],edges[i]];}
 function root(i){while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;}
 for(const {at,next,d} of edges){const a=root(at),b=root(next);if(a===b)continue;parents[a]=b;cells[at][d]=false;cells[next][(d+2)%4]=false;}
 return cells;
}
function path(cells,cols,rows,from=0,to=cells.length-1){const prev=new Map([[from,-1]]),queue=[from];for(let i=0;i<queue.length;i++){const at=queue[i];if(at===to)break;for(let d=0;d<4;d++){const next=neighbor(at,d,cols,rows);if(next>=0&&!cells[at][d]&&!prev.has(next)){prev.set(next,at);queue.push(next);}}}if(!prev.has(to))return [];const result=[];for(let at=to;at!==-1;at=prev.get(at))result.push(at);return result.reverse();}
// Para los retos altos se diseña primero un recorrido largo y se construyen desvíos profundos alrededor.
function carveChallenge(config,startCell,goalCell,random){
 const {cols,rows}=config,tree=Array.from({length:cols*rows},()=>[true,true,true,true]),seen=new Set([startCell]),stack=[startCell];
 const shuffled=items=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
 const open=(cells,a,b)=>{const d=directions.findIndex((_,d)=>neighbor(a,d,cols,rows)===b);cells[a][d]=false;cells[b][(d+2)%4]=false;};
 while(stack.length){const at=stack.at(-1),next=shuffled(directions.map((_,d)=>neighbor(at,d,cols,rows)).filter(n=>n>=0&&!seen.has(n)))[0];if(next===undefined){stack.pop();continue;}open(tree,at,next);seen.add(next);stack.push(next);}
 const route=path(tree,cols,rows,startCell,goalCell);
 if(route.length<config.minPath||route.length>config.maxPath)return tree;
 const cells=Array.from({length:cols*rows},()=>[true,true,true,true]),visited=new Set(route),roots=shuffled(route.slice(1,-1));
 for(let i=1;i<route.length;i++)open(cells,route[i-1],route[i]);
 const goal=center(goalCell,cols),toGoal=i=>{const p=center(i,cols);return Math.abs(p.x-goal.x)+Math.abs(p.y-goal.y);};
 const usedRoots=new Set();let misleading=0,created=0;
 function findBranch(root,mustApproach){let budget=1500;const local=new Set([root]);
  function search(at,walk,closer){if(--budget<0)return null;if(walk.length>=config.branchDepth)return !mustApproach||closer?walk:null;
   for(const next of shuffled(directions.map((_,d)=>neighbor(at,d,cols,rows)).filter(n=>n>=0&&!visited.has(n)&&!local.has(n)))){local.add(next);const found=search(next,[...walk,next],closer||toGoal(next)<=toGoal(root)-2);if(found)return found;local.delete(next);}return null;
  }return search(root,[],false);
 }
 for(let pass=0;pass<2;pass++)for(const root of roots){
  if(usedRoots.has(root)||created>=config.minChoices+2)continue;
  const requireClose=pass===0;if(requireClose&&misleading>=config.minTempting)continue;
  const branch=findBranch(root,requireClose);if(!branch)continue;let from=root;
  for(const next of branch){open(cells,from,next);visited.add(next);from=next;}
  usedRoots.add(root);created++;if(branch.some(n=>toGoal(n)<=toGoal(root)-2))misleading++;
 }
 const active=shuffled(visited);
 while(active.length){const i=random()<.75?active.length-1:Math.floor(random()*active.length),at=active[i],options=directions.map((_,d)=>neighbor(at,d,cols,rows)).filter(n=>n>=0&&!visited.has(n));if(!options.length){active.splice(i,1);continue;}const next=options[Math.floor(random()*options.length)];open(cells,at,next);visited.add(next);active.push(next);}
 return cells;
}
function routeStats(maze){
 const route=path(maze.cells,maze.cols,maze.rows,maze.startCell,maze.goalCell),onRoute=new Set(route),goal=center(maze.goalCell,maze.cols);
 let choices=0,tempting=0,turns=0;
 const toGoal=cell=>{const p=center(cell,maze.cols);return Math.abs(p.x-goal.x)+Math.abs(p.y-goal.y);};
 for(let i=1;i<route.length-1;i++){
  const at=route[i];if(route[i]-route[i-1]!==route[i+1]-route[i])turns++;
  let meaningful=false,misleading=false;
  for(let d=0;d<4;d++){
   const next=neighbor(at,d,maze.cols,maze.rows);
   if(next<0||maze.cells[at][d]||onRoute.has(next))continue;
   const seen=new Set([next]),queue=[{at:next,depth:1}];let deep=false,closer=false;
   for(let j=0;j<queue.length;j++){
    const item=queue[j];if(item.depth>=maze.branchDepth)deep=true;if(toGoal(item.at)<=toGoal(at)-2)closer=true;
    for(let dir=0;dir<4;dir++){const child=neighbor(item.at,dir,maze.cols,maze.rows);if(child>=0&&!maze.cells[item.at][dir]&&!onRoute.has(child)&&!seen.has(child)){seen.add(child);queue.push({at:child,depth:item.depth+1});}}
   }
   if(deep){meaningful=true;if(closer)misleading=true;}
  }
  if(meaningful)choices++;if(misleading)tempting++;
 }
 return {solutionLength:route.length,branchDecisions:choices,misleadingBranches:tempting,routeTurns:turns};
}
function generate(level,random=Math.random,options={}){
 if(!Number.isInteger(level)||!levels[level])throw new Error('Nivel inválido');
 const config=levels[level],position=options.startPosition??'top';
 if(!['top','middle','bottom'].includes(position))throw new Error('Altura de salida inválida');
 const row=position==='bottom'?config.rows-1:position==='middle'?Math.floor(config.rows/2):0;
 const startCell=row*config.cols,goalCell=(row===0?config.rows-1:0)*config.cols+config.cols-1;
 let seed=1729+level*101+row*31;
 const fallback=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
 // El segundo pase determinista asegura calidad también con una fuente aleatoria degenerada.
 for(let pass=0;pass<2;pass++)for(let attempt=0;attempt<(pass?512:128);attempt++){
  const maze={cells:level>=4?carveChallenge(config,startCell,goalCell,pass?fallback:random):carve(config.cols,config.rows,pass?fallback:random),...config,startCell,goalCell};
  const stats=routeStats(maze);
  if(stats.solutionLength>=config.minPath&&stats.solutionLength<=config.maxPath&&stats.branchDecisions>=config.minChoices&&stats.routeTurns>=config.minTurns&&stats.misleadingBranches>=config.minTempting)return {...maze,...stats};
 }
 throw new Error('No se ha podido crear un laberinto con suficientes bifurcaciones.');
}
function missionTargets(maze,count,random=Math.random){
 if(!Number.isInteger(count)||count<0||count>3)throw new Error('Número de estrellas inválido');if(!count)return [];
 const route=new Set(path(maze.cells,maze.cols,maze.rows,maze.startCell,maze.goalCell));
 const candidates=maze.cells.map((walls,cell)=>({cell,deadEnd:walls.filter(w=>!w).length===1,tie:random()})).filter(item=>!route.has(item.cell));
 if(candidates.length<count)throw new Error('No hay espacio suficiente para las estrellas');
 for(const item of candidates){const way=path(maze.cells,maze.cols,maze.rows,item.cell,maze.startCell);item.depth=way.findIndex(cell=>route.has(cell));}
 const chosen=[];
 while(chosen.length<count){candidates.sort((a,b)=>{
  const score=item=>{const p=center(item.cell,maze.cols),spread=chosen.length?Math.min(...chosen.map(cell=>{const q=center(cell,maze.cols);return Math.abs(p.x-q.x)+Math.abs(p.y-q.y);})):0;return item.depth+spread*.65+(item.deadEnd?4:0)+item.tie*.3;};return score(b)-score(a);
 });chosen.push(candidates.shift().cell);}
 return chosen;
}
function center(i,cols){return {x:i%cols+.5,y:Math.floor(i/cols)+.5};}
function cellAt(p,maze){if(p.x<0||p.y<0||p.x>=maze.cols||p.y>=maze.rows)return -1;return Math.floor(p.y)*maze.cols+Math.floor(p.x);}
function walls(maze){const result=[];for(let i=0;i<maze.cells.length;i++){const x=i%maze.cols,y=Math.floor(i/maze.cols),c=maze.cells[i];if(c[0])result.push({x1:x,y1:y,x2:x+1,y2:y});if(c[3])result.push({x1:x,y1:y,x2:x,y2:y+1});if(x===maze.cols-1&&c[1])result.push({x1:x+1,y1:y,x2:x+1,y2:y+1});if(y===maze.rows-1&&c[2])result.push({x1:x,y1:y+1,x2:x+1,y2:y+1});}return result;}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
// Intersección segmento/rectángulo: comprueba incluso los saltos del puntero.
function intersectsBox(a,b,minX,minY,maxX,maxY){let low=0,high=1;for(const [start,delta,min,max] of [[a.x,b.x-a.x,minX,maxX],[a.y,b.y-a.y,minY,maxY]]){if(Math.abs(delta)<1e-10){if(start<min||start>max)return false;continue;}let t1=(min-start)/delta,t2=(max-start)/delta;if(t1>t2)[t1,t2]=[t2,t1];low=Math.max(low,t1);high=Math.min(high,t2);if(low>high)return false;}return true;}
function blocked(a,b,segments,padding=clearance){if(![a.x,a.y,b.x,b.y].every(Number.isFinite))return true;return segments.some(w=>intersectsBox(a,b,Math.min(w.x1,w.x2)-padding,Math.min(w.y1,w.y2)-padding,Math.max(w.x1,w.x2)+padding,Math.max(w.y1,w.y2)+padding));}
function guide(p,maze){const i=cellAt(p,maze);if(i<0)return p;const c=center(i,maze.cols),candidates=[c];for(let d=0;d<4;d++){if(maze.cells[i][d])continue;const [dx,dy]=directions[d];candidates.push({x:dx?Math.max(Math.min(p.x,c.x+Math.max(dx,0)*.5),c.x+Math.min(dx,0)*.5):c.x,y:dy?Math.max(Math.min(p.y,c.y+Math.max(dy,0)*.5),c.y+Math.min(dy,0)*.5):c.y});}return candidates.reduce((best,q)=>distance(p,q)<distance(p,best)?q:best);}
function trace(from,to,segments,padding=clearance){const length=distance(from,to),steps=Math.max(1,Math.ceil(length/.025)),points=[];let last=from;for(let s=1;s<=steps;s++){const p={x:from.x+(to.x-from.x)*s/steps,y:from.y+(to.y-from.y)*s/steps};if(blocked(last,p,segments,padding))return {points,blocked:true};points.push(p);last=p;}return {points,blocked:false};}
const api={levels,directions,clearance,neighbor,generate,routeStats,path,missionTargets,center,cellAt,walls,distance,blocked,guide,trace};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MazeCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
