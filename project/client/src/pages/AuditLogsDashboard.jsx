import { useEffect, useMemo, useState } from 'react'
import { FiActivity, FiArrowLeft, FiClock, FiDatabase, FiRefreshCw, FiSearch, FiUser } from 'react-icons/fi'
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

function actionClasses(action) {
  if (action.includes('delete') || action.includes('deactivate')) {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50'
  }
  if (action.includes('create') || action.includes('assign') || action.includes('activate')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
  }
  return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50'
}

export default function AuditLogsDashboard() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  async function loadLogs() {
    try {
      setLoading(true)
      setError('')
      const { data } = await apiClient.get('/api/audit-logs?limit=200')
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return logs
    return logs.filter((log) =>
      [
        log.Action,
        log.EntityType,
        log.EntityID,
        log.Description,
        log.ActorEmail,
        log.ActorRole,
        log.CreatedAt,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }, [logs, search])

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
              <FiActivity />
              Audit Trail
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Track important actions such as book changes, role changes, account status updates, and loan creation.
            </p>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <FiSearch className="shrink-0 text-slate-400" />
          <input
            id="audit-log-search"
            name="auditLogSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by actor, action, entity, or description"
            className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No audit logs found.</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-slate-700">
              {filteredLogs.map((log) => (
                <div key={log.AuditLogID} className="grid gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-slate-900/40 md:grid-cols-[1.2fr_1fr_160px]">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${actionClasses(log.Action)}`}>
                        {log.Action}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <FiDatabase />
                        {log.EntityType}{log.EntityID ? ` #${log.EntityID}` : ''}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white">{log.Description}</p>
                    {log.Details && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {JSON.stringify(log.Details)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                      <FiUser />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {log.ActorEmail || 'System / unknown'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {log.ActorRole || '-'} {log.ActorUserID ? `- User #${log.ActorUserID}` : ''}
                      </p>
                      {log.IpAddress && (
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{log.IpAddress}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    <FiClock className="text-indigo-500" />
                    {formatDate(log.CreatedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
