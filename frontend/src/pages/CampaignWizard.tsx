import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Users, MessageSquare, Calendar, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Button } from '../components/ui/Button';

export default function CampaignWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    template_name: '',
    language_code: 'en',
    audience_filter: {
      temperature: ['HOT', 'WARM'],
      property_type: 'villa',
      min_budget: 0,
      max_budget: 20000000,
    },
    scheduled_at: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [tplRes, segRes] = await Promise.all([
        api.get('/campaigns/config/templates').catch(() => ({ data: { data: [] } })),
        api.get('/campaigns/config/segments').catch(() => ({ data: { data: [] } })),
      ]);
      setTemplates(tplRes.data?.data || [
        { name: 'karjat_villa_launch', body: 'Namaskar! Explore our newest riverfront villas in Kashele, Karjat starting at ₹1.25 Cr.' },
        { name: 'weekend_site_visit_invite', body: 'Hello! Exclusive site visit slots are open this Saturday for ready-possession farmhouses in Karjat.' },
      ]);
      setSegments(segRes.data?.data || [
        { name: 'Hot & Warm Villa Buyers', estimated_count: 42 },
        { name: 'Plot & Land Inquirers', estimated_count: 28 },
      ]);
    } catch {
      console.error('Failed to load configs');
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.template_name) {
      return toast.error('Please complete campaign details');
    }

    setLoading(true);
    try {
      await api.post('/campaigns', formData);
      toast.success('Campaign scheduled successfully');
      navigate('/campaigns');
    } catch {
      toast.error('Failed to schedule campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 animate-entrance">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
        <button
          onClick={() => navigate('/campaigns')}
          className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[4px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-[22px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Create WhatsApp Broadcast
          </h1>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
            Step {step} of 3: {step === 1 ? 'Campaign Details' : step === 2 ? 'Target Audience' : 'Schedule & Confirm'}
          </p>
        </div>
      </div>

      {/* STEP INDICATOR */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-[2px] transition-colors ${
              s <= step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>

      {/* FORM CARD */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] space-y-4">
        
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                Campaign Identifier Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Kashele Villa Launch Phase 2"
                className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                Select Approved Fast2SMS Template *
              </label>
              <select
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                Audience Segment
              </label>
              <div className="space-y-2">
                {segments.map((seg) => (
                  <div
                    key={seg.name}
                    className="p-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-[13px] text-[var(--color-text)]">{seg.name}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">Estimated reach: ~{seg.estimated_count} active buyers</p>
                    </div>
                    <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-[13px]">
            <div className="border border-[var(--color-border)] rounded-[6px] p-3.5 space-y-2 bg-[var(--color-surface-elevated)]/40">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Campaign:</span>
                <span className="font-medium text-[var(--color-text)]">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Template:</span>
                <span className="font-mono text-[12px] text-[var(--color-text)]">{formData.template_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Estimated Recipients:</span>
                <span className="font-medium font-mono text-[var(--color-accent)]">~42 Buyers</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                Dispatch Timing (Leave blank for immediate)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back
            </Button>
          ) : <div />}

          {step < 3 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (step === 1 && (!formData.name || !formData.template_name)) {
                  return toast.error('Please enter name and template');
                }
                setStep(step + 1);
              }}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Next Step
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              isLoading={loading}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Launch Broadcast
            </Button>
          )}
        </div>

      </div>

    </div>
  );
}
