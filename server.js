const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sample data
let users = [
  { 
    id: 1, 
    username: 'johndoe', 
    email: 'john@example.com', 
    full_name: 'John Doe',
    bio: 'Sports enthusiast and team player',
    profile_image: 'https://via.placeholder.com/150?text=JD'
  }
];

let events = [
  {
    id: 1,
    title: 'Weekend Soccer Match',
    description: 'Casual soccer game for all skill levels',
    sport_type: 'Soccer',
    location: 'Central Park Field',
    start_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end_date: new Date(Date.now() + 86400000 + 7200000).toISOString(), // Tomorrow + 2 hours
    max_players: 14,
    current_players: 8,
    image_url: 'https://via.placeholder.com/800x400?text=Soccer+Match',
    creator: {
      id: 1,
      username: 'johndoe',
      profile_image: 'https://via.placeholder.com/150?text=JD'
    }
  },
  {
    id: 2,
    title: 'Basketball Tournament',
    description: 'Competitive 3v3 tournament with prizes',
    sport_type: 'Basketball',
    location: 'Community Center Court',
    start_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    end_date: new Date(Date.now() + 172800000 + 14400000).toISOString(), // Day after tomorrow + 4 hours
    max_players: 24,
    current_players: 15,
    image_url: 'https://via.placeholder.com/800x400?text=Basketball+Tournament',
    creator: {
      id: 1,
      username: 'johndoe',
      profile_image: 'https://via.placeholder.com/150?text=JD'
    }
  }
];

let discussions = [
  {
    id: 1,
    topic: 'Best soccer cleats for beginners',
    content: 'Looking for recommendations on affordable soccer cleats for beginners. Any suggestions?',
    created_at: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    user_id: 1,
    username: 'johndoe',
    comments_count: 5
  }
];

let notifications = [
  {
    id: 1,
    type: 'event_invite',
    content: 'You have been invited to "Weekend Soccer Match"',
    is_read: false,
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    target_id: 1,
    target_type: 'event'
  }
];

let settings = {
  pushNotifications: true,
  emailNotifications: true,
  eventReminders: true,
  messageNotifications: true,
  darkMode: false,
  privateProfile: false,
  showDistance: true,
  locationSharing: true,
  units: 'metric'
};

// Routes
// Auth routes
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple validation - normally you would validate credentials
  if (email && password) {
    const user = users.find(u => u.email === email);
    
    if (user) {
      return res.json({
        token: 'fake-jwt-token',
        user
      });
    }
  }
  
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/users/register', (req, res) => {
  const { username, email, password, full_name, bio } = req.body;
  
  // Simple validation - normally you would validate data
  if (username && email && password) {
    const newUser = {
      id: users.length + 1,
      username,
      email,
      full_name: full_name || '',
      bio: bio || '',
      profile_image: `https://via.placeholder.com/150?text=${username[0].toUpperCase()}`
    };
    
    users.push(newUser);
    
    return res.status(201).json({
      token: 'fake-jwt-token',
      user: newUser
    });
  }
  
  return res.status(400).json({ error: 'Invalid user data' });
});

// Events routes
app.get('/api/events', (req, res) => {
  return res.json({ events });
});

app.get('/api/events/:id', (req, res) => {
  const event = events.find(e => e.id === parseInt(req.params.id));
  
  if (event) {
    return res.json({ event });
  }
  
  return res.status(404).json({ error: 'Event not found' });
});

app.post('/api/events', (req, res) => {
  const { title, description, sport_type, location, start_date, end_date, max_players } = req.body;
  
  if (title && sport_type && location && start_date) {
    const newEvent = {
      id: events.length + 1,
      title,
      description: description || '',
      sport_type,
      location,
      start_date,
      end_date: end_date || new Date(new Date(start_date).getTime() + 7200000).toISOString(), // Default to +2 hours
      max_players: max_players || 10,
      current_players: 1,
      image_url: req.body.image_url || null,
      creator: {
        id: 1,
        username: 'johndoe',
        profile_image: 'https://via.placeholder.com/150?text=JD'
      }
    };
    
    events.push(newEvent);
    
    return res.status(201).json({ event: newEvent });
  }
  
  return res.status(400).json({ error: 'Invalid event data' });
});

// Notifications routes
app.get('/api/notifications', (req, res) => {
  return res.json({ notifications });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const notification = notifications.find(n => n.id === parseInt(req.params.id));
  
  if (notification) {
    notification.is_read = true;
    return res.json({ notification });
  }
  
  return res.status(404).json({ error: 'Notification not found' });
});

app.put('/api/notifications/read-all', (req, res) => {
  notifications.forEach(notification => {
    notification.is_read = true;
  });
  
  return res.json({ success: true });
});

// User settings routes
app.get('/api/users/settings', (req, res) => {
  return res.json({ settings });
});

app.put('/api/users/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  return res.json({ settings });
});

// Search routes
app.get('/api/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchQuery = query.toString().toLowerCase();
  
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery) || 
    event.description.toLowerCase().includes(searchQuery) ||
    event.location.toLowerCase().includes(searchQuery) ||
    event.sport_type.toLowerCase().includes(searchQuery)
  );
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery) || 
    user.full_name.toLowerCase().includes(searchQuery) ||
    user.bio.toLowerCase().includes(searchQuery)
  );
  
  const filteredDiscussions = discussions.filter(discussion => 
    discussion.topic.toLowerCase().includes(searchQuery) || 
    discussion.content.toLowerCase().includes(searchQuery)
  );
  
  return res.json({
    events: filteredEvents,
    users: filteredUsers,
    discussions: filteredDiscussions
  });
});

// Category-specific search routes
app.get('/api/search/events', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchQuery = query.toString().toLowerCase();
  
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery) || 
    event.description.toLowerCase().includes(searchQuery) ||
    event.location.toLowerCase().includes(searchQuery) ||
    event.sport_type.toLowerCase().includes(searchQuery)
  );
  
  return res.json({ events: filteredEvents });
});

app.get('/api/search/users', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchQuery = query.toString().toLowerCase();
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery) || 
    user.full_name.toLowerCase().includes(searchQuery) ||
    user.bio.toLowerCase().includes(searchQuery)
  );
  
  return res.json({ users: filteredUsers });
});

app.get('/api/search/discussions', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchQuery = query.toString().toLowerCase();
  
  const filteredDiscussions = discussions.filter(discussion => 
    discussion.topic.toLowerCase().includes(searchQuery) || 
    discussion.content.toLowerCase().includes(searchQuery)
  );
  
  return res.json({ discussions: filteredDiscussions });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 