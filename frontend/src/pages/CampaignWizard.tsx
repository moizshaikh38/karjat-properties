import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function CampaignWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    template_name: '',
    language: 'en',
    segment_id: '',
    scheduled_at: ''
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [tplRes, segRes] = await Promise.all([
        api.get('/campaigns/config/templates').catch(() => ({ data: { data: [] } })),
        api.get('/campaigns/config/segments').catch(() => ({ data: { data: [] } }))
      ]);
      setTemplates(tplRes.data.data || []);
      setSegments(segRes.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/campaigns', formData);
      toast.success('Campaign created successfully');
      navigate('/campaigns');
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-6">Create Campaign</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--color-border)] -z-10"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= i ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
              {step > i ? <Check className="w-5 h-5" /> : i}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-[var(--color-text)]">Campaign Details</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Campaign Name</label>
              <input
                type="text"
                className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Diwali Offers 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Message Template</label>
              <select
                className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                value={formData.template_name}
                onChange={e => setFormData({ ...formData, template_name: e.target.value })}
              >
                <option value="">Select a template...</option>
                {templates.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-[var(--color-text)]">Target Audience</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Select Segment</label>
              <select
                className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                value={formData.segment_id}
                onChange={e => setFormData({ ...formData, segment_id: e.target.value })}
              >
                <option value="">Select segment...</option>
                {segments.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.count} contacts)</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-[var(--color-text)]">Schedule & Review</h2>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Schedule Time (Optional)</label>
              <input
                type="datetime-local"
                className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                value={formData.scheduled_at}
                onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
              <p className="text-sm text-[var(--color-text-muted)] mt-2">Leave blank to send immediately.</p>
            </div>
            
            <div className="p-4 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] mt-6 space-y-3">
              <h3 className="font-medium text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-[var(--color-text-muted)]">Name</div>
                <div className="text-[var(--color-text)] font-medium">{formData.name || 'Not set'}</div>
                <div className="text-[var(--color-text-muted)]">Template</div>
                <div className="text-[var(--color-text)] font-medium">{formData.template_name || 'Not set'}</div>
                <div className="text-[var(--color-text-muted)]">Audience</div>
                <div className="text-[var(--color-text)] font-medium">{formData.segment_id || 'Not set'}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center px-4 py-2 text-[var(--color-text)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg)] disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!formData.name && step === 1}
              className="flex items-center px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.template_name || !formData.segment_id}
              className="flex items-center px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : (
                <><Save className="w-4 h-4 mr-2" /> Create Campaign</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
