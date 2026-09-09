'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Mail, FileText, MapPin, Image as ImageIcon, Zap,
  AlertTriangle, DollarSign, Shield, Target, ZoomIn, ZoomOut, X
} from 'lucide-react';
import type { TimelineStripProps, TimelineEvent, Anomaly } from '@/types';
import { getEntityById } from '@/data/graphData';

function getEventConfig(event: TimelineEvent) {
  const refId = event.primaryRefId;
  if (refId) {
    if (refId.startsWith('EVD-E') || event.type === 'COMMUNICATION') {
      return { icon: Mail, color: '#F6AD55', label: 'EMAIL', bgColor: 'rgba(246,173,85,0.08)' };
    }
    if (refId.startsWith('EVD-D') || refId.startsWith('ENT-008')) {
      return { icon: FileText, color: '#68D391', label: 'DOCUMENT', bgColor: 'rgba(104,211,145,0.08)' };
    }
    if (refId.startsWith('EVD-I')) {
      return { icon: ImageIcon, color: '#76E4F7', label: 'IMAGE', bgColor: 'rgba(118,228,247,0.08)' };
    }
    if (refId.startsWith('ENT-L')) {
      return { icon: MapPin, color: '#FC8181', label: 'LOCATION', bgColor: 'rgba(252,129,129,0.08)' };
    }
  }

  // Fallbacks based on Event type
  if (event.type === 'COMMUNICATION') {
    return { icon: Mail, color: '#F6AD55', label: 'EMAIL', bgColor: 'rgba(246,173,85,0.08)' };
  }
  if (event.type === 'TRANSACTION') {
    return { icon: DollarSign, color: '#FC8181', label: 'TRANSACTION', bgColor: 'rgba(252,129,129,0.08)' };
  }
  if (event.severity === 'CRITICAL') {
    return { icon: AlertTriangle, color: '#FC8181', label: 'INCIDENT', bgColor: 'rgba(252,129,129,0.08)' };
  }
  return { icon: Zap, color: '#ECC94B', label: 'INCIDENT', bgColor: 'rgba(236,201,75,0.08)' };
}

export default function TimelineStrip({
  events = [],
  selectedEntityId = null,
  onEntitySelect,
  anomalies = [],
}: TimelineStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1.5); // Horizontal zoom factor (1.0 to 4.0)
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Anomaly interactions state
  const [activeAnomaly, setActiveAnomaly] = useState<Anomaly | null>(null);
  const [showCallout, setShowCallout] = useState<boolean>(false);
  const [linkingPath, setLinkingPath] = useState<{ x1: number; x2: number; y: number } | null>(null);

  // Monitor container width for precise absolute coordinates of linking line
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      setContainerWidth(el.scrollWidth);
    };

    // Run immediately and observe changes
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);

    return () => observer.disconnect();
  }, [zoom]);

  // Derive date bounds for proportional spacing
  const { minTime, maxTime, timeSpan } = useMemo(() => {
    if (events.length === 0) return { minTime: 0, maxTime: 0, timeSpan: 0 };
    const times = events.map((e) => new Date(e.timestamp).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    return { minTime: min, maxTime: max, timeSpan: max - min };
  }, [events]);

  // Auto-scroll timeline to center the selected event
  useEffect(() => {
    if (!selectedEntityId || events.length === 0 || !containerRef.current) return;

    // Find associated event
    const matchedEvent = events.find(e => 
      e.primaryRefId === selectedEntityId || 
      e.entityRefs.includes(selectedEntityId) || 
      e.evidenceRefs.includes(selectedEntityId)
    );

    if (matchedEvent && timeSpan > 0) {
      const evTime = new Date(matchedEvent.timestamp).getTime();
      const pct = (evTime - minTime) / timeSpan;
      const leftPct = 4 + pct * 92;

      const scrollContainer = containerRef.current.parentElement;
      if (scrollContainer) {
        const contentWidth = containerRef.current.scrollWidth;
        const targetX = (leftPct / 100) * contentWidth;
        const containerViewportWidth = scrollContainer.clientWidth;

        scrollContainer.scrollTo({
          left: targetX - containerViewportWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedEntityId, events, minTime, timeSpan]);

  // Format date display helper
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Determine if a timeline event is associated with the selected graph entity
  const isEventAssociated = (event: TimelineEvent) => {
    if (!selectedEntityId) return false;
    return (
      event.primaryRefId === selectedEntityId ||
      event.entityRefs.includes(selectedEntityId) ||
      event.evidenceRefs.includes(selectedEntityId)
    );
  };

  // Click handler for timeline event
  const handleEventClick = (event: TimelineEvent) => {
    if (event.primaryRefId && onEntitySelect) {
      const entity = getEntityById(event.primaryRefId);
      if (entity) {
        onEntitySelect(entity);
      }
    }
  };

  // Timing Anomaly click handler — starts linking animation, then shows callout
  const handleAnomalyClick = (anomaly: Anomaly) => {
    // If clicking already open anomaly, close it
    if (activeAnomaly?.id === anomaly.id) {
      setActiveAnomaly(null);
      setLinkingPath(null);
      setShowCallout(false);
      return;
    }

    setActiveAnomaly(anomaly);
    setShowCallout(false);

    if (anomaly.conflictingEventIds && anomaly.conflictingEventIds.length === 2) {
      const [id1, id2] = anomaly.conflictingEventIds;
      const ev1 = events.find((e) => e.id === id1);
      const ev2 = events.find((e) => e.id === id2);

      if (ev1 && ev2) {
        const t1 = new Date(ev1.timestamp).getTime();
        const t2 = new Date(ev2.timestamp).getTime();

        const pct1 = timeSpan > 0 ? (t1 - minTime) / timeSpan : 0.5;
        const pct2 = timeSpan > 0 ? (t2 - minTime) / timeSpan : 0.5;

        // Space nodes proportionally within 4% and 96%
        const x1Pct = 4 + pct1 * 92;
        const x2Pct = 4 + pct2 * 92;

        const x1 = (x1Pct / 100) * containerWidth;
        const x2 = (x2Pct / 100) * containerWidth;

        // Set path endpoints (y corresponds to the horizontal timeline axis dot, y=36)
        setLinkingPath({ x1, x2, y: 36 });

        // Delay showing callout card for 1000ms until path finishes drawing
        setTimeout(() => {
          setShowCallout(true);
        }, 1000);
        return;
      }
    }

    // Default fallback if no valid conflicting events
    setShowCallout(true);
  };

  // Close anomaly card
  const closeAnomaly = () => {
    setActiveAnomaly(null);
    setLinkingPath(null);
    setShowCallout(false);
  };

  // Generate SVG curve path command between two points
  const getCurvePath = (x1: number, x2: number, y: number) => {
    const midX = (x1 + x2) / 2;
    // Curved upward bridge path
    const controlY = y - Math.min(45, Math.abs(x2 - x1) * 0.15);
    return `M ${x1} ${y} Q ${midX} ${controlY} ${x2} ${y}`;
  };

  // Filter anomalies to show only timing/relational ones directly on this timeline
  const timelineAnomalies = useMemo(() => {
    return anomalies.filter((a) => a.type === 'TIMING');
  }, [anomalies]);

  return (
    <motion.div
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        height: 'var(--timeline-height)',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Header Toolbar ────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2"
        style={{
          height: 34,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(8, 12, 16, 0.4)',
        }}
      >
        <div className="flex items-center gap-2">
          <Clock size={11} color="var(--text-muted)" />
          <span className="font-mono uppercase" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            Interactive Chronology
          </span>
          <span
            className="font-mono px-1.5 py-0.5 rounded-sm"
            style={{
              fontSize: 8,
              color: 'rgba(99,179,237,0.7)',
              background: 'rgba(99,179,237,0.06)',
              border: '1px solid rgba(99,179,237,0.18)',
            }}
          >
            15 Sep — 19 Nov, 2025
          </span>
        </div>

        {/* Legend & Zoom Slider */}
        <div className="flex items-center gap-6">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3.5">
            {[
              { color: '#FC8181', label: 'Critical' },
              { color: '#ECC94B', label: 'High' },
              { color: '#63B3ED', label: 'Event' },
              { color: '#D69E2E', label: 'Anomaly', isAnomaly: true },
            ].map(({ color, label, isAnomaly }) => (
              <div key={label} className="flex items-center gap-1.5">
                {isAnomaly ? (
                  <AlertTriangle size={9} color={color} strokeWidth={2.5} />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                )}
                <span style={{ fontSize: 8, color: 'var(--text-ghost)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
                  {label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2 border-l border-neutral-800 pl-4 h-4">
            <ZoomOut size={10} color="var(--text-muted)" />
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                width: 72,
                height: 2,
                background: 'rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                accentColor: 'var(--accent-primary)',
              }}
            />
            <ZoomIn size={10} color="var(--text-muted)" />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--text-ghost)', width: 20 }}>
              {zoom.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>

      {/* ── Timeline Scrollable Canvas ────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,179,237,0.15) transparent' }}>
        <div
          ref={containerRef}
          style={{
            width: `${zoom * 100}%`,
            minWidth: '100%',
            height: '100%',
            position: 'relative',
            background: 'var(--bg-void)',
          }}
        >
          {/* Proportional grid lines */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-4">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  width: '1px',
                  height: '100%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 70%, rgba(255,255,255,0) 100%)',
                }}
              />
            ))}
          </div>

          {/* Timeline central axis */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 36,
              height: 1,
              background: 'linear-gradient(90deg, rgba(99,179,237,0.02) 0%, rgba(99,179,237,0.18) 5%, rgba(99,179,237,0.18) 95%, rgba(99,179,237,0.02) 100%)',
              zIndex: 1,
            }}
          />

          {/* ─ Animated Linking Curve (Fun Tweak) ─ */}
          {linkingPath && (
            <svg
              className="absolute inset-x-0 top-0 h-24 pointer-events-none"
              style={{ width: containerWidth, height: '100%', zIndex: 2 }}
            >
              <defs>
                <linearGradient id="anomalyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ECC94B" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#ECC94B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ECC94B" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <motion.path
                d={getCurvePath(linkingPath.x1, linkingPath.x2, linkingPath.y)}
                fill="none"
                stroke="url(#anomalyGradient)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, strokeDashoffset: [0, -30] }}
                transition={{
                  pathLength: { duration: 0.7, ease: 'easeOut' },
                  strokeDashoffset: { duration: 2.0, repeat: Infinity, ease: 'linear' },
                }}
                style={{ filter: 'drop-shadow(0 0 3px rgba(236,201,75,0.4))' }}
              />
            </svg>
          )}

          {/* ── Timeline Event Nodes ──────────────────────── */}
          {events.map((event, idx) => {
            const evTime = new Date(event.timestamp).getTime();
            const pct = timeSpan > 0 ? (evTime - minTime) / timeSpan : 0.5;
            const leftPct = 4 + pct * 92;

            const isSelected = selectedEntityId === event.primaryRefId;
            const isAssociated = isEventAssociated(event);
            const isAnySelected = selectedEntityId !== null;

            // Highlight associated events; dim completely unrelated ones
            const opacity = isSelected || isAssociated ? 1.0 : isAnySelected ? 0.35 : 0.85;

            const config = getEventConfig(event);
            const IconComponent = config.icon;

            return (
              <motion.div
                key={event.id}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: 36,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 15 : 5,
                  opacity,
                }}
                initial={{ opacity: 0, scale: 0.4, y: 15 }}
                animate={{ opacity, scale: isSelected ? 1.08 : 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.05,
                  scale: { duration: 0.2 },
                  opacity: { duration: 0.2 },
                }}
              >
                {/* Visual Connection Pin */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleEventClick(event)}
                >
                  {/* Stem connecting node to axis line */}
                  <div
                    style={{
                      width: 1,
                      height: 14,
                      background: isSelected
                        ? 'var(--accent-primary)'
                        : isAssociated
                          ? 'rgba(99,179,237,0.5)'
                          : 'rgba(255,255,255,0.15)',
                      transition: 'background 0.2s',
                    }}
                  />

                  {/* Compact Node Icon Shell */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: isSelected
                        ? 'var(--accent-primary)'
                        : isAssociated
                          ? 'rgba(99,179,237,0.18)'
                          : 'rgba(13,17,23,0.9)',
                      border: isSelected
                        ? '1.5px solid #fff'
                        : isAssociated
                          ? '1.5px solid rgba(99,179,237,0.7)'
                          : '1px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isSelected
                        ? '0 0 10px rgba(99,179,237,0.5)'
                        : isAssociated
                          ? '0 0 6px rgba(99,179,237,0.2)'
                          : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = config.color;
                        e.currentTarget.style.background = `${config.color}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = isAssociated ? 'rgba(99,179,237,0.7)' : 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.background = isAssociated ? 'rgba(99,179,237,0.18)' : 'rgba(13,17,23,0.9)';
                      }
                    }}
                  >
                    <IconComponent
                      size={10}
                      color={isSelected ? '#080C10' : config.color}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Label overlay below the node */}
                  <div
                    style={{
                      marginTop: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: 90,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 8,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected
                          ? 'var(--text-primary)'
                          : isAssociated
                            ? 'rgba(226,232,240,0.85)'
                            : 'var(--text-ghost)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {formatDate(event.timestamp)}
                    </span>
                    <span
                      style={{
                        fontSize: 7.5,
                        color: isSelected
                          ? 'var(--text-accent)'
                          : 'var(--text-muted)',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* ── Timeline Anomalies Warning Markers ─────────── */}
          {timelineAnomalies.map((anomaly, idx) => {
            const anTime = new Date(anomaly.detectedAt).getTime();
            const pct = timeSpan > 0 ? (anTime - minTime) / timeSpan : 0.5;
            const leftPct = 4 + pct * 92;

            const isCurrentAnomaly = activeAnomaly?.id === anomaly.id;

            return (
              <div
                key={anomaly.id}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: 36, // Sits directly on the axis
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                  onClick={() => handleAnomalyClick(anomaly)}
                >
                  {/* Glowing warning ring around warning icon */}
                  <motion.div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'rgba(8,12,16,0.96)',
                      border: `1px solid ${isCurrentAnomaly ? '#ECC94B' : 'rgba(236,201,75,0.45)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isCurrentAnomaly ? '0 0 10px rgba(236,201,75,0.6)' : '0 0 4px rgba(236,201,75,0.15)',
                    }}
                    animate={{
                      borderColor: isCurrentAnomaly ? ['#ECC94B', 'rgba(236,201,75,0.3)', '#ECC94B'] : 'rgba(236,201,75,0.45)',
                      scale: isCurrentAnomaly ? [1, 1.15, 1] : 1,
                    }}
                    transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <AlertTriangle
                      size={9}
                      color="#ECC94B"
                      strokeWidth={2.5}
                      style={{ transform: 'translateY(-0.5px)' }}
                    />
                  </motion.div>

                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 6.5,
                      fontWeight: 700,
                      color: '#ECC94B',
                      background: 'rgba(236,201,75,0.06)',
                      border: '1px solid rgba(236,201,75,0.18)',
                      borderRadius: 2,
                      padding: '0.5px 3.5px',
                      marginTop: 20,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.05em',
                    }}
                  >
                    TIMING ERROR
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Timing Anomaly Callout Overlay (Restrained warning layout) ── */}
      <AnimatePresence>
        {activeAnomaly && showCallout && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: 8,
              left: 16,
              right: 16,
              zIndex: 30,
              background: 'rgba(15, 19, 26, 0.96)',
              border: '1px solid rgba(236,201,75,0.22)',
              borderRadius: 6,
              padding: '10px 14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.65)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            {/* Warning indicator */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: 'rgba(236,201,75,0.06)',
                border: '1px solid rgba(236,201,75,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <AlertTriangle size={14} color="#ECC94B" strokeWidth={2} />
            </div>

            {/* Content text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 7.5,
                    fontWeight: 700,
                    color: '#ECC94B',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Timeline Anomaly: {activeAnomaly.id}
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 7,
                    padding: '1px 5px',
                    background: 'rgba(252,129,129,0.08)',
                    border: '1px solid rgba(252,129,129,0.2)',
                    borderRadius: 2,
                    color: '#FC8181',
                  }}
                >
                  {activeAnomaly.severity} SEVERITY
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 3,
                }}
              >
                {activeAnomaly.title}
              </div>
              <p style={{ fontSize: 9.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {activeAnomaly.description}
              </p>
            </div>

            {/* Conflicting link badges */}
            {activeAnomaly.conflictingEventIds && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 7, color: 'var(--text-ghost)', fontFamily: 'JetBrains Mono, monospace' }}>CONFLICT NODES</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {activeAnomaly.conflictingEventIds.map(id => (
                    <span
                      key={id}
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 8,
                        color: 'rgba(255,255,255,0.7)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '2px 6px',
                        borderRadius: 3,
                      }}
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={closeAnomaly}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 3,
                marginLeft: 8,
                alignSelf: 'flex-start',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FC8181'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
