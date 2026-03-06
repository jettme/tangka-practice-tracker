import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Home, CheckSquare, BarChart2, Image, Settings } from 'lucide-react';
import { Home as HomePage } from './pages/Home';
import { Records } from './pages/Records';
import { Stats } from './pages/Stats';
import { Gallery } from './pages/Gallery';
import { Settings as SettingsPage } from './pages/Settings';
import { initReminderOnStartup } from './stores/settingsStore';
import './App.css';

function Navigation() {
  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/records', icon: CheckSquare, label: '记录' },
    { path: '/stats', icon: BarChart2, label: '统计' },
    { path: '/gallery', icon: Image, label: '图库' },
    { path: '/settings', icon: Settings, label: '设置' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-tangka-sand/50 safe-area-pb">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors
              ${isActive ? 'text-tangka-red' : 'text-gray-400'}
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function App() {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Initialize daily reminder
    initReminderOnStartup();
  }, []);
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-tangka-cream max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/records" element={<Records />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}

export default App;
