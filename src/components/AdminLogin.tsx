import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { signInWithGoogle, signInWithEmail } from '../lib/firebase.js';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
  onBackToHome: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToHome,
  onShowToast,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username/email and password');
      return;
    }

    setIsLoading(true);
    try {
      // Local fallback keeps the existing simple admin login working in the APK.
      if (username.trim() === 'admin' && password === 'admin123') {
        onShowToast('Welcome to Admin Dashboard');
        onLoginSuccess(`local_admin_${Date.now()}`, 'admin');
        return;
      }

      if (!username.includes('@')) {
        throw new Error('Use admin / admin123, or enter a Firebase email and password.');
      }

      const { user, idToken } = await signInWithEmail(username.trim(), password);
      onShowToast('Firebase login successful');
      onLoginSuccess(idToken, user.email || username.trim());
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        setErrorMessage('Invalid email or password');
      } else {
        setErrorMessage(err?.message || 'Invalid username or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const { user, idToken } = await signInWithGoogle();
      onShowToast(`Welcome ${user.email || 'Admin'}`);
      onLoginSuccess(idToken, user.email || user.displayName || 'Admin');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Firebase sign-in popup was closed.');
      } else {
        setErrorMessage(err?.message || 'Firebase Authentication failed');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage(null);
  };

  return (
    <div id="admin-login-screen" className="max-w-md mx-auto py-8 sm:py-12 animate-in fade-in duration-200">
      {/* Back to Home Button */}
      <div className="mb-6 flex justify-between items-center">
        <button
          id="admin-login-back-btn"
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-sans-ui font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200/90 hover:border-stone-300 px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-stone-900 text-amber-100 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Shield className="w-7 h-7 text-amber-300" />
          </div>
          <h1 className="font-sans-ui text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Admin Login
          </h1>
          <p className="text-xs text-stone-500 font-sans-ui">
            Harf-e-Qalam — Management Portal
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="admin-login-error"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-sans-ui"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
              Username
            </label>
            <div className="relative">
              <input
                id="admin-username-input"
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-colors font-sans-ui"
                autoComplete="username"
                required
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-stone-700 font-sans-ui">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-colors font-sans-ui"
                autoComplete="current-password"
                required
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="admin-submit-login-btn"
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full mt-2 py-3 px-4 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-amber-50 rounded-xl text-sm font-semibold font-sans-ui shadow-xs hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="shrink-0 mx-3 text-stone-400 text-[11px] font-sans-ui uppercase tracking-wider">
            Or Sign In With
          </span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {/* Firebase Google Sign-In Button */}
        <button
          id="admin-firebase-google-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 border border-stone-200/90 rounded-xl text-xs font-semibold font-sans-ui shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
              <span>Authenticating with Firebase...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google (Firebase Auth)</span>
            </>
          )}
        </button>

        {/* Quick Credentials Info Box */}
        <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center justify-between text-xs font-sans-ui text-stone-600">
          <div>
            <span className="font-semibold text-stone-800">Default Login: </span>
            <code className="bg-stone-200/80 px-1.5 py-0.5 rounded text-[11px] text-stone-800 font-mono mr-1">admin</code>
            /
            <code className="bg-stone-200/80 px-1.5 py-0.5 rounded text-[11px] text-stone-800 font-mono ml-1">admin123</code>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-xs text-amber-800 font-sans-ui font-semibold hover:text-amber-950 underline cursor-pointer"
          >
            Quick Fill
          </button>
        </div>
      </div>
    </div>
  );
};
