import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  FiBook, FiUsers, FiClock, FiActivity, FiMessageSquare, FiSettings,
  FiTrendingUp, FiPlusCircle, FiList, FiCalendar
} from 'react-icons/fi';
import { LuBookUp2 } from "react-icons/lu";

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

const AdminPanel = () => {
    const navigate = useNavigate();

    const staggerContainer = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
  
    const fadeUp = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="min-h-screen bg-zinc-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 mb-4">
                      <FiSettings className="text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">System Control</span>
                    </div>
                    <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
                      Admin Dashboard
                    </h1>
                    <p className="text-zinc-500 mt-2 text-lg">
                      Overview of library operations and system analytics.
                    </p>
                  </div>
                  
                  <button 
                    className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 transition-all font-medium"
                    onClick={() => navigate('/admin/add-book')}
                  >
                    <FiPlusCircle /> Add New Book
                  </button>
                </motion.div>

                {/* KPI Cards */}
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
                >
                  {[
                    { title: "Total Books", value: "3,240", icon: <FiBook />, color: "emerald", trend: "+12%" },
                    { title: "Active Loans", value: "184", icon: <LuBookUp2 />, color: "blue", trend: "+5%" },
                    { title: "Active Users", value: "892", icon: <FiUsers />, color: "amber", trend: "+18%" },
                    { title: "Overdue", value: "24", icon: <FiClock />, color: "rose", trend: "-2%" }
                  ].map((stat, i) => (
                    <motion.div variants={fadeUp} key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                          {React.cloneElement(stat.icon, { className: "w-6 h-6" })}
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-bold ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {stat.trend.startsWith('+') ? <FiTrendingUp /> : <FiTrendingUp className="rotate-180" />}
                          {stat.trend}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold text-zinc-900 mb-1">{stat.value}</h3>
                      <p className="text-zinc-500 font-medium">{stat.title}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Charts Section */}
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10"
                >
                  {/* Activity Chart */}
                  <motion.div variants={fadeUp} className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900">Loan Activity</h3>
                        <p className="text-zinc-500 text-sm">Daily borrowing trends over the last week</p>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={loansData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Categories Chart */}
                  <motion.div variants={fadeUp} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-zinc-900">Collection Stats</h3>
                      <p className="text-zinc-500 text-sm">Books by category</p>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontWeight: 500 }} />
                          <RechartsTooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Quick Management Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Management Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                        <FiSettings className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900">System Management</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { title: 'Loans Management', path: '/admin/loans', icon: <LuBookUp2 />, desc: 'Process & track loans' },
                        { title: 'Academic Books', path: '/admin/academic-dashboard', icon: <FiBook />, desc: 'Manage literature' },
                        { title: 'Novels Database', path: '/admin/novels-dashboard', icon: <FiBook />, desc: 'Manage fiction' },
                        { title: 'Journals Config', path: '/admin/journals-dashboard', icon: <FiList />, desc: 'Manage publications' },
                        { title: 'Events Control', path: '/events/dashboard', icon: <FiCalendar />, desc: 'Organize library events' },
                        { title: 'Ratings Overview', path: '/admin/ratings', icon: <FiActivity />, desc: 'View all book ratings' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(item.path)}
                          className="flex flex-col items-start p-4 bg-zinc-50 hover:bg-emerald-50 rounded-2xl border border-zinc-100 hover:border-emerald-200 transition-all text-left group"
                        >
                          <div className="text-zinc-600 group-hover:text-emerald-600 mb-2">
                            {React.cloneElement(item.icon, { className: "w-6 h-6" })}
                          </div>
                          <span className="font-bold text-zinc-900 mb-1">{item.title}</span>
                          <span className="text-xs text-zinc-500">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Community Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                        <FiMessageSquare className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900">Community Moderation</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { title: 'Journals room', path: '/book-club?room=journals', color: 'blue' },
                        { title: 'Academic room', path: '/book-club?room=academic', color: 'purple' },
                        { title: 'Novels room', path: '/book-club?room=novels', color: 'amber' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(item.path)}
                          className="flex items-center p-4 bg-zinc-50 hover:bg-white hover:shadow-md rounded-2xl border border-zinc-100 transition-all text-left group"
                        >
                          <div className={`w-3 h-3 rounded-full bg-${item.color}-500 mr-3`} />
                          <span className="font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{item.title}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-8 p-5 bg-zinc-900 rounded-2xl text-white relative overflow-hidden">
                      <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
                      <div className="relative z-10">
                        <h4 className="font-bold mb-1">System Status</h4>
                        <p className="text-sm text-zinc-400 mb-4">All services are operating normally.</p>
                        <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Connected to Database
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
            </div>
        </div>
    );
};

export default AdminPanel;