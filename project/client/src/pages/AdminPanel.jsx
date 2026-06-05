import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  AreaChart, Area
} from 'recharts';
import { 
  FiBook, FiUsers, FiClock, FiActivity, FiMessageSquare, FiSettings,
  FiTrendingUp, FiPlusCircle, FiList, FiCalendar, FiShield
} from 'react-icons/fi';
import { LuBookUp2 } from "react-icons/lu";
import { apiClient } from '../lib/api';
import { isStaffRole } from '../lib/roles';

// Mock Data for Charts
const loansData = [
  { name: 'Mon', loans: 4 },
  { name: 'Tue', loans: 7 },
  { name: 'Wed', loans: 5 },
  { name: 'Thu', loans: 12 },
  { name: 'Fri', loans: 8 },
  { name: 'Sat', loans: 15 },
  { name: 'Sun', loans: 9 },
];

const categoryData = [
  { name: 'Academic', count: 120 },
  { name: 'Novels', count: 85 },
  { name: 'Journals', count: 45 },
  { name: 'Tech', count: 90 },
];

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return true;
  }
}

function MeasuredChart({ height = 300, children }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      setWidth(Math.max(0, Math.floor(element.getBoundingClientRect().width)));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <div ref={containerRef} className="min-w-0 w-full" style={{ height, minHeight: height }}>
      {width > 0 ? children(width, height) : null}
    </div>
  );
}

const AdminPanel = () => {
    const navigate = useNavigate();
    const [dashboardStats, setDashboardStats] = useState({
      borrowedBooks: 0,
      activeMembers: 0,
      overdueLoans: 0,
      totalBooks: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState('');

    useEffect(() => {
      let mounted = true;

      async function loadDashboardStats() {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;

        if (!token || isTokenExpired(token) || !isStaffRole(currentUser?.role)) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (mounted) {
            setStatsLoading(false);
            navigate('/login', { replace: true });
          }
          return;
        }

        try {
          setStatsLoading(true);
          setStatsError('');
          const { data } = await apiClient.get('/api/dashboard/stats');
          if (!mounted) return;

          setDashboardStats({
            borrowedBooks: Number(data?.borrowedBooks) || 0,
            activeMembers: Number(data?.activeMembers) || 0,
            overdueLoans: Number(data?.overdueLoans) || 0,
            totalBooks: Number(data?.totalBooks) || 0,
          });
        } catch (error) {
          if (!mounted) return;
          setStatsError(error.response?.data?.message || 'Could not load dashboard statistics.');
        } finally {
          if (mounted) setStatsLoading(false);
        }
      }

      loadDashboardStats();
      return () => {
        mounted = false;
      };
    }, [navigate]);

    const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

    const staggerContainer = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
  
    const fadeUp = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-slate-900 pt-24 pb-12 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 mb-4">
                      <FiSettings className="text-indigo-700 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">System Control</span>
                    </div>
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      Admin Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                      Overview of library operations and system analytics.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button 
                      className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 transition-all font-medium"
                      onClick={() => navigate('/admin/role-history')}
                    >
                      <FiShield /> Role History
                    </button>
                    <button 
                      className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl shadow-lg shadow-zinc-900/20 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-medium"
                      onClick={() => navigate('/admin/add-book')}
                    >
                      <FiPlusCircle /> Add New Book
                    </button>
                  </div>
                </motion.div>

                {/* KPI Cards */}
                {statsError && (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    {statsError}
                  </div>
                )}
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
                >
                  {[
                    { title: "Total Books", value: dashboardStats.totalBooks, icon: <FiBook />, color: "indigo", trend: "+12%" },
                    { title: "Active Loans", value: dashboardStats.borrowedBooks, icon: <LuBookUp2 />, color: "blue", trend: "+5%" },
                    { title: "Active Members", value: dashboardStats.activeMembers, icon: <FiUsers />, color: "amber", trend: "+18%" },
                    { title: "Overdue", value: dashboardStats.overdueLoans, icon: <FiClock />, color: "rose", trend: "-2%" }
                  ].map((stat, i) => (
                    <motion.div variants={fadeUp} key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-slate-700 transition-colors duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                          {React.cloneElement(stat.icon, { className: "w-6 h-6" })}
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-bold ${stat.trend.startsWith('+') ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {stat.trend.startsWith('+') ? <FiTrendingUp /> : <FiTrendingUp className="rotate-180" />}
                          {stat.trend}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                        {statsLoading ? '...' : formatNumber(stat.value)}
                      </h3>
                      <p className="text-slate-400 font-medium">{stat.title}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* System Management - Full width, bigger and more organized */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-slate-700 transition-colors duration-300 mb-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <FiSettings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">System Management</h3>
                      <p className="text-slate-400 text-sm mt-0.5">Control panels and configuration settings for library operations.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: 'Loans Management', path: '/admin/loans', icon: <LuBookUp2 />, desc: 'Process & track loans', color: 'indigo' },
                      { title: 'Academic Books', path: '/admin/academic-dashboard', icon: <FiBook />, desc: 'Manage literature', color: 'blue' },
                      { title: 'Novels Database', path: '/admin/novels-dashboard', icon: <FiBook />, desc: 'Manage fiction', color: 'teal' },
                      { title: 'Journals Config', path: '/admin/journals-dashboard', icon: <FiList />, desc: 'Manage publications', color: 'emerald' },
                      { title: 'Events Control', path: '/events/dashboard', icon: <FiCalendar />, desc: 'Organize library events', color: 'rose' },
                      { title: 'Ratings Overview', path: '/admin/ratings', icon: <FiActivity />, desc: 'View all book ratings', color: 'amber' },
                      { title: 'Reservation Queue', path: '/admin/reservations', icon: <FiClock />, desc: 'Manage book holds', color: 'lime' },
                      { title: 'Audit Logs', path: '/admin/audit-logs', icon: <FiActivity />, desc: 'Track important actions', color: 'sky' },
                      { title: 'Library Reports', path: '/admin/reports', icon: <FiTrendingUp />, desc: 'Search & reports', color: 'green' },
                      { title: 'Role History', path: '/admin/role-history', icon: <FiShield />, desc: 'Track role periods', color: 'violet' },
                      { title: 'User Management', path: '/admin/users', icon: <FiUsers />, desc: 'Activate/deactivate users', color: 'cyan' },
                      { title: 'Roles', path: '/admin/crud/roles', icon: <FiShield />, desc: 'Create and edit roles', color: 'violet' },
                      { title: 'Authors', path: '/admin/crud/authors', icon: <FiUsers />, desc: 'Manage author records', color: 'blue' },
                      { title: 'Categories', path: '/admin/crud/categories', icon: <FiList />, desc: 'Manage categories', color: 'emerald' },
                      { title: 'Publishers', path: '/admin/crud/publishers', icon: <FiBook />, desc: 'Manage publishers', color: 'sky' },
                      { title: 'Members', path: '/admin/crud/members', icon: <FiUsers />, desc: 'Manage member profiles', color: 'cyan' },
                      { title: 'Book Reviews', path: '/admin/crud/bookreviews', icon: <FiActivity />, desc: 'Manage reviews', color: 'amber' },
                      { title: 'User Claims', path: '/admin/crud/user-claims', icon: <FiShield />, desc: 'Manage identity claims', color: 'rose' },
                      { title: 'User Tokens', path: '/admin/crud/user-tokens', icon: <FiActivity />, desc: 'Manage user tokens', color: 'indigo' },
                      { title: 'Refresh Tokens', path: '/admin/crud/refresh-tokens', icon: <FiClock />, desc: 'Revoke or remove refresh tokens', color: 'lime' },
                      { title: 'Reservations', path: '/admin/crud/reservations', icon: <FiClock />, desc: 'Manage reservations', color: 'green' },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(item.path)}
                        className="flex items-center gap-4 p-5 bg-zinc-50 dark:bg-slate-900/30 hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 rounded-2xl border border-zinc-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all text-left group shadow-sm hover:shadow-md"
                      >
                        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                          {React.cloneElement(item.icon, { className: "w-6 h-6" })}
                        </div>
                        <div>
                          <span className="block font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-0.5">{item.title}</span>
                          <span className="text-xs text-slate-400">{item.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Community Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-slate-700 transition-colors duration-300 mb-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Chatrooms list */}
                    <div className="lg:col-span-7">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                          <FiMessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Community Moderation</h3>
                          <p className="text-slate-400 text-sm mt-0.5">Manage genre-specific book club rooms.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { title: 'Journals room', path: '/book-club?room=journals', color: 'blue' },
                          { title: 'Academic room', path: '/book-club?room=academic', color: 'purple' },
                          { title: 'Novels room', path: '/book-club?room=novels', color: 'amber' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => navigate(item.path)}
                            className="flex items-center p-4 bg-zinc-50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md rounded-2xl border border-zinc-100 dark:border-slate-700 transition-all text-left group"
                          >
                            <div className={`w-3 h-3 rounded-full bg-${item.color}-500 mr-3`} />
                            <span className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right: System Status */}
                    <div className="lg:col-span-5 flex flex-col justify-center">
                      <div className="p-5 bg-zinc-50 dark:bg-slate-900/30 rounded-2xl text-slate-900 dark:text-white relative overflow-hidden border border-zinc-100 dark:border-slate-700 transition-colors duration-300">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                          <h4 className="font-bold mb-1">System Status</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">All services are operating normally.</p>
                          <div className="flex items-center gap-2 text-sm text-indigo-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Connected to Database
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Charts Section - Moved lower down */}
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Activity Chart */}
                  <motion.div variants={fadeUp} className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-slate-700 transition-colors duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Loan Activity</h3>
                        <p className="text-slate-400 text-sm">Daily borrowing trends over the last week</p>
                      </div>
                    </div>
                    <MeasuredChart>
                      {(width, height) => (
                        <AreaChart width={width} height={height} data={loansData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="loans" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLoans)" />
                        </AreaChart>
                      )}
                    </MeasuredChart>
                  </motion.div>

                  {/* Categories Chart */}
                  <motion.div variants={fadeUp} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-slate-700 transition-colors duration-300">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Collection Stats</h3>
                      <p className="text-slate-400 text-sm">Books by category</p>
                    </div>
                    <MeasuredChart>
                      {(width, height) => (
                        <BarChart width={width} height={height} data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontWeight: 500 }} />
                          <RechartsTooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                      )}
                    </MeasuredChart>
                  </motion.div>
                </motion.div>
                
            </div>
        </div>
    );
};

export default AdminPanel;
