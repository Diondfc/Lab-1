import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBook, FiUsers, FiClock, FiArrowRight, FiCalendar, FiAward, FiStar, FiBookmark } from 'react-icons/fi';
import Journals from '../images/TheCivilWar.png';
import Academic from '../images/Sedgewick.png';
import WhiteNights from '../images/WhiteNights.png.webp';
import StudentReading from '../images/WhiteNights.png.webp';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.full_name || user?.name;

  const bookCategories = [
    { id: 'journals', name: 'Journals', icon: <FiBook className="text-[#FD7F2F]" />, count: 1245 },
    { id: 'academic', name: 'Academic', icon: <FiBook className="text-[#2E7AD2]" />, count: 876 },
    { id: 'novels', name: 'Novels', icon: <FiBook className="text-[#3FA34D]" />, count: 532 }
  ];

  const featuredBooks = [
    { id: 1, title: "White Nights", author: "Fyodor Dostoevsky", image: WhiteNights, available: true, rating: 4.8 },
    { id: 2, title: "Computer Science: An Interdisciplinary Approach", author: "Robert Sedgewick", image: Academic, available: true, rating: 4.5 },
    { id: 3, title: "Research Journal", author: "The Civil War Diary of Emma Mordecai", image: Journals, available: false, rating: 4.2 }
  ];

  const libraryStats = [
    { value: "50,000+", label: "Books Collection", icon: <FiBook className="text-3xl" /> },
    { value: "24/7", label: "Digital Access", icon: <FiClock className="text-3xl" /> },
    { value: "100+", label: "Study Spaces", icon: <FiUsers className="text-3xl" /> },
    { value: "Free", label: "WiFi Access", icon: <FiAward className="text-3xl" /> }
  ];

  const upcomingEvents = [
    { id: 1, title: "Author Meet & Greet", date: "May 15, 2025", time: "3:00 PM", location: "Lagja Kalabria" },
    { id: 2, title: "Reading Workshop", date: "May 22, 2025", time: "10:00 AM", location: "Conference Room" },
    { id: 3, title: "Book Fair", date: "June 5-10, 2025", time: "All Day", location: "Dukagjini Residence" }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="font-poppins bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-700 to-green-900 text-white">
        <div className="container mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {userName ? `Hello, ${userName}, ` : ''}
              Explore UBT's <br />Physical Book Collection
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Search, discover, and connect with our library resources
            </p>

            <div className="relative max-w-xl">
              <form onSubmit={handleSearch}>
                <div className="flex bg-white rounded-xl overflow-hidden shadow-lg">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow h-14 px-6 focus:outline-none text-gray-800"
                    placeholder="Find books by title, author..."
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  />
                  <button
                    type="submit"
                    className="bg-green-800 hover:bg-green-900 text-white px-6 flex items-center transition"
                  >
                    <FiSearch className="mr-2" /> Search
                  </button>
                </div>
              </form>

              {searchOpen && (
                <div className="absolute bg-white border border-gray-200 rounded-lg w-full mt-2 z-50 shadow-xl">
                  {bookCategories.map(category => (
                    <div
                      key={category.id}
                      onClick={() => {
                        navigate(`/${category.id}`);
                        setSearchOpen(false);
                      }}
                      className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      {category.icon}
                      <span className="ml-3 text-gray-800">{category.name}</span>
                      <span className="ml-auto text-gray-500 text-sm">{category.count} titles</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {libraryStats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-center">
              <div className="text-emerald-700 mb-3 flex justify-center">
                {stat.icon}
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Categories */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Browse Collections</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-emerald-600 to-green-800 mx-auto"></div>
            <p className="text-gray-600 max-w-2xl mx-auto mt-4">
              Explore our diverse range of book collections
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {bookCategories.map(category => (
              <div
                key={category.id}
                onClick={() => navigate(`/${category.id}`)}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center"
              >
                <div className="bg-gray-100 p-3 rounded-full mr-4">
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{category.name}</h3>
                  <p className="text-gray-600 text-sm">{category.count} titles available</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Books */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold">Featured Books</h2>
              <p className="text-gray-600">Popular titles among our readers</p>
            </div>
            <button
              onClick={() => navigate('/books')}
              className="text-[#036280] hover:underline flex items-center"
            >
              View all <FiArrowRight className="ml-1" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredBooks.map(book => (
              <div key={book.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition hover:-translate-y-1">
                <div className="h-48 bg-gray-100 flex items-center justify-center p-4 relative">
                  <img src={book.image} alt={book.title} className="h-full object-contain" />
                  <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full flex items-center text-sm">
                    <FiStar className="text-yellow-500 mr-1" />
                    {book.rating}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-1">{book.title}</h3>
                  <p className="text-gray-600 mb-4">By {book.author}</p>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => navigate(`/books/${book.id}`)}
                      className="text-[#036280] hover:underline flex items-center text-sm"
                    >
                      Details <FiArrowRight className="ml-1" />
                    </button>
                    <span className={`text-xs px-3 py-1 rounded-full ${book.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {book.available ? 'Available' : 'Checked Out'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Upcoming Events */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#036280] to-[#233B7D] mx-auto"></div>
            <p className="text-gray-600 max-w-2xl mx-auto mt-4">
              Join our community events and enhance your reading experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center mb-4">
                  <div className="bg-[#036280]/10 p-3 rounded-lg mr-4">
                    <FiCalendar className="text-[#036280] text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{event.title}</h3>
                    <p className="text-gray-600 text-sm">{event.date}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex text-sm">
                    <span className="text-gray-500 w-20">Time:</span>
                    <span>{event.time}</span>
                  </div>
                  <div className="flex text-sm">
                    <span className="text-gray-500 w-20">Location:</span>
                    <span>{event.location}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/events')}
                  className="mt-4 text-[#036280] hover:underline flex items-center text-sm"
                >
                  Learn more <FiArrowRight className="ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center bg-gradient-to-br from-emerald-700 to-green-900 text-white rounded-xl overflow-hidden shadow-xl">
            <div className="md:w-1/2 p-8 md:p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">What Our Readers Say</h2>
              <div className="mb-6">
                <p className="italic mb-4">
                  "The UBT library has been an invaluable resource for my research. The collection is extensive and the staff is incredibly helpful."
                </p>
                <p className="font-medium">- Sarah Johnson, PhD Candidate</p>
              </div>
              <button
                onClick={() => navigate('/testimonials')}
                className="border border-white text-white hover:bg-white hover:text-[#036280] px-6 py-2 rounded-lg transition"
              >
                Read More Testimonials
              </button>
            </div>
            <div className="md:w-1/2">
              <img
                src={StudentReading}
                alt="Student reading"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Library Hours */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-10">
              <h2 className="text-3xl font-bold mb-4">Library Hours</h2>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Monday - Friday</span>
                  <span>8:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-2">New Arrivals</h3>
                <p className="mb-4">
                  Check out our newest additions to the collection updated weekly.
                </p>
                <button
                  onClick={() => navigate('/new-arrivals')}
                  className="flex items-center text-[#036280] hover:underline"
                >
                  <FiBookmark className="mr-2" /> View New Arrivals
                </button>
              </div>
            </div>
            <div className="md:w-1/2 bg-gray-50 p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4">Need Help?</h3>
              <p className="mb-4">
                Our librarians are available to assist you with finding resources and using library services.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/about')}
                  className="w-full bg-green-800 hover:bg-green-900 text-white px-6 py-3 rounded-lg transition"
                >
                  Contact Us
                </button>
                <button
                  onClick={() => navigate('/about')}
                  className="w-full border border-emerald-700 text-emerald-700 hover:bg-emerald-700/10px-6 py-3 rounded-lg transition"
                >
                  FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
