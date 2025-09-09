# 🕊️ Pigeon Chess

**Pigeon Chess** is a prototype strategy game where **classic chess meets chaos**.  
Instead of playing the same old predictable matches, players draft *modifiers* that twist the rules, change the board, and unleash pure nonsense.  
Think *"Maidenless Behavior"* (no queens for 3 turns) or *"Rasputin"* (immortal piece that explodes later).  

Welcome to chess, but unhinged.  

---

## ✨ Features

- ♟️ **Core Chess Gameplay** – the familiar 8x8 battlefield.
- 🎴 **Modifiers System** – pick silly, powerful, or meme-driven twists each game.
- 🎲 **Random Events** – chaos modifiers can appear mid-match to shake things up.
- 🎮 **Replayability** – every game feels different depending on modifier combos.
- 🖥️ **Web-based Prototype** – built with React + TypeScript + Vite + Tailwind.

---

## 🚧 Status

This is an early prototype!  
The current focus is on:
- [x] Base project setup (React + TS + Vite + Tailwind)
- [x] Menu layout & styling
- [ ] Chessboard implementation
- [ ] Modifier system integration
- [ ] Game state management
- [ ] Multiplayer / scenarios

---

## 📂 Project Structure

src/
components/ # UI components (menus, board, etc.)
state/ # Game logic & modifiers
assets/ # Logos, icons, art
styles/ # Global CSS & Tailwind configs
App.tsx # Main app entry


---

## 🛠️ Tech Stack

- **React** – UI rendering
- **TypeScript** – type safety
- **Vite** – blazing-fast bundler
- **Tailwind CSS** – styling

---

## 🎲 Example Modifiers

- **Maidenless Behavior**: Removes both queens for 3 turns.  
- **Rasputin**: Selected piece can’t be captured for 5 turns, but vanishes when the timer ends.  
- **En Passant but Worse**: Pawns can now capture backwards—but only on Tuesdays.  
- **Knight Rider**: Knights can move twice in one turn if you hum the theme song.  

---

## 🚀 Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/tundra-ghost/pigeon-chess.git
cd pigeon-chess
npm install
npm run dev
```

Visit http://localhost:5173/ to play.

🖼️ Screenshots

(WIP – coming soon)

📜 License

All Rights Reserved

🤝 Contributing

Want to add a modifier idea?
Open an issue or PR with your most unhinged concept.
Just remember: the dumber, the better.

💡 Inspiration

I really just wanted to code something and this felt like a good start as it can be as complicated or simple as I decide to make it. I was always a fan of a story from Anarchy Chess where top comments got to play next move no matter how nonsensical they were. That inspired me to make a what you might consider a rogue-like chess game. The name comes from an expression that goes "arguing with an idiot is like trying to play chess with a pigeon — it knocks the pieces over, craps on the board, and flies back to its flock to claim victory." I thought this encapsulated the spirit of the game rather nicely. 
