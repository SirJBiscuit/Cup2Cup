import { query } from '../config/database.js';

// Middleware to check if user is admin
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await query(
      'SELECT is_admin, admin_level FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminLevel = user.admin_level;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to check admin level
export const requireAdminLevel = (minLevel) => {
  return async (req, res, next) => {
    if (!req.adminLevel || req.adminLevel < minLevel) {
      return res.status(403).json({ 
        error: `Admin level ${minLevel} or higher required` 
      });
    }
    next();
  };
};

// Log admin action
export const logAdminAction = async (adminId, actionType, details = {}) => {
  try {
    await query(
      `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId,
        actionType,
        details.targetType || null,
        details.targetId || null,
        JSON.stringify(details),
        details.ipAddress || null
      ]
    );
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};
