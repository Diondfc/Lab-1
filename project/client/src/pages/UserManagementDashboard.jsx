import { useEffect, useState } from 'react'
import {
  FiClock,
  FiMinusCircle,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSmartphone,
  FiSlash,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi'
import { apiClient } from '../lib/api.js'

const AVAILABLE_ROLES = ['Admin', 'Manager', 'User/Member']

function statusClasses(status) {
  return status === 'Inactive'
    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
}

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

function yesNo(value) {
  return value ? 'Yes' : 'No'
}

export default function UserManagementDashboard() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [roleSavingKey, setRoleSavingKey] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [roleHistory, setRoleHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
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
      if (!selectedUserId && usersWithRoles[0]?.id) {
        setSelectedUserId(usersWithRoles[0].id)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedUserId) return
    loadRoleHistory(selectedUserId)
  }, [selectedUserId])

  async function loadRoleHistory(userId) {
    try {
      setLoadingHistory(true)
      const { data } = await apiClient.get(`/api/users/${userId}/role-history`)
      setRoleHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      setRoleHistory([])
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not load role history.')
    } finally {
      setLoadingHistory(false)
    }
  }

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
      if (Number(selectedUserId) === Number(user.id)) {
        await loadRoleHistory(user.id)
      }
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
      if (Number(selectedUserId) === Number(user.id)) {
        await loadRoleHistory(user.id)
      }
      setMessage(data.message || 'Role removed.')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not remove role.')
    } finally {
      setRoleSavingKey('')
    }
  }

  const filteredUsers = users.filter((user) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [user.full_name, user.name, user.email, user.role, user.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  })

  const selectedUser = users.find((user) => Number(user.id) === Number(selectedUserId))
  const activeUsers = users.filter((user) => user.status !== 'Inactive').length
  const inactiveUsers = users.filter((user) => user.status === 'Inactive').length
  const staffUsers = users.filter((user) => ['Admin', 'Manager'].includes(user.role)).length

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
              Manage account status, assign or remove roles, and inspect each user's role history in one place.
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

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active users</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{activeUsers}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Inactive users</p>
            <p className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-300">{inactiveUsers}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Staff accounts</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-300">{staffUsers}</p>
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
            id="user-management-search"
            name="userManagementSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, role, or status"
            className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 dark:divide-slate-700">
                <thead className="bg-zinc-50 dark:bg-slate-900/60">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">User</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Roles</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Identity</th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-slate-700">
                  {filteredUsers.map((user) => {
                    const isInactive = user.status === 'Inactive'
                    const isSelected = Number(selectedUserId) === Number(user.id)
                    return (
                      <tr
                        key={user.id}
                        className={isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : 'hover:bg-zinc-50 dark:hover:bg-slate-900/40'}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{user.full_name || user.name || 'Unnamed user'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <FiSmartphone />
                            {user.phone_number || 'No phone number'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300"
                          >
                            <FiShield />
                            View role history
                          </button>
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
                          <div className="grid min-w-[190px] gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <p>Email confirmed: <span className="font-bold text-slate-700 dark:text-slate-200">{yesNo(user.email_confirmed)}</span></p>
                            <p>Lockout enabled: <span className="font-bold text-slate-700 dark:text-slate-200">{yesNo(user.lockout_enabled)}</span></p>
                            <p>Failed logins: <span className="font-bold text-slate-700 dark:text-slate-200">{user.access_failed_count ?? 0}</span></p>
                          </div>
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

        <div className="mt-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                <FiShield />
                Role History
              </div>
              <h2 className="text-xl font-bold">
                {selectedUser ? selectedUser.full_name || selectedUser.name || selectedUser.email : 'Select a user'}
              </h2>
              {selectedUser && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedUser.email} - Current role: {selectedUser.role} - Failed logins: {selectedUser.access_failed_count ?? 0}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => selectedUserId && loadRoleHistory(selectedUserId)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
              disabled={!selectedUserId || loadingHistory}
            >
              <FiRefreshCw className={loadingHistory ? 'animate-spin' : ''} />
              Refresh history
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading role history...</div>
          ) : !selectedUserId ? (
            <div className="py-10 text-center text-sm text-slate-500">Choose a user from the table.</div>
          ) : roleHistory.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">No role history found for this user.</div>
          ) : (
            <div className="grid gap-3">
              {roleHistory.map((item) => (
                <div
                  key={item.RoleHistoryID}
                  className="grid gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 md:grid-cols-[150px_1fr_150px]"
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 md:col-span-3">
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
