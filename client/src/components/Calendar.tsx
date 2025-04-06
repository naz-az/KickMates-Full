import { useState } from 'react';

const Calendar = () => {
  const [view, setView] = useState('week'); // 'week' or 'month'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Sample data - in a real app, this would come from API/props
  const events = [
    {
      id: 1,
      title: 'Football Training',
      start: new Date(2023, 3, 15, 10, 0),
      end: new Date(2023, 3, 15, 12, 0),
      type: 'practice',
      instructor: 'John Davis'
    },
    {
      id: 2,
      title: 'Basketball Game',
      start: new Date(2023, 3, 16, 14, 0),
      end: new Date(2023, 3, 16, 16, 0),
      type: 'discussion',
      instructor: 'Sarah Kim'
    },
    {
      id: 3,
      title: 'Tennis Lesson',
      start: new Date(2023, 3, 17, 9, 0),
      end: new Date(2023, 3, 17, 11, 0),
      type: 'lecture',
      instructor: 'Mike Johnson'
    }
  ];

  // Helper functions for calendar manipulation
  const getPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const getNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Format date to display in header
  const formatDateRange = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // End of week (Saturday)
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Generate weekday headers
  const renderWeekdayHeaders = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    return weekdays.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + index);
      const isToday = date.toDateString() === new Date().toDateString();
      
      return (
        <div key={index} className="flex flex-col items-center p-2">
          <div className="flex flex-col items-center">
            <div className="text-sm text-text-light">{day}</div>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : ''}`}>
              {date.getDate()}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold">Event Calendar</h2>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search events..." 
              className="w-full sm:w-48 p-2 pl-8 text-sm border border-gray-200 rounded-md"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex bg-gray-100 rounded-md overflow-hidden">
            <button 
              className={`px-3 py-1.5 text-sm font-medium ${view === 'week' ? 'bg-primary text-white' : 'text-text-light hover:bg-gray-200'}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button 
              className={`px-3 py-1.5 text-sm font-medium ${view === 'month' ? 'bg-primary text-white' : 'text-text-light hover:bg-gray-200'}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
          </div>
          
          <button className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors">
            Add Event
          </button>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="font-medium">
          {formatDateRange()}
        </div>
        
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" onClick={getPreviousWeek}>
            ←
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" onClick={getNextWeek}>
            →
          </button>
        </div>
      </div>
      
      {view === 'week' && (
        <div className="relative grid grid-cols-8 h-[600px] overflow-y-auto">
          {/* Time column */}
          <div className="border-r border-gray-100 pt-6">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="h-16 pr-2 text-right text-xs text-text-light">
                {(i + 8) % 12 || 12}{i + 8 < 12 ? 'am' : 'pm'}
              </div>
            ))}
          </div>
          
          {/* Days columns */}
          {Array(7).fill(0).map((_, dayIndex) => {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(currentDay.getDate() + dayIndex);
            const isToday = currentDay.toDateString() === new Date().toDateString();
            
            return (
              <div key={dayIndex} className={`relative border-r border-gray-100 ${isToday ? 'bg-gray-50' : ''}`}>
                <div className="h-6 flex items-center justify-center text-xs font-medium border-b border-gray-100">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex]} {currentDay.getDate()}
                </div>
                
                {/* Time cells */}
                {Array(12).fill(0).map((_, hourIndex) => (
                  <div key={hourIndex} className="h-16 border-b border-gray-100"></div>
                ))}
                
                {/* Render events that fall on this day */}
                {events.map(event => {
                  const eventDate = new Date(event.start);
                  
                  // Only show events for the current day
                  if (eventDate.getDate() === currentDay.getDate() && 
                      eventDate.getMonth() === currentDay.getMonth() && 
                      eventDate.getFullYear() === currentDay.getFullYear()) {
                    
                    // Calculate position based on time
                    const startHour = eventDate.getHours() + eventDate.getMinutes() / 60;
                    const top = (startHour - 8) * 64 + 24; // 8am is start time, 64px is height of hour slot, 24px for header
                    
                    // Calculate duration
                    const endTime = new Date(event.end);
                    const durationHours = (endTime - eventDate) / (1000 * 60 * 60);
                    const height = durationHours * 64;
                    
                    // Determine background color based on event type
                    const bgColor = 
                      event.type === 'practice' ? 'bg-primary/10 border-l-4 border-primary' :
                      event.type === 'discussion' ? 'bg-secondary/10 border-l-4 border-secondary' :
                      'bg-accent/10 border-l-4 border-accent';
                    
                    return (
                      <div 
                        key={event.id}
                        className={`absolute left-0 right-0 mx-1 p-2 rounded shadow-sm ${bgColor} overflow-hidden z-10`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="text-xs text-text-light mb-1">
                          {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="font-medium text-sm truncate">{event.title}</div>
                        <div className="flex items-center mt-1">
                          <img src={`https://i.pravatar.cc/150?u=${event.instructor}`} alt={event.instructor} className="w-5 h-5 rounded-full mr-1" />
                          <span className="text-xs text-text-light truncate">{event.instructor}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            );
          })}
        </div>
      )}
      
      {view === 'month' && (
        <div className="calendar-month">
          <div className="grid grid-cols-7">
            {renderWeekdayHeaders()}
          </div>
          
          {/* Generate month grid - simplified version */}
          <div className="grid grid-cols-7 gap-px bg-gray-100">
            {Array(35).fill(0).map((_, i) => {
              const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const dayOffset = startOfMonth.getDay(); // 0 for Sunday
              const date = new Date(startOfMonth);
              date.setDate(1 - dayOffset + i);
              const isToday = date.toDateString() === new Date().toDateString();
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              
              return (
                <div 
                  key={i} 
                  className={`min-h-[100px] p-1 bg-white ${isCurrentMonth ? '' : 'text-gray-300'} ${isToday ? 'bg-primary/5' : ''}`}
                >
                  <div className={`text-xs p-1 ${isToday ? 'bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Show events for this day */}
                  <div className="mt-1">
                    {events.filter(event => {
                      const eventDate = new Date(event.start);
                      return eventDate.getDate() === date.getDate() && 
                             eventDate.getMonth() === date.getMonth() && 
                             eventDate.getFullYear() === date.getFullYear();
                    }).map(event => (
                      <div 
                        key={event.id} 
                        className={`text-xs p-1 mb-1 truncate rounded ${
                          event.type === 'practice' ? 'bg-primary/10 text-primary' :
                          event.type === 'discussion' ? 'bg-secondary/10 text-secondary' : 
                          'bg-accent/10 text-accent'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 