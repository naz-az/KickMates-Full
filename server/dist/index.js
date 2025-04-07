"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const discussionRoutes_1 = __importDefault(require("./routes/discussionRoutes"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socketService_1 = require("./utils/socketService");
const multer_1 = __importDefault(require("multer"));
// Load environment variables
dotenv_1.default.config();
// Initialize express app
console.log('Starting server with updated port...');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Create HTTP server with Express
const server = http_1.default.createServer(app);
// Initialize Socket.IO
socketService_1.socketService.initialize(server);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
app.use((0, morgan_1.default)('dev'));
// API Routes
app.use('/api/users', userRoutes_1.default);
app.use('/api/events', eventRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/messages', messageRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/discussions', discussionRoutes_1.default);
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../../client/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../../client/dist/index.html'));
    });
}
// Multer error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        res.status(400).json({
            message: `File upload error: ${err.message}`
        });
    }
    else if (err && err.message && err.message.includes('Only image files are allowed')) {
        // Our custom file filter error
        console.error('File type error:', err);
        res.status(400).json({
            message: err.message,
            type: 'invalid_file_type'
        });
    }
    else {
        // Forward to the general error handler
        next(err);
    }
});
// General error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
