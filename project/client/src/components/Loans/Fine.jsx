import { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiInfo,
} from 'react-icons/fi';
import { apiClient } from '../../lib/api';

const fineStatusLabel = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  waived: 'Waived',
};

const Fines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchFines = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('User not logged in');

      const response = await apiClient.get(`/api/fines?userId=${user.id}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch fines');
      }

      setFines(response.data.data.map((fine) => {
        const dueDate = new Date(fine.DueDate);
        const returnDate = new Date(fine.ReturnDate);
        const daysLate = Math.max(
          0,
          Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24))
        );

        return {
          ...fine,
          fineAmount: parseFloat(fine.Amount || 0),
          status: String(fine.Status || '').toLowerCase(),
          daysLate,
        };
      }));
    } catch (error) {
      console.error('Error fetching fines:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load fines data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handlePayFine = async (fineId) => {
    try {
      setPayingId(fineId);
      setError(null);
      await apiClient.post(`/api/fines/${fineId}/pay`, {
        paymentMethod: 'Mock Wallet',
      });
      await fetchFines();
    } catch (error) {
      console.error('Error paying fine:', error);
      setError(error.response?.data?.message || error.message || 'Failed to pay fine');
    } finally {
      setPayingId(null);
    }
  };

  const totalFines = fines.reduce((sum, fine) => sum + fine.fineAmount, 0);
  const unpaidFines = fines.filter((fine) => fine.status === 'unpaid').length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg font-medium text-gray-600">Loading fines...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#FD7F2F] to-[#233B7D] p-6 text-slate-900 shadow-lg">
        <h1 className="mb-1 text-3xl font-bold">Fines & Payments</h1>
        <p className="text-[#FFE4C4] opacity-90">View and pay your library fines</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <FiAlertCircle className="mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center">
            <div className="mr-4 rounded-lg bg-[#036280] bg-opacity-10 p-3">
              <FiDollarSign className="text-xl text-[#036280]" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-500">Total Fines</p>
              <p className="text-2xl font-bold text-[#036280]">${totalFines.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center">
            <div className="mr-4 rounded-lg bg-[#FD7F2F] bg-opacity-10 p-3">
              <FiAlertCircle className="text-xl text-[#FD7F2F]" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-500">Unpaid Fines</p>
              <p className="text-2xl font-bold text-[#FD7F2F]">{unpaidFines}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center text-xl font-bold text-[#012F4A]">
          <FiInfo className="mr-3 text-[#FD7F2F]" /> Fine Policy
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="mr-3 mt-2 inline-block h-2 w-2 rounded-full bg-[#036280]"></span>
            <span className="text-gray-700">Fines are charged at <strong>$0.50 per day</strong> for overdue books</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 mt-2 inline-block h-2 w-2 rounded-full bg-[#036280]"></span>
            <span className="text-gray-700">Fine records are created when overdue books are returned</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3 mt-2 inline-block h-2 w-2 rounded-full bg-[#036280]"></span>
            <span className="text-gray-700">Unpaid fines can be paid online or resolved by library staff</span>
          </li>
        </ul>
      </div>

      <div className="space-y-5">
        {fines.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#3FA34D] bg-opacity-10">
              <FiCheckCircle className="text-3xl text-[#3FA34D]" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-[#3FA34D]">No fines recorded</h3>
            <p className="text-gray-600">You have no outstanding or paid fines.</p>
          </div>
        ) : (
          fines.map((fine) => (
            <div
              key={fine.FineID}
              className={`rounded-xl border-l-4 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                fine.status === 'unpaid' ? 'border-[#FD7F2F]' : 'border-[#3FA34D]'
              }`}
            >
              <div className="flex flex-col gap-5 md:flex-row">
                <div className="flex-shrink-0">
                  <div className="flex h-20 w-16 items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
                    <FiBook className="text-2xl text-gray-400" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-lg font-bold text-[#012F4A]">{fine.BookTitle}</h3>

                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="mb-1 flex items-center text-gray-500">
                            <FiCalendar className="mr-2 text-[#036280]" /> Due Date
                          </p>
                          <p className="text-gray-700">{new Date(fine.DueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="mb-1 flex items-center text-gray-500">
                            <FiClock className="mr-2 text-[#FD7F2F]" /> Returned
                          </p>
                          <p className="text-gray-700">{new Date(fine.ReturnDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center md:mt-0 md:text-right">
                      <div className={`text-2xl font-bold ${
                        fine.status === 'unpaid' ? 'text-[#FD7F2F]' : 'text-[#3FA34D]'
                      }`}>
                        ${fine.fineAmount.toFixed(2)}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">
                        {fineStatusLabel[fine.status] || fine.Status}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-gray-50 p-4">
                    <h4 className="mb-2 flex items-center font-medium text-[#012F4A]">
                      <FiDollarSign className="mr-2 text-[#036280]" /> Fine Calculation
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <span className="text-gray-500">Base rate:</span>
                      <span>$0.50 per day</span>
                      <span className="text-gray-500">Late days:</span>
                      <span>{fine.daysLate}</span>
                      <span className="font-medium text-gray-500">Total:</span>
                      <span className="font-medium">
                        $0.50 x {fine.daysLate} = ${fine.fineAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className={`mt-4 flex items-center rounded-lg p-3 ${
                    fine.status === 'unpaid'
                      ? 'bg-[#FD7F2F] bg-opacity-10 text-[#FD7F2F]'
                      : 'bg-[#3FA34D] bg-opacity-10 text-[#3FA34D]'
                  }`}>
                    {fine.status === 'unpaid' ? (
                      <>
                        <FiAlertCircle className="mr-2 flex-shrink-0" />
                        <span>This fine is unpaid.</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="mr-2 flex-shrink-0" />
                        <span>
                          {fine.status === 'waived'
                            ? 'Fine waived by library staff'
                            : `Fine paid${fine.PaidAt ? ` on ${new Date(fine.PaidAt).toLocaleDateString()}` : ''}`}
                        </span>
                      </>
                    )}
                  </div>

                  {fine.status === 'unpaid' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handlePayFine(fine.FineID)}
                        disabled={payingId === fine.FineID}
                        className="inline-flex items-center rounded-lg bg-[#036280] px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-[#024c63] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <FiCreditCard className="mr-2" />
                        {payingId === fine.FineID ? 'Processing...' : 'Pay Fine'}
                      </button>
                    </div>
                  )}
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
