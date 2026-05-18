import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiBook, 
  FiCalendar,
  FiFilter,
  FiUser,
  FiBarChart2
} from 'react-icons/fi';

const LoanHistory = () => {
  const location = useLocation();
  const { userId } = location.state || {};
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  useEffect(() => {
    const fetchUserLoans = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/loans/user/${userId}`);
        if (response.data.success) {
          const formattedLoans = response.data.data.map(loan => ({
            id: loan.id,
            BookID: loan.BookID,
            CoverImage: loan.CoverImage,
            BookTitle: loan.BookTitle,
            UserID: loan.UserID,
            UserName: loan.UserName,
            startDate: loan.startDate,
            dueDate: loan.dueDate,
            returnDate: loan.returnDate,
            status: loan.status
          }));
          setLoans(formattedLoans);
        } else {
          console.error('Error in response:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching user loans:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserLoans();
    }
  }, [userId]);

  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true;
    return loan.status === filter;
  });

  const totalLoans = loans.length;
  const activeLoans = loans.filter(loan => loan.status === 'active').length;
  const overdueLoans = loans.filter(loan => loan.status === 'overdue').length;
  const returnedLoans = loans.filter(loan => loan.status === 'returned').length;

  const getStatusStyle = (status) => {
    switch(status) {
      case 'active':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'overdue':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'returned':
        return 'bg-green-50 text-green-600 border-green-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active':
        return <FiClock className="mr-1.5" />;
      case 'overdue':
        return <FiAlertTriangle className="mr-1.5" />;
      case 'returned':
        return <FiCheckCircle className="mr-1.5" />;
      default:
        return <FiBook className="mr-1.5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-600">
          Loading loan history...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#3FA34D] to-[#036280] text-slate-900 rounded-2xl p-6 mb-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-1">Your Reading History</h1>
        <p className="text-blue-100 opacity-90">Track all your borrowed books</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Loans Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-[#012F4A] bg-opacity-10 mr-4">
              <FiBook className="text-[#012F4A] text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">Total Loans</p>
              <p className="text-2xl font-bold text-[#012F4A]">{totalLoans}</p>
            </div>
          </div>
        </div>

        {/* Active Loans Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 mr-4">
              <FiClock className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">Active</p>
              <p className="text-2xl font-bold text-blue-600">{activeLoans}</p>
            </div>
          </div>
        </div>

        {/* Overdue Loans Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 mr-4">
              <FiAlertTriangle className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueLoans}</p>
            </div>
          </div>
        </div>

        {/* Returned Loans Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 mr-4">
              <FiCheckCircle className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">Returned</p>
              <p className="text-2xl font-bold text-green-600">{returnedLoans}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#012F4A] flex items-center mb-4 sm:mb-0">
          <FiBarChart2 className="mr-3 text-[#036280]" /> Loan Records
        </h2>
        <div className="flex items-center">
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white text-gray-700"
            >
              <option value="all">All Loans</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <FiBook className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">No loans found</h3>
          <p className="text-gray-500">Try changing your filter criteria</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredLoans.map((loan) => (
            <div 
              key={loan.id} 
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-5">
                {/* Book Cover Placeholder */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                    <FiBook className="text-gray-400 text-2xl" />
                  </div>
                </div>
                
                {/* Loan Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold text-[#012F4A]">
                      {loan.BookTitle || "Unknown Book"}
                    </h3>
                    <span className={`text-xs px-3 py-1.5 rounded-full ${getStatusStyle(loan.status)} border flex items-center`}>
                      {getStatusIcon(loan.status)}
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 flex items-center">
                        <FiCalendar className="mr-2 text-blue-500" /> Borrowed
                      </p>
                      <p className="font-medium text-gray-700 mt-1">{formatDate(loan.startDate)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 flex items-center">
                        <FiCalendar className="mr-2 text-blue-500" /> Due Date
                      </p>
                      <p className={`font-medium mt-1 ${
                        loan.status === 'overdue' ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {formatDate(loan.dueDate)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 flex items-center">
                        <FiUser className="mr-2 text-blue-500" /> User
                      </p>
                      <p className="font-medium text-gray-700 mt-1">{loan.UserName || "N/A"}</p>
                    </div>
                  </div>

                  {loan.status === 'overdue' && (
                    <div className="mt-4">
                      <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full inline-flex items-center">
                        <FiAlertTriangle className="mr-1.5" />
                        {loan.returnDate 
                          ? `Was overdue by ${Math.floor((new Date(loan.returnDate) - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))} days`
                          : `Overdue by ${Math.floor((new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))} days`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoanHistory;