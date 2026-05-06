import React from 'react';
import { FiCalendar, FiMapPin } from 'react-icons/fi';

const events = [
  {
    id: 1,
    title: 'Author Meet & Greet',
    date: 'May 15, 2026',
    location: 'UBT Library Hall',
    description: 'Meet local authors and discuss the stories, research, and ideas behind their latest books.'
  },
  {
    id: 2,
    title: 'Reading Workshop',
    date: 'May 22, 2026',
    location: 'Conference Room',
    description: 'A practical workshop for students who want to improve reading habits and academic note-taking.'
  },
  {
    id: 3,
    title: 'Book Fair',
    date: 'June 5, 2026',
    location: 'Dukagjini Residence',
    description: 'Browse featured titles, student recommendations, and selected academic resources from the library.'
  }
];

const Events = () => {
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

        <div className="grid gap-8 md:grid-cols-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-700/10 text-emerald-700">
                <FiCalendar className="text-2xl" />
              </div>
              <h2 className="mb-3 text-xl font-bold text-gray-900">{event.title}</h2>
              <div className="mb-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <FiCalendar className="mr-2 text-emerald-700" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-emerald-700" />
                  <span>{event.location}</span>
                </div>
              </div>
              <p className="leading-relaxed text-gray-600">{event.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
