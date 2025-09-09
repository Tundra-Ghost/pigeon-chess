export type Modifier = {
  id: string;
  name: string;
  description: string;
  // Future: shape for applying effects to rules/engine
};

export const MODIFIERS: Modifier[] = [
  { id: 'maidenless', name: 'Maidenless Behavior', description: 'Removes both queens for 3 turns. (Scaffold only)' },
  { id: 'rasputin', name: 'Rasputin', description: 'One piece is immortal for 5 turns, then vanishes. (Scaffold only)' },
  { id: 'en-worse', name: 'En Passant but Worse', description: 'Pawns capture backwards on Tuesdays. (Scaffold only)' },
  { id: 'knight-rider', name: 'Knight Rider', description: 'Knights can move twice if you hum. (Scaffold only)' },
];

