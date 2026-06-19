# Cup2Cup Admin Panel Setup Guide

## 🎯 Overview

The admin panel provides a secure web interface to manage your Cup2Cup deployment with features like:
- **One-Click Deployment** - Update server with automatic backups
- **Server Control** - Restart services safely
- **Backup Management** - Create and restore backups
- **Rollback Capability** - Revert to previous versions
- **User Management** - View and manage user accounts
- **System Monitoring** - View stats and deployment history

## 🔐 Security Features

- ✅ Admin authentication required
- ✅ Role-based access control (admin levels)
- ✅ Audit logging of all admin actions
- ✅ Automatic backups before deployments
- ✅ Rollback capability for failed deployments

## 📋 Prerequisites

Before setting up the admin panel, ensure you have:
- PostgreSQL database running
- PM2 installed globally (`npm install -g pm2`)
- Git repository configured
- Proper file permissions on `/var/www/cup2cup`
- Backup directory writable (`/var/backups/cup2cup`)

## 🚀 Installation Steps

### Step 1: Database Setup

Run the admin role migration to add admin tables and first admin user:

```bash
# Connect to your database
psql -U cup2cup_user -d cup2cup

# Run the migration
\i /var/www/cup2cup/database/add_admin_role.sql

# Verify tables were created
\dt

# You should see:
# - admin_actions
# - deployment_history
# - system_status

# Check admin user was created
SELECT username, is_admin, admin_level FROM users WHERE is_admin = true;

# Exit psql
\q
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admincpwe256!`

### Step 2: Update Server Code

The admin routes are already added to the server. Pull the latest code:

```bash
cd /var/www/cup2cup
git pull origin main
```

### Step 3: Install Dependencies

```bash
# Backend dependencies (if any new ones)
npm install

# Frontend dependencies
cd client
npm install
cd ..
```

### Step 4: Build Frontend

```bash
cd client
npm run build
cd ..
```

### Step 5: Restart Server

```bash
# Restart PM2 process
pm2 restart cup2cup-backend

# Check logs
pm2 logs cup2cup-backend
```

### Step 6: Create Backup Directory

```bash
# Create backup directory with proper permissions
sudo mkdir -p /var/backups/cup2cup
sudo chown -R $USER:$USER /var/backups/cup2cup
chmod 755 /var/backups/cup2cup
```

## 🎛️ Accessing the Admin Panel

### Local Development

```
http://localhost:3001/admin
```

### Production

```
https://cup2cup.xyz/admin
```

Or set up a subdomain:

```
https://admin.cup2cup.xyz
```

## 🔑 First Login

1. Navigate to the admin panel URL
2. You'll be redirected to login if not authenticated
3. Login with credentials:
   - Username: `admin`
   - Password: `admincpwe256!`

### Changing Admin Password

```bash
# Connect to database
psql -U cup2cup_user -d cup2cup

# Generate new password hash (use bcrypt with 12 rounds)
# You can use this Node.js command:
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourNewPassword', 12, (err, hash) => console.log(hash));"

# Update password in database
UPDATE users 
SET password_hash = '<your-new-hash>' 
WHERE username = 'admin';

# Exit
\q
```

## 🛠️ Admin Panel Features

### 1. Dashboard Stats

View real-time statistics:
- Total Users
- Total Rooms
- Active Connections

### 2. Server Controls

#### 🚀 Update & Deploy
- Pulls latest code from Git
- Creates automatic backup
- Installs dependencies
- Builds frontend
- Restarts server
- **Safe to use** - includes rollback capability

**What it does:**
```bash
1. Create backup (database + code)
2. git pull origin main
3. npm install (backend)
4. npm install (frontend)
5. npm run build (frontend)
6. pm2 restart cup2cup-backend
```

#### 🔄 Restart Server
- Restarts PM2 process
- No code changes
- Quick restart for config changes

#### 💾 Create Backup
- Creates database dump
- Archives code directory
- Stores in `/var/backups/cup2cup`

### 3. Deployment History

View all deployments with:
- Status (success/failed/in_progress)
- Git commit hash
- Deployed by (username)
- Timestamp
- Rollback button (for successful deployments)

### 4. Rollback

If a deployment breaks something:
1. Find the last working deployment in history
2. Click "Rollback" button
3. Confirm the action
4. System restores from backup
5. Server restarts automatically

## 🔐 Admin Levels

The system supports different admin permission levels:

| Level | Permissions |
|-------|-------------|
| 0 | Regular user (no admin access) |
| 50 | Can update users, view stats |
| 75 | Can create backups, restart server, delete users |
| 100 | Full access (deploy, rollback, all operations) |

### Creating Additional Admins

```sql
-- Connect to database
psql -U cup2cup_user -d cup2cup

-- Promote existing user to admin
UPDATE users 
SET is_admin = true, admin_level = 75 
WHERE username = 'someuser';

-- Or create new admin user
INSERT INTO users (username, display_name, password_hash, is_admin, admin_level)
VALUES (
  'newadmin',
  'New Admin',
  '$2b$12$...', -- Generate with bcrypt
  true,
  75
);
```

## 📊 Audit Logging

All admin actions are logged in the `admin_actions` table:

```sql
-- View recent admin actions
SELECT 
  aa.action_type,
  u.username,
  aa.details,
  aa.created_at
FROM admin_actions aa
LEFT JOIN users u ON aa.admin_id = u.id
ORDER BY aa.created_at DESC
LIMIT 20;
```

## 🚨 Troubleshooting

### Admin Panel Returns 403 Forbidden

**Problem:** User is not marked as admin in database.

**Solution:**
```sql
UPDATE users SET is_admin = true, admin_level = 100 WHERE username = 'admin';
```

### Deployment Fails

**Problem:** Git pull fails or build errors.

**Solution:**
1. Check PM2 logs: `pm2 logs cup2cup-backend`
2. Check deployment history in admin panel
3. Use rollback if needed
4. Fix issues manually and try again

### Backup Creation Fails

**Problem:** Permission denied on `/var/backups/cup2cup`.

**Solution:**
```bash
sudo chown -R $USER:$USER /var/backups/cup2cup
chmod 755 /var/backups/cup2cup
```

### Can't Access Admin Panel

**Problem:** Route not found or 404 error.

**Solution:**
1. Ensure frontend is built: `cd client && npm run build`
2. Restart server: `pm2 restart cup2cup-backend`
3. Check route is added in `client/src/App.tsx`

## 🔒 Security Best Practices

### 1. Change Default Password

**Immediately** change the default admin password after first login.

### 2. Use Strong Passwords

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Use a password manager

### 3. Limit Admin Access

- Only give admin access to trusted users
- Use appropriate admin levels (don't make everyone level 100)
- Regularly review admin users

### 4. Monitor Admin Actions

```sql
-- Check recent admin actions
SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT 50;
```

### 5. Regular Backups

- Use the backup feature regularly
- Test restores periodically
- Keep backups in multiple locations

### 6. Secure the Admin Route

Consider adding IP whitelist or additional authentication:

```javascript
// In src/routes/admin.js
router.use((req, res, next) => {
  const allowedIPs = ['YOUR.IP.ADDRESS'];
  const clientIP = req.ip;
  
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
});
```

## 📝 Maintenance

### Weekly Tasks

- [ ] Review deployment history
- [ ] Check admin action logs
- [ ] Create manual backup
- [ ] Review active users

### Monthly Tasks

- [ ] Clean old backups (keep last 30 days)
- [ ] Review admin user list
- [ ] Update dependencies
- [ ] Test rollback procedure

### Cleanup Old Backups

```bash
# Keep only last 30 days of backups
find /var/backups/cup2cup -name "*.tar.gz" -mtime +30 -delete
find /var/backups/cup2cup -name "*.sql" -mtime +30 -delete
```

## 🎯 Common Tasks

### Deploy Latest Code

1. Go to Admin Panel (`/admin`)
2. Click "🚀 Update & Deploy"
3. Confirm the action
4. Wait for completion (usually 1-2 minutes)
5. Check deployment history for status

### Rollback After Bad Deploy

1. Go to Admin Panel
2. Scroll to "Deployment History"
3. Find last successful deployment
4. Click "Rollback" button
5. Confirm action
6. Server will restore and restart

### Create Manual Backup

1. Go to Admin Panel
2. Click "💾 Create Backup"
3. Backup will be created in `/var/backups/cup2cup`
4. Note the backup path for future reference

### Restart Server

1. Go to Admin Panel
2. Click "🔄 Restart Server"
3. Confirm action
4. Server restarts in ~5 seconds

## 🌐 Setting Up Admin Subdomain

### Option 1: Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name admin.cup2cup.xyz;

    location / {
        proxy_pass http://localhost:3001/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: DNS CNAME

Point `admin.cup2cup.xyz` to `cup2cup.xyz` and use path `/admin`.

## 📞 Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs cup2cup-backend`
2. Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
3. Review deployment history in admin panel
4. Check audit logs in database
5. Use rollback if deployment failed

---

## ✅ Quick Checklist

After setup, verify:

- [ ] Database migration completed
- [ ] Admin user exists and can login
- [ ] Default password changed
- [ ] Backup directory created and writable
- [ ] Admin panel accessible
- [ ] Deploy button works
- [ ] Backup button works
- [ ] Restart button works
- [ ] Rollback tested
- [ ] Audit logging working

---

**🎉 Your admin panel is now ready to use!**

Access it at: `https://cup2cup.xyz/admin`

**Remember:** Always test deployments in a staging environment first!
