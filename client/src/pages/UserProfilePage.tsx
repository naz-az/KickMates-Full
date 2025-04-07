import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { getUserById, getUserEventsById } from '../services/api';
import { formatImageUrl } from '../utils/imageUtils';

interface User {
  id: number;
  username: string;
  full_name?: string;
  bio?: string;
  profile_image?: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  description?: string;
  sport_type: string;
  location: string;
  start_date: string;
  end_date: string;
  creator_id: number;
  creator_name: string;
  image_url?: string;
  max_players: number;
  current_players: number;
}

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);
  
  const [user, setUser] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchUserProfile(parseInt(id));
    }
  }, [id]);

  const fetchUserProfile = async (userId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch user profile
      const response = await getUserById(userId);
      const userData = response.data.user;
      setUser(userData);
      
      // Fetch user's events
      const eventsResponse = await getUserEventsById(userId);
      if (eventsResponse.data) {
        setUserEvents(eventsResponse.data.created || []);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Default profile image if none provided
  const defaultImage = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=300&q=80';
  
  // Function to format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="h-12 w-12 text-red-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-gray-900">User Not Found</h2>
          <p className="mt-2 text-gray-600">{error || 'The requested user profile could not be found.'}</p>
          <button 
            onClick={() => navigate('/members')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Back to Members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header/Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 h-48 rounded-lg relative mb-20">
          <div className="absolute -bottom-16 left-8 sm:left-12">
            <img 
              src={user.profile_image ? formatImageUrl(user.profile_image) : defaultImage} 
              alt={user.username} 
              className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
            />
          </div>
        </div>

        <div className="mt-20 sm:mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar with user info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.full_name || user.username}
                </h2>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
              
              <div className="px-6 py-5">
                <div className="space-y-4">
                  {user.bio && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                      <p className="mt-1 text-sm text-gray-900">{user.bio}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>
              
              {authUser && authUser.id !== user.id && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button 
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={() => navigate('/messages')} // Navigate to messages with this user pre-selected
                  >
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right content area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Events Created by {user.username}
                </h2>
              </div>
              
              <div className="p-6">
                {userEvents.length === 0 ? (
                  <div className="py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                    <p className="mt-1 text-sm text-gray-500">This user hasn't created any events yet.</p>
                  </div>
                ) : (
                  <div className="events-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userEvents.map(event => (
                      <EventCard 
                        key={event.id} 
                        event={{
                          ...event,
                          max_players: event.max_players || 0,
                          current_players: event.current_players || 0
                        }} 
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {userEvents.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={() => navigate('/events', { state: { creator: user.id } })}
                  >
                    View All Events
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 