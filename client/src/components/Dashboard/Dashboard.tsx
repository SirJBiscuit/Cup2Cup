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
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cup2Cup
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">
              {user?.displayName}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Rooms
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
          >
            Create Room
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/room/${room.phraseCode}`)}
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {room.phraseCode}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Max: {room.maxParticipants} participants</p>
                  {room.hasPassword && <p>🔒 Password protected</p>}
                  <p className="text-xs">
                    Created: {new Date(room.createdAt).toLocaleDateString()}
                  </p>
                </div>
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
