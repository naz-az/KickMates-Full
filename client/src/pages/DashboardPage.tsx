import { useState, useMemo, useEffect } from 'react';
import Calendar from '../components/Calendar';
import axios from 'axios';
import { formatImageUrl } from '../utils/imageUtils';

interface TopEvent {
  id: number;
  name: string;
  date: string;
  event_date: string;
  location: string;
  img_url: string;
  rating?: number;
  total_participants?: number;
}

interface UserEvent {
  id: number;
  title: string;
  sport_type: string;
  event_date: string;
  event_time: string;
  image_url: string;
  participants: string[];
  total_participants: number;
}

interface UpcomingEvent {
  id: number;
  title: string;
  type: string;
  event_date: string;
  event_time: string;
}

interface UserStats {
  eventsCreated: number;
  eventsJoined: number;
  score?: {
    value: number;
    change: number;
  };
  completedHours?: {
    value: number;
    change: number;
  };
  totalStudents?: {
    value: number;
    change: number;
  };
  totalHours?: {
    value: number;
    change: number;
  };
}

interface ActivityData {
  days: string[];
  eventsCreated: number[];
  eventsJoined: number[];
  discussionsParticipated: number[];
}

const API_URL = 'http://localhost:5001/api';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [myEvents, setMyEvents] = useState<UserEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Format current date
  const formattedDate = useMemo(() => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options as any);
  }, []);
  
  const currentMonth = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);
  
  // Current week dates
  const currentWeekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(today.setDate(diff));

    return Array(7)
      .fill(0)
      .map((_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return {
          date,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isToday:
            new Date().toDateString() === date.toDateString(),
          hasEvent: upcomingEvents?.some(event => event.event_date && event.event_date.includes(date.getDate().toString())) || false
        };
      });
  }, [upcomingEvents]);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        // Fetch all dashboard data in parallel
        const [
          topEventsRes,
          myEventsRes,
          upcomingEventsRes,
          userStatsRes,
          activityRes
        ] = await Promise.all([
          axios.get(`${API_URL}/dashboard/top-events`, config),
          axios.get(`${API_URL}/dashboard/user-events`, config),
          axios.get(`${API_URL}/dashboard/upcoming-events`, config),
          axios.get(`${API_URL}/dashboard/statistics`, config),
          axios.get(`${API_URL}/dashboard/activity`, config)
        ]);
        
        setTopEvents(topEventsRes.data);
        setMyEvents(myEventsRes.data);
        setUpcomingEvents(upcomingEventsRes.data);
        setUserStats(userStatsRes.data);
        setActivityData(activityRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Days of the week data for UI display
  const weekDays = useMemo(() => {
    if (!activityData) return [];
    
    return activityData.days.map((day, index) => ({
      day,
      percent: activityData.eventsCreated[index]
    }));
  }, [activityData]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 pb-10 px-4 md:px-6">
      <div className="bg-white rounded-xl shadow-md p-6 mb-0 mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back! Here's your activity summary</p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-base font-medium text-gray-700">{formattedDate}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="col-span-2 space-y-8">
          {/* Top events section */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg text-gray-800">Sports Events For You</h2>
              <button className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors">View all</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {topEvents.map(event => (
                <div key={event.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 bg-white">
                  <div className="relative">
                    <img 
                      src={formatImageUrl(event.img_url)} 
                      alt={event.name} 
                      className="w-full h-40 object-cover"
                    />
                    <button className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-16"></div>
                    <div className="absolute bottom-3 left-3 bg-white/90 rounded-full px-2 py-0.5 text-xs font-medium">{event.date}</div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 mb-3 line-clamp-1">{event.name}</h3>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <img 
                          src={formatImageUrl(event.img_url)} 
                          alt={event.name} 
                          className="w-7 h-7 rounded-full mr-2 border border-gray-100"
                        />
                        <span className="text-sm text-purple-600 font-medium">{event.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          {event.total_participants}
                        </span>
                        
                        <span className="flex items-center text-sm text-yellow-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {event.rating?.toFixed(1) || "4.5"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* My events section */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg text-gray-800">My Sports Events</h2>
              <button className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors">View all</button>
            </div>
            
            <div className="space-y-4">
              {myEvents.map(event => (
                <div key={event.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors duration-200 border border-gray-100">
                  <div className="flex items-center">
                    <div className="relative w-12 h-12 flex-shrink-0 mr-4">
                      <img 
                        src={formatImageUrl(event.image_url)} 
                        alt={event.title} 
                        className="w-full h-full rounded-lg object-cover shadow-sm"
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-800">{event.title}</h3>
                      <div className="flex items-center mt-1">
                        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full" 
                            style={{width: `${(event.total_participants / event.total_participants) * 100}%`}}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 ml-2">{event.total_participants}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-3">
                      {event.participants.slice(0, 4).map((avatar, index) => (
                        <img 
                          key={index} 
                          src={formatImageUrl(avatar)} 
                          alt="Participant" 
                          className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                        />
                      ))}
                      {event.participants.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white shadow-sm">
                          +{event.participants.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div className="col-span-1 space-y-8">
          {/* Calendar section */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-5">
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <div className="flex items-center text-base font-semibold text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">April 2024</span>
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl mb-4">
              <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-3">
                <div className="text-purple-600">Mo</div>
                <div className="text-purple-600">Tu</div>
                <div className="text-purple-600">We</div>
                <div className="text-purple-600">Th</div>
                <div className="text-purple-600">Fr</div>
                <div className="text-blue-600">Sa</div>
                <div className="text-blue-600">Su</div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {[23, 24, 25, 26, 27, 28, 29].map((date, index) => {
                  const isToday = currentWeekDates[index]?.isToday;
                  const hasEvent = date === 25 || date === 27;
                  const isWeekend = index > 4; // Saturday and Sunday
                  
                  return (
                    <div key={index} className="relative flex flex-col items-center justify-center py-1">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full 
                        ${isToday ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-md' : 
                          isWeekend ? 'hover:bg-blue-100 text-blue-800' : 'hover:bg-purple-100'} 
                        ${hasEvent && !isToday ? (isWeekend ? 'text-blue-700 font-medium' : 'text-purple-700 font-medium') : ''} 
                        cursor-pointer transition-all duration-200`}>
                        {date}
                      </div>
                      {hasEvent && (
                        <div className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${isWeekend ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Upcoming events */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">Upcoming Events</h3>
                <button className="text-xs text-purple-600 font-medium hover:text-purple-800 transition-colors flex items-center">
                  View all
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {upcomingEvents.map(event => (
                <div key={event.id} className="group border-l-[3px] border-l-purple-500 pl-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-white rounded-r-lg transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-1 group-hover:text-purple-700 transition-colors">{event.title}</div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="bg-purple-50 px-2 py-0.5 rounded-full text-purple-700 font-medium">{event.event_date}</span>
                        <span className="bg-blue-50 px-2 py-0.5 rounded-full text-blue-700 font-medium">{event.event_time}</span>
                      </div>
                    </div>
                    <div className={`flex items-center justify-center rounded-full py-1 px-3 text-xs font-medium ${event.type === 'Course' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} shadow-sm`}>
                      {event.type === 'Course' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      )}
                      {event.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Weekly Calendar */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-medium text-purple-800 mb-5">Calendar</h2>
              <div className="grid grid-cols-7 gap-1">
                {currentWeekDates.map((dayData, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg p-3 text-center ${
                      dayData.isToday 
                        ? 'bg-purple-100 border-2 border-purple-500' 
                        : dayData.hasEvent 
                        ? 'bg-indigo-50 border border-indigo-200' 
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">{dayData.day}</div>
                    <div className={`text-xl font-bold ${dayData.isToday ? 'text-purple-700' : 'text-gray-700'}`}>
                      {dayData.date.getDate()}
                    </div>
                    {dayData.hasEvent && (
                      <div className="mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Overall Information section */}
          {(userStats?.score || userStats?.completedHours || userStats?.totalStudents || userStats?.totalHours) && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-xl font-medium text-purple-800 mb-5">Overall Information</h2>
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {userStats.score && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-purple-500 p-2 mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-600">Success Score</p>
                          <p className="text-2xl font-bold text-purple-900">{userStats.score?.value.toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <span className={`mr-1 ${userStats.score?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <svg className="inline-block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={userStats.score?.change >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}></path>
                          </svg>
                          {Math.abs(userStats.score?.change)}%
                        </span>
                        <span className="text-gray-500">from last month</span>
                      </div>
                    </div>
                  )}

                  {userStats.completedHours && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-indigo-500 p-2 mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-indigo-600">Hours of Activity</p>
                          <p className="text-2xl font-bold text-indigo-900">{userStats.completedHours?.value}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <span className={`mr-1 ${userStats.completedHours?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <svg className="inline-block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={userStats.completedHours?.change >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}></path>
                          </svg>
                          {Math.abs(userStats.completedHours?.change)}%
                        </span>
                        <span className="text-gray-500">from last month</span>
                      </div>
                    </div>
                  )}

                  {userStats.totalStudents && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-blue-500 p-2 mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Participants</p>
                          <p className="text-2xl font-bold text-blue-900">{userStats.totalStudents?.value}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <span className={`mr-1 ${userStats.totalStudents?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <svg className="inline-block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={userStats.totalStudents?.change >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}></path>
                          </svg>
                          {Math.abs(userStats.totalStudents?.change)}%
                        </span>
                        <span className="text-gray-500">from last month</span>
                      </div>
                    </div>
                  )}

                  {userStats.totalHours && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-green-500 p-2 mr-4">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600">Total Event Hours</p>
                          <p className="text-2xl font-bold text-green-900">{userStats.totalHours?.value}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <span className={`mr-1 ${userStats.totalHours?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <svg className="inline-block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={userStats.totalHours?.change >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}></path>
                          </svg>
                          {Math.abs(userStats.totalHours?.change)}%
                        </span>
                        <span className="text-gray-500">from last month</span>
                      </div>
                    </div>
                  )}
                  
                  {/* If none of the primary stats are available, show fallback stats */}
                  {(!userStats.score && !userStats.completedHours && !userStats.totalStudents && !userStats.totalHours) && (
                    <>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="rounded-full bg-purple-500 p-2 mr-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-purple-600">Events Created</p>
                            <p className="text-2xl font-bold text-purple-900">{userStats.eventsCreated}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="rounded-full bg-blue-500 p-2 mr-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-600">Events Joined</p>
                            <p className="text-2xl font-bold text-blue-900">{userStats.eventsJoined}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Productivity section - Donut Chart */}
          {activityData && (
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-800">Activity Overview</h2>
                    <p className="text-xs text-gray-500">Weekly distribution</p>
                  </div>
                </div>
                <select className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500">
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
              </div>
              
              <div className="flex flex-col items-center justify-center">
                {/* Donut Chart with enhanced shading and effects */}
                <div className="relative w-52 h-52 mx-auto">
                  {/* Outer glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gray-100 blur-md opacity-50"></div>
                  
                  {/* Main donut chart with improved gradient transitions */}
                  <div 
                    className="relative w-full h-full rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] overflow-hidden"
                    style={{
                      background: `
                        conic-gradient(
                          from 0deg, 
                          #FCD34D 0deg 72deg, 
                          #F59E0B 72deg 136.8deg, 
                          #EC4899 136.8deg 216deg, 
                          #8B5CF6 216deg 270deg, 
                          #3B82F6 270deg 360deg
                        )
                      `,
                      boxShadow: 'inset 0px 0px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {/* Light highlight overlay for 3D effect */}
                    <div 
                      className="absolute inset-0 rounded-full" 
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)'
                      }}
                    ></div>
                    
                    {/* Inner white circle to create donut effect */}
                    <div 
                      className="absolute top-1/2 left-1/2 w-[60%] h-[60%] rounded-full -translate-x-1/2 -translate-y-1/2" 
                      style={{
                        background: 'white',
                        boxShadow: 'inset 0px 0px 8px rgba(0,0,0,0.1), 0px 0px 10px rgba(255,255,255,0.8)'
                      }}
                    ></div>
                  </div>
                  
                  {/* Center text with enhanced styling */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold" style={{ 
                      color: '#1F2937',
                      textShadow: '0px 1px 2px rgba(255,255,255,0.8)'
                    }}>72</div>
                    <div className="text-xs text-gray-500">Total Value</div>
                  </div>
                </div>
                
                {/* Enhanced Legend with hover effects */}
                <div className="mt-6 w-full grid grid-cols-3 gap-x-2 gap-y-4">
                  <div className="flex items-center group cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-[#FCD34D] mr-2 shadow-sm group-hover:scale-110 transition-transform"></div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Sports</span>
                  </div>
                  <div className="flex items-center group cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B] mr-2 shadow-sm group-hover:scale-110 transition-transform"></div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Training</span>
                  </div>
                  <div className="flex items-center group cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-[#EC4899] mr-2 shadow-sm group-hover:scale-110 transition-transform"></div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Recovery</span>
                  </div>
                  <div className="flex items-center group cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-[#8B5CF6] mr-2 shadow-sm group-hover:scale-110 transition-transform"></div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Coaching</span>
                  </div>
                  <div className="flex items-center group cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-[#3B82F6] mr-2 shadow-sm group-hover:scale-110 transition-transform"></div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Tactics</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between">
                <button className="text-purple-600 text-xs font-medium flex items-center hover:text-purple-800 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Activity
                </button>
                
                <button className="text-gray-600 text-xs font-medium flex items-center hover:text-gray-800 transition-colors">
                  View Details
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 