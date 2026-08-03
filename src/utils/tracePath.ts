import { GRAPH_RELATIONSHIPS } from '@/data/graphData';

export function computeTracePath(startId: string): {
  path: string[];
  confidence: number;
  breakdown: string;
} {
  // Pre-defined high-fidelity paths for main suspects / keys
  if (startId === 'ENT-001' || startId === 'EVD-E01') {
    return {
      path: ['ENT-001', 'EVD-E01', 'ENT-007', 'EVD-E02', 'ENT-P6', 'ENT-008'],
      confidence: 91,
      breakdown: '2 SHARED ENTITIES / 2 TEMPORAL RELATIONSHIPS / 1 GEOGRAPHIC OVERLAP',
    };
  }
  if (startId === 'ENT-P4' || startId === 'EVD-E03') {
    return {
      path: ['ENT-P4', 'EVD-E03', 'ENT-P6', 'ENT-008', 'EVD-005', 'ENT-001'],
      confidence: 85,
      breakdown: '1 SHARED ENTITIES / 3 TEMPORAL RELATIONSHIPS / 1 GEOGRAPHIC OVERLAP',
    };
  }
  if (startId === 'ENT-004' || startId === 'EVD-D03') {
    return {
      path: ['ENT-004', 'EVD-D03', 'ENT-003', 'EVD-D04', 'ENT-L3', 'ENT-P6'],
      confidence: 95,
      breakdown: '3 SHARED ENTITIES / 1 TEMPORAL RELATIONSHIPS / 0 GEOGRAPHIC OVERLAP',
    };
  }
  if (startId === 'ENT-008' || startId === 'EVD-D05' || startId === 'EVD-005') {
    return {
      path: ['ENT-008', 'EVD-D05', 'ENT-001', 'EVD-E01', 'ENT-007', 'ENT-P6'],
      confidence: 88,
      breakdown: '2 SHARED ENTITIES / 2 TEMPORAL RELATIONSHIPS / 1 GEOGRAPHIC OVERLAP',
    };
  }
  if (startId === 'ENT-P6' || startId === 'EVD-E02') {
    return {
      path: ['ENT-P6', 'EVD-E02', 'ENT-007', 'EVD-E01', 'ENT-001', 'ENT-008'],
      confidence: 89,
      breakdown: '2 SHARED ENTITIES / 2 TEMPORAL RELATIONSHIPS / 1 GEOGRAPHIC OVERLAP',
    };
  }

  // Fallback dynamic BFS search to ENT-001 or ENT-008
  const targetId = startId !== 'ENT-001' ? 'ENT-001' : 'ENT-008';
  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);
  
  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const lastNode = currentPath[currentPath.length - 1];
    
    if (lastNode === targetId) {
      const len = currentPath.length;
      const confidence = Math.max(50, 95 - len * 5);
      const sharedEntities = Math.max(0, len - 2);
      const temporalRels = Math.max(0, Math.floor(len / 2));
      const geoOverlap = len % 2 === 0 ? 1 : 0;
      return {
        path: currentPath,
        confidence,
        breakdown: `${sharedEntities} SHARED ENTITIES / ${temporalRels} TEMPORAL RELATIONSHIPS / ${geoOverlap} GEOGRAPHIC OVERLAP`,
      };
    }
    
    const neighbors: string[] = [];
    GRAPH_RELATIONSHIPS.forEach(r => {
      if (r.sourceEntityId === lastNode && !visited.has(r.targetEntityId)) {
        neighbors.push(r.targetEntityId);
      }
      if (r.targetEntityId === lastNode && !visited.has(r.sourceEntityId)) {
        neighbors.push(r.sourceEntityId);
      }
    });
    
    for (const n of neighbors) {
      visited.add(n);
      queue.push([...currentPath, n]);
    }
  }
  
  // Ultimate fallback
  return {
    path: [startId],
    confidence: 65,
    breakdown: '0 SHARED ENTITIES / 0 TEMPORAL RELATIONSHIPS / 0 GEOGRAPHIC OVERLAP',
  };
}
