import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Upload, Brain, TrendingUp, GitBranch,
  MapPin, CheckSquare, MessageSquare, FileText, Settings, Menu, X,
  LogOut, Bell, ChevronRight, Zap, AlertTriangle, User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/home', icon: Shield, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Reports' },
  { to: '/analysis', icon: Brain, label: 'AI Analysis' },
  { to: '/risk-intelligence', icon: TrendingUp, label: 'Risk Intelligence' },
  { to: '/patterns', icon: GitBranch, label: 'Safety Patterns' },
  { to: '/sites', icon: MapPin, label: 'Sites & Activities' },
  { to: '/actions', icon: CheckSquare, label: 'Action Center' },
  { to: '/copilot', icon: MessageSquare, label: 'Safety Copilot' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/command-center', icon: Zap, label: 'Command Center' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, dispatch, sidebarOpen, dataset, isDemo } = useApp();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  function handleLogout() {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 flex-shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="font-bold text-white text-base leading-tight">SafeSense AI</div>
              <div className="text-xs text-blue-400 truncate">Safety Intelligence</div>
            </div>
          )}
        </div>

        {/* Dataset status */}
        {sidebarOpen && dataset && (
          <div className={`mx-3 mt-3 px-3 py-2 rounded-lg text-xs ${isDemo ? 'bg-amber-900/30 border border-amber-500/30 text-amber-300' : 'bg-green-900/30 border border-green-500/30 text-green-300'}`}>
            {isDemo ? '⚠ Demo Data Active' : `✓ ${dataset.rows} reports loaded`}
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {sidebarOpen && (
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        {sidebarOpen && user && (
          <div className="border-t border-slate-700/50 p-3">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 cursor-pointer" onClick={handleLogout}>
              <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{user.role}</div>
              </div>
              <LogOut className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </div>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-5 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            {isDemo && (
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">
                ⚠ Synthetic Demo Data — Not Real Organizational Data
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <User className="w-4 h-4" />
                <span className="hidden sm:block">{user.role}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 bg-grid">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
