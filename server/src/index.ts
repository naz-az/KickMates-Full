import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import userRoutes from './routes/userRoutes';
import eventRoutes from './routes/eventRoutes';
import notificationRoutes from './routes/notificationRoutes';
import messageRoutes from './routes/messageRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import discussionRoutes from './routes/discussionRoutes';
import path from 'path';
import http from 'http';
import { socketService } from './utils/socketService';
import multer from 'multer';

// Load environment variables
dotenv.config();

// Initialize express app
console.log('Starting server with updated port...');
const app = express();
const PORT = process.env.PORT || 5001;

// Create HTTP server with Express
const server = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(morgan('dev'));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/discussions', discussionRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Multer error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    console.error('Multer error:', err);
    res.status(400).json({ 
      message: `File upload error: ${err.message}` 
    });
  } else if (err && err.message && err.message.includes('Only image files are allowed')) {
    // Our custom file filter error
    console.error('File type error:', err);
    res.status(400).json({ 
      message: err.message,
      type: 'invalid_file_type'
    });
  } else {
    // Forward to the general error handler
    next(err);
  }
});

// General error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 