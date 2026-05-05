import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getAdjacentBooks, getBookById } from "./libraryBooks.jsx";

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

const outlineBtn = `inline-flex items-center rounded-lg border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-700/10 ${linkFocus}`;

const gradientBtn = `inline-flex items-center rounded-lg bg-gradient-to-r from-emerald-600 to-green-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 ${linkFocus}`;

function BookDetail() {
  const { id } = useParams();
  const book = getBookById(id);
  const { prev, next } = book ? getAdjacentBooks(id) : {};

  useEffect(() => {
    if (book) {
      document.title = `${book.title} · UBT Library`;
    } else {
      document.title = "Book not found · UBT Library";
    }
  }, [book]);

  useEffect(() => {
    return () => {
      document.title = "client";
    };
  }, []);

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-600 to-green-800" />
          <h1 className="text-2xl font-bold text-gray-900">Book not found</h1>
          <p className="mt-2 text-gray-600">
            This ID is not in our sample catalog. Try another title from the library list.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/books" className={outlineBtn}>
              <FiArrowLeft className="mr-2" aria-hidden />
              Back to library
            </Link>
            <Link to="/home" className={gradientBtn}>
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto max-w-5xl px-4">
        <nav className="mb-8 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/home" className={`rounded-sm hover:text-emerald-700 ${linkFocus}`}>
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to="/books" className={`rounded-sm hover:text-emerald-700 ${linkFocus}`}>
                Library
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="line-clamp-1 font-medium text-gray-800">{book.title}</li>
          </ol>
        </nav>

        <Link
          to="/books"
          className={`mb-8 inline-flex items-center rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-700/10 ${linkFocus}`}
        >
          <FiArrowLeft className="mr-2" aria-hidden />
          Back to library
        </Link>

        <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="h-2 bg-gradient-to-r from-emerald-600 to-green-800" />

          <div className="grid gap-10 p-8 md:grid-cols-[minmax(0,300px)_1fr] md:p-12">
            <div className="relative flex min-h-[280px] items-center justify-center rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 p-8">
              <div className="absolute h-32 w-32 rounded-full bg-emerald-100 opacity-50 blur-3xl" />
              <img
                src={book.img}
                alt={book.title}
                decoding="async"
                className="relative z-10 max-h-80 w-full object-contain drop-shadow-md"
              />
              <div className="absolute right-4 top-4 z-20 flex items-center rounded-full bg-white/95 px-2.5 py-1 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
                <FiStar className="mr-1.5 text-yellow-400" aria-hidden />
                <span>{book.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="mb-3 inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {book.status === "available" ? "Available" : "On loan"}
              </span>

              <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">{book.title}</h1>
              <p className="mt-3 text-base text-gray-600">By {book.author}</p>

              <dl className="mt-8 grid gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-gray-500">Author</dt>
                  <dd className="mt-0.5 text-gray-900">{book.author}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Rating</dt>
                  <dd className="mt-0.5 text-gray-900">{book.rating.toFixed(1)} / 5</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Status</dt>
                  <dd className="mt-0.5 text-gray-900">
                    {book.status === "available" ? "On shelf" : "Checked out"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Catalog ID</dt>
                  <dd className="mt-0.5 font-mono text-gray-900">{book.id}</dd>
                </div>
              </dl>

              <section className="mt-8" aria-labelledby="summary-heading">
                <h2 id="summary-heading" className="text-lg font-semibold text-gray-900">
                  Overview
                </h2>
                <p className="mt-3 leading-relaxed text-gray-700">{book.summary}</p>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                  This volume is part of the UBT Library physical collection. Ask staff for loan periods,
                  renewals, and the latest availability.
                </p>
              </section>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/books" className={outlineBtn}>
                  Browse more books
                </Link>
                <Link to="/home" className={gradientBtn}>
                  Back to home
                </Link>
              </div>

              {(prev || next) && (
                <nav
                  className="mt-12 flex flex-col gap-3 border-t border-gray-100 pt-8 sm:flex-row sm:justify-between"
                  aria-label="Adjacent books"
                >
                  {prev ? (
                    <Link
                      to={`/books/${prev.id}`}
                      className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-emerald-300 hover:bg-emerald-50/50 ${linkFocus}`}
                    >
                      <FiChevronLeft className="shrink-0 text-emerald-700" aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-xs font-normal text-gray-500">Previous</span>
                        <span className="line-clamp-1">{prev.title}</span>
                      </span>
                    </Link>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <Link
                      to={`/books/${next.id}`}
                      className={`flex items-center justify-end gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-emerald-300 hover:bg-emerald-50/50 sm:text-right ${linkFocus}`}
                    >
                      <span className="min-w-0 sm:order-1">
                        <span className="block text-xs font-normal text-gray-500">Next</span>
                        <span className="line-clamp-1">{next.title}</span>
                      </span>
                      <FiChevronRight className="shrink-0 text-emerald-700 sm:order-2" aria-hidden />
                    </Link>
                  ) : null}
                </nav>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export default BookDetail;
