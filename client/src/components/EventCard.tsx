import { Link } from 'react-router-dom';

interface EventProps {
  event: {
    id: number;
    title: string;
    sport_type: string;
    location: string;
    start_date: string;
    end_date: string;
    max_players: number;
    current_players: number;
    image_url?: string;
    creator_name: string;
  };
}

const EventCard = ({ event }: EventProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Default image if none provided
  const defaultImage = 'https://images.unsplash.com/photo-1517649763962-0c623066013b';

  return (
    <Link to={`/events/${event.id}`} className="event-card">
      <div 
        className="event-image"
        style={{ backgroundImage: `url(${event.image_url || defaultImage})` }}
      ></div>
      
      <div className="event-content">
        <div className="event-header">
          <h3 className="event-title">{event.title}</h3>
          <span className="sport-type">{event.sport_type}</span>
        </div>
        
        <div className="event-details">
          <div className="detail-row">
            <span className="detail-icon">📍</span>
            <span className="detail-text">{event.location}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-icon">📅</span>
            <span className="detail-text">
              {formatDate(event.start_date)} at {formatTime(event.start_date)}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-icon">👥</span>
            <span className="detail-text">
              {event.current_players}/{event.max_players} players
            </span>
          </div>
        </div>
        
        <div className="event-footer">
          <div className="host">
            <span>Hosted by</span>
            <strong>{event.creator_name}</strong>
          </div>
          <button className="view-details">View Details</button>
        </div>
      </div>
    </Link>
  );
};

export default EventCard; 