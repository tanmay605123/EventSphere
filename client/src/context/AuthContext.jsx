import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { supabase } from '../utils/supabase.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount from Supabase and localStorage
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. Check active Supabase session
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const authUser = sessionData.session.user;
          const tokenVal = sessionData.session.access_token;

          // Fetch profile details from Supabase profiles if possible
          let profileName = authUser.user_metadata?.name;
          let profilePhone = authUser.user_metadata?.phone;

          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .maybeSingle();
            if (prof?.name) profileName = prof.name;
            if (prof?.phone) profilePhone = prof.phone;
          } catch {
            // ignore
          }

          const userObj = {
            id: authUser.id,
            _id: authUser.id,
            name: profileName || authUser.email.split('@')[0],
            email: authUser.email,
            phone: profilePhone || '',
            createdAt: authUser.created_at,
          };

          if (isMounted) {
            setUser(userObj);
            setToken(tokenVal);
            localStorage.setItem('eventsphere_token', tokenVal);
            localStorage.setItem('eventsphere_user', JSON.stringify(userObj));
            setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn('Supabase initial auth check notice', err);
      }

      // 2. Fallback to localStorage session
      const storedToken = localStorage.getItem('eventsphere_token');
      const storedUser = localStorage.getItem('eventsphere_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setToken(storedToken);
            setUser(parsedUser);
          }

          // Verify token & fetch fresh user details in background
          api.getProfile()
            .then((res) => {
              if (res.user && isMounted) {
                setUser(res.user);
                localStorage.setItem('eventsphere_user', JSON.stringify(res.user));
              }
            })
            .catch(() => {
              // Ignore background refresh failure
            })
            .finally(() => {
              if (isMounted) setLoading(false);
            });
          return;
        } catch (e) {
          logout();
        }
      }

      if (isMounted) setLoading(false);
    }

    initAuth();

    // 3. Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const authUser = session.user;
          const userObj = {
            id: authUser.id,
            _id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email.split('@')[0],
            email: authUser.email,
            phone: authUser.user_metadata?.phone || '',
            createdAt: authUser.created_at,
          };
          setUser(userObj);
          setToken(session.access_token);
          localStorage.setItem('eventsphere_token', session.access_token);
          localStorage.setItem('eventsphere_user', JSON.stringify(userObj));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          localStorage.removeItem('eventsphere_token');
          localStorage.removeItem('eventsphere_user');
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.user) {
      const tokenVal = data.token || 'supabase_token_' + data.user.id;
      setToken(tokenVal);
      setUser(data.user);
      localStorage.setItem('eventsphere_token', tokenVal);
      localStorage.setItem('eventsphere_user', JSON.stringify(data.user));
    }
    return data;
  };

  const signup = async (name, email, password, phone) => {
    const data = await api.signup({ name, email, password, phone });
    if (data.user) {
      const tokenVal = data.token || 'supabase_token_' + data.user.id;
      setToken(tokenVal);
      setUser(data.user);
      localStorage.setItem('eventsphere_token', tokenVal);
      localStorage.setItem('eventsphere_user', JSON.stringify(data.user));
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eventsphere_token');
    localStorage.removeItem('eventsphere_user');
    api.logout?.().catch(() => {});
    supabase.auth.signOut().catch(() => {});
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('eventsphere_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
