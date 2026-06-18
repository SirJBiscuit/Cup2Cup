import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI, authAPI } from '../../services/api';
import type { Room, User } from '../../types';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPersistent, setIsPersistent] = useState(true);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const loadDashboard = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      const roomsData = await roomAPI.getMyRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const newRoom = await roomAPI.createRoom({
        isPersistent,
        password: password || undefined,
        maxParticipants,
      });
      setShowCreateModal(false);
      setPassword('');
      navigate(`/room/${newRoom.phraseCode}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create room');
    }
  };

  const handleDeleteRoom = async (roomId: number, phraseCode: string, e: any) => {
    e.stopPropagation();
    if (!confirm(`Delete room "${phraseCode}"? This cannot be undone.`)) return;
    
    try {
      await roomAPI.deleteRoom(phraseCode);
      setRooms(rooms.filter((r: Room) => r.id !== roomId));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete room');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fadeIn">
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Cup2Cup
          </h1>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 sm:p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-110 active:scale-95"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
            </button>
            <span className="hidden sm:inline text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {user?.displayName}
            </span>
            <button
              onClick={() => navigate('/settings')}
              className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-105 active:scale-95"
            >
              <span className="sm:hidden">⚙️</span>
              <span className="hidden sm:inline">⚙️ Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-105 active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white animate-slideIn">
            My Rooms
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            + Create Room
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any rooms yet
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your first room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {rooms.map((room, index) => (
              <div
                key={room.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-xl transition-all duration-300 relative group transform hover:scale-105 active:scale-100 animate-scaleIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/room/${room.phraseCode}`)}
                >
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 pr-8">
                    {room.phraseCode}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2">
                      <span>👥</span>
                      <span>Max: {room.maxParticipants}</span>
                    </p>
                    {room.hasPassword && (
                      <p className="flex items-center gap-2">
                        <span>🔒</span>
                        <span>Password protected</span>
                      </p>
                    )}
                    <p className="text-xs flex items-center gap-2">
                      <span>📅</span>
                      <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteRoom(room.id, room.phraseCode, e)}
                  className="absolute top-3 right-3 p-2 sm:p-3 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transform hover:scale-110 active:scale-95"
                  title="Delete room"
                >
                  <span className="text-lg">🗑️</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create New Room
            </h3>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="persistent"
                  checked={isPersistent}
                  onChange={(e) => setIsPersistent(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="persistent" className="text-gray-700 dark:text-gray-300">
                  Persistent room (stays after you leave)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password (optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Leave empty for no password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Participants: {maxParticipants}
                </label>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
