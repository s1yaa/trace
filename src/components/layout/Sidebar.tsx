'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Network,
  GitBranch,
  Clock,
  FileText,
  Cpu,
  AlertTriangle,
  FolderOpen,
  Mail,
  Wifi,
  Code,
  DollarSign,
  Database,
  User,
  Monitor,
  Globe,
} from 'lucide-react';
import ConfidenceMeter from '@/components/ui/ConfidenceMeter';
import type { CaseSummary } from '@/types';
import type { EvidenceType, EntityType } from '@/types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  route: string;
  badge?: number;
}

interface SidebarProps {
  caseSummary: CaseSummary;
  activeNav: string;
  onNavChange: (id: string) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'graph', label: 'Investigation Graph', icon: Network, route: '/graph' },
  { id: 'evidence', label: 'Evidence Files', icon: FileText, route: '/evidence' },
];

const EVIDENCE_ICONS: Record<EvidenceType, React.ComponentType<{ size?: number; color?: string }>> = {
  EMAIL: Mail,
  NETWORK_LOG: Wifi,
  DOCUMENT: FileText,
  CODE: Code,
  FINANCIAL: DollarSign,
  DATABASE: Database,
  IMAGE: FolderOpen,
  VIDEO: FolderOpen,
  AUDIO: FolderOpen,
};

const ENTITY_ICONS: Record<EntityType, React.ComponentType<{ size?: number; color?: string }>> = {
  PERSON: User,
  DEVICE: Monitor,
  ACCOUNT: FolderOpen,
  ORGANIZATION: Globe,
  IP_ADDRESS: Globe,
  LOCATION: Globe,
  FILE: FileText,
  URL: Globe,
  DOCUMENT: FileText,
  IMAGE: FolderOpen,
  EMAIL: FolderOpen,
  EVENT: FolderOpen,
};

export default function Sidebar({ caseSummary, activeNav, onNavChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 60 : 280;

  return (
    <motion.aside
      className="flex-shrink-0 flex flex-col h-full relative z-30"
      style={{
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Initial entrance animation handled by parent */}

      {/* ── Collapse Toggle ─────────────────────────────── */}
      <button
        id="sidebar-collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute flex items-center justify-center cursor-pointer z-10"
        style={{
          top: 16,
          right: -1,
          width: 20,
          height: 20,
          background: 'var(--bg-panel-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: '0 2px 2px 0',
          color: 'var(--text-muted)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#63B3ED';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,179,237,0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
        }}
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronLeft size={11} />
        </motion.div>
      </button>

      {/* ── Case File Block ──────────────────────────────── */}
      <div
        className="flex-shrink-0 p-4 overflow-hidden"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {collapsed ? (
          /* Icon-only: confidence ring */
          <div className="flex justify-center">
            <ConfidenceMeter value={caseSummary.confidenceScore} size={44} strokeWidth={2.5} showLabel={false} />
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[10px] tracking-[0.1em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {caseSummary.id}
                  </span>
                  <span
                    className="font-mono px-1.5 py-0.5 rounded-sm"
                    style={{
                      fontSize: 8,
                      color: 'var(--status-active)',
                      background: 'var(--status-active-dim)',
                      border: '1px solid rgba(72,187,120,0.25)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ACTIVE
                  </span>
                </div>
                <span
                  className="font-semibold leading-snug"
                  style={{
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {caseSummary.name}
                </span>
              </div>
              <ConfidenceMeter value={caseSummary.confidenceScore} size={52} strokeWidth={2.5} />
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'INVESTIGATOR', value: 'Agent K. Moreno' },
                { label: 'OPENED', value: formatDate(caseSummary.createdAt) },
                { label: 'UPDATED', value: '12 Nov 2025, 14:33' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center gap-2">
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-ghost)', letterSpacing: '0.1em', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span className="font-mono text-right" style={{ fontSize: 9, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="flex-shrink-0 p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {!collapsed && (
          <div className="px-2 py-1.5">
            <span className="font-mono uppercase" style={{ fontSize: 8, color: 'var(--text-ghost)', letterSpacing: '0.2em' }}>
              Navigation
            </span>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onNavChange(item.id)}
                className="relative flex items-center gap-3 rounded-sm cursor-pointer w-full"
                style={{
                  padding: collapsed ? '8px 0' : '8px 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive ? 'rgba(99,179,237,0.1)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(99,179,237,0.2)' : 'transparent'}`,
                  color: isActive ? '#63B3ED' : 'var(--text-muted)',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.05)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                  }
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2"
                    style={{
                      width: 2,
                      height: '60%',
                      background: '#63B3ED',
                      borderRadius: '0 2px 2px 0',
                      boxShadow: '0 0 6px rgba(99,179,237,0.6)',
                    }}
                  />
                )}

                <Icon size={14} color="currentColor" />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      className="flex items-center justify-between flex-1 gap-2 overflow-hidden"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span
                        className="font-medium whitespace-nowrap"
                        style={{ fontSize: 12 }}
                      >
                        {item.label}
                      </span>
                      {item.id === 'evidence' && (
                        <span
                          className="font-mono flex-shrink-0"
                          style={{
                            fontSize: 9,
                            padding: '1px 5px',
                            background: isActive ? 'rgba(99,179,237,0.2)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${isActive ? 'rgba(99,179,237,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 2,
                            color: isActive ? '#63B3ED' : 'var(--text-muted)',
                          }}
                        >
                          {caseSummary.evidenceCount}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Evidence Breakdown ───────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="flex-shrink-0 p-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-mono uppercase" style={{ fontSize: 9, color: 'var(--text-ghost)', letterSpacing: '0.15em' }}>
                Evidence
              </span>
              <span className="font-mono font-semibold" style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                {caseSummary.evidenceCount}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {caseSummary.evidenceBreakdown.map(({ type, count, label }) => {
                const Icon = EVIDENCE_ICONS[type] ?? FileText;
                const pct = Math.round((count / caseSummary.evidenceCount) * 100);
                return (
                  <div key={type} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={10} color="var(--text-muted)" />
                        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
                      </div>
                      <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{count}</span>
                    </div>
                    {/* Bar */}
                    <div className="rounded-full overflow-hidden" style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'rgba(99,179,237,0.5)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Entity Breakdown ─────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="flex-shrink-0 p-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-mono uppercase" style={{ fontSize: 9, color: 'var(--text-ghost)', letterSpacing: '0.15em' }}>
                Entities
              </span>
              <span className="font-mono font-semibold" style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                {caseSummary.entityCount}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {caseSummary.entityBreakdown.map(({ type, count, label }) => {
                const Icon = ENTITY_ICONS[type] ?? FolderOpen;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Icon size={10} color="var(--text-muted)" />
                    <span style={{ fontSize: 9, color: 'var(--text-secondary)', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                    <span className="font-mono font-semibold" style={{ fontSize: 10, color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── Footer ────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-1.5 h-1.5 rounded-full pulsing-dot" style={{ background: '#48BB78' }} />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-ghost)', letterSpacing: '0.1em' }}>
              TRACE v1.0 · Phase 1
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full pulsing-dot" style={{ background: '#48BB78' }} />
              <span className="font-mono" style={{ fontSize: 9, color: '#48BB78' }}>Secure</span>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
