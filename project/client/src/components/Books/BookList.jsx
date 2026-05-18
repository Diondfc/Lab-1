import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiStar, FiArrowRight, FiSearch, FiFilter } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { books } from "./libraryBooks.jsx";
import { cn } from "../../lib/utils";

const BookList = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || book.status === filter;
    return matchesSearch && matchesFilter;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-slate-900 py-24 transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100/50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 mb-6"
          >
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">UBT Library</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight"
          >
            Our Collection
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-slate-400"
          >
            Explore our comprehensive collection of resources, journals, and academic literature.
          </motion.p>
        </header>

        {/* Search and Filter Bar */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-lg shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-slate-700 transition-colors duration-300">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search books, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-slate-900 dark:text-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar">
            {["all", "available", "on loan"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap capitalize",
                  filter === status 
                    ? "bg-indigo-600 text-slate-900 dark:text-white shadow-md shadow-indigo-600/20" 
                    : "bg-zinc-100 text-zinc-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-zinc-200 dark:hover:bg-slate-600"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          <AnimatePresence>
            {filteredBooks.map((book) => (
              <motion.article
                variants={itemVariants}
                layout
                key={book.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1"
              >
                <Link
                  to={`/books/${book.id}`}
                  className="relative flex h-72 items-center justify-center overflow-hidden bg-zinc-50 dark:bg-slate-900 p-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img
                    src={book.img}
                    alt={book.title}
                    className="relative z-10 h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute right-4 top-4 z-20 flex items-center rounded-full bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 text-sm font-bold text-zinc-700 dark:text-white shadow-sm backdrop-blur-md">
                    <FiStar className="mr-1.5 text-amber-400 fill-amber-400" />
                    <span>{book.rating.toFixed(1)}</span>
                  </div>
                </Link>

                <div className="flex flex-grow flex-col p-6">
                  <div className="flex-grow">
                    <h2 className="mb-1 line-clamp-2 text-xl font-bold leading-tight text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <Link to={`/books/${book.id}`}>{book.title}</Link>
                    </h2>
                    <p className="line-clamp-1 text-sm font-medium text-slate-400 mb-4">{book.author}</p>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">{book.summary}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-slate-700">
                    <Link
                      to={`/books/${book.id}`}
                      className="group/link flex items-center text-sm font-semibold text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Details
                      <FiArrowRight className="ml-1.5 transform transition-transform group-hover/link:translate-x-1" />
                    </Link>
                    <span className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                      book.status === "available" 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" 
                        : "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                    )}>
                      {book.status === "available" ? "Available" : "Checked Out"}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredBooks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-slate-800 mb-4">
              <FiSearch className="text-2xl text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No books found</h3>
            <p className="text-slate-400">We couldn't find any books matching your current search or filters.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BookList;
