'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Activity, FileText, Terminal, DollarSign, Database,
  Search, Shield, CheckCircle, ChevronRight, X, GitBranch,
  Clock, HardDrive, AlertTriangle, Eye, RefreshCw, Calendar, Tag
} from 'lucide-react';
import type { Evidence, Entity } from '@/types';
import { getEntityById, GRAPH_RELATIONSHIPS } from '@/data/graphData';
import { MOCK_CASE } from '@/data/mockCase';

const TYPE_CONFIG: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  color: string;
  bgColor: string;
  label: string;
}> = {
  EMAIL: { icon: Mail, color: '#F6AD55', bgColor: 'rgba(246,173,85,0.06)', label: 'EMAIL' },
  NETWORK_LOG: { icon: Activity, color: '#63B3ED', bgColor: 'rgba(99,179,237,0.06)', label: 'NETWORK LOG' },
  DOCUMENT: { icon: FileText, color: '#68D391', bgColor: 'rgba(104,211,145,0.06)', label: 'DOCUMENT' },
  CODE: { icon: Terminal, color: '#9F7AEA', bgColor: 'rgba(159,122,234,0.06)', label: 'SCRIPT / CODE' },
  FINANCIAL: { icon: DollarSign, color: '#FC8181', bgColor: 'rgba(252,129,129,0.06)', label: 'FINANCIAL' },
  DATABASE: { icon: Database, color: '#4FD1C5', bgColor: 'rgba(79,209,197,0.06)', label: 'DATABASE' },
};

interface EvidenceViewProps {
  filterEntityId: string | null;
  onClearFilter: () => void;
  onSelectEntity: (entity: Entity | null) => void;
  onViewInGraph: (evidenceId: string) => void;
  onViewInTimeline: (evidence: Evidence) => void;
  onTraceSequence?: (startId: string) => void;
}

export default function EvidenceView({
  filterEntityId,
  onClearFilter,
  onSelectEntity,
  onViewInGraph,
  onViewInTimeline,
  onTraceSequence,
}: EvidenceViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  // Tracks which evidence items have played the "scanning sweep" animation in this session
  const [analyzedIds, setAnalyzedIds] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);

  // Trigger scan animation when selecting a new piece of evidence
  useEffect(() => {
    if (selectedEvidence) {
      if (!analyzedIds.has(selectedEvidence.id)) {
        setIsScanning(true);
        const timer = setTimeout(() => {
          setIsScanning(false);
          setAnalyzedIds((prev) => {
            const next = new Set(prev);
            next.add(selectedEvidence.id);
            return next;
          });
        }, 1500); // 1.5 second scanning duration
        return () => clearTimeout(timer);
      } else {
        setIsScanning(false);
      }
    }
  }, [selectedEvidence, analyzedIds]);

  // Retrieve the entity currently used for filtering (if any)
  const filterEntity = useMemo(() => {
    if (!filterEntityId) return null;
    return getEntityById(filterEntityId);
  }, [filterEntityId]);

  // Compute relationships count per evidence item dynamically
  const relationshipCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_CASE.evidence.forEach((ev) => {
      counts[ev.id] = GRAPH_RELATIONSHIPS.filter((r) => r.evidenceRefs.includes(ev.id)).length;
    });
    return counts;
  }, []);

  // Filter evidence list based on search and selected entity filter
  const filteredEvidence = useMemo(() => {
    return MOCK_CASE.evidence.filter((ev) => {
      // 1. Entity filter match
      if (filterEntityId) {
        const matchesEntity = ev.entityRefs.includes(filterEntityId) || ev.id === filterEntityId;
        if (!matchesEntity) return false;
      }

      // 2. Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(query);
        const matchesDesc = ev.description.toLowerCase().includes(query);
        const matchesId = ev.id.toLowerCase().includes(query);
        const matchesTag = ev.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesId || matchesTag;
      }

      return true;
    });
  }, [filterEntityId, searchQuery]);

  // Extracted entities in the selected evidence grouped by their type
  const groupedEntities = useMemo(() => {
    if (!selectedEvidence) return {};
    const groups: Record<string, Entity[]> = {};

    selectedEvidence.entityRefs.forEach((id) => {
      const ent = getEntityById(id);
      if (ent) {
        if (!groups[ent.type]) {
          groups[ent.type] = [];
        }
        groups[ent.type].push(ent);
      }
    });

    return groups;
  }, [selectedEvidence]);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleCardClick = (ev: Evidence) => {
    setSelectedEvidence(ev);
  };


  return (
    <div className="flex h-full w-full overflow-hidden bg-void relative">

      {/* ── Left Side: List Grid View ─────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-4">

        {/* Search & Active Filters Header */}
        <div className="flex-shrink-0 flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Collected Evidence Files
            </h1>
            <span className="font-mono text-[9px] text-muted">
              TOTAL RECORDS: {filteredEvidence.length} / 24
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px] relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file contents, hashes, IDs..."
                className="w-full font-mono text-[10px] pl-8 pr-3 py-1.5 rounded-sm bg-panel border border-subtle text-primary placeholder-ghost focus:border-accent focus:outline-none transition-all"
              />
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ghost" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Filter Pill */}
            {filterEntity && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-sm border"
                style={{
                  background: 'rgba(99,179,237,0.06)',
                  borderColor: 'rgba(99,179,237,0.25)',
                }}
              >
                <span className="font-mono text-[8px] text-accent tracking-wider uppercase">
                  Filtered by: {filterEntity.label} ({filterEntity.id})
                </span>
                <button
                  onClick={onClearFilter}
                  className="p-0.5 rounded-sm hover:bg-neutral-800 text-accent transition-colors"
                >
                  <X size={10} />
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Scrollable Cards Grid */}
        <div
          className="flex-1 overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,179,237,0.15) transparent' }}
        >
          {filteredEvidence.length === 0 ? (
            <div className="h-48 border border-dashed border-subtle rounded flex flex-col items-center justify-center gap-3">
              <AlertTriangle size={16} className="text-ghost" />
              <p className="font-mono text-[9px] text-muted tracking-wider">
                NO EVIDENCE MATCHES THE SEARCH / FILTER QUERY
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEvidence.map((ev, idx) => {
                const config = TYPE_CONFIG[ev.type] || TYPE_CONFIG.DOCUMENT;
                const IconComponent = config.icon;
                const isSelected = selectedEvidence?.id === ev.id;
                const hasBeenAnalyzed = analyzedIds.has(ev.id);

                return (
                  <motion.div
                    key={ev.id}
                    layoutId={`evidence-card-${ev.id}`}
                    onClick={() => handleCardClick(ev)}
                    className="relative p-3.5 rounded bg-panel border cursor-pointer flex flex-col gap-3 group transition-all"
                    style={{
                      borderColor: isSelected
                        ? config.color
                        : 'var(--border-subtle)',
                      boxShadow: isSelected
                        ? `0 0 12px ${config.color}25`
                        : 'none',
                    }}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.02, ease: 'easeOut' }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.background = 'var(--bg-panel-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.background = 'var(--bg-panel)';
                      }
                    }}
                  >
                    {/* Top Row: Type and ID */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-sm flex items-center justify-center"
                          style={{ background: config.bgColor }}
                        >
                          <IconComponent size={10} color={config.color} />
                        </div>
                        <span className="font-mono text-[9px] text-muted tracking-wider">
                          {config.label}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-ghost">
                        {ev.id}
                      </span>
                    </div>

                    {/* Content Title */}
                    <div className="flex-1">
                      <h3
                        className="text-[11px] font-semibold leading-normal transition-colors"
                        style={{ color: isSelected ? 'var(--text-primary)' : 'rgba(226, 232, 240, 0.9)' }}
                      >
                        {ev.title}
                      </h3>
                      <p className="text-[9.5px] text-muted mt-1.5 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>

                    {/* Bottom Status Row */}
                    <div className="flex items-center justify-between border-t border-muted/20 pt-2.5 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={9} className="text-ghost" />
                        <span className="font-mono text-[8px] text-muted">
                          {new Date(ev.collectedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>

                      {/* Processed / Scanning tag */}
                      <div className="flex items-center gap-1.5">
                        {hasBeenAnalyzed ? (
                          <div className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle size={8} />
                            <span className="font-mono text-[7.5px] tracking-wide">PROCESSED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-500">
                            <RefreshCw size={8} className="animate-spin" />
                            <span className="font-mono text-[7.5px] tracking-wide">UNRESOLVED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Side: Sliding Detail Panel ───────────────── */}
      <AnimatePresence>
        {selectedEvidence && (
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-[360px] h-full border-l border-subtle bg-panel flex flex-col z-10 flex-shrink-0"
          >
            {/* Detail Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-subtle bg-neutral-900/30">
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-accent" />
                <span className="font-mono text-[9px] uppercase text-muted tracking-widest">
                  Evidence Detail Report
                </span>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-1 rounded-sm text-ghost hover:text-primary transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            {/* Scrollable details */}
            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,179,237,0.15) transparent' }}
            >
              {/* Type Badge Card */}
              <div className="p-3 rounded border border-subtle bg-void/50 flex flex-col gap-2 relative overflow-hidden">
                {/* Active scan-line sweep (Fun Tweak) */}
                {isScanning && (
                  <motion.div
                    className="absolute left-0 right-0 h-10 pointer-events-none"
                    style={{
                      background: 'linear-gradient(180deg, transparent, rgba(99, 179, 237, 0.25), transparent)',
                    }}
                    initial={{ top: '-30%' }}
                    animate={{ top: '120%' }}
                    transition={{ duration: 1.2, repeat: 1, ease: 'easeInOut' }}
                  />
                )}

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-accent font-semibold">
                    {selectedEvidence.id}
                  </span>

                  {/* Processed Scanner Tag */}
                  <div>
                    {isScanning ? (
                      <span className="font-mono text-[8px] px-2 py-0.5 rounded-sm border border-cyan-500/30 text-cyan-400 bg-cyan-950/20 tracking-wider">
                        SCANNING FILE...
                      </span>
                    ) : (
                      <span className="font-mono text-[8px] px-2 py-0.5 rounded-sm border border-emerald-500/30 text-emerald-400 bg-emerald-950/20 tracking-wider flex items-center gap-1">
                        <CheckCircle size={7} /> SECURE / PROCESSED
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-xs font-bold text-primary mt-1 leading-snug">
                  {selectedEvidence.title}
                </h2>
              </div>

              {/* Description & Source */}
              <div className="flex flex-col gap-1.5 pl-1">
                <span className="font-mono text-[7.5px] text-ghost tracking-wider uppercase">File Summary</span>
                <p className="text-[10px] text-secondary leading-relaxed leading-normal">
                  {selectedEvidence.description}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-void/35 border border-muted/10 flex flex-col gap-1">
                  <span className="font-mono text-[7px] text-ghost uppercase tracking-wider">Extracted Entities</span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {selectedEvidence.entityRefs.length}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-void/35 border border-muted/10 flex flex-col gap-1">
                  <span className="font-mono text-[7px] text-ghost uppercase tracking-wider">Correlations</span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {relationshipCounts[selectedEvidence.id] || 0}
                  </span>
                </div>
              </div>

              {/* Investigator observation intro */}
              {selectedEvidence.noirIntro && (
                <div className="pl-3.5 pr-1 py-1.5 border-l border-accent/40 text-[10px] text-accent italic font-serif leading-relaxed">
                  "{selectedEvidence.noirIntro}"
                </div>
              )}

              {/* Metadata Records */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[7.5px] text-ghost tracking-wider uppercase pl-1">System Metadata</span>
                <div className="rounded border border-subtle divide-y divide-muted/10 overflow-hidden font-mono text-[9px] bg-void/10">
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-muted">SOURCE GATEWAY</span>
                    <span className="text-secondary text-right max-w-[180px] truncate" title={selectedEvidence.source}>
                      {selectedEvidence.source}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-muted">TIMESTAMP</span>
                    <span className="text-secondary">
                      {new Date(selectedEvidence.collectedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
                    </span>
                  </div>
                  {selectedEvidence.hash && (
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-muted">SHA-256 HASH</span>
                      <span className="text-secondary font-mono text-[8px] max-w-[150px] truncate" title={selectedEvidence.hash}>
                        {selectedEvidence.hash}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-muted">FILE SIZE</span>
                    <span className="text-secondary">
                      {formatBytes(selectedEvidence.fileSize)}
                    </span>
                  </div>
                  {Object.entries(selectedEvidence.metadata).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center px-3 py-2">
                      <span className="text-muted uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-secondary">{val.toString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extracted Entities List Grouped by Type */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[7.5px] text-ghost tracking-wider uppercase pl-1">Extracted Entities Registry</span>
                {selectedEvidence.entityRefs.length === 0 ? (
                  <div className="p-3 rounded border border-dashed border-subtle text-center text-ghost text-[8.5px] font-mono">
                    NO ENTITIES DETECTED IN THIS RECORD
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {Object.entries(groupedEntities).map(([groupType, ents]) => (
                      <div key={groupType} className="flex flex-col gap-1 pl-1">
                        <span className="font-mono text-[8px] text-accent tracking-wider uppercase">
                          {groupType}S ({ents.length})
                        </span>
                        <div className="rounded border border-subtle overflow-hidden divide-y divide-muted/10">
                          {ents.map((entity) => (
                            <button
                              key={entity.id}
                              onClick={() => {
                                onSelectEntity(entity);
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-800/40 text-primary transition-all group"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-semibold group-hover:text-accent transition-colors">
                                  {entity.label}
                                </span>
                                <span className="font-mono text-[7.5px] text-muted">
                                  {entity.id}
                                </span>
                              </div>
                              <ChevronRight size={10} className="text-ghost group-hover:text-accent transition-all translate-x-0 group-hover:translate-x-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons footer inside details panel */}
            <div className="flex-shrink-0 p-3 border-t border-subtle bg-neutral-900/30 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {/* VIEW IN GRAPH */}
                <button
                  onClick={() => onViewInGraph(selectedEvidence.id)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-accent/25 bg-accent/5 hover:bg-accent/15 text-accent text-[9px] font-mono uppercase tracking-wide cursor-pointer transition-colors"
                >
                  <Eye size={10} />
                  View In Graph
                </button>

                {/* VIEW IN TIMELINE */}
                <button
                  onClick={() => onViewInTimeline(selectedEvidence)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-yellow-500/25 bg-yellow-500/5 hover:bg-yellow-500/15 text-yellow-400 text-[9px] font-mono uppercase tracking-wide cursor-pointer transition-colors"
                >
                  <Clock size={10} />
                  View Timeline
                </button>
              </div>

              <button
                onClick={() => {
                  if (onTraceSequence && selectedEvidence) {
                    onTraceSequence(selectedEvidence.id);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-neutral-700 hover:border-neutral-500 text-secondary hover:text-primary text-[9px] font-mono uppercase tracking-wide cursor-pointer transition-colors"
              >
                <GitBranch size={10} />
                Trace Connections
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
