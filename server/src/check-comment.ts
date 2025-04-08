import sqlite3 from 'sqlite3';
import { resolve } from 'path';

const dbPath = resolve(__dirname, '../../data/kickmates.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
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
  } else if (row) {
    console.log('Comment found:', row);
  } else {
    console.log('Comment not found');
  }
  
  // Check all comments in the event
  db.all('SELECT * FROM comments WHERE event_id = ?', [8], (err, rows) => {
    if (err) {
      console.error('Error querying database:', err.message);
    } else {
      console.log('All comments for event 8:', rows);
    }
    
    // Close database connection
    db.close();
  });
}); 