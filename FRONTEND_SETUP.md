# Frontend Setup Instructions

## On the Server (SSH into 192.168.1.107)

### 1. Pull Latest Code
```bash
cd /var/www/cup2cup
git pull origin main
```

### 2. Install Frontend Dependencies
```bash
cd client
npm install
```

This will install:
- React & React DOM
- TypeScript
- React Router DOM
- Socket.io Client
- Axios
- Tailwind CSS
- All dev dependencies

### 3. Create Environment File
```bash
# Create .env file in client directory
nano .env
```

Add:
```env
REACT_APP_API_URL=https://cup2cup.xyz/api
REACT_APP_SOCKET_URL=https://cup2cup.xyz
```

Save with `Ctrl+X`, `Y`, `Enter`.

### 4. Build Frontend
```bash
npm run build
```

This creates an optimized production build in `client/build/`.

### 5. Update Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/cup2cup.xyz
```

Update the root location block to serve the React app:
```nginx
# Replace the existing location / block with:
location / {
    root /var/www/cup2cup/client/build;
    try_files $uri $uri/ /index.html;
}
```

Save and test:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Test the Frontend
Visit https://cup2cup.xyz in your browser!

You should see the Cup2Cup login page.

## Development Mode (Optional)

To run in development mode on the server:
```bash
cd /var/www/cup2cup/client
npm start
```

This runs on port 3000 by default. You can access it at http://192.168.1.107:3000

## Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Nginx Not Serving React App
```bash
# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Verify build directory exists
ls -la /var/www/cup2cup/client/build

# Check permissions
sudo chown -R guythatcooks:guythatcooks /var/www/cup2cup/client/build
```

### API Calls Failing
- Make sure backend is running: `pm2 status cup2cup-backend`
- Check backend logs: `pm2 logs cup2cup-backend`
- Verify CORS settings in backend `.env`

## Next Steps After Frontend is Live

1. Test user registration
2. Test user login
3. Create a room
4. Join a room
5. Implement remaining components (Register, Dashboard, VoiceRoom, etc.)
