import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiBell, FiCheckCircle, FiClock, FiRefreshCw, FiSearch, FiXCircle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusClasses(status) {
  if (status === 'Fulfilled') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50'
  return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50'
}

export default function ReservationQueueDashboard() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadQueue() {
    try {
      setLoading(true)
      setError('')
      const { data } = await apiClient.get('/api/reservations')
      setReservations(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load reservations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  async function updateStatus(reservationId, status) {
    try {
      setSavingId(reservationId)
      setMessage('')
      setError('')
      await apiClient.patch(`/api/reservations/${reservationId}/status`, { status })
      await loadQueue()
      setMessage(status === 'Fulfilled' ? 'Reservation marked ready and user notified.' : 'Reservation updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update reservation.')
    } finally {
      setSavingId(null)
    }
  }

  const filteredReservations = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return reservations
    return reservations.filter((item) =>
      [item.BookTitle, item.UserName, item.UserEmail, item.Status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }, [reservations, search])

  const activeCount = reservations.filter((item) => item.Status === 'Active').length
  const readyCount = reservations.filter((item) => item.Status === 'Fulfilled').length

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-slate-900 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
        >
          <FiArrowLeft />
          Back to Admin Panel
        </button>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FiBell />
              Holds
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Reservation Queue</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              See who is waiting for books that were on loan and mark the next reservation as ready when the book returns.
            </p>
          </div>

          <button
            type="button"
            onClick={loadQueue}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active holds</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-300">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Ready/notified</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{readyCount}</p>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <FiSearch className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by book, user, email, or status"
            className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading reservations...</div>
          ) : filteredReservations.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No reservations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 dark:divide-slate-700">
                <thead className="bg-zinc-50 dark:bg-slate-900/60">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Book</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">User</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Queue</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-slate-700">
                  {filteredReservations.map((item) => (
                    <tr key={item.ReservationID} className="hover:bg-zinc-50 dark:hover:bg-slate-900/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{item.BookTitle}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Book ID: {item.BookID}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{item.UserName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.UserEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          <FiClock />
                          #{item.QueuePosition}
                        </p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.ReservedAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(item.Status)}`}>
                          {item.Status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.Status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(item.ReservationID, 'Fulfilled')}
                              disabled={savingId === item.ReservationID}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                            >
                              <FiCheckCircle />
                              Ready
                            </button>
                          )}
                          {item.Status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(item.ReservationID, 'Cancelled')}
                              disabled={savingId === item.ReservationID}
                              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                            >
                              <FiXCircle />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
