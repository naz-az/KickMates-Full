import sqlite3 from 'sqlite3';
import { resolve } from 'path';
import bcrypt from 'bcrypt';
import { exec } from 'child_process';
import { promisify } from 'util';
import db, { runAsync, getAsync } from './index';

const dbPath = resolve(__dirname, '../../../data/kickmates.db');

const execAsync = promisify(exec);

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Add this function before seedDatabase function
async function seedNotifications() {
  const notificationTypes = [
    'event_invite', 'event_update', 'event_reminder', 'comment', 
    'join_request', 'join_accepted', 'system'
  ];
  
  const usernames = [
    'john_doe', 'jane_smith', 'mike_johnson', 'sarah_williams', 'alex_rodriguez',
    'emily_chen', 'david_wilson', 'lisa_brown'
  ];
  
  // Create some notifications for different users
  for (let userId = 1; userId <= 5; userId++) {
    // Each user gets 3-5 random notifications
    const notificationCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < notificationCount; i++) {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      let content = '';
      let relatedId = null;
      let senderId = null;
      let senderImage = null;
      
      // Generate appropriate content based on notification type
      switch (type) {
        case 'event_invite':
          const inviter = Math.floor(Math.random() * 5) + 1;
          senderId = inviter;
          content = `${usernames[inviter - 1]} invited you to join their event!`;
          relatedId = Math.floor(Math.random() * 5) + 1; // Random event ID
          
          // Get sender image
          try {
            const sender = await getAsync('SELECT profile_image FROM users WHERE id = ?', [senderId]);
            if (sender) {
              senderImage = sender.profile_image;
            }
          } catch (err) {
            console.error('Error getting sender image:', err);
          }
          break;
          
        case 'event_update':
          content = 'An event you joined has been updated.';
          relatedId = Math.floor(Math.random() * 5) + 1; // Random event ID
          
          // Get event creator as sender
          try {
            const event = await getAsync('SELECT creator_id FROM events WHERE id = ?', [relatedId]);
            if (event) {
              senderId = event.creator_id;
              const sender = await getAsync('SELECT profile_image FROM users WHERE id = ?', [senderId]);
              if (sender) {
                senderImage = sender.profile_image;
              }
            }
          } catch (err) {
            console.error('Error getting event creator:', err);
          }
          break;
          
        case 'comment':
          const commenter = Math.floor(Math.random() * 5) + 1;
          senderId = commenter;
          content = `${usernames[commenter - 1]} commented on your event.`;
          relatedId = Math.floor(Math.random() * 5) + 1; // Random event ID
          
          // Get sender image
          try {
            const sender = await getAsync('SELECT profile_image FROM users WHERE id = ?', [senderId]);
            if (sender) {
              senderImage = sender.profile_image;
            }
          } catch (err) {
            console.error('Error getting sender image:', err);
          }
          break;
          
        case 'join_request':
          const requester = Math.floor(Math.random() * 5) + 1;
          senderId = requester;
          content = `${usernames[requester - 1]} requested to join your event.`;
          relatedId = Math.floor(Math.random() * 5) + 1; // Random event ID
          
          // Get sender image
          try {
            const sender = await getAsync('SELECT profile_image FROM users WHERE id = ?', [senderId]);
            if (sender) {
              senderImage = sender.profile_image;
            }
          } catch (err) {
            console.error('Error getting sender image:', err);
          }
          break;
          
        case 'join_accepted':
          const accepter = Math.floor(Math.random() * 5) + 1;
          senderId = accepter;
          content = `${usernames[accepter - 1]} accepted your request to join their event.`;
          relatedId = Math.floor(Math.random() * 5) + 1; // Random event ID
          
          // Get sender image
          try {
            const sender = await getAsync('SELECT profile_image FROM users WHERE id = ?', [senderId]);
            if (sender) {
              senderImage = sender.profile_image;
            }
          } catch (err) {
            console.error('Error getting sender image:', err);
          }
          break;
          
        default:
          content = 'You have a new notification.';
          // System notifications don't have a sender
      }
      
      // Create the notification
      const isRead = Math.random() > 0.7; // 30% chance of being unread
      
      await runAsync(
        `INSERT INTO notifications (
          user_id, type, content, related_id, sender_id, sender_image, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))`,
        [
          userId, 
          type, 
          content, 
          relatedId, 
          senderId, 
          senderImage,
          isRead ? 1 : 0,
          Math.floor(Math.random() * 36) // Random time in the last 36 hours
        ]
      );
    }
  }

  console.log('✅ Notifications created');
}

async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Clean up existing data - disable foreign keys
    await runAsync('PRAGMA foreign_keys = OFF');
    
    // Delete data in correct order (children first, then parents)
    await runAsync('DELETE FROM messages');
    await runAsync('DELETE FROM conversation_participants');
    await runAsync('DELETE FROM conversations');
    await runAsync('DELETE FROM notifications');
    await runAsync('DELETE FROM comment_votes');
    await runAsync('DELETE FROM comments');
    await runAsync('DELETE FROM discussion_votes');
    await runAsync('DELETE FROM discussions');
    await runAsync('DELETE FROM bookmarks');
    await runAsync('DELETE FROM event_participants');
    await runAsync('DELETE FROM events');
    await runAsync('DELETE FROM users');
    
    // Reset the autoincrement counters for all tables
    await runAsync('DELETE FROM sqlite_sequence');
    
    // Re-enable foreign keys
    await runAsync('PRAGMA foreign_keys = ON');
    
    console.log('✅ Cleared existing data');

    // Hash passwords
    const password1 = await hashPassword('password123');
    const password2 = await hashPassword('password456');
    const password3 = await hashPassword('password789');
    const password4 = await hashPassword('password321');
    const password5 = await hashPassword('password654');
    const password6 = await hashPassword('password987');
    const password7 = await hashPassword('password135');
    const password8 = await hashPassword('password246');

    // Insert users
    const users = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: password1,
        full_name: 'John Doe',
        bio: 'Sports enthusiast and football lover',
        profile_image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: password2,
        full_name: 'Jane Smith',
        bio: 'Tennis player and runner',
        profile_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
      },
      {
        username: 'mike_johnson',
        email: 'mike@example.com',
        password: password3,
        full_name: 'Mike Johnson',
        bio: 'Basketball coach and player',
        profile_image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5'
      },
      {
        username: 'sarah_williams',
        email: 'sarah@example.com',
        password: password4,
        full_name: 'Sarah Williams',
        bio: 'Yoga instructor with 5 years of experience',
        profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
      },
      {
        username: 'alex_rodriguez',
        email: 'alex@example.com',
        password: password5,
        full_name: 'Alex Rodriguez',
        bio: 'Former college soccer player, now weekend warrior',
        profile_image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79'
      },
      {
        username: 'emily_chen',
        email: 'emily@example.com',
        password: password6,
        full_name: 'Emily Chen',
        bio: 'Swimming enthusiast and triathlete',
        profile_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
      },
      {
        username: 'david_wilson',
        email: 'david@example.com',
        password: password7,
        full_name: 'David Wilson',
        bio: 'Rugby player and fitness coach',
        profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
      },
      {
        username: 'lisa_brown',
        email: 'lisa@example.com',
        password: password8,
        full_name: 'Lisa Brown',
        bio: 'Volleyball player since high school',
        profile_image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956'
      }
    ];

    // Insert users
    for (const user of users) {
      await runAsync(
        `INSERT INTO users (username, email, password, full_name, bio, profile_image) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.username, user.email, user.password, user.full_name, user.bio, user.profile_image]
      );
    }
    console.log('✅ Sample users created');

    // Insert events
    const events = [
      {
        creator_id: 1,
        title: 'Weekend Football Match',
        description: 'Friendly football match at the local park. All skill levels welcome!',
        sport_type: 'Football',
        location: 'Central Park, New York',
        start_date: '2025-05-15 14:00:00',
        end_date: '2025-05-15 16:00:00',
        max_players: 14,
        current_players: 5,
        image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55'
      },
      {
        creator_id: 2,
        title: 'Tennis Tournament',
        description: 'Singles tennis tournament, intermediate to advanced players.',
        sport_type: 'Tennis',
        location: 'Richmond Tennis Club',
        start_date: '2025-06-10 10:00:00',
        end_date: '2025-06-10 18:00:00',
        max_players: 8,
        current_players: 4,
        image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
      },
      {
        creator_id: 3,
        title: 'Basketball Pickup Game',
        description: 'Thursday night basketball pickup game. First come, first play!',
        sport_type: 'Basketball',
        location: 'Downtown Community Center',
        start_date: '2025-05-20 19:00:00',
        end_date: '2025-05-20 21:00:00',
        max_players: 10,
        current_players: 6,
        image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
      },
      {
        creator_id: 1,
        title: 'Morning Yoga Session',
        description: 'Start your day with a revitalizing yoga session. Suitable for beginners.',
        sport_type: 'Yoga',
        location: 'Sunrise Yoga Studio',
        start_date: '2025-05-18 07:00:00',
        end_date: '2025-05-18 08:30:00',
        max_players: 15,
        current_players: 8,
        image_url: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b'
      },
      {
        creator_id: 4,
        title: 'Advanced Yoga Workshop',
        description: 'Intensive yoga workshop focusing on advanced poses and breathing techniques.',
        sport_type: 'Yoga',
        location: 'Harmony Yoga Center',
        start_date: '2025-05-25 09:00:00',
        end_date: '2025-05-25 11:30:00',
        max_players: 12,
        current_players: 6,
        image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773'
      },
      {
        creator_id: 5,
        title: 'Sunday Soccer League',
        description: 'Competitive soccer league matches every Sunday. Team registration required.',
        sport_type: 'Football',
        location: 'Riverside Fields',
        start_date: '2025-06-01 13:00:00',
        end_date: '2025-06-01 16:00:00',
        max_players: 22,
        current_players: 15,
        image_url: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c'
      },
      {
        creator_id: 6,
        title: 'Triathlon Training Group',
        description: 'Weekly training sessions for triathletes of all levels. Bring your own equipment.',
        sport_type: 'Triathlon',
        location: 'City Sports Complex',
        start_date: '2025-05-22 06:30:00',
        end_date: '2025-05-22 08:30:00',
        max_players: 20,
        current_players: 10,
        image_url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba'
      },
      {
        creator_id: 7,
        title: 'Rugby Practice Match',
        description: 'Practice match for rugby enthusiasts. Protective gear recommended.',
        sport_type: 'Rugby',
        location: 'University Sports Field',
        start_date: '2025-05-23 15:00:00',
        end_date: '2025-05-23 17:00:00',
        max_players: 30,
        current_players: 20,
        image_url: 'https://images.unsplash.com/photo-1485426337939-af69cf101909?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
      },
      {
        creator_id: 8,
        title: 'Volleyball Beach Tournament',
        description: 'Beach volleyball tournament with prizes for winners. Teams of 2-3 players.',
        sport_type: 'Volleyball',
        location: 'Seaside Beach',
        start_date: '2025-06-15 11:00:00',
        end_date: '2025-06-15 18:00:00',
        max_players: 24,
        current_players: 12,
        image_url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1'
      },
      {
        creator_id: 2,
        title: 'Pickleball Tournament',
        description: 'Join our exciting pickleball tournament for all skill levels! Paddles will be provided for beginners.',
        sport_type: 'Pickleball',
        location: 'Community Recreation Center',
        start_date: '2025-06-25 13:00:00',
        end_date: '2025-06-25 17:00:00',
        max_players: 16,
        current_players: 8,
        image_url: 'https://images.unsplash.com/photo-1629901925121-8a141c2a42f4'
      }
    ];

    // Insert events
    for (const event of events) {
      await runAsync(
        `INSERT INTO events (creator_id, title, description, sport_type, location, start_date, end_date, max_players, current_players, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.creator_id,
          event.title,
          event.description,
          event.sport_type,
          event.location,
          event.start_date,
          event.end_date,
          event.max_players,
          event.current_players,
          event.image_url
        ]
      );
    }
    console.log('✅ Sample events created');

    // Insert participants
    const participants = [
      { event_id: 1, user_id: 1, status: 'confirmed' },
      { event_id: 1, user_id: 2, status: 'confirmed' },
      { event_id: 1, user_id: 3, status: 'confirmed' },
      { event_id: 1, user_id: 5, status: 'waiting' },
      
      { event_id: 2, user_id: 2, status: 'confirmed' },
      { event_id: 2, user_id: 3, status: 'confirmed' },
      { event_id: 2, user_id: 6, status: 'confirmed' },
      { event_id: 2, user_id: 8, status: 'waiting' },
      
      { event_id: 3, user_id: 3, status: 'confirmed' },
      { event_id: 3, user_id: 1, status: 'confirmed' },
      { event_id: 3, user_id: 4, status: 'confirmed' },
      { event_id: 3, user_id: 8, status: 'confirmed' },
      { event_id: 3, user_id: 7, status: 'waiting' },
      
      { event_id: 4, user_id: 1, status: 'confirmed' },
      { event_id: 4, user_id: 4, status: 'confirmed' },
      { event_id: 4, user_id: 6, status: 'confirmed' },
      { event_id: 4, user_id: 8, status: 'confirmed' },
      { event_id: 4, user_id: 2, status: 'waiting' },
      
      { event_id: 5, user_id: 4, status: 'confirmed' },
      { event_id: 5, user_id: 6, status: 'confirmed' },
      { event_id: 5, user_id: 8, status: 'confirmed' },
      { event_id: 5, user_id: 2, status: 'waiting' },
      
      { event_id: 6, user_id: 5, status: 'confirmed' },
      { event_id: 6, user_id: 1, status: 'confirmed' },
      { event_id: 6, user_id: 3, status: 'confirmed' },
      { event_id: 6, user_id: 7, status: 'confirmed' },
      { event_id: 6, user_id: 2, status: 'waiting' },
      { event_id: 6, user_id: 4, status: 'waiting' },
      
      { event_id: 7, user_id: 6, status: 'confirmed' },
      { event_id: 7, user_id: 2, status: 'confirmed' },
      { event_id: 7, user_id: 4, status: 'confirmed' },
      { event_id: 7, user_id: 8, status: 'confirmed' },
      { event_id: 7, user_id: 3, status: 'waiting' },
      
      { event_id: 8, user_id: 7, status: 'confirmed' },
      { event_id: 8, user_id: 1, status: 'confirmed' },
      { event_id: 8, user_id: 3, status: 'confirmed' },
      { event_id: 8, user_id: 5, status: 'confirmed' },
      { event_id: 8, user_id: 2, status: 'waiting' },
      
      { event_id: 9, user_id: 8, status: 'confirmed' },
      { event_id: 9, user_id: 2, status: 'confirmed' },
      { event_id: 9, user_id: 4, status: 'confirmed' },
      { event_id: 9, user_id: 6, status: 'waiting' },
      
      { event_id: 10, user_id: 2, status: 'confirmed' },
      { event_id: 10, user_id: 4, status: 'confirmed' },
      { event_id: 10, user_id: 6, status: 'confirmed' },
      { event_id: 10, user_id: 8, status: 'waiting' }
    ];

    // Insert participants
    for (const participant of participants) {
      await runAsync(
        `INSERT INTO event_participants (event_id, user_id, status)
         VALUES (?, ?, ?)`,
        [participant.event_id, participant.user_id, participant.status]
      );
    }
    console.log('✅ Sample event participants created');

    // Insert comments
    const comments = [
      { event_id: 1, user_id: 2, content: "Looking forward to this match!", thumbs_up: 3, thumbs_down: 0 },
      { event_id: 1, user_id: 3, content: "Should we bring our own balls?", thumbs_up: 1, thumbs_down: 0 },
      { event_id: 1, user_id: 1, content: "Yes, please bring a ball if you have one.", parent_comment_id: 2, thumbs_up: 2, thumbs_down: 0 },
      { event_id: 1, user_id: 5, content: "What time should we arrive for warm-up?", thumbs_up: 0, thumbs_down: 0 },
      
      { event_id: 2, user_id: 3, content: "What's the prize for the winner?", thumbs_up: 4, thumbs_down: 0 },
      { event_id: 2, user_id: 2, content: "The winner gets a trophy and a $50 gift card to the pro shop.", parent_comment_id: 5, thumbs_up: 2, thumbs_down: 0 },
      { event_id: 2, user_id: 6, content: "Will there be refreshments provided?", thumbs_up: 2, thumbs_down: 0 },
      
      { event_id: 3, user_id: 1, content: "Is there parking available nearby?", thumbs_up: 0, thumbs_down: 0 },
      { event_id: 3, user_id: 3, content: "Yes, there's a parking lot right next to the center.", parent_comment_id: 8, thumbs_up: 1, thumbs_down: 0 },
      { event_id: 3, user_id: 4, content: "Are we playing full or half court?", thumbs_up: 2, thumbs_down: 0 },
      { event_id: 3, user_id: 3, content: "Full court, 5-on-5 games.", parent_comment_id: 10, thumbs_up: 3, thumbs_down: 0 },
      
      { event_id: 4, user_id: 2, content: "Should we bring our own yoga mats?", thumbs_up: 3, thumbs_down: 0 },
      { event_id: 4, user_id: 1, content: "Mats are provided, but feel free to bring your own if preferred.", parent_comment_id: 12, thumbs_up: 4, thumbs_down: 0 },
      { event_id: 4, user_id: 4, content: "Is this suitable for someone who has never done yoga before?", thumbs_up: 1, thumbs_down: 0 },
      
      { event_id: 5, user_id: 6, content: "I've been practicing yoga for a year. Is this session going to be challenging enough?", thumbs_up: 1, thumbs_down: 0 },
      { event_id: 5, user_id: 4, content: "Definitely! We'll be working on advanced inversions and arm balances.", parent_comment_id: 15, thumbs_up: 2, thumbs_down: 0 },
      { event_id: 5, user_id: 8, content: "Should I bring any props like blocks or straps?", thumbs_up: 0, thumbs_down: 0 },
      
      { event_id: 6, user_id: 1, content: "How many players per team?", thumbs_up: 3, thumbs_down: 0 },
      { event_id: 6, user_id: 5, content: "We'll be playing 11-a-side with standard rules.", parent_comment_id: 18, thumbs_up: 2, thumbs_down: 0 },
      { event_id: 6, user_id: 3, content: "Are cleats required?", thumbs_up: 1, thumbs_down: 0 },
      
      { event_id: 7, user_id: 2, content: "Will there be coaches available to give tips?", thumbs_up: 2, thumbs_down: 0 },
      { event_id: 7, user_id: 6, content: "Yes, I'll be there along with two other experienced triathletes to provide guidance.", parent_comment_id: 21, thumbs_up: 3, thumbs_down: 0 },
      { event_id: 7, user_id: 4, content: "What equipment should I bring?", thumbs_up: 1, thumbs_down: 0 },
      
      { event_id: 8, user_id: 1, content: "Is this touch or full contact rugby?", thumbs_up: 3, thumbs_down: 0 },
      { event_id: 8, user_id: 7, content: "This is full contact, so mouth guards and proper boots are essential.", parent_comment_id: 24, thumbs_up: 4, thumbs_down: 0 },
      { event_id: 8, user_id: 3, content: "Will you be splitting teams based on experience?", thumbs_up: 1, thumbs_down: 0 },
      
      { event_id: 9, user_id: 2, content: "What's the format of the tournament?", thumbs_up: 2, thumbs_down: 0 },
      { event_id: 9, user_id: 8, content: "Round robin followed by elimination rounds for the top teams.", parent_comment_id: 27, thumbs_up: 3, thumbs_down: 0 },
      { event_id: 9, user_id: 4, content: "Will the nets be regulation height?", thumbs_up: 0, thumbs_down: 0 },
      
      { event_id: 10, user_id: 4, content: "Are paddles provided or should we bring our own?", thumbs_up: 1, thumbs_down: 0 },
      { event_id: 10, user_id: 2, content: "Paddles will be provided, but you can bring your own if you prefer.", parent_comment_id: 30, thumbs_up: 2, thumbs_down: 0 }
    ];

    // Insert comments
    for (const comment of comments) {
      await runAsync(
        `INSERT INTO comments (event_id, user_id, content, parent_comment_id, thumbs_up, thumbs_down) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [comment.event_id, comment.user_id, comment.content, comment.parent_comment_id || null, comment.thumbs_up || 0, comment.thumbs_down || 0]
      );
    }
    console.log('✅ Sample comments created');

    // Insert comment votes
    const commentVotes = [
      { comment_id: 1, user_id: 3, vote_type: 'up' },
      { comment_id: 1, user_id: 4, vote_type: 'up' },
      { comment_id: 1, user_id: 5, vote_type: 'up' },
      { comment_id: 2, user_id: 1, vote_type: 'up' },
      { comment_id: 3, user_id: 4, vote_type: 'up' },
      { comment_id: 3, user_id: 5, vote_type: 'up' },
      { comment_id: 5, user_id: 1, vote_type: 'up' },
      { comment_id: 5, user_id: 5, vote_type: 'up' },
      { comment_id: 5, user_id: 7, vote_type: 'up' },
      { comment_id: 5, user_id: 2, vote_type: 'up' },
      { comment_id: 6, user_id: 1, vote_type: 'up' },
      { comment_id: 6, user_id: 3, vote_type: 'up' },
      { comment_id: 10, user_id: 1, vote_type: 'up' },
      { comment_id: 10, user_id: 5, vote_type: 'up' },
      { comment_id: 12, user_id: 1, vote_type: 'up' },
      { comment_id: 12, user_id: 3, vote_type: 'up' },
      { comment_id: 12, user_id: 7, vote_type: 'up' },
      { comment_id: 15, user_id: 4, vote_type: 'up' },
      { comment_id: 18, user_id: 1, vote_type: 'up' },
      { comment_id: 18, user_id: 3, vote_type: 'up' },
      { comment_id: 18, user_id: 4, vote_type: 'up' }
    ];

    // Insert comment votes
    for (const vote of commentVotes) {
      try {
        await runAsync(
          `INSERT INTO comment_votes (comment_id, user_id, vote_type) 
           VALUES (?, ?, ?)`,
          [vote.comment_id, vote.user_id, vote.vote_type]
        );
      } catch (error) {
        // Skip duplicate votes that violate the UNIQUE constraint
        if (!(error instanceof Error && error.message.includes('UNIQUE constraint failed'))) {
          throw error;
        }
      }
    }
    console.log('✅ Sample comment votes created');

    // Insert bookmarks
    const bookmarks = [
      { event_id: 2, user_id: 1 },
      { event_id: 3, user_id: 2 },
      { event_id: 4, user_id: 3 },
      { event_id: 5, user_id: 4 },
      { event_id: 6, user_id: 5 },
      { event_id: 7, user_id: 6 },
      { event_id: 8, user_id: 7 },
      { event_id: 9, user_id: 8 },
      { event_id: 10, user_id: 1 },
      { event_id: 1, user_id: 2 },
      { event_id: 2, user_id: 3 },
      { event_id: 3, user_id: 4 },
      { event_id: 4, user_id: 5 },
      { event_id: 5, user_id: 6 },
      { event_id: 6, user_id: 7 }
    ];

    // Insert bookmarks
    for (const bookmark of bookmarks) {
      await runAsync(
        `INSERT INTO bookmarks (event_id, user_id) 
         VALUES (?, ?)`,
        [bookmark.event_id, bookmark.user_id]
      );
    }
    console.log('✅ Sample bookmarks created');

    // Create sample notifications
    const notifications = [
      // User 1 (John) notifications
      { user_id: 1, type: 'event_invite', content: "Jane Smith has invited you to join Tennis Tournament", related_id: 2, is_read: 0, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { user_id: 1, type: 'event_update', content: "Weekend Football Match location has been updated to Central Park North", related_id: 1, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      { user_id: 1, type: 'join_request', content: "Alex Rodriguez wants to join your Weekend Football Match", related_id: 1, is_read: 0, created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },

      // User 2 (Jane) notifications
      { user_id: 2, type: 'event_invite', content: "John Doe has invited you to join Weekend Football Match", related_id: 1, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
      { user_id: 2, type: 'event_update', content: "Tennis Tournament time has been changed to 11:00 AM", related_id: 2, is_read: 0, created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
      { user_id: 2, type: 'join_accepted', content: "Your request to join Weekend Football Match has been accepted", related_id: 1, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString() },

      // User 3 (Mike) notifications
      { user_id: 3, type: 'event_invite', content: "John Doe has invited you to join Weekend Football Match", related_id: 1, is_read: 0, created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString() },
      { user_id: 3, type: 'event_update', content: "Basketball Pickup Game duration has been extended by 1 hour", related_id: 3, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
      { user_id: 3, type: 'system', content: "Your account has been verified successfully", related_id: null, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },

      // User 4 (Sarah) notifications
      { user_id: 4, type: 'event_invite', content: "Mike Johnson has invited you to join Basketball Pickup Game", related_id: 3, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() },
      { user_id: 4, type: 'event_update', content: "Morning Yoga Session has been moved to a different studio", related_id: 4, is_read: 0, created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
      { user_id: 4, type: 'join_accepted', content: "Your request to join Tennis Tournament has been accepted", related_id: 2, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },

      // User 5 (Alex) notifications
      { user_id: 5, type: 'event_invite', content: "Sarah Williams has invited you to join Morning Yoga Session", related_id: 4, is_read: 0, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      { user_id: 5, type: 'event_update', content: "Weekly Soccer Game has been postponed due to rain", related_id: 5, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
      { user_id: 5, type: 'join_accepted', content: "Your request to join Weekend Football Match has been accepted", related_id: 1, is_read: 1, created_at: new Date(Date.now() - 1000 * 60 * 85).toISOString() }
    ];

    // Insert notifications
    for (const notification of notifications) {
      await runAsync(
        `INSERT INTO notifications (user_id, type, content, related_id, is_read, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [notification.user_id, notification.type, notification.content, notification.related_id, notification.is_read, notification.created_at]
      );
    }
    console.log('✅ Sample notifications created with detailed timestamps');

    // Create sample conversations
    const conversations = [
      { id: 1, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
      { id: 2, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() },
      { id: 3, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
      { id: 4, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() }
    ];

    // Insert conversations
    for (const conversation of conversations) {
      await runAsync(
        `INSERT INTO conversations (id, created_at)
         VALUES (?, ?)`,
        [conversation.id, conversation.created_at]
      );
    }
    console.log('✅ Sample conversations created');

    // Create sample conversation participants
    const conversationParticipants = [
      // Weekend Football Match participants (Event conversation)
      { conversation_id: 1, user_id: 1, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() }, // John (creator)
      { conversation_id: 1, user_id: 2, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 71).toISOString() }, // Jane
      { conversation_id: 1, user_id: 3, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString() }, // Mike
      
      // Tennis Tournament participants (Event conversation)
      { conversation_id: 2, user_id: 2, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() }, // Jane (creator)
      { conversation_id: 2, user_id: 1, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString() }, // John
      { conversation_id: 2, user_id: 4, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString() }, // Sarah
      
      // John and Jane (Private conversation)
      { conversation_id: 3, user_id: 1, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() }, // John
      { conversation_id: 3, user_id: 2, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() }, // Jane
      
      // Soccer Team (Group conversation)
      { conversation_id: 4, user_id: 1, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString() }, // John (admin)
      { conversation_id: 4, user_id: 3, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 167).toISOString() }, // Mike
      { conversation_id: 4, user_id: 5, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 166).toISOString() }, // Alex
      { conversation_id: 4, user_id: 6, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 165).toISOString() }  // Emily
    ];
    
    // Insert conversation participants
    for (const participant of conversationParticipants) {
      await runAsync(
        `INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
         VALUES (?, ?, ?)`,
        [participant.conversation_id, participant.user_id, participant.joined_at]
      );
    }
    console.log('✅ Sample conversation participants created');

    // Create sample messages
    const messages = [
      // Weekend Football Match messages
      { id: 1, conversation_id: 1, sender_id: 1, content: "Welcome everyone to the Weekend Football Match chat!", created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
      { id: 2, conversation_id: 1, sender_id: 2, content: "Thanks for organizing this, John! I'm looking forward to it.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 71).toISOString() },
      { id: 3, conversation_id: 1, sender_id: 3, content: "Should we bring our own equipment or will it be provided?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 69).toISOString() },
      { id: 4, conversation_id: 1, sender_id: 1, content: "Please bring your own cleats if you have them. Balls will be provided.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 68).toISOString() },
      { id: 5, conversation_id: 1, sender_id: 2, content: "Weather forecast says it might rain. Do we have a backup plan?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() },
      
      // Tennis Tournament messages
      { id: 6, conversation_id: 2, sender_id: 2, content: "Welcome to the Tennis Tournament chat! This is where we'll coordinate details.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
      { id: 7, conversation_id: 2, sender_id: 1, content: "Thanks for organizing, Jane! What format will the tournament be?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString() },
      { id: 8, conversation_id: 2, sender_id: 2, content: "We'll do a round-robin format so everyone gets to play multiple matches.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString() },
      { id: 9, conversation_id: 2, sender_id: 4, content: "Should we bring extra tennis balls?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 45).toISOString() },
      { id: 10, conversation_id: 2, sender_id: 2, content: "I'll provide the balls, but feel free to bring your own racket if you prefer.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString() },
      
      // John and Jane (Private conversation)
      { id: 11, conversation_id: 3, sender_id: 1, content: "Hey Jane, are you ready for the football match this weekend?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() },
      { id: 12, conversation_id: 3, sender_id: 2, content: "Absolutely! I've been practicing my passes.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 119).toISOString() },
      { id: 13, conversation_id: 3, sender_id: 1, content: "That's great! By the way, can you help coordinate the refreshments?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 118).toISOString() },
      { id: 14, conversation_id: 3, sender_id: 2, content: "Sure thing. I'll bring some water bottles and energy bars.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 117).toISOString() },
      { id: 15, conversation_id: 3, sender_id: 1, content: "Perfect! Thanks for your help.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 116).toISOString() },
      
      // Soccer Team (Group conversation)
      { id: 16, conversation_id: 4, sender_id: 1, content: "Welcome to our soccer team chat! This is where we'll coordinate practices and games.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString() },
      { id: 17, conversation_id: 4, sender_id: 3, content: "Thanks for setting this up, John! When's our first practice?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 167).toISOString() },
      { id: 18, conversation_id: 4, sender_id: 1, content: "Our first practice is next Tuesday at 6 PM at Memorial Field.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 166).toISOString() },
      { id: 19, conversation_id: 4, sender_id: 5, content: "I'll be there! Should we bring anything specific?", created_at: new Date(Date.now() - 1000 * 60 * 60 * 165).toISOString() },
      { id: 20, conversation_id: 4, sender_id: 1, content: "Just cleats, shin guards, and water. I'll bring the balls and cones.", created_at: new Date(Date.now() - 1000 * 60 * 60 * 164).toISOString() }
    ];

    // Insert messages
    for (const message of messages) {
      await runAsync(
        `INSERT INTO messages (id, conversation_id, sender_id, content, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [message.id, message.conversation_id, message.sender_id, message.content, message.created_at]
      );
    }
    console.log('✅ Sample messages created');

    // Insert dashboard related data
    try {
      // Create dashboard_courses table
      await runAsync(`
        CREATE TABLE IF NOT EXISTS dashboard_courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          instructor TEXT NOT NULL,
          instructor_avatar TEXT NOT NULL,
          level TEXT NOT NULL,
          rating REAL NOT NULL,
          attendees INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create user_courses table
      await runAsync(`
        CREATE TABLE IF NOT EXISTS user_courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          sessions_completed INTEGER NOT NULL,
          total_sessions INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create course_participants table
      await runAsync(`
        CREATE TABLE IF NOT EXISTS course_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES user_courses (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create user_statistics table
      await runAsync(`
        CREATE TABLE IF NOT EXISTS user_statistics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          score_change TEXT NOT NULL,
          completed_hours INTEGER NOT NULL,
          completed_hours_change TEXT NOT NULL,
          total_students INTEGER NOT NULL,
          total_students_change TEXT NOT NULL,
          total_hours INTEGER NOT NULL,
          total_hours_change TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create productivity_data table
      await runAsync(`
        CREATE TABLE IF NOT EXISTS productivity_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          day TEXT NOT NULL,
          mentoring INTEGER NOT NULL,
          self_improve INTEGER NOT NULL,
          student INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create upcoming_events table
      await runAsync(`
        CREATE TABLE IF NOT EXISTS upcoming_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          event_date TEXT NOT NULL,
          event_time TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Seed dashboard_courses
      const dashboardCourses = [
        {
          title: 'Three-month Course to Learn the Basics of Soccer and Start Playing',
          instructor: 'Alison Walsh',
          instructor_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
          level: 'Beginner',
          rating: 5.0,
          attendees: 118,
          image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55'
        },
        {
          title: 'Beginner\'s Guide to Team Sports: Basketball & More',
          instructor: 'Patty Kutch',
          instructor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          level: 'Beginner',
          rating: 4.8,
          attendees: 234,
          image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc'
        },
        {
          title: 'Introduction: Proper Training Techniques and Practice',
          instructor: 'Alonzo Murray',
          instructor_avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5',
          level: 'Intermediate',
          rating: 4.9,
          attendees: 57,
          image_url: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b'
        },
        {
          title: 'Advanced Training Methods and Techniques',
          instructor: 'Gregory Harris',
          instructor_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
          level: 'Advanced',
          rating: 5.0,
          attendees: 19,
          image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9'
        }
      ];

      for (const course of dashboardCourses) {
        await runAsync(
          `INSERT INTO dashboard_courses (
            title, instructor, instructor_avatar, level, rating, attendees, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            course.title,
            course.instructor,
            course.instructor_avatar,
            course.level,
            course.rating,
            course.attendees,
            course.image_url
          ]
        );
      }
      console.log('✅ Dashboard courses created');

      // Seed user_courses for user 1
      const userCourses = [
        {
          user_id: 1,
          title: 'Football Training',
          sessions_completed: 9,
          total_sessions: 12,
          image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55'
        },
        {
          user_id: 1,
          title: 'Basketball Skills',
          sessions_completed: 16,
          total_sessions: 24,
          image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc'
        },
        {
          user_id: 1,
          title: 'Training Techniques',
          sessions_completed: 11,
          total_sessions: 18,
          image_url: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b'
        },
        {
          user_id: 1,
          title: 'Team Development',
          sessions_completed: 18,
          total_sessions: 37,
          image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9'
        }
      ];

      for (const course of userCourses) {
        const result = await runAsync(
          `INSERT INTO user_courses (
            user_id, title, sessions_completed, total_sessions, image_url
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            course.user_id,
            course.title,
            course.sessions_completed,
            course.total_sessions,
            course.image_url
          ]
        );
        
        // Add participants to each course
        const participants = [1, 2, 3, 4, 5, 6].slice(0, Math.floor(Math.random() * 3) + 3);
        
        for (const participant of participants) {
          await runAsync(
            `INSERT INTO course_participants (course_id, user_id) VALUES (?, ?)`,
            [result.lastID, participant]
          );
        }
      }
      console.log('✅ User courses and participants created');

      // Seed user_statistics for user 1
      await runAsync(
        `INSERT INTO user_statistics (
          user_id, score, score_change, completed_hours, completed_hours_change,
          total_students, total_students_change, total_hours, total_hours_change
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 210, '+15%', 34, '+15%', 17, '-2%', 11, '-9%']
      );
      console.log('✅ User statistics created');

      // Seed productivity_data for user 1
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const mentoring = [25, 75, 25, 25, 25, 0, 25];
      const selfImprove = [50, 90, 50, 50, 50, 25, 50];
      const student = [75, 90, 75, 75, 75, 50, 90];

      for (let i = 0; i < days.length; i++) {
        await runAsync(
          `INSERT INTO productivity_data (
            user_id, day, mentoring, self_improve, student
          ) VALUES (?, ?, ?, ?, ?)`,
          [1, days[i], mentoring[i], selfImprove[i], student[i]]
        );
      }
      console.log('✅ Productivity data created');

      // Seed upcoming_events for user 1
      const upcomingEvents = [
        {
          user_id: 1,
          title: 'Business Prospect Analysis',
          type: 'Course',
          event_date: 'April 25',
          event_time: '11:00-12:00'
        },
        {
          user_id: 1,
          title: 'AI & Virtual Reality: Intro',
          type: 'Tutoring',
          event_date: 'April 27',
          event_time: '14:30-15:30'
        }
      ];

      for (const event of upcomingEvents) {
        await runAsync(
          `INSERT INTO upcoming_events (
            user_id, title, type, event_date, event_time
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            event.user_id,
            event.title,
            event.type,
            event.event_date,
            event.event_time
          ]
        );
      }
      console.log('✅ Upcoming events created');
      
      // Insert discussions
      const discussions = [
        {
          title: 'Best basketball shoes for outdoor courts?',
          content: 'I\'ve been playing outdoor basketball a lot lately and my shoes are starting to fall apart. What are your recommendations for durable outdoor basketball shoes with good grip and ankle support?',
          category: 'Basketball',
          creator_id: 1,
          votes_up: 15,
          votes_down: 2,
          image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc'
        },
        {
          title: 'Running group meetups in downtown area',
          content: 'Hey runners! I\'m looking to start a regular running group in the downtown area. Thinking of meeting 3 times a week (Mon/Wed/Fri) around 6pm for a 5K run. Would anyone be interested in joining? Let me know what you think about the schedule too.',
          category: 'Running',
          creator_id: 2,
          votes_up: 23,
          votes_down: 0,
          image_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5'
        },
        {
          title: 'Tennis court conditions after the rain',
          content: 'Has anyone checked out the public tennis courts at Central Park after all the rain we got this week? Wondering if they\'re playable yet or still too wet. Planning to play this weekend.',
          category: 'Tennis',
          creator_id: 3,
          votes_up: 8,
          votes_down: 1,
          image_url: null
        },
        {
          title: 'Best Pickleball paddles for beginners',
          content: 'I just started playing pickleball and am looking for recommendations on good paddles for beginners. Any suggestions from experienced players?',
          category: 'Pickleball',
          creator_id: 6,
          votes_up: 8,
          votes_down: 1,
          image_url: 'https://images.unsplash.com/photo-1672251564655-ec37e6ebc4a8'
        }
      ];

      // Insert discussions
      for (const discussion of discussions) {
        await runAsync(
          `INSERT INTO discussions (title, content, category, creator_id, votes_up, votes_down, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [discussion.title, discussion.content, discussion.category, discussion.creator_id, 
           discussion.votes_up, discussion.votes_down, discussion.image_url]
        );
      }
      console.log('✅ Sample discussions created');

      // Insert discussion votes
      const discussionVotes = [
        { discussion_id: 1, user_id: 2, vote_type: 'up' },
        { discussion_id: 1, user_id: 3, vote_type: 'up' },
        { discussion_id: 2, user_id: 1, vote_type: 'up' },
        { discussion_id: 2, user_id: 3, vote_type: 'up' },
        { discussion_id: 3, user_id: 1, vote_type: 'up' },
        { discussion_id: 3, user_id: 2, vote_type: 'down' },
        { discussion_id: 4, user_id: 1, vote_type: 'up' },
        { discussion_id: 4, user_id: 2, vote_type: 'up' }
      ];

      for (const vote of discussionVotes) {
        await runAsync(
          `INSERT INTO discussion_votes (discussion_id, user_id, vote_type)
          VALUES (?, ?, ?)`,
          [vote.discussion_id, vote.user_id, vote.vote_type]
        );
      }
      console.log('✅ Sample discussion votes created');

      // Insert discussion comments
      const discussionComments = [
        {
          discussion_id: 1,
          user_id: 2,
          content: 'I really like the Nike Lebron Witness series for outdoor courts. They\'re durable and have great traction.',
          parent_comment_id: null,
          thumbs_up: 5,
          thumbs_down: 0
        },
        {
          discussion_id: 1,
          user_id: 3,
          content: 'Adidas Dame series is also great for outdoors. More affordable than some other options and last a long time.',
          parent_comment_id: null,
          thumbs_up: 3,
          thumbs_down: 1
        },
        {
          discussion_id: 2,
          user_id: 1,
          content: 'This sounds great! I\'d definitely be interested in joining. The schedule works perfect for me.',
          parent_comment_id: null,
          thumbs_up: 2,
          thumbs_down: 0
        },
        {
          discussion_id: 2,
          user_id: 3,
          content: 'I could join on Mondays and Fridays, but Wednesdays are tough for me. Would you consider a Tuesday instead?',
          parent_comment_id: null,
          thumbs_up: 1,
          thumbs_down: 0
        },
        {
          discussion_id: 3,
          user_id: 1,
          content: 'I was there yesterday and the courts were still quite wet. They might be okay by Sunday, but I\'d avoid Saturday if possible.',
          parent_comment_id: null,
          thumbs_up: 4,
          thumbs_down: 0
        },
        {
          discussion_id: 4,
          user_id: 3,
          content: 'I recommend the Paddletek Phoenix Genesis paddles for beginners. They have a good grip and are lightweight.',
          parent_comment_id: null,
          thumbs_up: 2,
          thumbs_down: 0
        }
      ];

      for (const comment of discussionComments) {
        await runAsync(
          `INSERT INTO comments (discussion_id, user_id, content, parent_comment_id, thumbs_up, thumbs_down)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [comment.discussion_id, comment.user_id, comment.content, 
           comment.parent_comment_id, comment.thumbs_up, comment.thumbs_down]
        );
      }
      console.log('✅ Sample discussion comments created');

    } catch (error) {
      console.error('Error seeding dashboard data:', error);
    }

    // Call the seedNotifications function to create notifications with sender information
    await seedNotifications();

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    db.close();
  }
}

seedDatabase()
  .then(() => {
    console.log('Database connection closed');
  })
  .catch((err) => {
    console.error('Error seeding database:', err);
    db.close();
  }); 