# KickMates Database Guide

## Database Schema

The KickMates database (SQLite) contains the following tables:

1. **users** - User accounts and profiles
2. **events** - Sports events created by users
3. **participants** - Users participating in events
4. **bookmarks** - Events bookmarked by users
5. **comments** - Comments on events
6. **notifications** - System notifications

## Database Statistics
- 3 users
- 4 events
- 10 participants
- 4 bookmarks

## How to Query the Database

### Using the Batch File

A convenience batch file `query-db.bat` has been created to make querying easier:

```
.\query-db.bat "YOUR SQL QUERY HERE"
```

Examples:

```
# List all users
.\query-db.bat "SELECT * FROM users;"

# List all events with basic information
.\query-db.bat "SELECT id, title, sport_type, location, start_date FROM events;"

# Find participants for a specific event
.\query-db.bat "SELECT p.id, p.user_id, p.status, u.username 
                FROM participants p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.event_id = 1;"
```

### Directly Using SQLite

If you prefer to use SQLite directly:

```
.\sqlite\sqlite-tools-win32-x86-3430100\sqlite3.exe -header -column .\data\kickmates.db
```

This will open the SQLite shell where you can enter queries directly.

## Key Database Relationships

- Each event has a creator (user)
- Users can participate in multiple events
- Users can bookmark events
- Events can have multiple participants
- Comments are linked to both events and users 