export type Modifier = {
  id: string;
  name: string;
  short: string;
  long?: string;
  icon?: string; // future: per-modifier icon asset
  tags: string[]; // e.g., ['piece','movement','chaos']
  category: 'Board' | 'Piece' | 'Movement' | 'Economy' | 'Chaos';
  cost: number; // points toward selection budget
  group?: string; // mutually exclusive group id
};

export const MODIFIERS: Modifier[] = [
  { id: 'maidenless', name: 'Maidenless Behavior', short: 'Remove both queens for 3 turns.', long: 'At start, both queens are temporarily removed from the board. They return on turn 4 in their original squares if empty, or adjacent if occupied.', tags: ['piece','tempo'], category: 'Piece', cost: 2, group: 'queen_rule' },
  { id: 'rasputin', name: 'Rasputin', short: 'One piece is immortal for 5 turns, then vanishes.', long: 'Choose a piece at start. It cannot be captured for 5 of your turns, then is removed from play.', tags: ['piece','chaos'], category: 'Piece', cost: 3 },
  { id: 'en-worse', name: 'En Passant but Worse', short: 'Pawns capture backwards on Tuesdays.', long: 'Backwards captures allowed for pawns on specific rounds (house rule).', tags: ['movement','pawn','chaos'], category: 'Movement', cost: 1 },
  { id: 'knight-rider', name: 'Knight Rider', short: 'Knights can move twice if you hum.', long: 'On your move, a knight may jump a second time if the first landed safely.', tags: ['movement','knight','combo'], category: 'Movement', cost: 2 },
  { id: 'fog-of-war', name: 'Fog of War', short: 'Only attacked squares are visible.', tags: ['board','chaos'], category: 'Board', cost: 3 },
  { id: 'double-pawn', name: 'Double Pawns', short: 'You start with 10 pawns.', tags: ['economy','pawn'], category: 'Economy', cost: 2, group: 'start_material' },
  { id: 'bishop-swap', name: 'Bishop Swap', short: 'Bishops start swapped across colors.', tags: ['board','bishop'], category: 'Board', cost: 1 },
  { id: 'castle-free', name: 'Free Castling', short: 'Castling allowed through check once.', tags: ['movement','king'], category: 'Movement', cost: 2, group: 'castle_rule' },
  { id: 'royal-pawn', name: 'Royal Pawn', short: 'One pawn becomes royal (king-like).', tags: ['piece','pawn','chaos'], category: 'Piece', cost: 2 },
  { id: 'teleport', name: 'Blink', short: 'Once per game, teleport a minor piece.', tags: ['movement','chaos'], category: 'Movement', cost: 3 },
  { id: 'armory', name: 'Armory', short: 'Promotions cost 1 point but can be any piece.', tags: ['economy','promotion'], category: 'Economy', cost: 1 },
  { id: 'gravity', name: 'Gravity Well', short: 'Center files pull pieces inward.', tags: ['board','chaos'], category: 'Board', cost: 2 },
  // Placeholder bulk mods for menu scale testing
  ...Array.from({length: 40}).map((_,i)=>({
    id: `placeholder-${i+1}`,
    name: `Placeholder Mod ${i+1}`,
    short: `Demo modifier ${i+1} doing a neat thing`,
    tags: i%2===0? ['movement']: ['board'],
    category: (['Board','Piece','Movement','Economy','Chaos'] as const)[i%5],
    cost: (i%3)+1,
    group: i%10===0? `exclusive-${Math.floor(i/10)}`: undefined,
  } as Modifier)),
];

export const MOD_TAGS = Array.from(new Set(MODIFIERS.flatMap(m => m.tags))).sort();
export const MOD_CATEGORIES: Array<Modifier['category']> = ['Board','Piece','Movement','Economy','Chaos'];

export const MOD_RULES = {
  maxSelected: 5,
  pointBudget: 10,
  perCategory: {
    Board: 2,
    Piece: 2,
    Movement: 2,
    Economy: 2,
    Chaos: 2,
  } as Partial<Record<Modifier['category'], number>>,
};
