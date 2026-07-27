'use client';

interface PulsingDotProps {
  color?: 'green' | 'cyan' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorMap = {
  green: { dot: '#48BB78', ring: 'rgba(72, 187, 120, 0.4)' },
  cyan:  { dot: '#63B3ED', ring: 'rgba(99, 179, 237, 0.4)' },
  yellow:{ dot: '#ECC94B', ring: 'rgba(236, 201, 75, 0.4)' },
  red:   { dot: '#FC8181', ring: 'rgba(252, 129, 129, 0.4)' },
};

const sizeMap = {
  sm: { dot: 5, container: 12 },
  md: { dot: 7, container: 16 },
  lg: { dot: 9, container: 20 },
};

export default function PulsingDot({
  color = 'green',
  size = 'sm',
  className = '',
}: PulsingDotProps) {
  const { dot: dotColor, ring: ringColor } = colorMap[color];
  const { dot: dotSize, container: containerSize } = sizeMap[size];

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Expanding ring */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: ringColor,
          animation: 'pulse-ring 2s ease-out infinite',
        }}
      />
      {/* Core dot */}
      <span
        className="relative rounded-full pulsing-dot"
        style={{
          width: dotSize,
          height: dotSize,
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}`,
        }}
      />
    </span>
  );
}
