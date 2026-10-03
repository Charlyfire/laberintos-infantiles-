const test=require('node:test'),assert=require('node:assert/strict'),C=require('../maze-core.js');
function seeded(seed){return()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};}
test('1200 laberintos conectados con salida regulable, límites por edad y bifurcaciones en la solución',()=>{
 for(let level=0;level<4;level++)for(const position of ['top','middle','bottom'])for(let seed=1;seed<=100;seed++){
  const m=C.generate(level,seeded(seed),{startPosition:position}),route=C.path(m.cells,m.cols,m.rows,m.startCell,m.goalCell);
  const row=position==='bottom'?m.rows-1:position==='middle'?Math.floor(m.rows/2):0;
  assert.equal(m.startCell,row*m.cols);assert.notEqual(m.startCell,m.goalCell);
  assert.ok(m.cols>m.rows);assert.ok(route.length>=m.minPath&&route.length<=m.maxPath);
  const seen=new Set([m.startCell]),queue=[m.startCell];let edges=0;
  for(let i=0;i<queue.length;i++)for(let d=0;d<4;d++){
   const next=C.neighbor(queue[i],d,m.cols,m.rows);
   if(next<0){assert.equal(m.cells[queue[i]][d],true);continue;}
   assert.equal(m.cells[queue[i]][d],m.cells[next][(d+2)%4]);
   if(!m.cells[queue[i]][d]){edges++;if(!seen.has(next)){seen.add(next);queue.push(next);}}
  }
  assert.equal(seen.size,m.cells.length);assert.equal(edges/2,m.cells.length-1);
  // Se comprueba desde el recorrido real, sin confiar en las métricas del generador.
  const onRoute=new Set(route);let junctions=0;
  for(const at of route.slice(1,-1)){
   let deepBranch=false;
   for(let d=0;d<4;d++){
    const first=C.neighbor(at,d,m.cols,m.rows);if(first<0||m.cells[at][d]||onRoute.has(first))continue;
    const explore=[{cell:first,depth:1}],visited=new Set([first]);
    for(let i=0;i<explore.length;i++){
     const {cell,depth}=explore[i];if(depth>=m.branchDepth){deepBranch=true;break;}
     for(let dir=0;dir<4;dir++){const next=C.neighbor(cell,dir,m.cols,m.rows);if(next>=0&&!m.cells[cell][dir]&&!onRoute.has(next)&&!visited.has(next)){visited.add(next);explore.push({cell:next,depth:depth+1});}}
    }
   }
   if(deepBranch)junctions++;
  }
  assert.ok(junctions>=m.minChoices,`nivel ${level}, ${position}: ${junctions} bifurcaciones`);
 }
});
test('un segmento rápido se detiene antes de una pared y no salta al otro lado',()=>{const walls=[{x1:1,y1:0,x2:1,y2:2}];const r=C.trace({x:.5,y:.5},{x:5,y:.5},walls);assert.equal(r.blocked,true);assert.ok(r.points.at(-1).x<1-C.clearance);for(const p of r.points)assert.ok(p.x<1-C.clearance);});
test('diagonales y esquinas no cortan una pared aunque el destino quede libre',()=>{const walls=[{x1:1,y1:0,x2:1,y2:1}];assert.equal(C.blocked({x:.5,y:.5},{x:1.5,y:1.5},walls),true);assert.equal(C.blocked({x:.5,y:1.3},{x:1.5,y:1.3},walls),false);assert.equal(C.blocked({x:.5,y:1.03},{x:1.5,y:1.03},walls),true);});
test('el camino de solución puede dibujarse completo, en ambos sentidos y en todos los niveles',()=>{for(let level=0;level<4;level++)for(let seed=1;seed<=30;seed++){const m=C.generate(level,seeded(seed)),walls=C.walls(m),route=C.path(m.cells,m.cols,m.rows);for(let i=1;i<route.length;i++){const a=C.center(route[i-1],m.cols),b=C.center(route[i],m.cols);assert.equal(C.trace(a,b,walls).blocked,false);assert.equal(C.trace(b,a,walls).blocked,false);}}});
test('la ayuda ajusta el trazo al centro y no habilita pasos por paredes cerradas',()=>{const m={cols:2,rows:1,cells:[[true,false,true,true],[true,true,true,false]]};assert.deepEqual(C.guide({x:.8,y:.65},m),{x:.8,y:.5});assert.deepEqual(C.guide({x:.2,y:.2},m),{x:.5,y:.5});m.cells[0][1]=true;m.cells[1][3]=true;assert.equal(C.trace({x:.5,y:.5},C.guide({x:1.5,y:.5},m),C.walls(m)).blocked,true);});
test('entradas inválidas no generan ni dibujan coordenadas corruptas',()=>{for(const x of [-1,4,NaN,1.2,'0'])assert.throws(()=>C.generate(x));assert.equal(C.blocked({x:NaN,y:0},{x:1,y:1},[]),true);});

test('la generación mantiene bifurcaciones con fuentes aleatorias constantes',()=>{for(let level=0;level<4;level++)for(const startPosition of ['top','middle','bottom'])for(const random of [()=>0,()=>.5,()=>.999999]){const m=C.generate(level,random,{startPosition});assert.ok(m.branchDecisions>=m.minChoices);}});
test('el margen de colisión respeta el grosor de pared y trazo',()=>{const walls=[{x1:1,y1:0,x2:1,y2:2}];const result=C.trace({x:.5,y:.5},{x:1.5,y:.5},walls,.2);assert.ok(result.blocked);assert.ok(result.points.at(-1).x<.8);assert.equal(C.trace({x:.5,y:.5},{x:.75,y:.5},walls,.2).blocked,false);});
test('una altura inválida se rechaza antes de crear el laberinto',()=>{assert.throws(()=>C.generate(0,Math.random,{startPosition:'invalid'}));});
