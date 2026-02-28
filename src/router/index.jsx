import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout, DashboardLayout, GameLayout } from '../layouts';
import ProtectedRoute from '../components/ProtectedRoute';
import {
  LandingPage,
  LoginPage,
  SignupPage,
  DashboardPage,
  CreateRoomPage,
  JoinRoomPage,
  ProfilePage,
  RoomLobbyPage,
  GameScreen,
} from '../pages';

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
    ],
  },
  // Auth pages (no shared layout chrome)
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  // Dashboard with sidebar — protected
  {
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/dashboard/games', element: <DashboardPage /> },
      { path: '/dashboard/create-room', element: <CreateRoomPage /> },
      { path: '/dashboard/join-room', element: <JoinRoomPage /> },
      { path: '/dashboard/profile', element: <ProfilePage /> },
    ],
  },
  // Room lobby — protected
  { path: '/room/:gameId', element: <ProtectedRoute><RoomLobbyPage /></ProtectedRoute> },
  // Game screen — protected
  {
    element: <ProtectedRoute><GameLayout /></ProtectedRoute>,
    children: [
      { path: '/game/:gameId', element: <GameScreen /> },
    ],
  },
]);

export default router;
