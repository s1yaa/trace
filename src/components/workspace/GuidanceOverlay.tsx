'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';

// ── Guidance step definitions ────────────────────────────────────────────────
// Each step targets an element by ID (for positioning) or uses a fixed layout
// anchor. Copy is in the noir partner voice, not software onboarding.
// ─────────────────────────────────────────────────────────────────────────────

interface GuidanceStep {
  id: string;
  title: string;
  body: string;
  // Where to render the callout relative to the viewport
  anchor: 'top-left' | 'top-center' | 'bottom-center' | 'right-center';
  // Optional: element ID to highlight (soft glow, not hard lock)
  highlightId?: string;
  // Which corner the arrow tip points toward
  arrowSide?: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: GuidanceStep[] = [
  {
    id: 'step-briefing',
    title: 'Every case starts with the file.',
    body: 'Read the case briefing before you touch anything else. It tells you what went missing, who found it, and why it matters. Click "EXPAND BRIEFING" just below this bar.',
    anchor: 'top-center',
    highlightId: undefined, // the briefing bar itself is obvious
    arrowSide: 'bottom',
  },
  {
    id: 'step-graph',
    title: 'The graph is your map.',
    body: 'Every node is a person, device, account, or location connected to the case. Click any node to pull up its case file. Expand nodes you haven\'t touched yet — that\'s how you earn leads.',
    anchor: 'bottom-center',
    arrowSide: 'top',
  },
  {
    id: 'step-trace',
    title: 'Three leads buys you a Trace.',
    body: 'When you\'ve gathered enough leads, the TRACE PATH button lights up. Run it on a suspect to let the system follow the connections. It costs 3 leads — spend them wisely.',
    anchor: 'bottom-center',
    highlightId: 'trace-path',
    arrowSide: 'top',
  },
  {
    id: 'step-accuse',
    title: 'When you\'re sure, make the call.',
    body: 'Select a suspect in the Case Notes panel on the right, then hit SUBMIT ARREST WARRANT. You only get one shot at a time — a wrong accusation costs leads and days. Don\'t rush it.',
    anchor: 'right-center',
    arrowSide: 'left',
  },
];

const STORAGE_KEY = 'trace_guidance_seen_case047';

interface GuidanceOverlayProps {
  /** If true, shows from step 0 regardless of seen flag (replay mode) */
  forceShow?: boolean;
  onDismiss: () => void;
}

// ── Anchor position helpers ───────────────────────────────────────────────────

function getCalloutStyle(anchor: GuidanceStep['anchor']): React.CSSProperties {
  switch (anchor) {
    case 'top-left':
      return { top: 80, left: 24 };
    case 'top-center':
      return { top: 80, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-center':
      return { bottom: 100, left: '50%', transform: 'translateX(-50%)' };
    case 'right-center':
      return { top: '50%', right: 280, transform: 'translateY(-50%)' };
    default:
      return { top: 80, left: '50%', transform: 'translateX(-50%)' };
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GuidanceOverlay({ forceShow = false, onDismiss }: GuidanceOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [highlightedEl, setHighlightedEl] = useState<string | null>(null);

  // Check localStorage to decide whether to show
  useEffect(() => {
    const alreadySeen = localStorage.getItem(STORAGE_KEY);
    if (forceShow || !alreadySeen) {
      // Slight delay so the workspace has a chance to render first
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, [forceShow]);

  const currentStep = STEPS[stepIndex];

  // Highlight element if specified
  useEffect(() => {
    if (!visible) return;
    const id = currentStep?.highlightId ?? null;
    setHighlightedEl(id);
  }, [stepIndex, visible, currentStep?.highlightId]);

  // Apply / remove glow highlight to a DOM element
  useEffect(() => {
    if (!highlightedEl) return;
    const el = document.getElementById(highlightedEl);
    if (!el) return;
    const prev = el.style.boxShadow;
    el.style.boxShadow = '0 0 0 2px rgba(99,179,237,0.7), 0 0 20px rgba(99,179,237,0.35)';
    el.style.borderRadius = '4px';
    return () => {
      el.style.boxShadow = prev;
    };
  }, [highlightedEl]);

  const handleNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(s => s + 1);
    } else {
      handleClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    // Give exit animation time to finish
    setTimeout(onDismiss, 350);
  }, [onDismiss]);

  const handleSkip = useCallback(() => {
    handleClose();
  }, [handleClose]);

  if (!visible) return null;

  const calloutStyle = getCalloutStyle(currentStep.anchor);
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <>
      {/* ── Backdrop — very subtle, doesn't block interaction ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8000,
          pointerEvents: 'none', // let clicks pass through to the app
          background: 'rgba(4, 6, 10, 0.45)',
        }}
      />

      {/* ── Callout card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: currentStep.anchor === 'bottom-center' ? 12 : -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: currentStep.anchor === 'bottom-center' ? 12 : -12, scale: 0.96 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            zIndex: 8001,
            width: 340,
            pointerEvents: 'all',
            ...calloutStyle,
          }}
        >
          {/* Callout body */}
          <div
            style={{
              background: 'rgba(8, 12, 18, 0.98)',
              border: '1px solid rgba(99,179,237,0.28)',
              borderRadius: 8,
              padding: '18px 20px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,179,237,0.08)',
              position: 'relative',
            }}
          >
            {/* Step dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === stepIndex ? 16 : 5,
                    height: 5,
                    borderRadius: 3,
                    background: i === stepIndex
                      ? '#63B3ED'
                      : i < stepIndex
                        ? 'rgba(99,179,237,0.4)'
                        : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
              <div style={{ flex: 1 }} />
              {/* Close / skip */}
              <button
                id="guidance-close-btn"
                onClick={handleSkip}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-ghost)',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 3,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E2E8F0'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-ghost)'; }}
                title="Skip all guidance"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>

            {/* Partner voice header */}
            <p
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                fontWeight: 700,
                color: '#63B3ED',
                margin: '0 0 8px',
                letterSpacing: '0.02em',
                lineHeight: 1.3,
              }}
            >
              {currentStep.title}
            </p>

            {/* Body text */}
            <p
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                margin: '0 0 18px',
              }}
            >
              {currentStep.body}
            </p>

            {/* Action row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Skip link */}
              <button
                id="guidance-skip-btn"
                onClick={handleSkip}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9,
                  color: 'var(--text-ghost)',
                  letterSpacing: '0.08em',
                  padding: 0,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-ghost)'; }}
              >
                SKIP ALL
              </button>

              {/* Next / Got it */}
              <button
                id={`guidance-next-${stepIndex}`}
                onClick={handleNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  background: 'rgba(99,179,237,0.1)',
                  border: '1px solid rgba(99,179,237,0.3)',
                  borderRadius: 4,
                  color: '#63B3ED',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.18)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,179,237,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,179,237,0.1)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,179,237,0.3)';
                }}
              >
                {isLast ? 'GOT IT' : 'NEXT'}
                {!isLast && <ArrowRight size={11} strokeWidth={1.5} />}
              </button>
            </div>

            {/* Step counter label */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 20,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 7.5,
                color: 'var(--text-ghost)',
                letterSpacing: '0.12em',
              }}
            >
              FIELD GUIDE — {stepIndex + 1} / {STEPS.length}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
