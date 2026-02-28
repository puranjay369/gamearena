import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Button from './Button';

export default function Navbar({ onMenuClick, showMenu = false }) {
  return (
    <header className="sticky top-0 z-30 bg-surface-alt/80 backdrop-blur-xl border-b border-edge/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: menu + logo */}
        <div className="flex items-center gap-3">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-muted hover:text-foreground transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/game-logo.png" alt="GameArena" className="w-10 h-10 rounded-lg shadow-lg shadow-accent/30" />
            <span className="text-lg font-bold text-foreground tracking-tight hidden sm:inline">
              Game<span className="text-accent">Arena</span>
            </span>
          </Link>
        </div>

        {/* Right: auth buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" to="/login">
            Log in
          </Button>
          <Button variant="primary" size="sm" to="/signup">
            Sign up
          </Button>
        </div>
      </div>
    </header>
  );
}
