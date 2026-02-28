import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Gamepad2,
  Plus,
  UserPlus,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Home', icon: Home, path: '/dashboard' },
  { label: 'Games', icon: Gamepad2, path: '/dashboard/games' },
  { label: 'Create Room', icon: Plus, path: '/dashboard/create-room' },
  { label: 'Join Room', icon: UserPlus, path: '/dashboard/join-room' },
  { label: 'Profile', icon: User, path: '/dashboard/profile' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface-alt border-r border-edge/50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-edge/50">
          <Link to="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <img src="/game-logo.png" alt="GameArena" className="w-11 h-11 rounded-lg shadow-lg shadow-accent/30" />
            <span className="text-xl font-bold text-foreground tracking-tight">
              Game<span className="text-accent">Arena</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted hover:bg-card hover:text-foreground'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-accent' : 'text-muted group-hover:text-foreground'
                  }`}
                />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-edge/50 pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-danger/10 hover:text-danger transition-all duration-200 group w-full cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
