import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowRight,
  FiSearch,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiBook,
  FiFilter,
} from 'react-icons/fi'
import { getBooksByCategory } from './libraryBooks.js'

const GENRE_OPTIONS = ['All', 'Romance', 'Fiction', 'Mystery', 'History']

const BookListNovel = () => {
  const allNovels = useMemo(() => getBooksByCategory('novel'), [])
  const [subcategory, setSubcategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const booksPerPage = 8
  const navigate = useNavigate()

  const books = useMemo(() => {
    if (subcategory === 'All') return allNovels
    return allNovels.filter((b) => b.genre === subcategory)
  }, [allNovels, subcategory])

  const filteredBooks = useMemo(
    () =>
      books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [books, searchTerm]
  )

  const indexOfLastBook = currentPage * booksPerPage
  const indexOfFirstBook = indexOfLastBook - booksPerPage
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook)
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage) || 1

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-br from-[#3FA34D] to-[#A3D8B3] text-white">
        <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">Novel Collection</h1>
          <p className="mb-8 max-w-2xl text-xl opacity-90">
            Explore our diverse collection of literary works and fiction
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#3FA34D]">Novels</h2>
            <p className="text-gray-600">{filteredBooks.length} novels available in our collection</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm">
                <FiFilter className="text-gray-600" />
                <select
                  id="subcategory"
                  value={subcategory}
                  onChange={(e) => {
                    setSubcategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="appearance-none bg-transparent text-gray-700 focus:outline-none"
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g === 'All' ? 'All Genres' : g}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="text-gray-600" />
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search novels..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-12 w-full rounded-lg border border-gray-300 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3FA34D]"
              />
            </div>
          </div>
        </div>

        {currentBooks.length > 0 ? (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentBooks.map((book) => {
                const available = book.status === 'available'
                return (
                  <div
                    key={book.id}
                    className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative flex h-60 items-center justify-center bg-gray-50 p-4">
                      <img
                        className="h-full object-contain"
                        src={book.img}
                        alt=""
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/64x80?text=No+Cover'
                        }}
                      />
                      <div className="absolute right-3 top-3 flex items-center rounded-full bg-white/90 px-2 py-1 text-sm shadow-sm">
                        <FiStar className="mr-1 text-yellow-400" />
                        {book.rating.toFixed(1)}
                      </div>
                      {book.genre ? (
                        <div className="absolute bottom-3 left-3 rounded bg-[#3FA34D] px-2 py-1 text-xs text-white">
                          {book.genre}
                        </div>
                      ) : null}
                    </div>
                    <div className="p-6">
                      <h3 className="mb-1 line-clamp-2 text-lg font-bold">{book.title}</h3>
                      <p className="mb-2 text-sm text-gray-600">By {book.author}</p>
                      <p className="mb-4 line-clamp-3 text-xs text-gray-500">{book.summary}</p>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => navigate(`/books/${book.id}`)}
                          className="flex items-center text-sm font-medium text-[#3FA34D] hover:text-[#2E7D32] hover:underline"
                        >
                          View Details <FiArrowRight className="ml-1" />
                        </button>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {available ? 'Available' : 'On loan'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      type="button"
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`flex h-10 w-10 items-center justify-center rounded-md ${
                        currentPage === i + 1
                          ? 'bg-[#3FA34D] text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiChevronRight />
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-gray-100 bg-white py-12 text-center shadow-sm">
            <FiBook className="mx-auto mb-3 text-4xl text-gray-300" />
            <h3 className="text-lg font-medium text-gray-500">No novels found</h3>
            <p className="mt-1 text-gray-400">
              {searchTerm || subcategory !== 'All'
                ? "Try adjusting your search or filter to find what you're looking for."
                : 'There are currently no novels in the collection.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookListNovel
