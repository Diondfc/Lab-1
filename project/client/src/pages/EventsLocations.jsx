import React from 'react';
import { FiClock, FiMapPin, FiUsers } from 'react-icons/fi';

const locations = [
  {
    id: 1,
    name: 'UBT Library Hall',
    address: 'Library Building, Floor 2',
    capacity: '120 guests',
    availability: 'Weekdays, 9:00 AM - 6:00 PM'
  },
  {
    id: 2,
    name: 'Conference Room',
    address: 'Main Campus, Block B',
    capacity: '45 guests',
    availability: 'Monday - Saturday'
  },
  {
    id: 3,
    name: 'Dukagjini Residence',
    address: 'Pristina, Kosovo',
    capacity: '200 guests',
    availability: 'By reservation'
  }
];

const EventsLocations = () => {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <header className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Event Spaces
          </p>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Events Locations</h1>
          <div className="mx-auto mb-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-emerald-600 to-green-800" />
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Explore library and campus spaces available for events, workshops, and academic activities.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {locations.map((location) => (
            <article
              key={location.id}
              className="rounded-xl border border-emerald-700/20 bg-gray-50 p-6 transition hover:bg-emerald-700/5"
            >
              <div className="mb-5 inline-flex rounded-full border border-emerald-700 p-3 text-emerald-700">
                <FiMapPin className="text-xl" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">{location.name}</h2>
              <p className="mb-5 text-gray-600">{location.address}</p>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <FiUsers className="mr-2 text-emerald-700" />
                  <span>{location.capacity}</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-2 text-emerald-700" />
                  <span>{location.availability}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsLocations;
