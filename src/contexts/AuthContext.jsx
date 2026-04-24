import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { fetchUserProfile, saveUserAvatar } from '../api/users';
import { auth, googleProvider } from '../firebase.js';

const AuthContext = createContext(null);
const GUEST_STORAGE_KEY = 'gamearena_guest_user';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function isEmailPasswordUser(firebaseUser) {
  const providers = Array.isArray(firebaseUser?.providerData)
    ? firebaseUser.providerData.map((provider) => provider?.providerId)
    : [];
  return providers.includes('password');
}

function normalizeUser(firebaseUser, options = {}) {
  if (!firebaseUser) return null;

  const { forceEmailDisplayName = false } = options;
  const preferEmailDisplayName = forceEmailDisplayName || isEmailPasswordUser(firebaseUser);

  const fallbackName =
    (preferEmailDisplayName ? firebaseUser.email : firebaseUser.displayName) ||
    firebaseUser.displayName ||
    firebaseUser.email ||
    `Player-${String(firebaseUser.uid || '').slice(0, 6)}`;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: fallbackName,
    photoURL: firebaseUser.photoURL || null,
    avatarId: 'avatar1',
    stats: { wins: 0, losses: 0, draws: 0 },
    createdAt: firebaseUser.metadata?.creationTime || null,
    isGuest: false,
  };
}

function getRandomToken(length = 10) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += alphabet[bytes[i] % alphabet.length];
  }

  return token;
}

function createGuestUser() {
  const randomId = getRandomToken(12);
  const shortId = randomId.slice(0, 4).toUpperCase();

  return {
    uid: `guest_${randomId}`,
    displayName: `Guest_${shortId}`,
    isGuest: true,
    email: null,
    photoURL: null,
    avatarId: 'avatar1',
    createdAt: new Date().toISOString(),
  };
}

function isValidGuestUser(value) {
  if (!value || typeof value !== 'object') return false;
  if (typeof value.uid !== 'string' || !value.uid.startsWith('guest_')) return false;
  if (typeof value.displayName !== 'string' || !value.displayName.trim()) return false;
  return true;
}

function getStoredGuestUser() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isValidGuestUser(parsed)) {
      localStorage.removeItem(GUEST_STORAGE_KEY);
      return null;
    }

    return {
      ...parsed,
      isGuest: true,
      email: null,
      photoURL: null,
      avatarId: String(parsed.avatarId || 'avatar1').trim().toLowerCase() || 'avatar1',
    };
  } catch {
    return null;
  }
}

function setStoredGuestUser(guestUser) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
  } catch {
    // Ignore storage errors to avoid breaking login flow.
  }
}

function clearStoredGuestUser() {
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // Ignore storage errors to avoid breaking logout flow.
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        clearStoredGuestUser();
        setUser(normalizeUser(firebaseUser));
        setLoading(false);
        return;
      }

      setUser(getStoredGuestUser());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;

    async function syncUserProfile() {
      if (!user?.uid) return;

      setProfileLoading(true);
      try {
        const profile = await fetchUserProfile({ uid: user.uid, displayName: user.displayName });
        if (!active) return;

        setUser((prev) => {
          if (!prev || prev.uid !== user.uid) return prev;
          return {
            ...prev,
            displayName: profile.displayName || prev.displayName,
            avatarId: String(profile.avatarId || 'avatar1').trim().toLowerCase() || 'avatar1',
            stats: profile.stats || prev.stats || { wins: 0, losses: 0, draws: 0 },
            createdAt: profile.createdAt || prev.createdAt || null,
          };
        });
      } catch {
        // Keep app usable even when profile API is unavailable.
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    syncUserProfile();

    return () => {
      active = false;
    };
  }, [user?.uid, user?.displayName]);

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    clearStoredGuestUser();
    const normalized = normalizeUser(result.user);
    setUser(normalized);
    return normalized;
  }

  async function signUpWithEmail(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    clearStoredGuestUser();
    const normalized = normalizeUser(result.user, { forceEmailDisplayName: true });
    setUser(normalized);
    return normalized;
  }

  async function signInWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    clearStoredGuestUser();
    const normalized = normalizeUser(result.user, { forceEmailDisplayName: true });
    setUser(normalized);
    return normalized;
  }

  async function signInAsGuest() {
    const guestUser = createGuestUser();
    setStoredGuestUser(guestUser);

    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }

    setUser(guestUser);
    return guestUser;
  }

  async function signOut() {
    if (user?.isGuest) {
      clearStoredGuestUser();
      setUser(null);
      return;
    }

    await firebaseSignOut(auth);
  }

  async function updateAvatar(avatarId) {
    if (!user?.uid) throw new Error('Please sign in to update avatar.');

    const profile = await saveUserAvatar({
      uid: user.uid,
      avatarId,
      displayName: user.displayName,
    });

    setUser((prev) => {
      if (!prev || prev.uid !== user.uid) return prev;
      return {
        ...prev,
        displayName: profile.displayName || prev.displayName,
        avatarId: String(profile.avatarId || 'avatar1').trim().toLowerCase() || 'avatar1',
        stats: profile.stats || prev.stats || { wins: 0, losses: 0, draws: 0 },
        createdAt: profile.createdAt || prev.createdAt || null,
      };
    });

    return profile;
  }

  const value = useMemo(() => ({
    user,
    loading: loading || profileLoading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signInAsGuest,
    signOut,
    updateAvatar,
  }), [user, loading, profileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
