"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = require("path");
const dbPath = (0, path_1.resolve)(__dirname, '../../data/kickmates.db');
console.log('Database path:', dbPath);
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the database');
});
// Check the comment
db.get('SELECT * FROM comments WHERE id = ?', [44], (err, row) => {
    if (err) {
        console.error('Error querying database:', err.message);
    }
    else if (row) {
        console.log('Comment found:', row);
    }
    else {
        console.log('Comment not found');
    }
    // Check all comments in the event
    db.all('SELECT * FROM comments WHERE event_id = ?', [8], (err, rows) => {
        if (err) {
            console.error('Error querying database:', err.message);
        }
        else {
            console.log('All comments for event 8:', rows);
        }
        // Close database connection
        db.close();
    });
});
