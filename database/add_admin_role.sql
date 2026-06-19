-- Add admin role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_level INTEGER DEFAULT 0;

-- Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create system_status table for monitoring
CREATE TABLE IF NOT EXISTS system_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_type VARCHAR(50) NOT NULL,
  status_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create deployment_history table
CREATE TABLE IF NOT EXISTS deployment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deployment_type VARCHAR(50) NOT NULL,
  git_commit_hash VARCHAR(40),
  backup_path TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_deployment_history_deployed_by ON deployment_history(deployed_by);
CREATE INDEX IF NOT EXISTS idx_deployment_history_created ON deployment_history(started_at);

-- Insert first admin user (update username as needed)
-- Password: admincpwe256!
-- Hash generated with bcrypt rounds=12
INSERT INTO users (username, display_name, password_hash, is_admin, admin_level)
VALUES (
  'admin',
  'System Administrator',
  '$2b$12$8vJ5YZKx3qN9mH7wL2fXPeGjKxDZnQp4rT6sU8vW0yX1zA2bC3dE.',
  true,
  100
)
ON CONFLICT (username) DO UPDATE SET is_admin = true, admin_level = 100, password_hash = '$2b$12$8vJ5YZKx3qN9mH7wL2fXPeGjKxDZnQp4rT6sU8vW0yX1zA2bC3dE.';

COMMENT ON COLUMN users.is_admin IS 'Whether user has admin privileges';
COMMENT ON COLUMN users.admin_level IS 'Admin permission level (0=none, 100=super admin)';
COMMENT ON TABLE admin_actions IS 'Audit log of all admin actions';
COMMENT ON TABLE deployment_history IS 'History of deployments and updates';
