import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';
import SportsCarousel from '../components/SportsCarousel';
import { ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Refs for scroll animations
  const featuredRef = useRef(null);
  const howItWorksRef = useRef(null);
  const categoriesRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Parallax effects
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  
  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await getEvents({ limit: 4 });
        setFeaturedEvents(res.data.events);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/events?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="home-page pb-0 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <motion.div 
          className="absolute top-0 left-0 w-full h-[120%] bg-gradient-to-b from-white via-primary/5 to-white opacity-70"
          style={{ y: backgroundY }}
        />
        <div className="particle particle-1 bg-primary/20"></div>
        <div className="particle particle-2 bg-secondary/30"></div>
        <div className="particle particle-3 bg-accent/20"></div>
      </div>

      {/* Hero Search Section */}
      <motion.section 
        className="hero-search mb-12 pt-8 pb-12 px-4 md:px-8 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 shadow-inner relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto text-center space-y-6 z-10 relative">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Find Your Perfect <span className="text-primary">Sports Match</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Connect with local sports enthusiasts, join events, and make new friends through the joy of sports.
          </motion.p>
          
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-0 max-w-xl mx-auto">
              <div className="relative flex-grow">
                <MagnifyingGlassIcon className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for events, sports, or locations..."
                  className="w-full pl-12 pr-4 py-4 rounded-lg sm:rounded-r-none bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-sm text-gray-700"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white font-medium py-4 px-8 rounded-lg sm:rounded-l-none transform transition-transform hover:scale-105 active:scale-95 shadow-md"
              >
                Search
              </button>
            </form>
          </motion.div>
          
          <motion.div 
            className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <span className="text-gray-500">Popular:</span>
            <Link to="/events?sport_type=Football" className="text-primary hover:text-primary-dark hover:underline">Football</Link>
            <Link to="/events?sport_type=Basketball" className="text-primary hover:text-primary-dark hover:underline">Basketball</Link>
            <Link to="/events?sport_type=Tennis" className="text-primary hover:text-primary-dark hover:underline">Tennis</Link>
            <Link to="/events?sport_type=Yoga" className="text-primary hover:text-primary-dark hover:underline">Yoga</Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Sports Carousel Section */}
      <SportsCarousel />

      {/* Featured Events Section */}
      <motion.section 
        className="featured-events py-16 px-4 md:px-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white mb-16 relative overflow-hidden"
        ref={featuredRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-secondary/5 blur-3xl"></div>
        
        <div className="section-header">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Featured Events
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/events" className="view-all group flex items-center font-medium">
              View All Events
              <ArrowRightIcon className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="events-grid">
            <AnimatePresence>
              {featuredEvents.length > 0 ? (
                featuredEvents.map((event: {
                  id: number;
                  title: string;
                  location: string;
                  description?: string;
                  sport_type: string;
                  start_date: string;
                  end_date: string;
                  max_players: number;
                  current_players: number;
                  creator_id: number;
                  creator_name: string;
                }, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="no-events col-span-full text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-lg text-gray-600 mb-4">No events found. Be the first to create one!</p>
                  <Link to="/events/create" className="btn btn-primary mt-4 inline-flex items-center group">
                    Create an Event
                    <ArrowRightIcon className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        className="how-it-works py-16 px-4 md:px-8 rounded-3xl bg-gray-900 text-white mb-16 relative overflow-hidden"
        ref={howItWorksRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-900/90"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.h2 
            className="text-center text-3xl md:text-4xl font-bold mb-14 text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How KickMates Works
          </motion.h2>
          
          <div className="steps">
            {[
              {
                number: "1",
                title: "Find an Event",
                description: "Search for sports events near you based on your interests, location, and availability.",
                icon: "🔍",
                delay: 0.2
              },
              {
                number: "2",
                title: "Join or Create",
                description: "Join existing events or create your own to invite others to play with you.",
                icon: "✅",
                delay: 0.3
              },
              {
                number: "3",
                title: "Meet & Play",
                description: "Connect with other players, make new friends, and enjoy your favorite sports.",
                icon: "🎯",
                delay: 0.4
              }
            ].map((step, index) => (
              <motion.div 
                key={index} 
                className="step"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: step.delay }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              >
                <div className="step-icon w-16 h-16 bg-gradient-to-br from-primary to-primary-dark">{step.icon}</div>
                <h3 className="text-xl font-bold mt-6 mb-2">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link to="/events" className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors group">
              Explore All Events
              <ArrowRightIcon className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Sports Categories Section */}
      <motion.section 
        className="sports-categories py-16 px-4 md:px-8 rounded-3xl bg-gradient-to-br from-white to-gray-50 mb-16 relative overflow-hidden"
        ref={categoriesRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-secondary/5 blur-3xl"></div>
        
        <motion.h2 
          className="text-center text-3xl md:text-4xl font-bold mb-14 text-gray-900"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Popular Sports
        </motion.h2>
        
        <div className="categories-grid">
          {[
            { name: "Football", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80", delay: 0.1 },
            { name: "Tennis", image: "https://images.unsplash.com/photo-1670898839060-8b0a8902ee1e?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", delay: 0.2 },
            { name: "Basketball", image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", delay: 0.3 },
            { name: "Yoga", image: "https://images.unsplash.com/photo-1562088287-bde35a1ea917?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", delay: 0.4 },
            { name: "Pickleball", image: "https://images.unsplash.com/photo-1629901925121-8a141c2a42f4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", delay: 0.5 },
            { name: "Padel", image: "https://images.unsplash.com/photo-1620742820748-87c3f2073f3f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", delay: 0.6 },
            { name: "Running", image: "https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", delay: 0.7 },
            { name: "Swimming", image: "https://images.unsplash.com/photo-1622629797619-c100e3e67e2e?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", delay: 0.8 },
          ].map((sport, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: sport.delay }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            >
              <Link to={`/events?sport_type=${sport.name}`} className="category" style={{ backgroundImage: `url(${sport.image})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 transition-opacity duration-300 hover:opacity-80"></div>
                <h3 className="bottom-4 left-4 text-white text-xl font-bold">{sport.name}</h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="cta-section py-20 px-6 md:px-12 mb-0 rounded-none"
        ref={ctaRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="cta-content">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Ready to Play?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl max-w-2xl mx-auto"
          >
            Join KickMates today and start connecting with sports enthusiasts in your area.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register" className="btn btn-primary text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform transition-all hover:scale-105 active:scale-95">
              Sign Up Now
            </Link>
            <Link to="/events" className="btn btn-outline text-lg py-3 px-8 rounded-full transform transition-all hover:scale-105 active:scale-95">
              Browse Events
            </Link>
          </motion.div>
        </div>
      </motion.section>
      
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="fixed bottom-6 right-6 bg-primary text-white rounded-full p-3 shadow-lg z-50 hover:bg-primary-dark transition-colors"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage; 