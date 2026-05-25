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
  FiLoader,
  FiDollarSign,
  FiCheckCircle
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { isStaffRole } from '../../lib/roles';

const AddLoanForm = ({ onSave }) => {
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  
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
    userName: currentUser?.full_name || currentUser?.name || '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: getDefaultDueDate(),
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    paymentAmount: '2.25' // default: $2.00 fee + $0.25 service fee
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  // Fetch book details when bookId changes to display title and calculate default amount
  useEffect(() => {
    if (formData.bookId) {
      const fetchBookDetails = async () => {
        try {
          const response = await apiClient.get(`/api/books/book/${formData.bookId}`);
          const book = response.data;
          
          // Calculate dynamic fee based on category
          // Categories: 1: Academic ($3.00), 2: Journal ($5.00), 3: Novel ($1.50)
          let fee = 2.00;
          if (book.CategoryID === 1) fee = 3.00;
          else if (book.CategoryID === 2) fee = 5.00;
          else if (book.CategoryID === 3) fee = 1.50;
          
          const totalFee = fee + 0.25; // fee + serviceFee

          setFormData(prev => ({
            ...prev,
            bookTitle: book.Title,
            paymentAmount: totalFee.toFixed(2)
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
    if (!isStaffRole(currentUser?.role) && formData.userEmail === currentUser?.email) return;
    const timer = setTimeout(() => {
      if (formData.userEmail) {
        fetchUserDetails();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!formData.userId) {
      setError('A valid library user is required.');
      return;
    }
    if (!formData.bookId) {
      setError('A valid book ID is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await apiClient.post('/api/loans', {
        bookId: formData.bookId,
        bookTitle: formData.bookTitle,
        userId: formData.userId,
        userName: formData.userName,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        paymentStatus: formData.paymentStatus,
        paymentAmount: parseFloat(formData.paymentAmount) || 0.00,
        paymentMethod: formData.paymentMethod
      });

      if (response.data.success) {
        setSuccessMessage('Loan created successfully!');
        
        if (onSave) {
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
        }

        setTimeout(() => {
          if (isStaffRole(currentUser?.role)) {
            navigate('/admin/loans');
          } else {
            navigate('/loan-history', { state: { userId: formData.userId } });
          }
        }, 1500);
      }
    } catch (apiErr) {
      console.error('Error saving loan:', apiErr);
      setError(apiErr.response?.data?.message || 'Failed to create loan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 font-poppins">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => isStaffRole(currentUser?.role) ? navigate('/admin/loans') : navigate('/books')}
          className="flex items-center text-slate-400 dark:text-slate-500 hover:text-zinc-900 dark:hover:text-white mb-6 text-sm font-semibold transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Back to {isStaffRole(currentUser?.role) ? 'Loans Dashboard' : 'Library'}
        </button>

        {/* Error Messaging */}
        {error && (
          <div className="relative text-rose-700 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl font-medium mb-8 border border-rose-200 dark:border-rose-900/50 flex items-start">
            <FiAlertCircle className="text-rose-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError('')} className="text-rose-800 dark:text-rose-400 hover:opacity-80">
              <FiX />
            </button>
          </div>
        )}

        {/* Success Messaging */}
        {successMessage && (
          <div className="relative text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl font-medium mb-8 border border-emerald-200 dark:border-emerald-900/50 flex items-start animate-fade-in">
            <FiCheckCircle className="text-emerald-500 mt-0.5 mr-2 flex-shrink-0 animate-bounce" />
            <div className="flex-1">{successMessage} Redirecting...</div>
          </div>
        )}

        {/* Main Card Container */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-slate-700/80 overflow-hidden transition-colors duration-300">
          
          <div className="bg-gradient-to-r from-indigo-900 via-slate-950 to-indigo-950 px-8 py-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 mr-4">
                <FiBook className="text-indigo-400 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Create Book Loan</h2>
                <p className="text-slate-400 text-sm mt-0.5">Fill in loan specifications and payment details below.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Section 1: Book Specifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-zinc-100 dark:border-slate-700/80 pb-2">Book Info</h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300">Book Catalog ID *</label>
                  <input
                    type="text"
                    name="bookId"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-900 dark:text-white border border-zinc-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    value={formData.bookId}
                    onChange={handleChange}
                    required
                    readOnly={!!state?.bookId}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300">Book Title</label>
                  <input
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    className="w-full px-4 py-3 bg-zinc-100 dark:bg-slate-900/60 dark:text-zinc-400 border border-zinc-100 dark:border-slate-800 rounded-2xl focus:outline-none font-medium cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>

              {/* Section 2: User Specifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-zinc-100 dark:border-slate-700/80 pb-2">Borrower Details</h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300">User Email Address *</label>
                  <input
                    type="email"
                    name="userEmail"
                    value={formData.userEmail}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-zinc-50 border border-zinc-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium dark:text-white ${!isStaffRole(currentUser?.role) ? 'bg-zinc-100 dark:bg-slate-900/60 cursor-not-allowed' : 'dark:bg-slate-900'}`}
                    required
                    readOnly={!isStaffRole(currentUser?.role)}
                  />
                  {isFetchingUser && (
                    <p className="text-xs text-indigo-500 mt-2 flex items-center">
                      <FiLoader className="animate-spin mr-2" /> Searching for user...
                    </p>
                  )}
                  {formData.userName && !isFetchingUser && (
                    <p className="text-xs text-emerald-500 mt-2 flex items-center font-semibold">
                      <FiCheck className="mr-1.5" /> Account Linked: {formData.userName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Dates */}
            <div className="bg-zinc-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-slate-700/50 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-zinc-200/50 dark:border-slate-700/50 pb-2">Rental Window</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300">Start Date *</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 dark:text-white border border-zinc-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300">Due Date *</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 dark:text-white border border-zinc-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Payment Details */}
            <div className="bg-zinc-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-slate-700/50 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-zinc-200/50 dark:border-slate-700/50 pb-2">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:text-white border border-zinc-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                    <option value="Member Wallet">Member Wallet</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 dark:text-white border border-zinc-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300">Payment Amount ($)</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      name="paymentAmount"
                      value={formData.paymentAmount}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 dark:text-white border border-zinc-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                      required
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Actions buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => isStaffRole(currentUser?.role) ? navigate('/admin/loans') : navigate('/books')}
                className="px-6 py-3 border border-zinc-200 dark:border-slate-600 rounded-2xl text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-700/60 font-semibold transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 hover:opacity-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={isSubmitting || !formData.userId}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiSave />
                    Create Loan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AddLoanForm;
