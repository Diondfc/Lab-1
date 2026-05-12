import React, { useEffect, useState } from 'react';
import { FiCalendar, FiMapPin } from 'react-icons/fi';
import { apiClient } from '../lib/api';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <header className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
            UBT Library
          </p>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Library Events</h1>
          <div className="mx-auto mb-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-emerald-600 to-green-800" />
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Join upcoming events, workshops, and community activities hosted by the library.
          </p>
        </header>

        {error && (
          <p className="mb-6 text-center text-red-600">{error}</p>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {loading && (
            <div className="md:col-span-3 text-center text-gray-600">
              Loading events...
            </div>
          )}

          {!loading && events.length === 0 && !error && (
            <div className="md:col-span-3 text-center text-gray-600">
              No events available right now.
            </div>
          )}

          {events.map((event) => (
            <article
              key={event.EventID}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-700/10 text-emerald-700">
                <FiCalendar className="text-2xl" />
              </div>
              <h2 className="mb-3 text-xl font-bold text-gray-900">{event.Title}</h2>
              <div className="mb-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <FiCalendar className="mr-2 text-emerald-700" />
                  <span>{formatEventDate(event.Date)}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-emerald-700" />
                  <span>{event.Location || 'TBA'}</span>
                </div>
              </div>
              <p className="leading-relaxed text-gray-600">{eventDescription(event.Title)}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
