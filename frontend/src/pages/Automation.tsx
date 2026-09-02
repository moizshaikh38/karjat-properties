import React from 'react';
import { Zap, ArrowRight, CheckCircle2, Clock, Bot, Shield, Bell } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export default function Automation() {
  const workflows = [
    {
      title: 'New Lead Auto-Discovery Sequence',
      trigger: 'Customer sends first WhatsApp message to +91 7219311866',
      action: 'AI immediately initializes requirement qualification and budget scoring.',
      status: 'active',
    },
    {
      title: 'Weekend Site Visit Slot Coordinator',
      trigger: 'Customer expresses intent to visit property on Saturday / Sunday',
      action: 'AI queries real-time database slots and holds appointment for executive review.',
      status: 'active',
    },
    {
      title: 'High-Intent Buyer Escalation Trigger',
      trigger: 'Customer lead score exceeds 80 or requests human executive',
      action: 'Switches conversation mode to Human and pings local Karjat sales team.',
      status: 'active',
    },
    {
      title: 'Fast2SMS Delivery Receipt Synchronizer',
      trigger: 'Fast2SMS delivers message to client handset',
      action: 'Updates message delivery ticks to sent/delivered/read in real-time.',
      status: 'active',
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6 animate-entrance">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-medium font-display tracking-tight text-[var(--color-text)]">
            Automation & Smart Triggers
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Active brokerage triggers, auto-assignment rules, and background scheduler events.
          </p>
        </div>

        <Badge variant="success">
          4 Active Brokerage Automations
        </Badge>
      </div>

      {/* WORKFLOWS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <div
            key={wf.title}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-[14px] text-[var(--color-text)]">
                  {wf.title}
                </h3>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>

              <div className="space-y-1.5 pt-1 text-[12px]">
                <div className="p-2 bg-[var(--color-surface-elevated)]/60 rounded-[4px] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <span className="font-medium text-[var(--color-text)] block mb-0.5">When:</span>
                  {wf.trigger}
                </div>
                <div className="p-2 bg-[var(--color-surface-elevated)]/60 rounded-[4px] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <span className="font-medium text-[var(--color-accent)] block mb-0.5">Then:</span>
                  {wf.action}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Running in real-time on Render</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
