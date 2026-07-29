'use client';

import { memo, useEffect, useRef } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import type { GraphEdgeData } from '@/types';

const LABEL_MAP: Record<string, string> = {
  COMMUNICATES_WITH: 'COMMS',
  WORKS_AT: 'WORKS AT',
  LOCATED_AT: 'AT',
  OWNS: 'OWNS',
  ACCESSED: 'ACCESSED',
  TRANSFERRED_TO: 'SENT TO',
  ASSOCIATED_WITH: 'LINKED',
  CREATED_BY: 'CREATED BY',
  AUTHORED: 'AUTHORED',
  MENTIONED_IN: 'IN',
  SENT_TO: 'SENT TO',
  REFERENCES: 'REFS',
  OCCURRED_BEFORE: 'BEFORE',
  OCCURRED_AFTER: 'AFTER',
  CONNECTED_TO: 'CONNECTED',
  INVOLVED_IN: 'INVOLVED',
  RECEIVED_FROM: 'RECEIVED',
};

interface TrackingParticle {
  progress: number;
  speed: number;
  opacity: number;
  size: number;
}

function AnimatedParticlePath({
  edgePath,
  color,
  active,
}: {
  edgePath: string;
  color: string;
  active: boolean;
}) {
  if (!active) return null;

  return (
    <>
      {/* Animated dot along the edge using CSS animation */}
      <circle r={3} fill={color} opacity={0.9}>
        <animateMotion dur="1.8s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r={1.5} fill={color} opacity={0.5}>
        <animateMotion dur="1.8s" repeatCount="indefinite" begin="0.6s" path={edgePath} />
      </circle>
    </>
  );
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  COMMUNICATES_WITH: '#63B3ED',
  WORKS_AT: '#9F7AEA',
  LOCATED_AT: '#FC8181',
  OWNS: '#9F7AEA',
  ACCESSED: '#FC8181',
  TRANSFERRED_TO: '#FC8181',
  ASSOCIATED_WITH: '#718096',
  CREATED_BY: '#68D391',
  AUTHORED: '#68D391',
  MENTIONED_IN: '#718096',
  SENT_TO: '#F6AD55',
  REFERENCES: '#68D391',
  OCCURRED_BEFORE: '#ECC94B',
  OCCURRED_AFTER: '#ECC94B',
  CONNECTED_TO: '#63B3ED',
  INVOLVED_IN: '#ECC94B',
  RECEIVED_FROM: '#F6AD55',
};

function TraceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as GraphEdgeData | undefined;
  const rel = edgeData?.relationship;
  const isActive = edgeData?.isActive ?? false;
  const isDimmed = edgeData?.isDimmed ?? false;

  const relType = rel?.type ?? 'CONNECTED_TO';
  const color = RELATIONSHIP_COLORS[relType] ?? '#4A5568';
  const label = LABEL_MAP[relType] ?? relType;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const edgeOpacity = isDimmed ? 0.06 : isActive ? 0.7 : 0.25;
  const strokeWidth = isActive ? 1.5 : 0.8;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth,
          opacity: edgeOpacity,
          strokeDasharray: rel?.confidence === 'SPECULATIVE' ? '4 4' : 'none',
          transition: 'opacity 0.3s ease, stroke-width 0.3s ease',
        }}
      />

      {/* Animated particle when active */}
      {isActive && (
        <AnimatedParticlePath
          edgePath={edgePath}
          color={color}
          active={isActive}
        />
      )}

      {/* Label — only show when active or on hover */}
      {isActive && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            <div
              style={{
                background: 'rgba(8,12,16,0.92)',
                border: `1px solid ${color}50`,
                borderRadius: 3,
                padding: '2px 5px',
                fontSize: 8,
                fontFamily: 'JetBrains Mono, monospace',
                color: color,
                opacity: 0.9,
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const EDGE_TYPES = {
  trace: memo(TraceEdge),
};
