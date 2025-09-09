import './App.css';
import ChessBoard from './components/ChessBoard';
import SetupScreen from './components/SetupScreen';
import { useState } from 'react';

function App() {
  const [started, setStarted] = useState(false);
  const [players, setPlayers] = useState<{ w: string; b: string }>({ w: 'White', b: 'Black' });
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);

  if (!started) {
    return (
      <SetupScreen
        onStart={({ whiteName, blackName, selectedModifiers }) => {
          setPlayers({ w: whiteName || 'White', b: blackName || 'Black' });
          setSelectedModifiers(selectedModifiers);
          setStarted(true);
        }}
      />
    );
  }

  return (
    <div>
      <h1>Pigeon Chess</h1>
      <p className="read-the-docs">Chess with basic rules + castling and en passant; pawns auto-promote to queens. Modifiers are scaffolded.</p>
      <ChessBoard players={players} selectedModifiers={selectedModifiers} onExit={() => setStarted(false)} />
    </div>
  );
}

export default App;
