import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';

const StarDisplay = ({ value }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const RatingDashboard = () => {
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await apiClient.get('/api/ratings', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setRatings(data);
        setError('');
      } catch (err) {
        console.error('Error fetching ratings:', err);
        setError('Failed to load ratings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, []);

  const totalRatings = ratings.length;
  const averageRating =
    totalRatings > 0
      ? (ratings.reduce((sum, r) => sum + (r.rating_value || 0), 0) / totalRatings).toFixed(1)
      : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Ratings Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Overview of all book ratings in the system.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Ratings</p>
            <p className="text-4xl font-bold text-blue-600">{isLoading ? '—' : totalRatings}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Average Rating</p>
            {isLoading ? (
              <p className="text-4xl font-bold text-yellow-500">—</p>
            ) : averageRating ? (
              <div className="flex flex-col items-center gap-1">
                <p className="text-4xl font-bold text-yellow-500">{averageRating}</p>
                <StarDisplay value={Math.round(averageRating)} />
              </div>
            ) : (
              <p className="text-gray-400 text-sm mt-2">No data</p>
            )}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-500"></div>
            <p className="text-gray-400 text-sm">Loading ratings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 text-sm">
            {error}
          </div>
        ) : totalRatings === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-medium">No ratings yet.</p>
            <p className="text-sm mt-1">Ratings will appear here once submitted.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {ratings.map((rating, index) => {
              const ratingId = rating._id || rating.id || index;
              return (
                <div
                  key={ratingId}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left: Book & user info */}
                    <div className="flex-1 min-w-0">
                      {rating.book_title || rating.book?.title ? (
                        <p className="font-semibold text-gray-800 truncate">
                          📖 {rating.book_title || rating.book?.title}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">Book title unavailable</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        User ID: {rating.user_id || '—'}
                      </p>
                    </div>

                    {/* Right: Stars & date */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StarDisplay value={rating.rating_value || 0} />
                      <span className="text-xs text-gray-400">{formatDate(rating.created_at)}</span>
                    </div>
                  </div>

                  {/* Comment */}
                  {rating.comment && (
                    <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 border border-gray-100 italic">
                      "{rating.comment}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingDashboard;
