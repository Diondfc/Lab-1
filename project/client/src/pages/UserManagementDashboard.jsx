import { useEffect, useState } from 'react'
import { FiMinusCircle, FiPlusCircle, FiRefreshCw, FiSlash, FiUserCheck, FiUsers } from 'react-icons/fi'
import { apiClient } from '../lib/api.js'

const AVAILABLE_ROLES = ['Admin', 'Manager', 'User/Member']

function statusClasses(status) {
  return status === 'Inactive'
    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
}

export default function UserManagementDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [roleSavingKey, setRoleSavingKey] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadUsers() {
    try {
      setLoading(true)
      setError('')
      const { data } = await apiClient.get('/api/users')
      const list = Array.isArray(data) ? data : []
      const usersWithRoles = await Promise.all(
        list.map(async (user) => {
          try {
            const rolesResponse = await apiClient.get(`/api/users/${user.id}/roles`)
            return { ...user, roles: Array.isArray(rolesResponse.data) ? rolesResponse.data : [] }
          } catch {
            return { ...user, roles: [] }
          }
        }),
      )
      setUsers(usersWithRoles)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function setUserStatus(user, nextAction) {
    try {
      setSavingId(user.id)
      setMessage('')
      setError('')
      const { data } = await apiClient.patch(`/api/users/${user.id}/${nextAction}`)
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, ...data.user } : item)),
      )
      setMessage(data.message || 'User status updated.')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not update user status.')
    } finally {
      setSavingId(null)
    }
  }

  async function assignRole(user, role) {
    const key = `${user.id}:${role}:assign`
    try {
      setRoleSavingKey(key)
      setMessage('')
      setError('')
      const { data } = await apiClient.post(`/api/users/${user.id}/roles`, { role })
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, ...data.user, roles: data.roles || item.roles } : item,
        ),
      )
      setMessage(data.message || 'Role assigned.')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not assign role.')
    } finally {
      setRoleSavingKey('')
    }
  }

  async function removeRole(user, role) {
    const key = `${user.id}:${role}:remove`
    try {
      setRoleSavingKey(key)
      setMessage('')
      setError('')
      const { data } = await apiClient.delete(`/api/users/${user.id}/roles/${encodeURIComponent(role)}`)
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, ...data.user, roles: data.roles || item.roles } : item,
        ),
      )
      setMessage(data.message || 'Role removed.')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not remove role.')
    } finally {
      setRoleSavingKey('')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-slate-900 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FiUsers />
              Accounts
            </div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Activate or deactivate accounts without deleting user records, loans, ratings, or role history.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
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

        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 dark:divide-slate-700">
                <thead className="bg-zinc-50 dark:bg-slate-900/60">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">User</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Roles</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-slate-700">
                  {users.map((user) => {
                    const isInactive = user.status === 'Inactive'
                    return (
                      <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-slate-900/40">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{user.full_name || user.name || 'Unnamed user'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-[260px] flex-wrap gap-2">
                            {AVAILABLE_ROLES.map((role) => {
                              const hasRole = (user.roles || []).some((item) => item.Role === role && !item.RemovedAt) || user.role === role
                              const key = `${user.id}:${role}:${hasRole ? 'remove' : 'assign'}`
                              return (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => (hasRole ? removeRole(user, role) : assignRole(user, role))}
                                  disabled={roleSavingKey === key}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition disabled:opacity-60 ${
                                    hasRole
                                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300'
                                      : 'border-zinc-200 bg-white text-slate-500 hover:bg-zinc-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                  }`}
                                >
                                  {hasRole ? <FiMinusCircle /> : <FiPlusCircle />}
                                  {roleSavingKey === key ? 'Saving...' : role}
                                </button>
                              )
                            })}
                          </div>
                          <p className="mt-2 text-xs text-slate-400">Current primary role: {user.role}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(user.status)}`}>
                            {user.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setUserStatus(user, isInactive ? 'activate' : 'deactivate')}
                            disabled={savingId === user.id}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                              isInactive
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-rose-600 text-white hover:bg-rose-500'
                            }`}
                          >
                            {isInactive ? <FiUserCheck /> : <FiSlash />}
                            {savingId === user.id ? 'Saving...' : isInactive ? 'Activate' : 'Deactivate'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
