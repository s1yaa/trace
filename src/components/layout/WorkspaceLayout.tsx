'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import CommandBar from '@/components/layout/CommandBar';
import Sidebar from '@/components/layout/Sidebar';
import InvestigationGraph from '@/components/graph/InvestigationGraph';
import EntityInspector from '@/components/workspace/EntityInspector';
import TimelineStrip from '@/components/workspace/TimelineStrip';
import { CASE_SUMMARY, MOCK_CASE } from '@/data/mockCase';
import { getConnectedEntities, getEntityById } from '@/data/graphData';
import type { Entity, LeadRecord } from '@/types';
import EvidenceView from '@/components/workspace/EvidenceView';
import TraceOverlay from '../workspace/TraceOverlay';

export default function WorkspaceLayout() {
  const [activeNav, setActiveNav] = useState('graph');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<string | null>(null);

  // Lifted leads state
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [newLead, setNewLead] = useState(false);

  // Tracing states
  const [activeTracePath, setActiveTracePath] = useState<string[] | null>(null);
  const [revealedPathIndex, setRevealedPathIndex] = useState<number>(-1);
  const [isTracingSequence, setIsTracingSequence] = useState(false);
  const [traceStartEntityId, setTraceStartEntityId] = useState<string | null>(null);

  // Ref for the graph to receive imperative "focus node" signals from the inspector
  const graphFocusRef = useRef<((id: string) => void) | null>(null);

  // Discovers a lead, triggering a leads counter animation
  const handleDiscoverLead = useCallback((id: string, label: string) => {
    setDiscoveredIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      
      setLeads((prevLeads) => [...prevLeads, { nodeId: id, discoveredAt: Date.now(), label }]);
      setNewLead(true);
      setTimeout(() => setNewLead(false), 600);
      return next;
    });
  }, []);

  // Begins tracing cinematic overlay
  const handleTraceSequence = useCallback((entityId: string) => {
    setTraceStartEntityId(entityId);
    setIsTracingSequence(true);
  }, []);

  // Animates the discovered path node-by-node on the graph
  const handleStartPathVisualization = useCallback((path: string[]) => {
    setActiveTracePath(path);
    setRevealedPathIndex(0);

    const firstNode = getEntityById(path[0]);
    if (firstNode) {
      handleDiscoverLead(firstNode.id, firstNode.label);
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < path.length) {
        setRevealedPathIndex(currentIndex);
        const node = getEntityById(path[currentIndex]);
        if (node) {
          handleDiscoverLead(node.id, node.label);
          if (graphFocusRef.current) {
            graphFocusRef.current(node.id);
          }
        }
      } else {
        clearInterval(interval);
      }
    }, 1200);
  }, [handleDiscoverLead]);

  const handleResetTrace = useCallback(() => {
    setActiveTracePath(null);
    setRevealedPathIndex(-1);
  }, []);

  // Called when changing navigation tabs
  const handleNavChange = useCallback((navId: string) => {
    setActiveNav(navId);
    if (navId !== 'evidence') {
      setEvidenceFilter(null);
    }
  }, []);

  // Called by both the graph (node click) and the inspector (connected entity click)
  const handleEntitySelect = useCallback((entity: Entity | null) => {
    setSelectedEntity(entity);
    if (entity) {
      handleDiscoverLead(entity.id, entity.label);
    }
    // If triggered from inspector/timeline, also focus the node in the graph (if active)
    if (entity && graphFocusRef.current && activeNav === 'graph') {
      graphFocusRef.current(entity.id);
    }
  }, [activeNav, handleDiscoverLead]);

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
            onNavChange={handleNavChange}
          />
        </motion.div>

        {/* ── Main Workspace ──────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Center + Right panel row */}
          <div className="flex flex-1 overflow-hidden">

            {/* Center: Swaps between Investigation Graph and Evidence View */}
            <div className="flex-1 overflow-hidden min-w-0" style={{ position: 'relative' }}>
              {activeNav === 'evidence' ? (
                <EvidenceView
                  filterEntityId={evidenceFilter}
                  onClearFilter={() => setEvidenceFilter(null)}
                  onSelectEntity={handleEntitySelect}
                  onViewInGraph={(evidenceId) => {
                    handleNavChange('graph');
                    // Find node in graph to select & focus
                    const ent = getEntityById(evidenceId);
                    if (ent) {
                      handleEntitySelect(ent);
                      // Force graph focus on the next tick
                      setTimeout(() => {
                        if (graphFocusRef.current) {
                          graphFocusRef.current(evidenceId);
                        }
                      }, 50);
                    }
                  }}
                  onViewInTimeline={(evidence) => {
                    const ent = getEntityById(evidence.id);
                    if (ent) {
                      handleEntitySelect(ent);
                    }
                  }}
                  onTraceSequence={handleTraceSequence}
                />
              ) : (
                <InvestigationGraph
                  onEntitySelect={setSelectedEntity}   // graph → shared state (no re-focus)
                  selectedEntityId={selectedEntity?.id ?? null}
                  onRegisterFocus={(fn) => { graphFocusRef.current = fn; }}
                  leads={leads}
                  newLead={newLead}
                  discoveredIds={discoveredIds}
                  onDiscoverLead={handleDiscoverLead}
                  activeTracePath={activeTracePath}
                  revealedPathIndex={revealedPathIndex}
                  onTraceSequence={handleTraceSequence}
                  onResetTrace={handleResetTrace}
                />
              )}
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
                onViewEvidence={(entityId) => {
                  setEvidenceFilter(entityId);
                  setActiveNav('evidence');
                }}
                onTraceSequence={handleTraceSequence}
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

      {/* Cinematic Trace Sequence Overlay */}
      {isTracingSequence && traceStartEntityId && (
        <TraceOverlay
          startEntityId={traceStartEntityId}
          onClose={() => {
            setIsTracingSequence(false);
            setTraceStartEntityId(null);
          }}
          onVisualize={(pathInfo: { path: string[]; confidence: number; breakdown: string }) => {
            setIsTracingSequence(false);
            setTraceStartEntityId(null);
            handleNavChange('graph'); // Return to graph
            handleStartPathVisualization(pathInfo.path);
          }}
        />
      )}
    </motion.div>
  );
}
