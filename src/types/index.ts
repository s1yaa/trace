// ============================================================
// TRACE — Core TypeScript Data Model
// All interfaces defined in Phase 1 for clean extension later
// ============================================================

export type CaseStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED' | 'PENDING';
export type EvidenceType = 'DOCUMENT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'NETWORK_LOG' | 'EMAIL' | 'CODE' | 'DATABASE' | 'FINANCIAL';
export type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DEVICE' | 'ACCOUNT' | 'FILE' | 'URL' | 'IP_ADDRESS';
export type RelationshipType = 'COMMUNICATES_WITH' | 'WORKS_AT' | 'LOCATED_AT' | 'OWNS' | 'ACCESSED' | 'TRANSFERRED_TO' | 'ASSOCIATED_WITH' | 'CREATED_BY';
export type AnomalyType = 'TIMING' | 'BEHAVIORAL' | 'NETWORK' | 'ACCESS_PATTERN' | 'DATA_EXFILTRATION' | 'IDENTITY';
export type InsightType = 'CONNECTION' | 'PATTERN' | 'ANOMALY' | 'HYPOTHESIS' | 'LEAD';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConfidenceLevel = 'SPECULATIVE' | 'PROBABLE' | 'CONFIRMED';

// ────────────────────────────────────────────────────────────
// Core Case
// ────────────────────────────────────────────────────────────

export interface Case {
  id: string;
  name: string;
  description: string;
  status: CaseStatus;
  createdAt: string;          // ISO date string
  updatedAt: string;
  closedAt?: string;
  investigator: string;
  tags: string[];
  confidenceScore: number;    // 0–100
  evidence: Evidence[];
  entities: Entity[];
  relationships: Relationship[];
  timeline: TimelineEvent[];
  anomalies: Anomaly[];
  aiInsights: AIInsight[];
  evidenceTrails: EvidenceTrail[];
}

// ────────────────────────────────────────────────────────────
// Evidence
// ────────────────────────────────────────────────────────────

export interface Evidence {
  id: string;
  caseId: string;
  type: EvidenceType;
  title: string;
  description: string;
  source: string;
  collectedAt: string;
  hash?: string;              // SHA-256 for integrity verification
  fileSize?: number;          // bytes
  tags: string[];
  entityRefs: string[];       // Entity IDs this evidence relates to
  trailId?: string;           // EvidenceTrail ID if part of a trail
  aiAnalyzed: boolean;
  anomalyFlag: boolean;
  confidence: number;         // 0–100
  metadata: Record<string, string | number | boolean>;
}

// ────────────────────────────────────────────────────────────
// Entity
// ────────────────────────────────────────────────────────────

export interface Entity {
  id: string;
  caseId: string;
  type: EntityType;
  label: string;              // Display name
  aliases: string[];
  description?: string;
  firstSeen: string;
  lastSeen: string;
  evidenceRefs: string[];     // Evidence IDs
  relationshipIds: string[];
  riskScore: number;          // 0–100
  confidence: number;         // 0–100
  isPrimary: boolean;         // key subject / person of interest
  metadata: Record<string, string | number | boolean>;
  position?: { x: number; y: number }; // Graph node position (Phase 2)
}

// ────────────────────────────────────────────────────────────
// Relationship
// ────────────────────────────────────────────────────────────

export interface Relationship {
  id: string;
  caseId: string;
  type: RelationshipType;
  sourceEntityId: string;
  targetEntityId: string;
  description?: string;
  firstObserved: string;
  lastObserved: string;
  strength: number;           // 0–100 (edge weight for graph)
  confidence: ConfidenceLevel;
  evidenceRefs: string[];
}

// ────────────────────────────────────────────────────────────
// Timeline Event
// ────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  caseId: string;
  title: string;
  description: string;
  timestamp: string;
  entityRefs: string[];
  evidenceRefs: string[];
  type: 'EVENT' | 'MILESTONE' | 'ANOMALY' | 'COMMUNICATION' | 'ACCESS' | 'TRANSACTION';
  severity: Severity;
  aiGenerated: boolean;
}

// ────────────────────────────────────────────────────────────
// Anomaly
// ────────────────────────────────────────────────────────────

export interface Anomaly {
  id: string;
  caseId: string;
  type: AnomalyType;
  title: string;
  description: string;
  detectedAt: string;
  entityRefs: string[];
  evidenceRefs: string[];
  severity: Severity;
  confidence: number;         // 0–100
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
}

// ────────────────────────────────────────────────────────────
// AI Insight
// ────────────────────────────────────────────────────────────

export interface AIInsight {
  id: string;
  caseId: string;
  type: InsightType;
  title: string;
  summary: string;
  detail: string;
  confidence: number;         // 0–100
  generatedAt: string;
  modelVersion: string;
  entityRefs: string[];
  evidenceRefs: string[];
  accepted?: boolean;         // User reviewed state
}

// ────────────────────────────────────────────────────────────
// Evidence Trail
// ────────────────────────────────────────────────────────────

export interface EvidenceTrail {
  id: string;
  caseId: string;
  name: string;
  description: string;
  createdAt: string;
  evidenceIds: string[];      // Ordered sequence of Evidence IDs
  entityIds: string[];        // Entities involved in this trail
  significance: Severity;
  aiSummary?: string;
}

// ────────────────────────────────────────────────────────────
// Utility Types for UI
// ────────────────────────────────────────────────────────────

export interface EvidenceBreakdown {
  type: EvidenceType;
  count: number;
  label: string;
}

export interface EntityBreakdown {
  type: EntityType;
  count: number;
  label: string;
}

export interface CaseSummary {
  id: string;
  name: string;
  status: CaseStatus;
  createdAt: string;
  confidenceScore: number;
  evidenceCount: number;
  entityCount: number;
  connectionCount: number;
  evidenceBreakdown: EvidenceBreakdown[];
  entityBreakdown: EntityBreakdown[];
}

// ────────────────────────────────────────────────────────────
// Props Shapes (for placeholder components — Phase 2+ will fill)
// ────────────────────────────────────────────────────────────

export interface GraphPlaceholderProps {
  caseId?: string;
  entities?: Entity[];
  relationships?: Relationship[];
  onEntitySelect?: (entity: Entity) => void;
}

export interface EntityInspectorProps {
  entity?: Entity;
  relatedEvidence?: Evidence[];
  relatedEntities?: Entity[];
  onClose?: () => void;
}

export interface TimelineStripProps {
  events?: TimelineEvent[];
  selectedEventId?: string;
  onEventSelect?: (event: TimelineEvent) => void;
  timeRange?: { start: string; end: string };
}
