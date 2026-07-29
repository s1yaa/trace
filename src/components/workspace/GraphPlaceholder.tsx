'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Network, Cpu } from 'lucide-react';
import type { GraphPlaceholderProps } from '@/types';

interface MappingNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  type: 'primary' | 'secondary' | 'tertiary';
}

interface MappingEdge {
  from: number;
  to: number;
  progress: number;
  speed: number;
  opacity: number;
}

function useMappingCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const nodesRef = useRef<MappingNode[]>([]);
  const edgesRef = useRef<MappingEdge[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initNodes();
    };

    const initNodes = () => {
      const { width, height } = canvas;
      const count = Math.min(18, Math.floor((width * height) / 20000));
      nodesRef.current = Array.from({ length: count }, (_, i) => ({
        x: 80 + Math.random() * (width - 160),
        y: 80 + Math.random() * (height - 160),
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: i === 0 ? 6 : i < 4 ? 4 : 3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.015,
        type: i === 0 ? 'primary' : i < 4 ? 'secondary' : 'tertiary',
      }));

      // Build edges
      const nodes = nodesRef.current;
      edgesRef.current = [];
      for (let i = 0; i < nodes.length; i++) {
        const connections = i === 0 ? 3 : 1 + Math.floor(Math.random() * 2);
        for (let j = 0; j < connections; j++) {
          const target = Math.floor(Math.random() * nodes.length);
          if (target !== i) {
            edgesRef.current.push({
              from: i,
              to: target,
              progress: Math.random(),
              speed: 0.002 + Math.random() * 0.003,
              opacity: 0.15 + Math.random() * 0.25,
            });
          }
        }
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let phase = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      phase += 0.008;

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Move nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 40 || n.x > width - 40) n.vx *= -1;
        if (n.y < 40 || n.y > height - 40) n.vy *= -1;
        n.pulsePhase += n.pulseSpeed;
      });

      // Draw edges with animated data-flow dots
      edges.forEach((edge) => {
        const from = nodes[edge.from];
        const to = nodes[edge.to];
        if (!from || !to) return;

        // Static edge
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = `rgba(99, 179, 237, ${edge.opacity * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Animated data flow dot
        edge.progress += edge.speed;
        if (edge.progress > 1) edge.progress = 0;

        const dotX = from.x + (to.x - from.x) * edge.progress;
        const dotY = from.y + (to.y - from.y) * edge.progress;

        const flowOpacity = Math.sin(edge.progress * Math.PI) * edge.opacity;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 179, 237, ${flowOpacity})`;
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = 0.5 + 0.5 * Math.sin(node.pulsePhase);

        const colorMap = {
          primary: { core: '#63B3ED', ring: 'rgba(99, 179, 237, 0.3)' },
          secondary: { core: '#4299E1', ring: 'rgba(66, 153, 225, 0.2)' },
          tertiary: { core: '#2B6CB0', ring: 'rgba(43, 108, 176, 0.15)' },
        };
        const colors = colorMap[node.type];

        // Outer pulse ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = colors.ring;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.core;
        ctx.globalAlpha = 0.6 + pulse * 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Center radial glow
      const alpha = 0.03 + 0.02 * Math.sin(phase * 0.7);
      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.min(width, height) * 0.4);
      grad.addColorStop(0, `rgba(99, 179, 237, ${alpha})`);
      grad.addColorStop(1, 'rgba(99, 179, 237, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

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
export default function GraphPlaceholder({ caseId, entities, relationships, onEntitySelect }: GraphPlaceholderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useMappingCanvas(canvasRef);

  return (
    <motion.div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Mapping canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.7 }}
      />

      {/* Corner grid decoration */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Center content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10 pointer-events-none">
        {/* Icon */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ width: 64, height: 64 }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div style={{
            width: 64, height: 64,
            border: '1px solid rgba(99,179,237,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(99,179,237,0.05)',
          }}>
            <Network size={24} color="rgba(99,179,237,0.6)" />
          </div>
          {/* Orbit ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px dashed rgba(99,179,237,0.15)',
              animation: 'spin-slow 12s linear infinite',
            }}
          />
        </motion.div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          <motion.p
            className="font-mono uppercase tracking-[0.2em]"
            style={{ fontSize: 11, color: 'rgba(99,179,237,0.7)', letterSpacing: '0.2em' }}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            Mapping Evidence Trail
          </motion.p>
          <p
            className="font-mono text-center"
            style={{
              fontSize: 10,
              color: 'var(--text-ghost)',
              letterSpacing: '0.08em',
              maxWidth: 280,
              lineHeight: 1.5,
            }}
          >
            Investigation graph rendering in Phase 2.{'\n'}
            Entities and connections will appear here.
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ width: 3, height: 3, background: 'rgba(99,179,237,0.5)' }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* Corner labels */}
      <div
        className="absolute top-4 left-4 flex items-center gap-2 z-10"
        style={{ pointerEvents: 'none' }}
      >
        <Network size={12} color="rgba(99,179,237,0.4)" />
        <span className="font-mono uppercase" style={{ fontSize: 9, color: 'rgba(99,179,237,0.4)', letterSpacing: '0.15em' }}>
          Investigation Graph
        </span>
      </div>

      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
        style={{ pointerEvents: 'none' }}
      >
        <Cpu size={10} color="rgba(99,179,237,0.3)" />
        <span className="font-mono" style={{ fontSize: 9, color: 'rgba(99,179,237,0.3)', letterSpacing: '0.1em' }}>
          Phase 2
        </span>
      </div>
    </motion.div>
  );
}
