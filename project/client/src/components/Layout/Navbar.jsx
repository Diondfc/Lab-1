import { useCallback, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiBell, FiBook, FiCheck, FiMenu, FiX, FiLogOut, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { isStaffRole } from '../../lib/roles';
import { apiClient } from '../../lib/api';

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return true;
  }
}

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState('');
  const { theme, toggleTheme } = useTheme();
  const unreadCount = notifications.filter((item) => !item.IsRead).length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!user || !token || isTokenExpired(token)) {
      if (token && isTokenExpired(token)) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser?.(null);
      }
      setNotifications([]);
      setNotificationsError('');
      return;
    }

    try {
      setNotificationsError('');
      const { data } = await apiClient.get('/api/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser?.(null);
        setNotifications([]);
        setNotificationsError('');
        return;
      }
      setNotificationsError('Notifications unavailable.');
    }
  }, [setUser, user]);

  useEffect(() => {
    if (!user || !isNotificationsOpen) return undefined;

    loadNotifications();

    const id = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(id);
  }, [isNotificationsOpen, loadNotifications, user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item.NotificationID === notificationId ? { ...item, IsRead: 1 } : item,
        ),
      );
    } catch (error) {
      console.error(error);
      setNotificationsError('Could not update notification.');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiClient.patch('/api/notifications/read-all');
      setNotifications((current) => current.map((item) => ({ ...item, IsRead: 1 })));
    } catch (error) {
      console.error(error);
      setNotificationsError('Could not update notifications.');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'About', path: '/about' },
    { name: 'Events', path: '/events' },
    { name: 'Book club', path: '/book-club' },
    { name: 'My shelf', path: '/bookshelf' },
  ];

  if (isStaffRole(user?.role)) {
    navLinks.push({ name: 'Staff panel', path: '/admin' });
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled
          ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-transparent dark:border-transparent',
      )}
    >
      <motion.div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white transition hover:text-indigo-600 dark:hover:text-indigo-400 group"
        >
          <motion.div className="bg-indigo-500/10 p-2 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
            <FiBook className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden />
          </motion.div>
          <span className="hidden sm:inline-block">UBT Library</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 group"
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          <motion.div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-6">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            {user ? (
              <motion.div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen((open) => {
                        const next = !open;
                        if (next) loadNotifications();
                        return next;
                      });
                    }}
                    className="relative rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 transition hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-300"
                    title="Notifications"
                  >
                    <FiBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-12 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={markAllNotificationsRead}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notificationsError && (
                            <p className="px-4 py-3 text-sm text-red-600 dark:text-red-300">
                              {notificationsError}
                            </p>
                          )}
                          {!notificationsError && notifications.length === 0 && (
                            <p className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
                              No notifications yet.
                            </p>
                          )}
                          {!notificationsError &&
                            notifications.map((item) => (
                              <button
                                key={item.NotificationID}
                                type="button"
                                onClick={() => markNotificationRead(item.NotificationID)}
                                className={cn(
                                  'w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 dark:border-slate-800',
                                  item.IsRead
                                    ? 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'
                                    : 'bg-indigo-50/70 hover:bg-indigo-50 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60',
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {item.Title}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                      {item.Message}
                                    </p>
                                    <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                                      {item.CreatedAt ? new Date(item.CreatedAt).toLocaleString() : ''}
                                    </p>
                                  </div>
                                  {!item.IsRead && <FiCheck className="mt-0.5 shrink-0 text-indigo-600" />}
                                </div>
                              </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                  <FiUser className="text-indigo-600 dark:text-indigo-400" />
                  <span className="max-w-[100px] truncate">{user.full_name || user.name || 'User'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400"
                  title="Logout"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-indigo-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </motion.div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-slate-500 hover:text-indigo-600 transition"
        >
          {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
        </button>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition"
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col gap-3">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen((open) => !open)
                        loadNotifications()
                      }}
                      className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                    >
                      <span className="flex items-center gap-3">
                        <FiBell className="text-indigo-600" />
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    <motion.div className="px-4 py-2 flex items-center gap-3 text-slate-700">
                      <FiUser className="text-indigo-600" />
                      {user.full_name || user.name || 'User'}
                    </motion.div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-base font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      <FiLogOut /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 rounded-xl border border-slate-200 text-base font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 rounded-xl bg-indigo-600 text-base font-medium text-slate-900 hover:bg-indigo-500 transition"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;
