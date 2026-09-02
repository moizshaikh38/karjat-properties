import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, Edit2, Trash2, Check, X, Lock, Phone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DEMO_TEAM } from '../data/demoData';

export default function Agents() {
  const { user } = useAuth();
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'agent' as 'admin' | 'manager' | 'agent',
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      const raw = response.data?.data;
      const list = raw?.users || (Array.isArray(raw) ? raw : []);
      setTeam(list.length > 0 ? list : DEMO_TEAM as any);
    } catch (error) {
      setTeam(DEMO_TEAM as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'agent',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (member: User) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: '',
      password: '',
      role: member.role,
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error('Please fill required fields');
    }

    try {
      setIsSubmitting(true);
      await api.post('/users', formData);
      toast.success('Team member invited successfully');
      setIsAddModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      setIsSubmitting(true);
      const payload: any = {
        name: formData.name,
        role: formData.role,
      };
      if (formData.password) payload.password = formData.password;

      await api.patch(`/users/${selectedMember.id}`, payload);
      toast.success('Team member updated');
      setIsEditModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col h-full bg-[var(--color-bg)] animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Brokerage Team & Agents
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Manage local Karjat executives, sales managers, and staff role permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTeam} 
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Invite Member
          </Button>
        </div>
      </div>

      {/* MOBILE TEAM CARDS (Visible on screens < 640px) */}
      <div className="block sm:hidden space-y-2.5 mb-4">
        {team.map(m => (
          <div
            key={m.id}
            className="luxury-card p-3.5 rounded-[6px] border border-[var(--color-border)] space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-[14px] text-[var(--color-text)]">
                  {m.name}
                </h3>
                <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                  {m.email}
                </span>
              </div>
              <Badge variant={m.role === 'admin' ? 'primary' : m.role === 'manager' ? 'warm' : 'default'}>
                {m.role?.toUpperCase() || 'AGENT'}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)] text-[11.5px]">
              <span className="text-[var(--color-success)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></span> Active
              </span>
              <button
                onClick={() => handleOpenEdit(m)}
                className="text-[var(--color-accent)] font-medium cursor-pointer"
              >
                Edit Role
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP DENSE TEAM TABLE (Hidden on mobile) */}
      <div className="hidden sm:flex flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[11px] font-medium text-[var(--color-text-muted)]">
                <th className="py-2.5 px-4 font-medium">Member Name</th>
                <th className="py-2.5 px-4 font-medium">Email Address</th>
                <th className="py-2.5 px-4 font-medium">Brokerage Role</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-28"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-36"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-20"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[12px] text-[var(--color-text-muted)]">
                    No team members recorded.
                  </td>
                </tr>
              ) : (
                team.map(m => (
                  <tr key={m.id} className="hover:bg-[var(--color-surface-elevated)]/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--color-text)]">
                      {m.name}
                    </td>

                    <td className="py-3 px-4 text-[12px] font-mono text-[var(--color-text-muted)]">
                      {m.email}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={m.role === 'admin' ? 'primary' : m.role === 'manager' ? 'warm' : 'default'}>
                        {m.role?.toUpperCase() || 'AGENT'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center text-[11px] text-[var(--color-success)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1.5"></span>
                        Active
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="text-[12px] font-medium text-[var(--color-accent)] hover:underline"
                      >
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Team Member' : 'Invite New Team Member'}
        maxWidth="sm"
      >
        <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sameer Patil"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {!isEditModalOpen && (
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="agent@karjatproperties.com"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Brokerage Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              <option value="agent">Field Agent / Site Executive</option>
              <option value="manager">Sales Manager</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
              {isEditModalOpen ? 'Change Password (optional)' : 'Temporary Password *'}
            </label>
            <input
              type="password"
              required={!isEditModalOpen}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {isEditModalOpen ? 'Save Changes' : 'Invite Member'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
