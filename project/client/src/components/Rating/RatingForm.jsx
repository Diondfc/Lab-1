import React, { useState } from 'react'
import StarRating from './StarRating'
import { apiClient } from '../../lib/api.js'

function RatingForm({ book_id, user_id }) {
  const [ratingValue, setRatingValue] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setMessageType(null)

    if (!ratingValue || ratingValue < 1) {
      setMessage('Please select a rating (1–5 stars) before submitting.')
      setMessageType('error')
      return
    }

    setLoading(true)

    try {
      await apiClient.post('/api/ratings', {
        book_id,
        user_id,
        rating_value: ratingValue,
        comment,
      })

      setMessage('Rating submitted successfully!')
      setMessageType('success')
      setRatingValue(0)
      setComment('')
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to submit rating. Please try again.'
      setMessage(errMsg)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Rate this book</h3>

      {message && (
        <p
          className={`mb-4 rounded px-3 py-2 text-sm ${
            messageType === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Your rating
          </label>
          <StarRating rating={ratingValue} setRating={setRatingValue} />
        </div>

        <div>
          <label htmlFor="rating-comment" className="mb-1 block text-sm font-medium text-gray-700">
            Comment
          </label>
          <textarea
            id="rating-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your thoughts about this book..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Submit rating'}
        </button>
      </form>
    </div>
  )
}

export default RatingForm
