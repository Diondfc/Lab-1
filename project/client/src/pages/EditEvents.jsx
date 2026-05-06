import React, { useState } from 'react';
import { FiCalendar, FiCheck, FiEdit3, FiMapPin } from 'react-icons/fi';

const initialEvent = {
  title: 'Author Meet & Greet',
  date: '2026-05-15',
  location: 'UBT Library Hall',
  description: 'Meet local authors and discuss the stories, research, and ideas behind their latest books.'
};

const EditEvents = () => {
  const [event, setEvent] = useState(initialEvent);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent((prevEvent) => ({
      ...prevEvent,
      [name]: value
    }));
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md">
          <div className="bg-gradient-to-r from-emerald-600 to-green-800 p-6 text-white">
            <div className="flex items-center">
              <FiEdit3 className="mr-3 text-2xl" />
              <div>
                <h1 className="text-2xl font-semibold">Edit Event</h1>
                <p className="mt-1 opacity-90">Update event details using mock data for now.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {saved && (
              <div className="flex items-center rounded-lg border border-green-200 bg-green-50 p-4 font-medium text-green-700">
                <FiCheck className="mr-2 flex-shrink-0 text-green-600" />
                Event changes saved locally.
              </div>
            )}

            <div>
              <label htmlFor="title" className="mb-2 block font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={event.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="date" className="mb-2 block font-medium text-gray-700">
                  Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" />
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={event.date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-4 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="mb-2 block font-medium text-gray-700">
                  Location
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={event.location}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-4 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="5"
                value={event.description}
                onChange={handleChange}
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900"
            >
              <FiCheck className="mr-2" />
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEvents;
