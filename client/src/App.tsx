import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import VoiceRoom from './components/Room/VoiceRoom';
import GuestJoin from './components/Auth/GuestJoin';
import Settings from './components/Settings/Settings';
import AdminPanel from './components/Admin/AdminPanel';
import { useDeviceDetection } from './hooks/useDeviceDetection';

function App() {
  const device = useDeviceDetection();

  useEffect(() => {
    console.log('🖥️ Device Detection:', {
      type: device.isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop',
      platform: device.platform,
      screen: `${device.screenWidth}x${device.screenHeight}`,
      orientation: device.orientation,
      touch: device.isTouchDevice ? 'Yes' : 'No',
    });

    // Add device class to body for CSS targeting
    document.body.classList.remove('mobile', 'tablet', 'desktop');
    if (device.isMobile) document.body.classList.add('mobile');
    else if (device.isTablet) document.body.classList.add('tablet');
    else document.body.classList.add('desktop');
  }, [device]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/guest" element={<GuestJoin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/room/:phraseCode" element={<VoiceRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
