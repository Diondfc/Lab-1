import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules';
import { motion } from 'framer-motion';
import { FiStar, FiArrowRight, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { cn } from '../../lib/utils';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const FeaturedCarousel = ({ books = [] }) => {
  const navigate = useNavigate();

  // We want at least 5-6 slides for the coverflow effect to look good. 
  // If we don't have enough, we'll duplicate the array.
  const displayBooks = books.length < 6 ? [...books, ...books] : books;

  if (!displayBooks || displayBooks.length === 0) {
    return null; // or a loading skeleton
  }

    const getStatusConfig = (status) => {
      switch (status?.toLowerCase()) {
        case 'available':
          return { color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: <FiCheckCircle className="w-3 h-3" />, text: 'Available' };
        case 'on-loan':
        case 'unavailable':
        case 'borrowed':
          return { color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: <FiClock className="w-3 h-3" />, text: 'Unavailable' };
        case 'reserved':
          return { color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: <FiAlertCircle className="w-3 h-3" />, text: 'Reserved' };
        default:
          return { color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: <FiCheckCircle className="w-3 h-3" />, text: 'Available' };
      }
    };

  return (
    <div className="w-full relative py-12 px-4 group">
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        loop={true}
        slidesPerView={'auto'}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false, // We use our own soft shadows
        }}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
        className="w-full !pb-16"
      >
        {displayBooks.map((book, index) => {
          const statusConfig = getStatusConfig(book.status);
          
          return (
            <SwiperSlide key={`${book.id}-${index}`} className="!w-[280px] sm:!w-[340px] md:!w-[400px]">
              {({ isActive }) => (
                <motion.div
                  initial={false}
                  animate={{ 
                    scale: isActive ? 1 : 0.9,
                    opacity: isActive ? 1 : 0.6,
                    y: isActive ? 0 : 20
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "relative h-[500px] rounded-3xl overflow-hidden flex flex-col transition-all duration-300",
                    "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl",
                    isActive ? "shadow-indigo-900/40 ring-1 ring-indigo-500/30" : "shadow-slate-200/50"
                  )}
                >
                  {/* Image Section */}
                  <div className="relative h-[280px] w-full bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center overflow-hidden">
                    {/* Inner glowing effect for active slide */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                    )}
                    
                    <motion.img 
                      src={book.img || book.image} 
                      alt={book.title} 
                      className="relative z-0 h-full w-auto object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
                      animate={{ 
                        y: isActive ? [0, -8, 0] : 0,
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 4, 
                        ease: "easeInOut" 
                      }}
                      loading="lazy"
                    />

                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-700 shadow-lg">
                      <FiStar className="text-amber-400 fill-amber-400 w-3.5 h-3.5" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{book.rating?.toFixed(1) || "4.5"}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 z-20">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          {book.category || book.genre || 'Book'}
                        </span>
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", statusConfig.color)}>
                          {statusConfig.icon}
                          {statusConfig.text}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-indigo-400 dark:group-hover:text-indigo-300 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mb-3">
                        {book.author}
                      </p>
                      
                      {/* Only show summary on active slide on larger screens, otherwise hide to save space */}
                      <div className="h-10">
                        <p className={cn(
                          "text-xs text-slate-400 leading-relaxed line-clamp-2 transition-all duration-300",
                          isActive ? "opacity-100" : "opacity-0"
                        )}>
                          {book.summary || "Explore this amazing title in our premium collection."}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => navigate(`/books/${book.id}`)}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300",
                          isActive 
                            ? "bg-indigo-600 text-slate-900 dark:text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-500 hover:shadow-indigo-900/50 hover:-translate-y-0.5" 
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-zinc-700 hover:text-slate-900 dark:hover:bg-slate-600 dark:hover:text-white"
                        )}
                      >
                        {statusConfig.text === 'Available' ? 'Borrow Now' : 'View Details'}
                        <FiArrowRight className={cn("w-4 h-4 transition-transform", isActive && "group-hover:translate-x-1")} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-4 right-4 justify-between z-10 pointer-events-none">
        <button className="swiper-button-prev-custom pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/50 hover:bg-indigo-600 backdrop-blur-md border border-slate-200 text-white transition-all duration-300 hover:scale-110 shadow-xl opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0">
          <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
        <button className="swiper-button-next-custom pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/50 hover:bg-indigo-600 backdrop-blur-md border border-slate-200 text-white transition-all duration-300 hover:scale-110 shadow-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      {/* Override some Swiper styles for the dark theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .swiper-pagination-bullet {
          background-color: #52525b !important;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          background-color: #10b981 !important;
          opacity: 1;
        }
      `}} />
    </div>
  );
};

export default FeaturedCarousel;
