import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User } from '../types';

const DEMO_ACCOUNTS: Array<{ email: string; password: string; user: User }> = [
  { email: 'hse@safesense.ai', password: 'hse123', user: { id: '1', name: 'Alex Morgan', email: 'hse@safesense.ai', role: 'HSE Officer', site: 'Site Alpha' } },
  { email: 'manager@safesense.ai', password: 'mgr123', user: { id: '2', name: 'Jordan Lee', email: 'manager@safesense.ai', role: 'Safety Manager' } },
  { email: 'site@safesense.ai', password: 'site123', user: { id: '3', name: 'Chris Patel', email: 'site@safesense.ai', role: 'Site Manager', site: 'Site Beta' } },
  { email: 'admin@safesense.ai', password: 'admin123', user: { id: '4', name: 'Sam Rivera', email: 'admin@safesense.ai', role: 'Administrator' } },
];

export default function LoginPage() {
  const [email, setEmail] = useState('admin@safesense.ai');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { dispatch } = useApp();
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const account = DEMO_ACCOUNTS.find(a => a.email === email && a.password === password);
    if (account) {
      dispatch({ type: 'LOGIN', payload: account.user });
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Try admin@safesense.ai / admin123');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] bg-grid flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-200/30 to-cyan-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SafeSense AI</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Safety Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="card shadow-soft-lg p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Sign in to your account</h2>
          <p className="text-slate-500 text-sm mb-6">HSE teams — enter your credentials to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 block">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2 py-3">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wide">Quick Demo Logins</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-200 transition-all shadow-2xs group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">{acc.user.role}</div>
                  <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          SafeSense AI — Enterprise Safety Intelligence Platform
        </p>
      </div>
    </div>
  );
}
