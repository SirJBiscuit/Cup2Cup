import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: any) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    try {
      await authAPI.login(adminUsername, adminPassword);
      navigate('/admin');
    } catch (err: any) {
      setAdminError(err.response?.data?.error || 'Admin login failed');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-4 py-8 animate-fadeIn">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 animate-scaleIn">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Cup2Cup
          </h1>
          <p className="text-gray-400">
            High-quality voice chat platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1 rounded transition-all transform hover:scale-110 active:scale-95"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="text-lg">{showPassword ? '🙈' : '👁️'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm sm:text-base text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-400 hover:underline font-medium"
            >
              Register
            </Link>
          </p>
          <p className="text-gray-400">
            or{' '}
            <Link
              to="/guest"
              className="text-blue-400 hover:underline font-medium"
            >
              Join as Guest
            </Link>
          </p>
          <p className="text-gray-400 pt-2 border-t border-gray-700">
            <button
              onClick={() => setShowAdminModal(true)}
              className="text-purple-400 hover:underline font-medium"
            >
              🔐 Admin Login
            </button>
          </p>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 max-w-md w-full animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">🔐 Admin Login</h2>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-700 text-white"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-700 text-white"
                  required
                />
              </div>

              {adminError && (
                <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                {adminLoading ? 'Logging in...' : 'Login as Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
