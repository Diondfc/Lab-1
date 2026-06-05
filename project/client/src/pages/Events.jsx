import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiCheck, FiMapPin, FiUsers } from 'react-icons/fi';
import { apiClient } from '../lib/api';

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservationMessages, setReservationMessages] = useState({});
  const [reservationErrors, setReservationErrors] = useState({});
  const [savingEventId, setSavingEventId] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await apiClient.get('/api/events');
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Could not load events right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatEventDate = (dateValue) => {
    if (!dateValue) return 'TBA';
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return dateValue;
    return parsedDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const eventDescription = (title) =>
    `Join us for ${title || 'this event'} hosted by the UBT Library community.`;

  const updateEventReservation = (eventId, status, seatsRemaining) => {
    setEvents((current) =>
      current.map((event) => {
        if (Number(event.EventID) !== Number(eventId)) return event;
        const nextReservedSeats =
          status === 'Reserved'
            ? Number(event.ReservedSeats || 0) + 1
            : Math.max(Number(event.ReservedSeats || 0) - 1, 0);
        return {
          ...event,
          MyReservationStatus: status,
          ReservedSeats: nextReservedSeats,
          SeatsRemaining:
            seatsRemaining != null
              ? seatsRemaining
              : Math.max(Number(event.Capacity || 0) - nextReservedSeats, 0),
        };
      }),
    );
  };

  const reserveSeat = async (eventId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setSavingEventId(eventId);
      setReservationErrors((current) => ({ ...current, [eventId]: '' }));
      const { data } = await apiClient.post(`/api/events/${eventId}/reserve`);
      setReservationMessages((current) => ({
        ...current,
        [eventId]: data?.message || 'Seat reserved successfully.',
      }));
      updateEventReservation(eventId, 'Reserved', data?.seatsRemaining);
    } catch (err) {
      setReservationErrors((current) => ({
        ...current,
        [eventId]: err.response?.data?.message || 'Could not reserve this seat.',
      }));
    } finally {
      setSavingEventId(null);
    }
  };

  const cancelReservation = async (eventId) => {
    try {
      setSavingEventId(eventId);
      setReservationErrors((current) => ({ ...current, [eventId]: '' }));
      const { data } = await apiClient.delete(`/api/events/${eventId}/reserve`);
      setReservationMessages((current) => ({
        ...current,
        [eventId]: data?.message || 'Reservation cancelled.',
      }));
      updateEventReservation(eventId, 'Cancelled');
    } catch (err) {
      setReservationErrors((current) => ({
        ...current,
        [eventId]: err.response?.data?.message || 'Could not cancel this reservation.',
      }));
    } finally {
      setSavingEventId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4">
        <header className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            UBT Library
          </p>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Library Events</h1>
          <div className="mx-auto mb-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-indigo-600 to-green-800" />
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Join upcoming events, workshops, and community activities hosted by the library.
          </p>
        </header>

        {error && (
          <p className="mb-6 text-center text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {loading && (
            <div className="md:col-span-3 text-center text-gray-600 dark:text-gray-400">
              Loading events...
            </div>
          )}

          {!loading && events.length === 0 && !error && (
            <div className="md:col-span-3 text-center text-gray-600 dark:text-gray-400">
              No events available right now.
            </div>
          )}

          {events.map((event) => (
            (() => {
              const isReserved = event.MyReservationStatus === 'Reserved';
              const seatsRemaining = Number(event.SeatsRemaining ?? event.Capacity ?? 0);
              const isFull = seatsRemaining <= 0 && !isReserved;
              const isSaving = savingEventId === event.EventID;
              return (
            <article
              key={event.EventID}
              className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-700/10 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                <FiCalendar className="text-2xl" />
              </div>
              <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{event.Title}</h2>
              <div className="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <FiCalendar className="mr-2 text-indigo-700 dark:text-indigo-400" />
                  <span>{formatEventDate(event.Date)}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-indigo-700 dark:text-indigo-400" />
                  <span>{event.Location || 'TBA'}</span>
                </div>
                <div className="flex items-center">
                  <FiUsers className="mr-2 text-indigo-700 dark:text-indigo-400" />
                  <span>
                    {isReserved
                      ? 'Your seat is reserved'
                      : `${seatsRemaining} seat${seatsRemaining === 1 ? '' : 's'} remaining`}
                  </span>
                </div>
              </div>
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">{eventDescription(event.Title)}</p>

              {reservationMessages[event.EventID] && (
                <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {reservationMessages[event.EventID]}
                </p>
              )}
              {reservationErrors[event.EventID] && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {reservationErrors[event.EventID]}
                </p>
              )}

              <button
                type="button"
                disabled={isSaving || isFull}
                onClick={() => (isReserved ? cancelReservation(event.EventID) : reserveSeat(event.EventID))}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isReserved
                    ? 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-indigo-700 text-white hover:bg-indigo-800'
                }`}
              >
                {isReserved && <FiCheck className="mr-2" />}
                {isSaving ? 'Saving...' : isReserved ? 'Cancel reservation' : isFull ? 'Fully booked' : 'Reserve a seat'}
              </button>
            </article>
              );
            })()
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
