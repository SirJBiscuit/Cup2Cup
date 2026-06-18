# Cup2Cup Quick Start Guide

## 🚀 Running the Application

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- Redis (optional, for production)
- LiveKit server (optional, for voice chat)

### Backend Server

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run in development mode
npm run dev

# Run in production mode
npm start
```

**Server will start on:** `http://localhost:3000`

### Frontend Client

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build
```

**Client will start on:** `http://localhost:3001`

## 📱 Testing Mobile Features

### Desktop Browser DevTools
1. Open Chrome/Firefox DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select a mobile device (iPhone, Pixel, etc.)
4. Test responsive design and touch interactions

### Real Mobile Device
1. Ensure mobile device is on same network as dev server
2. Find your computer's local IP address
3. Access `http://YOUR_IP:3001` from mobile browser
4. Test all features and animations

## ✨ New Features to Test

### 1. Password Visibility Toggle
- Go to Login page
- Click the eye icon (👁️) to show password
- Click monkey icon (🙈) to hide password

### 2. Audio Enhancement Settings
- Login and go to Settings
- Click "Preferences" tab
- Toggle "Loudness Equalization"
- Toggle "Noise Suppression"
- Click "Save Preferences"
- Settings persist in browser

### 3. Mobile Responsiveness
- Resize browser window or use mobile device
- Check navigation adapts (icons on mobile)
- Verify room grid changes (1/2/3 columns)
- Test all buttons have proper touch targets
- Verify delete buttons visible on mobile

### 4. Animations
- Page loads should fade in smoothly
- Room cards should pop in with stagger
- Buttons should scale on hover/click
- Navigation should have smooth transitions

## 🔧 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process if needed (Windows)
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

### Client won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection issues
```bash
# Verify PostgreSQL is running
# Check .env DATABASE_URL is correct
# Test connection:
psql -U your_username -d cup2cup
```

### Animations not working
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Verify `index.css` is loaded

## 📊 Environment Variables

### Backend (.env)
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cup2cup

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001

# LiveKit (optional)
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_WS_URL=ws://localhost:7880
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
```

## 🎯 Key Endpoints

### API Endpoints
- `GET /health` - Health check
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/rooms` - Get user's rooms
- `POST /api/rooms` - Create new room
- `DELETE /api/rooms/:phraseCode` - Delete room

### Frontend Routes
- `/` - Login page
- `/register` - Register page
- `/guest` - Guest join page
- `/dashboard` - User dashboard
- `/settings` - User settings
- `/room/:phraseCode` - Voice room

## 📱 Mobile Testing Checklist

- [ ] Login page responsive
- [ ] Register page responsive
- [ ] Guest join page responsive
- [ ] Dashboard navigation adapts
- [ ] Room grid changes columns
- [ ] Settings tabs work on mobile
- [ ] All buttons have 44px touch targets
- [ ] Animations smooth on mobile
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Forms work with mobile keyboard
- [ ] Delete buttons visible/accessible

## 🎨 Animation Testing

- [ ] Page fade in on load
- [ ] Room cards stagger in
- [ ] Buttons scale on hover
- [ ] Buttons compress on click
- [ ] Cards lift on hover
- [ ] Shadows change depth
- [ ] Transitions smooth (200ms)
- [ ] No animation jank
- [ ] Dark mode transitions smooth

## 📝 Notes

- **Dark Mode:** Enabled by default, toggle in nav bar
- **LocalStorage:** Used for theme and audio preferences
- **Responsive:** Mobile-first design with breakpoints
- **Animations:** Hardware-accelerated CSS transforms
- **Touch:** Optimized for mobile with proper targets

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all dependencies installed
3. Check environment variables
4. Review `UPDATE_SUMMARY.md` for details
5. Check server logs for backend issues

---

**Happy coding! 🎉**
