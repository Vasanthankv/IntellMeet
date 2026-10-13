import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, UserCircle2, Plus, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

// ─── Social provider icon components ────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// ─── Provider branding config ────────────────────────────────────────────────
const PROVIDER_CONFIG = {
  Google: {
    icon: GoogleIcon,
    color: '#4285F4',
    bg: 'bg-[#4285F4]',
    hover: 'hover:bg-[#3367d6]',
    ring: 'focus-visible:ring-[#4285F4]',
    label: 'Google',
    logoSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  Facebook: {
    icon: FacebookIcon,
    color: '#1877F2',
    bg: 'bg-[#1877F2]',
    hover: 'hover:bg-[#166FE5]',
    ring: 'focus-visible:ring-[#1877F2]',
    label: 'Facebook',
    logoSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  Twitter: {
    icon: TwitterIcon,
    color: '#000000',
    bg: 'bg-black',
    hover: 'hover:bg-gray-800',
    ring: 'focus-visible:ring-gray-700',
    label: 'X / Twitter',
    logoSvg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
};

// ─── Mock accounts (stored accounts for the chooser) ─────────────────────────
// Helper: Read device-remembered accounts from local browser storage only
const getDeviceStoredAccounts = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('intellmeet_device_accounts');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveDeviceAccount = (acc) => {
  if (typeof window === 'undefined' || !acc?.email) return;
  try {
    const list = getDeviceStoredAccounts().filter(a => a.email?.toLowerCase() !== acc.email.toLowerCase());
    list.unshift({
      name: acc.name || acc.email.split('@')[0],
      email: acc.email.toLowerCase(),
      initials: (acc.name || acc.email).substring(0, 2).toUpperCase(),
      color: acc.color || '#4285F4',
      avatar: acc.avatar || '',
      signedIn: false,
    });
    // Keep max 5 most recent accounts on device
    localStorage.setItem('intellmeet_device_accounts', JSON.stringify(list.slice(0, 5)));
  } catch (e) {}
};

// ─── OAuth Account Chooser Overlay ───────────────────────────────────────────
function OAuthAccountChooser({ provider, onSelect, onClose, isLoading }) {
  const cfg = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.Google;
  const [deviceAccounts, setDeviceAccounts] = useState(() => getDeviceStoredAccounts());
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    const derivedName = customName.trim() || customEmail.split('@')[0];
    const newAcc = {
      name: derivedName,
      email: customEmail.trim().toLowerCase(),
      initials: derivedName.substring(0, 2).toUpperCase(),
      color: '#4285F4',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=4285F4&color=fff`,
    };
    onSelect(newAcc);
  };

  const handleRemoveAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const updated = deviceAccounts.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    setDeviceAccounts(updated);
    try {
      localStorage.setItem('intellmeet_device_accounts', JSON.stringify(updated));
    } catch (err) {}
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[420px] bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">

        {/* ── Header: provider logo + app name ── */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6 border-b border-[#30363d] bg-[#0d1117]">
          {/* Provider logo circle */}
          <div className="w-14 h-14 rounded-full bg-[#161b22] border-2 border-[#30363d] flex items-center justify-center mb-4 shadow-lg">
            {cfg.logoSvg}
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Choose an account</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            to continue to{' '}
            <span className="text-[#58a6ff] font-medium">IntelliMeet</span>
          </p>
        </div>

        {/* ── Add account inline form ── */}
        {showAddForm ? (
          <form onSubmit={handleCustomSubmit} className="p-5 space-y-3 bg-[#0d1117]">
            <p className="text-xs text-[#8b949e] font-medium">Enter your {provider} account credentials:</p>
            <div>
              <input
                type="text"
                placeholder="Full Name (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-white text-sm placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email address (e.g. you@gmail.com)"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-white text-sm placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 text-xs text-[#8b949e] hover:text-white border border-[#30363d] rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 text-xs font-semibold text-white bg-[#238636] hover:bg-[#2ea043] rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          /* ── Account list ── */
          <ul className="divide-y divide-[#21262d] max-h-[320px] overflow-y-auto">
            {deviceAccounts.length > 0 ? (
              deviceAccounts.map((acc, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => onSelect(acc)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#21262d] transition-colors text-left group disabled:opacity-50 disabled:cursor-wait focus:outline-none focus-visible:bg-[#21262d]"
                  >
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: acc.color || '#4285F4' }}
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        acc.initials || 'U'
                      )}
                    </div>

                    {/* Name & email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{acc.name}</p>
                      <p className="text-xs text-[#8b949e] truncate">{acc.email}</p>
                    </div>

                    {/* Remove account button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveAccount(e, acc.email)}
                      title="Remove from this device"
                      className="text-[#484f58] hover:text-[#f85149] p-1 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-5 py-6 text-center text-xs text-[#8b949e]">
                No accounts remembered on this device yet. Click below to sign in with your {provider} account.
              </li>
            )}

            {/* Use another account row */}
            <li>
              <button
                onClick={() => setShowAddForm(true)}
                disabled={isLoading}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#21262d] transition-colors text-left group disabled:opacity-50 focus:outline-none focus-visible:bg-[#21262d]"
              >
                <div className="w-11 h-11 rounded-full border border-[#30363d] bg-[#21262d] flex items-center justify-center text-[#8b949e] flex-shrink-0">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-[#c9d1d9] font-medium">Use another account</p>
                  <p className="text-xs text-[#8b949e]">Sign in with any {provider} email</p>
                </div>
              </button>
            </li>
          </ul>
        )}

        {/* ── Footer: Privacy links ── */}
        <div className="px-6 py-4 bg-[#0d1117] border-t border-[#21262d] flex flex-col items-center gap-2">
          <p className="text-[11px] text-[#484f58] text-center leading-relaxed">
            Before using this app, you can review{' '}
            <a href="#" className="text-[#58a6ff] hover:underline" onClick={e => e.preventDefault()}>IntelliMeet&apos;s Privacy Policy</a>
            {' '}and{' '}
            <a href="#" className="text-[#58a6ff] hover:underline" onClick={e => e.preventDefault()}>Terms of Service</a>.
          </p>
          <button
            onClick={onClose}
            className="mt-1 text-xs text-[#8b949e] hover:text-white transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Login Component ────────────────────────────────────────────────────
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [chooserProvider, setChooserProvider] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  });

  // ── Email/Password login ──
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await authService.login(data.email, data.password);
      login(res.user, res.token);
      saveDeviceAccount(res.user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Open OAuth account chooser ──
  const handleSocialLogin = (provider) => {
    setChooserProvider(provider);
  };

  // ── Process account selection from chooser ──
  const processSocialLogin = async (account) => {
    setSocialLoading(true);
    try {
      const providerData = {
        provider: chooserProvider,
        email: account.email,
        name: account.name,
        avatar: account.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=${(account.color || '#4285F4').replace('#', '')}&color=fff`,
      };

      const res = await authService.socialLogin(providerData);
      login(res.user, res.token);
      saveDeviceAccount(res.user);
      toast.success(`Signed in as ${account.name}`);
      setChooserProvider(null);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || `${chooserProvider} sign-in failed. Please try again.`);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-lg">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sign in to IntellMeet</h2>
        <p className="mt-2 text-sm text-gray-500">Enter your details below to access your account</p>
      </div>

      {/* Email/Password Form */}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                {...register('email', { required: 'Email is required' })}
                error={errors.email?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                {...register('password', { required: 'Password is required' })}
                error={errors.password?.message}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
          </div>
          <Link to="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-500 transition-colors">
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" className="w-full h-11 text-base" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-200" />
        <span className="flex-shrink mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
          or continue with
        </span>
        <div className="flex-grow border-t border-gray-200" />
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {(['Google', 'Facebook', 'Twitter']).map((provider) => {
          const cfg = PROVIDER_CONFIG[provider];
          const Icon = cfg.icon;
          return (
            <button
              key={provider}
              type="button"
              onClick={() => handleSocialLogin(provider)}
              disabled={!!chooserProvider}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label={`Sign in with ${provider}`}
            >
              <Icon />
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{provider === 'Twitter' ? 'X' : provider}</span>
            </button>
          );
        })}
      </div>

      {/* Register Link */}
      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
          Sign up
        </Link>
      </p>

      {/* GitHub-style OAuth Account Chooser */}
      {chooserProvider && (
        <OAuthAccountChooser
          provider={chooserProvider}
          onSelect={processSocialLogin}
          onClose={() => { setChooserProvider(null); setSocialLoading(false); }}
          isLoading={socialLoading}
        />
      )}
    </div>
  );
}
