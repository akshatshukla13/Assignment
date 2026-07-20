import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ShieldCheck, ShoppingCart, Warehouse, Calculator } from 'lucide-react';
import api from '../api/axios';

const ROLES = [
  {
    role: 'Admin',
    username: 'admin',
    password: 'admin123',
    icon: ShieldCheck,
    description: 'Full system access',
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50',
    lightText: 'text-violet-700',
    border: 'border-violet-200',
    activeBorder: 'border-violet-500',
    activeBg: 'bg-violet-50',
  },
  {
    role: 'Sales',
    username: 'sales1',
    password: 'sales123',
    icon: ShoppingCart,
    description: 'Customers & Challans',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    border: 'border-blue-200',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50',
  },
  {
    role: 'Warehouse',
    username: 'warehouse1',
    password: 'warehouse123',
    icon: Warehouse,
    description: 'Products & Stock',
    gradient: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    border: 'border-amber-200',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-50',
  },
  {
    role: 'Accounts',
    username: 'accounts1',
    password: 'accounts123',
    icon: Calculator,
    description: 'Read-only view',
    gradient: 'from-emerald-500 to-green-600',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50',
  },
];

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [activeRole, setActiveRole] = useState('Admin');
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        await api.get('/health');
        if (isMounted) setServerStatus('online');
      } catch (err) {
        if (isMounted) setServerStatus('offline');
      }
    };

    checkServer();

    // Check again every 5s if offline/checking to handle serverless cold start wakeup
    const timer = setInterval(() => {
      if (serverStatus !== 'online') {
        checkServer();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [serverStatus]);

  const prefill = (r) => {
    setActiveRole(r.role);
    setUsername(r.username);
    setPassword(r.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const active = ROLES.find(r => r.role === activeRole);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{
      background: 'radial-gradient(ellipse at 60% 0%, rgba(99,102,241,0.12) 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(16,185,129,0.08) 0%, transparent 50%), linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)'
    }}>
      <div className="w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #001e40 0%, #003580 100%)' }}>
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mini ERP + CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your portal</p>
        </div>

        {/* Server Status Monitor */}
        <div className="mb-4">
          {serverStatus === 'checking' && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
              <span className="app-loader-spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px', borderTopColor: '#6366f1' }} />
              Connecting to API server...
            </div>
          )}
          {serverStatus === 'online' && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              API Server Online & Connected
            </div>
          )}
          {serverStatus === 'offline' && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
              Server warming up (cold start, please wait 10-15s)...
            </div>
          )}
        </div>

        <div className="app-dialog-panel space-y-6">
          {/* Role Picker */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Quick login — select a role
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isActive = activeRole === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => prefill(r)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left
                      ${isActive
                        ? `${r.activeBorder} ${r.activeBg} shadow-sm scale-[1.02]`
                        : `${r.border} bg-white hover:${r.activeBg} hover:scale-[1.01]`
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${r.gradient}`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-none ${isActive ? r.lightText : 'text-slate-800'}`}>
                        {r.role}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{r.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400 font-medium">or enter manually</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Username
              </label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={e => { setUsername(e.target.value); setActiveRole(null); }}
                required
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={e => { setPassword(e.target.value); setActiveRole(null); }}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Prefilled badge */}
            {active && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${active.lightBg} ${active.lightText} border ${active.border}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br ${active.gradient}`}>
                  <active.icon size={11} className="text-white" />
                </div>
                Logging in as <strong>{active.role}</strong> · {active.username} / {active.password}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base mt-1"
              disabled={loading}
              style={{ background: active ? `linear-gradient(135deg, ${active.gradient.includes('violet') ? '#7c3aed, #9333ea' : active.gradient.includes('blue') ? '#3b82f6, #6366f1' : active.gradient.includes('amber') ? '#f59e0b, #f97316' : '#10b981, #059669'})` : 'linear-gradient(135deg, #001e40, #003580)' }}
            >
              {loading
                ? <span className="app-loader-spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                : `Sign In${active ? ` as ${active.role}` : ''}`
              }
            </button>
          </form>

          {/* Developer Showcase Section */}
          <div className="pt-5 border-t border-slate-200 text-center space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Developed By</p>
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-bold text-slate-800">Akshat Shukla</h4>
              <p className="text-[11px] text-slate-500 leading-tight">Full Stack Developer Assignment Submission</p>
            </div>
            <div className="flex justify-center gap-2">
              <a href="https://github.com/akshatshukla13/Assignment/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="btn-muted text-[10px] py-1 px-2.5 rounded-lg text-slate-600 hover:text-indigo-600">
                📖 README
              </a>
              <a href="https://github.com/akshatshukla13" target="_blank" rel="noopener noreferrer" className="btn-muted text-[10px] py-1 px-2.5 rounded-lg text-slate-600 hover:text-indigo-600">
                💻 GitHub
              </a>
              <a href="mailto:akshatvijay1302@gmail.com" className="btn-muted text-[10px] py-1 px-2.5 rounded-lg text-slate-600 hover:text-indigo-600">
                ✉️ Email
              </a>
            </div>
          </div>

        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Mini ERP + CRM · Full Stack Case Study
        </p>
      </div>
    </div>
  );
}
