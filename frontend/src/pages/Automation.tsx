import React from 'react';
import { GitBranch, Clock, MessageCircle, FileText, MapPin, Zap } from 'lucide-react';

export default function Automation() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Automation Workflows</h1>
      </div>
      
      <div className="bg-[var(--color-bg)] p-4 rounded-lg border border-[var(--color-border)] mb-8">
        <p className="text-sm text-[var(--color-text-muted)]">
          <strong>Note:</strong> Workflow builder and custom rules will be available in a future update. These are the current system-defined automations.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-[var(--color-text-muted)]" />
          Follow-up Sequences
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Initial Contact', icon: MessageCircle, desc: 'Triggers 24h after first message if no reply.', color: 'text-blue-500' },
            { title: 'Property View', icon: FileText, desc: 'Follows up after a lead shows interest in a specific property.', color: 'text-purple-500' },
            { title: 'Brochure Sent', icon: FileText, desc: 'Checks in 48h after sending a property brochure.', color: 'text-amber-500' },
            { title: 'Post Site-Visit', icon: MapPin, desc: 'Collects feedback 2h after a completed site visit.', color: 'text-green-500' }
          ].map(seq => (
            <div key={seq.title} className="bg-[var(--color-surface)] p-5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors cursor-pointer">
              <seq.icon className={`w-6 h-6 mb-3 ${seq.color}`} />
              <h3 className="font-medium text-[var(--color-text)] mb-1">{seq.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)]">{seq.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-[var(--color-text-muted)]" />
          Smart Triggers
        </h2>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {[
              { rule: 'New Lead Auto-assignment', action: 'Assigns lead to available agent round-robin', status: 'Active' },
              { rule: 'AI Handoff Alert', action: 'Sends push notification to manager when AI hands off', status: 'Active' },
              { rule: 'Score Boost on Site Visit', action: 'Increases lead score by 20 points when visit scheduled', status: 'Active' },
              { rule: 'Cold Lead Archival', action: 'Archives leads inactive for > 60 days', status: 'Active' }
            ].map((trigger, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-[var(--color-bg)] transition-colors">
                <div>
                  <h4 className="font-medium text-[var(--color-text)]">{trigger.rule}</h4>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{trigger.action}</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                  {trigger.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-[var(--color-text)] mb-4 flex items-center">
          <GitBranch className="w-5 h-5 mr-2 text-[var(--color-text-muted)]" />
          AI Conversation Flow
        </h2>
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] text-center">
          <p className="text-[var(--color-text-muted)] mb-4">View the active state machine guiding the AI Sales Agent.</p>
          <a href="/ai-agent" className="inline-flex items-center text-[var(--color-primary)] font-medium hover:underline">
            View AI State Map
          </a>
        </div>
      </section>
    </div>
  );
}
