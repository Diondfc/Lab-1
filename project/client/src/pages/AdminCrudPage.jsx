import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import { apiClient } from '../lib/api.js'

const resourceConfigs = {
  roles: {
    title: 'Roles',
    endpoint: '/api/roles',
    idKey: 'RoleID',
    searchKeys: ['Name', 'Description', 'NormalizedName'],
    fields: [
      { name: 'Name', label: 'Role name', required: true },
      { name: 'Description', label: 'Description' },
      { name: 'NormalizedName', label: 'Normalized name' },
    ],
    columns: ['RoleID', 'Name', 'Description', 'NormalizedName'],
  },
  authors: {
    title: 'Authors',
    endpoint: '/api/authors',
    idKey: 'AuthorID',
    searchKeys: ['Name', 'FirstName', 'LastName', 'Bio'],
    fields: [
      { name: 'FirstName', label: 'First name' },
      { name: 'LastName', label: 'Last name' },
      { name: 'Name', label: 'Display name', required: true },
      { name: 'Bio', label: 'Biography', type: 'textarea' },
    ],
    columns: ['AuthorID', 'Name', 'FirstName', 'LastName', 'Bio'],
  },
  categories: {
    title: 'Categories',
    endpoint: '/api/categories',
    idKey: 'CategoryID',
    searchKeys: ['CategoryName', 'Description'],
    fields: [
      { name: 'CategoryName', label: 'Category name', required: true },
      { name: 'Description', label: 'Description', type: 'textarea' },
    ],
    columns: ['CategoryID', 'CategoryName', 'Description'],
  },
  publishers: {
    title: 'Publishers',
    endpoint: '/api/publishers',
    idKey: 'PublisherID',
    searchKeys: ['Name', 'Address', 'Phone'],
    fields: [
      { name: 'Name', label: 'Publisher name', required: true },
      { name: 'Address', label: 'Address' },
      { name: 'Phone', label: 'Phone' },
    ],
    columns: ['PublisherID', 'Name', 'Address', 'Phone'],
  },
  members: {
    title: 'Members',
    endpoint: '/api/members',
    idKey: 'MemberID',
    searchKeys: ['FirstName', 'LastName', 'Email', 'Phone', 'MembershipCode', 'Status', 'AccountEmail'],
    fields: [
      { name: 'UserID', label: 'User ID', type: 'number', required: true },
      { name: 'FirstName', label: 'First name' },
      { name: 'LastName', label: 'Last name' },
      { name: 'Email', label: 'Email', type: 'email' },
      { name: 'Phone', label: 'Phone' },
      { name: 'Address', label: 'Address' },
      { name: 'JoinedAt', label: 'Membership date', type: 'date' },
      { name: 'MembershipCode', label: 'Membership code', required: true },
      { name: 'Status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
    columns: ['MemberID', 'UserID', 'FirstName', 'LastName', 'Email', 'Phone', 'MembershipCode', 'Status'],
  },
  reservations: {
    title: 'Reservations',
    endpoint: '/api/reservations',
    createEndpoint: '/api/reservations/admin',
    idKey: 'ReservationID',
    searchKeys: ['BookTitle', 'UserName', 'UserEmail', 'Status', 'BookID', 'MemberID'],
    fields: [
      { name: 'BookID', label: 'Book ID', type: 'number', required: true },
      { name: 'MemberID', label: 'Member ID', type: 'number', required: true },
      { name: 'ReservedAt', label: 'Reservation date/time', type: 'datetime-local' },
      { name: 'ExpiresAt', label: 'Expires at', type: 'datetime-local' },
      { name: 'Status', label: 'Status', type: 'select', options: ['Active', 'Fulfilled', 'Cancelled', 'Expired'] },
    ],
    columns: ['ReservationID', 'BookID', 'BookTitle', 'MemberID', 'UserEmail', 'ReservedAt', 'ExpiresAt', 'Status'],
  },
  bookreviews: {
    title: 'Book Reviews',
    endpoint: '/api/bookreviews',
    idKey: 'ReviewID',
    searchKeys: ['BookID', 'MemberID', 'Rating', 'ReviewText'],
    fields: [
      { name: 'BookID', label: 'Book ID', type: 'number', required: true },
      { name: 'MemberID', label: 'Member ID', type: 'number', required: true },
      { name: 'Rating', label: 'Rating', type: 'number', required: true, min: 1, max: 5 },
      { name: 'ReviewText', label: 'Comment', type: 'textarea' },
    ],
    columns: ['ReviewID', 'BookID', 'MemberID', 'Rating', 'ReviewText', 'created_at'],
  },
  'user-claims': {
    title: 'User Claims',
    endpoint: '/api/user-claims',
    idKey: 'UserClaimID',
    searchKeys: ['UserName', 'UserEmail', 'ClaimType', 'ClaimValue'],
    fields: [
      { name: 'UserID', label: 'User ID', type: 'number', required: true },
      { name: 'ClaimType', label: 'Claim type', required: true },
      { name: 'ClaimValue', label: 'Claim value', required: true },
    ],
    columns: ['UserClaimID', 'UserID', 'UserEmail', 'ClaimType', 'ClaimValue'],
  },
}

function emptyForm(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = field.type === 'select' ? field.options?.[0] || '' : ''
    return acc
  }, {})
}

function toInputDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function displayValue(value) {
  if (value == null || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  const text = String(value)
  return text.length > 80 ? `${text.slice(0, 77)}...` : text
}

export default function AdminCrudPage() {
  const { resource } = useParams()
  const navigate = useNavigate()
  const config = resourceConfigs[resource]
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(config ? emptyForm(config.fields) : {})
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadRows() {
    if (!config) return
    try {
      setLoading(true)
      setError('')
      const { data } = await apiClient.get(config.endpoint)
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setEditingId(null)
    if (config) setForm(emptyForm(config.fields))
    loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      config.searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
    )
  }, [config, rows, search])

  if (!config) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-10 text-slate-900 dark:bg-slate-900 dark:text-white">
        <div className="mx-auto max-w-4xl">
          <button onClick={() => navigate('/admin')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <FiArrowLeft />
            Back to Admin Panel
          </button>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">Unknown management resource.</div>
        </div>
      </div>
    )
  }

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm(config.fields))
    setMessage('')
    setError('')
  }

  function startEdit(row) {
    const next = emptyForm(config.fields)
    config.fields.forEach((field) => {
      const value = row[field.name]
      next[field.name] = field.type === 'datetime-local' ? toInputDateTime(value) : value ?? ''
    })
    setEditingId(row[config.idKey])
    setForm(next)
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveRecord(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setMessage('')
      setError('')
      const payload = {}
      config.fields.forEach((field) => {
        const value = form[field.name]
        if ((value === '' || value == null) && !field.required) {
          return
        }
        if (field.type === 'number') {
          payload[field.name] = Number(value)
        } else if (field.type === 'datetime-local') {
          payload[field.name] = String(value).replace('T', ' ')
        } else {
          payload[field.name] = value
        }
      })

      if (editingId) {
        await apiClient.put(`${config.endpoint}/${editingId}`, payload)
        setMessage('Record updated successfully.')
      } else {
        await apiClient.post(config.createEndpoint || config.endpoint, payload)
        setMessage('Record created successfully.')
      }
      startCreate()
      await loadRows()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save record.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(row) {
    if (!window.confirm('Delete this record permanently?')) return
    try {
      setMessage('')
      setError('')
      await apiClient.delete(`${config.endpoint}/${row[config.idKey]}`)
      setMessage('Record deleted successfully.')
      await loadRows()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete record.')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-slate-900 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-7xl">
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
              <FiPlus />
              Management
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage records required by the library specification.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRows}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div>}
        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        <form onSubmit={saveRecord} className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{editingId ? `Edit #${editingId}` : 'New record'}</h2>
            {editingId && (
              <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600">
                <FiX />
                Cancel edit
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {config.fields.map((field) => (
              <label key={field.name} className={field.type === 'textarea' ? 'lg:col-span-3' : ''}>
                <span className="mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {field.label}{field.required ? ' *' : ''}
                </span>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`${resource}-${field.name}`}
                    name={field.name}
                    value={form[field.name] ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    required={field.required}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={`${resource}-${field.name}`}
                    name={field.name}
                    value={form[field.name] ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    required={field.required}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input
                    id={`${resource}-${field.name}`}
                    name={field.name}
                    type={field.type || 'text'}
                    min={field.min}
                    max={field.max}
                    value={form[field.name] ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    required={field.required}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                )}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            <FiSave />
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create record'}
          </button>
        </form>

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <FiSearch className="shrink-0 text-slate-400" />
          <input
            id={`${resource}-record-search`}
            name={`${resource}RecordSearch`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records"
            className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading records...</div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 dark:divide-slate-700">
                <thead className="bg-zinc-50 dark:bg-slate-900/60">
                  <tr>
                    {config.columns.map((column) => (
                      <th key={column} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{column}</th>
                    ))}
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-slate-700">
                  {filteredRows.map((row) => (
                    <tr key={row[config.idKey]} className="hover:bg-zinc-50 dark:hover:bg-slate-900/40">
                      {config.columns.map((column) => (
                        <td key={column} className="max-w-xs px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {displayValue(row[column])}
                        </td>
                      ))}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200"
                          >
                            <FiEdit2 />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRecord(row)}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                          >
                            <FiTrash2 />
                            Delete
                          </button>
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
