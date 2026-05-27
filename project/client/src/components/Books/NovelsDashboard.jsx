import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { apiUrl, uploadsUrl } from '../../lib/api.js'
import { 
  FiBook, 
  FiSearch,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiArrowLeft
} from 'react-icons/fi'

const NovelsDashboard = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDescriptions, setExpandedDescriptions] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [subcategory, setSubcategory] = useState('All')
  const navigate = useNavigate()

  const fetchNovels = async (selectedSubcategory = 'All') => {
    try {
      const path =
        selectedSubcategory !== 'All'
          ? `/api/books/novels?subcategory=${encodeURIComponent(selectedSubcategory)}`
          : '/api/books/novels'
      const res = await axios.get(apiUrl(path))
      setBooks(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching novels:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load list when room filter changes
    void fetchNovels(subcategory)
  }, [subcategory])

  const toggleDescription = (bookId) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }))
  }

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const averageRating =
    books.length > 0
      ? books.reduce((sum, book) => sum + (parseFloat(book.rating) || 0), 0) /
        books.length
      : 0

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-600">
          Loading novels...
        </div>
      </div>
    )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#3FA34D] flex items-center gap-2">
            <FiBook className="text-3xl" />
            Novels Collection
          </h1>
          <p className="text-gray-500 mt-1">
            {books.length} novels available in our collection
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3FA34D] focus:border-transparent"
              placeholder="Search novels..."
            />
          </div>
          
          {/* Genre Filter */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2">
              <FiFilter className="text-gray-600" />
              <select
                id="subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="appearance-none bg-transparent text-gray-700 focus:outline-none"
              >
                <option value="All">All Genres</option>
                <option value="Romance">Romance</option>
                <option value="Fiction">Fiction</option>
                <option value="Mystery">Mystery</option>
                <option value="History">History</option>
              </select>
              <FiChevronDown className="text-gray-600" />
            </div>
          </div>
          
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-[#3FA34D] hover:text-[#368d42] transition"
          >
            <FiArrowLeft className="mr-2" />
            Back to Admin Panel
          </button>
        </div>
      </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Total Novels</div>
            <div className="text-2xl font-bold text-[#3FA34D]">{books.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Available</div>
            <div className="text-2xl font-bold text-[#3FA34D]">
              {books.filter(b => b.available === 'Available').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">Unavailable</div>
            <div className="text-2xl font-bold text-[#FD7F2F]">
              {books.filter(b => b.available !== 'Available').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Avg Rating</div>
            <div className="text-2xl font-bold text-[#2E7AD2] flex items-center">
              {averageRating.toFixed(1)} <FiStar className="ml-1 text-yellow-400 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Novels Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#3FA34D]/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Novel Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publisher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Genre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-12 relative">
                        <img
                          className="h-full w-full object-cover rounded-md shadow"
                          src={uploadsUrl(book.coverImagePath)}
                          alt={book.title}
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/64x80?text=No+Cover'
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                          {book.available === 'Available' ? (
                            <FiCheckCircle className="text-green-500 text-xs" />
                          ) : (
                            <FiXCircle className="text-red-500 text-xs" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 break-words max-w-xs">
                          {book.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <FiStar className="text-yellow-400 fill-current mr-1" />
                          {book.rating || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ISBN: {book.isbn || '—'}
                        </div>
                        {book.description && (
                          <button 
                            onClick={() => toggleDescription(book.id)}
                            className="text-xs text-[#3FA34D] hover:underline mt-1 flex items-center"
                          >
                            {expandedDescriptions[book.id] ? 'Hide description' : 'Show description'}
                            <FiChevronDown className={`ml-1 text-xs transition-transform ${expandedDescriptions[book.id] ? 'transform rotate-180' : ''}`} />
                          </button>
                        )}
                        {expandedDescriptions[book.id] && book.description && (
                          <div className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            {book.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 break-words max-w-xs">
                      {book.author || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 break-words max-w-xs">
                      {book.publisher || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {book.year || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {book.subcategory || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        book.available === 'Available'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {book.available === 'Available' ? 'Available' : 'Unavailable'}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Qty: {book.quantity ?? 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/edit/${book.id}`)}
                        className="p-2 text-[#3FA34D] hover:bg-[#3FA34D]/10 rounded-lg transition"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this novel?')) {
                            try {
                              await axios.delete(
                                apiUrl(`/api/books/delete/${book.id}`),
                              )
                              fetchNovels(subcategory)
                            } catch (err) {
                              console.error('Error deleting novel:', err)
                            }
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredBooks.length === 0 && !loading && (
        <div className="text-center py-12">
          <FiBook className="mx-auto text-4xl text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-500">No novels found</h3>
          <p className="text-gray-400 mt-1">
            {searchTerm 
              ? "Try adjusting your search or filter to find what you're looking for."
              : "There are currently no novels in the collection."}
          </p>
        </div>
      )}
    </div>
  )
}

export default NovelsDashboard
