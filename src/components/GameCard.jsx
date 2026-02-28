import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function GameCard({ name, description, image, to, players, className = '' }) {
  return (
    <Link
      to={to || '#'}
      className={`group block bg-card rounded-xl overflow-hidden border border-edge/50 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-1 ${className}`}
    >
      {/* Game Image */}
      <div className="relative h-44 overflow-hidden bg-surface-alt">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
            <span className="text-5xl">🎮</span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <span className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg">
            <Play className="w-4 h-4" />
            Play Now
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors duration-200">
          {name}
        </h3>
        {description && (
          <p className="text-sm text-muted mt-1 line-clamp-2">{description}</p>
        )}
        {players && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs bg-surface-alt text-muted px-2 py-1 rounded-md">
              👥 {players} Players
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
