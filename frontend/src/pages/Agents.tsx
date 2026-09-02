import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

export default function Agents() {
  const { user } = useAuth();
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await api.get('/users');
      setTeam(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'agent') {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-20">
        <Shield className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Access Denied</h2>
        <p className="text-[var(--color-text-muted)]">You do not have permission to view team management.</p>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-200">Admin</span>;
      case 'manager': return <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">Manager</span>;
      case 'agent': return <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">Agent</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Team Management</h1>
        <button className="flex items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90">
          <UserPlus className="w-5 h-5 mr-2" />
          Add Member
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-[var(--color-surface)] h-20 rounded-xl border border-[var(--color-border)]"></div>
          ))}
        </div>
      ) : team.length === 0 ? (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <Users className="mx-auto h-12 w-12 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No team members found</h3>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Name</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Role</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {team.map(member => (
                <tr key={member.id} className="hover:bg-[var(--color-bg)] transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-[var(--color-text)]">{member.name}</div>
                    <div className="text-sm text-[var(--color-text-muted)] flex items-center mt-1">
                      <Mail className="w-3 h-3 mr-1" /> {member.email}
                    </div>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(member.role)}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm text-[var(--color-primary)] hover:underline font-medium">
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
