import db, { runAsync } from '../db';

async function fixDatabaseSchema() {
  try {
    console.log('Fixing database schema...');

    // Rename participants table to event_participants
    await runAsync('ALTER TABLE participants RENAME TO event_participants');
    console.log('✅ Renamed participants table to event_participants');

    // Add indexes to improve query performance
    await runAsync('CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id)');
    await runAsync('CREATE INDEX IF NOT EXISTS idx_discussions_creator_id ON discussions(creator_id)');
    console.log('✅ Created indexes for performance');

    // Clean up unused course tables
    await runAsync('DROP TABLE IF EXISTS dashboard_courses');
    await runAsync('DROP TABLE IF EXISTS user_courses');
    await runAsync('DROP TABLE IF EXISTS course_participants');
    await runAsync('DROP TABLE IF EXISTS user_statistics');
    await runAsync('DROP TABLE IF EXISTS productivity_data');
    await runAsync('DROP TABLE IF EXISTS upcoming_events');
    console.log('✅ Removed unused tables');

    console.log('Database schema fixed successfully!');
  } catch (error) {
    console.error('Error fixing database schema:', error);
  } finally {
    db.close();
  }
}

fixDatabaseSchema(); 