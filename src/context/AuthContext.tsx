import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface AppUser {
  id: number;
  uid: string;
  email: string;
  role: 'applicant' | 'committee' | 'admin';
  profile?: {
    id: number;
    fullName: string;
    phone?: string;
    region?: string;
  } | null;
}

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  activeRole: 'applicant' | 'committee';
  setActiveRole: (role: 'applicant' | 'committee') => void;
  anonymizedMode: boolean;
  setAnonymizedMode: (val: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'register' | 'login' | 'admin';
  openAuthModal: (tab?: 'register' | 'login' | 'admin') => void;
  registerApplicant: (data: { email: string; password?: string; fullName: string; phone?: string; region?: string }) => Promise<void>;
  loginUserAccount: (email: string, password?: string, expectedRole?: 'applicant' | 'committee') => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  switchDemoUser: (role: 'applicant' | 'committee') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'edufa_user_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<'applicant' | 'committee'>('committee');
  const [anonymizedMode, setAnonymizedMode] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'register' | 'login' | 'admin'>('register');

  const openAuthModal = (tab: 'register' | 'login' | 'admin' = 'register') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const syncWithBackend = async (uid: string, email: string, role: string, fullName?: string) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, role, fullName }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setActiveRole(data.user.role === 'committee' || data.user.role === 'admin' ? 'committee' : 'applicant');
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.user));
        } catch (_) {}
        return data.user;
      }
    } catch (err) {
      console.error('Failed to sync auth user with backend:', err);
    }
    return null;
  };

  useEffect(() => {
    // Check saved session
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: AppUser = JSON.parse(saved);
        setCurrentUser(parsed);
        setActiveRole(parsed.role === 'committee' || parsed.role === 'admin' ? 'committee' : 'applicant');
      } catch (_) {}
    }

    // Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        await syncWithBackend(fbUser.uid, fbUser.email, 'applicant', fbUser.displayName || undefined);
        setLoading(false);
      } else if (!saved) {
        // Default committee lead session
        await syncWithBackend(
          'admin-committee-uid',
          'admin@dragonsenterprises.com',
          'committee',
          'Admin Evaluator'
        );
        setActiveRole('committee');
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const registerApplicant = async (data: { email: string; password?: string; fullName: string; phone?: string; region?: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create applicant account');
      }
      setCurrentUser(responseData.user);
      setActiveRole('applicant');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(responseData.user));
      setIsAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const loginUserAccount = async (email: string, password?: string, expectedRole?: 'applicant' | 'committee') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole }),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || 'Login failed');
      }
      setCurrentUser(responseData.user);
      setActiveRole(responseData.user.role === 'committee' || responseData.user.role === 'admin' ? 'committee' : 'applicant');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(responseData.user));
      setIsAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const cred = await signInWithPopup(auth, googleAuthProvider);
      if (cred.user && cred.user.email) {
        await syncWithBackend(cred.user.uid, cred.user.email, 'applicant', cred.user.displayName || undefined);
      }
    } catch (err) {
      console.error('Google Sign In error:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoUser = async (role: 'applicant' | 'committee') => {
    setLoading(true);
    if (role === 'committee') {
      await syncWithBackend(
        'admin-committee-uid',
        'admin@dragonsenterprises.com',
        'committee',
        'Admin Evaluator'
      );
      setActiveRole('committee');
    } else {
      await syncWithBackend(
        'applicant-user-uid',
        'applicant@dragonsenterprises.com',
        'applicant',
        'Applicant'
      );
      setActiveRole('applicant');
    }
    setLoading(false);
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCurrentUser(null);
    setActiveRole('applicant');
  };

  const refreshUserData = async () => {
    if (currentUser) {
      await syncWithBackend(
        currentUser.uid,
        currentUser.email,
        currentUser.role,
        currentUser.profile?.fullName
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        activeRole,
        setActiveRole,
        anonymizedMode,
        setAnonymizedMode,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        openAuthModal,
        registerApplicant,
        loginUserAccount,
        signInWithGoogle,
        switchDemoUser,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
