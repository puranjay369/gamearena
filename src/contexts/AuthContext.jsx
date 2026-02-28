import { createContext, useContext, useState, useEffect } from 'react';

const AUTH_STORAGE_KEY = 'gamearena_user';
const USERS_STORAGE_KEY = 'gamearena_users';

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
      if (stored) setUser(stored);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  function persistUser(u) {
    setUser(u);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
  }

  async function signup(email, password, displayName) {
    const users = getStoredUsers();
    if (users.find((u) => u.email === email)) {
      throw new Error('An account with this email already exists.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const newUser = {
      uid: crypto.randomUUID(),
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: null,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, { ...newUser, password }]);
    persistUser(newUser);
    return newUser;
  }

  async function login(email, password) {
    const users = getStoredUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      throw new Error('Invalid email or password.');
    }
    const { password: _, ...safeUser } = found;
    persistUser(safeUser);
    return safeUser;
  }

  async function loginWithGoogle() {
    // Local mock: create/login a demo Google user
    const demoEmail = 'player@gmail.com';
    const users = getStoredUsers();
    let found = users.find((u) => u.email === demoEmail);
    if (!found) {
      found = {
        uid: crypto.randomUUID(),
        email: demoEmail,
        displayName: 'Player',
        photoURL: null,
        password: '__google__',
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, found]);
    }
    const { password: _, ...safeUser } = found;
    persistUser(safeUser);
    return safeUser;
  }

  async function logout() {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  const value = { user, loading, loginWithGoogle, signup, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
