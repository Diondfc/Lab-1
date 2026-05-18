import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCalendar, FiEdit, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { apiClient } from '../lib/api'

const emptyForm = {
  Title: '',
  Date: '',
  Time: '',
  LocationID: '',
}

const EventsDashboard = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setError('')
      const [{ data: ev }, { data: loc }] = await Promise.all([
        apiClient.get('/api/events'),
        apiClient.get('/api/locations'),
      ])
      setEvents(Array.isArray(ev) ? ev : [])
      setLocations(Array.isArray(loc) ? loc : [])
    } catch (e) {
      console.error(e)
      setError('Could not load events or locations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const formatEventDate = (dateValue) => {
    if (!dateValue) return '—'
    const d = new Date(dateValue)
    return Number.isNaN(d.getTime())
      ? String(dateValue)
      : d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
  }

  const formatEventTime = (timeValue) => {
    if (!timeValue) return '—'
    const [h, m] = String(timeValue).split(':')
    const date = new Date()
    date.setHours(Number(h), Number(m), 0, 0)
    if (Number.isNaN(date.getTime())) return String(timeValue)
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const openAdd = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const lid = Number(form.LocationID)
    if (!form.Title?.trim() || !form.Date || !form.Time || !lid) {
      setError('Title, date, time, and location are required.')
      return
    }
    try {
      setSaving(true)
      setError('')
      await apiClient.post('/api/events', {
        Title: form.Title.trim(),
        Date: form.Date,
        Time: form.Time,
        LocationID: lid,
      })
      setModalOpen(false)
      setForm(emptyForm)
      await load()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Could not create event.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try {
      setError('')
      await apiClient.delete(`/api/events/${id}`)
      await load()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Could not delete event.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 rounded-lg bg-gradient-to-r from-indigo-600 to-green-800 p-6 text-slate-900 dark:text-white shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">Staff</p>
              <h1 className="text-3xl font-bold">Events dashboard</h1>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 px-5 py-2.5 font-semibold text-indigo-700 dark:text-indigo-400 transition hover:bg-indigo-50 dark:hover:bg-slate-700"
            >
              <FiPlus className="mr-2" />
              Add event
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md">
          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4 text-sm font-semibold text-gray-600 dark:text-gray-400 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <span>Event</span>
            <span>Date</span>
            <span>Location</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading events…</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-500">No events yet. Add one to get started.</div>
          ) : (
            events.map((event) => (
              <div
                key={event.EventID}
                className="grid grid-cols-1 gap-4 border-b border-gray-100 dark:border-slate-700 p-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center"
              >
                <div className="flex items-start">
                  <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-700/10 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                    <FiCalendar />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">{event.Title}</h2>
                    <span className="mt-1 inline-block text-xs text-gray-500 dark:text-gray-400">
                      {formatEventTime(event.Time)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{formatEventDate(event.Date)}</p>
                <p className="text-gray-600 dark:text-gray-400">{event.Location || '—'}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/events/edit/${event.EventID}`)}
                    className="inline-flex items-center rounded-lg border border-indigo-700 dark:border-indigo-500 px-3 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-400 transition hover:bg-indigo-700/10 dark:hover:bg-indigo-500/20"
                  >
                    <FiEdit className="mr-1.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(event.EventID)}
                    className="inline-flex items-center rounded-lg border border-red-200 dark:border-red-800/50 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <FiTrash2 className="mr-1.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-slate-900/80 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-slate-800 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New event</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                aria-label="Close"
              >
                <FiX size={22} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  required
                  value={form.Title}
                  onChange={(e) => setForm((f) => ({ ...f, Title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-700 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 dark:focus:ring-indigo-500/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <input
                    required
                    type="date"
                    value={form.Date}
                    onChange={(e) => setForm((f) => ({ ...f, Date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-700 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 dark:focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                  <input
                    required
                    type="time"
                    value={form.Time}
                    onChange={(e) => setForm((f) => ({ ...f, Time: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-700 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 dark:focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <select
                  required
                  value={form.LocationID}
                  onChange={(e) => setForm((f) => ({ ...f, LocationID: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2 focus:border-indigo-700 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 dark:focus:ring-indigo-500/20"
                >
                  <option value="">Select…</option>
                  {locations.map((loc) => (
                    <option key={loc.LocationID} value={String(loc.LocationID)}>
                      {loc.Name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-700 dark:bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 dark:hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventsDashboard
