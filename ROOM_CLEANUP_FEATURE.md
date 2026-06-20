# 🧹 Automatic Room Cleanup Feature

## ✅ Implemented

I've added an automatic room cleanup service that runs in the background and removes empty rooms.

## How It Works

1. **Background Service**: Runs every 60 seconds
2. **Empty Room Detection**: Checks Redis for participant count in each active room
3. **Timeout Period**: Rooms must be empty for 5 minutes before deletion
4. **Automatic Cleanup**: Deletes room from database and cleans up Redis data

## What Gets Cleaned Up

When a room is deleted:
- ✅ Room marked as `is_active = false` in database
- ✅ Redis participant list deleted (`room:{phraseCode}:participants`)
- ✅ Redis message history deleted (`room:{phraseCode}:messages`)

## Configuration

You can adjust these settings in `src/services/roomCleanup.js`:

```javascript
const EMPTY_ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes (change this value)
const CLEANUP_INTERVAL = 60 * 1000; // Check every minute (change this value)
```

## Logs

The service logs its activity:

```
✓ Room cleanup service started
📭 Room golf-charlie-888 is now empty
🗑️  Deleting empty room: golf-charlie-888
✓ Room golf-charlie-888 deleted successfully
👥 Room foxtrot-bravo-1 has participants again
```

## Deployment

The service starts automatically when the backend starts. To deploy:

```bash
cd /var/www/cup2cup
git pull origin main
pm2 restart cup2cup-backend
```

Check the logs to see it working:

```bash
pm2 logs cup2cup-backend | grep -i "room\|cleanup"
```

## Benefits

- 🧹 **Automatic cleanup** - No manual intervention needed
- 💾 **Saves database space** - Removes inactive rooms
- 🚀 **Improves performance** - Less data to query
- 📊 **Better analytics** - Only active rooms in database

## Future Enhancements

Possible improvements:
- Add admin dashboard to view cleanup statistics
- Make timeout configurable via environment variable
- Add option to archive rooms instead of deleting
- Send notification before room deletion
- Allow room creators to "pin" rooms to prevent deletion

## Testing

To test the feature:

1. Create a room
2. Join the room
3. Leave the room (room is now empty)
4. Wait 5 minutes
5. Check database - room should be marked `is_active = false`

Or check the logs in real-time:

```bash
pm2 logs cup2cup-backend --lines 100 | grep "Room"
```
