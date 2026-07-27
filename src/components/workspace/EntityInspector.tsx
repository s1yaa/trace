'use client';

import { motion } from 'framer-motion';
import { User, Shield, AlertTriangle } from 'lucide-react';
import type { EntityInspectorProps } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function EntityInspector({ entity, relatedEvidence, relatedEntities, onClose }: EntityInspectorProps) {
  return (
    <motion.div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-subtle)',
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <User size={12} color="var(--text-muted)" />
          <span className="font-mono uppercase" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            Entity Inspector
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-ghost)' }}>Phase 2</span>
      </div>

      {/* Body — awaiting data state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-5">
        {/* Animated icon */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ width: 52, height: 52 }}
        >
          <div style={{
            width: 52, height: 52,
            border: '1px solid rgba(99,179,237,0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(99,179,237,0.04)',
          }}>
            <User size={20} color="rgba(99,179,237,0.4)" />
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-mono uppercase" style={{ fontSize: 9, color: 'rgba(99,179,237,0.5)', letterSpacing: '0.18em' }}>
            Awaiting Selection
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-ghost)', lineHeight: 1.6, maxWidth: 160 }}>
            Select an entity in the investigation graph to inspect
          </p>
        </div>

        {/* Skeleton rows */}
        <div className="w-full flex flex-col gap-2 mt-2">
          {[100, 75, 90, 60].map((w, i) => (
            <motion.div
              key={i}
              className="rounded-sm"
              style={{ height: 8, width: `${w}%`, background: 'rgba(255,255,255,0.04)' }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>

      {/* Upcoming capability list */}
      <div
        className="flex-shrink-0 p-4"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex flex-col gap-2">
          {[
            { Icon: User, text: 'Identity & aliases' },
            { Icon: Shield, text: 'Risk score analysis' },
            { Icon: AlertTriangle, text: 'Anomaly flags' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon size={10} color="rgba(99,179,237,0.3)" />
              <span style={{ fontSize: 9, color: 'var(--text-ghost)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
