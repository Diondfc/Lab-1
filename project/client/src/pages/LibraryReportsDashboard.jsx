import { useEffect, useState } from 'react'
import { FiBarChart2, FiBookOpen, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi'
import { apiClient } from '../lib/api.js'

const initialFilters = {
  title: '',
  author: '',
  category: '',
  isbn: '',
}

export default function LibraryReportsDashboard() {
  const [filters, setFilters] = useState(initialFilters)
  const [searchResults, setSearchResults] = useState([])
  const [reports, setReports] = useState({ mostReadBooks: [], activeMembers: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadReports() {
    try {
      setLoading(true)
      setError('')
      const { data } = await apiClient.get('/api/books/reports')
      setReports({
        mostReadBooks: Array.isArray(data.mostReadBooks) ? data.mostReadBooks : [],
        activeMembers: Array.isArray(data.activeMembers) ? data.activeMembers : [],
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }

  async function searchBooks(event) {
    event.preventDefault()
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim())
      })
      const { data } = await apiClient.get(`/api/books/search?${params.toString()}`)
      setSearchResults(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not search books.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-slate-900 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            <FiBarChart2 />
            Reports
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Library Reports</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Search books by title, author, category and ISBN, then review most-read books and active members.
          </p>
        </div>

        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        <form onSubmit={searchBooks} className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <FiSearch />
            Advanced Book Search
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {[
              ['title', 'Title'],
              ['author', 'Author'],
              ['isbn', 'ISBN'],
            ].map(([key, label]) => (
              <input
                key={key}
                value={filters[key]}
                onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={label}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
              />
            ))}
            <select
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Any category</option>
              <option value="Academic">Academic</option>
              <option value="Journal">Journal</option>
              <option value="Novel">Novel</option>
            </select>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500">
              <FiSearch />
              Search
            </button>
          </div>
        </form>

        <div className="mb-8 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-zinc-100 px-5 py-4 font-bold dark:border-slate-700">Search Results</div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 dark:divide-slate-700">
              <thead className="bg-zinc-50 dark:bg-slate-900/60">
                <tr>
                  {['Title', 'Author', 'Category', 'ISBN', 'Status', 'Loans'].map((column) => (
                    <th key={column} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-slate-700">
                {searchResults.map((book) => (
                  <tr key={book.id}>
                    <td className="px-5 py-3 text-sm font-semibold">{book.title}</td>
                    <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{book.author}</td>
                    <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{book.category}</td>
                    <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{book.isbn}</td>
                    <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{book.availabilityStatus}</td>
                    <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{book.loanCount ?? '-'}</td>
                  </tr>
                ))}
                {searchResults.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-sm text-slate-500">Use the filters above to search the catalog.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Report Tables</h2>
          <button type="button" onClick={loadReports} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh reports
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReportTable
            icon={<FiBookOpen />}
            title="Most Read Books"
            rows={reports.mostReadBooks}
            columns={[
              ['title', 'Book'],
              ['author', 'Author'],
              ['loanCount', 'Loans'],
            ]}
          />
          <ReportTable
            icon={<FiUsers />}
            title="Active Members"
            rows={reports.activeMembers}
            columns={[
              ['name', 'Member'],
              ['email', 'Email'],
              ['loanCount', 'Loans'],
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function ReportTable({ icon, title, rows, columns }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 font-bold dark:border-slate-700">
        {icon}
        {title}
      </div>
      <table className="min-w-full divide-y divide-zinc-100 dark:divide-slate-700">
        <thead className="bg-zinc-50 dark:bg-slate-900/60">
          <tr>
            {columns.map(([, label]) => (
              <th key={label} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-slate-700">
          {rows.map((row) => (
            <tr key={`${title}-${row.id}`}>
              {columns.map(([key]) => (
                <td key={key} className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{row[key] ?? '-'}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500">No data found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
