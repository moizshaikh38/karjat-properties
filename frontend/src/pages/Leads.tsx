import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Phone, User, Calendar, MapPin, Building, ChevronRight, Mail, DollarSign, RefreshCw, MessageSquare } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Lead } from '../types';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTemp, setFilterTemp] = useState('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadData, setSelectedLeadData] = useState<any>(null);
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

  // Fetch lead detail when drawer opens
  useEffect(() => {
    if (!selectedLeadId) {
      setSelectedLeadData(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const [lRes, rRes] = await Promise.all([
          api.get(`/leads/${selectedLeadId}`).catch(() => ({ data: { data: null } })),
          api.get(`/leads/${selectedLeadId}/requirements`).catch(() => ({ data: { data: null } })),
        ]);
        setSelectedLeadData({
          lead: lRes.data?.data,
          requirements: rRes.data?.data,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetail();
  }, [selectedLeadId]);

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
      toast.success('Lead created successfully');
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
      toast.error(err.response?.data?.error?.message || 'Failed to create lead');
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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col h-full bg-[var(--color-bg)] animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] mb-5">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Buyer Database & Leads
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Verified prospective buyers, budget qualifications, and interaction history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLeads} 
            isLoading={loading}
            leftIcon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Buyer Lead
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex gap-1 p-0.5 bg-[var(--color-surface-elevated)] rounded-[6px] border border-[var(--color-border)]">
          {['All', 'Hot', 'Warm', 'Cold'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterTemp(f)}
              className={`px-3 py-1 text-[12px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                filterTemp === f
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search buyer name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-[6px] pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* DENSE SPREADSHEET TABLE */}
      <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[11px] font-medium text-[var(--color-text-muted)]">
                <th className="py-2.5 px-4 font-medium">Buyer Name</th>
                <th className="py-2.5 px-4 font-medium">Phone Number</th>
                <th className="py-2.5 px-4 font-medium">Inquiry Source</th>
                <th className="py-2.5 px-4 font-medium">Lead Stage</th>
                <th className="py-2.5 px-4 font-medium">Temperature</th>
                <th className="py-2.5 px-4 font-medium">Score</th>
                <th className="py-2.5 px-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-28"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-24"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-20"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-20"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-10"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[12px] text-[var(--color-text-muted)]">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isHot = lead.classification === 'HOT' || lead.temperature === 'HOT';
                  const isWarm = lead.classification === 'WARM' || lead.temperature === 'WARM';

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="hover:bg-[var(--color-surface-elevated)]/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-[var(--color-text)]">
                        {lead.name || 'Karjat Prospect'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--color-text-muted)]">
                        {lead.phone}
                      </td>
                      <td className="py-3 px-4 text-[12px] text-[var(--color-text-muted)] capitalize">
                        {lead.source?.replace(/_/g, ' ') || 'WhatsApp'}
                      </td>
                      <td className="py-3 px-4 text-[12px] text-[var(--color-text)]">
                        {lead.status?.replace(/_/g, ' ') || 'New'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isHot ? 'hot' : isWarm ? 'warm' : 'cold'}>
                          {isHot ? 'Hot' : isWarm ? 'Warm' : 'Cold'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--color-text)] tabular-nums">
                        {lead.lead_score || 0}/100
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadId(lead.id);
                          }}
                          className="text-[12px] font-medium text-[var(--color-accent)] hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-IN LEAD DETAIL DRAWER */}
      {selectedLeadId && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex justify-end"
          onClick={() => setSelectedLeadId(null)}
        >
          <div 
            className="w-full max-w-md bg-[var(--color-surface)] h-full flex flex-col border-l border-[var(--color-border)] shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[15px] font-display text-[var(--color-text)]">
                  {selectedLeadData?.lead?.name || 'Buyer Profile'}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)] font-mono">
                  {selectedLeadData?.lead?.phone}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLeadId(null)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[4px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[13px] hide-scrollbar">
              
              {/* Buyer Overview */}
              <div className="border border-[var(--color-border)] rounded-[6px] p-3.5 space-y-2 bg-[var(--color-surface)]">
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] block">Lead Status & Scoring</span>
                <div className="flex items-center justify-between">
                  <Badge variant={selectedLeadData?.lead?.temperature === 'HOT' ? 'hot' : 'warm'}>
                    {selectedLeadData?.lead?.temperature || 'Warm Lead'}
                  </Badge>
                  <span className="font-mono text-[12px] font-medium text-[var(--color-text)]">
                    Score: {selectedLeadData?.lead?.lead_score || 0}
                  </span>
                </div>
              </div>

              {/* Verified Requirements */}
              <div className="border border-[var(--color-border)] rounded-[6px] p-3.5 space-y-3 bg-[var(--color-surface)]">
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] block">Verified Property Criteria</span>
                
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <span className="text-[11px] text-[var(--color-text-muted)] block">Max Budget</span>
                    <span className="font-medium font-display text-[var(--color-text)]">
                      {selectedLeadData?.requirements?.max_budget 
                        ? `₹${(selectedLeadData.requirements.max_budget / 100000).toFixed(0)} Lakhs` 
                        : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--color-text-muted)] block">Configuration</span>
                    <span className="font-medium text-[var(--color-text)]">
                      {selectedLeadData?.requirements?.preferred_bhk ? `${selectedLeadData.requirements.preferred_bhk} BHK` : 'Any BHK'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--color-text-muted)] block">Property Type</span>
                    <span className="font-medium text-[var(--color-text)] capitalize">
                      {selectedLeadData?.requirements?.property_types?.[0] || 'Villa'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--color-text-muted)] block">Purpose</span>
                    <span className="font-medium text-[var(--color-text)] capitalize">
                      {selectedLeadData?.requirements?.purpose?.replace(/_/g, ' ') || 'Self-use'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/inbox')}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  Open in WhatsApp Inbox
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Prospective Buyer"
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Buyer Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">WhatsApp Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98200..."
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Property Type</label>
              <select
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              >
                <option value="villa">Luxury Villa / Bungalow</option>
                <option value="plot">Sanctioned NA Plot (Guntha / Acre)</option>
                <option value="farmhouse">Farmhouse Estate</option>
                <option value="apartment">Apartment</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Preferred BHK / Size</label>
              <select
                value={formData.preferred_bhk}
                onChange={(e) => setFormData({ ...formData, preferred_bhk: e.target.value })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK Villa</option>
                <option value="5">5 to 10 Guntha Plot</option>
                <option value="10">10 to 20 Guntha Plot</option>
                <option value="40">1 to 5 Acres Land</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">Max Budget (INR)</label>
              <input
                type="number"
                value={formData.max_budget}
                onChange={(e) => setFormData({ ...formData, max_budget: e.target.value })}
                placeholder="10000000"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Buyer
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
