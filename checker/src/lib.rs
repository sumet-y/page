use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// ══════════════════════════════════════
// THAI DRAUGHTS ENGINE — กฎหมากฮอสไทย
//
// กฎ:
//  - เบี้ยดำเดินไปช่องว่างข้างหน้าทแยง 1 ช่อง (dr=-1)
//  - เบี้ยขาวเดินไปช่องว่างข้างหน้าทแยง 1 ช่อง (dr=+1)
//  - กินได้ข้างหน้าเท่านั้น ลงจอดหลังตัวที่กินช่องเดียว
//  - กินต่อเนื่องได้ (multi-jump) ทิศหน้าเท่านั้น
//  - เมื่อถึงแถวสุดท้าย → เป็น King
//  - King เดินทแยงได้ไกลทุกทิศ
//  - King กินได้ทุกทิศ ลงจอดหลังตัวที่กินช่องเดียว
//  - King กินต่อเนื่องได้ทุกทิศ
//  - ถ้ามีการกินต้องกิน (mandatory capture)
//
// Square numbering (blackBottom=true):
//  row 0: sq 1-4   (top, white promotion row for black)
//  row 7: sq 29-32 (bottom, black promotion row for white)
// ══════════════════════════════════════

const BOARD_SIZE: usize = 32;

// RC map: square → (row, col)  0-indexed
static RC: [(i8, i8); 33] = [
    (0, 0), // placeholder index 0
    (0, 1), (0, 3), (0, 5), (0, 7), // 1-4
    (1, 0), (1, 2), (1, 4), (1, 6), // 5-8
    (2, 1), (2, 3), (2, 5), (2, 7), // 9-12
    (3, 0), (3, 2), (3, 4), (3, 6), // 13-16
    (4, 1), (4, 3), (4, 5), (4, 7), // 17-20
    (5, 0), (5, 2), (5, 4), (5, 6), // 21-24
    (6, 1), (6, 3), (6, 5), (6, 7), // 25-28
    (7, 0), (7, 2), (7, 4), (7, 6), // 29-32
];

fn sq_at(r: i8, c: i8) -> Option<u8> {
    if r < 0 || r > 7 || c < 0 || c > 7 { return None; }
    for sq in 1u8..=32 {
        let (sr, sc) = RC[sq as usize];
        if sr == r && sc == c { return Some(sq); }
    }
    None
}

// ── Board State ──
// Piece: color(1bit) + king(1bit) packed into u8
// 0 = empty, 1 = black normal, 2 = black king, 3 = white normal, 4 = white king
#[derive(Clone, Copy, PartialEq, Eq)]
struct Piece(u8);

impl Piece {
    const EMPTY: Piece = Piece(0);
    const BLACK: Piece = Piece(1);
    const BLACK_KING: Piece = Piece(2);
    const WHITE: Piece = Piece(3);
    const WHITE_KING: Piece = Piece(4);

    fn is_empty(self) -> bool { self.0 == 0 }
    fn is_black(self) -> bool { self.0 == 1 || self.0 == 2 }
    fn is_white(self) -> bool { self.0 == 3 || self.0 == 4 }
    fn is_king(self) -> bool { self.0 == 2 || self.0 == 4 }
    fn is_enemy(self, is_black_turn: bool) -> bool {
        if is_black_turn { self.is_white() } else { self.is_black() }
    }
    fn is_friendly(self, is_black_turn: bool) -> bool {
        if is_black_turn { self.is_black() } else { self.is_white() }
    }
}

#[derive(Clone)]
struct Board {
    cells: [Piece; 33], // index 1-32
}

impl Board {
    fn new() -> Self {
        Board { cells: [Piece::EMPTY; 33] }
    }
    fn get(&self, sq: u8) -> Piece { self.cells[sq as usize] }
    fn set(&mut self, sq: u8, p: Piece) { self.cells[sq as usize] = p; }

    fn count_black(&self) -> i32 {
        (1u8..=32).filter(|&s| self.get(s).is_black()).count() as i32
    }
    fn count_white(&self) -> i32 {
        (1u8..=32).filter(|&s| self.get(s).is_white()).count() as i32
    }
}

// ── Move representation ──
#[derive(Clone)]
struct Move {
    from: u8,
    path: Vec<u8>,    // all squares visited (including final landing)
    captures: Vec<u8>, // captured squares
}

impl Move {
    fn to_notation(&self) -> String {
        if self.captures.is_empty() {
            format!("{}-{}", self.from, self.path[0])
        } else {
            let mut s = self.from.to_string();
            for sq in &self.path {
                s.push('x');
                s.push_str(&sq.to_string());
            }
            s
        }
    }
    fn final_sq(&self) -> u8 {
        *self.path.last().unwrap()
    }
}

// ── Generate moves ──
fn fwd_dirs(is_black: bool) -> [(i8, i8); 2] {
    if is_black { [(-1, -1), (-1, 1)] }
    else        { [( 1, -1), ( 1, 1)] }
}

fn get_captures(board: &Board, sq: u8, is_black_turn: bool, excluded: &[u8]) -> Vec<Move> {
    let piece = board.get(sq);
    let (r, c) = RC[sq as usize];
    let mut result = Vec::new();

    let dirs: &[(i8, i8)] = if piece.is_king() {
        &[(-1,-1),(-1,1),(1,-1),(1,1)]
    } else {
        if is_black_turn { &[(-1i8,-1i8),(-1,1)] } else { &[(1i8,-1i8),(1,1)] }
    };

    for &(dr, dc) in dirs {
        if piece.is_king() {
            // King: slide to find enemy, land on first square after it
            let mut nr = r + dr;
            let mut nc = c + dc;
            let mut found_enemy: Option<u8> = None;
            loop {
                let ns = match sq_at(nr, nc) { Some(s) => s, None => break };
                let np = board.get(ns);
                if np.is_empty() {
                    if let Some(enemy_sq) = found_enemy {
                        if !excluded.contains(&enemy_sq) {
                            // valid landing after capturing enemy_sq
                            let mut m = Move {
                                from: sq,
                                path: vec![ns],
                                captures: vec![enemy_sq],
                            };
                            result.push(m);
                        }
                        break; // only ONE landing square (Thai rules)
                    }
                } else if np.is_enemy(is_black_turn) && !excluded.contains(&ns) {
                    if found_enemy.is_some() { break; } // another piece blocks
                    found_enemy = Some(ns);
                } else {
                    break; // friendly piece blocks
                }
                nr += dr;
                nc += dc;
            }
        } else {
            // Normal piece: 1 step enemy, 1 step landing
            let er = r + dr;
            let ec = c + dc;
            let es = match sq_at(er, ec) { Some(s) => s, None => continue };
            if board.get(es).is_enemy(is_black_turn) && !excluded.contains(&es) {
                let lr = er + dr;
                let lc = ec + dc;
                let ls = match sq_at(lr, lc) { Some(s) => s, None => continue };
                if board.get(ls).is_empty() || ls == sq {
                    // ls must be empty (or the starting square which we left)
                    if board.get(ls).is_empty() {
                        result.push(Move {
                            from: sq,
                            path: vec![ls],
                            captures: vec![es],
                        });
                    }
                }
            }
        }
    }
    result
}

fn gen_capture_chains(board: &Board, sq: u8, is_black_turn: bool, excluded: &[u8], prefix_path: &[u8], prefix_caps: &[u8]) -> Vec<Move> {
    let caps = get_captures(board, sq, is_black_turn, excluded);
    if caps.is_empty() {
        if prefix_caps.is_empty() { return vec![]; }
        return vec![Move {
            from: prefix_path[0], // will be overwritten by caller
            path: prefix_path[1..].to_vec(),
            captures: prefix_caps.to_vec(),
        }];
    }
    let mut result = Vec::new();
    for cap in caps {
        let land = cap.final_sq();
        let cap_sq = cap.captures[0];
        let mut new_excluded = excluded.to_vec();
        new_excluded.push(cap_sq);
        let mut new_path = prefix_path.to_vec();
        new_path.push(land);
        let mut new_caps = prefix_caps.to_vec();
        new_caps.push(cap_sq);

        // Apply capture temporarily
        let mut tmp = board.clone();
        tmp.set(sq, Piece::EMPTY);
        tmp.set(cap_sq, Piece::EMPTY);
        let orig_piece = board.get(sq);
        // Check promotion at landing
        let promoted = if is_black_turn && land <= 4 || !is_black_turn && land >= 29 {
            true
        } else { false };
        let new_piece = if promoted {
            if is_black_turn { Piece::BLACK_KING } else { Piece::WHITE_KING }
        } else { orig_piece };
        tmp.set(land, new_piece);

        if promoted {
            // Stop chain on promotion
            result.push(Move {
                from: new_path[0],
                path: new_path[1..].to_vec(),
                captures: new_caps,
            });
        } else {
            let chains = gen_capture_chains(&tmp, land, is_black_turn, &new_excluded, &new_path, &new_caps);
            if chains.is_empty() {
                result.push(Move {
                    from: new_path[0],
                    path: new_path[1..].to_vec(),
                    captures: new_caps,
                });
            } else {
                result.extend(chains);
            }
        }
    }
    result
}

fn gen_moves(board: &Board, is_black_turn: bool) -> Vec<Move> {
    let mut captures = Vec::new();
    let mut quiets = Vec::new();

    for sq in 1u8..=32 {
        let p = board.get(sq);
        if !p.is_friendly(is_black_turn) { continue; }

        // Generate capture chains from this piece
        let chains = gen_capture_chains(board, sq, is_black_turn, &[], &[sq], &[]);
        captures.extend(chains);

        // Simple moves (only if no captures exist yet or none found)
        let (r, c) = RC[sq as usize];
        let dirs = if p.is_king() {
            vec![(-1i8,-1i8),(-1,1),(1,-1),(1,1)]
        } else {
            fwd_dirs(is_black_turn).to_vec()
        };

        if p.is_king() {
            for (dr, dc) in dirs {
                let mut nr = r + dr;
                let mut nc = c + dc;
                loop {
                    let ns = match sq_at(nr, nc) { Some(s) => s, None => break };
                    if !board.get(ns).is_empty() { break; }
                    quiets.push(Move { from: sq, path: vec![ns], captures: vec![] });
                    nr += dr; nc += dc;
                }
            }
        } else {
            for (dr, dc) in dirs {
                let nr = r + dr;
                let nc = c + dc;
                let ns = match sq_at(nr, nc) { Some(s) => s, None => continue };
                if board.get(ns).is_empty() {
                    quiets.push(Move { from: sq, path: vec![ns], captures: vec![] });
                }
            }
        }
    }

    if !captures.is_empty() { captures } else { quiets }
}

// ── Apply move ──
fn apply_move(board: &Board, mv: &Move, is_black_turn: bool) -> (Board, bool) {
    let mut b = board.clone();
    let piece = b.get(mv.from);
    b.set(mv.from, Piece::EMPTY);
    for &cap in &mv.captures {
        b.set(cap, Piece::EMPTY);
    }
    let land = mv.final_sq();
    let promoted = if is_black_turn && land <= 4 || !is_black_turn && land >= 29 {
        !piece.is_king()
    } else { false };
    let new_piece = if promoted {
        if is_black_turn { Piece::BLACK_KING } else { Piece::WHITE_KING }
    } else { piece };
    b.set(land, new_piece);
    (b, promoted)
}

// ── Evaluation ──
fn evaluate(board: &Board) -> i32 {
    let mut score = 0i32;

    for sq in 1u8..=32 {
        let p = board.get(sq);
        if p.is_empty() { continue; }
        let (r, _c) = RC[sq as usize];
        let val: i32 = if p.is_king() {
            500
        } else {
            let adv = if p.is_black() { 7 - r } else { r } as i32;
            let promo = if adv >= 6 { 80 } else if adv >= 5 { 40 } else if adv >= 4 { 15 } else { 0 };
            100 + adv * 10 + promo
        };
        if p.is_black() { score += val; } else { score -= val; }
    }

    // Mobility
    let bm = gen_moves(board, true).len() as i32;
    let wm = gen_moves(board, false).len() as i32;
    score += (bm - wm) * 5;

    // Capture threats
    let bc = gen_moves(board, true).iter().filter(|m| !m.captures.is_empty()).count() as i32;
    let wc = gen_moves(board, false).iter().filter(|m| !m.captures.is_empty()).count() as i32;
    score += (bc - wc) * 12;

    // Back row guard
    for sq in 25u8..=32 { if board.get(sq).is_black() && !board.get(sq).is_king() { score += 18; } }
    for sq in 1u8..=8  { if board.get(sq).is_white() && !board.get(sq).is_king() { score -= 18; } }

    score
}

// ── Transposition Table ──
const TT_SIZE: usize = 1 << 18; // 256K entries

#[derive(Clone, Copy)]
struct TTEntry {
    hash: u64,
    depth: i8,
    val: i32,
    flag: u8, // 0=exact 1=lower 2=upper
    best_from: u8,
    best_to: u8,
}

impl Default for TTEntry {
    fn default() -> Self {
        TTEntry { hash: 0, depth: -1, val: 0, flag: 0, best_from: 0, best_to: 0 }
    }
}

struct SearchState {
    tt: Vec<TTEntry>,
    nodes: u64,
    start_ms: f64,
    time_limit_ms: f64,
    aborted: bool,
}

impl SearchState {
    fn new(time_ms: f64) -> Self {
        SearchState {
            tt: vec![TTEntry::default(); TT_SIZE],
            nodes: 0,
            start_ms: now_ms(),
            time_limit_ms: time_ms,
            aborted: false,
        }
    }
    fn check_time(&mut self) {
        if (self.nodes & 0xFFF) == 0 {
            if now_ms() - self.start_ms > self.time_limit_ms {
                self.aborted = true;
            }
        }
    }
}

fn now_ms() -> f64 {
    // Use a simple counter-based approximation since we can't call JS Date in pure Rust easily
    // The JS side will handle timing via the Web Worker
    0.0
}

// ── Minimax with Alpha-Beta + TT ──
fn order_moves(moves: &mut Vec<Move>, board: &Board, tt_from: u8, tt_to: u8) {
    moves.sort_by_key(|m| {
        let mut score: i32 = 0;
        if m.from == tt_from && m.final_sq() == tt_to { score += 10000; }
        if !m.captures.is_empty() {
            score += 5000;
            // MVV: capture value
            for &cap in &m.captures {
                let p = board.get(cap);
                score += if p.is_king() { 500 } else { 100 };
            }
        }
        -score
    });
}

fn quiesce(board: &Board, is_black_turn: bool, mut alpha: i32, mut beta: i32, is_max: bool, qdepth: i32) -> i32 {
    let stand_pat = evaluate(board);
    if qdepth <= 0 { return stand_pat; }

    if is_max {
        if stand_pat >= beta { return beta; }
        if stand_pat > alpha { alpha = stand_pat; }
        let mut moves = gen_moves(board, true);
        let caps: Vec<Move> = moves.into_iter().filter(|m| !m.captures.is_empty()).collect();
        if caps.is_empty() { return stand_pat; }
        for mv in &caps {
            let (nb, _) = apply_move(board, mv, true);
            let val = quiesce(&nb, false, alpha, beta, false, qdepth - 1);
            if val > alpha { alpha = val; }
            if alpha >= beta { return beta; }
        }
        alpha
    } else {
        if stand_pat <= alpha { return alpha; }
        if stand_pat < beta { beta = stand_pat; }
        let moves = gen_moves(board, false);
        let caps: Vec<Move> = moves.into_iter().filter(|m| !m.captures.is_empty()).collect();
        if caps.is_empty() { return stand_pat; }
        for mv in &caps {
            let (nb, _) = apply_move(board, mv, false);
            let val = quiesce(&nb, true, alpha, beta, true, qdepth - 1);
            if val < beta { beta = val; }
            if alpha >= beta { return alpha; }
        }
        beta
    }
}

fn negamax(board: &Board, is_black_turn: bool, depth: i32, mut alpha: i32, mut beta: i32, ss: &mut SearchState) -> i32 {
    ss.nodes += 1;
    ss.check_time();
    if ss.aborted { return 0; }

    // TT lookup
    let hash = simple_hash(board, is_black_turn);
    let tt_idx = (hash as usize) & (TT_SIZE - 1);
    let tte = ss.tt[tt_idx];
    let mut tt_from = 0u8;
    let mut tt_to = 0u8;
    if tte.hash == hash && tte.depth >= depth as i8 {
        let v = tte.val;
        match tte.flag {
            0 => return v,
            1 => { if v <= alpha { return alpha; } }
            2 => { if v >= beta  { return beta;  } }
            _ => {}
        }
    }
    if tte.hash == hash { tt_from = tte.best_from; tt_to = tte.best_to; }

    let mut moves = gen_moves(board, is_black_turn);
    if moves.is_empty() { return if is_black_turn { -29000 + depth } else { 29000 - depth }; }

    if depth <= 0 {
        let qdepth = if board.count_black() + board.count_white() <= 8 { 10 } else { 6 };
        return quiesce(board, is_black_turn, alpha, beta, is_black_turn, qdepth);
    }

    order_moves(&mut moves, board, tt_from, tt_to);

    let orig_alpha = alpha;
    let mut best_val = i32::MIN;
    let mut best_from = 0u8;
    let mut best_to = 0u8;

    for mv in &moves {
        let (nb, promoted) = apply_move(board, mv, is_black_turn);
        let next_turn = if promoted { !is_black_turn } else {
            // Check multi-jump continuation handled by gen_moves already
            !is_black_turn
        };
        let val = -negamax(&nb, next_turn, depth - 1, -beta, -alpha, ss);
        if ss.aborted { return 0; }
        if val > best_val {
            best_val = val;
            best_from = mv.from;
            best_to = mv.final_sq();
        }
        if val > alpha { alpha = val; }
        if alpha >= beta { break; }
    }

    // Store TT
    let flag = if best_val <= orig_alpha { 2 } else if best_val >= beta { 1 } else { 0 };
    ss.tt[tt_idx] = TTEntry { hash, depth: depth as i8, val: best_val, flag, best_from, best_to };

    best_val
}

fn simple_hash(board: &Board, is_black_turn: bool) -> u64 {
    let mut h: u64 = if is_black_turn { 0x123456789ABCDEF0 } else { 0xFEDCBA9876543210 };
    for sq in 1u8..=32 {
        let p = board.get(sq).0 as u64;
        if p > 0 {
            h ^= p.wrapping_mul(0x9E3779B97F4A7C15u64).wrapping_mul(sq as u64 + 1);
            h = h.rotate_left(7);
        }
    }
    h
}

// ── JS Interface ──
#[derive(Serialize, Deserialize)]
pub struct JsPiece {
    pub square: u8,
    pub king: bool,
}

#[derive(Serialize, Deserialize)]
pub struct AnalysisResult {
    pub notation: String,
    pub from_sq: u8,
    pub to_sq: u8,
    pub captures: Vec<u8>,
    pub score: i32,
    pub depth_reached: i32,
}

#[wasm_bindgen]
pub fn analyze(
    white_pieces: JsValue,
    black_pieces: JsValue,
    is_black_turn: bool,
    max_depth: i32,
    time_limit_ms: f64,
) -> JsValue {
    let whites: Vec<JsPiece> = serde_wasm_bindgen::from_value(white_pieces).unwrap_or_default();
    let blacks: Vec<JsPiece> = serde_wasm_bindgen::from_value(black_pieces).unwrap_or_default();

    let mut board = Board::new();
    for p in &whites {
        board.set(p.square, if p.king { Piece::WHITE_KING } else { Piece::WHITE });
    }
    for p in &blacks {
        board.set(p.square, if p.king { Piece::BLACK_KING } else { Piece::BLACK });
    }

    let moves = gen_moves(&board, is_black_turn);
    if moves.is_empty() {
        return serde_wasm_bindgen::to_value(&Vec::<AnalysisResult>::new()).unwrap();
    }

    let mut ss = SearchState::new(time_limit_ms);
    let mut scored: Vec<(Move, i32)> = Vec::new();

    // Iterative deepening
    let mut best_depth = 0;
    for depth in 1..=max_depth {
        if ss.aborted { break; }
        let mut depth_scored: Vec<(Move, i32)> = Vec::new();
        for mv in &moves {
            if ss.aborted { break; }
            let (nb, _) = apply_move(&board, mv, is_black_turn);
            let val = negamax(&nb, !is_black_turn, depth - 1,
                i32::MIN + 1, i32::MAX, &mut ss);
            if !ss.aborted {
                let signed_val = if is_black_turn { val } else { -val };
                depth_scored.push((mv.clone(), signed_val));
            }
        }
        if !ss.aborted && !depth_scored.is_empty() {
            depth_scored.sort_by(|a, b| b.1.cmp(&a.1));
            scored = depth_scored;
            best_depth = depth;
        }
    }

    // Return top 5
    let results: Vec<AnalysisResult> = scored.iter().take(5).map(|(mv, score)| {
        AnalysisResult {
            notation: mv.to_notation(),
            from_sq: mv.from,
            to_sq: mv.final_sq(),
            captures: mv.captures.clone(),
            score,
            depth_reached: best_depth,
        }
    }).collect();

    serde_wasm_bindgen::to_value(&results).unwrap()
}
