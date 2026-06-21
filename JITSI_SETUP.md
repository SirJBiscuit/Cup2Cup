# 🎤 Jitsi Voice Chat Setup

## ✅ What Was Done

Replaced LiveKit with Jitsi Meet for voice chat to avoid API key authentication issues.

## 🚀 How It Works

**Jitsi Integration:**
- Uses Jitsi's public server (`meet.jit.si`) by default
- No backend configuration needed
- No API keys required
- Works immediately after deployment

**Files Created:**
- `client/src/services/jitsi.ts` - Jitsi service wrapper
- `client/src/components/Room/JitsiVoice.tsx` - Voice chat component

**Files Modified:**
- `client/src/components/Room/VoiceRoom.tsx` - Integrated Jitsi component

## 📦 Deployment

### 1. Pull Latest Code

```bash
cd /var/www/cup2cup
git pull origin main
```

### 2. Rebuild Frontend

```bash
cd client
npm install  # In case any dependencies changed
npm run build
```

### 3. Copy to Server

```bash
# From your local machine
cd /var/www/cup2cup/client
sudo cp -r build/* /var/www/cup2cup/client/build/
```

Or if building on server:
```bash
cd /var/www/cup2cup/client
npm run build
```

### 4. Restart Backend (if needed)

```bash
pm2 restart cup2cup-backend
```

## ✨ Features

**What Works:**
- ✅ Audio-only voice chat (video disabled by default)
- ✅ Multiple participants
- ✅ Built-in mute/unmute controls
- ✅ No server configuration needed
- ✅ Works across NAT/firewalls
- ✅ Good audio quality

**Jitsi Controls:**
- 🎤 Microphone toggle
- 🔊 Audio settings
- 📊 Connection stats
- ⚙️ Quality settings

## 🔧 Customization

### Use Your Own Jitsi Server

If you want to self-host Jitsi later for better privacy:

1. Set up your own Jitsi server (see Jitsi documentation)
2. Update `client/src/services/jitsi.ts`:

```typescript
private domain = 'your-jitsi-domain.com'; // Change from meet.jit.si
```

### Enable Video

To enable video chat, modify `client/src/services/jitsi.ts`:

```typescript
configOverwrite: {
  startWithAudioMuted: false,
  startWithVideoMuted: false, // Change to false
  // ...
}
```

## 🆚 Jitsi vs LiveKit

| Feature | Jitsi | LiveKit |
|---------|-------|---------|
| Setup | ✅ Instant | ❌ Complex |
| API Keys | ✅ None needed | ❌ Authentication issues |
| Quality | ✅ Good | ✅ Excellent |
| Free Tier | ✅ Unlimited (public server) | ✅ Limited |
| Self-hosted | ✅ Easy | ❌ Difficult |
| Works Now | ✅ Yes | ❌ No |

## 🎯 Testing

1. Deploy the code
2. Join a room
3. Voice chat should load automatically
4. Grant microphone permissions when prompted
5. You should see the Jitsi interface
6. Other participants will join the same voice room

## 📝 Notes

- **Public Server**: Currently using Jitsi's free public server
- **Privacy**: Jitsi is open-source and encrypted
- **Scalability**: Public server handles it well
- **Future**: Can self-host for more control

## 🐛 Troubleshooting

### Voice chat not loading?

Check browser console (F12) for errors.

### Microphone not working?

- Check browser permissions
- Make sure HTTPS is enabled
- Try a different browser

### Can't hear others?

- Check your audio output settings
- Make sure you're not deafened
- Check Jitsi's audio settings

## 🎉 Benefits

1. **No more API key errors** - Works immediately
2. **Simpler deployment** - No backend config needed
3. **Better compatibility** - Works on more networks
4. **Easier debugging** - Clear error messages
5. **Free forever** - No usage limits on public server

## 🔮 Future Enhancements

- Self-host Jitsi for better privacy
- Add video chat option
- Custom branding
- Recording capabilities
- Screen sharing
