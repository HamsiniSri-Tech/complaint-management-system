import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/axios';
import {
  FiMenu, FiBell, FiUser, FiLogOut,
  FiSettings, FiChevronDown, FiCheck,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Navbar = ({ onMenuClick, title }) => {
  const { user, logout, unreadNotifications,
          setUnreadNotifications, getAvatarUrl } = useAuth();
  const navigate  = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu,      setShowUserMenu]      = useState(false);
  const [notifications,     setNotifications]     = useState([]);
  const [loadingNotifs,     setLoadingNotifs]     = useState(false);

  const notifRef   = useRef(null);
  const userRef    = useRef(null);

  // ─── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const { data } = await authAPI.getNotifications({ limit: 8 });
      setNotifications(data.notifications || []);
      setUnreadNotifications(data.unreadCount || 0);
    } catch {
      // silently fail
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleNotifToggle = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications((prev) => !prev);
    setShowUserMenu(false);
  };

  // ─── Mark all as read ──────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await authAPI.markNotificationsRead();
      setUnreadNotifications(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ─── Notification type icon colors ────────────────────────────────────────
  const notifColor = (type) => {
    const map = {
      complaint_submitted: 'bg-blue-100 text-blue-600',
      complaint_assigned:  'bg-purple-100 text-purple-600',
      status_updated:      'bg-yellow-100 text-yellow-600',
      complaint_resolved:  'bg-green-100 text-green-600',
      complaint_rejected:  'bg-red-100 text-red-600',
      new_complaint:       'bg-orange-100 text-orange-600',
      general:             'bg-gray-100 text-gray-600',
    };
    return map[type] || map.general;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center
                       justify-between px-4 lg:px-6 sticky top-0 z-10 shadow-sm">
      {/* ── Left: Hamburger + Title ──────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500
                     transition-colors"
        >
          <FiMenu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">
          {title || 'Dashboard'}
        </h1>
      </div>

      {/* ── Right: Notifications + User Menu ────────────────── */}
      <div className="flex items-center gap-2">

        {/* ── Notification Bell ─────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleNotifToggle}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500
                       transition-colors"
          >
            <FiBell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500
                               text-white text-xs rounded-full flex items-center
                               justify-center font-bold leading-none">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl
                            shadow-lg border border-gray-200 overflow-hidden
                            animate-fadeIn z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3
                              border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Notifications
                  {unreadNotifications > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600
                                     text-xs rounded-full font-bold">
                      {unreadNotifications}
                    </span>
                  )}
                </h3>
                {unreadNotifications > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-600 hover:text-primary-700
                               font-medium flex items-center gap-1"
                  >
                    <FiCheck size={12} /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-primary-600
                                    border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FiBell size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50
                                  transition-colors ${!notif.isRead ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center
                                        justify-center flex-shrink-0 text-xs font-bold
                                        ${notifColor(notif.type)}`}>
                          {notif.title?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full
                                          flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── User Menu ─────────────────────────────────────── */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setShowUserMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100
                       transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100
                            flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-primary-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700
                             max-w-[120px] truncate">
              {user?.name}
            </span>
            <FiChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200
                         ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-12 w-52 bg-white rounded-xl
                            shadow-lg border border-gray-200 overflow-hidden
                            animate-fadeIn z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm
                             text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FiUser size={15} className="text-gray-400" />
                  My Profile
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm
                             text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FiSettings size={15} className="text-gray-400" />
                  Settings
                </Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                             text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut size={15} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;