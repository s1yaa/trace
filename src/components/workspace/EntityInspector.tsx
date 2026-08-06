'use client';

// Full entity detail panel with cross-highlight, confidence
// scanner animation, AI hypothesis block, and action buttons.
import {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Building2, FileText, Mail, Image as ImageIcon,
  MapPin, Zap, Monitor, FolderOpen, Shield,
  X, ChevronRight, GitBranch, Clock, FileSearch,
  MessageSquare, Pin, AlertTriangle, Target,
} from 'lucide-react';
import type { EntityInspectorProps, EntityType, InvestigatorNote } from '@/types';
import type { Entity } from '@/types';
import { INVESTIGATOR_NOTES } from '@/data/graphData';

const TYPE_CONFIG: Record<EntityType, {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  label: string;
}> = {
  PERSON:       { icon: User,       color: '#63B3ED', label: 'PERSON' },
  ORGANIZATION: { icon: Building2,  color: '#9F7AEA', label: 'ORGANIZATION' },
  DOCUMENT:     { icon: FileText,   color: '#68D391', label: 'DOCUMENT' },
  EMAIL:        { icon: Mail,       color: '#F6AD55', label: 'EMAIL' },
  IMAGE:        { icon: ImageIcon,  color: '#76E4F7', label: 'IMAGE' },
  LOCATION:     { icon: MapPin,     color: '#FC8181', label: 'LOCATION' },
  EVENT:        { icon: Zap,        color: '#ECC94B', label: 'EVENT' },
  ACCOUNT:      { icon: FolderOpen, color: '#FC8181', label: 'ACCOUNT' },
  DEVICE:       { icon: Monitor,    color: '#63B3ED', label: 'DEVICE' },
  FILE:         { icon: FileText,   color: '#68D391', label: 'FILE' },
  URL:          { icon: FolderOpen, color: '#76E4F7', label: 'URL' },
  IP_ADDRESS:   { icon: Monitor,    color: '#FC8181', label: 'IP ADDRESS' },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 8,
      color: 'var(--text-ghost)',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
}

function ConfidenceScanner({
  value,
  color,
  isNew,
}: {
  value: number;
  color: string;
  isNew: boolean;
}) {
  const [displayed, setDisplayed] = useState(isNew ? 0 : value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isNew) {
      setDisplayed(value);
      return;
    }
    // Count from 0 to value over ~800ms with ease-out
    const startTime = performance.now();
    const duration = 820;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, isNew]);

  const confidenceColor = value >= 80 ? '#63B3ED' : value >= 55 ? '#ECC94B' : '#FC8181';
  const circumference = 2 * Math.PI * 20; // r=20

  const gutLabel = value >= 80 ? 'SOLID LEAD' : value >= 60 ? 'GUT FEELING' : value >= 40 ? 'UNCERTAIN' : 'UNCONFIRMED';
  const gutColor = value >= 80 ? '#63B3ED' : value >= 60 ? '#ECC94B' : value >= 40 ? '#F6AD55' : '#FC8181';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>

            <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />

            <motion.circle
              cx="26"
              cy="26"
              r="20"
              fill="none"
              stroke={confidenceColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
              style={{ filter: `drop-shadow(0 0 4px ${confidenceColor}60)` }}
            />
          </svg>

          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <motion.span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                fontWeight: 700,
                color: confidenceColor,
                lineHeight: 1,
              }}
            >
              {displayed}
            </motion.span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <SectionLabel>CASE CORRELATION</SectionLabel>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 700,
            color: gutColor,
            letterSpacing: '0.08em',
          }}>
            {gutLabel}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 7.5,
            color: 'var(--text-ghost)',
            letterSpacing: '0.06em',
          }}>
            PROBABILITY: {displayed}%
          </div>
          {isNew && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }}
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 7,
                color: '#63B3ED',
                letterSpacing: '0.12em',
              }}
            >
              ▶ VERIFYING...
            </motion.div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SectionLabel>RISK SCORE</SectionLabel>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            fontWeight: 700,
            color: '#FC8181',
          }} />
        </div>
        <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              borderRadius: 2,
              background: `linear-gradient(90deg, ${confidenceColor}80, ${confidenceColor})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function InvestigatorNoteBlock({ note }: { note: InvestigatorNote }) {
  const [expanded, setExpanded] = useState(false);
  const noteConfColor = note.confidence >= 80 ? '#68D391'
    : note.confidence >= 60 ? '#ECC94B' : '#FC8181';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      style={{
        borderRadius: 4,
        border: '1px solid rgba(236, 201, 75, 0.15)',
        background: 'rgba(236, 201, 75, 0.03)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 10px',
        borderBottom: expanded ? '1px solid rgba(236, 201, 75, 0.1)' : 'none',
        cursor: 'pointer',
        userSelect: 'none',
      }}
        onClick={() => setExpanded(v => !v)}
      >
        <Pin size={10} color="#ECC94B" strokeWidth={1.5} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 8,
          color: '#ECC94B',
          letterSpacing: '0.14em',
          flex: 1,
        }}>
          INVESTIGATOR'S NOTE
        </span>

        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 7,
          color: noteConfColor,
          background: `${noteConfColor}18`,
          border: `1px solid ${noteConfColor}40`,
          borderRadius: 2,
          padding: '1px 5px',
          letterSpacing: '0.08em',
        }}>
          {note.confidence}%
        </span>
        <ChevronRight
          size={10}
          color="rgba(236,201,75,0.4)"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }}
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        background: 'rgba(236,201,75,0.03)',
        borderBottom: '1px solid rgba(236,201,75,0.06)',
      }}>
        <AlertTriangle size={8} color="#ECC94B" strokeWidth={1.5} />
        <span style={{ fontSize: 8, color: 'rgba(236,201,75,0.6)', fontFamily: 'Inter, system-ui', letterSpacing: '0.02em' }}>
          Preliminary finding — subject to revision
        </span>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <p style={{
          fontSize: 10,
          color: 'rgba(226,232,240,0.8)',
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}>
          "{note.summary}"
        </p>
      </div>

      <div style={{ padding: '0 10px 8px', display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {note.flags.map(flag => (
          <span key={flag} style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 7,
            color: '#ECC94B',
            background: 'rgba(236,201,75,0.06)',
            border: '1px solid rgba(236,201,75,0.15)',
            borderRadius: 2,
            padding: '1px 5px',
            letterSpacing: '0.06em',
          }}>
            {flag}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '8px 10px 10px',
              borderTop: '1px solid rgba(236, 201, 75, 0.08)',
            }}>
              <p style={{
                fontSize: 9.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
              }}>
                {note.detail}
              </p>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 7,
                  color: 'var(--text-ghost)',
                  letterSpacing: '0.08em',
                }}>
                  recorded {new Date(note.recordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


const ACTIONS = [
  {
    id: 'trace-connections',
    icon: GitBranch,
    label: 'TRACE CONNECTIONS',
    color: '#63B3ED',
  },
  {
    id: 'view-evidence',
    icon: FileSearch,
    label: 'VIEW EVIDENCE',
    color: '#68D391',
  },
];

function ActionButtons({
  onViewEvidence,
  onTraceSequence,
  availableLeads,
  cooldownActions,
  onAccuseSuspect,
  entityId,
  entityType,
}: {
  onViewEvidence?: () => void;
  onTraceSequence?: () => void;
  availableLeads: number;
  cooldownActions: number;
  onAccuseSuspect?: (id: string) => void;
  entityId?: string;
  entityType?: string;
}) {
  const TRACE_COST = 3;
  const canTrace = availableLeads >= TRACE_COST;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Standard action grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
      {ACTIONS.map(({ id, icon: Icon, label, color }) => {
        const isTrace = id === 'trace-connections';
        const traceDisabled = isTrace && !canTrace;
        const traceLabel = isTrace
          ? canTrace
            ? `TRACE — costs ${TRACE_COST} leads`
            : 'NOT ENOUGH LEADS'
          : label;
        const effectiveColor = traceDisabled ? 'rgba(100,116,139,0.45)' : color;
        return (
        <button
          key={id}
          id={`inspector-${id}`}
          disabled={traceDisabled}
          onClick={() => {
            if (id === 'trace-connections' && onTraceSequence && canTrace) {
              onTraceSequence();
            } else if (id === 'view-evidence' && onViewEvidence) {
              onViewEvidence();
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '8px 6px',
            background: traceDisabled ? 'rgba(100,116,139,0.04)' : `${color}07`,
            border: `1px solid ${traceDisabled ? 'rgba(100,116,139,0.15)' : color + '20'}`,
            borderRadius: 4,
            cursor: traceDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.18s ease',
            opacity: traceDisabled ? 0.6 : 1,
          }}
          onMouseEnter={e => {
            if (traceDisabled) return;
            const el = e.currentTarget;
            el.style.background = `${color}14`;
            el.style.borderColor = `${color}40`;
          }}
          onMouseLeave={e => {
            if (traceDisabled) return;
            const el = e.currentTarget;
            el.style.background = `${color}07`;
            el.style.borderColor = `${color}20`;
          }}
        >
          <Icon size={13} color={effectiveColor} strokeWidth={1.5} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 7,
            color: effectiveColor,
            letterSpacing: '0.08em',
            textAlign: 'center',
            lineHeight: 1.3,
            opacity: 0.85,
          }}>
            {traceLabel}
          </span>
        </button>
        );
      })}
      </div>

      {/* Actionable hint when Trace is locked */}
      {!canTrace && (
        <div style={{
          padding: '7px 10px',
          background: 'rgba(100,116,139,0.05)',
          border: '1px solid rgba(100,116,139,0.12)',
          borderRadius: 4,
          marginTop: -2,
        }}>
          <p style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 8.5,
            color: 'rgba(148,163,184,0.7)',
            lineHeight: 1.6,
            margin: 0,
            letterSpacing: '0.04em',
          }}>
            You need {TRACE_COST} leads to run a Trace. Click unexplored nodes in the graph, or review new evidence — every fresh connection adds to your count.
          </p>
        </div>
      )}

      {/* ARREST WARRANT — only for PERSON entities */}
      {entityType === 'PERSON' && (
        <div style={{ marginTop: 2 }}>
          {/* Cooldown only gates the Arrest Warrant — Trace, graph, and evidence remain fully open. */}
          <button
            id="inspector-arrest-warrant"
            disabled={cooldownActions > 0}
            onClick={() => {
              if (cooldownActions <= 0 && entityId && onAccuseSuspect) {
                onAccuseSuspect(entityId);
              }
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px 8px',
              background: cooldownActions > 0 ? 'rgba(100,116,139,0.04)' : 'rgba(252,129,129,0.06)',
              border: `1px solid ${cooldownActions > 0 ? 'rgba(100,116,139,0.15)' : 'rgba(252,129,129,0.25)'}`,
              borderRadius: 4,
              cursor: cooldownActions > 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s ease',
              opacity: cooldownActions > 0 ? 0.55 : 1,
            }}
            onMouseEnter={e => {
              if (cooldownActions > 0) return;
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(252,129,129,0.12)';
              el.style.borderColor = 'rgba(252,129,129,0.45)';
            }}
            onMouseLeave={e => {
              if (cooldownActions > 0) return;
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(252,129,129,0.06)';
              el.style.borderColor = 'rgba(252,129,129,0.25)';
            }}
          >
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 7.5,
              color: cooldownActions > 0 ? 'rgba(100,116,139,0.6)' : '#FC8181',
              letterSpacing: '0.1em',
            }}>
              {cooldownActions > 0
                ? `WARRANT FILED — WAIT ${cooldownActions} MORE ACTIONS`
                : 'SUBMIT ARREST WARRANT'}

            </span>
          </button>
          {cooldownActions > 0 && (
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8,
              color: 'rgba(148,163,184,0.55)',
              margin: '6px 0 0',
              lineHeight: 1.55,
              letterSpacing: '0.04em',
            }}>
              The last warrant came back empty. Keep digging — investigate {cooldownActions} more connection{cooldownActions !== 1 ? 's' : ''} before you file again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}


function ConnectedEntityRow({
  entity,
  onSelect,
}: {
  entity: Entity;
  onSelect: (entity: Entity) => void;
}) {
  const config = TYPE_CONFIG[entity.type];
  const Icon = config.icon;

  return (
    <button
      onClick={() => onSelect(entity)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 8px',
        background: 'transparent',
        border: `1px solid transparent`,
        borderRadius: 3,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.16s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background = `${config.color}08`;
        el.style.borderColor = `${config.color}25`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background = 'transparent';
        el.style.borderColor = 'transparent';
      }}
    >

      <div style={{
        width: 20,
        height: 20,
        borderRadius: 3,
        background: `${config.color}12`,
        border: `1px solid ${config.color}25`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={10} color={config.color} strokeWidth={1.5} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 500,
        }}>
          {entity.label}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 7,
          color: config.color,
          opacity: 0.6,
          letterSpacing: '0.08em',
        }}>
          {config.label}
        </div>
      </div>

      <ChevronRight size={9} color="var(--text-ghost)" />
    </button>
  );
}

function EmptyState() {
  return (
    <motion.div
      key="empty"
      className="flex-1 flex flex-col items-center justify-center gap-6 p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >

      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid rgba(99,179,237,0.2)',
            borderRadius: '50%',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{
            position: 'absolute',
            inset: 8,
            border: '1px solid rgba(99,179,237,0.15)',
            borderRadius: '50%',
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Target size={18} color="rgba(99,179,237,0.5)" strokeWidth={1.5} />
        </div>
      </div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: 'rgba(99,179,237,0.55)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          Select an Entity
        </p>
        <p style={{
          fontSize: 10,
          color: 'var(--text-ghost)',
          lineHeight: 1.65,
          maxWidth: 180,
        }}>
          Click any node in the investigation graph to surface connections, AI analysis, and evidence links.
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[95, 70, 85, 55, 80].map((w, i) => (
          <motion.div
            key={i}
            style={{
              height: 7,
              width: `${w}%`,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 2,
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function EntityInspector({
  entity,
  relatedEntities = [],
  onClose,
  onEntitySelect,
  onViewEvidence,
  onTraceSequence,
  availableLeads = 0,
  cooldownActions = 0,
  onAccuseSuspect,
}: EntityInspectorProps) {
  const config = entity ? TYPE_CONFIG[entity.type] : null;
  const Icon = config?.icon ?? User;

  // Track first-time entities for the confidence scanner animation
  const seenIdsRef = useRef(new Set<string>());
  const isNewEntity = entity ? !seenIdsRef.current.has(entity.id) : false;

  useEffect(() => {
    if (entity && !seenIdsRef.current.has(entity.id)) {
      seenIdsRef.current.add(entity.id);
    }
  }, [entity]);


  // Investigator note for this entity
  const investigatorNote: InvestigatorNote | null = entity
    ? (INVESTIGATOR_NOTES[entity.id] ?? null)
    : null;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >

      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          height: 44,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <AnimatePresence mode="wait">
            {config ? (
              <motion.div
                key={entity?.type}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Icon size={11} color={config.color} strokeWidth={1.5} />
              </motion.div>
            ) : (
              <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Target size={11} color="var(--text-muted)" strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Case Notes
          </span>
        </div>
        {entity && onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 3,
              borderRadius: 3,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#FC8181'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <X size={12} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {entity && config ? (
          <motion.div
            key={entity.id}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,179,237,0.15) transparent' }}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >

            <div
              style={{
                margin: '10px 10px 0',
                padding: '10px 12px',
                borderRadius: 5,
                background: `${config.color}07`,
                border: `1px solid ${config.color}22`,
              }}
            >

              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 5,
                  background: `${config.color}14`,
                  border: `1px solid ${config.color}28`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} color={config.color} strokeWidth={1.5} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 7.5,
                    color: config.color,
                    letterSpacing: '0.13em',
                    opacity: 0.85,
                  }}>
                    {config.label}
                  </span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 7.5,
                    color: 'var(--text-ghost)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entity.id}
                  </span>
                </div>
                {entity.isPrimary && (
                  <span style={{
                    flexShrink: 0,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 7,
                    padding: '2px 6px',
                    background: 'rgba(252,129,129,0.1)',
                    border: '1px solid rgba(252,129,129,0.28)',
                    borderRadius: 2,
                    color: '#FC8181',
                    letterSpacing: '0.1em',
                  }}>
                    POI
                  </span>
                )}
              </div>

              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                marginBottom: entity.aliases.length > 0 ? 6 : 0,
              }}>
                {entity.label}
              </div>

              {entity.aliases.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {entity.aliases.slice(0, 3).map(alias => (
                    <span key={alias} style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 7.5,
                      padding: '1px 5px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 2,
                      color: 'var(--text-muted)',
                    }}>
                      {alias}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {entity.description && (
              <div style={{ padding: '8px 12px 0' }}>
                <p style={{
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                }}>
                  {entity.description}
                </p>
              </div>
            )}

            <div style={{
              margin: '8px 10px 0',
              padding: '8px 10px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}>
                  {entity.evidenceRefs.length}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-ghost)' }}>evidence items</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}>
                  {entity.relationshipIds.length}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-ghost)' }}>relationships</span>
              </div>
            </div>

            <div style={{
              margin: '8px 10px 0',
              padding: '10px 12px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid var(--border-subtle)',
            }}>
              <ConfidenceScanner
                value={entity.confidence}
                color={config.color}
                isNew={isNewEntity}
              />
            </div>

            <div style={{
              margin: '8px 10px 0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 5,
            }}>
              {[
                { label: 'FIRST SEEN', value: entity.firstSeen },
                { label: 'LAST SEEN', value: entity.lastSeen },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: '7px 10px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <SectionLabel>{label}</SectionLabel>
                  <div style={{
                    marginTop: 4,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9,
                    color: 'var(--text-secondary)',
                  }}>
                    {new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {relatedEntities.length > 0 && (
              <div style={{ margin: '10px 10px 0' }}>
                <div style={{ marginBottom: 5, paddingLeft: 2 }}>
                  <SectionLabel>Connected Entities ({relatedEntities.length})</SectionLabel>
                </div>
                <div style={{
                  borderRadius: 4,
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                }}>
                  {relatedEntities.map((related, idx) => (
                    <div
                      key={related.id}
                      style={{
                        borderBottom: idx < relatedEntities.length - 1
                          ? '1px solid rgba(255,255,255,0.04)'
                          : 'none',
                      }}
                    >
                      <ConnectedEntityRow
                        entity={related}
                        onSelect={onEntitySelect ?? (() => {})}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {investigatorNote && (
              <div style={{ margin: '10px 10px 0' }}>
                <InvestigatorNoteBlock note={investigatorNote} />
              </div>
            )}

            <div style={{ margin: '10px 10px 14px' }}>
              <div style={{ marginBottom: 6, paddingLeft: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionLabel>Actions</SectionLabel>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 7,
                  color: availableLeads >= 3 ? '#68D391' : 'rgba(100,116,139,0.7)',
                  letterSpacing: '0.08em',
                  padding: '2px 5px',
                  background: availableLeads >= 3 ? 'rgba(104,211,145,0.08)' : 'rgba(100,116,139,0.06)',
                  border: `1px solid ${availableLeads >= 3 ? 'rgba(104,211,145,0.2)' : 'rgba(100,116,139,0.15)'}`,
                  borderRadius: 3,
                }}>
                  {availableLeads} LEADS
                </span>
              </div>
              <ActionButtons
                onViewEvidence={entity && onViewEvidence ? () => onViewEvidence(entity.id) : undefined}
                onTraceSequence={entity && onTraceSequence ? () => onTraceSequence(entity.id) : undefined}
                availableLeads={availableLeads}
                cooldownActions={cooldownActions}
                onAccuseSuspect={onAccuseSuspect}
                entityId={entity?.id}
                entityType={entity?.type}
              />
            </div>
          </motion.div>

        ) : (
          <EmptyState />
        )}
      </AnimatePresence>

      <div style={{
        flexShrink: 0,
        padding: '8px 12px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <Shield size={9} color="rgba(99,179,237,0.25)" strokeWidth={1.5} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 7.5,
          color: 'var(--text-ghost)',
          letterSpacing: '0.1em',
        }}>
          {entity ? `${entity.id} — CASE-047` : 'TRACE v3.0 — Phase 3'}
        </span>
      </div>
    </div>
  );
}
