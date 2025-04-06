import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';
import SportsCarousel from '../components/SportsCarousel';

const HomePage = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="home-page">
      {/* Sports Carousel Section */}
      <SportsCarousel />

      {/* Featured Events Section */}
      <section className="featured-events">
        <div className="section-header">
          <h2>Featured Events</h2>
          <Link to="/events" className="view-all">
            View All Events
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
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
            {featuredEvents.length > 0 ? (
              featuredEvents.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="no-events">
                <p>No events found. Be the first to create one!</p>
                <Link to="/events/create" className="btn btn-primary mt-4">
                  Create an Event
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How KickMates Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon">1</div>
            <h3>Find an Event</h3>
            <p>Search for sports events near you based on your interests, location, and availability.</p>
          </div>
          <div className="step">
            <div className="step-icon">2</div>
            <h3>Join or Create</h3>
            <p>Join existing events or create your own to invite others to play with you.</p>
          </div>
          <div className="step">
            <div className="step-icon">3</div>
            <h3>Meet & Play</h3>
            <p>Connect with other players, make new friends, and enjoy your favorite sports.</p>
          </div>
        </div>
      </section>

      {/* Sports Categories Section */}
      <section className="sports-categories">
        <h2>Popular Sports</h2>
        <div className="categories-grid">
          <div className="category" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80)' }}>
            <h3>Football</h3>
          </div>
          <div className="category" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1670898839060-8b0a8902ee1e?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' }}>
            <h3>Tennis</h3>
          </div>
          <div className="category" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' }}>
            <h3>Basketball</h3>
          </div>
          <div className="category" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1562088287-bde35a1ea917?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' }}>
            <h3>Yoga</h3>
          </div>
          <div className="category" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1629901925121-8a141c2a42f4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' }}>
            <h3>Pickleball</h3>
          </div>
          <div className="category" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1620742820748-87c3f2073f3f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' }}>
            <h3>Padel</h3>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Play?</h2>
          <p>Join KickMates today and start connecting with sports enthusiasts in your area.</p>
          <Link to="/register" className="btn btn-primary">
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 