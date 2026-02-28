import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import InputField from '../components/InputField';
import Button from '../components/Button';

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim()) {
      // TODO: call backend to join room via Socket.io
      navigate('/room/chess'); // placeholder redirect
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

      <div className="max-w-md">
        <form onSubmit={handleJoin} className="space-y-5">
          <InputField
            label="Room Code"
            placeholder="e.g. ARENA-X7K2"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          <Button type="submit" variant="primary" size="lg" disabled={!roomCode.trim()}>
            <UserPlus className="w-5 h-5 mr-2" />
            Join Room
          </Button>
        </form>
      </div>
    </div>
  );
}
