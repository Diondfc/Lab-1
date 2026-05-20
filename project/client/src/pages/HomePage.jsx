import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBook, FiUsers, FiClock, FiArrowRight, FiCalendar, FiAward, FiStar, FiBookmark } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Journals from '../images/TheCivilWar.png';
import Academic from '../images/Sedgewick.png';
import WhiteNights from '../images/WhiteNights.png.webp';
import StudentReading from '../images/WhiteNights.png.webp';
import { apiClient } from '../lib/api';
import { cn } from '../lib/utils';
import FeaturedCarousel from '../components/Books/FeaturedCarousel';
import { books as catalogBooks } from '../components/Books/libraryBooks';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.full_name || user?.name;

  const bookCategories = [
    { id: 'journals', name: 'Journals', icon: <FiBook className="text-indigo-400" />, count: 1245 },
    { id: 'academic', name: 'Academic', icon: <FiBook className="text-indigo-400" />, count: 876 },
    { id: 'novels', name: 'Novels', icon: <FiBook className="text-indigo-400" />, count: 532 }
  ];

  const featuredBooks = [
    { id: 1, title: "White Nights", author: "Fyodor Dostoevsky", image: WhiteNights, available: true, rating: 4.8 },
    { id: 2, title: "Computer Science: An Interdisciplinary Approach", author: "Robert Sedgewick", image: Academic, available: true, rating: 4.5 },
    { id: 3, title: "Research Journal", author: "The Civil War Diary of Emma Mordecai", image: Journals, available: false, rating: 4.2 }
  ];

  const libraryStats = [
    { value: "50,000+", label: "Books Collection", icon: <FiBook className="text-3xl text-indigo-400" /> },
    { value: "24/7", label: "Digital Access", icon: <FiClock className="text-3xl text-indigo-400" /> },
    { value: "100+", label: "Study Spaces", icon: <FiUsers className="text-3xl text-indigo-400" /> },
    { value: "Free", label: "WiFi Access", icon: <FiAward className="text-3xl text-indigo-400" /> }
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError('');
        const { data } = await apiClient.get('/api/events');
        setUpcomingEvents(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch (error) {
        console.error('Failed to load events:', error);
        setEventsError('Could not load events right now.');
      } finally {
        setEventsLoading(false);
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

  const formatEventTime = (timeValue) => {
    if (!timeValue) return 'TBA';
    const [hours, minutes] = String(timeValue).split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    if (Number.isNaN(date.getTime())) return timeValue;
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/books');
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="font-poppins bg-zinc-50 dark:bg-slate-900 min-h-screen pb-20 pt-0 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative z-20 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-b-[3rem] shadow-2xl pb-10 transition-colors duration-300">
        <div className="absolute inset-0 z-0 rounded-b-[3rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-950/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/40 transition-colors duration-300" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 pt-8 pb-24 md:pt-12 md:pb-32 relative z-10 flex flex-col md:flex-row items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="md:w-2/3 mx-auto text-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-8 backdrop-blur-md transition-colors duration-300">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Welcome to the future of learning</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
              {userName ? `Hello, ${userName}.` : 'Discover.'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">
                Expand your mind.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
              Explore our premium collection of academic resources, journals, and literature tailored for the UBT community.
            </motion.p>

            <motion.div variants={fadeIn} className="relative max-w-2xl mx-auto">
              <form onSubmit={handleSearch}>
                <div className="flex bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all focus-within:border-indigo-500/50 focus-within:shadow-[0_8px_30px_rgba(16,185,129,0.15)]">
                  <div className="pl-6 flex items-center justify-center">
                    <FiSearch className="text-slate-500 dark:text-slate-400 h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow h-16 px-4 bg-transparent focus:outline-none text-slate-900 dark:text-slate-100 placeholder-zinc-500 dark:placeholder-zinc-400"
                    placeholder="Find books, authors, or ISBN..."
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  />
                  <div className="p-2">
                    <button
                      type="submit"
                      className="h-full bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-8 rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/20"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {searchOpen && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl mt-3 z-50 shadow-2xl overflow-y-auto max-h-64 backdrop-blur-xl transition-colors duration-300"
                >
                  {bookCategories.map(category => (
                    <div
                      key={category.id}
                      onClick={() => {
                         navigate(`/${category.id}`);
                         setSearchOpen(false);
                      }}
                      className="p-4 hover:bg-slate-100 cursor-pointer flex items-center transition-colors border-b border-slate-200 last:border-0"
                    >
                      <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg mr-4 shadow-inner">
                        {category.icon}
                      </div>
                      <span className="text-zinc-900 dark:text-zinc-200 font-medium">{category.name}</span>
                      <span className="ml-auto text-slate-400 text-sm bg-slate-50 dark:bg-slate-700/50 px-3 py-1 rounded-full">{category.count} titles</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 mt-24 md:mt-32 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {libraryStats.map((stat, index) => (
            <motion.div 
              variants={fadeIn}
              key={index} 
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-white dark:border-slate-700 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="bg-indigo-50 dark:bg-indigo-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{stat.value}</h3>
              <p className="text-slate-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Featured Books / Carousel Showcase */}
      <div className="py-24 w-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8 relative z-10">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Trending Now</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Premium collection captivating our readers.</p>
            </div>
            <button
              onClick={() => navigate('/books')}
              className="hidden md:flex text-indigo-500 hover:text-indigo-400 font-semibold items-center group transition-colors"
            >
              Explore collection <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        
        {/* New Swiper Carousel */}
        <FeaturedCarousel books={catalogBooks} />
      </div>

      {/* Upcoming Events */}
      <div className="py-24 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-3xl mx-4 shadow-2xl relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none"></div>
        <div className="container mx-auto px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Engage with our community. Join seminars, book readings, and research workshops.
            </p>
          </div>

          {eventsError && (
            <p className="text-center text-rose-400 mb-6 bg-rose-500/10 py-3 rounded-lg border border-rose-500/20">{eventsError}</p>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {eventsLoading && (
              <div className="md:col-span-3 text-center text-slate-400 py-10">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading events...
              </div>
            )}

            {!eventsLoading && upcomingEvents.length === 0 && !eventsError && (
              <div className="md:col-span-3 text-center text-slate-400 py-10">
                No upcoming events available at the moment.
              </div>
            )}

            {upcomingEvents.map((event, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={event.EventID} 
                className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 dark:border-slate-600 hover:border-indigo-500/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="bg-indigo-500/10 p-4 rounded-2xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-900 transition-colors">
                    <FiCalendar className="text-2xl" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{formatEventDate(event.Date).split(' ')[1]}</div>
                    <div className="text-sm text-indigo-400 font-medium uppercase">{formatEventDate(event.Date).split(' ')[0]}</div>
                  </div>
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-4 line-clamp-2">{event.Title}</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-slate-500 text-sm">
                    <FiClock className="mr-3 text-slate-400" />
                    <span>{formatEventTime(event.Time)}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm">
                    <FiBookmark className="mr-3 text-slate-400" />
                    <span>{event.Location || 'TBA'}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/events')}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 font-medium hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-colors"
                >
                  Reserve Seat
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
