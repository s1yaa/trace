export type CaseStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED' | 'PENDING';
export type EvidenceType = 'DOCUMENT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'NETWORK_LOG' | 'EMAIL' | 'CODE' | 'DATABASE' | 'FINANCIAL';
export type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DEVICE' | 'ACCOUNT' | 'FILE' | 'URL' | 'IP_ADDRESS' | 'DOCUMENT' | 'EMAIL' | 'IMAGE' | 'EVENT';
export type RelationshipType = 'COMMUNICATES_WITH' | 'WORKS_AT' | 'LOCATED_AT' | 'OWNS' | 'ACCESSED' | 'TRANSFERRED_TO' | 'ASSOCIATED_WITH' | 'CREATED_BY' | 'AUTHORED' | 'MENTIONED_IN' | 'SENT_TO' | 'REFERENCES' | 'OCCURRED_BEFORE' | 'OCCURRED_AFTER' | 'CONNECTED_TO' | 'INVOLVED_IN' | 'RECEIVED_FROM';
export type AnomalyType = 'TIMING' | 'BEHAVIORAL' | 'NETWORK' | 'ACCESS_PATTERN' | 'DATA_EXFILTRATION' | 'IDENTITY';
export type InsightType = 'CONNECTION' | 'PATTERN' | 'ANOMALY' | 'HYPOTHESIS' | 'LEAD';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConfidenceLevel = 'SPECULATIVE' | 'PROBABLE' | 'CONFIRMED';

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
  aiInsight?: AIHypothesis;  // Phase 3: per-entity AI hypothesis
}

export interface AIHypothesis {
  summary: string;            // 1-sentence core hypothesis
  detail: string;             // 2-3 sentence elaboration
  confidence: number;         // 0-100 — AI's confidence in the hypothesis
  flags: string[];            // short tags e.g. ['MOTIVE', 'OPPORTUNITY']
  generatedAt: string;        // ISO date (simulated)
}

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
  primaryRefId?: string;      // Phase 4: entity or evidence ID in graph to select on click
}

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
  conflictingEventIds?: string[]; // Phase 4: references to conflicting timeline events
}

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

export interface GraphPlaceholderProps {
  caseId?: string;
  entities?: Entity[];
  relationships?: Relationship[];
  onEntitySelect?: (entity: Entity) => void;
}

export interface EntityInspectorProps {
  entity?: Entity;
  relatedEvidence?: Evidence[];
  relatedEntities?: Entity[];   // Phase 3: connected entities for the clickable list
  connectedEntityIds?: string[]; // IDs of directly connected entities
  onClose?: () => void;
  onEntitySelect?: (entity: Entity) => void;  // Phase 3: cross-highlight
  onViewEvidence?: (entityId: string) => void; // Phase 5: open Evidence list filtered by entity
}

export interface TimelineStripProps {
  events?: TimelineEvent[];
  selectedEntityId?: string | null;
  onEntitySelect?: (entity: Entity | null) => void;
  anomalies?: Anomaly[];
  timeRange?: { start: string; end: string };
}

export type NodeFilterType = 'ALL' | 'PERSON' | 'ORGANIZATION' | 'DOCUMENT' | 'EMAIL' | 'IMAGE' | 'LOCATION' | 'EVENT';

export interface GraphNodeData {
  entity: Entity;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  isExpanded: boolean;
  isDiscovered: boolean;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  [key: string]: unknown;   // React Flow requires index signature
}

export interface GraphEdgeData {
  relationship: Relationship;
  isActive: boolean;        // animated particle when source/target selected
  isDimmed: boolean;
  [key: string]: unknown;
}

export interface LeadRecord {
  nodeId: string;
  discoveredAt: number;     // timestamp ms
  label: string;
}
