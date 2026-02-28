import { Outlet } from 'react-router-dom';

export default function GameLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Outlet />
    </div>
  );
}
