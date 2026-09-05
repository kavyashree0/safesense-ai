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
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-700">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 flex-shrink-0 z-20 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
          <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="font-bold text-slate-900 text-base leading-tight tracking-tight">SafeSense AI</div>
              <div className="text-xs text-indigo-600 font-medium truncate">Safety Intelligence</div>
            </div>
          )}
        </div>

        {/* Dataset status */}
        {sidebarOpen && dataset && (
          <div className={`mx-3 mt-3 px-3 py-2 rounded-xl text-xs font-medium ${
            isDemo 
              ? 'bg-amber-50 border border-amber-200 text-amber-800' 
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
            {isDemo ? '⚠ Demo Dataset Active' : `✓ ${dataset.rows} reports loaded`}
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs border border-indigo-100/80'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {sidebarOpen && (
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-40 text-slate-400" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        {sidebarOpen && user && (
          <div className="border-t border-slate-100 p-3 bg-slate-50/50">
            <div
              className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 cursor-pointer transition-all"
              onClick={handleLogout}
              title="Click to logout"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{user.role}</div>
              </div>
              <LogOut className="w-4 h-4 text-slate-400 hover:text-slate-600 flex-shrink-0" />
            </div>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            {isDemo && (
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-medium shadow-xs">
                ⚠ Synthetic Demo Data — Not Real Organizational Data
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
            {user && (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:block">{user.role}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] bg-grid">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
