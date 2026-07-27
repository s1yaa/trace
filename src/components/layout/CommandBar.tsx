'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Settings, User, Cpu, Wifi } from 'lucide-react';
import PulsingDot from '@/components/ui/PulsingDot';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import type { CaseSummary } from '@/types';

interface CommandBarProps {
  caseSummary: CaseSummary;
}

export default function CommandBar({ caseSummary }: CommandBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

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
              {caseSummary.name}
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
        </div>
      </div>

      {/* ── Right: Tools + Status ─────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: 320 }}>

        {/* Search */}
        <div
          className="relative flex items-center gap-2 rounded-sm px-3"
          style={{
            height: 32,
            background: searchFocused ? 'rgba(99,179,237,0.07)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${searchFocused ? 'rgba(99,179,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
            transition: 'all 0.2s ease',
            width: 200,
          }}
        >
          <Search size={12} color="var(--text-muted)" />
          <input
            id="global-search"
            type="text"
            placeholder="Search evidence, entities..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 11,
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Icon buttons */}
        {[
          { id: 'notification-btn', Icon: Bell, badge: 3 },
          { id: 'settings-btn', Icon: Settings },
          { id: 'profile-btn', Icon: User },
        ].map(({ id, Icon, badge }) => (
          <button
            key={id}
            id={id}
            className="relative flex items-center justify-center rounded-sm cursor-pointer"
            style={{
              width: 32,
              height: 32,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,179,237,0.25)';
              (e.currentTarget as HTMLButtonElement).style.color = '#63B3ED';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            <Icon size={14} />
            {badge !== undefined && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-mono"
                style={{
                  width: 14,
                  height: 14,
                  fontSize: 8,
                  background: '#FC8181',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {badge}
              </span>
            )}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />

        {/* AI + System status */}
        <div className="flex flex-col gap-1" style={{ fontSize: 9 }}>
          <div className="flex items-center gap-1.5">
            <Cpu size={9} color="var(--text-muted)" />
            <span className="font-mono" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              AI ANALYSIS:
            </span>
            <span className="font-mono font-semibold" style={{ color: '#48BB78' }}>
              READY
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
