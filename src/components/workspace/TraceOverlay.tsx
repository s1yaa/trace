'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Shield, Zap, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { getEntityById, GRAPH_RELATIONSHIPS } from '@/data/graphData';
import { computeTracePath } from '@/utils/tracePath';

interface TraceOverlayProps {
  startEntityId: string;
  onClose: () => void;
  onVisualize: (pathInfo: { path: string[]; confidence: number; breakdown: string }) => void;
}

export default function TraceOverlay({
  startEntityId,
  onClose,
  onVisualize,
}: TraceOverlayProps) {
  const [progresses, setProgresses] = useState<number[]>([0, 0, 0, 0]);
  const [done, setDone] = useState(false);

  // Retrieve details about the starting entity
  const startEntity = useMemo(() => getEntityById(startEntityId), [startEntityId]);

  // Compute the correlation path using high-fidelity pre-defined suspect chains
  const pathInfo = useMemo(() => {
    return computeTracePath(startEntityId);
  }, [startEntityId]);

  // Staggered diagnostics loaders loop
  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000; // 3.0s load sequence

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(1, elapsed / duration);

      // Staggered loaders formula
      // Stage 1 (Identifying Entities): completes by 35% of total time
      const p1 = Math.min(100, Math.floor(Math.min(1, ratio / 0.35) * 100));
      // Stage 2 (Following Connections): starts at 20%, completes by 65%
      const p2 = Math.min(100, Math.floor(Math.max(0, Math.min(1, (ratio - 0.2) / 0.45)) * 100));
      // Stage 3 (Analyzing Timestamps): starts at 40%, completes by 85%
      const p3 = Math.min(100, Math.floor(Math.max(0, Math.min(1, (ratio - 0.4) / 0.45)) * 100));
      // Stage 4 (Searching Related Evidence): starts at 60%, completes by 100%
      const p4 = Math.min(100, Math.floor(Math.max(0, Math.min(1, (ratio - 0.6) / 0.4)) * 100));

      setProgresses([p1, p2, p3, p4]);

      if (ratio >= 1 && p4 === 100) {
        clearInterval(interval);
        // Add brief pause before resolving to completed screen
        setTimeout(() => setDone(true), 400);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const stages = [
    { label: "Rounding up the usual suspects...", progress: progresses[0] },
    { label: "Connecting the threads...", progress: progresses[1] },
    { label: "Watching the clock spin...", progress: progresses[2] },
    { label: "Digging through the paper trail...", progress: progresses[3] },
  ];

  // SVG Radial meter math
  const radius = 40;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pathInfo.confidence / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md bg-panel border border-subtle rounded-md shadow-2xl p-6 relative overflow-hidden"
        style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 179, 237, 0.05)',
        }}
      >
        {/* Futuristic scan grid overlay background */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ghost hover:text-primary transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>

        <AnimatePresence mode="wait">
          {!done ? (
            /* ── Loader View ─────────────────────────────── */
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5 py-4"
            >
              <div className="flex items-center gap-2 border-b border-muted/20 pb-3">
                <GitBranch size={14} className="text-accent animate-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary">
                  Correlation Diagnostics Active
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] text-muted tracking-wider">
                  SOURCE NODE:
                </span>
                <span className="text-[11px] font-semibold text-primary font-mono">
                  {startEntity?.label || startEntityId} ({startEntityId})
                </span>
              </div>

              {/* Progress bars list */}
              <div className="flex flex-col gap-3.5 mt-2">
                {stages.map((st, i) => (
                  <div key={st.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center font-mono text-[8.5px] tracking-wider">
                      <span className="text-secondary">{st.label}</span>
                      <span className={st.progress === 100 ? 'text-accent' : 'text-muted'}>
                        [ {st.progress.toString().padStart(3, ' ')}% ]
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-void/50 rounded-full overflow-hidden border border-muted/10 relative">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: st.progress === 100
                            ? 'linear-gradient(90deg, #63B3ED, #4FD1C5)'
                            : 'linear-gradient(90deg, #4A5568, #63B3ED)',
                          width: `${st.progress}%`
                        }}
                        transition={{ ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ── Completion View ─────────────────────────── */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center text-center gap-5 py-2"
            >
              {/* Header Status */}
              <div className="flex flex-col items-center gap-1.5">
                <CheckCircle2 size={24} className="text-accent animate-bounce" />
                <span className="font-mono text-[10px] tracking-[0.25em] text-accent font-bold uppercase mt-1">
                  CORRELATION TRAIL IDENTIFIED
                </span>
              </div>

              {/* Radial Meter and Score */}
              <div className="relative w-28 h-28 flex items-center justify-center my-1">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Foreground Glow */}
                  <motion.circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="#63B3ED"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(99,179,237,0.35))' }}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute flex flex-col items-center justify-center font-mono">
                  <span className="text-xl font-bold text-primary">
                    {pathInfo.confidence}%
                  </span>
                  <span className="text-[7.5px] text-ghost tracking-widest uppercase">
                    CONFIDENCE
                  </span>
                </div>
              </div>

              {/* Path breakdown details */}
              <div className="w-full flex flex-col gap-2 p-3.5 rounded bg-void/30 border border-muted/10 text-left">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[7px] text-ghost uppercase tracking-widest">
                    Primary Target Endpoint
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {getEntityById(pathInfo.path[pathInfo.path.length - 1])?.label || 'Delphi Meridian LLC'}
                  </span>
                </div>
                <div className="h-px bg-muted/10 my-1" />
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[7px] text-ghost uppercase tracking-widest">
                    Trace Diagnostics Summary
                  </span>
                  <span className="font-mono text-[9px] text-accent font-medium leading-relaxed uppercase">
                    {pathInfo.breakdown}
                  </span>
                </div>
              </div>

              {/* Forensic Timeline Patterns & Observations */}
              <div className="w-full flex flex-col gap-1.5 text-left mt-1">
                <span className="font-mono text-[7.5px] text-ghost uppercase tracking-widest pl-0.5">
                  Correlated Timeline Patterns & Anomalies
                </span>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  <div className="p-2 bg-void/25 border border-muted/10 rounded flex flex-col gap-0.5">
                    <span className="text-[8.5px] font-bold text-accent font-mono uppercase">
                      1. Credential Spike Chronology
                    </span>
                    <span className="text-[8px] text-secondary leading-normal">
                      VPN credentials (svc_labautomation) executed 340 auth requests within a 20-minute window on Nov 1.
                    </span>
                  </div>
                  <div className="p-2 bg-void/25 border border-muted/10 rounded flex flex-col gap-0.5">
                    <span className="text-[8.5px] font-bold text-accent font-mono uppercase">
                      2. Compilation Time Discrepancy
                    </span>
                    <span className="text-[8px] text-secondary leading-normal">
                      Exfiltration script compiled 51 minutes AFTER logged deployment on Lab Server 4B.
                    </span>
                  </div>
                  <div className="p-2 bg-void/25 border border-muted/10 rounded flex flex-col gap-0.5">
                    <span className="text-[8.5px] font-bold text-accent font-mono uppercase">
                      3. Patent Draft Sequence
                    </span>
                    <span className="text-[8px] text-secondary leading-normal">
                      Nexara patent filing US2025/0183441 draft (Oct 25) predates ΩXR-7 exfiltration (Nov 1) by 7 days.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full flex flex-col gap-2 mt-2">
                <button
                  onClick={() => onVisualize(pathInfo)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-accent hover:bg-accent-light text-panel text-[10px] font-mono uppercase font-bold tracking-widest cursor-pointer transition-colors shadow-lg"
                  style={{ color: '#0D1117' }}
                >
                  <Zap size={11} fill="currentColor" />
                  Visualize Trail
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-center text-muted hover:text-primary text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-colors py-1.5"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
