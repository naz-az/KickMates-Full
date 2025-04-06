import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { getAsync } from '../db';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth Header Missing or Invalid Format');
      res.status(401).json({ message: 'Authorization token required' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token:', token ? 'Present' : 'Missing');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('Token Verification Failed');
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    
    console.log('Decoded Token:', decoded);
    
    // Check if user exists
    const user = await getAsync('SELECT id, username, email FROM users WHERE id = ?', [decoded.userId]);
    console.log('User Found:', user ? 'Yes' : 'No');
    
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    
    // Add user to request
    req.user = user;
    console.log('User attached to request:', req.user.id);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
}; 