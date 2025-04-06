import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserEvents } from '../services/api';
import EventCard from '../components/EventCard';
import { AuthContext } from '../context/AuthContext';

// Define Event type to match with EventCard requirements
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
  image_url?: string;
  creator_name: string;
  creator_id: number;
  status?: string;
}

const UserEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState<'created' | 'participating'>('created');
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [participatingEvents, setParticipatingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getUserEvents();
      // Filter events into created and participating events
      const allEvents = response.data.events || [];
      
      // Only proceed if user is logged in
      if (user && user.id) {
        const created = allEvents.filter((event: Event) => event.creator_id === user.id);
        const participating = allEvents.filter((event: Event) => event.creator_id !== user.id);
        
        setCreatedEvents(created);
        setParticipatingEvents(participating);
      }
    } catch (error) {
      console.error('Error fetching user events:', error);
      setError('Failed to load your events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'created' | 'participating') => {
    setActiveTab(tab);
  };

  const renderEvents = () => {
    const events = activeTab === 'created' ? createdEvents : participatingEvents;
    
    if (events.length === 0) {
      return (
        <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold mb-2">No events found</h3>
          {activeTab === 'created' ? (
            <>
              <p className="text-text-light mb-6">You haven't created any events yet</p>
              <button 
                onClick={() => navigate('/events/create')} 
                className="btn btn-primary"
              >
                Create Your First Event
              </button>
            </>
          ) : (
            <>
              <p className="text-text-light mb-6">You haven't joined any events yet</p>
              <button 
                onClick={() => navigate('/events')} 
                className="btn btn-primary"
              >
                Browse Events
              </button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="events-grid">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    );
  };

  return (
    <div className="user-events-page max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-primary/10 to-primary-dark/10 rounded-lg p-6 mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-dark mb-2">My Events</h1>
        <p className="text-text-light max-w-2xl mx-auto">View and manage your created and joined events</p>
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
        <div className="flex border-b border-gray-200">
          <button
            className={`py-4 px-6 font-medium text-lg flex-1 ${activeTab === 'created' ? 'text-primary border-b-2 border-primary' : 'text-text-light hover:text-primary'}`}
            onClick={() => handleTabChange('created')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Created Events 
            <span className="ml-2 text-sm bg-gray-100 text-text-dark py-1 px-2 rounded-full">
              {createdEvents.length}
            </span>
          </button>
          <button
            className={`py-4 px-6 font-medium text-lg flex-1 ${activeTab === 'participating' ? 'text-primary border-b-2 border-primary' : 'text-text-light hover:text-primary'}`}
            onClick={() => handleTabChange('participating')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Joined Events
            <span className="ml-2 text-sm bg-gray-100 text-text-dark py-1 px-2 rounded-full">
              {participatingEvents.length}
            </span>
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="loading-spinner"></div>
              <p className="ml-4 text-text-light">Loading your events...</p>
            </div>
          ) : (
            renderEvents()
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
          onClick={() => navigate('/events/create')}
          className="flex items-center btn btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Event
        </button>
      </div>
    </div>
  );
};

export default UserEventsPage; 