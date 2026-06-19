import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'preferences'>('profile');
  
  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // Integration states
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [soundcloudConnected, setSoundcloudConnected] = useState(false);
  
  // Preferences
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoJoinVoice, setAutoJoinVoice] = useState(true);
  const [loudnessEqualization, setLoudnessEqualization] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const loadUserData = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setDisplayName(userData.displayName || '');
      setAvatar(userData.avatar || '');
      
      // Load preferences from localStorage
      const savedSoundEffects = localStorage.getItem('soundEffectsEnabled');
      const savedNotifications = localStorage.getItem('notificationsEnabled');
      const savedAutoJoin = localStorage.getItem('autoJoinVoice');
      const savedLoudness = localStorage.getItem('loudnessEqualization');
      const savedNoiseSuppression = localStorage.getItem('noiseSuppression');
      
      if (savedSoundEffects !== null) setSoundEffectsEnabled(JSON.parse(savedSoundEffects));
      if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications));
      if (savedAutoJoin !== null) setAutoJoinVoice(JSON.parse(savedAutoJoin));
      if (savedLoudness !== null) setLoudnessEqualization(JSON.parse(savedLoudness));
      if (savedNoiseSuppression !== null) setNoiseSuppression(JSON.parse(savedNoiseSuppression));
    } catch (error) {
      console.error('Failed to load user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement profile update API
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handleConnectSpotify = () => {
    // TODO: Implement Spotify OAuth flow
    window.location.href = '/api/auth/spotify';
  };

  const handleConnectSoundCloud = () => {
    // TODO: Implement SoundCloud OAuth flow
    window.location.href = '/api/auth/soundcloud';
  };

  const handleDisconnectSpotify = () => {
    setSpotifyConnected(false);
    alert('Spotify disconnected');
  };

  const handleDisconnectSoundCloud = () => {
    setSoundcloudConnected(false);
    alert('SoundCloud disconnected');
  };

  const handleSavePreferences = () => {
    localStorage.setItem('soundEffectsEnabled', JSON.stringify(soundEffectsEnabled));
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
    localStorage.setItem('autoJoinVoice', JSON.stringify(autoJoinVoice));
    localStorage.setItem('loudnessEqualization', JSON.stringify(loudnessEqualization));
    localStorage.setItem('noiseSuppression', JSON.stringify(noiseSuppression));
    alert('Preferences saved!');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'integrations'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Integrations
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Preferences
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Profile Settings
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {avatar && (
                    <img
                      src={avatar}
                      alt="Avatar preview"
                      className="mt-2 w-20 h-20 rounded-full object-cover"
                    />
                  )}
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Save Profile
                </button>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Music Integrations
                </h2>

                {/* Spotify */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-2xl">
                        🎵
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Spotify
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {spotifyConnected
                            ? 'Connected - Share your music in voice rooms'
                            : 'Connect to share your Spotify tracks'}
                        </p>
                      </div>
                    </div>
                    {spotifyConnected ? (
                      <button
                        onClick={handleDisconnectSpotify}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectSpotify}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      >
                        Connect Spotify
                      </button>
                    )}
                  </div>
                </div>

                {/* SoundCloud */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white text-2xl">
                        🎧
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          SoundCloud
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {soundcloudConnected
                            ? 'Connected - Share your SoundCloud tracks'
                            : 'Connect to share your SoundCloud music'}
                        </p>
                      </div>
                    </div>
                    {soundcloudConnected ? (
                      <button
                        onClick={handleDisconnectSoundCloud}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectSoundCloud}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                      >
                        Connect SoundCloud
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 <strong>Tip:</strong> Connect your music accounts to share what you're listening to in voice rooms and discover music with friends!
                  </p>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  App Preferences
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Sound Effects
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Play sounds for join, leave, mute, and other events
                      </p>
                    </div>
                    <button
                      onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        soundEffectsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          soundEffectsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive notifications for room invites and messages
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Auto-join Voice
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically connect to voice when joining a room
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoJoinVoice(!autoJoinVoice)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        autoJoinVoice ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          autoJoinVoice ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Dark Mode
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use dark theme across the app
                      </p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        🎚️ Loudness Equalization
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Normalize volume levels for users with quiet microphones
                      </p>
                    </div>
                    <button
                      onClick={() => setLoudnessEqualization(!loudnessEqualization)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        loudnessEqualization ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          loudnessEqualization ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        🎙️ Noise Suppression
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Advanced noise cancellation (Discord Krisp-style)
                      </p>
                    </div>
                    <button
                      onClick={() => setNoiseSuppression(!noiseSuppression)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        noiseSuppression ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          noiseSuppression ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Save Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
