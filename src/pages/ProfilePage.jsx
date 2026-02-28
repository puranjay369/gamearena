import { User, Trophy, Gamepad2, Clock } from 'lucide-react';

export default function ProfilePage() {
  // Placeholder profile data — replace with backend data
  const profile = {
    username: 'Player1',
    email: 'player1@gamearena.com',
    gamesPlayed: 42,
    wins: 28,
    joinedDate: 'Jan 2026',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <User className="w-7 h-7 text-accent" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="bg-surface-alt border border-edge/50 rounded-2xl overflow-hidden max-w-2xl">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-accent/30 to-purple-500/30" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full bg-card border-4 border-surface-alt flex items-center justify-center">
              <User className="w-10 h-10 text-muted" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground">{profile.username}</h2>
          <p className="text-sm text-muted">{profile.email}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: Gamepad2, label: 'Games Played', value: profile.gamesPlayed },
              { icon: Trophy, label: 'Wins', value: profile.wins },
              { icon: Clock, label: 'Joined', value: profile.joinedDate },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card/50 border border-edge/30 rounded-xl p-4 text-center"
              >
                <stat.icon className="w-5 h-5 text-accent mx-auto mb-2" />
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
