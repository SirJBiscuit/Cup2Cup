import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import VoiceRoom from './components/Room/VoiceRoom';
import GuestJoin from './components/Auth/GuestJoin';
import Settings from './components/Settings/Settings';
import AdminPanel from './components/Admin/AdminPanel';

function App() {
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
