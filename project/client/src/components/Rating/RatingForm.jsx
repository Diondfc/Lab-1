import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StarRating from './StarRating'
import { apiClient } from '../../lib/api.js'

const RatingForm = ({ bookId, onRatingSubmitted = () => {} }) => {
  const navigate = useNavigate()
  const [ratingValue, setRatingValue] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setName(user.full_name || user.name || '')
        setEmail(user.email || '')
        setUserId(user.id || null)
        setIsLoggedIn(true)
      } catch (parseError) {
        console.error('Error parsing user from localStorage:', parseError)
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    if (!ratingValue) {
      setError('Please select a rating.')
      return
    }

    if (!reviewText.trim()) {
      setError('A comment is required to submit your rating.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccessMessage('')

      await apiClient.post('/api/ratings', {
        book_id: bookId,
        user_id: userId,
        rating_value: ratingValue,
        comment: reviewText,
      })

      setRatingValue(0)
      setReviewText('')
      setSuccessMessage('Review submitted successfully!')

      setTimeout(() => {
        onRatingSubmitted()
      }, 500)
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-[#90CAF9]">
      <h3 className="text-2xl font-bold mb-6 text-[#012F4A]">Write a Review</h3>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-[#3FA34D] text-[#3FA34D] rounded">
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-[#036280] mb-2">Name</label>
            <input
              type="text"
              value={name}
              readOnly
              className="w-full px-4 py-2 border border-[#90CAF9] rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-[#2E7AD2] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#036280] mb-2">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-2 border border-[#90CAF9] rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-[#2E7AD2] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#036280] mb-2">Your Rating</label>
          <StarRating rating={ratingValue} setRating={setRatingValue} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#036280] mb-2">Review</label>
          <textarea
            className="w-full px-4 py-3 border border-[#90CAF9] rounded-lg text-gray-700 focus:ring-2 focus:ring-[#00509D] focus:border-[#2E7AD2] focus:outline-none transition-all duration-200"
            placeholder="Share your detailed thoughts about this book..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows="5"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-[#2E7AD2] hover:bg-[#00509D] text-white font-semibold rounded-lg transition-colors duration-200 shadow-md"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RatingForm
