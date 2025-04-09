import { Request, Response } from 'express';
import db, { allAsync, getAsync } from '../db';

// Extend Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * Get top recommended sports events
 */
export const getTopCourses = async (req: AuthRequest, res: Response) => {
  try {
    // Changed SQL to fetch from events table instead of dashboard_courses
    const events = await allAsync(
      `SELECT e.id, e.title as name, e.description, e.sport_type, e.location, 
              strftime('%B %d, %Y', e.start_date) as date, 
              e.image_url as img_url,
              u.username as organizer, u.profile_image as organizer_avatar, 
              (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as total_participants
       FROM events e
       JOIN users u ON e.creator_id = u.id
       ORDER BY total_participants DESC 
       LIMIT 4`
    );
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Error getting top events:', error);
    res.status(500).json({ message: 'Failed to fetch top events' });
  }
};

/**
 * Get user events with participants
 */
export const getUserCourses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  try {
    // Changed to get user's events 
    const userEvents = await allAsync(
      `SELECT e.id, e.title, e.sport_type, 
              strftime('%B %d, %Y', e.start_date) as event_date, 
              strftime('%H:%M', e.start_date) as event_time, 
              e.image_url,
              (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as total_participants
       FROM events e
       WHERE e.creator_id = ? OR e.id IN (SELECT event_id FROM event_participants WHERE user_id = ?)
       ORDER BY e.start_date
       LIMIT 4`,
      [userId, userId]
    );
    
    // Get participants for each event
    const eventsWithParticipants = await Promise.all(
      userEvents.map(async (event: any) => {
        const participants = await allAsync(
          `SELECT u.id, u.profile_image 
           FROM event_participants ep
           JOIN users u ON ep.user_id = u.id
           WHERE ep.event_id = ?
           LIMIT 5`,
          [event.id]
        );
        
        return {
          ...event,
          participants: participants.map((p: any) => p.profile_image)
        };
      })
    );
    
    res.status(200).json(eventsWithParticipants);
  } catch (error) {
    console.error('Error getting user events:', error);
    res.status(500).json({ message: 'Failed to fetch user events' });
  }
};

/**
 * Get user statistics
 */
export const getUserStatistics = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  try {
    // Calculate statistics based on user's events and participation
    const eventsCreated = await getAsync(
      `SELECT COUNT(*) as count FROM events WHERE creator_id = ?`,
      [userId]
    );
    
    const eventsJoined = await getAsync(
      `SELECT COUNT(*) as count FROM event_participants WHERE user_id = ?`,
      [userId]
    );
    
    const discussionsCreated = await getAsync(
      `SELECT COUNT(*) as count FROM discussions WHERE creator_id = ?`,
      [userId]
    );
    
    const commentsPosted = await getAsync(
      `SELECT COUNT(*) as count FROM comments WHERE user_id = ?`,
      [userId]
    );
    
    // Format the response
    const formattedStats = {
      eventsCreated: {
        value: eventsCreated?.count || 0,
        change: '+10%' // For demo purposes
      },
      eventsJoined: {
        value: eventsJoined?.count || 0,
        change: '+15%' // For demo purposes
      },
      discussionsCreated: {
        value: discussionsCreated?.count || 0,
        change: '+5%' // For demo purposes
      },
      commentsPosted: {
        value: commentsPosted?.count || 0,
        change: '+20%' // For demo purposes
      }
    };
    
    res.status(200).json(formattedStats);
  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
};

/**
 * Get activity data for the past week
 */
export const getProductivityData = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  try {
    // Generate days of the week
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Generate some activity data based on events and discussions
    // In a real app, this would query events and discussions by day
    const eventsCreated = Array(7).fill(0).map(() => Math.floor(Math.random() * 2));
    const eventsJoined = Array(7).fill(0).map(() => Math.floor(Math.random() * 3));
    const discussionsParticipated = Array(7).fill(0).map(() => Math.floor(Math.random() * 4));
    
    // Format the response
    const formattedData = {
      days,
      eventsCreated,
      eventsJoined,
      discussionsParticipated
    };
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error getting activity data:', error);
    res.status(500).json({ message: 'Failed to fetch activity data' });
  }
};

/**
 * Get upcoming events
 */
export const getUpcomingEvents = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  try {
    // Get raw event data first to debug
    const rawEvents = await allAsync(
      `SELECT e.id, e.title, e.sport_type, e.start_date, e.end_date
       FROM events e
       WHERE e.start_date >= date('now')
       AND (e.creator_id = ? OR e.id IN (SELECT event_id FROM event_participants WHERE user_id = ?))
       ORDER BY e.start_date
       LIMIT 8`,
      [userId, userId]
    );
    
    console.log("RAW EVENTS FROM DATABASE:", JSON.stringify(rawEvents, null, 2));
    
    // Now get formatted events
    const events = await allAsync(
      `SELECT e.id, e.title, e.sport_type as type, 
              strftime('%B %d, %Y', e.start_date) as event_date, 
              strftime('%H:%M', e.start_date) as event_time,
              e.creator_id
       FROM events e
       WHERE e.start_date >= date('now')
       AND (e.creator_id = ? OR e.id IN (SELECT event_id FROM event_participants WHERE user_id = ?))
       ORDER BY e.start_date
       LIMIT 8`,
      [userId, userId]
    );
    
    console.log("FORMATTED EVENTS:", JSON.stringify(events, null, 2));
    
    // Fix any null event dates manually
    const fixedEvents = events.map((event, index) => {
      if (!event.event_date && rawEvents[index] && rawEvents[index].start_date) {
        // Manually format the date from the raw data
        const startDate = new Date(rawEvents[index].start_date);
        const options: Intl.DateTimeFormatOptions = { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        };
        event.event_date = startDate.toLocaleDateString('en-US', options);
        console.log(`Fixed null date for event ${event.id}: ${event.event_date}`);
      }
      return event;
    });
    
    res.status(200).json(fixedEvents);
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming events' });
  }
}; 