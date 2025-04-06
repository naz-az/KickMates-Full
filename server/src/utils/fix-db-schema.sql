-- Rename participants table to event_participants is already done
-- ALTER TABLE participants RENAME TO event_participants;

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_discussions_creator_id ON discussions(creator_id);

-- Clean up unused course tables
DROP TABLE IF EXISTS dashboard_courses;
DROP TABLE IF EXISTS user_courses;
DROP TABLE IF EXISTS course_participants;
DROP TABLE IF EXISTS user_statistics;
DROP TABLE IF EXISTS productivity_data;
DROP TABLE IF EXISTS upcoming_events; 