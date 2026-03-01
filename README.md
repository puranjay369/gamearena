# GameArena — Online Multiplayer Gaming Platform

A modern, real-time 2-player gaming platform built with React. Play classic board games against a bot, locally with a friend, or online (coming soon).

![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.3-646cff?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss)

---

## Games

| Game | Description | Bot AI |
|------|-------------|--------|
| **Chess** | Full rules via chess.js + react-chessboard v5 | Minimax (depth 2) with piece-value evaluation |
| **Battleship** | Ship placement phase + hunt-and-target gameplay | Hunt-and-target AI with adjacency chasing |
| **Connect Four** | Classic 7×6 drop-disc game | Minimax (depth 5) with alpha-beta pruning |

## Game Modes

- **vs Bot** — Play against AI instantly, no waiting
- **Local 2 Player** — Pass-and-play on the same device
- **Online 2 Player** — *(Coming soon)* Real-time multiplayer via Socket.io

## Features

- Dark-themed UI with custom design tokens
- Local authentication (localStorage-based)
- Fully responsive — works on mobile, tablet, and desktop
- Dashboard with game lobby, room creation, and profile
- Custom game logos and branding
- Fast builds with Vite 7

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS v4 |
| **Routing** | react-router-dom v7 |
| **Chess Engine** | chess.js + react-chessboard v5 |
| **Icons** | Lucide React |
| **Auth** | Local localStorage (Firebase-ready) |

---

## Project Structure

```
src/
├── components/
│   ├── games/
│   │   ├── ChessGame.jsx        # Chess with full rules + bot
│   │   ├── BattleshipGame.jsx   # Battleship with ship placement + bot
│   │   └── ConnectFourGame.jsx  # Connect Four with minimax bot
│   ├── Navbar.jsx               # Public page navbar
│   ├── Sidebar.jsx              # Dashboard sidebar navigation
│   ├── GameCard.jsx             # Game preview card component
│   ├── PlayerCard.jsx           # Player slot card for lobbies
│   ├── Button.jsx               # Reusable button component
│   └── InputField.jsx           # Reusable input component
├── contexts/
│   └── AuthContext.jsx          # Authentication context (localStorage)
├── layouts/
│   ├── PublicLayout.jsx         # Layout for public pages
│   ├── DashboardLayout.jsx      # Layout with sidebar for dashboard
│   └── GameLayout.jsx           # Minimal layout for game screens
├── pages/
│   ├── LandingPage.jsx          # Public landing/marketing page
│   ├── LoginPage.jsx            # Login form
│   ├── SignupPage.jsx           # Registration form
│   ├── DashboardPage.jsx        # Game lobby (links to games directly)
│   ├── CreateRoomPage.jsx       # Create multiplayer room
│   ├── JoinRoomPage.jsx         # Join room by code
│   ├── RoomLobbyPage.jsx        # 2-player room lobby (pre-game)
│   ├── ProfilePage.jsx          # User profile
│   └── GameScreen.jsx           # Game renderer (routes to game components)
├── router/
│   └── index.jsx                # Route definitions
├── index.css                    # Tailwind imports + theme tokens
└── main.jsx                     # App entry point
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/puranjay369/gamearena.git
cd gamearena

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be running at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Roadmap

- [ ] **Socket.io backend** — Real-time online 2-player multiplayer
- [ ] **Matchmaking** — Auto-pair with random opponents
- [ ] **ELO rating system** — Skill-based rankings
- [ ] **Game history** — View past matches and replays
- [ ] **Player avatars** — Choose from themed avatar sets
- [ ] **Sound effects** — Audio feedback for moves and wins
- [ ] **More games** — Checkers, Tic Tac Toe, Reversi, Mancala
- [ ] **Dark/Light theme toggle**

---

## License

This project is for personal/educational use.
