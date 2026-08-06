'use client';

import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  User, Building2, FileText, Mail, Image,
  MapPin, Zap, Monitor, FolderOpen,
} from 'lucide-react';
import type { GraphNodeData } from '@/types';
import type { EntityType } from '@/types';

interface NodeConfig {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  color: string;        // primary accent
  bgColor: string;      // node background
  borderColor: string;
  label: string;        // display type label
}

const NODE_CONFIG: Record<EntityType, NodeConfig> = {
  PERSON: {
    icon: User,
    color: '#63B3ED',
    bgColor: 'rgba(99, 179, 237, 0.08)',
    borderColor: 'rgba(99, 179, 237, 0.35)',
    label: 'PERSON',
  },
  ORGANIZATION: {
    icon: Building2,
    color: '#9F7AEA',
    bgColor: 'rgba(159, 122, 234, 0.08)',
    borderColor: 'rgba(159, 122, 234, 0.35)',
    label: 'ORGANIZATION',
  },
  DOCUMENT: {
    icon: FileText,
    color: '#68D391',
    bgColor: 'rgba(104, 211, 145, 0.08)',
    borderColor: 'rgba(104, 211, 145, 0.3)',
    label: 'DOCUMENT',
  },
  EMAIL: {
    icon: Mail,
    color: '#F6AD55',
    bgColor: 'rgba(246, 173, 85, 0.08)',
    borderColor: 'rgba(246, 173, 85, 0.3)',
    label: 'EMAIL',
  },
  IMAGE: {
    icon: Image,
    color: '#76E4F7',
    bgColor: 'rgba(118, 228, 247, 0.08)',
    borderColor: 'rgba(118, 228, 247, 0.3)',
    label: 'IMAGE',
  },
  LOCATION: {
    icon: MapPin,
    color: '#FC8181',
    bgColor: 'rgba(252, 129, 129, 0.08)',
    borderColor: 'rgba(252, 129, 129, 0.3)',
    label: 'LOCATION',
  },
  EVENT: {
    icon: Zap,
    color: '#ECC94B',
    bgColor: 'rgba(236, 201, 75, 0.08)',
    borderColor: 'rgba(236, 201, 75, 0.3)',
    label: 'EVENT',
  },
  ACCOUNT: {
    icon: FolderOpen,
    color: '#FC8181',
    bgColor: 'rgba(252, 129, 129, 0.08)',
    borderColor: 'rgba(252, 129, 129, 0.3)',
    label: 'ACCOUNT',
  },
  DEVICE: {
    icon: Monitor,
    color: '#63B3ED',
    bgColor: 'rgba(99, 179, 237, 0.07)',
    borderColor: 'rgba(99, 179, 237, 0.25)',
    label: 'DEVICE',
  },
  FILE: {
    icon: FileText,
    color: '#68D391',
    bgColor: 'rgba(104, 211, 145, 0.07)',
    borderColor: 'rgba(104, 211, 145, 0.25)',
    label: 'FILE',
  },
  URL: {
    icon: FolderOpen,
    color: '#76E4F7',
    bgColor: 'rgba(118, 228, 247, 0.07)',
    borderColor: 'rgba(118, 228, 247, 0.25)',
    label: 'URL',
  },
  IP_ADDRESS: {
    icon: Monitor,
    color: '#FC8181',
    bgColor: 'rgba(252, 129, 129, 0.07)',
    borderColor: 'rgba(252, 129, 129, 0.25)',
    label: 'IP ADDRESS',
  },
};

function ConfidenceBadge({ value, color }: { value: number; color: string }) {
  const alpha = value >= 75 ? 0.9 : value >= 50 ? 0.7 : 0.5;
  return (
    <div
      style={{
        position: 'absolute',
        top: -7,
        right: -7,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: `rgba(8,12,16,0.95)`,
        border: `1px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 7,
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 700,
        color: color,
        opacity: alpha,
        letterSpacing: 0,
        boxShadow: `0 0 6px ${color}40`,
        zIndex: 5,
      }}
    >
      {value}
    </div>
  );
}

interface NodeShellProps {
  data: GraphNodeData;
  config: NodeConfig;
  children?: React.ReactNode;
}

function NodeShell({ data, config, children }: NodeShellProps) {
  const { entity, isSelected, isHighlighted, isDimmed, isIdlePulse, onSelect, onDoubleClick } = data;
  const Icon = config.icon;

  // Border color varies by state
  const borderColor = isSelected
    ? config.color
    : isHighlighted
      ? `${config.color}99`
      : config.borderColor;

  const shadowColor = isSelected
    ? `0 0 20px ${config.color}50, 0 0 40px ${config.color}20`
    : isHighlighted
      ? `0 0 12px ${config.color}30`
      : 'none';

  const opacity = isDimmed ? 0.25 : 1;
  const scale = isSelected ? 1.06 : 1;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(entity.id);
  }, [entity.id, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(entity.id);
  }, [entity.id, onDoubleClick]);

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        opacity,
        transform: `scale(${scale})`,
        transition: 'opacity 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Outer pulse ring — always present, more visible when selected */}
      <div
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: 8,
          border: `1px solid ${config.color}`,
          opacity: isSelected ? 0.4 : 0.12,
          pointerEvents: 'none',
          animation: 'node-pulse 3s ease-in-out infinite',
          animationDelay: `${Math.random() * 2}s`,
        }}
      />

      {/* Idle hint ring — only when player has been idle and this is the suggested node */}
      {isIdlePulse && !isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: -14,
            borderRadius: 10,
            border: `1px solid ${config.color}`,
            opacity: 0.55,
            pointerEvents: 'none',
            animation: 'node-pulse 1.8s ease-in-out infinite',
          }}
        />
      )}

      {/* Main card */}
      <div
        style={{
          position: 'relative',
          width: 120,
          background: isSelected
            ? `linear-gradient(135deg, ${config.bgColor}, rgba(8,12,16,0.9))`
            : `rgba(13,17,23,0.92)`,
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          padding: '10px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          boxShadow: shadowColor,
          backdropFilter: 'blur(8px)',
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
        }}
      >
        {/* Confidence badge */}
        {entity.confidence < 95 && (
          <ConfidenceBadge value={entity.confidence} color={config.color} />
        )}

        {/* Primary status indicator */}
        {entity.isPrimary && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: -6,
              width: 12,
              height: 12,
              borderRadius: 2,
              background: '#FC8181',
              border: '1px solid #FC8181',
              boxShadow: '0 0 8px rgba(252,129,129,0.6)',
            }}
          />
        )}

        {/* Icon container */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: isSelected ? config.bgColor : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isSelected ? borderColor : 'rgba(255,255,255,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <Icon size={16} strokeWidth={1.5} />
        </div>

        {/* Label */}
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 600,
            color: isSelected ? config.color : 'rgba(226,232,240,0.9)',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s ease',
          }}
          title={entity.label}
        >
          {entity.label}
        </div>

        {/* Type label */}
        <div
          style={{
            fontSize: 8,
            fontFamily: 'JetBrains Mono, monospace',
            color: config.color,
            letterSpacing: '0.1em',
            opacity: 0.7,
          }}
        >
          {config.label}
        </div>

        {children}
      </div>

      {/* Handles — invisible but functional */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, width: 8, height: 8, background: config.color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 8, height: 8, background: config.color }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ opacity: 0, width: 8, height: 8, background: config.color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ opacity: 0, width: 8, height: 8, background: config.color }}
      />
    </div>
  );
}

export const PersonNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.PERSON} />
));
PersonNode.displayName = 'PersonNode';

export const OrganizationNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.ORGANIZATION} />
));
OrganizationNode.displayName = 'OrganizationNode';

export const DocumentNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.DOCUMENT} />
));
DocumentNode.displayName = 'DocumentNode';

export const EmailNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.EMAIL} />
));
EmailNode.displayName = 'EmailNode';

export const ImageNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.IMAGE} />
));
ImageNode.displayName = 'ImageNode';

export const LocationNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.LOCATION} />
));
LocationNode.displayName = 'LocationNode';

export const EventNode = memo(({ data }: { data: GraphNodeData }) => {
  const { entity } = data;
  return (
    <NodeShell data={data} config={NODE_CONFIG.EVENT}>
      {/* Risk indicator */}
      {entity.riskScore >= 80 && (
        <div
          style={{
            fontSize: 8,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#FC8181',
            letterSpacing: '0.05em',
          }}
        >
          ⚠ CRITICAL
        </div>
      )}
    </NodeShell>
  );
});
EventNode.displayName = 'EventNode';

export const AccountNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.ACCOUNT} />
));
AccountNode.displayName = 'AccountNode';

export const DeviceNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.DEVICE} />
));
DeviceNode.displayName = 'DeviceNode';

export const DefaultNode = memo(({ data }: { data: GraphNodeData }) => (
  <NodeShell data={data} config={NODE_CONFIG.FILE} />
));
DefaultNode.displayName = 'DefaultNode';

export const NODE_TYPES = {
  PERSON: PersonNode,
  ORGANIZATION: OrganizationNode,
  DOCUMENT: DocumentNode,
  EMAIL: EmailNode,
  IMAGE: ImageNode,
  LOCATION: LocationNode,
  EVENT: EventNode,
  ACCOUNT: AccountNode,
  DEVICE: DeviceNode,
  FILE: DefaultNode,
  URL: DefaultNode,
  IP_ADDRESS: DeviceNode,
};

export { NODE_CONFIG };
