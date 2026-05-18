import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiCalendar, FiCheck, FiEdit3, FiMapPin } from 'react-icons/fi'
import { apiClient } from '../lib/api'

const EditEvents = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({
    Title: '',
    Date: '',
    Time: '',
    LocationID: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const [{ data: locs }, { data: ev }] = await Promise.all([
          apiClient.get('/api/locations'),
          apiClient.get(`/api/events/${id}`),
        ])
        if (cancelled) return
        setLocations(Array.isArray(locs) ? locs : [])
        setForm({
          Title: ev.Title || '',
          Date: ev.Date || '',
          Time: ev.Time || '',
          LocationID: ev.LocationID != null ? String(ev.LocationID) : '',
        })
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError(e.response?.status === 404 ? 'Event not found.' : 'Could not load event.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (id) run()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const lid = Number(form.LocationID)
    if (!form.Title?.trim() || !form.Date || !form.Time || !lid) {
      setError('Title, date, time, and location are required.')
      return
    }
    try {
      setSaving(true)
      setError('')
      await apiClient.put(`/api/events/${id}`, {
        Title: form.Title.trim(),
        Date: form.Date,
        Time: form.Time,
        LocationID: lid,
      })
      setSaved(true)
      setTimeout(() => navigate('/events/dashboard'), 800)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 text-center text-gray-600">
        Loading event…
      </div>
    )
  }

  if (error && !form.Title) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          {error}
          <button
            type="button"
            onClick={() => navigate('/events/dashboard')}
            className="mt-4 block text-sm font-semibold underline"
          >
            Back to events dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md">
          <div className="bg-gradient-to-r from-indigo-600 to-green-800 p-6 text-slate-900">
            <div className="flex items-center">
              <FiEdit3 className="mr-3 text-2xl" />
              <div>
                <h1 className="text-2xl font-semibold">Edit event</h1>
                <p className="mt-1 opacity-90">Update title, schedule, and location.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {saved && (
              <div className="flex items-center rounded-lg border border-green-200 bg-green-50 p-4 font-medium text-green-700">
                <FiCheck className="mr-2 flex-shrink-0 text-green-600" />
                Saved. Returning to dashboard…
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="Title" className="mb-2 block font-medium text-gray-700">
                Title
              </label>
              <input
                id="Title"
                name="Title"
                type="text"
                required
                value={form.Title}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="Date" className="mb-2 block font-medium text-gray-700">
                  Date
                </label>
                <div className="relative">
                  <FiCalendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-700" />
                  <input
                    id="Date"
                    name="Date"
                    type="date"
                    required
                    value={form.Date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-4 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="Time" className="mb-2 block font-medium text-gray-700">
                  Time
                </label>
                <input
                  id="Time"
                  name="Time"
                  type="time"
                  required
                  value={form.Time}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="LocationID" className="mb-2 flex items-center gap-2 font-medium text-gray-700">
                <FiMapPin className="text-indigo-700" />
                Location
              </label>
              <select
                id="LocationID"
                name="LocationID"
                required
                value={form.LocationID}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20"
              >
                <option value="">Select location…</option>
                {locations.map((loc) => (
                  <option key={loc.LocationID} value={String(loc.LocationID)}>
                    {loc.Name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-green-800 px-6 py-3 font-semibold text-slate-900 transition hover:bg-green-900 disabled:opacity-50"
              >
                <FiCheck className="mr-2" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/events/dashboard')}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditEvents
