import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, X, Phone, User, Calendar, MapPin, Building, ChevronRight, Mail, DollarSign } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Lead } from '../types';
import { Modal } from '../components/ui/Modal';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTemp, setFilterTemp] = useState('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Lead Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'manual',
    status: 'new',
    temperature: 'WARM',
    preferred_locations: 'Bhilavle, Karjat',
    property_type: 'villa',
    preferred_bhk: '3',
    min_budget: '5000000',
    max_budget: '15000000',
    purchase_timeline: '1_to_3_months',
    purpose: 'self_use',
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads');
      const raw = res.data?.data;
      const list = raw?.leads || (Array.isArray(raw) ? raw : []);
      setLeads(list);
    } catch (err) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Please enter name and phone number');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone.replace(/\D/g, '')}`;
      const payload: any = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email.trim() || undefined,
        source: formData.source,
        status: formData.status,
      };

      if (formData.min_budget || formData.max_budget || formData.property_type) {
        payload.requirements = {
          preferred_city: 'Karjat',
          preferred_locations: formData.preferred_locations.split(',').map((l) => l.trim()).filter(Boolean),
          property_types: [formData.property_type],
          preferred_bhk: Number(formData.preferred_bhk) || 0,
          min_budget: Number(formData.min_budget) || 0,
          max_budget: Number(formData.max_budget) || 0,
          purpose: formData.purpose,
          purchase_timeline: formData.purchase_timeline,
        };
      }

      await api.post('/leads', payload);
      toast.success('Lead created successfully! 👤');
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        source: 'manual',
        status: 'new',
        temperature: 'WARM',
        preferred_locations: 'Bhilavle, Karjat',
        property_type: 'villa',
        preferred_bhk: '3',
        min_budget: '5000000',
        max_budget: '15000000',
        purchase_timeline: '1_to_3_months',
        purpose: 'self_use',
      });
      fetchLeads();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const leadList = Array.isArray(leads) ? leads : [];
  const filteredLeads = leadList
    .filter((l) => filterTemp === 'All' || l.temperature === filterTemp.toUpperCase())
    .filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(search.toLowerCase())) ||
        (l.phone && l.phone.includes(search)) ||
        (l.email && l.email.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-full bg-[var(--color-bg)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Leads</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Manage and track all your Karjat prospective buyers.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm font-medium shadow-sm transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)] inline-flex overflow-x-auto hide-scrollbar">
          {['All', 'Hot', 'Warm', 'Cold'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterTemp(f)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                filterTemp === f
                  ? 'bg-[var(--color-surface-elevated)] shadow-sm text-[var(--color-text)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Mobile Card List (Visible on mobile) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl animate-pulse"></div>
          ))
        ) : filteredLeads.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 text-center text-xs text-[var(--color-text-muted)]">
            No leads found matching your filters.
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs active:scale-[0.99] transition-transform cursor-pointer space-y-2.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text)]">{lead.name || 'Unknown Buyer'}</h3>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono">{lead.phone}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[var(--color-primary)]">{lead.lead_score || 0}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">/100</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-[var(--color-surface-elevated)] text-[var(--color-text)] text-[10px] rounded-md font-medium uppercase border border-[var(--color-border)]">
                    {lead.status?.replace(/_/g, ' ') || 'NEW'}
                  </span>
                  {lead.temperature && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        lead.temperature === 'VERY_HOT' || lead.temperature === 'HOT'
                          ? 'bg-rose-100 text-rose-700'
                          : lead.temperature === 'WARM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {lead.temperature}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--color-primary)] font-semibold flex items-center gap-0.5">
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (Hidden on mobile) */}
      <div className="hidden md:block flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] uppercase text-xs">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Name</th>
                <th className="px-6 py-3.5 font-semibold">Contact</th>
                <th className="px-6 py-3.5 font-semibold">Source</th>
                <th className="px-6 py-3.5 font-semibold">Status / Temp</th>
                <th className="px-6 py-3.5 font-semibold">Score</th>
                <th className="px-6 py-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-8"></div></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    No leads found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="hover:bg-[var(--color-surface-elevated)] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--color-text)]">{lead.name || 'Unknown'}</div>
                      {lead.email && <div className="text-xs text-[var(--color-text-muted)]">{lead.email}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-[var(--color-text-muted)]">{lead.phone}</td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                        {lead.source || 'whatsapp'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[var(--color-surface-elevated)] text-[var(--color-text)] text-[10px] rounded border border-[var(--color-border)] font-medium uppercase">
                          {lead.status?.replace(/_/g, ' ') || 'NEW'}
                        </span>
                        {lead.temperature && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              lead.temperature === 'VERY_HOT' || lead.temperature === 'HOT'
                                ? 'bg-rose-100 text-rose-700'
                                : lead.temperature === 'WARM'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {lead.temperature}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[var(--color-primary)]">{lead.lead_score || 0}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">/100</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD LEAD MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Lead" maxWidth="2xl">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kulkarni"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">WhatsApp / Phone *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Email (optional)</label>
              <input
                type="email"
                placeholder="e.g. ramesh@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              >
                <option value="manual">Manual Entry / Direct</option>
                <option value="whatsapp">WhatsApp Inbound</option>
                <option value="website">Website Inquiry</option>
                <option value="referral">Referral</option>
                <option value="instagram">Instagram</option>
                <option value="facebook_ads">Facebook Ads</option>
                <option value="google_ads">Google Ads</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Lead Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="property_interest">Property Interest</option>
                <option value="site_visit_requested">Site Visit Requested</option>
                <option value="site_visit_scheduled">Site Visit Scheduled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Preferred Property Type</label>
              <select
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              >
                <option value="villa">Villa</option>
                <option value="apartment">Apartment</option>
                <option value="farmhouse">Farmhouse</option>
                <option value="plot">Plot / Land</option>
                <option value="bungalow">Bungalow</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Min Budget (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="5000000"
                value={formData.min_budget}
                onChange={(e) => setFormData({ ...formData, min_budget: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Max Budget (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="15000000"
                value={formData.max_budget}
                onChange={(e) => setFormData({ ...formData, max_budget: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Preferred BHK</label>
              <input
                type="number"
                min="0"
                placeholder="3"
                value={formData.preferred_bhk}
                onChange={(e) => setFormData({ ...formData, preferred_bhk: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Preferred Locations in Karjat</label>
              <input
                type="text"
                placeholder="e.g. Bhilavle, Kashele, Dahivali"
                value={formData.preferred_locations}
                onChange={(e) => setFormData({ ...formData, preferred_locations: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-[var(--color-text)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-lg text-sm hover:bg-[var(--color-surface-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Slide-over Panel for Details */}
      {selectedLeadId && (
        <LeadDetailDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}
    </div>
  );
}

function LeadDetailDrawer({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeadDetails = async () => {
      try {
        setLoading(true);
        const [leadRes, reqRes, actRes] = await Promise.all([
          api.get(`/leads/${leadId}`).catch(() => ({ data: { data: null } })),
          api.get(`/leads/${leadId}/requirements`).catch(() => ({ data: { data: null } })),
          api.get(`/leads/${leadId}/interactions`).catch(() => ({ data: { data: null } })),
        ]);
        setData({
          lead: leadRes.data?.data?.lead || leadRes.data?.data,
          reqs: reqRes.data?.data?.requirements || reqRes.data?.data,
          activities: actRes.data?.data?.interactions || actRes.data?.data,
        });
      } catch (err) {
        toast.error('Failed to load lead details');
      } finally {
        setLoading(false);
      }
    };
    fetchLeadDetails();
  }, [leadId]);

  const formatPrice = (price: number) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/30 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[var(--color-surface)] h-full shadow-2xl flex flex-col border-l border-[var(--color-border)] animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Lead Profile</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[var(--color-bg)]">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-[var(--color-surface-elevated)] rounded-xl"></div>
              <div className="h-40 bg-[var(--color-surface-elevated)] rounded-xl"></div>
            </div>
          ) : !data?.lead ? (
            <div className="text-center text-[var(--color-text-muted)]">Lead details not available.</div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
                <h3 className="text-xl font-bold text-[var(--color-text)]">{data.lead.name || 'Unnamed Lead'}</h3>
                <div className="text-[var(--color-text-muted)] text-sm flex items-center gap-2 mt-1">
                  <Phone className="w-3.5 h-3.5" /> {data.lead.phone}
                </div>
                {data.lead.email && (
                  <div className="text-[var(--color-text-muted)] text-sm flex items-center gap-2 mt-1">
                    <Mail className="w-3.5 h-3.5" /> {data.lead.email}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="bg-[var(--color-surface-elevated)] px-3 py-1.5 rounded-lg text-sm border border-[var(--color-border)]">
                    Score: <span className="font-bold text-[var(--color-primary)]">{data.lead.lead_score || 0}</span>/100
                  </div>
                  <div className="bg-[var(--color-surface-elevated)] px-3 py-1.5 rounded-lg text-sm border border-[var(--color-border)] capitalize">
                    Status: <span className="font-medium text-[var(--color-text)]">{data.lead.status || 'New'}</span>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {data.reqs && (
                <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
                  <h4 className="font-semibold mb-3 text-[var(--color-text)] flex items-center gap-2">
                    <Building className="w-4 h-4 text-[var(--color-primary)]" /> Property Requirements
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {(data.reqs.min_budget || data.reqs.max_budget) && (
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-xs">Budget Range</span>
                        <span className="font-medium text-[var(--color-text)]">
                          {formatPrice(data.reqs.min_budget)} - {formatPrice(data.reqs.max_budget)}
                        </span>
                      </div>
                    )}
                    {data.reqs.preferred_bhk && (
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-xs">BHK Configuration</span>
                        <span className="font-medium text-[var(--color-text)]">{data.reqs.preferred_bhk} BHK</span>
                      </div>
                    )}
                    {data.reqs.preferred_locations && (
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-xs">Preferred Locations</span>
                        <span className="font-medium text-[var(--color-text)]">
                          {Array.isArray(data.reqs.preferred_locations)
                            ? data.reqs.preferred_locations.join(', ')
                            : data.reqs.preferred_locations}
                        </span>
                      </div>
                    )}
                    {data.reqs.property_type && (
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-xs">Property Type</span>
                        <span className="font-medium text-[var(--color-text)] capitalize">
                          {data.reqs.property_type}
                        </span>
                      </div>
                    )}
                    {data.reqs.purpose && (
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-xs">Purchase Purpose</span>
                        <span className="font-medium text-[var(--color-text)] capitalize">{data.reqs.purpose}</span>
                      </div>
                    )}
                    {data.reqs.purchase_timeline && (
                      <div>
                        <span className="text-[var(--color-text-muted)] block text-xs">Timeline</span>
                        <span className="font-medium text-[var(--color-text)]">{data.reqs.purchase_timeline}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity */}
              <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
                <h4 className="font-semibold mb-3 text-[var(--color-text)] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-primary)]" /> Activity Log
                </h4>
                {data.activities && data.activities.length > 0 ? (
                  <div className="space-y-4">
                    {data.activities.slice(0, 5).map((act: any, i: number) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--color-primary)]"></div>
                        <div>
                          <div className="text-[var(--color-text)] font-medium">{act.notes || act.interaction_type}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {act.created_at ? new Date(act.created_at).toLocaleString() : 'Recent'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--color-text-muted)]">No recent activity recorded.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
