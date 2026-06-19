import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

interface Stats {
  totalUsers: number;
  totalRooms: number;
  activeConnections: number;
}

interface Deployment {
  id: string;
  deployment_type: string;
  git_commit_hash: string;
  status: string;
  started_at: string;
  completed_at: string;
  username: string;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, deploymentsData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getDeployments()
      ]);
      setStats(statsData.stats);
      setDeployments(deploymentsData.deployments);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Admin access required');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError('Failed to load admin data');
      }
    }
  };

  const handleDeploy = async () => {
    if (!confirm('⚠️ This will update the server. A backup will be created automatically. Continue?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await adminAPI.deploy();
      setMessage(`✅ Deployment successful! Commit: ${result.commitHash?.substring(0, 7)}`);
      await loadData();
    } catch (err: any) {
      setError(`❌ Deployment failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!confirm('⚠️ This will restart the server. Continue?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await adminAPI.restart();
      setMessage('✅ Server restarted successfully!');
    } catch (err: any) {
      setError(`❌ Restart failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await adminAPI.createBackup();
      setMessage(`✅ Backup created: ${result.backupPath}`);
    } catch (err: any) {
      setError(`❌ Backup failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    if (!confirm('⚠️ This will rollback to a previous version. Continue?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await adminAPI.rollback(deploymentId);
      setMessage('✅ Rollback successful!');
      await loadData();
    } catch (err: any) {
      setError(`❌ Rollback failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">🛠️ Admin Panel</h1>
            <p className="text-gray-400">Cup2Cup System Management</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-gray-400 text-sm mb-2">Total Users</div>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-gray-400 text-sm mb-2">Total Rooms</div>
              <div className="text-3xl font-bold">{stats.totalRooms}</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-gray-400 text-sm mb-2">Active Connections</div>
              <div className="text-3xl font-bold text-green-400">{stats.activeConnections}</div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">🎛️ Server Controls</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={handleDeploy}
              disabled={loading}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {loading ? '⏳ Deploying...' : '🚀 Update & Deploy'}
            </button>
            <button
              onClick={handleRestart}
              disabled={loading}
              className="px-6 py-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {loading ? '⏳ Restarting...' : '🔄 Restart Server'}
            </button>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {loading ? '⏳ Creating...' : '💾 Create Backup'}
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>• <strong>Update & Deploy:</strong> Pulls latest code, creates backup, builds, and restarts</p>
            <p>• <strong>Restart Server:</strong> Restarts PM2 process without updating code</p>
            <p>• <strong>Create Backup:</strong> Creates database and code backup</p>
          </div>
        </div>

        {/* Deployment History */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">📜 Deployment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Commit</th>
                  <th className="text-left py-3 px-4">Deployed By</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((deployment) => (
                  <tr key={deployment.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        deployment.status === 'success' ? 'bg-green-900 text-green-300' :
                        deployment.status === 'failed' ? 'bg-red-900 text-red-300' :
                        'bg-yellow-900 text-yellow-300'
                      }`}>
                        {deployment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{deployment.deployment_type}</td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {deployment.git_commit_hash?.substring(0, 7) || 'N/A'}
                    </td>
                    <td className="py-3 px-4">{deployment.username || 'Unknown'}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(deployment.started_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {deployment.status === 'success' && (
                        <button
                          onClick={() => handleRollback(deployment.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded text-sm transition"
                        >
                          Rollback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deployments.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No deployment history yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
