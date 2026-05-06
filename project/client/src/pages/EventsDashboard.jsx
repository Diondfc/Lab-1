import React from 'react';
import { FiCalendar, FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';

const events = [
  {
    id: 1,
    title: 'Author Meet & Greet',
    date: 'May 15, 2026',
    location: 'UBT Library Hall',
    status: 'Upcoming'
  },
  {
    id: 2,
    title: 'Reading Workshop',
    date: 'May 22, 2026',
    location: 'Conference Room',
    status: 'Planning'
  },
  {
    id: 3,
    title: 'Book Fair',
    date: 'June 5, 2026',
    location: 'Dukagjini Residence',
    status: 'Upcoming'
  }
];

const EventsDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 rounded-lg bg-gradient-to-r from-emerald-600 to-green-800 p-6 text-white shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">Admin</p>
              <h1 className="text-3xl font-bold">Events Dashboard</h1>
            </div>
            <button className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-50">
              <FiPlus className="mr-2" />
              Add Event
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md">
          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 bg-gray-50 p-4 text-sm font-semibold text-gray-600 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <span>Event</span>
            <span>Date</span>
            <span>Location</span>
            <span>Actions</span>
          </div>

          {events.map((event) => (
            <div
              key={event.id}
              className="grid grid-cols-1 gap-4 border-b border-gray-100 p-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center"
            >
              <div className="flex items-start">
                <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-700/10 text-emerald-700">
                  <FiCalendar />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{event.title}</h2>
                  <span className="mt-1 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {event.status}
                  </span>
                </div>
              </div>
              <p className="text-gray-600">{event.date}</p>
              <p className="text-gray-600">{event.location}</p>
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex items-center rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-700/10">
                  <FiEdit className="mr-1.5" />
                  Edit
                </button>
                <button className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                  <FiTrash2 className="mr-1.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsDashboard;
