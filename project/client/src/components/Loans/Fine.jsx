import { useState, useEffect } from 'react';
import { 
  FiAlertCircle, 
  FiCheckCircle, 
  FiClock, 
  FiDollarSign, 
  FiInfo, 
  FiBook,
  FiCalendar
} from 'react-icons/fi';
import { apiClient } from '../../lib/api';

const Fines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFines = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) throw new Error("User not logged in");
        
        const response = await apiClient.get(`/api/loans/user/${user.id}`);
        if (response.data.success) {
          const loans = response.data.data;
          
          const calculatedFines = loans.map(loan => {
            let fineAmount = 0;
            let status = 'active';
            
            if (loan.status === 'returned' && loan.FineAmount) {
              fineAmount = parseFloat(loan.FineAmount);
              status = 'paid';
            } else if (loan.status === 'overdue' && !loan.returnDate) {
              const dueDate = new Date(loan.dueDate);
              const today = new Date();
              const daysLate = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
              fineAmount = daysLate * 0.50;
              status = 'unpaid';
            }
            
            return {
              ...loan,
              fineAmount,
              status,
              daysLate: loan.returnDate 
                ? Math.ceil((new Date(loan.returnDate) - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))
                : Math.ceil((Date.now() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))
            };
          }).filter(loan => loan.fineAmount > 0);

          setFines(calculatedFines);
        } else {
          throw new Error(response.data.message || 'Failed to fetch fines');
        }
      } catch (error) {
        console.error('Error fetching fines:', error);
        setError(error.message || 'Failed to load fines data');
      } finally {
        setLoading(false);
      }
    };

    fetchFines();
  }, []);

  const totalFines = fines.reduce((sum, fine) => sum + fine.fineAmount, 0);
  const unpaidFines = fines.filter(fine => fine.status === 'unpaid').length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg font-medium text-gray-600">Loading fines…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg font-medium text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#FD7F2F] to-[#233B7D] text-white rounded-2xl p-6 mb-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-1">Fines & Payments</h1>
        <p className="text-[#FFE4C4] opacity-90">View your outstanding and paid fines</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Total Fines Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-[#036280] bg-opacity-10 mr-4">
              <FiDollarSign className="text-[#036280] text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">Total Fines</p>
              <p className="text-2xl font-bold text-[#036280]">${totalFines.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        {/* Unpaid Fines Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-[#FD7F2F] bg-opacity-10 mr-4">
              <FiAlertCircle className="text-[#FD7F2F] text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">Unpaid Fines</p>
              <p className="text-2xl font-bold text-[#FD7F2F]">{unpaidFines}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-[#012F4A] mb-4 flex items-center">
          <FiInfo className="mr-3 text-[#FD7F2F]" /> Fine Policy
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="inline-block bg-[#036280] rounded-full w-2 h-2 mt-2 mr-3"></span>
            <span className="text-gray-700">Fines are charged at <strong>$0.50 per day</strong> for overdue books</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block bg-[#036280] rounded-full w-2 h-2 mt-2 mr-3"></span>
            <span className="text-gray-700">Maximum fine per book is <strong>$10.00</strong></span>
          </li>
          <li className="flex items-start">
            <span className="inline-block bg-[#036280] rounded-full w-2 h-2 mt-2 mr-3"></span>
            <span className="text-gray-700">Fines are automatically marked as paid when books are returned</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block bg-[#036280] rounded-full w-2 h-2 mt-2 mr-3"></span>
            <span className="text-gray-700">Unpaid fines restrict borrowing privileges</span>
          </li>
        </ul>
      </div>

      {/* Fines List */}
      <div className="space-y-5">
        {fines.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3FA34D] bg-opacity-10 rounded-full mb-4">
              <FiCheckCircle className="text-[#3FA34D] text-3xl" />
            </div>
            <h3 className="text-xl font-medium text-[#3FA34D] mb-2">No fines recorded</h3>
            <p className="text-gray-600">You have no outstanding or paid fines!</p>
          </div>
        ) : (
          fines.map((fine) => (
            <div 
              key={fine.id} 
              className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${
                fine.status === 'paid' ? 'border-[#3FA34D]' : 'border-[#FD7F2F]'
              } hover:shadow-md transition-shadow`}
            >
              <div className="flex flex-col md:flex-row gap-5">
                {/* Book Cover Placeholder */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                    <FiBook className="text-gray-400 text-2xl" />
                  </div>
                </div>
                
                {/* Fine Details */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#012F4A]">{fine.BookTitle}</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1 flex items-center">
                            <FiCalendar className="mr-2 text-[#036280]" /> Due Date
                          </p>
                          <p className="text-gray-700">{new Date(fine.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1 flex items-center">
                            {fine.returnDate ? (
                              <FiCheckCircle className="mr-2 text-[#3FA34D]" />
                            ) : (
                              <FiClock className="mr-2 text-[#FD7F2F]" />
                            )}
                            {fine.returnDate ? "Returned" : "Days Overdue"}
                          </p>
                          <p className={!fine.returnDate ? 'text-[#FD7F2F] font-medium' : 'text-gray-700'}>
                            {fine.returnDate 
                              ? new Date(fine.returnDate).toLocaleDateString()
                              : `${fine.daysLate} day${fine.daysLate !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Fine Amount */}
                    <div className="mt-4 md:mt-0 text-center md:text-right">
                      <div className={`text-2xl font-bold ${
                        fine.status === 'paid' ? 'text-[#3FA34D]' : 'text-[#FD7F2F]'
                      }`}>
                        ${fine.fineAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                        {fine.daysLate} day{fine.daysLate !== 1 ? 's' : ''} late
                      </div>
                    </div>
                  </div>

                  {/* Fine Calculation */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-[#012F4A] mb-2 flex items-center">
                      <FiDollarSign className="mr-2 text-[#036280]" /> Fine Calculation
                    </h4>
                    <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
                      <span className="text-gray-500">Base rate:</span>
                      <span>$0.50 per day</span>
                      <span className="text-gray-500">Late days:</span>
                      <span>{fine.daysLate}</span>
                      <span className="text-gray-500 font-medium">Total:</span>
                      <span className="font-medium">
                        $0.50 × {fine.daysLate} = ${fine.fineAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className={`mt-4 p-3 rounded-lg flex items-center ${
                    fine.status === 'paid' 
                      ? 'bg-[#3FA34D] bg-opacity-10 text-[#3FA34D]' 
                      : 'bg-[#FD7F2F] bg-opacity-10 text-[#FD7F2F]'
                  }`}>
                    {fine.status === 'paid' ? (
                      <>
                        <FiCheckCircle className="mr-2 flex-shrink-0" />
                        <span>Fine resolved - book was returned on {new Date(fine.returnDate).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        <FiAlertCircle className="mr-2 flex-shrink-0" />
                        <span>This fine is unpaid. Please visit the library to resolve.</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Fines;