import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBook, 
  FiCalendar, 
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiUser,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiArrowRight,
  FiArrowLeft,
  FiFilter,
  FiChevronDown,
} from 'react-icons/fi';
import { LuBookUp2 } from "react-icons/lu";
import { cn } from '../../lib/utils';

const LoansDashboard = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    searchQuery: ''
  });

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/loans');
        
        if (response.data?.success) {
          setLoans(Array.isArray(response.data.data) ? response.data.data : []);
        } else {
          setError(response.data?.message || 'Server returned unsuccessful response');
        }
      } catch (error) {
        console.error('Request failed:', error);
        setError(
          error.response?.data?.message ||
          error.message ||
          'Failed to connect to server'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const handleReturnNavigation = (loan) => {
    navigate('/process-return', {
      state: {
        loanId: loan.LoanID,
        bookId: loan.BookID,
        userId: loan.UserID,
        bookTitle: loan.BookTitle,
        userName: loan.UserName
      }
    });
  };

  const filteredLoans = loans.filter(loan => {
    if (filters.status !== 'all') {
      if (filters.status === 'active' && loan.status !== 'active') return false;
      if (filters.status === 'overdue' && (loan.status !== 'overdue' || loan.ReturnDate)) return false;
      if (filters.status === 'returned' && loan.status !== 'returned') return false;
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const userMatch = loan.UserName?.toLowerCase().includes(query);
      const bookMatch = loan.BookTitle?.toLowerCase().includes(query);
      return userMatch || bookMatch;
    }
    
    return true;
  });

  const handleDeleteLoan = async (loanId) => {
    if (window.confirm('Delete this loan permanently?')) {
      try {
        const response = await apiClient.delete(`/api/loans/${loanId}`);
        if (response.data.success) {
          setLoans(prev => prev.filter(loan => loan.LoanID !== loanId));
        }
      } catch (error) {
        console.error('Error deleting loan:', error);
        alert('Failed to delete loan: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Calculate statistics
  const totalLoans = loans.length;
  const returnedLoans = loans.filter(loan => loan.status === 'returned').length;
  const overdueLoans = loans.filter(loan => loan.status === 'overdue').length;
  const activeLoans = loans.filter(loan => loan.status === 'active').length;
  
  const totalFines = loans.reduce((sum, loan) => {
    let fine = 0;
    
    if (loan.status === 'returned') {
      fine = parseFloat(loan.FineAmount || 0);
    } else if (loan.status === 'overdue' && !loan.ReturnDate) {
      const dueDate = new Date(loan.DueDate);
      const today = new Date();
      const daysLate = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      fine = 0.50 * daysLate;
    }
    
    return sum + fine;
  }, 0);

  const formatLoanDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md text-center">
          <FiAlertTriangle className="text-5xl text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Failed to load data</h2>
          <p className="text-slate-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-slate-900 pt-24 pb-12 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
        >
          <div>
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center text-slate-400 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white transition mb-4 text-sm font-medium"
            >
              <FiArrowLeft className="mr-2" /> Back to Admin Panel
            </button>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className="bg-indigo-100/50 dark:bg-indigo-900/30 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <LuBookUp2 className="text-indigo-600 dark:text-indigo-400" />
              </div>
              Loan Management
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Manage and track book borrowing across the library.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-700 dark:text-slate-300 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all font-medium"
              onClick={() => navigate('/process-return')}
            >
              <FiCheckCircle className="text-indigo-500" /> Return Book
            </button>
            <button 
              className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-all font-medium"
              onClick={() => navigate('/admin/add-loan')}
            >
              <FiPlus /> New Loan
            </button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {[
            { 
              icon: <LuBookUp2 className="text-xl" />, 
              value: totalLoans, 
              label: "Total Loans", 
              bgColor: "bg-zinc-100",
              iconColor: "text-zinc-600",
            },
            { 
              icon: <FiClock className="text-xl" />, 
              value: activeLoans, 
              label: "Active", 
              bgColor: "bg-indigo-100",
              iconColor: "text-indigo-600",
            },
            { 
              icon: <FiAlertTriangle className="text-xl" />, 
              value: overdueLoans, 
              label: "Overdue", 
              bgColor: "bg-rose-100",
              iconColor: "text-rose-600",
            },
            { 
              icon: <FiDollarSign className="text-xl" />, 
              value: `$${totalFines.toFixed(2)}`, 
              label: "Total Fines", 
              bgColor: "bg-amber-100",
              iconColor: "text-amber-600",
            }
          ].map((stat, index) => (
            <motion.div variants={fadeUp} key={index} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm shadow-zinc-200/50 border border-zinc-100 dark:border-slate-700 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className={cn("p-3.5 rounded-2xl", stat.bgColor, stat.iconColor)}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Loans Table Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 dark:border-slate-700 overflow-hidden transition-colors duration-300"
        >
          <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-slate-700 bg-zinc-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Loan Records</h2>
                <p className="text-slate-400 text-sm">Detailed overview of all active and past loans.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by book or user..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                  />
                </div>
                
                <div className="relative">
                  <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                  <select
                    className="w-full sm:w-48 appearance-none pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all cursor-pointer font-medium text-zinc-700 dark:text-slate-300"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="overdue">Overdue</option>
                    <option value="returned">Returned</option>
                  </select>
                  <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-medium">Loading loans...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-slate-800 border-b border-zinc-100 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Book Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fine</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  <AnimatePresence>
                    {filteredLoans.length > 0 ? (
                      filteredLoans.map((loan) => {
                        const fineAmount = loan.FineAmount || 0;
                        const daysLate = loan.status === 'overdue' && !loan.ReturnDate 
                          ? Math.max(0, Math.floor((new Date() - new Date(loan.DueDate)) / 86400000))
                          : 0;

                        return (
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={loan.LoanID} 
                            className="hover:bg-zinc-50/80 dark:hover:bg-slate-700/50 transition-colors group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                                  <LuBookUp2 className="text-indigo-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-zinc-900 dark:text-white max-w-[200px] truncate">{loan.BookTitle || 'Unknown Book'}</p>
                                  <p className="text-xs text-slate-500">ID: {loan.BookID}</p>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                  <FiUser className="text-slate-400 text-sm" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{loan.UserName}</p>
                                  <p className="text-xs text-slate-500">{loan.UserID}</p>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="flex items-center text-sm">
                                  <FiCalendar className="mr-2 text-slate-500" />
                                  <span className="text-zinc-700 dark:text-slate-300">Due: <span className="font-medium text-zinc-900 dark:text-white">{formatLoanDate(loan.DueDate)}</span></span>
                                </div>
                                {loan.status === 'returned' && (
                                  <div className="flex items-center text-sm">
                                    <FiCheckCircle className="mr-2 text-indigo-500" />
                                    <span className="text-slate-400">In: {formatLoanDate(loan.ReturnDate)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                                loan.status === 'returned' ? 'bg-indigo-100 text-indigo-700' : 
                                loan.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 
                                'bg-blue-100 text-blue-700'
                              )}>
                                {loan.status === 'overdue' && <FiAlertTriangle />}
                                {loan.status === 'active' && <FiClock />}
                                {loan.status === 'returned' && <FiCheckCircle />}
                                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                              </span>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              {loan.status === 'returned' && fineAmount > 0 ? (
                                <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 font-bold text-sm">
                                  ${typeof fineAmount === 'number' ? fineAmount.toFixed(2) : parseFloat(fineAmount || 0).toFixed(2)}
                                </span>
                              ) : loan.status === 'overdue' && !loan.ReturnDate ? (
                                <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 font-bold text-sm">
                                  ${(0.50 * daysLate).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {loan.status !== 'returned' && (
                                  <button
                                    onClick={() => handleReturnNavigation(loan)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Process Return"
                                  >
                                    <FiCheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteLoan(loan.LoanID)}
                                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Record"
                                >
                                  <FiTrash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan="6" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                              <LuBookUp2 className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No loans found</p>
                            <p className="text-sm text-slate-400 mb-4">There are no records matching your criteria.</p>
                            <button 
                              onClick={() => setFilters({ status: 'all', searchQuery: '' })}
                              className="px-4 py-2 bg-zinc-100 dark:bg-slate-700 text-zinc-700 dark:text-slate-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-slate-600 transition font-medium text-sm"
                            >
                              Clear Filters
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoansDashboard;