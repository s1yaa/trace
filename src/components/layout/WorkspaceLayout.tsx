'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CommandBar from '@/components/layout/CommandBar';
import Sidebar from '@/components/layout/Sidebar';
import GraphPlaceholder from '@/components/workspace/GraphPlaceholder';
import EntityInspector from '@/components/workspace/EntityInspector';
import TimelineStrip from '@/components/workspace/TimelineStrip';
import { CASE_SUMMARY } from '@/data/mockCase';

export default function WorkspaceLayout() {
  const [activeNav, setActiveNav] = useState('graph');

  return (
    <motion.div
      className="flex flex-col w-screen h-screen overflow-hidden"
      style={{ background: 'var(--bg-void)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ── Top Command Bar ────────────────────────────────── */}
      <CommandBar caseSummary={CASE_SUMMARY} />

      {/* ── Body: Sidebar + Main Area ──────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <motion.div
          className="h-full overflow-hidden"
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Sidebar
            caseSummary={CASE_SUMMARY}
            activeNav={activeNav}
            onNavChange={setActiveNav}
          />
        </motion.div>

        {/* ── Main Workspace ──────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Center + Right panel row */}
          <div className="flex flex-1 overflow-hidden">

            {/* Center: Graph area */}
            <div className="flex-1 overflow-hidden min-w-0">
              <GraphPlaceholder caseId={CASE_SUMMARY.id} />
            </div>

            {/* Right: Entity Inspector (fixed width) */}
            <motion.div
              className="flex-shrink-0 overflow-hidden"
              style={{ width: 260 }}
              initial={{ x: 260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <EntityInspector />
            </motion.div>
          </div>

          {/* Bottom: Timeline Strip */}
          <TimelineStrip />
        </div>
      </div>
    </motion.div>
  );
}
