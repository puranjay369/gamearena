import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-20 bg-surface-alt/80 backdrop-blur-xl border-b border-edge/50 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-muted hover:text-foreground transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-foreground">
              Game<span className="text-accent">Arena</span>
            </span>
            <div className="w-9" /> {/* spacer */}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
