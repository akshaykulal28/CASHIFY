import { createContext, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext();

const STORAGE_KEY = 'authUser';

const readStoredUser = () => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return null;

    const parsedValue = JSON.parse(storedValue);
    if (!parsedValue || typeof parsedValue !== 'object') return null;

    return {
      id: parsedValue.id || null,
      phone: parsedValue.phone || '',
      email: parsedValue.email || '',
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const setUserProfile = (nextUser) => {
    if (typeof nextUser === 'function') {
      setUser((currentUser) => {
        const resolvedUser = nextUser(currentUser || null);
        if (!resolvedUser) return null;

        return {
          id: resolvedUser.id || null,
          phone: resolvedUser.phone || '',
          email: resolvedUser.email || '',
        };
      });
      return;
    }

    if (!nextUser) {
      setUser(null);
      return;
    }

    setUser({
      id: nextUser.id || null,
      phone: nextUser.phone || '',
      email: nextUser.email || '',
    });
  };

  const clearUserProfile = () => {
    setUser(null);
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    userEmail: user?.email || '',
    userPhone: user?.phone || '',
    isAuthenticated: Boolean(user),
    setUserProfile,
    clearUserProfile,
  }), [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
