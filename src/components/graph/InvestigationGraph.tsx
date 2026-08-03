'use client';

import {
  useState, useCallback, useRef, useEffect, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import {
  ZoomIn, ZoomOut, Maximize2, Target, GitBranch, Search, X,
  RotateCcw, Crosshair,
} from 'lucide-react';

import { GRAPH_ENTITIES, GRAPH_RELATIONSHIPS } from '@/data/graphData';
import { NODE_TYPES, NODE_CONFIG } from '@/components/graph/GraphNodes';
import { EDGE_TYPES } from '@/components/graph/GraphEdge';
import type {
  GraphNodeData, GraphEdgeData, NodeFilterType, LeadRecord,
} from '@/types';
import type { Entity, Relationship } from '@/types';

const FILTER_CHIPS: { id: NodeFilterType; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PERSON', label: 'People' },
  { id: 'ORGANIZATION', label: 'Organizations' },
  { id: 'DOCUMENT', label: 'Documents' },
  { id: 'EMAIL', label: 'Emails' },
  { id: 'IMAGE', label: 'Images' },
  { id: 'LOCATION', label: 'Locations' },
  { id: 'EVENT', label: 'Events' },
];

function buildNodes(
  entities: Entity[],
  selectedId: string | null,
  highlightedIds: Set<string>,
  dimmedIds: Set<string>,
  expandedIds: Set<string>,
  discoveredIds: Set<string>,
  filter: NodeFilterType,
  searchTerm: string,
  onSelect: (id: string) => void,
  onDoubleClick: (id: string) => void,
  activeTracePath: string[] | null,
  revealedPathIndex: number,
): Node<GraphNodeData>[] {
  const isTracedNodeRevealed = (nodeId: string) => {
    if (!activeTracePath) return false;
    const idx = activeTracePath.indexOf(nodeId);
    return idx !== -1 && idx <= revealedPathIndex;
  };

  return entities.map((entity) => {
    let isSelected = selectedId === entity.id;
    let isHighlighted = highlightedIds.has(entity.id);
    let isDimmed = dimmedIds.has(entity.id);
    const isExpanded = expandedIds.has(entity.id);
    const isDiscovered = discoveredIds.has(entity.id);

    // Filter visibility
    const matchesFilter = filter === 'ALL' || entity.type === filter;
    const matchesSearch = !searchTerm ||
      entity.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.id.toLowerCase().includes(searchTerm.toLowerCase());

    const hidden = !matchesFilter || (!matchesSearch && searchTerm.length > 0);

    // Override styling if a trace path is active
    if (activeTracePath && activeTracePath.length > 0) {
      const revealed = isTracedNodeRevealed(entity.id);
      if (revealed) {
        isHighlighted = true;
        isDimmed = false;
        if (activeTracePath[revealedPathIndex] === entity.id) {
          isSelected = true;
        }
      } else {
        isHighlighted = false;
        isSelected = false;
        isDimmed = true;
      }
    }

    return {
      id: entity.id,
      type: entity.type,
      position: entity.position ?? { x: 400, y: 300 },
      hidden,
      data: {
        entity,
        isSelected,
        isHighlighted,
        isDimmed: isDimmed && !isSelected && !isHighlighted,
        isExpanded,
        isDiscovered,
        onSelect,
        onDoubleClick,
      } as GraphNodeData,
      draggable: true,
      selectable: true,
    };
  });
}

function buildEdges(
  relationships: Relationship[],
  selectedId: string | null,
  dimmedIds: Set<string>,
  activeTracePath: string[] | null,
  revealedPathIndex: number,
): Edge<GraphEdgeData>[] {
  const isTracedEdgeRevealed = (rel: Relationship) => {
    if (!activeTracePath || activeTracePath.length < 2) return false;
    for (let i = 0; i < activeTracePath.length - 1; i++) {
      const source = activeTracePath[i];
      const target = activeTracePath[i + 1];
      if (
        (rel.sourceEntityId === source && rel.targetEntityId === target) ||
        (rel.targetEntityId === source && rel.sourceEntityId === target)
      ) {
        return i < revealedPathIndex; // Edge is revealed once both its nodes are illuminated
      }
    }
    return false;
  };

  return relationships.map((rel) => {
    let isActive = false;
    let isDimmed = false;

    if (activeTracePath && activeTracePath.length > 0) {
      const isTrailRevealed = isTracedEdgeRevealed(rel);
      if (isTrailRevealed) {
        isActive = true;
        isDimmed = false;
      } else {
        isActive = false;
        isDimmed = true;
      }
    } else {
      isActive = selectedId !== null && (
        rel.sourceEntityId === selectedId || rel.targetEntityId === selectedId
      );
      isDimmed = selectedId !== null && !isActive;
    }

    return {
      id: rel.id,
      source: rel.sourceEntityId,
      target: rel.targetEntityId,
      type: 'trace',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 8,
        height: 8,
        color: isDimmed ? '#2D3748' : '#4A5568',
      },
      data: {
        relationship: rel,
        isActive,
        isDimmed: isDimmed || (!isActive && (dimmedIds.has(rel.sourceEntityId) || dimmedIds.has(rel.targetEntityId))),
      } as GraphEdgeData,
    };
  });
}

function LeadsCounter({ leads, newLead }: { leads: LeadRecord[]; newLead: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
      }}
    >
      <motion.div
        style={{
          background: 'rgba(8,12,16,0.92)',
          border: '1px solid rgba(99,179,237,0.2)',
          borderRadius: 4,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(12px)',
        }}
        animate={newLead ? { scale: [1, 1.08, 1], borderColor: ['rgba(99,179,237,0.2)', 'rgba(99,179,237,0.7)', 'rgba(99,179,237,0.2)'] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Target size={11} color="#63B3ED" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            LEADS DISCOVERED
          </span>
          <motion.span
            key={leads.length}
            initial={{ scale: 1.4, color: '#63B3ED' }}
            animate={{ scale: 1, color: '#E2E8F0' }}
            transition={{ duration: 0.35 }}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#E2E8F0', lineHeight: 1 }}
          >
            {leads.length}
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}

function GraphControls({
  onZoomIn, onZoomOut, onReset, onFocus, onTracePath,
  hasSelection,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFocus: () => void;
  onTracePath: () => void;
  hasSelection: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(8,12,16,0.92)',
        border: '1px solid rgba(99,179,237,0.14)',
        borderRadius: 6,
        padding: '6px 8px',
        backdropFilter: 'blur(12px)',
      }}
    >
      {[
        { id: 'zoom-in', icon: ZoomIn, label: 'ZOOM +', onClick: onZoomIn },
        { id: 'zoom-out', icon: ZoomOut, label: 'ZOOM −', onClick: onZoomOut },
        { id: 'reset-view', icon: RotateCcw, label: 'RESET', onClick: onReset },
        { id: 'focus-node', icon: Crosshair, label: 'FOCUS', onClick: onFocus, disabled: !hasSelection },
        { id: 'trace-path', icon: GitBranch, label: 'TRACE PATH', onClick: onTracePath, accent: true },
      ].map(({ id, icon: Icon, label, onClick, disabled, accent }) => (
        <button
          key={id}
          id={id}
          onClick={onClick}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: accent ? 'rgba(99,179,237,0.1)' : 'transparent',
            border: `1px solid ${accent ? 'rgba(99,179,237,0.3)' : 'transparent'}`,
            borderRadius: 4,
            padding: '5px 10px',
            color: disabled ? 'rgba(100,116,139,0.4)' : accent ? '#63B3ED' : 'var(--text-muted)',
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.1em',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.18s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = '#63B3ED';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.background = accent ? 'rgba(99,179,237,0.1)' : 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = accent ? '#63B3ED' : 'var(--text-muted)';
            }
          }}
        >
          <Icon size={11} strokeWidth={1.5} />
          {label}
        </button>
      ))}
    </div>
  );
}

function FilterChips({
  active,
  onChange,
}: {
  active: NodeFilterType;
  onChange: (f: NodeFilterType) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
      {FILTER_CHIPS.map(({ id, label }) => {
        const isActive = active === id;
        const config = id !== 'ALL' ? NODE_CONFIG[id as keyof typeof NODE_CONFIG] : null;
        const color = config?.color ?? '#63B3ED';

        return (
          <button
            key={id}
            id={`filter-${id.toLowerCase()}`}
            onClick={() => onChange(id)}
            style={{
              padding: '4px 10px',
              borderRadius: 3,
              border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
              background: isActive ? `${color}18` : 'rgba(255,255,255,0.02)',
              color: isActive ? color : 'var(--text-muted)',
              fontSize: 9,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="toast"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        style={{
          position: 'absolute',
          bottom: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          background: 'rgba(13,17,23,0.96)',
          border: '1px solid rgba(99,179,237,0.3)',
          borderRadius: 6,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(16px)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: 11, color: '#63B3ED', fontFamily: 'JetBrains Mono, monospace' }}>
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

interface InnerGraphProps {
  selectedId: string | null;
  onSelect: (entity: Entity | null) => void;
  onRegisterFocus?: (fn: (id: string) => void) => void;
  leads: LeadRecord[];
  newLead: boolean;
  discoveredIds: Set<string>;
  onDiscoverLead: (id: string, label: string) => void;
  activeTracePath: string[] | null;
  revealedPathIndex: number;
  onTraceSequence?: (startId: string) => void;
  onResetTrace?: () => void;
}

function InnerGraph({
  selectedId,
  onSelect,
  onRegisterFocus,
  leads,
  newLead,
  discoveredIds,
  onDiscoverLead,
  activeTracePath,
  revealedPathIndex,
  onTraceSequence,
  onResetTrace,
}: InnerGraphProps) {
  const reactFlow = useReactFlow();

  const [filter, setFilter] = useState<NodeFilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // ── Derived state: which nodes are connected to selected ──
  const connectedIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const ids = new Set<string>();
    GRAPH_RELATIONSHIPS.forEach((rel) => {
      if (rel.sourceEntityId === selectedId) ids.add(rel.targetEntityId);
      if (rel.targetEntityId === selectedId) ids.add(rel.sourceEntityId);
    });
    return ids;
  }, [selectedId]);

  const highlightedIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    return connectedIds;
  }, [selectedId, connectedIds]);

  const dimmedIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const dims = new Set(GRAPH_ENTITIES.map(e => e.id));
    dims.delete(selectedId);
    connectedIds.forEach(id => dims.delete(id));
    return dims;
  }, [selectedId, connectedIds]);

  // ── Discover lead helper ──────────────────────────────────
  const discoverLead = useCallback((id: string, label: string) => {
    onDiscoverLead(id, label);
  }, [onDiscoverLead]);

  // ── Imperative focus (called by inspector cross-highlight) ─
  const imperativeFocus = useCallback((id: string) => {
    const node = reactFlow.getNode(id);
    if (node) {
      reactFlow.setCenter(
        node.position.x + 60,
        node.position.y + 60,
        { duration: 500, zoom: 1.4 },
      );
    }
  }, [reactFlow]);

  // Register focus function with parent
  useEffect(() => {
    onRegisterFocus?.(imperativeFocus);
  }, [onRegisterFocus, imperativeFocus]);

  // Auto-pan when selectedId changes from the inspector
  const prevSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedId && selectedId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedId;
      // Small delay so React Flow node positions are settled
      const t = setTimeout(() => imperativeFocus(selectedId), 80);
      return () => clearTimeout(t);
    }
    prevSelectedIdRef.current = selectedId;
  }, [selectedId, imperativeFocus]);

  // ── Node interaction handlers ─────────────────────────────
  const handleSelect = useCallback((id: string) => {
    const entity = GRAPH_ENTITIES.find(e => e.id === id);
    if (!entity) return;
    discoverLead(id, entity.label);
    onSelect(entity);
  }, [discoverLead, onSelect]);

  const handleDoubleClick = useCallback((id: string) => {
    const entity = GRAPH_ENTITIES.find(e => e.id === id);
    if (!entity) return;

    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        discoverLead(id, `${entity.label} (expanded)`);
      }
      return next;
    });
  }, [discoverLead]);

  // ── Build nodes and edges ─────────────────────────────────
  const initialNodes = useMemo(() =>
    buildNodes(
      GRAPH_ENTITIES, selectedId, highlightedIds, dimmedIds,
      expandedIds, discoveredIds, filter, searchTerm,
      handleSelect, handleDoubleClick, activeTracePath, revealedPathIndex,
    ),
    [selectedId, highlightedIds, dimmedIds, expandedIds, discoveredIds, filter, searchTerm, handleSelect, handleDoubleClick, activeTracePath, revealedPathIndex]);

  const initialEdges = useMemo(() =>
    buildEdges(GRAPH_RELATIONSHIPS, selectedId, dimmedIds, activeTracePath, revealedPathIndex),
    [selectedId, dimmedIds, activeTracePath, revealedPathIndex]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes/edges when state changes
  useEffect(() => {
    setNodes(buildNodes(
      GRAPH_ENTITIES, selectedId, highlightedIds, dimmedIds,
      expandedIds, discoveredIds, filter, searchTerm,
      handleSelect, handleDoubleClick, activeTracePath, revealedPathIndex,
    ));
  }, [selectedId, highlightedIds, dimmedIds, expandedIds, discoveredIds, filter, searchTerm, handleSelect, handleDoubleClick, activeTracePath, revealedPathIndex, setNodes]);

  useEffect(() => {
    setEdges(buildEdges(GRAPH_RELATIONSHIPS, selectedId, dimmedIds, activeTracePath, revealedPathIndex));
  }, [selectedId, dimmedIds, activeTracePath, revealedPathIndex, setEdges]);

  // ── Graph controls ────────────────────────────────────────
  const handleZoomIn = useCallback(() => reactFlow.zoomIn({ duration: 300 }), [reactFlow]);
  const handleZoomOut = useCallback(() => reactFlow.zoomOut({ duration: 300 }), [reactFlow]);
  const handleReset = useCallback(() => {
    reactFlow.fitView({ duration: 500, padding: 0.08 });
    onSelect(null);
  }, [reactFlow, onSelect]);

  const handleFocus = useCallback(() => {
    if (!selectedId) return;
    const node = reactFlow.getNode(selectedId);
    if (node) {
      reactFlow.setCenter(node.position.x + 60, node.position.y + 60, {
        duration: 500,
        zoom: 1.5,
      });
    }
  }, [reactFlow, selectedId]);

  const handleTracePath = useCallback(() => {
    if (selectedId && onTraceSequence) {
      onTraceSequence(selectedId);
    } else {
      setToast('Select a node in the graph to run trace diagnostics');
    }
  }, [selectedId, onTraceSequence]);

  // ── Search: auto-focus and center on match ────────────────
  useEffect(() => {
    if (!searchTerm) return;
    const match = GRAPH_ENTITIES.find(e =>
      e.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (match?.position) {
      reactFlow.setCenter(match.position.x + 60, match.position.y + 60, {
        duration: 600,
        zoom: 1.2,
      });
    }
  }, [searchTerm, reactFlow]);

  // ── Canvas click deselect ─────────────────────────────────
  const handlePaneClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* ── Top toolbar ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 80,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(8,12,16,0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: '5px 10px',
            flex: 1,
            maxWidth: 240,
            backdropFilter: 'blur(12px)',
          }}
        >
          <Search size={11} color="var(--text-ghost)" />
          <input
            type="text"
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
              width: '100%',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ghost)', display: 'flex', padding: 2 }}
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <FilterChips active={filter} onChange={setFilter} />
      </div>

      {/* ── Leads counter ──────────────────────────────── */}
      <LeadsCounter leads={leads} newLead={newLead} />

      {/* ── Active Trail Pinned Overlay ────────────────── */}
      {activeTracePath && onResetTrace && (
        <div
          id="pinned-trail-card"
          style={{
            position: 'absolute',
            bottom: 74,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            background: 'rgba(8,12,16,0.95)',
            border: '1px solid rgba(99,179,237,0.35)',
            boxShadow: '0 4px 20px rgba(99,179,237,0.2)',
            borderRadius: 4,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#63B3ED',
                boxShadow: '0 0 8px #63B3ED',
              }}
            />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 8,
                fontWeight: 600,
                color: '#63B3ED',
                letterSpacing: '0.08em',
              }}
            >
              ACTIVE SYSTEM CORRELATION TRAIL PINNED
            </span>
          </div>
          <button
            onClick={onResetTrace}
            style={{
              background: 'rgba(99,179,237,0.1)',
              border: '1px solid rgba(99,179,237,0.3)',
              borderRadius: 2,
              padding: '4px 9px',
              color: '#FFF',
              fontSize: 8,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.1)';
            }}
          >
            RESET TRAIL
          </button>
        </div>
      )}

      {/* ── React Flow canvas ──────────────────────────── */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES as never}
        edgeTypes={EDGE_TYPES as never}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        minZoom={0.15}
        maxZoom={3}
        defaultViewport={{ x: 80, y: 30, zoom: 0.65 }}
        fitView={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        selectionOnDrag={false}
        selectNodesOnDrag={false}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        {/* Custom dark grid background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="rgba(99,179,237,0.08)"
          style={{ background: 'var(--bg-base)' }}
        />
      </ReactFlow>

      {/* ── Graph controls ──────────────────────────────── */}
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onFocus={handleFocus}
        onTracePath={handleTracePath}
        hasSelection={!!selectedId}
      />

      {/* ── Toast ─────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

interface InvestigationGraphProps {
  onEntitySelect: (entity: Entity | null) => void;
  selectedEntityId: string | null;
  onRegisterFocus?: (fn: (id: string) => void) => void;
  leads: LeadRecord[];
  newLead: boolean;
  discoveredIds: Set<string>;
  onDiscoverLead: (id: string, label: string) => void;
  activeTracePath: string[] | null;
  revealedPathIndex: number;
  onTraceSequence?: (startId: string) => void;
  onResetTrace?: () => void;
}

export default function InvestigationGraph({
  onEntitySelect,
  selectedEntityId,
  onRegisterFocus,
  leads,
  newLead,
  discoveredIds,
  onDiscoverLead,
  activeTracePath,
  revealedPathIndex,
  onTraceSequence,
  onResetTrace,
}: InvestigationGraphProps) {
  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <ReactFlowProvider>
        <InnerGraph
          selectedId={selectedEntityId}
          onSelect={onEntitySelect}
          onRegisterFocus={onRegisterFocus}
          leads={leads}
          newLead={newLead}
          discoveredIds={discoveredIds}
          onDiscoverLead={onDiscoverLead}
          activeTracePath={activeTracePath}
          revealedPathIndex={revealedPathIndex}
          onTraceSequence={onTraceSequence}
          onResetTrace={onResetTrace}
        />
      </ReactFlowProvider>
    </motion.div>
  );
}
