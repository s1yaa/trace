'use client';

import { motion } from 'framer-motion';
import { Cpu, Wifi } from 'lucide-react';
import PulsingDot from '@/components/ui/PulsingDot';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import type { CaseSummary } from '@/types';

interface CommandBarProps {
  caseSummary: CaseSummary;
  availableLeads?: number;
  days?: number;
  onOpenGuidance?: () => void;
}

function getDayNarrative(day: number): string {
  if (day <= 2) return `DAY ${day} — THE TRAIL IS FRESH`;
  if (day <= 4) return `DAY ${day} — THE COFFEE IS STALE`;
  if (day <= 6) return `DAY ${day} — THE PATH IS COLD`;
  return `DAY ${day} — RUNNING OUT OF TIME`;
}

export default function CommandBar({ caseSummary, availableLeads = 0, days = 1, onOpenGuidance }: CommandBarProps) {
  return (
    <motion.header
      className="flex-shrink-0 relative z-40 flex items-center justify-between px-5 gap-4"
      style={{
        height: 'var(--commandbar-height)',
        background: 'rgba(8, 12, 16, 0.97)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
      }}
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      {/* ── Left: Logo ────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: 200 }}>
        {/* Logo mark */}
        <div className="relative flex items-center justify-center" style={{ width: 30, height: 30 }}>
          <div style={{
            width: 30,
            height: 30,
            border: '1px solid rgba(99,179,237,0.4)',
            transform: 'rotate(45deg)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              inset: 4,
              background: 'rgba(99,179,237,0.12)',
              transform: 'rotate(0deg)',
            }} />
          </div>
          <div className="absolute" style={{
            width: 6, height: 6,
            background: '#63B3ED',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(99,179,237,0.8)',
          }} />
        </div>

        <div className="flex flex-col" style={{ gap: 1 }}>
          <span
            className="font-mono font-bold tracking-[0.2em]"
            style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1 }}
          >
            TRACE
          </span>
          <span
            className="font-mono uppercase tracking-[0.1em]"
            style={{ fontSize: 8, color: 'var(--text-muted)', lineHeight: 1, letterSpacing: '0.12em' }}
          >
            Digital Investigation System
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'var(--border-subtle)', flexShrink: 0 }} />

      {/* ── Center: Active Case ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center gap-6">
        {/* Case badge */}
        <div
          className="flex items-center gap-3 rounded-sm px-4 py-2"
          style={{
            background: 'rgba(99,179,237,0.05)',
            border: '1px solid rgba(99,179,237,0.12)',
          }}
        >
          <PulsingDot color="green" size="sm" />

          <div className="flex flex-col" style={{ gap: 1 }}>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold" style={{ fontSize: 11, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
                {caseSummary.id}
              </span>
              <span
                className="font-mono px-1.5 py-0.5 rounded-sm"
                style={{
                  fontSize: 8,
                  letterSpacing: '0.12em',
                  color: 'var(--status-active)',
                  background: 'var(--status-active-dim)',
                  border: '1px solid rgba(72,187,120,0.25)',
                }}
              >
                ACTIVE
              </span>
            </div>
            <span
              className="font-mono"
              style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}
            >
              {getDayNarrative(days)}
            </span>
          </div>
        </div>

        {/* Live counters */}
        <div className="flex items-center gap-5">
          {[
            { label: 'EVIDENCE', value: caseSummary.evidenceCount },
            { label: 'ENTITIES', value: caseSummary.entityCount },
            { label: 'CONNECTIONS', value: caseSummary.connectionCount },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center" style={{ gap: 1 }}>
              <span
                className="font-mono font-semibold"
                style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1 }}
              >
                <AnimatedCounter value={value} duration={1400} />
              </span>
              <span
                className="font-mono uppercase"
                style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.12em' }}
              >
                {label}
              </span>
            </div>
          ))}

          {/* Divider before LEADS */}
          <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />

          {/* LEADS counter — spendable resource */}
          <div className="flex flex-col items-center" style={{ gap: 1 }}>
            <span
              className="font-mono font-semibold"
              style={{ fontSize: 16, color: availableLeads >= 3 ? '#68D391' : '#ECC94B', lineHeight: 1 }}
            >
              <AnimatedCounter value={availableLeads} duration={600} />
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.12em' }}
            >
              LEADS
            </span>
          </div>
        </div>
      </div>

      {/* ── Right: Tools + Status ─────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: 150 }}>
        {/* ── How to Play "?" button ── */}
        <button
          id="how-to-play-btn"
          onClick={onOpenGuidance}
          title="How to Play — Field Guide"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 4,
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.08)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,179,237,0.25)';
            (e.currentTarget as HTMLButtonElement).style.color = '#63B3ED';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          ?
        </button>

        {/* System status */}
        <div className="flex flex-col gap-1" style={{ fontSize: 9 }}>
          <div className="flex items-center gap-1.5">
            <Cpu size={9} color="var(--text-muted)" />
            <span className="font-mono" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              STATUS:
            </span>
            <span className="font-mono font-semibold" style={{ color: '#48BB78' }}>
              ACTIVE
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full pulsing-dot"
              style={{ background: '#48BB78', display: 'inline-block' }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi size={9} color="var(--text-muted)" />
            <span className="font-mono" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              SYSTEM:
            </span>
            <span className="font-mono font-semibold" style={{ color: '#48BB78' }}>
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
