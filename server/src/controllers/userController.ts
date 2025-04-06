import { Request, Response } from 'express';
import { getAsync, allAsync, runAsync } from '../db';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, full_name, bio } = req.body;

    // Validate input
    if (!username || !email || !password) {
      res.status(400).json({ message: 'Please provide username, email and password' });
      return;
    }

    // Check if user already exists
    const existingUser = await getAsync(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      res.status(400).json({ message: 'Username or email already in use' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const result = await runAsync(
      `INSERT INTO users (username, email, password, full_name, bio) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name || null, bio || null]
    );

    // Generate token
    const token = generateToken(result.lastID);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.lastID,
        username,
        email,
        full_name,
        bio
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email/username and password' });
      return;
    }

    // Find user by email or username
    const user = await getAsync(
      'SELECT id, username, email, password, full_name, bio, profile_image FROM users WHERE email = ? OR username = ?',
      [email, email]
    );

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const user = await getAsync(
      `SELECT id, username, email, full_name, bio, profile_image, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { full_name, bio, profile_image } = req.body;

    // Update user
    await runAsync(
      `UPDATE users 
       SET full_name = COALESCE(?, full_name), 
           bio = COALESCE(?, bio), 
           profile_image = COALESCE(?, profile_image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [full_name, bio, profile_image, userId]
    );

    // Get updated user
    const updatedUser = await getAsync(
      `SELECT id, username, email, full_name, bio, profile_image, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// Get user's events
export const getUserEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    
    const events = await allAsync(
      `SELECT e.*, u.username as creator_name,
       (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participants_count
       FROM events e
       JOIN users u ON e.creator_id = u.id
       WHERE e.creator_id = ? OR e.id IN (
         SELECT event_id FROM event_participants p WHERE p.user_id = ?
       )
       ORDER BY e.start_date DESC`,
      [userId, userId]
    );
    
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error getting user events:', error);
    res.status(500).json({ message: 'Failed to get user events' });
  }
};

// Get user's bookmarked events
export const getUserBookmarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const bookmarkedEvents = await allAsync(
      `SELECT e.*, u.username as creator_name
       FROM events e
       JOIN bookmarks b ON e.id = b.event_id
       JOIN users u ON e.creator_id = u.id
       WHERE b.user_id = ?
       ORDER BY e.start_date ASC`,
      [userId]
    );

    res.status(200).json({ bookmarkedEvents });
  } catch (error) {
    console.error('Get user bookmarks error:', error);
    res.status(500).json({ message: 'Server error fetching bookmarks' });
  }
};

// Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await allAsync(
      `SELECT id, username, full_name, bio, profile_image, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    const user = await getAsync(
      `SELECT id, username, full_name, bio, profile_image, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

// Get a user's events by user ID
export const getUserEventsById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const ownEvents = await allAsync(
      `SELECT e.*, 
       (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as current_players
       FROM events e
       WHERE e.creator_id = ?
       ORDER BY e.start_date DESC`,
      [id]
    );
    
    const participatingEvents = await allAsync(
      `SELECT e.*, 
       (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as current_players
       FROM events e
       JOIN event_participants p ON e.id = p.event_id
       WHERE p.user_id = ? AND e.creator_id != ?
       ORDER BY e.start_date DESC`,
      [id, id]
    );
    
    res.status(200).json({
      created: ownEvents,
      participating: participatingEvents
    });
  } catch (error) {
    console.error('Error getting user events by ID:', error);
    res.status(500).json({ message: 'Failed to get user events' });
  }
};

// Change Password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
      return;
    }

    // Get the current user's password
    const user = await getAsync(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the password
    await runAsync(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
};

// Delete Account
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Validate input
    if (!password) {
      res.status(400).json({ message: 'Password is required to delete your account' });
      return;
    }

    // Get the current user with password
    const user = await getAsync(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Incorrect password' });
      return;
    }

    // Begin transaction to delete all related user data
    await runAsync('BEGIN TRANSACTION');

    try {
      // Delete user's notifications
      await runAsync('DELETE FROM notifications WHERE user_id = ?', [userId]);

      // Delete user's bookmarks
      await runAsync('DELETE FROM bookmarks WHERE user_id = ?', [userId]);

      // Delete user's comment votes
      await runAsync('DELETE FROM comment_votes WHERE user_id = ?', [userId]);

      // Delete user's comments
      await runAsync('DELETE FROM comments WHERE user_id = ?', [userId]);

      // Handle user's events
      // 1. Get all events created by user
      const userEvents = await allAsync('SELECT id FROM events WHERE creator_id = ?', [userId]);
      
      // 2. For each event, delete related data
      for (const event of userEvents) {
        const eventId = event.id;
        
        // Delete participants
        await runAsync('DELETE FROM event_participants WHERE event_id = ?', [eventId]);
        
        // Delete bookmarks for this event
        await runAsync('DELETE FROM bookmarks WHERE event_id = ?', [eventId]);
        
        // Delete comment votes for comments on this event
        await runAsync(
          'DELETE FROM comment_votes WHERE comment_id IN (SELECT id FROM comments WHERE event_id = ?)',
          [eventId]
        );
        
        // Delete comments
        await runAsync('DELETE FROM comments WHERE event_id = ?', [eventId]);
      }
      
      // 3. Delete all events created by user
      await runAsync('DELETE FROM events WHERE creator_id = ?', [userId]);

      // Remove user from events they participate in
      await runAsync('DELETE FROM event_participants WHERE user_id = ?', [userId]);

      // Finally, delete the user
      await runAsync('DELETE FROM users WHERE id = ?', [userId]);

      // Commit the transaction
      await runAsync('COMMIT');

      // Clear auth token cookie if using cookie-based auth
      // res.clearCookie('token');

      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      // If any error occurs, rollback the transaction
      await runAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
};

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    
    // req.file is provided by multer middleware
    if (!(req as any).file) {
      res.status(400).json({ message: 'No file was uploaded' });
      return;
    }

    // Save the file path or URL to the database
    const fileUrl = `/uploads/${(req as any).file.filename}`;
    
    // Update user's profile_image field
    await runAsync(
      `UPDATE users 
       SET profile_image = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [fileUrl, userId]
    );

    // Get updated user
    const updatedUser = await getAsync(
      `SELECT id, username, email, full_name, bio, profile_image, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: 'Server error uploading profile image' });
  }
};
