import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin, requireAdminLevel, logAdminAction } from '../middleware/admin.js';

const router = express.Router();
const execAsync = promisify(exec);

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [users, rooms, connections, recentActions] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM phrase_codes'),
      query('SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NULL'),
      query(`
        SELECT aa.*, u.username, u.display_name
        FROM admin_actions aa
        LEFT JOIN users u ON aa.admin_id = u.id
        ORDER BY aa.created_at DESC
        LIMIT 10
      `)
    ]);

    res.json({
      stats: {
        totalUsers: parseInt(users.rows[0].count),
        totalRooms: parseInt(rooms.rows[0].count),
        activeConnections: parseInt(connections.rows[0].count)
      },
      recentActions: recentActions.rows
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, username, display_name, is_admin, admin_level, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user (ban, promote to admin, etc.)
router.patch('/users/:userId', requireAdminLevel(50), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin, adminLevel } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (typeof isAdmin === 'boolean') {
      updates.push(`is_admin = $${paramCount++}`);
      values.push(isAdmin);
    }

    if (typeof adminLevel === 'number') {
      updates.push(`admin_level = $${paramCount++}`);
      values.push(adminLevel);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(req.userId, 'UPDATE_USER', {
      targetType: 'user',
      targetId: userId,
      changes: req.body,
      ipAddress: req.ip
    });

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:userId', requireAdminLevel(75), async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(req.userId, 'DELETE_USER', {
      targetType: 'user',
      targetId: userId,
      username: result.rows[0].username,
      ipAddress: req.ip
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system status
router.get('/system/status', async (req, res) => {
  try {
    const [dbStatus, memoryUsage] = await Promise.all([
      query('SELECT NOW()').then(() => ({ connected: true })).catch(() => ({ connected: false })),
      Promise.resolve(process.memoryUsage())
    ]);

    res.json({
      database: dbStatus,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB'
      },
      uptime: Math.round(process.uptime()) + ' seconds',
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

// Create backup
router.post('/system/backup', requireAdminLevel(75), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = '/var/backups/cup2cup';
    const backupPath = path.join(backupDir, `backup-${timestamp}`);

    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });

    // Backup database
    const dbUrl = process.env.DATABASE_URL;
    await execAsync(`pg_dump "${dbUrl}" > ${backupPath}.sql`);

    // Backup code
    await execAsync(`tar -czf ${backupPath}-code.tar.gz -C /var/www cup2cup`);

    await logAdminAction(req.userId, 'CREATE_BACKUP', {
      backupPath,
      ipAddress: req.ip
    });

    res.json({ 
      message: 'Backup created successfully',
      backupPath 
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup: ' + error.message });
  }
});

// Update/Deploy application
router.post('/system/deploy', requireAdminLevel(100), async (req, res) => {
  try {
    const { branch = 'main' } = req.body;
    
    // Create deployment record
    const deployResult = await query(
      `INSERT INTO deployment_history (deployed_by, deployment_type, status)
       VALUES ($1, $2, $3) RETURNING id`,
      [req.userId, 'git-pull', 'in_progress']
    );
    const deploymentId = deployResult.rows[0].id;

    // Create backup first
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = '/var/backups/cup2cup';
    const backupPath = path.join(backupDir, `pre-deploy-${timestamp}`);
    
    await fs.mkdir(backupDir, { recursive: true });
    await execAsync(`tar -czf ${backupPath}-code.tar.gz -C /var/www cup2cup`);

    // Update deployment record with backup path
    await query(
      'UPDATE deployment_history SET backup_path = $1 WHERE id = $2',
      [backupPath, deploymentId]
    );

    // Pull latest code
    const { stdout: gitOutput } = await execAsync(
      `cd /var/www/cup2cup && git pull origin ${branch}`,
      { timeout: 30000 }
    );

    // Get commit hash
    const { stdout: commitHash } = await execAsync(
      'cd /var/www/cup2cup && git rev-parse HEAD'
    );

    // Install dependencies
    await execAsync('cd /var/www/cup2cup && npm install', { timeout: 120000 });
    await execAsync('cd /var/www/cup2cup/client && npm install', { timeout: 120000 });

    // Build frontend
    await execAsync('cd /var/www/cup2cup/client && npm run build', { timeout: 180000 });

    // Restart PM2
    await execAsync('pm2 restart cup2cup-backend');

    // Update deployment record
    await query(
      `UPDATE deployment_history 
       SET status = $1, git_commit_hash = $2, completed_at = NOW()
       WHERE id = $3`,
      ['success', commitHash.trim(), deploymentId]
    );

    await logAdminAction(req.userId, 'DEPLOY', {
      branch,
      commitHash: commitHash.trim(),
      backupPath,
      ipAddress: req.ip
    });

    res.json({ 
      message: 'Deployment successful',
      commitHash: commitHash.trim(),
      backupPath,
      output: gitOutput
    });
  } catch (error) {
    console.error('Error deploying:', error);
    
    // Update deployment record with error
    await query(
      `UPDATE deployment_history 
       SET status = $1, error_message = $2, completed_at = NOW()
       WHERE deployed_by = $3 AND status = 'in_progress'`,
      ['failed', error.message, req.userId]
    );

    res.status(500).json({ error: 'Deployment failed: ' + error.message });
  }
});

// Restart server
router.post('/system/restart', requireAdminLevel(75), async (req, res) => {
  try {
    await execAsync('pm2 restart cup2cup-backend');

    await logAdminAction(req.userId, 'RESTART_SERVER', {
      ipAddress: req.ip
    });

    res.json({ message: 'Server restarted successfully' });
  } catch (error) {
    console.error('Error restarting server:', error);
    res.status(500).json({ error: 'Failed to restart server: ' + error.message });
  }
});

// Get deployment history
router.get('/deployments', async (req, res) => {
  try {
    const result = await query(`
      SELECT dh.*, u.username, u.display_name
      FROM deployment_history dh
      LEFT JOIN users u ON dh.deployed_by = u.id
      ORDER BY dh.started_at DESC
      LIMIT 20
    `);

    res.json({ deployments: result.rows });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

// Rollback to previous deployment
router.post('/system/rollback/:deploymentId', requireAdminLevel(100), async (req, res) => {
  try {
    const { deploymentId } = req.params;

    // Get deployment info
    const result = await query(
      'SELECT backup_path FROM deployment_history WHERE id = $1',
      [deploymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const { backup_path } = result.rows[0];

    if (!backup_path) {
      return res.status(400).json({ error: 'No backup available for this deployment' });
    }

    // Restore from backup
    await execAsync(`tar -xzf ${backup_path}-code.tar.gz -C /var/www`);

    // Restart server
    await execAsync('pm2 restart cup2cup-backend');

    await logAdminAction(req.userId, 'ROLLBACK', {
      deploymentId,
      backupPath: backup_path,
      ipAddress: req.ip
    });

    res.json({ message: 'Rollback successful' });
  } catch (error) {
    console.error('Error rolling back:', error);
    res.status(500).json({ error: 'Rollback failed: ' + error.message });
  }
});

export default router;
