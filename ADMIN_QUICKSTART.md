# 🚀 Admin Panel Quick Start

## TL;DR - Deploy Now

On your server, run these commands:

```bash
cd /var/www/cup2cup
git pull origin main
chmod +x deploy-admin.sh
./deploy-admin.sh
```

Then access: **https://cup2cup.xyz/admin**

Login: `admin` / `Admin123!` (**change immediately!**)

---

## What You Get

### 🎛️ Admin Control Panel

A beautiful web interface at `/admin` with:

- **📊 Dashboard** - Real-time stats (users, rooms, connections)
- **🚀 One-Click Deploy** - Update server with automatic backups
- **🔄 Server Restart** - Safely restart without SSH
- **💾 Backup Manager** - Create and restore backups
- **⏮️ Rollback** - Revert to previous versions if something breaks
- **📜 Deployment History** - Track all changes
- **👥 User Management** - View and manage users (coming soon)

### 🔐 Security Features

- ✅ Admin-only access with authentication
- ✅ Automatic backups before every deployment
- ✅ Audit logging of all admin actions
- ✅ Role-based permissions (admin levels)
- ✅ Rollback capability for failed deployments

---

## Quick Deploy Guide

### Step 1: Pull & Run Script

```bash
ssh your-server
cd /var/www/cup2cup
git pull origin main
chmod +x deploy-admin.sh
./deploy-admin.sh
```

The script will:
1. ✅ Check prerequisites
2. 💾 Create backup
3. 📥 Pull latest code
4. 📦 Install dependencies
5. 🔨 Build frontend
6. 🗄️ Run database migration
7. 🔄 Restart server

### Step 2: First Login

1. Go to `https://cup2cup.xyz/admin`
2. Login with:
   - Username: `admin`
   - Password: `Admin123!`
3. **Immediately change password!**

### Step 3: Test Features

- ✅ View dashboard stats
- ✅ Click "Create Backup" to test
- ✅ Check deployment history

---

## Using the Admin Panel

### Deploy Latest Code

1. Click **"🚀 Update & Deploy"**
2. Confirm action
3. Wait ~1-2 minutes
4. Check deployment history for status

**What it does:**
- Creates automatic backup
- Pulls latest code from GitHub
- Installs dependencies
- Builds frontend
- Restarts server

### Restart Server

1. Click **"🔄 Restart Server"**
2. Confirm action
3. Server restarts in ~5 seconds

**When to use:**
- After changing environment variables
- To apply config changes
- To clear memory/cache

### Create Backup

1. Click **"💾 Create Backup"**
2. Backup created in `/var/backups/cup2cup`

**Includes:**
- Database dump
- Code archive
- Timestamp for easy identification

### Rollback

If a deployment breaks something:

1. Go to **Deployment History**
2. Find last working deployment
3. Click **"Rollback"** button
4. Confirm action
5. System restores from backup automatically

---

## Manual Deployment (Without Script)

If you prefer manual deployment:

```bash
# 1. Pull code
cd /var/www/cup2cup
git pull origin main

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Build frontend
cd client && npm run build && cd ..

# 4. Run database migration
psql -U cup2cup_user -d cup2cup -f database/add_admin_role.sql

# 5. Restart server
pm2 restart cup2cup-backend
```

---

## Changing Admin Password

### Method 1: Via Database

```bash
# Generate new password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourNewPassword', 12, (err, hash) => console.log(hash));"

# Update in database
psql -U cup2cup_user -d cup2cup
UPDATE users SET password_hash = '<your-hash>' WHERE username = 'admin';
\q
```

### Method 2: Create New Admin User

```sql
psql -U cup2cup_user -d cup2cup

INSERT INTO users (username, display_name, password_hash, is_admin, admin_level)
VALUES (
  'yourusername',
  'Your Name',
  '$2b$12$...', -- Generate with bcrypt
  true,
  100
);
```

---

## Troubleshooting

### Can't Access Admin Panel

```bash
# Check if server is running
pm2 status

# Check logs
pm2 logs cup2cup-backend

# Restart if needed
pm2 restart cup2cup-backend
```

### 403 Forbidden Error

```sql
-- Make sure user is admin
psql -U cup2cup_user -d cup2cup
UPDATE users SET is_admin = true, admin_level = 100 WHERE username = 'admin';
\q
```

### Deployment Fails

1. Check PM2 logs: `pm2 logs cup2cup-backend`
2. View deployment history in admin panel
3. Use rollback if needed
4. Fix issues and try again

### Backup Fails

```bash
# Check permissions
sudo chown -R $USER:$USER /var/backups/cup2cup
chmod 755 /var/backups/cup2cup
```

---

## Important Files

| File | Purpose |
|------|---------|
| `ADMIN_SETUP.md` | Complete setup guide |
| `DEPLOYMENT_GUIDE.md` | Full deployment documentation |
| `TROUBLESHOOTING.md` | Common issues and fixes |
| `deploy-admin.sh` | Automated deployment script |
| `database/add_admin_role.sql` | Database migration |
| `src/routes/admin.js` | Admin API routes |
| `client/src/components/Admin/AdminPanel.tsx` | Admin UI |

---

## Default Admin Credentials

**⚠️ CHANGE THESE IMMEDIATELY!**

- **Username:** `admin`
- **Password:** `Admin123!`

---

## Quick Commands

```bash
# View server logs
pm2 logs cup2cup-backend

# Check server status
pm2 status

# Monitor resources
pm2 monit

# Restart server
pm2 restart cup2cup-backend

# View recent deployments
psql -U cup2cup_user -d cup2cup -c "SELECT * FROM deployment_history ORDER BY started_at DESC LIMIT 5;"

# View admin actions
psql -U cup2cup_user -d cup2cup -c "SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT 10;"
```

---

## Safety Features

✅ **Automatic Backups** - Created before every deployment

✅ **Rollback Capability** - Revert to any previous version

✅ **Audit Logging** - Track all admin actions

✅ **Error Handling** - Deployments fail safely

✅ **No Data Loss** - Database and code backed up

---

## Next Steps

1. ✅ Deploy admin panel
2. ✅ Login and change password
3. ✅ Test backup feature
4. ✅ Try a deployment
5. ✅ Review deployment history
6. ✅ Set up regular backups
7. ✅ Add additional admin users (optional)

---

## Support

**Documentation:**
- Full Setup: `ADMIN_SETUP.md`
- Deployment: `DEPLOYMENT_GUIDE.md`
- Troubleshooting: `TROUBLESHOOTING.md`

**Logs:**
```bash
pm2 logs cup2cup-backend
```

**Database:**
```bash
psql -U cup2cup_user -d cup2cup
```

---

## 🎉 You're Ready!

Your admin panel is production-ready with:
- ✅ Secure authentication
- ✅ One-click deployments
- ✅ Automatic backups
- ✅ Rollback capability
- ✅ Audit logging

**Access it at:** `https://cup2cup.xyz/admin`

**Remember:** Always test in staging first, but the admin panel includes safety features like automatic backups and rollback!

---

**Happy deploying! 🚀**
