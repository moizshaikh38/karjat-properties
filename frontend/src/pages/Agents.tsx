import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, Edit2, Trash2, Check, X, Lock, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { Modal } from '../components/ui/Modal';

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
      setTeam(list);
    } catch (error) {
      toast.error('Failed to load team members');
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
      toast.error('Please enter name, email, and password');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      toast.success('Team member added successfully! 🎉');
      setIsAddModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      setIsSubmitting(true);
      await api.patch(`/users/${selectedMember.id}`, {
        name: formData.name,
        role: formData.role,
      });
      toast.success('Member updated successfully! ✨');
      setIsEditModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role === 'agent') {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-20">
        <Shield className="mx-auto h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Access Restricted</h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          Only administrators and managers have permission to manage staff accounts.
        </p>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
            Manager
          </span>
        );
      case 'agent':
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
            Sales Agent
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[var(--color-primary)]" />
            Staff & Team Management
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Manage real estate sales executives, managers, and system permissions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-xs sm:text-sm font-semibold rounded-xl hover:opacity-90 shadow-sm transition-opacity"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Grid & Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-[var(--color-surface)] h-20 rounded-2xl border border-[var(--color-border)]"
            ></div>
          ))}
        </div>
      ) : team.length === 0 ? (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] shadow-xs">
          <Users className="mx-auto h-12 w-12 text-[var(--color-text-muted)] mb-3 opacity-40" />
          <h3 className="text-base font-bold text-[var(--color-text)] mb-1">No staff members found</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Add your team executives to start assigning leads.</p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl"
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name & Contact</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Access Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-[var(--color-surface-elevated)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--color-text)]">{member.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5 font-mono">
                        <Mail className="w-3.5 h-3.5" /> {member.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(member.role)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                        title="Edit Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Member"
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Patil"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="rahul@karjatproperties.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
            >
              <option value="agent">Sales Agent (Handles Leads & Chats)</option>
              <option value="manager">Sales Manager (Manages Team & Campaigns)</option>
              <option value="admin">Administrator (Full System Access)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT ROLE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Role: ${selectedMember?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
            >
              <option value="agent">Sales Agent</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Update Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
