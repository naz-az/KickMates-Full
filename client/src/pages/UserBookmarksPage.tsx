import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBookmarks } from '../services/api';
import EventCard from '../components/EventCard';

interface Event {
  id: number;
  title: string;
  description: string;
  sport_type: string;
  location: string;
  start_date: string;
  end_date: string;
  max_players: number;
  current_players: number;
  image_url: string;
  creator_name: string;
  creator_id: number;
}

const UserBookmarksPage = () => {
  const navigate = useNavigate();
  
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBookmarks();
  }, []);

  const fetchUserBookmarks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getUserBookmarks();
      setBookmarkedEvents(response.data.bookmarkedEvents || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setError('Failed to load your bookmarked events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-bookmarks-page max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-primary/10 to-primary-dark/10 rounded-lg p-6 mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-dark mb-2">My Bookmarks</h1>
        <p className="text-text-light max-w-2xl mx-auto">Events you've saved for later</p>
      </div>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-lg border-l-4 border-error mb-6">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="loading-spinner"></div>
              <p className="ml-4 text-text-light">Loading your bookmarked events...</p>
            </div>
          ) : bookmarkedEvents.length > 0 ? (
            <div className="events-grid">
              {bookmarkedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h3 className="text-xl font-bold mb-2">No bookmarked events found</h3>
              <p className="text-text-light mb-6">You haven't bookmarked any events yet</p>
              <button 
                onClick={() => navigate('/events')} 
                className="btn btn-primary"
              >
                Find Events to Bookmark
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center btn btn-outline mr-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Browse All Events
        </button>
        <button
          onClick={() => navigate('/profile/events')}
          className="flex items-center btn btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          My Events
        </button>
      </div>
    </div>
  );
};

export default UserBookmarksPage; 