import { useState } from 'react';
import { apiClient } from '../../lib/api';
import { 
  FiArrowLeft, 
  FiCheckCircle, 
  FiChevronDown,
  FiAlertCircle,
  FiLoader,
  FiCheck,
  FiX,
  FiBook,
  FiUser,
  FiCalendar
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

const ReturnForm = () => {
  const location = useLocation();
  const { state } = location;
  
  const [formData, setFormData] = useState({
    loanId: state?.loanId || '',
    bookId: state?.bookId || '',
    bookTitle: state?.bookTitle || '',
    userId: state?.userId || '',
    userName: state?.userName || '',
    returnDate: new Date().toISOString().split('T')[0],
    condition: 'good',
    notes: ''
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // If coming from dashboard with pre-filled data, skip the initial inputs
  const [skipInitialInputs] = useState(!!state?.loanId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await apiClient.post('/api/returns', {
        bookId: formData.bookId,
        userId: formData.userId,
        returnDate: formData.returnDate,
        condition: formData.condition,
        notes: formData.notes
      });
      
      if (response.data.success) {
        setSuccessMessage('Return processed successfully!');
        
        setTimeout(() => {
          navigate('/admin/loans', {
            state: { 
              successMessage: 'Return processed successfully!',
              fineAmount: response.data.fineAmount
            }
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Error processing return:', error);
      setError(error.response?.data?.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/admin/loans')}
          className="flex items-center text-[#036280] hover:text-[#012F4A] mb-6"
        >
          <FiArrowLeft className="mr-2" /> Back to Loans Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#036280] to-[#233B7D] p-6 text-white">
            <div className="flex items-center">
              <FiCheckCircle className="text-2xl mr-3" />
              <h2 className="text-2xl font-semibold">Process Book Return</h2>
            </div>
            <p className="mt-1 opacity-90">Record the return details and condition of the book</p>
          </div>

          <div className="p-6">
            {successMessage && (
              <div className="relative animate-slide-in text-green-700 bg-green-50 p-4 rounded-lg font-medium mb-6 border border-green-200 flex items-start">
                <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  {successMessage}
                  <p className="text-sm font-normal mt-1 text-green-600">Redirecting you shortly...</p>
                </div>
                <button
                  onClick={() => setSuccessMessage('')}
                  className="absolute top-3 right-3 text-green-800 hover:text-green-600"
                >
                  <FiX />
                </button>
              </div>
            )}

            {error && (
              <div className="relative text-red-700 bg-red-50 p-4 rounded-lg font-medium mb-6 border border-red-200 flex items-start">
                <FiAlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>{error}</div>
                <button
                  onClick={() => setError('')}
                  className="absolute top-3 right-3 text-red-800 hover:text-red-600"
                >
                  <FiX />
                </button>
              </div>
            )}

            {isSubmitting && (
              <div className="text-yellow-700 bg-yellow-50 p-4 rounded-lg font-medium mb-6 border border-yellow-200 flex items-center">
                <FiLoader className="animate-spin mr-2" />
                <span>Processing return, please wait...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {skipInitialInputs && (
                <div className="bg-[#90caf9]/10 p-5 rounded-lg border border-[#90caf9]/20">
                  <h3 className="font-medium text-[#012F4A] mb-3 flex items-center">
                    <FiBook className="mr-2 text-[#036280]" />
                    Loan Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#036280]">Book</p>
                      <p className="font-medium text-[#012F4A]">
                        {formData.bookTitle} (ID: {formData.bookId})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#036280]">User</p>
                      <p className="font-medium text-[#012F4A]">
                        {formData.userName} (ID: {formData.userId})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#036280]">Loan ID</p>
                      <p className="font-medium text-[#012F4A]">{formData.loanId}</p>
                    </div>
                  </div>
                </div>
              )}

              {!skipInitialInputs && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Loan ID *</label>
                    <input
                      type="text"
                      name="loanId"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent"
                      value={formData.loanId}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Book ID *</label>
                    <input
                      type="text"
                      name="bookId"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent"
                      value={formData.bookId}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">User ID *</label>
                    <input
                      type="text"
                      name="userId"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent"
                      value={formData.userId}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Return Date *</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="returnDate"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent"
                      value={formData.returnDate}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Book Condition *</label>
                  <div className="relative">
                    <select
                      name="condition"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent appearance-none bg-white pr-10"
                      value={formData.condition}
                      onChange={handleChange}
                      required
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FiChevronDown className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea
                  name="notes"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/loans')}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-[#012F4A] hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#036280] to-[#233B7D] hover:from-[#012F4A] hover:to-[#122B5C] text-white font-medium rounded-lg shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" />
                      Process Return
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnForm;