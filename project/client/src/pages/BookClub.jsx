import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiBook, FiCheck, FiMessageCircle, FiSend, FiTrash2, FiXCircle } from 'react-icons/fi'
import { apiClient } from '../lib/api'
import { isStaffRole } from '../lib/roles'

const ROOMS = [
  { id: 'journals', label: 'Journals' },
  { id: 'academic', label: 'Academic' },
  { id: 'novels', label: 'Novels' },
  { id: 'general', label: 'General' },
]

function displayName() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return 'Reader'
    const u = JSON.parse(raw)
    return u.full_name || u.name || u.email || 'Reader'
  } catch {
    return 'Reader'
  }
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function BookClub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const roomFromUrl = searchParams.get('room')
  const activeRoom = useMemo(() => {
    const r = (roomFromUrl || 'general').toLowerCase()
    return ROOMS.some((x) => x.id === r) ? r : 'general'
  }, [roomFromUrl])

  const [messages, setMessages] = useState([])
  const [requests, setRequests] = useState([])
  const [msgText, setMsgText] = useState('')
  const [reqTitle, setReqTitle] = useState('')
  const [reqAuthor, setReqAuthor] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const currentUser = useMemo(() => getStoredUser(), [])
  const userId = currentUser?.id ?? null
  const canModerateRequests = isStaffRole(currentUser?.role)

  const setRoom = (id) => {
    setSearchParams(id === 'general' ? {} : { room: id })
  }

  const loadRoomData = useCallback(async () => {
    try {
      setError('')
      const [msgRes, reqRes] = await Promise.all([
        apiClient.get(`/api/messages/room/${encodeURIComponent(activeRoom)}`),
        apiClient.get(`/api/requests/room/${encodeURIComponent(activeRoom)}`),
      ])
      setMessages(Array.isArray(msgRes.data) ? msgRes.data : [])
      setRequests(Array.isArray(reqRes.data) ? reqRes.data : [])
    } catch (e) {
      console.error(e)
      setError('Could not load book club data.')
    } finally {
      setLoading(false)
    }
  }, [activeRoom])

  useEffect(() => {
    setLoading(true)
    loadRoomData()
  }, [loadRoomData])

  useEffect(() => {
    const id = setInterval(loadRoomData, 10000)
    return () => clearInterval(id)
  }, [loadRoomData])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!token || !msgText.trim()) return
    try {
      setSending(true)
      await apiClient.post('/api/messages', {
        room: activeRoom,
        username: displayName(),
        message: msgText.trim(),
      })
      setMsgText('')
      await loadRoomData()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const sendRequest = async (e) => {
    e.preventDefault()
    if (!token || !reqTitle.trim()) return
    try {
      setSending(true)
      await apiClient.post('/api/requests', {
        room: activeRoom,
        username: displayName(),
        book_title: reqTitle.trim(),
        book_author: reqAuthor.trim() || undefined,
      })
      setReqTitle('')
      setReqAuthor('')
      await loadRoomData()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to submit request.')
    } finally {
      setSending(false)
    }
  }

  const deleteMessage = async (id) => {
    if (!token || !window.confirm('Delete this message?')) return
    try {
      await apiClient.delete(`/api/messages/${id}`)
      await loadRoomData()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Could not delete message.')
    }
  }

  const deleteRequest = async (id) => {
    if (!token || !window.confirm('Remove this request?')) return
    try {
      await apiClient.delete(`/api/requests/${id}`)
      await loadRoomData()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Could not delete request.')
    }
  }

  const updateRequestStatus = async (id, status) => {
    if (!token || !canModerateRequests) return
    try {
      await apiClient.patch(`/api/requests/${id}/status`, { status })
      await loadRoomData()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Could not update request status.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 transition-colors duration-300">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-l-4 border-indigo-600 pl-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Book club</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Chat by room and request titles for the library to consider.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoom(r.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeRoom === r.id
                  ? 'bg-indigo-700 dark:bg-indigo-600 text-white shadow'
                  : 'bg-white dark:bg-slate-800 text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-800 dark:text-red-300">
            {error}
          </p>
        )}

        {!token && (
          <p className="mb-6 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-300">
            <Link to="/login" className="font-semibold underline">
              Sign in
            </Link>{' '}
            to post messages and book requests.
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <FiMessageCircle className="text-indigo-600 dark:text-indigo-400" />
              Messages
            </h2>
            {loading ? (
              <p className="text-slate-500 dark:text-slate-400">Loading…</p>
            ) : (
              <ul className="mb-4 max-h-80 space-y-3 overflow-y-auto pr-1 text-sm">
                {messages.length === 0 && (
                  <li className="text-slate-500 dark:text-slate-400">No messages yet in this room.</li>
                )}
                {messages.map((m) => {
                  const mid = m.id
                  const mine = userId != null && Number(m.userId) === Number(userId)
                  return (
                    <li
                      key={mid}
                      className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{m.username}</p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{m.message}</p>
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {m.timestamp
                              ? new Date(m.timestamp).toLocaleString()
                              : ''}
                          </p>
                        </div>
                        {mine && token && (
                          <button
                            type="button"
                            onClick={() => deleteMessage(mid)}
                            className="shrink-0 rounded p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <form onSubmit={sendMessage} className="space-y-2">
              <textarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder={token ? 'Write a message…' : 'Sign in to chat'}
                disabled={!token || sending}
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/20 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
              <button
                type="submit"
                disabled={!token || sending || !msgText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 dark:bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 dark:hover:bg-indigo-500 disabled:opacity-50"
              >
                <FiSend />
                Send
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <FiBook className="text-indigo-600 dark:text-indigo-400" />
              Book requests
            </h2>
            {loading ? (
              <p className="text-slate-500 dark:text-slate-400">Loading…</p>
            ) : (
              <ul className="mb-4 max-h-56 space-y-2 overflow-y-auto text-sm">
                {requests.length === 0 && (
                  <li className="text-slate-500 dark:text-slate-400">No requests in this room yet.</li>
                )}
                {requests.map((r) => {
                  const rid = r.id
                  const mine = userId != null && Number(r.user_id) === Number(userId)
                  return (
                    <li
                      key={rid}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 px-3 py-2"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{r.book_title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            r.Status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : r.Status === 'Rejected'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                          >
                            {r.Status || 'Pending'}
                          </span>
                        </div>
                        {r.book_author && (
                          <p className="text-slate-600 dark:text-slate-400">by {r.book_author}</p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {r.username} ·{' '}
                          {r.created_at
                            ? new Date(r.created_at).toLocaleString()
                            : ''}
                        </p>
                      </div>
                      {mine && token && (
                        <button
                          type="button"
                          onClick={() => deleteRequest(rid)}
                          className="shrink-0 rounded p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Remove"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                      {canModerateRequests && token && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => updateRequestStatus(rid, 'Approved')}
                            className="rounded p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                            title="Approve"
                          >
                            <FiCheck />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRequestStatus(rid, 'Rejected')}
                            className="rounded p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Reject"
                          >
                            <FiXCircle />
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <form onSubmit={sendRequest} className="space-y-2">
              <input
                type="text"
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="Book title"
                disabled={!token || sending}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/20 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
              <input
                type="text"
                value={reqAuthor}
                onChange={(e) => setReqAuthor(e.target.value)}
                placeholder="Author (optional)"
                disabled={!token || sending}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 text-sm focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/20 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
              <button
                type="submit"
                disabled={!token || sending || !reqTitle.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 dark:bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 dark:hover:bg-indigo-500 disabled:opacity-50"
              >
                <FiBook />
                Request book
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
