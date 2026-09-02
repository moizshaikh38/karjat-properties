import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data?.data || {};
      const authToken = payload.token || payload.accessToken;
      const authUser = payload.user;

      if (authToken && authUser) {
        login(authToken, authUser);
        toast.success('Welcome back');
        navigate('/dashboard');
      } else {
        setError('Authentication succeeded but session token was missing');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="w-9 h-9 bg-[var(--color-accent)] rounded-[6px] flex items-center justify-center text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <h2 className="text-center text-[22px] font-medium font-display tracking-tight text-[var(--color-text)]">
          Karjat Properties
        </h2>
        <p className="mt-1 text-center text-[12px] text-[var(--color-text-muted)]">
          Real Estate Operations & AI Sales CRM
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-[var(--color-surface)] py-6 px-5 sm:px-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] rounded-[6px] border border-[var(--color-border)]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                Brokerage Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  placeholder="admin@karjatproperties.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] pl-3 pr-9 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-[4px] bg-[var(--color-status-hot)]/10 border border-[var(--color-status-hot)]/25">
                <p className="text-[11px] text-[var(--color-status-hot)] text-center">{error}</p>
              </div>
            )}

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={loading}
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
