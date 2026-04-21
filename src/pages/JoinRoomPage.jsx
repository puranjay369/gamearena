import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useRoom } from '../contexts/RoomContext';
import { useAuth } from '../contexts/AuthContext';

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { joinRoom, error, clearRoomError } = useRoom();
  const { user } = useAuth();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setSubmitting(true);
    clearRoomError();

    try {
      const room = await joinRoom(roomCode);
      navigate(`/room/${room.roomCode}`);
    } catch {
      // RoomContext already exposes a user-facing error message.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <UserPlus className="w-7 h-7 text-accent" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Join Room</h1>
      </div>
      <p className="text-muted mb-8">
        Enter a room code shared by the host to join the game.
      </p>

      {!user && (
        <div className="mb-6 bg-warning/10 border border-warning/30 text-warning text-sm rounded-lg px-4 py-3 max-w-md">
          Please sign in first. You can use Google or Play as Guest.
        </div>
      )}

      <div className="max-w-md">
        <form onSubmit={handleJoin} className="space-y-5">
          <InputField
            label="Room Code"
            placeholder="e.g. ARENA-X7K2"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" variant="primary" size="lg" disabled={!roomCode.trim() || submitting || !user}>
            <UserPlus className="w-5 h-5 mr-2" />
            {submitting ? 'Joining...' : user ? 'Join Room' : 'Sign in to Join Room'}
          </Button>
        </form>
      </div>
    </div>
  );
}
