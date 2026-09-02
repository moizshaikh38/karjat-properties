import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, MessageSquare, Shield, Key, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [waHealth, setWaHealth] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');
  const [waSettings, setWaSettings] = useState<any>(null);
  
  const [passForm, setPassForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    checkWaHealth();
    fetchWaSettings();
  }, []);

  const checkWaHealth = async () => {
    try {
      await api.get('/whatsapp/health');
      setWaHealth('healthy');
    } catch {
      setWaHealth('unhealthy');
    }
  };

  const fetchWaSettings = async () => {
    try {
      const res = await api.get('/whatsapp/settings');
      setWaSettings(res.data.data);
    } catch {
      console.error('Failed to load WA settings');
    }
  };

  const handleTestMessage = async () => {
    try {
      await api.post('/whatsapp/test-message');
      toast.success('Test message sent');
    } catch {
      toast.error('Failed to send test message');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) {
      return toast.error('Passwords do not match');
    }
    setPassLoading(true);
    try {
      await api.post('/auth/change-password', passForm);
      toast.success('Password updated successfully');
      setPassForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      toast.error('Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>
      </div>

      <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <h2 className="text-lg font-medium text-[var(--color-text)] flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-[var(--color-text-muted)]" />
            WhatsApp Provider
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Provider Status</p>
              <div className="flex items-center">
                <span className="font-medium text-[var(--color-text)] mr-3">Fast2SMS</span>
                {waHealth === 'checking' && <span className="text-xs text-gray-500">Checking...</span>}
                {waHealth === 'healthy' && (
                  <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" /> Connected
                  </span>
                )}
                {waHealth === 'unhealthy' && (
                  <span className="flex items-center text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" /> Disconnected
                  </span>
                )}
              </div>
            </div>
            {user?.role === 'admin' && (
              <button 
                onClick={handleTestMessage}
                className="px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Send Test Message
              </button>
            )}
          </div>
          
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Phone Number ID</p>
            <p className="font-mono text-sm text-[var(--color-text)] p-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md inline-block">
              {waSettings?.phone_number_id ? `********${waSettings.phone_number_id.slice(-4)}` : 'Not configured'}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <h2 className="text-lg font-medium text-[var(--color-text)] flex items-center">
            <Shield className="w-5 h-5 mr-2 text-[var(--color-text-muted)]" />
            Account Security
          </h2>
        </div>
        <div className="p-6">
          <div className="mb-6 pb-6 border-b border-[var(--color-border)]">
            <h3 className="font-medium text-[var(--color-text)] mb-1">Profile Info</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">You are logged in as <span className="font-medium text-[var(--color-text)]">{user?.name}</span> ({user?.email})</p>
            <span className="inline-block px-2.5 py-1 text-xs font-medium bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-[var(--color-text)] uppercase">
              Role: {user?.role}
            </span>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <h3 className="font-medium text-[var(--color-text)] flex items-center mb-4">
              <Key className="w-4 h-4 mr-2" /> Change Password
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Current Password</label>
              <input 
                type="password" 
                required
                value={passForm.current_password}
                onChange={e => setPassForm({...passForm, current_password: e.target.value})}
                className="w-full p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">New Password</label>
              <input 
                type="password"
                required
                value={passForm.new_password}
                onChange={e => setPassForm({...passForm, new_password: e.target.value})}
                className="w-full p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Confirm New Password</label>
              <input 
                type="password"
                required
                value={passForm.confirm_password}
                onChange={e => setPassForm({...passForm, confirm_password: e.target.value})}
                className="w-full p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <button 
              type="submit"
              disabled={passLoading}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
            >
              {passLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
