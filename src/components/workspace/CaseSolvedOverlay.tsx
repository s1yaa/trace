'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, RefreshCw, FileText } from 'lucide-react';

interface CaseSolvedOverlayProps {
  days: number;
  leadsDiscovered: number;
  incorrectAccusations: number;
  onRestart: () => void;
  caseSolvedLines?: string[];
}

function getRating(days: number, incorrectAccusations: number): { label: string; color: string } {
  if (incorrectAccusations === 0 && days <= 4) return { label: 'MASTER DETECTIVE', color: '#63B3ED' };
  if (incorrectAccusations <= 1 && days <= 7) return { label: 'FIRST-CLASS INSPECTOR', color: '#68D391' };
  if (incorrectAccusations <= 3) return { label: 'STREET BEAT COP', color: '#ECC94B' };
  return { label: 'LUCKY BREAK', color: '#FC8181' };
}

const FALLBACK_CLOSING_REPORT = [
  'Vance was sitting in a cheap motel room near the airport, bags packed, tickets to Frankfurt already printed.',
  'The keycard told me everything. He swiped into Lab B at 03:28 while his own VPN session was still running.',
  'The backup tape cracked it open. omega_zip_deflate_v2 — his own function name, buried in a draft he thought he\'d deleted.',
  'Delphi Meridian LLC. Domain registered using his private Tutanota address. He built the exit before he even committed the crime.',
  'The Kerberos token traced back to his workstation. Chen never touched the exploit. Vance used him as a scarecrow.',
  'Vance signed the confession at 04:00. He looked relieved.',
];

export default function CaseSolvedOverlay({
  days,
  leadsDiscovered,
  incorrectAccusations,
  onRestart,
  caseSolvedLines,
}: CaseSolvedOverlayProps) {
  const closingLines = (caseSolvedLines && caseSolvedLines.length > 0)
    ? caseSolvedLines
    : FALLBACK_CLOSING_REPORT;
  const [visibleLines, setVisibleLines] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const rating = getRating(days, incorrectAccusations);

  useEffect(() => {
    // Typewriter-reveal each line sequentially
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= closingLines.length) {
        clearInterval(interval);
        setTimeout(() => setShowStats(true), 400);
        setTimeout(() => setShowRestart(true), 900);
      }
    }, 800);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 6, 10, 0.97)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 680, padding: '0 24px' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {/* Stamp-style badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={14} color="#63B3ED" strokeWidth={1.5} />
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              color: '#63B3ED',
              letterSpacing: '0.2em',
            }}>
              TRACE / CASE FILE CLOSED
            </span>
          </div>

          <h1 style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 28,
            fontWeight: 700,
            color: '#F7FAFC',
            letterSpacing: '0.06em',
            lineHeight: 1.1,
            margin: 0,
          }}>
            SUSPECT IN CUSTODY
          </h1>

          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}>
            DR. ELLIOT VANCE — ARRESTED ON CHARGES OF INTELLECTUAL PROPERTY ESPIONAGE
          </div>

          {/* Horizontal rule */}
          <div style={{
            height: 1,
            background: 'linear-gradient(to right, rgba(99,179,237,0.4), transparent)',
            marginTop: 4,
          }} />
        </motion.div>

        {/* ── Closing Monologue (typewriter) ── */}
        <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {closingLines.map((line, i) => (
            <AnimatePresence key={i}>
              {visibleLines > i && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
                >
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9,
                    color: 'rgba(99,179,237,0.5)',
                    flexShrink: 0,
                    paddingTop: 2,
                    letterSpacing: '0.08em',
                  }}>
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <p style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                    fontStyle: 'italic',
                  }}>
                    {line}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* ── Performance Stats ── */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                background: 'rgba(99,179,237,0.04)',
                border: '1px solid rgba(99,179,237,0.12)',
                borderRadius: 6,
                padding: '16px 20px',
                marginBottom: 20,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
              }}
            >
              {[
                { label: 'DAYS ON CASE', value: `DAY ${days}` },
                { label: 'LEADS PULLED', value: String(leadsDiscovered) },
                { label: 'FALSE LEADS', value: String(incorrectAccusations) },
                { label: 'FINAL RATING', value: rating.label, color: rating.color },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 7.5,
                    color: 'var(--text-ghost)',
                    letterSpacing: '0.12em',
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13,
                    fontWeight: 700,
                    color: color ?? '#F7FAFC',
                    letterSpacing: '0.04em',
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Restart Button ── */}
        <AnimatePresence>
          {showRestart && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <button
                id="restart-investigation-btn"
                onClick={onRestart}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: 'rgba(99,179,237,0.08)',
                  border: '1px solid rgba(99,179,237,0.3)',
                  borderRadius: 4,
                  color: '#63B3ED',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.14)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,179,237,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,179,237,0.3)';
                }}
              >
                <RefreshCw size={11} strokeWidth={1.5} />
                OPEN A NEW CASE FILE
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={10} color="var(--text-ghost)" strokeWidth={1.5} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 8.5,
                  color: 'var(--text-ghost)',
                  letterSpacing: '0.08em',
                }}>
                  CASE-047 — A COLD TRAIL IN THE SERVER ROOM — CLOSED
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
