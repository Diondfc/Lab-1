import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { 
  FiX, 
  FiSave, 
  FiArrowLeft, 
  FiBook,
  FiUser,
  FiCalendar,
  FiCheck,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

const AddLoanForm = ({ onSave }) => {
  const location = useLocation();
  const { state } = location;
  
  const [currentUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14); // Default 14 days
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    bookId: state?.bookId || '',
    bookTitle: state?.bookTitle || '',
    userEmail: currentUser?.email || '',
    userId: currentUser?.id || '',
    userName: currentUser?.name || '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: getDefaultDueDate(),
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const navigate = useNavigate();

  // Fetch book details when bookId changes
  useEffect(() => {
    if (formData.bookId) {
      const fetchBookDetails = async () => {
        try {
          const response = await apiClient.get(`/api/books/book/${formData.bookId}`);
          const book = response.data;
          setFormData(prev => ({
            ...prev,
            bookTitle: book.Title
          }));
        } catch (error) {
          console.error('Error fetching book details:', error);
        }
      };
      fetchBookDetails();
    }
  }, [formData.bookId]);

  // Fetch user details when email changes (with debounce)
  useEffect(() => {
    if (currentUser?.role !== 'Admin' && formData.userEmail === currentUser?.email) return;
    const timer = setTimeout(() => {
      if (formData.userEmail) {
        fetchUserDetails();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced email lookup; stable currentUser from initial state
  }, [formData.userEmail]);

  const fetchUserDetails = async () => {
    setIsFetchingUser(true);
    try {
      const response = await apiClient.get(`/api/users/email/${formData.userEmail}`);
      const user = response.data;
      setFormData(prev => ({
        ...prev,
        userId: user.UserID,
        userName: user.Name
      }));
      setError('');
    } catch (error) {
      console.error('Error fetching user details:', error);
      setFormData(prev => ({
        ...prev,
        userId: '',
        userName: ''
      }));
      setError('User not found. Please check the email address.');
    } finally {
      setIsFetchingUser(false);
    }
  };

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
    
    if (!formData.userId) {
      setError('User not found. Please check the email address.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiClient.post('/api/loans', {
        bookId: formData.bookId,
        bookTitle: formData.bookTitle,
        userId: formData.userId,
        userName: formData.userName,
        startDate: formData.startDate,
        dueDate: formData.dueDate
      });
      
      if (response.data.success) {
        setSuccessMessage('Loan created successfully!');
        onSave({
          LoanID: response.data.loanId,
          BookID: formData.bookId,
          BookTitle: formData.bookTitle,
          UserID: formData.userId,
          UserName: formData.userName,
          StartDate: formData.startDate,
          DueDate: formData.dueDate,
          status: 'active'
        });
        
        setTimeout(() => {
          if (currentUser?.role === 'Admin') {
            navigate('/admin/loans');
          } else {
            navigate('/loan-history');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving loan:', error);
      setError(error.response?.data?.message || 'Failed to save loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => currentUser?.role === 'Admin' ? navigate('/admin/loans') : navigate('/books')}
          className="flex items-center text-[#036280] hover:text-[#012F4A] mb-6"
        >
          <FiArrowLeft className="mr-2" /> Back to {currentUser?.role === 'Admin' ? 'Loans Dashboard' : 'Library'}
        </button>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#036280] to-[#233B7D] p-6 text-white">
            <div className="flex items-center">
              <FiBook className="text-2xl mr-3" />
              <h2 className="text-2xl font-semibold">Add New Loan</h2>
            </div>
            <p className="mt-1 opacity-90">Fill in the details below to create a new book loan</p>
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
                <span>Processing loan, please wait...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Book Information */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Book ID *</label>
                  <input
                    type="text"
                    name="bookId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent"
                    value={formData.bookId}
                    onChange={handleChange}
                    required
                    readOnly={!!state?.bookId}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Book Title *</label>
                  <input
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent bg-gray-50"
                    required
                    readOnly
                  />
                </div>
              </div>

              {/* Right Column - User Information */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">User Email *</label>
                  <input
                    type="email"
                    name="userEmail"
                    value={formData.userEmail}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent ${currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}`}
                    required
                    readOnly={currentUser?.role !== 'Admin'}
                  />
                  {isFetchingUser && (
                    <p className="text-sm text-[#036280] mt-2 flex items-center">
                      <FiLoader className="animate-spin mr-2" />
                      Searching for user...
                    </p>
                  )}
                  {formData.userName && !isFetchingUser && (
                    <p className="text-sm text-[#3fa34d] mt-2 flex items-center">
                      <FiCheck className="mr-2" />
                      Found user: {formData.userName}
                    </p>
                  )}
                  {!formData.userName && formData.userEmail && !isFetchingUser && (
                    <p className="text-sm text-[#fd7f2f] mt-2 flex items-center">
                      <FiAlertCircle className="mr-2" />
                      User not found. Please check the email address.
                    </p>
                  )}
                </div>
              </div>

              {/* Full-width fields at bottom */}
              <div className="space-y-5 md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Due Date *</label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="md:col-span-2 pt-2">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => currentUser?.role === 'Admin' ? navigate('/admin/loans') : navigate('/books')}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-[#012F4A] hover:bg-gray-50 transition"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#036280] to-[#233B7D] hover:from-[#012F4A] hover:to-[#122B5C] text-white font-medium rounded-lg shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isSubmitting || !formData.userId}
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Create Loan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLoanForm;