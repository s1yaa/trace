'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileText } from 'lucide-react';
import CommandBar from '@/components/layout/CommandBar';
import Sidebar from '@/components/layout/Sidebar';
import InvestigationGraph from '@/components/graph/InvestigationGraph';
import EntityInspector from '@/components/workspace/EntityInspector';
import TimelineStrip from '@/components/workspace/TimelineStrip';
import { MOCK_CASE } from '@/data/mockCase';
import { getConnectedEntities, getEntityById, GRAPH_ENTITIES, GRAPH_RELATIONSHIPS } from '@/data/graphData';
import type { Entity, LeadRecord } from '@/types';
import EvidenceView from '@/components/workspace/EvidenceView';
import TraceOverlay from '../workspace/TraceOverlay';
import CaseSolvedOverlay from '../workspace/CaseSolvedOverlay';
import GuidanceOverlay from '../workspace/GuidanceOverlay';

interface CaseBriefingPanelProps {
  briefingText: string;
}

function CaseBriefingPanel({ briefingText }: CaseBriefingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        background: 'rgba(8, 12, 16, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        zIndex: 40,
        boxShadow: isOpen ? '0 4px 15px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        className="hover:bg-neutral-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText size={10} className="text-accent" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#63B3ED', letterSpacing: '0.12em' }}>
            CASE BRIEFING: CASE-047 — THE MISSING RESEARCH DATA
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--text-ghost)' }}>
            {isOpen ? 'COLLAPSE BRIEFING' : 'EXPAND BRIEFING'}
          </span>
          <ChevronRight
            size={10}
            color="var(--text-ghost)"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <p style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                maxWidth: 900,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                {briefingText}
              </p>
              <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--text-ghost)' }}>
                    INVESTIGATOR ASSIGNED:
                  </span>
                  <span style={{ fontSize: 9.5, color: '#FFF', fontFamily: 'JetBrains Mono, monospace' }}>
                    Agent K. Moreno
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--text-ghost)' }}>
                    SECURITY CLEARANCE:
                  </span>
                  <span style={{ fontSize: 9.5, color: '#FFF', fontFamily: 'JetBrains Mono, monospace' }}>
                    LEVEL 3 Forensics
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkspaceLayout() {
  const [activeNav, setActiveNav] = useState('graph');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<string | null>(null);

  // Lifted leads state
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [newLead, setNewLead] = useState(false);

  // ── Phase 9: Game state ──────────────────────────────────────────────────
  // spentLeadsCount only ever increases by exactly what was spent (3 for trace,
  // 2 for wrong accusation). Display uses Math.max(0, leads.length - spentLeadsCount).
  const [spentLeadsCount, setSpentLeadsCount] = useState(0);
  const [days, setDays] = useState(1);
  const [actionCount, setActionCount] = useState(0);
  // Cooldown only gates the Arrest Warrant — Trace, graph, and evidence remain fully open.
  const [cooldownActions, setCooldownActions] = useState(0);
  const [incorrectAccusations, setIncorrectAccusations] = useState(0);
  const [isSolved, setIsSolved] = useState(false);

  // ── Guided-start: first-time and replay guidance ─────────────────────────
  // showGuidance controls whether the overlay is mounted at all.
  // guidanceForceShow=true means the player triggered replay via the "?" button.
  const [showGuidance, setShowGuidance] = useState(true);
  const [guidanceForceShow, setGuidanceForceShow] = useState(false);

  const handleOpenGuidance = useCallback(() => {
    setGuidanceForceShow(true);
    setShowGuidance(true);
  }, []);

  // Derived: availableLeads is display-only floored at 0. spentLeadsCount is the true ledger.
  const availableLeads = Math.max(0, leads.length - spentLeadsCount);

  // ── advanceAction ────────────────────────────────────────────────────────
  // IMPORTANT: Heavy actions (Trace, Arrest Warrant) bypass actionCount accumulation
  // entirely and increment days directly by 1. This prevents a double-day-jump if a
  // heavy action lands on what would also be a 4th standard action. Standard actions
  // accumulate toward the 4-action threshold; heavy actions do NOT add to that count.
  const advanceAction = useCallback((isHeavy: boolean) => {
    if (isHeavy) {
      setDays(d => d + 1);
    } else {
      setActionCount(prev => {
        const next = prev + 1;
        if (next % 4 === 0) {
          setDays(d => d + 1);
        }
        return next;
      });
      setCooldownActions(c => Math.max(0, c - 1));
    }
  }, []);

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

  // ── Phase 9: Accusation mechanic ─────────────────────────────────────────
  // TODO(multi-case): ENT-001 is the hardcoded true culprit for CASE-047.
  // Before adding additional cases, move culpritEntityId into the Case data model.
  const handleAccuseSuspect = useCallback((entityId: string) => {
    if (entityId === 'ENT-001') {
      setIsSolved(true);
    } else {
      // Wrong accusation: deduct 2 leads, set 4-action cooldown on Arrest Warrant only,
      // increment wrongAccusations, advance day as a heavy action.
      setSpentLeadsCount(n => n + 2);
      setCooldownActions(4);
      setIncorrectAccusations(n => n + 1);
      advanceAction(true);
    }
  }, [advanceAction]);

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
      advanceAction(false); // standard action: may tick cooldown and accumulate toward day advance
    }
    // If triggered from inspector/timeline, also focus the node in the graph (if active)
    if (entity && graphFocusRef.current && activeNav === 'graph') {
      graphFocusRef.current(entity.id);
    }
  }, [activeNav, handleDiscoverLead, advanceAction]);

  const handleInspectorClose = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  // Dynamic Case Summary computed live from case data
  const dynamicCaseSummary = useMemo(() => {
    // Count evidence by type
    const evidenceBreakdownMap: Record<string, number> = {};
    MOCK_CASE.evidence.forEach(ev => {
      evidenceBreakdownMap[ev.type] = (evidenceBreakdownMap[ev.type] || 0) + 1;
    });

    const evidenceLabels: Record<string, string> = {
      EMAIL: 'Emails',
      NETWORK_LOG: 'Network Logs',
      DOCUMENT: 'Documents',
      CODE: 'Code / Scripts',
      FINANCIAL: 'Financial Records',
      DATABASE: 'Databases',
      IMAGE: 'Images',
      VIDEO: 'Videos',
      AUDIO: 'Audios',
    };

    const evidenceBreakdown = Object.entries(evidenceBreakdownMap).map(([type, count]) => ({
      type: type as any,
      count,
      label: evidenceLabels[type] || type,
    }));

    // Count entities by type
    const entityBreakdownMap: Record<string, number> = {};
    GRAPH_ENTITIES.forEach(ent => {
      entityBreakdownMap[ent.type] = (entityBreakdownMap[ent.type] || 0) + 1;
    });

    const entityLabels: Record<string, string> = {
      PERSON: 'Persons',
      DEVICE: 'Devices',
      ACCOUNT: 'Accounts',
      ORGANIZATION: 'Organizations',
      IP_ADDRESS: 'IP Addresses',
      URL: 'URLs',
      LOCATION: 'Locations',
      FILE: 'Files',
      DOCUMENT: 'Documents',
      IMAGE: 'Images',
      EMAIL: 'Emails',
      EVENT: 'Events',
    };

    const entityBreakdown = Object.entries(entityBreakdownMap).map(([type, count]) => ({
      type: type as any,
      count,
      label: entityLabels[type] || type,
    }));

    return {
      id: MOCK_CASE.id,
      name: MOCK_CASE.name,
      status: MOCK_CASE.status,
      createdAt: MOCK_CASE.createdAt,
      confidenceScore: MOCK_CASE.confidenceScore,
      evidenceCount: MOCK_CASE.evidence.length,
      entityCount: GRAPH_ENTITIES.length,
      connectionCount: GRAPH_RELATIONSHIPS.length,
      evidenceBreakdown,
      entityBreakdown,
    };
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
      <CommandBar
        caseSummary={dynamicCaseSummary}
        availableLeads={availableLeads}
        days={days}
        onOpenGuidance={handleOpenGuidance}
      />

      {/* Collapsible Case Briefing Panel */}
      <CaseBriefingPanel briefingText={MOCK_CASE.briefing} />

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
            caseSummary={dynamicCaseSummary}
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
                  availableLeads={availableLeads}
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
                availableLeads={availableLeads}
                cooldownActions={cooldownActions}
                onAccuseSuspect={handleAccuseSuspect}
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
            // Deduct 3 leads for running a trace (heavy action — advances day directly)
            setSpentLeadsCount(n => n + 3);
            advanceAction(true);
            handleNavChange('graph'); // Return to graph
            handleStartPathVisualization(pathInfo.path);
          }}
        />
      )}

      {/* Case Solved Overlay */}
      <AnimatePresence>
        {isSolved && (
          <CaseSolvedOverlay
            days={days}
            leadsDiscovered={leads.length}
            incorrectAccusations={incorrectAccusations}
            caseSolvedLines={MOCK_CASE.caseSolvedLines}
            onRestart={() => {
              // Reset all game states
              setIsSolved(false);
              setLeads([]);
              setDiscoveredIds(new Set());
              setSpentLeadsCount(0);
              setDays(1);
              setActionCount(0);
              setCooldownActions(0);
              setIncorrectAccusations(0);
              setSelectedEntity(null);
              setActiveNav('graph');
              setActiveTracePath(null);
              setRevealedPathIndex(-1);
            }}
          />
        )}
      </AnimatePresence>
      {/* Guided-start overlay — first-time only, or replay via "?" button */}
      {showGuidance && (
        <GuidanceOverlay
          forceShow={guidanceForceShow}
          onDismiss={() => {
            setShowGuidance(false);
            setGuidanceForceShow(false);
          }}
        />
      )}
    </motion.div>
  );
}
