import { useEffect, useMemo, useState } from 'react'
import { FiClock, FiRefreshCw, FiShield, FiUser } from 'react-icons/fi'
import { apiClient } from '../lib/api.js'

function formatDate(value) {
  if (!value) return 'Present'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function durationLabel(start, end) {
  if (!start) return 'Unknown'

  const startDate = new Date(start)
  const endDate = end ? new Date(end) : new Date()
  const days = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)))

  if (days === 0) return 'Less than 1 day'
  if (days === 1) return '1 day'
  return `${days} days`
}

export default function RoleHistoryDashboard() {
  const currentUser = useMemo(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  }, [])

  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || '')
  const [history, setHistory] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true)
        const { data } = await apiClient.get('/api/users')
        const list = Array.isArray(data) ? data : []
        setUsers(list)
        if (!selectedUserId && list[0]?.id) {
          setSelectedUserId(list[0].id)
        }
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Could not load users.')
      } finally {
        setLoadingUsers(false)
      }
    }

    loadUsers()
  }, [selectedUserId])

  useEffect(() => {
    if (!selectedUserId) return
    loadRoleHistory(selectedUserId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId])

  async function loadRoleHistory(userId) {
    try {
      setLoadingHistory(true)
      setError('')
      const { data } = await apiClient.get(`/api/users/${userId}/role-history`)
      setHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      setHistory([])
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not load role history.')
    } finally {
      setLoadingHistory(false)
    }
  }

  const selectedUser = users.find((user) => Number(user.id) === Number(selectedUserId))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-slate-900 px-4 py-10 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FiShield />
              Role Access
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Role History</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Track when a member was a client, when they became Manager or Admin, and when each role period ended.
            </p>
          </div>

          <button
            type="button"
            onClick={() => selectedUserId && loadRoleHistory(selectedUserId)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            disabled={!selectedUserId || loadingHistory}
          >
            <FiRefreshCw className={loadingHistory ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Select user
          </label>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              disabled={loadingUsers}
            >
              {!users.length && <option value={selectedUserId}>{selectedUserId ? `User ID ${selectedUserId}` : 'No users loaded'}</option>}
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.name || user.email} - {user.role}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              placeholder="User ID"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white md:w-36"
            />
          </div>
        </div>

        {selectedUser && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FiUser />
            </div>
            <div>
              <p className="font-bold">{selectedUser.full_name || selectedUser.name || selectedUser.email}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email} - Current role: {selectedUser.role}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loadingHistory ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading role history...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No role history found for this user.</div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.RoleHistoryID}
                  className="grid gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 md:grid-cols-[160px_1fr_160px]"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Role</p>
                    <p className="mt-1 text-lg font-bold text-indigo-600 dark:text-indigo-300">{item.Role}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">From</p>
                      <p className="mt-1 font-medium">{formatDate(item.StartedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Until</p>
                      <p className="mt-1 font-medium">{formatDate(item.EndedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <FiClock className="text-indigo-500" />
                    {durationLabel(item.StartedAt, item.EndedAt)}
                  </div>
                  {item.ChangedByName && (
                    <p className="md:col-span-3 text-xs text-slate-500 dark:text-slate-400">
                      Changed by {item.ChangedByName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
