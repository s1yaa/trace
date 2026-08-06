'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingScreenProps {
  onEnter: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacityTarget: number;
  life: number;
  maxLife: number;
}

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const spawnParticle = useCallback((width: number, height: number): Particle => {
    const x = Math.random() * width;
    const maxLife = 180 + Math.random() * 240;
    return {
      x,
      y: height + 10,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.3 + Math.random() * 0.6),
      size: 0.8 + Math.random() * 1.4,
      opacity: 0,
      opacityTarget: 0.15 + Math.random() * 0.35,
      life: 0,
      maxLife,
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Seed particles
    particlesRef.current = Array.from({ length: 60 }, () =>
      spawnParticle(canvas.width, canvas.height)
    );

    let gridPhase = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // ── Animated grid ──────────────────────────────────────
      gridPhase += 0.003;
      const gridAlpha = 0.025 + 0.015 * Math.sin(gridPhase);
      ctx.strokeStyle = `rgba(99, 179, 237, ${gridAlpha})`;
      ctx.lineWidth = 0.5;

      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ── Radial glow ────────────────────────────────────────
      const glowAlpha = 0.06 + 0.03 * Math.sin(gridPhase * 1.3);
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.min(width, height) * 0.55
      );
      gradient.addColorStop(0, `rgba(99, 179, 237, ${glowAlpha})`);
      gradient.addColorStop(0.5, `rgba(66, 153, 225, ${glowAlpha * 0.3})`);
      gradient.addColorStop(1, 'rgba(99, 179, 237, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ── Particles ──────────────────────────────────────────
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Fade in
        if (p.life < 40) p.opacity = (p.life / 40) * p.opacityTarget;
        // Fade out near end
        else if (p.life > p.maxLife - 40)
          p.opacity = ((p.maxLife - p.life) / 40) * p.opacityTarget;
        else
          p.opacity = p.opacityTarget;

        // Remove & respawn
        if (p.life >= p.maxLife || p.y < -10) {
          particles[i] = spawnParticle(width, height);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 179, 237, ${p.opacity})`;
        ctx.fill();
      }

      // ── Horizontal scan line ───────────────────────────────
      const scanY = ((Date.now() / 6000) % 1) * height;
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrad.addColorStop(0, 'rgba(99, 179, 237, 0)');
      scanGrad.addColorStop(0.5, 'rgba(99, 179, 237, 0.04)');
      scanGrad.addColorStop(1, 'rgba(99, 179, 237, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 40, width, 80);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active, canvasRef, spawnParticle]);
}

const LETTERS = 'TRACE'.split('');

export default function OnboardingScreen({ onEnter }: OnboardingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [clicked, setClicked] = useState(false);

  useParticleCanvas(canvasRef, visible);

  const handleEnter = () => {
    if (clicked) return;
    setClicked(true);
    setTimeout(() => {
      setVisible(false);
      setTimeout(onEnter, 600);
    }, 200);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onboarding"
          className="fixed inset-0 flex flex-col items-center justify-center z-50 select-none"
          style={{ background: 'var(--bg-void)' }}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: 'brightness(2)',
            transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
          }}
        >
          {/* Canvas background */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: 0.9 }}
          />

          {/* Corner brackets — top left */}
          <div className="absolute top-8 left-8 pointer-events-none">
            <div style={{
              width: 32, height: 32,
              borderTop: '1px solid rgba(99,179,237,0.3)',
              borderLeft: '1px solid rgba(99,179,237,0.3)',
            }} />
          </div>
          {/* Corner brackets — top right */}
          <div className="absolute top-8 right-8 pointer-events-none">
            <div style={{
              width: 32, height: 32,
              borderTop: '1px solid rgba(99,179,237,0.3)',
              borderRight: '1px solid rgba(99,179,237,0.3)',
            }} />
          </div>
          {/* Corner brackets — bottom left */}
          <div className="absolute bottom-8 left-8 pointer-events-none">
            <div style={{
              width: 32, height: 32,
              borderBottom: '1px solid rgba(99,179,237,0.3)',
              borderLeft: '1px solid rgba(99,179,237,0.3)',
            }} />
          </div>
          {/* Corner brackets — bottom right */}
          <div className="absolute bottom-8 right-8 pointer-events-none">
            <div style={{
              width: 32, height: 32,
              borderBottom: '1px solid rgba(99,179,237,0.3)',
              borderRight: '1px solid rgba(99,179,237,0.3)',
            }} />
          </div>

          {/* System identifier */}
          <motion.div
            className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#63B3ED] pulsing-dot" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-muted)] uppercase">
              Digital Investigation System — v1.0.0
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#63B3ED] pulsing-dot" />
          </motion.div>

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-8 z-10">
            {/* TRACE wordmark */}
            <div className="flex items-center gap-[0.04em]" aria-label="TRACE">
              {LETTERS.map((letter, i) => (
                <motion.span
                  key={i}
                  className="font-mono font-bold select-none"
                  style={{
                    fontSize: 'clamp(72px, 10vw, 140px)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    textShadow: '0 0 60px rgba(99,179,237,0.12)',
                    animation: 'flicker 8s ease-in-out infinite',
                    animationDelay: `${i * 0.7}s`,
                  }}
                  initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    delay: 0.5 + i * 0.1,
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Accent line under wordmark */}
            <motion.div
              className="relative"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformOrigin: 'center' }}
            >
              <div style={{
                width: 'clamp(200px, 30vw, 480px)',
                height: 1,
                background: 'linear-gradient(90deg, transparent 0%, rgba(99,179,237,0.5) 30%, rgba(99,179,237,0.8) 50%, rgba(99,179,237,0.5) 70%, transparent 100%)',
              }} />
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#63B3ED]"
                style={{ boxShadow: '0 0 12px rgba(99,179,237,0.8)' }}
              />
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="font-mono text-center uppercase tracking-[0.3em]"
              style={{
                fontSize: 'clamp(10px, 1.1vw, 13px)',
                color: 'var(--text-muted)',
                maxWidth: 500,
                letterSpacing: '0.3em',
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.7 }}
            >
              Follow the evidence.&nbsp;&nbsp;Uncover the connections.
            </motion.p>

            {/* CTA Button */}
            <motion.button
              id="begin-investigation-btn"
              className="relative mt-4 font-mono uppercase tracking-[0.2em] cursor-pointer overflow-hidden"
              style={{
                fontSize: 11,
                padding: '14px 40px',
                background: hoverBtn
                  ? 'rgba(99, 179, 237, 0.12)'
                  : 'rgba(99, 179, 237, 0.05)',
                border: `1px solid ${hoverBtn ? 'rgba(99,179,237,0.6)' : 'rgba(99,179,237,0.25)'}`,
                color: hoverBtn ? '#63B3ED' : 'rgba(99,179,237,0.7)',
                borderRadius: 2,
                transition: 'all 0.25s ease',
                boxShadow: hoverBtn
                  ? '0 0 24px rgba(99,179,237,0.15), inset 0 0 20px rgba(99,179,237,0.05)'
                  : 'none',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.6 }}
              onMouseEnter={() => setHoverBtn(true)}
              onMouseLeave={() => setHoverBtn(false)}
              onClick={handleEnter}
              whileTap={{ scale: 0.97 }}
            >
              {/* Shimmer on hover */}
              {hoverBtn && (
                <motion.span
                  className="absolute inset-0 pointer-events-none"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(99,179,237,0.15), transparent)',
                  }}
                />
              )}
              Begin Investigation
            </motion.button>

            {/* Sub-label */}
            <motion.p
              className="font-mono text-center"
              style={{ fontSize: 9, color: 'var(--text-ghost)', letterSpacing: '0.15em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.1, duration: 0.8 }}
            >
              Case CASE-047 loaded &nbsp;·&nbsp; Secure session active &nbsp;·&nbsp; Decryption Suite: Ready
            </motion.p>
          </div>

          {/* Bottom system status */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.6 }}
          >
            {[
              { label: 'EVIDENCE', value: '24 ITEMS' },
              { label: 'ENTITIES', value: '17 NODES' },
              { label: 'CONNECTIONS', value: '42 LINKS' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-ghost)', letterSpacing: '0.2em' }}>
                  {label}
                </span>
                <span className="font-mono font-semibold" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {value}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
