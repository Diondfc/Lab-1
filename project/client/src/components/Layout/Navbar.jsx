import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiBook, FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'About', path: '/about' },
    { name: 'Events', path: '/events' },
    { name: 'Book club', path: '/book-club' },
    { name: 'My shelf', path: '/bookshelf' },
  ];

  if (user?.role === 'Admin' || user?.role === 'Librarian') {
    navLinks.push({ name: 'Staff panel', path: '/admin' });
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled
          ? 'bg-zinc-950/80 backdrop-blur-md border-zinc-800 shadow-lg'
          : 'bg-zinc-950 border-transparent',
      )}
    >
      <motion.div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 text-xl font-bold tracking-tight text-white transition hover:text-emerald-400 group"
        >
          <motion.div className="bg-emerald-500/20 p-2 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
            <FiBook className="h-6 w-6 text-emerald-400" aria-hidden />
          </motion.div>
          <span className="hidden sm:inline-block">UBT Library</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative text-sm font-medium text-zinc-300 transition-colors hover:text-white group"
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          <motion.div className="flex items-center gap-4 border-l border-zinc-800 pl-6">
            {user ? (
              <motion.div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                  <FiUser className="text-emerald-400" />
                  <span className="max-w-[100px] truncate">{user.full_name || user.name || 'User'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-zinc-800/50 p-2 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                  title="Logout"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-zinc-300 transition hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
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
          className="md:hidden p-2 text-zinc-400 hover:text-white transition"
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
            className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition"
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-4 mt-4 border-t border-zinc-800 flex flex-col gap-3">
                {user ? (
                  <>
                    <motion.div className="px-4 py-2 flex items-center gap-3 text-zinc-300">
                      <FiUser className="text-emerald-400" />
                      {user.full_name || user.name || 'User'}
                    </motion.div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-base font-medium text-red-400 hover:bg-red-500/10 transition"
                    >
                      <FiLogOut /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 rounded-xl border border-zinc-800 text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 rounded-xl bg-emerald-600 text-base font-medium text-white hover:bg-emerald-500 transition"
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
