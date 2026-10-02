// ---------- Level data ----------
// Stage 1: five hand-made levels. Stage 2 replaces this file with the generator output (tools/genlevels.mjs).
// Format: { diff: 'easy'|'normal'|'hard'|'superhard', w, h, a: ['x,y:MOVES', ...] }
// An arrow starts at its tail cell (x, y) and walks MOVES (U D L R, one cell each); the last move is the head direction.
// Coordinates: x to the right, y down, 0-based. Every level must be solvable (tools/probe.mjs checks with AP.board.solve).
AP.LEVELS = [
  // 1: one arrow — tap it
  { diff: 'easy', w: 3, h: 5, a: ['1,4:UUU'] },
  // 2: order — the up arrow sits in the way of the right arrow
  { diff: 'easy', w: 4, h: 5, a: ['0,2:RR', '3,4:UU'] },
  // 3: two chains
  { diff: 'easy', w: 4, h: 4, a: ['0,0:DD', '0,3:RRR', '1,0:RR', '2,2:RU'] },
  // 4: a frame that unlocks from the corners
  { diff: 'normal', w: 6, h: 6, a: ['0,5:UUUU', '0,0:RRRR', '5,0:DDDD', '1,5:RRR', '2,4:UUU', '3,1:DDD', '4,4:UUU', '1,1:DD'] },
  // 5: longer chains, some arrows bend
  { diff: 'hard', w: 6, h: 7, a: ['0,6:UUUUU', '0,0:RRR', '5,3:UUU', '1,1:RRR', '4,2:LLL', '1,6:RRRR', '2,5:UU', '3,3:DDR', '5,5:U', '4,4:U', '1,3:DD'] },
];
