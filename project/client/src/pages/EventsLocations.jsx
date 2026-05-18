import React, { useEffect, useState } from 'react'
import { FiClock, FiMapPin, FiUsers } from 'react-icons/fi'
import { apiClient } from '../lib/api'

const EventsLocations = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setError('')
        const { data } = await apiClient.get('/api/locations')
        setLocations(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
        setError('Could not load locations.')
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [])

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <header className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-700">
            Event Spaces
          </p>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Events locations</h1>
          <div className="mx-auto mb-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-indigo-600 to-green-800" />
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Library and campus spaces available for events, workshops, and academic activities.
          </p>
        </header>

        {error && <p className="mb-6 text-center text-red-600">{error}</p>}

        {loading ? (
          <p className="text-center text-gray-600">Loading locations…</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {locations.map((location) => (
              <article
                key={location.LocationID}
                className="rounded-xl border border-indigo-700/20 bg-gray-50 p-6 transition hover:bg-indigo-700/5"
              >
                <div className="mb-5 inline-flex rounded-full border border-indigo-700 p-3 text-indigo-700">
                  <FiMapPin className="text-xl" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">{location.Name}</h2>
                <p className="mb-5 text-sm text-gray-500">Location ID: {location.LocationID}</p>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FiUsers className="mr-2 text-indigo-700" />
                    <span>Reservable event space</span>
                  </div>
                  <div className="flex items-center">
                    <FiClock className="mr-2 text-indigo-700" />
                    <span>Contact the library for availability</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventsLocations
