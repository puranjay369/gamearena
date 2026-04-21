import { RouterProvider } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import { RoomProvider } from './contexts/RoomContext';
import router from './router';

function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <RouterProvider router={router} />
      </RoomProvider>
    </AuthProvider>
  );
}

export default App;
