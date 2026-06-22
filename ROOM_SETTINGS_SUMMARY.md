# Room Settings Summary

## Default Room Settings

### ✅ Updated Defaults (as of latest changes):

1. **Persistence**: `false` (disabled by default)
   - Rooms are temporary and deleted when all users leave
   - Users can enable persistence in Dashboard create modal if needed

2. **Max Participants**: `4` (default), up to `20` maximum
   - Default: 4 participants (suitable for small group voice chats)
   - Range: 1-20 participants
   - Can be adjusted via slider in Dashboard create modal
   - Backend validates and enforces 1-20 limit

### Files Updated:

1. **`client/src/components/Dashboard/Dashboard.tsx`**
   - Line 11: `isPersistent` default = `false`
   - Line 13: `maxParticipants` default = `4`

2. **`client/src/components/Auth/GuestJoin.tsx`**
   - Line 35: Guest rooms use `maxParticipants: 4`
   - Line 34: Guest rooms always non-persistent (`isPersistent: false`)

### User Experience:

- **Logged-in users** (Dashboard):
  - Can toggle persistence on/off
  - Can set custom max participants
  - Defaults: Non-persistent, 4 max users

- **Guest users** (GuestJoin):
  - Always create non-persistent rooms
  - Fixed at 4 max participants
  - No customization options

### Room Behavior:

**Non-Persistent Rooms** (default):
- Automatically deleted when last user leaves
- No database storage after closure
- Ideal for quick voice chats

**Persistent Rooms** (optional):
- Saved in database
- Accessible via phrase code even after all users leave
- Can be rejoined later
- Visible in user's room list on Dashboard
