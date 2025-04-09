import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { formatImageUrl } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';

interface TopEvent {
  id: number;
  name: string;
  date: string;
  event_date: string;
  location: string;
  img_url: string;
  rating?: number;
  total_participants?: number;
  creator_id?: number;
  sport_type?: string;
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
  creator_id?: number;
}

interface UpcomingEvent {
  id: number;
  title: string;
  type: string;
  event_date: string;
  event_time: string;
  creator_id?: number;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [myEvents, setMyEvents] = useState<UserEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [_error, setError] = useState<string | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // Add state for selected date in calendar
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showDateDetails, setShowDateDetails] = useState<boolean>(false);
  const [dateEventsCount, setDateEventsCount] = useState<{[key: string]: number}>({});
  
  // Add states for activity filtering
  const [activityTimeframe, setActivityTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Add effect for counting animation
  const [animatedStats, setAnimatedStats] = useState({
    score: 0,
    completedHours: 0,
    totalStudents: 0,
    totalHours: 0,
    eventsCreated: 0,
    eventsJoined: 0
  });
  
  // Add new state for events filtering
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'popular' | 'recent'>('popular');
  const [animateEventCards, setAnimateEventCards] = useState<boolean>(false);
  
  // Navigation handlers
  const goToEventDetail = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };
  
  const goToUserProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };
  
  // Format current date
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
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
        
        // DIRECT EVENT DETAILS LOG
        console.log('========== ALL EVENT DETAILS ==========');
        console.log('TOP EVENTS:');
        console.log(JSON.stringify(topEventsRes.data, null, 2));
        
        console.log('MY EVENTS:');
        console.log(JSON.stringify(myEventsRes.data, null, 2));
        
        console.log('UPCOMING EVENTS:');
        console.log(JSON.stringify(upcomingEventsRes.data, null, 2));
        console.log('======================================');
        
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
  
  // Add useEffect to trigger animation after initial load
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        setAnimateEventCards(true);
      }, 300);
    }
  }, [loading]);
  
  // Add filter event handler
  const filterEvents = (category: string) => {
    setEventFilter(category);
  };

  // Add sort order handler
  const changeSortOrder = (order: 'popular' | 'recent') => {
    setSortOrder(order);
  };

  // Filter top events based on selected filter
  const filteredTopEvents = useMemo(() => {
    if (eventFilter === 'all') return topEvents;
    return topEvents.filter(event => 
      event.sport_type?.toLowerCase() === eventFilter.toLowerCase()
    );
  }, [topEvents, eventFilter]);
  
  // Add calendar interaction methods
  const handleDateClick = (date: Date) => {
    setSelectedDate(date.getDate());
    setShowDateDetails(true);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  // Get month name and year
  const monthYearString = useMemo(() => {
    return selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Generate calendar days for the selected month
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculate days from previous month to fill the first week
    const daysFromPrevMonth = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust Sunday (0) to be 6 for Monday-based week
    
    // Calculate total days needed (including days from prev/next months to fill the calendar grid)
    const totalDays = daysFromPrevMonth + lastDay.getDate();
    const totalWeeks = Math.ceil(totalDays / 7);
    const totalCells = totalWeeks * 7;
    
    const days = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = 0; i < daysFromPrevMonth; i++) {
      const day = prevMonthDays - daysFromPrevMonth + i + 1;
      days.push({
        date: day,
        month: 'prev',
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, day)
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date: i,
        month: 'current',
        isCurrentMonth: true,
        isToday: new Date().toDateString() === date.toDateString(),
        fullDate: date
      });
    }
    
    // Add days from next month
    const remainingDays = totalCells - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: 'next',
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i)
      });
    }
    
    return days;
  }, [selectedMonth]);

  // Helper to parse month names to month index (0-based)
  const getMonthIndexFromName = (monthName: string): number => {
    const months: Record<string, number> = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3,
      'may': 4, 'june': 5, 'july': 6, 'august': 7,
      'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    return months[monthName.toLowerCase()] || 0;
  };
  
  // Count events per date for visual indicators
  useEffect(() => {
    if (upcomingEvents.length) {
      const eventCounts: {[key: string]: number} = {};
      
      console.log('Processing upcoming events for calendar:', upcomingEvents.length);
      
      upcomingEvents.forEach((event: UpcomingEvent, index: number) => {
        if (event.event_date) {
          console.log(`[${index}] Processing event: ${event.title}, date: ${event.event_date}`);
          
          // Parse date using multiple strategies
          let dateKey = '';
          let success = false;
          
          // Strategy 1: Standard format "Month DD, YYYY" (e.g., "May 15, 2025")
          const dateMatch = event.event_date.match(/([A-Za-z]+)\s+(\d+),\s+(\d+)/);
          if (dateMatch) {
            const month = dateMatch[1];
            const day = dateMatch[2];
            const year = dateMatch[3];
            // Convert month name to index (0-indexed months in JS)
            const monthIndex = getMonthIndexFromName(month);
            dateKey = `${year}-${monthIndex}-${day}`;
            console.log(`Strategy 1 success: ${month} ${day}, ${year} → key: ${dateKey}`);
            success = true;
          }
          
          // Strategy 2: Try direct Date parsing
          if (!success) {
            try {
              const date = new Date(event.event_date);
              if (!isNaN(date.getTime())) {
                dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                console.log(`Strategy 2 success: ${event.event_date} → ${dateKey}`);
                success = true;
              }
            } catch {
              console.log(`Strategy 2 failed for: ${event.event_date}`);
            }
          }
          
          // Add to event counts if successful
          if (success) {
            eventCounts[dateKey] = (eventCounts[dateKey] || 0) + 1;
          } else {
            console.warn(`Failed to parse date for event: ${event.title} - ${event.event_date}`);
            // Default to today for events with unparseable dates (for testing only)
            const today = new Date();
            dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
            eventCounts[dateKey] = (eventCounts[dateKey] || 0) + 1;
            console.log(`Using today as fallback: ${dateKey}`);
          }
        }
      });
      
      console.log('Final event counts by date:', eventCounts);
      setDateEventsCount(eventCounts);
    }
  }, [upcomingEvents]);
  
  // Helper to check if a date has events - more explicit logging
  const hasEvents = (date: Date) => {
    if (!date) return false;
    
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const hasEvent = !!dateEventsCount[dateKey];
    
    // Log today's date check and a few sample dates to reduce noise
    const today = new Date();
    
    // Use for comparison without linter warning
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      console.log(`Today's date check: ${date.toDateString()} with key: ${dateKey} has events: ${hasEvent}`);
    } else if (hasEvent) {
      console.log(`Date with event: ${date.toDateString()} with key: ${dateKey}`);
    }
    
    return hasEvent;
  };

  // Get event count for a date
  const getEventCount = (date: Date) => {
    if (!date) return 0;
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return dateEventsCount[dateKey] || 0;
  };
  
  // Add a method to handle activity timeframe change
  const handleActivityTimeframeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActivityTimeframe(event.target.value as 'week' | 'month' | 'quarter');
  };

  // Simulate different data based on timeframe selection
  const getAdjustedActivityData = () => {
    if (!activityData) return null;
    
    // Clone the original data
    const adjustedData = {...activityData};
    
    // Apply multiplier based on timeframe to simulate different data
    let multiplier = 1;
    if (activityTimeframe === 'month') multiplier = 2;
    if (activityTimeframe === 'quarter') multiplier = 4;
    
    // Adjust the data
    adjustedData.eventsCreated = adjustedData.eventsCreated.map(val => Math.round(val * multiplier));
    adjustedData.eventsJoined = adjustedData.eventsJoined.map(val => Math.round(val * multiplier));
    adjustedData.discussionsParticipated = adjustedData.discussionsParticipated.map(val => Math.round(val * multiplier));
    
    return adjustedData;
  };

  // Calculate total value for activity chart
  const calculateTotalActivityValue = () => {
    const data = getAdjustedActivityData();
    if (!data) return 0;
    
    return [
      ...data.eventsCreated,
      ...data.eventsJoined,
      ...data.discussionsParticipated
    ].reduce((sum, current) => sum + current, 0);
  };
  
  // Add animated statistics effect
  useEffect(() => {
    if (!userStats || loading) return;
    
    // Set up animation
    const animationDuration = 1500; // in milliseconds
    const fps = 60;
    const totalFrames = animationDuration / 1000 * fps;
    let frame = 0;
    
    // Determine target values
    const targetValues = {
      score: userStats.score?.value || 0,
      completedHours: userStats.completedHours?.value || 0,
      totalStudents: userStats.totalStudents?.value || 0,
      totalHours: userStats.totalHours?.value || 0,
      eventsCreated: userStats.eventsCreated || 0,
      eventsJoined: userStats.eventsJoined || 0
    };
    
    // Function to calculate eased value
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
    
    // Animation interval
    const interval = setInterval(() => {
      frame++;
      const progress = easeOutQuart(frame / totalFrames);
      
      // Update animated values
      setAnimatedStats({
        score: Number((progress * targetValues.score).toFixed(1)),
        completedHours: Math.round(progress * targetValues.completedHours),
        totalStudents: Math.round(progress * targetValues.totalStudents),
        totalHours: Math.round(progress * targetValues.totalHours),
        eventsCreated: Math.round(progress * targetValues.eventsCreated),
        eventsJoined: Math.round(progress * targetValues.eventsJoined)
      });
      
      // Stop animation when complete
      if (frame >= totalFrames) {
        clearInterval(interval);
        setAnimatedStats(targetValues);
      }
    }, 1000 / fps);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [userStats, loading]);
  
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
          {/* Top events section - enhanced */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-semibold text-lg text-gray-800">Sports Events For You</h2>
                <p className="text-xs text-gray-500 mt-1">Discover sporting events that match your interests</p>
              </div>
              <button 
                onClick={() => navigate('/events')}
                className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors flex items-center"
              >
                View all
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Filter and sort options */}
            <div className="flex flex-wrap items-center justify-between mb-6">
              <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 mt-2 sm:mt-0">
                <button 
                  onClick={() => filterEvents('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    eventFilter === 'all' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => filterEvents('soccer')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    eventFilter === 'soccer' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Soccer
                </button>
                <button 
                  onClick={() => filterEvents('basketball')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    eventFilter === 'basketball' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Basketball
                </button>
                <button 
                  onClick={() => filterEvents('tennis')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    eventFilter === 'tennis' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tennis
                </button>
                <button 
                  onClick={() => filterEvents('running')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    eventFilter === 'running' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Running
                </button>
              </div>
              
              <div className="flex border rounded-lg overflow-hidden mt-2 sm:mt-0">
                <button 
                  onClick={() => changeSortOrder('popular')}
                  className={`px-3 py-1 text-xs font-medium ${
                    sortOrder === 'popular' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Popular
                </button>
                <button 
                  onClick={() => changeSortOrder('recent')}
                  className={`px-3 py-1 text-xs font-medium ${
                    sortOrder === 'recent' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Recent
                </button>
              </div>
            </div>
            
            {filteredTopEvents.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <p className="mt-2 text-gray-500">No events found for this category</p>
                <button 
                  onClick={() => filterEvents('all')}
                  className="mt-3 text-sm text-purple-600 hover:text-purple-800"
                >
                  View all events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredTopEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className={`border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-500 bg-white 
                      ${animateEventCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="relative group">
                      <img 
                        src={formatImageUrl(event.img_url)} 
                        alt={event.name} 
                        className="w-full h-40 object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
                        onClick={() => goToEventDetail(event.id)}
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <button className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-16"></div>
                      <div className="absolute bottom-3 left-3 bg-white/90 rounded-full px-2 py-0.5 text-xs font-medium">{event.date}</div>
                      
                      {/* Sport type badge */}
                      <div className="absolute top-3 left-3 bg-white/90 rounded-full px-2 py-0.5 text-xs font-medium">
                        {event.sport_type || 'General'}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 
                        className="font-medium text-gray-800 mb-3 line-clamp-1 cursor-pointer hover:text-purple-600 transition-colors duration-200"
                        onClick={() => goToEventDetail(event.id)}
                      >
                        {event.name}
                      </h3>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <img 
                            src={formatImageUrl(event.img_url)} 
                            alt={event.name} 
                            className="w-7 h-7 rounded-full mr-2 border border-gray-100 cursor-pointer transition-transform hover:scale-110"
                            onClick={() => goToUserProfile(event.creator_id || 1)}
                          />
                          <span 
                            className="text-sm text-purple-600 font-medium cursor-pointer hover:underline"
                            onClick={() => goToUserProfile(event.creator_id || 1)}
                          >
                            {event.name}
                          </span>
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
                      
                      {/* Location info */}
                      <div className="mt-3 flex items-center text-xs text-gray-500">
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        {event.location || 'No location specified'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* My events section - enhanced */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-semibold text-lg text-gray-800">My Sports Events</h2>
                <p className="text-xs text-gray-500 mt-1">Events you've created or joined</p>
              </div>
              <button 
                onClick={() => navigate('/profile/events')}
                className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors flex items-center"
              >
                View all
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {myEvents.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <p className="mt-2 text-gray-500">You haven't joined any events yet</p>
                <button 
                  onClick={() => navigate('/events')}
                  className="mt-3 text-sm text-purple-600 hover:text-purple-800"
                >
                  Explore events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className={`flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-all duration-500 border border-gray-100 cursor-pointer
                      ${animateEventCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                    onClick={() => goToEventDetail(event.id)}
                  >
                    <div className="flex items-center w-full">
                      <div className="relative w-12 h-12 flex-shrink-0 mr-4 group overflow-hidden rounded-lg">
                        <img 
                          src={formatImageUrl(event.image_url)} 
                          alt={event.title} 
                          className="w-full h-full object-cover shadow-sm cursor-pointer transition-transform duration-500 group-hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToEventDetail(event.id);
                          }}
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 
                            className="font-medium text-gray-800 cursor-pointer hover:text-purple-600 transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToEventDetail(event.id);
                            }}
                          >
                            {event.title}
                          </h3>
                          <span className="text-xs bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 ml-2">
                            {event.sport_type}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 w-full">
                          <div className="flex items-center flex-grow max-w-xs">
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all duration-1000" 
                                style={{
                                  width: `${(event.total_participants / (event.total_participants || 1)) * 100}%`
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 ml-2 whitespace-nowrap">{event.total_participants} joined</p>
                          </div>
                          
                          <div className="flex items-center ml-4">
                            <div className="flex -space-x-2 mr-3">
                              {event.participants.slice(0, 4).map((avatar, i) => (
                                <img 
                                  key={i} 
                                  src={formatImageUrl(avatar)} 
                                  alt="Participant" 
                                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToUserProfile(i + 1);
                                  }}
                                />
                              ))}
                              {event.participants.length > 4 && (
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white shadow-sm">
                                  +{event.participants.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* My events section */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg text-gray-800">My Events</h2>
              <button 
                onClick={() => navigate('/profile/events')}
                className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors"
              >
                View all
              </button>
            </div>
            
            <div className="space-y-4">
              {myEvents.map(event => (
                <div 
                  key={event.id} 
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors duration-200 border border-gray-100 cursor-pointer"
                  onClick={() => goToEventDetail(event.id)}
                >
                  <div className="flex items-center">
                    <div className="relative w-12 h-12 flex-shrink-0 mr-4">
                      <img 
                        src={formatImageUrl(event.image_url)} 
                        alt={event.title} 
                        className="w-full h-full rounded-lg object-cover shadow-sm cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToEventDetail(event.id);
                        }}
                      />
                    </div>
                    
                    <div>
                      <h3 
                        className="font-medium text-gray-800 cursor-pointer hover:text-purple-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToEventDetail(event.id);
                        }}
                      >
                        {event.title}
                      </h3>
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
                          className="w-7 h-7 rounded-full border-2 border-white shadow-sm cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Since we don't have user IDs for participants, this is a placeholder
                            // In a real app, you'd need to store and pass the actual user IDs
                            goToUserProfile(index + 1);
                          }}
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
              <button 
                onClick={handlePrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <div className="flex items-center text-base font-semibold text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">{monthYearString}</span>
                </div>
              </div>
              <button 
                onClick={handleNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl mb-4 relative">
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
                {calendarDays.map((day, index) => {
                  const isToday = day.isToday;
                  const hasEventsOnDay = hasEvents(day.fullDate);
                  const eventCount = getEventCount(day.fullDate);
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(day.fullDate)}
                      className={`
                        cursor-pointer flex flex-col items-center justify-center p-2 rounded-full
                        ${day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}
                        ${isToday ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-md' : 
                          selectedDate === day.fullDate.getDate() && 
                          day.fullDate.getMonth() === selectedMonth.getMonth() 
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-sm'
                            : hasEventsOnDay
                              ? 'bg-purple-100 hover:bg-purple-200'
                              : 'hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="text-sm">{day.fullDate.getDate()}</div>
                      {eventCount > 0 && (
                        <div className="text-xs mt-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
                          {eventCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Date details popup when date is selected */}
              {showDateDetails && selectedDate && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl p-4 z-10 border border-gray-200 transition-all duration-200 transform-origin-top">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-800">Events on {selectedMonth.toLocaleDateString('en-US', { month: 'short' })} {selectedDate}</h4>
                    <button 
                      onClick={() => setShowDateDetails(false)} 
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Filter the events for the selected date */}
                  {upcomingEvents
                    .filter(event => {
                      // Filter events for the selected date
                      if (!event.event_date) return false;
                      
                      try {
                        // Parse date from formatted string
                        const dateMatch = event.event_date.match(/([A-Za-z]+)\s+(\d+),\s+(\d+)/);
                        if (dateMatch) {
                          const month = dateMatch[1];
                          const day = dateMatch[2];
                          const year = dateMatch[3];
                          // Get month index
                          const monthIndex = getMonthIndexFromName(month);
                          return parseInt(day) === selectedDate &&
                                 monthIndex === selectedMonth.getMonth() &&
                                 parseInt(year) === selectedMonth.getFullYear();
                        }
                        return false;
                      } catch (error) {
                        console.error('Error parsing event date:', error);
                        return false;
                      }
                    }).length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {upcomingEvents
                        .filter(event => {
                          // Filter events for the selected date
                          if (!event.event_date) return false;
                          
                          try {
                            // Parse date from formatted string
                            const dateMatch = event.event_date.match(/([A-Za-z]+)\s+(\d+),\s+(\d+)/);
                            if (dateMatch) {
                              const month = dateMatch[1];
                              const day = dateMatch[2];
                              const year = dateMatch[3];
                              // Get month index
                              const monthIndex = getMonthIndexFromName(month);
                              return parseInt(day) === selectedDate &&
                                     monthIndex === selectedMonth.getMonth() &&
                                     parseInt(year) === selectedMonth.getFullYear();
                            }
                            return false;
                          } catch (error) {
                            console.error('Error parsing event date:', error);
                            return false;
                          }
                        })
                        .map(event => (
                          <div 
                            key={event.id} 
                            className="border-l-2 border-purple-500 pl-3 py-2 hover:bg-purple-50 rounded-r-md cursor-pointer"
                            onClick={() => {
                              goToEventDetail(event.id);
                              setShowDateDetails(false);
                            }}
                          >
                            <div className="text-sm font-medium text-gray-800">{event.title}</div>
                            <div className="text-xs text-gray-500">{event.event_time}</div>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="text-center py-3 text-gray-500">No events scheduled for this date</div>
                  )}
                  
                  <div className="mt-3 text-center">
                    <button 
                      onClick={() => navigate('/events/create')} 
                      className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1 rounded-full font-medium"
                    >
                      + Add New Event
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Upcoming events */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">Upcoming Events</h3>
                <button 
                  onClick={() => navigate('/events')}
                  className="text-xs text-purple-600 font-medium hover:text-purple-800 transition-colors flex items-center"
                >
                  View all
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {upcomingEvents.map(event => (
                <div 
                  key={event.id} 
                  className="group border-l-[3px] border-l-purple-500 pl-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-white rounded-r-lg transition-all duration-200 cursor-pointer"
                  onClick={() => goToEventDetail(event.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-1 group-hover:text-purple-700 transition-colors">
                        {event.title}
                      </div>
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
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <h2 className="text-xl font-medium text-purple-800 mb-5 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Overall Information
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {userStats.score && (
                    <div className="bg-purple-50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-purple-200">
                      <div className="flex items-center">
                        <div className="rounded-full bg-purple-500 p-2 mr-4 transition-all duration-300 hover:bg-purple-600">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-600">Success Score</p>
                          <p className="text-2xl font-bold text-purple-900">{animatedStats.score.toFixed(1)}</p>
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
                      
                      {/* Progress bar added */}
                      <div className="mt-4">
                        <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-1500 ease-out"
                            style={{ width: `${(animatedStats.score / 5) * 100}%` }} // Assuming max score is 5
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {userStats.completedHours && (
                    <div className="bg-purple-50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-indigo-200">
                      <div className="flex items-center">
                        <div className="rounded-full bg-indigo-500 p-2 mr-4 transition-all duration-300 hover:bg-indigo-600">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-indigo-600">Hours of Activity</p>
                          <p className="text-2xl font-bold text-indigo-900">{animatedStats.completedHours}</p>
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
                      
                      {/* Progress bar added */}
                      <div className="mt-4">
                        <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1500 ease-out"
                            style={{ width: `${Math.min((animatedStats.completedHours / 100) * 100, 100)}%` }} // Cap at 100%
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {userStats.totalStudents && (
                    <div className="bg-purple-50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-blue-200">
                      <div className="flex items-center">
                        <div className="rounded-full bg-blue-500 p-2 mr-4 transition-all duration-300 hover:bg-blue-600">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Participants</p>
                          <p className="text-2xl font-bold text-blue-900">{animatedStats.totalStudents}</p>
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
                      
                      {/* Progress indicator - people icons */}
                      <div className="mt-4 flex">
                        {Array.from({ length: Math.min(Math.ceil(animatedStats.totalStudents / 20), 10) }).map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.ceil(animatedStats.totalStudents / 20) ? 'text-blue-500' : 'text-blue-200'} transition-all duration-300`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                          </svg>
                        ))}
                        {animatedStats.totalStudents > 200 && (
                          <span className="text-xs text-blue-500 ml-1 self-center">+{animatedStats.totalStudents - 200}+</span>
                        )}
                      </div>
                    </div>
                  )}

                  {userStats.totalHours && (
                    <div className="bg-purple-50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-green-200">
                      <div className="flex items-center">
                        <div className="rounded-full bg-green-500 p-2 mr-4 transition-all duration-300 hover:bg-green-600">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600">Total Event Hours</p>
                          <p className="text-2xl font-bold text-green-900">{animatedStats.totalHours}</p>
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
                      
                      {/* Progress circles */}
                      <div className="mt-4 flex space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const percentage = Math.min(100, Math.max(0, (animatedStats.totalHours / (i+1) * 20) - (i * 100)));
                          return (
                            <div key={i} className="relative w-6 h-6">
                              <svg className="w-6 h-6" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-green-100" strokeWidth="3"></circle>
                                <circle 
                                  cx="18" 
                                  cy="18" 
                                  r="16" 
                                  fill="none" 
                                  className="stroke-green-500 transition-all duration-1000" 
                                  strokeWidth="3"
                                  strokeDasharray={`${percentage} 100`}
                                  strokeLinecap="round"
                                  transform="rotate(-90 18 18)"
                                ></circle>
                              </svg>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* If none of the primary stats are available, show fallback stats */}
                  {(!userStats.score && !userStats.completedHours && !userStats.totalStudents && !userStats.totalHours) && (
                    <>
                      <div className="bg-purple-50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-purple-200">
                        <div className="flex items-center">
                          <div className="rounded-full bg-purple-500 p-2 mr-4 transition-all duration-300 hover:bg-purple-600">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-purple-600">Events Created</p>
                            <p className="text-2xl font-bold text-purple-900">{animatedStats.eventsCreated}</p>
                          </div>
                        </div>
                        
                        {/* Added progress bar */}
                        <div className="mt-4">
                          <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full transition-all duration-1500 ease-out"
                              style={{ width: `${Math.min((animatedStats.eventsCreated / 20) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-blue-200">
                        <div className="flex items-center">
                          <div className="rounded-full bg-blue-500 p-2 mr-4 transition-all duration-300 hover:bg-blue-600">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-600">Events Joined</p>
                            <p className="text-2xl font-bold text-blue-900">{animatedStats.eventsJoined}</p>
                          </div>
                        </div>
                        
                        {/* Added progress bar */}
                        <div className="mt-4">
                          <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-1500 ease-out"
                              style={{ width: `${Math.min((animatedStats.eventsJoined / 20) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Productivity section - Donut Chart (enhanced) */}
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
                    <p className="text-xs text-gray-500">
                      {activityTimeframe === 'week' && 'Weekly distribution'}
                      {activityTimeframe === 'month' && 'Monthly distribution'}
                      {activityTimeframe === 'quarter' && 'Quarterly distribution'}
                    </p>
                  </div>
                </div>
                <select 
                  value={activityTimeframe}
                  onChange={handleActivityTimeframeChange}
                  className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
              
              <div className="flex flex-col items-center justify-center">
                {/* Donut Chart with interactive elements */}
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
                          #FCD34D 0deg ${hoveredCategory === 'Sports' ? '80deg' : '72deg'}, 
                          #F59E0B ${hoveredCategory === 'Sports' ? '80deg' : '72deg'} ${hoveredCategory === 'Training' ? '150deg' : '136.8deg'}, 
                          #EC4899 ${hoveredCategory === 'Training' ? '150deg' : '136.8deg'} ${hoveredCategory === 'Recovery' ? '230deg' : '216deg'}, 
                          #8B5CF6 ${hoveredCategory === 'Recovery' ? '230deg' : '216deg'} ${hoveredCategory === 'Coaching' ? '285deg' : '270deg'}, 
                          #3B82F6 ${hoveredCategory === 'Coaching' ? '285deg' : '270deg'} 360deg
                        )
                      `,
                      boxShadow: 'inset 0px 0px 10px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease'
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
                  
                  {/* Center text with enhanced styling and animation */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div 
                      className="text-3xl font-bold transition-all duration-300" 
                      style={{ 
                        color: hoveredCategory ? {
                          'Sports': '#FCD34D',
                          'Training': '#F59E0B',
                          'Recovery': '#EC4899',
                          'Coaching': '#8B5CF6',
                          'Tactics': '#3B82F6'
                        }[hoveredCategory] : '#1F2937',
                        textShadow: '0px 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      {calculateTotalActivityValue()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {hoveredCategory ? `${hoveredCategory} Events` : 'Total Events'}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Legend with hover effects */}
                <div className="mt-6 w-full grid grid-cols-3 gap-x-2 gap-y-4">
                  <div 
                    className="flex items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredCategory('Sports')}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => navigate('/events?category=sports')}
                  >
                    <div className={`w-3 h-3 rounded-full bg-[#FCD34D] mr-2 shadow-sm 
                      ${hoveredCategory === 'Sports' ? 'scale-125' : 'group-hover:scale-110'} 
                      transition-transform`}>
                    </div>
                    <span className={`text-xs font-medium ${hoveredCategory === 'Sports' ? 'text-[#FCD34D]' : 'text-gray-700 group-hover:text-gray-900'} transition-colors`}>Sports</span>
                  </div>
                  <div 
                    className="flex items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredCategory('Training')}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => navigate('/events?category=training')}
                  >
                    <div className={`w-3 h-3 rounded-full bg-[#F59E0B] mr-2 shadow-sm 
                      ${hoveredCategory === 'Training' ? 'scale-125' : 'group-hover:scale-110'} 
                      transition-transform`}>
                    </div>
                    <span className={`text-xs font-medium ${hoveredCategory === 'Training' ? 'text-[#F59E0B]' : 'text-gray-700 group-hover:text-gray-900'} transition-colors`}>Training</span>
                  </div>
                  <div 
                    className="flex items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredCategory('Recovery')}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => navigate('/events?category=recovery')}
                  >
                    <div className={`w-3 h-3 rounded-full bg-[#EC4899] mr-2 shadow-sm 
                      ${hoveredCategory === 'Recovery' ? 'scale-125' : 'group-hover:scale-110'} 
                      transition-transform`}>
                    </div>
                    <span className={`text-xs font-medium ${hoveredCategory === 'Recovery' ? 'text-[#EC4899]' : 'text-gray-700 group-hover:text-gray-900'} transition-colors`}>Recovery</span>
                  </div>
                  <div 
                    className="flex items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredCategory('Coaching')}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => navigate('/events?category=coaching')}
                  >
                    <div className={`w-3 h-3 rounded-full bg-[#8B5CF6] mr-2 shadow-sm 
                      ${hoveredCategory === 'Coaching' ? 'scale-125' : 'group-hover:scale-110'} 
                      transition-transform`}>
                    </div>
                    <span className={`text-xs font-medium ${hoveredCategory === 'Coaching' ? 'text-[#8B5CF6]' : 'text-gray-700 group-hover:text-gray-900'} transition-colors`}>Coaching</span>
                  </div>
                  <div 
                    className="flex items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredCategory('Tactics')}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => navigate('/events?category=tactics')}
                  >
                    <div className={`w-3 h-3 rounded-full bg-[#3B82F6] mr-2 shadow-sm 
                      ${hoveredCategory === 'Tactics' ? 'scale-125' : 'group-hover:scale-110'} 
                      transition-transform`}>
                    </div>
                    <span className={`text-xs font-medium ${hoveredCategory === 'Tactics' ? 'text-[#3B82F6]' : 'text-gray-700 group-hover:text-gray-900'} transition-colors`}>Tactics</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between">
                <button 
                  onClick={() => navigate('/events/create')}
                  className="text-purple-600 text-xs font-medium flex items-center hover:text-purple-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Activity
                </button>
                
                <button 
                  onClick={() => navigate('/events')}
                  className="text-gray-600 text-xs font-medium flex items-center hover:text-gray-800 transition-colors"
                >
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