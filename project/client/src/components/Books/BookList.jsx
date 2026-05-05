import React from "react";
import { Link } from "react-router-dom";
import { FiStar, FiArrowRight } from "react-icons/fi";
import { books } from "./libraryBooks.jsx";

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

const BookList = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <header className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
            UBT Library
          </p>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Library Collection</h1>
          <div className="mx-auto mb-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-emerald-600 to-green-800" />
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Explore our comprehensive collection of computer science resources, programming guides, and
            academic literature.
          </p>
        </header>

        <div
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          role="list"
          aria-label="Books in this collection"
        >
          {books.map((book) => (
            <article
              key={book.id}
              role="listitem"
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <Link
                to={`/books/${book.id}`}
                className={`relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 p-6 ${linkFocus} rounded-t-2xl`}
                aria-label={`Open details: ${book.title}`}
              >
                <div className="absolute h-32 w-32 rounded-full bg-emerald-100 opacity-50 blur-3xl transition-opacity group-hover:opacity-70" />
                <img
                  src={book.img}
                  alt=""
                  className="relative z-10 h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                  decoding="async"
                />
                <div className="absolute right-4 top-4 z-20 flex items-center rounded-full bg-white/95 px-2.5 py-1 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
                  <FiStar className="mr-1.5 text-yellow-400" aria-hidden />
                  <span>{book.rating.toFixed(1)}</span>
                </div>
              </Link>

              <div className="flex flex-grow flex-col p-6">
                <div className="flex-grow">
                  <h2 className="mb-2 line-clamp-2 text-xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-emerald-700">
                    <Link
                      to={`/books/${book.id}`}
                      className={`rounded-sm hover:underline ${linkFocus}`}
                    >
                      {book.title}
                    </Link>
                  </h2>
                  <p className="line-clamp-2 text-sm text-gray-600">By {book.author}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500">{book.summary}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                  <Link
                    to={`/books/${book.id}`}
                    className={`group/link flex items-center rounded-md border border-emerald-700 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-700/10 ${linkFocus}`}
                  >
                    View Details
                    <FiArrowRight
                      className="ml-1.5 transform transition-transform group-hover/link:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {book.status === "available" ? "Available" : "On loan"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookList;
