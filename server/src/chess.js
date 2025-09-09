export function inBounds(r, c) { return r>=0 && r<8 && c>=0 && c<8; }

export function initialBoard() {
  const p=(t,c)=>({type:t,color:c,hasMoved:false});
  return [
    [p('R','b'),p('N','b'),p('B','b'),p('Q','b'),p('K','b'),p('B','b'),p('N','b'),p('R','b')],
    Array(8).fill(0).map(()=>p('P','b')),
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    Array(8).fill(0).map(()=>p('P','w')),
    [p('R','w'),p('N','w'),p('B','w'),p('Q','w'),p('K','w'),p('B','w'),p('N','w'),p('R','w')],
  ];
}

export function cloneBoard(b){return b.map(row=>row.map(c=>c?{...c}:null));}
export function at(b,pos){return b[pos.r][pos.c];}
export function opposite(c){return c==='w'?'b':'w';}

function pushSlide(board, from, color, dr, dc, acc){
  let r=from.r+dr, c=from.c+dc;
  while(inBounds(r,c)){
    const t=board[r][c];
    if(!t){acc.push({r,c});}
    else { if(t.color!==color) acc.push({r,c}); break; }
    r+=dr; c+=dc;
  }
}

export function pseudoLegalMoves(board, from, enPassantTarget){
  const piece=at(board,from); if(!piece) return []; const {type,color}=piece; const m=[];
  if(type==='P'){
    const dir=color==='w'?-1:1; const start=color==='w'?6:1; const one={r:from.r+dir,c:from.c};
    if(inBounds(one.r,one.c)&&!at(board,one)){ m.push(one); const two={r:from.r+2*dir,c:from.c}; if(from.r===start && !at(board,two)) m.push(two); }
    for(const dc of [-1,1]){ const cap={r:from.r+dir,c:from.c+dc}; if(inBounds(cap.r,cap.c)){ const t=at(board,cap); if(t&&t.color!==color) m.push(cap);} }
    if(enPassantTarget){ for(const dc of [-1,1]){ const ep={r:from.r+dir,c:from.c+dc}; if(ep.r===enPassantTarget.r && ep.c===enPassantTarget.c && !at(board,ep)) m.push(ep);} }
    return m;
  }
  if(type==='N'){
    for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){ const r=from.r+dr,c=from.c+dc; if(!inBounds(r,c)) continue; const t=board[r][c]; if(!t||t.color!==color) m.push({r,c}); }
    return m;
  }
  if(type==='B'||type==='R'||type==='Q'){
    const dirs=[]; if(type!=='R') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]); if(type!=='B') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    for(const [dr,dc] of dirs) pushSlide(board,from,color,dr,dc,m); return m;
  }
  if(type==='K'){
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ if(dr===0&&dc===0) continue; const r=from.r+dr,c=from.c+dc; if(!inBounds(r,c)) continue; const t=board[r][c]; if(!t||t.color!==color) m.push({r,c}); }
    const home=color==='w'?7:0; if(from.r===home && from.c===4 && !piece.hasMoved){
      const rookK=board[home][7]; if(rookK && rookK.type==='R' && !rookK.hasMoved && !board[home][5] && !board[home][6]) m.push({r:home,c:6});
      const rookQ=board[home][0]; if(rookQ && rookQ.type==='R' && !rookQ.hasMoved && !board[home][1] && !board[home][2] && !board[home][3]) m.push({r:home,c:2});
    }
    return m;
  }
  return m;
}

export function findKing(board,color){ for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p&&p.type==='K'&&p.color===color) return {r,c}; } return null; }
export function squareAttackedBy(board,target,attacker,enPassantTarget){
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(!p||p.color!==attacker) continue; const from={r,c}; const moves=pseudoLegalMoves(board,from,enPassantTarget); if(moves.some(m=>m.r===target.r&&m.c===target.c)) return true; }
  return false;
}
export function makeMove(board, move, enPassantTarget){ const nb=cloneBoard(board); const piece=nb[move.from.r][move.from.c]; nb[move.from.r][move.from.c]=null; if(!piece) return nb; if(piece.type==='K'&&Math.abs(move.to.c-move.from.c)===2){ move.isCastle=true; const home=move.from.r; if(move.to.c===6){ nb[home][5]=nb[home][7]; nb[home][7]=null; if(nb[home][5]) nb[home][5].hasMoved=true; } else { nb[home][3]=nb[home][0]; nb[home][0]=null; if(nb[home][3]) nb[home][3].hasMoved=true; } }
  if(piece.type==='P' && enPassantTarget && move.to.r===enPassantTarget.r && move.to.c===enPassantTarget.c && !nb[move.to.r][move.to.c]){ move.isEnPassant=true; const dir=piece.color==='w'?-1:1; nb[move.to.r-dir][move.to.c]=null; }
  if(move.promotion) piece.type=move.promotion; piece.hasMoved=true; nb[move.to.r][move.to.c]=piece; return nb; }
export function legalMoves(board, from, color, enPassantTarget){ const piece=at(board,from); if(!piece||piece.color!==color) return []; const cand=pseudoLegalMoves(board,from,enPassantTarget); const legal=[]; for(const to of cand){ const next=makeMove(board,{from,to},{...enPassantTarget}); const kp=findKing(next,color); if(!kp) continue; if(!squareAttackedBy(next,kp,opposite(color),enPassantTarget)) legal.push(to); } return legal; }
export function isCheck(board,color,enPassantTarget){ const k=findKing(board,color); if(!k) return false; return squareAttackedBy(board,k,opposite(color),enPassantTarget); }
export function isCheckmate(board,color,enPassantTarget){ if(!isCheck(board,color,enPassantTarget)) return false; for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(!p||p.color!==color) continue; const from={r,c}; if(legalMoves(board,from,color,enPassantTarget).length>0) return false; } return true; }

function fileChar(c){ return 'abcdefgh'[c]; }
function squareAlg(pos){ return `${fileChar(pos.c)}${8-pos.r}`; }
export function moveToSAN(board, move, color, enPassantTarget){ const piece=at(board,move.from); const target=at(board,move.to); const capture=!!target||move.isEnPassant; if(piece.type==='K'&&Math.abs(move.to.c-move.from.c)===2){ const san=move.to.c===6?'O-O':'O-O-O'; const next=makeMove(board,{...move},enPassantTarget); const chk=isCheck(next,opposite(color),enPassantTarget); const mate=isCheckmate(next,opposite(color),enPassantTarget); return san+(mate?'#':chk?'+':''); } const letter=piece.type==='P'?'':piece.type; let dis=''; if(piece.type!=='P'){ const sources=[]; for(let r=0;r<8;r++) for(let c=0;c<8;c++){ if(r===move.from.r&&c===move.from.c) continue; const p=board[r][c]; if(!p||p.type!==piece.type||p.color!==color) continue; const ms=legalMoves(board,{r,c},color,enPassantTarget); if(ms.some(d=>d.r===move.to.r&&d.c===move.to.c)) sources.push({r,c}); } if(sources.length>0){ const sameFile=sources.some(s=>s.c===move.from.c); const sameRank=sources.some(s=>s.r===move.from.r); if(!sameFile) dis=fileChar(move.from.c); else if(!sameRank) dis=String(8-move.from.r); else dis=fileChar(move.from.c)+String(8-move.from.r); } }
  let core=''; if(piece.type==='P'){ core=capture?`${fileChar(move.from.c)}x${squareAlg(move.to)}`:squareAlg(move.to); } else { core=letter+dis+(capture?'x':'')+squareAlg(move.to); }
  if(move.promotion) core+=`=${move.promotion}`; const next=makeMove(board,{...move},enPassantTarget); const mate=isCheckmate(next,opposite(color),enPassantTarget); const chk=isCheck(next,opposite(color),enPassantTarget); return core+(mate?'#':chk?'+':''); }

export function positionKey(board, turn, enPassantTarget){
  const rows=[]; for(let r=0;r<8;r++){ let row=''; let empty=0; for(let c=0;c<8;c++){ const p=board[r][c]; if(!p){ empty++; } else { if(empty>0){ row+=String(empty); empty=0; } const letter=p.type; row+= p.color==='w'?letter:letter.toLowerCase(); } } if(empty>0) row+=String(empty); rows.push(row);} const boardStr=rows.join('/'); const ep=enPassantTarget?`${enPassantTarget.r}${enPassantTarget.c}`:'-'; return `${boardStr} ${turn} ${ep}`;
}
export function insufficientMaterial(board){
  const pieces=[]; const bishops=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(!p) continue; pieces.push(p); if(p.type==='B'){ const dark=(r+c)%2===1; bishops.push(dark?'b':'w'); } }
  if(pieces.every(p=>p.type==='K')) return true;
  const nonKings=pieces.filter(p=>p.type!=='K');
  if(nonKings.length===1 && (nonKings[0].type==='N' || nonKings[0].type==='B')) return true;
  if(nonKings.length===2 && nonKings.every(p=>p.type==='B')){ if(bishops.length===2 && bishops[0]===bishops[1]) return true; }
  return false;
}
