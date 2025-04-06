import db, { runAsync } from './index';

async function clearDatabase() {
  console.log('Clearing database...');

  try {
    // Disable foreign key constraints temporarily
    await runAsync('PRAGMA foreign_keys = OFF');

    // Clear all tables
    await runAsync('DELETE FROM notifications');
    await runAsync('DELETE FROM comment_votes');
    await runAsync('DELETE FROM discussion_votes');
    await runAsync('DELETE FROM comments');
    await runAsync('DELETE FROM bookmarks');
    await runAsync('DELETE FROM event_participants');
    await runAsync('DELETE FROM discussions');
    await runAsync('DELETE FROM events');
    await runAsync('DELETE FROM users');
    
    // Reset autoincrement counters
    await runAsync('DELETE FROM sqlite_sequence');

    // Re-enable foreign key constraints
    await runAsync('PRAGMA foreign_keys = ON');

    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    db.close();
  }
}

clearDatabase()
  .then(() => {
    console.log('Database connection closed');
  })
  .catch((err) => {
    console.error('Error in clear operation:', err);
    db.close();
  }); 