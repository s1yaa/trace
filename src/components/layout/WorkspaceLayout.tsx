'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import CommandBar from '@/components/layout/CommandBar';
import Sidebar from '@/components/layout/Sidebar';
import InvestigationGraph from '@/components/graph/InvestigationGraph';
import EntityInspector from '@/components/workspace/EntityInspector';
import TimelineStrip from '@/components/workspace/TimelineStrip';
import { CASE_SUMMARY, MOCK_CASE } from '@/data/mockCase';
import { getConnectedEntities } from '@/data/graphData';
import type { Entity } from '@/types';

export default function WorkspaceLayout() {
  const [activeNav, setActiveNav] = useState('graph');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Ref for the graph to receive imperative "focus node" signals from the inspector
  const graphFocusRef = useRef<((id: string) => void) | null>(null);

  // Called by both the graph (node click) and the inspector (connected entity click)
  const handleEntitySelect = useCallback((entity: Entity | null) => {
    setSelectedEntity(entity);
    // If triggered from inspector, also focus the node in the graph
    if (entity && graphFocusRef.current) {
      graphFocusRef.current(entity.id);
    }
  }, []);

  const handleInspectorClose = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  // Connected entities derived from the selected entity
  const connectedEntities = selectedEntity
    ? getConnectedEntities(selectedEntity.id)
    : [];

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

            {/* Center: Investigation Graph */}
            <div className="flex-1 overflow-hidden min-w-0" style={{ position: 'relative' }}>
              <InvestigationGraph
                onEntitySelect={setSelectedEntity}   // graph → shared state (no re-focus)
                selectedEntityId={selectedEntity?.id ?? null}
                onRegisterFocus={(fn) => { graphFocusRef.current = fn; }}
              />
            </div>

            {/* Right: Entity Inspector */}
            <motion.div
              className="flex-shrink-0 overflow-hidden"
              style={{ width: 270 }}
              initial={{ x: 270, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <EntityInspector
                entity={selectedEntity ?? undefined}
                relatedEntities={connectedEntities}
                onClose={handleInspectorClose}
                onEntitySelect={handleEntitySelect}  // inspector → shared state + graph focus
              />
            </motion.div>
          </div>

          {/* Bottom: Timeline Strip */}
          <TimelineStrip
            events={MOCK_CASE.timeline}
            anomalies={MOCK_CASE.anomalies}
            selectedEntityId={selectedEntity?.id ?? null}
            onEntitySelect={handleEntitySelect}
          />
        </div>
      </div>
    </motion.div>
  );
}
