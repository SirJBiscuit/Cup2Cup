import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { roomAPI } from '../../services/api';

const GuestJoin = () => {
  const [displayName, setDisplayName] = useState('');
  const [phraseCode, setPhraseCode] = useState('');
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = (e: any) => {
    e.preventDefault();
    if (!displayName || !phraseCode) {
      setError('Please fill in all fields');
      return;
    }
    navigate(`/room/${phraseCode}?guest=true&name=${encodeURIComponent(displayName)}`);
  };

  const handleCreateRoom = async (e: any) => {
    e.preventDefault();
    if (!displayName) {
      setError('Please enter a display name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const newRoom = await roomAPI.createRoom({
        isPersistent: false,
        maxParticipants: 10,
      });
      navigate(`/room/${newRoom.phraseCode}?guest=true&name=${encodeURIComponent(displayName)}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Join as Guest
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            No account needed
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              mode === 'join'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Join Room
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              mode === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Create Room
          </button>
        </div>

        {mode === 'join' ? (
          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="How others will see you"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={phraseCode}
                onChange={(e) => setPhraseCode(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g. alpha-bravo-123"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Join Room
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="How others will see you"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm">
              A temporary room will be created for you. The room will be deleted when everyone leaves.
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Want to create your own rooms?{' '}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestJoin;
