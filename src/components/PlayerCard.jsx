import { User, Wifi, WifiOff } from 'lucide-react';

export default function PlayerCard({ name, avatar, isHost = false, isReady = false, isConnected = true, className = '' }) {
  return (
    <div
      className={`flex items-center gap-3 bg-card border border-edge/50 rounded-xl px-4 py-3 transition-all duration-200 ${
        isReady ? 'border-success/50 shadow-sm shadow-success/10' : ''
      } ${className}`}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center overflow-hidden border-2 border-edge">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-muted" />
          )}
        </div>
        {/* Online indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
            isConnected ? 'bg-success' : 'bg-muted'
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{name || 'Waiting...'}</span>
          {isHost && (
            <span className="text-[10px] font-bold bg-warning/20 text-warning px-1.5 py-0.5 rounded uppercase tracking-wide">
              Host
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-success" />
          ) : (
            <WifiOff className="w-3 h-3 text-muted" />
          )}
          <span className={`text-xs ${isReady ? 'text-success' : 'text-muted'}`}>
            {name ? (isReady ? 'Ready' : 'Not Ready') : 'Empty Slot'}
          </span>
        </div>
      </div>
    </div>
  );
}
