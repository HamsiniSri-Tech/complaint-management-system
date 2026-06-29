import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // ─── Initialize: load user from localStorage ────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify token is still valid
          const { data } = await authAPI.getMe();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // ─── Fetch unread notification count ────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await authAPI.getNotifications({ limit: 1 });
      setUnreadNotifications(data.unreadCount || 0);
    } catch (error) {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  // ─── Register ────────────────────────────────────────────────────────────────
  const register = async (userData) => {
    try {
      const { data } = await authAPI.register(userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Account created successfully! Welcome!');
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // ─── Login ───────────────────────────────────────────────────────────────────
  const login = async (credentials) => {
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUnreadNotifications(0);
    toast.success('Logged out successfully');
  };

  // ─── Update user in context ───────────────────────────────────────────────────
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // ─── Role helpers ────────────────────────────────────────────────────────────
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';
  const isUser  = user?.role === 'user';

  // ─── Get avatar URL ──────────────────────────────────────────────────────────
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    return `http://localhost:5000/uploads/${avatar}`;
  };

  const value = {
    user,
    loading,
    unreadNotifications,
    setUnreadNotifications,
    register,
    login,
    logout,
    updateUser,
    fetchUnreadCount,
    isAdmin,
    isAgent,
    isUser,
    getAvatarUrl,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Custom Hook ─────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;