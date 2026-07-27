'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { TimelineStripProps } from '@/types';

function useTimelineCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let phase = 0;

    // Fake event positions
    const events = [0.08, 0.21, 0.36, 0.54, 0.68, 0.79, 0.91].map((pct) => ({
      pct,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.015 + Math.random() * 0.02,
      height: 20 + Math.floor(Math.random() * 40),
      severity: Math.random() > 0.6 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
    }));

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      phase += 0.01;

      const midY = height / 2;

      // Timeline axis
      ctx.beginPath();
      ctx.moveTo(20, midY);
      ctx.lineTo(width - 20, midY);
      ctx.strokeStyle = 'rgba(99,179,237,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Animated scan cursor
      const scanX = 20 + ((phase * 30) % (width - 40));
      const scanGrad = ctx.createLinearGradient(scanX - 30, 0, scanX + 30, 0);
      scanGrad.addColorStop(0, 'rgba(99, 179, 237, 0)');
      scanGrad.addColorStop(0.5, 'rgba(99, 179, 237, 0.12)');
      scanGrad.addColorStop(1, 'rgba(99, 179, 237, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(scanX - 30, 0, 60, height);

      // Tick marks
      const tickCount = 12;
      for (let i = 0; i <= tickCount; i++) {
        const x = 20 + (i / tickCount) * (width - 40);
        ctx.beginPath();
        ctx.moveTo(x, midY - 4);
        ctx.lineTo(x, midY + 4);
        ctx.strokeStyle = 'rgba(99, 179, 237, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Events
      events.forEach((ev) => {
        ev.pulsePhase += ev.pulseSpeed;
        const x = 20 + ev.pct * (width - 40);
        const pulse = 0.5 + 0.5 * Math.sin(ev.pulsePhase);

        const colorMap: Record<string, string> = {
          high:   'rgba(252, 129, 129, 0.7)',
          medium: 'rgba(236, 201, 75, 0.7)',
          low:    'rgba(99, 179, 237, 0.6)',
        };
        const color = colorMap[ev.severity];

        // Stem
        ctx.beginPath();
        ctx.moveTo(x, midY);
        ctx.lineTo(x, midY - ev.height);
        ctx.strokeStyle = color.replace('0.7', '0.25');
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pulse ring
        ctx.beginPath();
        ctx.arc(x, midY - ev.height, 3 + pulse * 3, 0, Math.PI * 2);
        ctx.strokeStyle = color.replace('0.7', `${pulse * 0.3}`);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, midY - ev.height, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, [canvasRef]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TimelineStrip({ events, selectedEventId, onEventSelect, timeRange }: TimelineStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useTimelineCanvas(canvasRef);

  return (
    <motion.div
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        height: 'var(--timeline-height)',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-subtle)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2"
        style={{
          height: 34,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <Clock size={11} color="var(--text-muted)" />
          <span className="font-mono uppercase" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            Timeline
          </span>
          <span
            className="font-mono px-1.5 py-0.5 rounded-sm"
            style={{
              fontSize: 8,
              color: 'rgba(99,179,237,0.6)',
              background: 'rgba(99,179,237,0.08)',
              border: '1px solid rgba(99,179,237,0.15)',
            }}
          >
            Oct 28 — Nov 12, 2025
          </span>
        </div>
        <div className="flex items-center gap-4">
          {[
            { color: 'rgba(252,129,129,0.8)', label: 'Critical' },
            { color: 'rgba(236,201,75,0.8)', label: 'High' },
            { color: 'rgba(99,179,237,0.7)', label: 'Event' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span style={{ fontSize: 9, color: 'var(--text-ghost)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Awaiting data overlay — subtle */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <motion.p
            className="font-mono uppercase"
            style={{ fontSize: 8, color: 'rgba(99,179,237,0.25)', letterSpacing: '0.2em' }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            Awaiting timeline data — Phase 3
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
