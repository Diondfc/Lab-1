import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
        const response = await axios.get('http://localhost:5000/api/loans');
        
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
        const response = await axios.delete(`http://localhost:5000/api/loans/${loanId}`);
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
    if (!dateString) return 'Not available';
    try {
      return dateString.split('T')[0];
    } catch {
      return 'Invalid date';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-600">
          Loading loans...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#012F4A] flex items-center gap-3">
              <LuBookUp2 className="text-4xl text-[#036280]" />
              Loan Management
            </h1>
            <p className="text-gray-600 mt-2">
              {loans.length} loans processed in our system
            </p>
          </div>
          <button
            onClick={() => navigate('/adminpanel')}
            className="flex items-center text-[#036280] hover:text-[#024b63] transition self-start md:self-center"
          >
            <FiArrowLeft className="mr-2" />
            Back to Admin Panel
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { 
            icon: <LuBookUp2 className="text-2xl" />, 
            value: totalLoans, 
            label: "Total Loans", 
            bgColor: "bg-[#012F4A]/10",
            iconColor: "text-[#012F4A]",
            textColor: "text-[#012F4A]"
          },
          { 
            icon: <FiClock className="text-2xl" />, 
            value: activeLoans, 
            label: "Active", 
            bgColor: "bg-blue-100",
            iconColor: "text-blue-600",
            textColor: "text-blue-600"
          },
          { 
            icon: <FiAlertTriangle className="text-2xl" />, 
            value: overdueLoans, 
            label: "Overdue", 
            bgColor: "bg-red-100",
            iconColor: "text-red-600",
            textColor: "text-red-600"
          },
          { 
            icon: <FiDollarSign className="text-2xl" />, 
            value: `$${totalFines.toFixed(2)}`, 
            label: "Total Fines", 
            bgColor: "bg-green-100",
            iconColor: "text-green-600",
            textColor: "text-green-600"
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor} mr-4`}>
                <div className={stat.iconColor}>{stat.icon}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Process Return Card */}
        <div 
          className="bg-gradient-to-r from-[#3FA34D] to-[#3FA34D]/90 p-5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer text-white"
          onClick={() => navigate('/process-return')}
        >
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              <FiCheckCircle className="text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Process Return</h3>
              <p className="text-white/90 text-sm">Record book returns and calculate fines</p>
            </div>
            <FiArrowRight className="text-white/70 group-hover:text-white transition" />
          </div>
        </div>
        
        {/* Create New Loan Card */}
        <div 
          className="bg-gradient-to-r from-[#036280] to-[#00509D] p-5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer text-white"
          onClick={() => navigate('/add-loan')}
        >
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              <FiPlus className="text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Create New Loan</h3>
              <p className="text-white/90 text-sm">Add a new book loan record</p>
            </div>
            <FiArrowRight className="text-white/70 group-hover:text-white transition" />
          </div>
        </div>
      </div>

      {/* Loans Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#012F4A]">Loan Records</h2>
            <p className="text-gray-600">Detailed view of all book loans</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036280] focus:outline-none transition"
                value={filters.searchQuery}
                onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative flex-1 min-w-[180px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="text-gray-400" />
              </div>
              <select
                className="appearance-none pl-10 pr-10 py-2.5 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036280] focus:outline-none transition cursor-pointer bg-white"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Loans</option>
                <option value="overdue">Overdue Loans</option>
                <option value="returned">Returned Loans</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FiChevronDown className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const fineAmount = loan.FineAmount || 0;
                  const daysLate = loan.status === 'overdue' && !loan.ReturnDate 
                    ? Math.max(0, Math.floor((new Date() - new Date(loan.DueDate)) / 86400000))
                    : 0;

                  return (
                    <tr key={loan.LoanID} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-[#FD7F2F]/10 flex items-center justify-center border border-[#FD7F2F]/20">
                            <LuBookUp2 className="text-[#FD7F2F]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {loan.BookTitle || 'Unknown Book'}
                            </div>
                            <div className="text-xs text-gray-500">ID: {loan.BookID}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-[#2E7AD2]/10 p-2 rounded-full mr-3">
                            <FiUser className="text-[#2E7AD2] text-sm" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-900">{loan.UserName}</div>
                            <div className="text-xs text-gray-500">ID: {loan.UserID}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2 text-gray-400 text-sm" />
                            <span>Due: {formatLoanDate(loan.DueDate)}</span>
                          </div>
                          {loan.status === 'returned' && (
                            <div className="flex items-center">
                              <FiCheckCircle className="mr-2 text-gray-400 text-sm" />
                              <span>Returned: {formatLoanDate(loan.ReturnDate)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          loan.status === 'returned' ? 'bg-green-100 text-green-800' : 
                          loan.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {loan.status === 'overdue' && <FiAlertTriangle className="mr-1" />}
                          {loan.status === 'active' && <FiClock className="mr-1" />}
                          {loan.status === 'returned' && <FiCheckCircle className="mr-1" />}
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {loan.status === 'returned' && fineAmount > 0 ? (
                          <span className="text-red-600 font-medium">
                            ${typeof fineAmount === 'number' ? fineAmount.toFixed(2) : parseFloat(fineAmount || 0).toFixed(2)}
                          </span>
                        ) : loan.status === 'overdue' && !loan.ReturnDate ? (
                          <span className="text-[#FD7F2F]">
                            ${(0.50 * daysLate).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          {loan.status !== 'returned' && (
                            <button
                              onClick={() => handleReturnNavigation(loan)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition"
                              title="Process return"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLoan(loan.LoanID)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                            title="Delete loan"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FiBook className="w-12 h-12 mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-1">No matching loans found</p>
                      <p className="text-sm mb-3">Try adjusting your search or filter</p>
                      <button 
                        onClick={() => setFilters({ status: 'all', searchQuery: '' })}
                        className="px-4 py-2 bg-[#036280] text-white rounded-lg hover:bg-[#012F4A] transition"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoansDashboard;