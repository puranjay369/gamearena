import { Link } from 'react-router-dom';
import { Play, Users, Zap, Shield, ChevronRight, Gamepad2 } from 'lucide-react';
import Button from '../components/Button';
import GameCard from '../components/GameCard';

const games = [
  {
    name: 'Chess',
    description: 'The classic strategy game. Outsmart your opponent in this timeless battle of wits.',
    players: '2',
    image: '/pngtree-chess-logo-png-image_7966289.png',
    to: '/dashboard',
  },
  {
    name: 'Battleship',
    description: 'Hunt and sink your opponent\'s fleet in this classic naval strategy game.',
    players: '2',
    image: '/battleship.png',
    to: '/dashboard',
  },
  {
    name: 'Connect Four',
    description: 'Drop your discs and connect four in a row before your opponent does.',
    players: '2',
    image: '/connect-4-logo.png',
    to: '/dashboard',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Real-time Multiplayer',
    desc: 'Play against friends or strangers with zero-lag real-time gameplay powered by WebSockets.',
  },
  {
    icon: Users,
    title: 'Private Rooms',
    desc: 'Create private rooms and invite friends with a simple room code. Play on your terms.',
  },
  {
    icon: Shield,
    title: 'Fair Play',
    desc: 'Server-authoritative game logic ensures a fair and cheat-free experience for everyone.',
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
            <Gamepad2 className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Multiplayer Gaming Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground leading-tight mb-6">
            Play. Compete.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">
              Dominate.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            Join thousands of players on GameArena — the ultimate destination for classic board games
            reimagined for the modern web. Challenge friends or find opponents instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" size="xl" to="/signup">
              <Play className="w-5 h-5 mr-2" />
              Play Now — It's Free
            </Button>
            <Button variant="secondary" size="xl" to="/login">
              Sign In
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12">
            {[
              ['10K+', 'Players'],
              ['50K+', 'Games Played'],
              ['3', 'Game Modes'],
            ].map(([stat, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-foreground">{stat}</div>
                <div className="text-xs text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Choose Your Game
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Classic board games, reimagined for online multiplayer. Pick a game and start playing in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <GameCard key={game.name} {...game} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-surface-alt/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Why GameArena?
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Built for gamers, by gamers. Everything you need for the best multiplayer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card/50 border border-edge/30 rounded-xl p-6 hover:border-accent/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Play?
          </h2>
          <p className="text-muted text-lg mb-8">
            Create your free account and start competing in seconds.
          </p>
          <Button variant="primary" size="xl" to="/signup">
            Get Started
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-edge/30 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted">
            © 2026 GameArena. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
