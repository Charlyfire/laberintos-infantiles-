/* Geometría independiente de pantalla: las coordenadas se expresan en casillas. */
(function(root){
'use strict';
const directions=[[0,-1],[1,0],[0,1],[-1,0]];
const levels=[
 {cols:6,rows:3,label:'Primeros pasos',age:'3 años',icon:'🌱',maxPath:12,resumeRadius:.48},
 {cols:8,rows:4,label:'Exploradores',age:'4 años',icon:'🌼',maxPath:20,resumeRadius:.42},
 {cols:10,rows:5,label:'Aventureros',age:'5 años',icon:'🌳',maxPath:32,resumeRadius:.33},
 {cols:12,rows:6,label:'Superexploradores',age:'6–7 años',icon:'🏕️',maxPath:72,resumeRadius:.30}
];
const clearance=.085;
function neighbor(i,d,cols,rows){const x=i%cols+directions[d][0],y=Math.floor(i/cols)+directions[d][1];return x<0||y<0||x>=cols||y>=rows?-1:y*cols+x;}
function carve(cols,rows,random=Math.random){const cells=Array.from({length:cols*rows},()=>[true,true,true,true]),visited=new Set([0]),stack=[0];while(stack.length){const current=stack.at(-1),choices=directions.map((_,d)=>({d,next:neighbor(current,d,cols,rows)})).filter(v=>v.next>=0&&!visited.has(v.next));if(!choices.length){stack.pop();continue;}const {d,next}=choices[Math.floor(random()*choices.length)];cells[current][d]=false;cells[next][(d+2)%4]=false;visited.add(next);stack.push(next);}return cells;}
function path(cells,cols,rows,from=0,to=cells.length-1){const prev=new Map([[from,-1]]),queue=[from];for(let i=0;i<queue.length;i++){const at=queue[i];if(at===to)break;for(let d=0;d<4;d++){const next=neighbor(at,d,cols,rows);if(next>=0&&!cells[at][d]&&!prev.has(next)){prev.set(next,at);queue.push(next);}}}if(!prev.has(to))return [];const result=[];for(let at=to;at!==-1;at=prev.get(at))result.push(at);return result.reverse();}
function generate(level,random=Math.random){if(!Number.isInteger(level)||!levels[level])throw new Error('Nivel inválido');const config=levels[level];let cells,best=Infinity;for(let i=0;i<120;i++){const candidate=carve(config.cols,config.rows,random),length=path(candidate,config.cols,config.rows).length;if(length<best){cells=candidate;best=length;}if(length<=config.maxPath)break;}
 // Para los pequeños, un árbol de caminos con ruta principal corta garantiza el límite.
 if(best>config.maxPath&&level<3){cells=Array.from({length:config.cols*config.rows},()=>[true,true,true,true]);const visited=new Set([0]);let at=0;while(at!==cells.length-1){const x=at%config.cols,y=Math.floor(at/config.cols),d=x===config.cols-1?2:y===config.rows-1?1:random()<.5?1:2;const next=neighbor(at,d,config.cols,config.rows);cells[at][d]=false;cells[next][(d+2)%4]=false;visited.add(next);at=next;}const stack=[...visited];while(stack.length){const current=stack.at(-1),choices=directions.map((_,d)=>({d,next:neighbor(current,d,config.cols,config.rows)})).filter(v=>v.next>=0&&!visited.has(v.next));if(!choices.length){stack.pop();continue;}const {d,next}=choices[Math.floor(random()*choices.length)];cells[current][d]=false;cells[next][(d+2)%4]=false;visited.add(next);stack.push(next);}}
 return {cells,...config};}
function center(i,cols){return {x:i%cols+.5,y:Math.floor(i/cols)+.5};}
function cellAt(p,maze){if(p.x<0||p.y<0||p.x>=maze.cols||p.y>=maze.rows)return -1;return Math.floor(p.y)*maze.cols+Math.floor(p.x);}
function walls(maze){const result=[];for(let i=0;i<maze.cells.length;i++){const x=i%maze.cols,y=Math.floor(i/maze.cols),c=maze.cells[i];if(c[0])result.push({x1:x,y1:y,x2:x+1,y2:y});if(c[3])result.push({x1:x,y1:y,x2:x,y2:y+1});if(x===maze.cols-1&&c[1])result.push({x1:x+1,y1:y,x2:x+1,y2:y+1});if(y===maze.rows-1&&c[2])result.push({x1:x,y1:y+1,x2:x+1,y2:y+1});}return result;}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
// Intersección segmento/rectángulo: comprueba incluso los saltos del puntero.
function intersectsBox(a,b,minX,minY,maxX,maxY){let low=0,high=1;for(const [start,delta,min,max] of [[a.x,b.x-a.x,minX,maxX],[a.y,b.y-a.y,minY,maxY]]){if(Math.abs(delta)<1e-10){if(start<min||start>max)return false;continue;}let t1=(min-start)/delta,t2=(max-start)/delta;if(t1>t2)[t1,t2]=[t2,t1];low=Math.max(low,t1);high=Math.min(high,t2);if(low>high)return false;}return true;}
function blocked(a,b,segments,padding=clearance){if(![a.x,a.y,b.x,b.y].every(Number.isFinite))return true;return segments.some(w=>intersectsBox(a,b,Math.min(w.x1,w.x2)-padding,Math.min(w.y1,w.y2)-padding,Math.max(w.x1,w.x2)+padding,Math.max(w.y1,w.y2)+padding));}
function guide(p,maze){const i=cellAt(p,maze);if(i<0)return p;const c=center(i,maze.cols),candidates=[c];for(let d=0;d<4;d++){if(maze.cells[i][d])continue;const [dx,dy]=directions[d];candidates.push({x:dx?Math.max(Math.min(p.x,c.x+Math.max(dx,0)*.5),c.x+Math.min(dx,0)*.5):c.x,y:dy?Math.max(Math.min(p.y,c.y+Math.max(dy,0)*.5),c.y+Math.min(dy,0)*.5):c.y});}return candidates.reduce((best,q)=>distance(p,q)<distance(p,best)?q:best);}
function trace(from,to,segments){const length=distance(from,to),steps=Math.max(1,Math.ceil(length/.025)),points=[];let last=from;for(let s=1;s<=steps;s++){const p={x:from.x+(to.x-from.x)*s/steps,y:from.y+(to.y-from.y)*s/steps};if(blocked(last,p,segments))return {points,blocked:true};points.push(p);last=p;}return {points,blocked:false};}
const api={levels,directions,clearance,neighbor,generate,path,center,cellAt,walls,distance,blocked,guide,trace};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MazeCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
