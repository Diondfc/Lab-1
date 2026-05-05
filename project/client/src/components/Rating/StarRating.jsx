import React, { useState } from 'react'

const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(null)

  return (
    <div className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-2xl cursor-pointer ${star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          onClick={() => setRating(star)}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default StarRating
