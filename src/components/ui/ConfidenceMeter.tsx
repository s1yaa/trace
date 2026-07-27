'use client';

import { motion } from 'framer-motion';

interface ConfidenceMeterProps {
  value: number;        // 0–100
  size?: number;        // SVG diameter in px
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export default function ConfidenceMeter({
  value,
  size = 64,
  strokeWidth = 3,
  showLabel = true,
  label = 'CONFIDENCE',
  className = '',
}: ConfidenceMeterProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  // Color gradient based on confidence
  const getColor = (v: number) => {
    if (v >= 75) return '#63B3ED';  // cyan — high confidence
    if (v >= 50) return '#ECC94B';  // yellow — medium
    return '#FC8181';               // red — low
  };

  const color = getColor(clampedValue);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
            style={{
              filter: `drop-shadow(0 0 4px ${color}60)`,
            }}
          />
        </svg>

        {/* Center value */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotate(0deg)' }}
        >
          <span
            className="font-mono font-semibold"
            style={{ fontSize: size * 0.22, color, lineHeight: 1 }}
          >
            {clampedValue}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: size * 0.13,
              color: 'var(--text-ghost)',
              lineHeight: 1,
              marginTop: 1,
            }}
          >
            %
          </span>
        </div>
      </div>

      {showLabel && (
        <span
          className="font-mono uppercase tracking-widest"
          style={{
            fontSize: 9,
            color: 'var(--text-ghost)',
            letterSpacing: '0.15em',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
