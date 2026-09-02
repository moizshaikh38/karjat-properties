import React, { useState, useEffect } from 'react';
import { MessageSquare, Shield, Key, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

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
      toast.success('Test WhatsApp message sent');
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 animate-entrance">
      
      {/* HEADER */}
      <div className="pb-4 border-b border-[var(--color-border)]">
        <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
          System & Account Settings
        </h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
          Fast2SMS gateway configuration, staff credentials, and brokerage preferences.
        </p>
      </div>

      {/* 1. WHATSAPP GATEWAY */}
      <section className="bg-[var(--color-surface)] rounded-[6px] border border-[var(--color-border)] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h2 className="text-[14px] font-medium text-[var(--color-text)]">Fast2SMS WhatsApp Gateway</h2>
          </div>
          <Badge variant={waHealth === 'healthy' ? 'success' : waHealth === 'unhealthy' ? 'danger' : 'default'}>
            {waHealth === 'healthy' ? 'Live & Connected' : waHealth === 'unhealthy' ? 'Connection Error' : 'Checking...'}
          </Badge>
        </div>

        <div className="p-4 space-y-4 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)] block">Provider Name</span>
              <span className="font-medium text-[var(--color-text)]">Fast2SMS Business API</span>
            </div>
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)] block">Registered Phone ID</span>
              <span className="font-mono text-[var(--color-text)]">{waSettings?.phone_number_id || '372339272638522'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
            <p className="text-[12px] text-[var(--color-text-muted)]">
              Outbound message dispatch, media attachments, and webhook reception.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestMessage}
            >
              Send Test Ping
            </Button>
          </div>
        </div>
      </section>

      {/* 2. SECURITY & PASSWORD */}
      <section className="bg-[var(--color-surface)] rounded-[6px] border border-[var(--color-border)] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
          <Key className="w-4 h-4 text-[var(--color-text-muted)]" />
          <h2 className="text-[14px] font-medium text-[var(--color-text)]">Brokerage Security Credentials</h2>
        </div>

        <div className="p-4">
          <form onSubmit={handlePasswordChange} className="space-y-3.5 max-w-md">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passForm.current_password}
                onChange={(e) => setPassForm({ ...passForm, current_password: e.target.value })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">New Password</label>
              <input
                type="password"
                required
                value={passForm.new_password}
                onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passForm.confirm_password}
                onChange={(e) => setPassForm({ ...passForm, confirm_password: e.target.value })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={passLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </section>

    </div>
  );
}
