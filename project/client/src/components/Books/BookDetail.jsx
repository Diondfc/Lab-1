import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiBookmark, FiCheckCircle, FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { LuBookUp2 } from "react-icons/lu";
import { getAdjacentBooks, getBookById } from "./libraryBooks.jsx";
import RatingForm from "../Rating/RatingForm.jsx";
import { apiClient } from "../../lib/api";
import { isStaffRole } from "../../lib/roles";

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2";

const outlineBtn = `inline-flex items-center rounded-lg border border-indigo-700 dark:border-indigo-500 px-5 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-400 transition hover:bg-indigo-700/10 dark:hover:bg-indigo-500/20 ${linkFocus}`;

const gradientBtn = `inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-600 to-green-800 px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white shadow-sm transition hover:opacity-95 ${linkFocus}`;

function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(() => getBookById(id));
  const [reservationQueue, setReservationQueue] = useState([]);
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [isReserving, setIsReserving] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const canRateBook = currentUser && !isStaffRole(currentUser.role);
  const canReserveBook = currentUser && !isStaffRole(currentUser.role) && book?.status !== "available";
  const { prev, next } = book ? getAdjacentBooks(id) : {};

  useEffect(() => {
    const staticBook = getBookById(id);
    setBook(staticBook);

    const fetchLiveBook = async () => {
      try {
        const response = await apiClient.get(`/api/books/book/${id}`);
        if (response.data) {
          setBook(prev => ({
            ...prev,
            status: response.data.AvailabilityStatus === 'Available' && Number(response.data.Quantity) > 0
              ? 'available'
              : 'unavailable'
          }));
        }
      } catch (err) {
        console.error('Error fetching live book details:', err);
      }
    };
    fetchLiveBook();
  }, [id]);

  useEffect(() => {
    async function fetchReservationQueue() {
      if (!currentUser || book?.status === "available") {
        setReservationQueue([]);
        return;
      }

      try {
        const response = await apiClient.get(`/api/reservations/book/${id}`);
        setReservationQueue(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching reservation queue:', err);
      }
    }

    fetchReservationQueue();
  }, [book?.status, currentUser, id]);

  const reserveBook = async () => {
    if (!currentUser) return;
    try {
      setIsReserving(true);
      setReservationMessage("");
      setReservationError("");
      const response = await apiClient.post('/api/reservations', { bookId: Number(id) });
      setReservationMessage(response.data?.message || 'Book reserved successfully.');
      const queueResponse = await apiClient.get(`/api/reservations/book/${id}`);
      setReservationQueue(Array.isArray(queueResponse.data) ? queueResponse.data : []);
    } catch (err) {
      setReservationError(err.response?.data?.message || 'Could not reserve this book.');
    } finally {
      setIsReserving(false);
    }
  };

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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 transition-colors duration-300">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-600 to-green-800" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book not found</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 transition-colors duration-300">
      <div className="container mx-auto max-w-5xl px-4">
        <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/home" className={`rounded-sm hover:text-indigo-700 ${linkFocus}`}>
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to="/books" className={`rounded-sm hover:text-indigo-700 dark:hover:text-indigo-400 ${linkFocus}`}>
                Library
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="line-clamp-1 font-medium text-gray-800 dark:text-gray-200">{book.title}</li>
          </ol>
        </nav>

        <Link
          to="/books"
          className={`mb-8 inline-flex items-center rounded-lg border border-indigo-700 dark:border-indigo-500 px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-400 transition hover:bg-indigo-700/10 dark:hover:bg-indigo-500/20 ${linkFocus}`}
        >
          <FiArrowLeft className="mr-2" aria-hidden />
          Back to library
        </Link>

        <article className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300">
          <div className="h-2 bg-gradient-to-r from-indigo-600 to-green-800" />

          <div className="grid gap-10 p-8 md:grid-cols-[minmax(0,300px)_1fr] md:p-12">
            <div className="relative flex min-h-[280px] items-center justify-center rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 p-8">
              <div className="absolute h-32 w-32 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
              <img
                src={book.img}
                alt={book.title}
                decoding="async"
                className="relative z-10 max-h-80 w-full object-contain drop-shadow-md"
              />
              <div className="absolute right-4 top-4 z-20 flex items-center rounded-full bg-white/95 dark:bg-slate-700/95 px-2.5 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm">
                <FiStar className="mr-1.5 text-yellow-400" aria-hidden />
                <span>{book.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="mb-3 inline-flex w-fit rounded-full border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                {book.status === "available" ? "Available" : "Unavailable"}
              </span>

              <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white md:text-3xl">{book.title}</h1>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400">By {book.author}</p>

              <dl className="mt-8 grid gap-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Author</dt>
                  <dd className="mt-0.5 text-gray-900 dark:text-gray-200">{book.author}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Rating</dt>
                  <dd className="mt-0.5 text-gray-900 dark:text-gray-200">{book.rating.toFixed(1)} / 5</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="mt-0.5 text-gray-900 dark:text-gray-200">
                    {book.status === "available" ? "On shelf" : "Unavailable"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Catalog ID</dt>
                  <dd className="mt-0.5 font-mono text-gray-900 dark:text-gray-200">{book.id}</dd>
                </div>
              </dl>

              <section className="mt-8" aria-labelledby="summary-heading">
                <h2 id="summary-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
                  Overview
                </h2>
                <p className="mt-3 leading-relaxed text-gray-700 dark:text-gray-300">{book.summary}</p>
                <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  This volume is part of the UBT Library physical collection. Ask staff for loan periods,
                  renewals, and the latest availability.
                </p>
              </section>

              <div className="mt-10 flex flex-wrap gap-3">
                {book.status === "available" && (
                  <Link
                    to="/loan-book"
                    state={{ bookId: book.id, bookTitle: book.title }}
                    className={gradientBtn}
                  >
                    <LuBookUp2 className="mr-2" aria-hidden />
                    Loan This Book
                  </Link>
                )}
                {canReserveBook && (
                  <button
                    type="button"
                    onClick={reserveBook}
                    disabled={isReserving}
                    className={gradientBtn}
                  >
                    <FiBookmark className="mr-2" aria-hidden />
                    {isReserving ? 'Reserving...' : 'Reserve / Hold Book'}
                  </button>
                )}
                <Link to="/books" className={outlineBtn}>
                  Browse more books
                </Link>
                <Link to="/home" className={outlineBtn}>
                  Back to home
                </Link>
              </div>

              {reservationMessage && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <FiCheckCircle className="mt-0.5 shrink-0" />
                  {reservationMessage}
                </div>
              )}

              {reservationError && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                  {reservationError}
                </div>
              )}

              {canReserveBook && reservationQueue.length > 0 && (
                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/50">
                  <p className="font-semibold text-gray-900 dark:text-white">Current hold queue</p>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {reservationQueue.length} user{reservationQueue.length === 1 ? '' : 's'} waiting for this book.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {reservationQueue.slice(0, 3).map((item) => (
                      <li key={item.ReservationID} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-800">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          #{item.QueuePosition} {Number(item.UserID) === Number(currentUser.id) ? 'You' : item.UserName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.ReservedAt ? new Date(item.ReservedAt).toLocaleDateString() : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(prev || next) && (
                <nav
                  className="mt-12 flex flex-col gap-3 border-t border-gray-100 dark:border-slate-700 pt-8 sm:flex-row sm:justify-between"
                  aria-label="Adjacent books"
                >
                  {prev ? (
                    <Link
                      to={`/books/${prev.id}`}
                      className={`flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 transition hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 ${linkFocus}`}
                    >
                      <FiChevronLeft className="shrink-0 text-indigo-700 dark:text-indigo-400" aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">Previous</span>
                        <span className="line-clamp-1">{prev.title}</span>
                      </span>
                    </Link>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <Link
                      to={`/books/${next.id}`}
                      className={`flex items-center justify-end gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 transition hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 sm:text-right ${linkFocus}`}
                    >
                      <span className="min-w-0 sm:order-1">
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">Next</span>
                        <span className="line-clamp-1">{next.title}</span>
                      </span>
                      <FiChevronRight className="shrink-0 text-indigo-700 dark:text-indigo-400 sm:order-2" aria-hidden />
                    </Link>
                  ) : null}
                </nav>
              )}

              {canRateBook && (
                <section className="mt-12 border-t border-gray-100 dark:border-slate-700 pt-8" aria-labelledby="rating-form-heading">
                  <h2 id="rating-form-heading" className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Leave Your Rating
                  </h2>
                  <RatingForm 
                    book_id={book.id} 
                    user_id={currentUser.id} 
                    onRatingSubmitted={() => {}} 
                  />
                </section>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export default BookDetail;
