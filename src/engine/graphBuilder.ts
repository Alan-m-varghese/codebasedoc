import { DependencyEdge, FileItem, FileScore, ImportCycle } from '../types/repo';

export function resolveImportPath(sourcePath: string, importPath: string, allFiles: FileItem[]): FileItem | undefined {
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    // Check if imported name matches a file stem or package in codebase
    return allFiles.find(f => {
      const stem = f.name.split('.')[0];
      return importPath.toLowerCase().endsWith(stem.toLowerCase()) || f.path.includes(importPath.replace(/\./g, '/'));
    });
  }

  // Resolve relative import
  const sourceParts = sourcePath.split('/');
  sourceParts.pop(); // Remove source filename
  const importParts = importPath.split('/');

  for (const part of importParts) {
    if (part === '.') continue;
    if (part === '..') {
      sourceParts.pop();
    } else {
      sourceParts.push(part);
    }
  }

  const normalized = sourceParts.join('/');
  const match = allFiles.find(f => {
    const pWithoutExt = f.path.replace(/\.[^/.]+$/, '');
    return pWithoutExt === normalized || f.path === normalized;
  });

  return match;
}

export function buildDependencyGraph(files: FileItem[]): { edges: DependencyEdge[]; scores: Record<string, FileScore>; cycles: ImportCycle[] } {
  const edges: DependencyEdge[] = [];
  const edgeSet = new Set<string>();

  // Map file IDs for quick lookup
  const fileMap = new Map<string, FileItem>();
  files.forEach(f => fileMap.set(f.id, f));

  // Build Edges
  files.forEach(source => {
    source.imports.forEach(imp => {
      const target = resolveImportPath(source.path, imp, files);
      if (target && target.id !== source.id) {
        const edgeKey = `${source.id}->${target.id}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            id: `edge_${source.id}_to_${target.id}`,
            sourceFileId: source.id,
            targetFileId: target.id,
            sourcePath: source.path,
            targetPath: target.path,
            type: 'import'
          });
        }
      }
    });
  });

  // Calculate Degrees
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  files.forEach(f => {
    inDegreeMap.set(f.id, 0);
    outDegreeMap.set(f.id, 0);
    adjacencyList.set(f.id, []);
  });

  edges.forEach(e => {
    outDegreeMap.set(e.sourceFileId, (outDegreeMap.get(e.sourceFileId) || 0) + 1);
    inDegreeMap.set(e.targetFileId, (inDegreeMap.get(e.targetFileId) || 0) + 1);
    adjacencyList.get(e.sourceFileId)?.push(e.targetFileId);
  });

  // PageRank Algorithm
  const N = files.length || 1;
  const d = 0.85; // Damping factor
  let pageRankMap = new Map<string, number>();
  files.forEach(f => pageRankMap.set(f.id, 1 / N));

  // 15 PageRank iterations
  for (let iter = 0; iter < 15; iter++) {
    const nextRank = new Map<string, number>();
    files.forEach(f => nextRank.set(f.id, (1 - d) / N));

    files.forEach(f => {
      const neighbors = adjacencyList.get(f.id) || [];
      const rankContribution = (pageRankMap.get(f.id) || 0) / (neighbors.length || 1);
      neighbors.forEach(targetId => {
        nextRank.set(targetId, (nextRank.get(targetId) || 0) + d * rankContribution);
      });
    });

    pageRankMap = nextRank;
  }

  // Betweenness Centrality (Simplified Shortest Paths)
  const betweennessMap = new Map<string, number>();
  files.forEach(f => betweennessMap.set(f.id, 0));

  files.forEach(f => {
    // BFS to calculate reachable paths
    const visited = new Set<string>([f.id]);
    const queue = [f.id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = adjacencyList.get(curr) || [];
      neighbors.forEach(n => {
        if (!visited.has(n)) {
          visited.add(n);
          betweennessMap.set(n, (betweennessMap.get(n) || 0) + 1);
          queue.push(n);
        }
      });
    }
  });

  // Normalize scores and calculate Criticality
  const scores: Record<string, FileScore> = {};
  const maxInDegree = Math.max(...Array.from(inDegreeMap.values()), 1);

  files.forEach(f => {
    const pr = pageRankMap.get(f.id) || 0;
    const bet = (betweennessMap.get(f.id) || 0) / Math.max(N * (N - 1), 1);
    const inDeg = inDegreeMap.get(f.id) || 0;
    const outDeg = outDegreeMap.get(f.id) || 0;

    // Criticality formula combines PageRank, In-Degree ratio, and Centrality
    const criticality = Math.min(
      Math.round((pr * 400) + (inDeg / maxInDegree * 40) + (bet * 20)),
      100
    );

    // Blast Radius estimation
    const blastRadius = Math.min(Math.round((inDeg * 15) + (pr * 300)), 100);

    // File Health Score (decreases with complexity, high nesting, lacking test)
    let health = 100;
    if (f.cyclomaticComplexity > 10) health -= (f.cyclomaticComplexity - 10) * 3;
    if (f.maxNestingDepth > 4) health -= (f.maxNestingDepth - 4) * 5;
    if (f.loc > 250) health -= Math.min(Math.round((f.loc - 250) / 10), 30);
    if (!f.hasTestFile && !f.path.includes('test')) health -= 15;
    health = Math.max(Math.min(health, 100), 10);

    scores[f.id] = {
      fileId: f.id,
      filePath: f.path,
      pageRank: Number(pr.toFixed(4)),
      betweennessCentrality: Number(bet.toFixed(4)),
      inDegree: inDeg,
      outDegree: outDeg,
      criticalityScore: criticality,
      blastRadiusScore: blastRadius,
      healthScore: health
    };
  });

  // Cycle Detection (Tarjan's SCC)
  const cycles: ImportCycle[] = [];
  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();

  function strongConnect(nodeId: string) {
    indices.set(nodeId, index);
    lowlink.set(nodeId, index);
    index++;
    stack.push(nodeId);
    onStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighborId of neighbors) {
      if (!indices.has(neighborId)) {
        strongConnect(neighborId);
        lowlink.set(nodeId, Math.min(lowlink.get(nodeId)!, lowlink.get(neighborId)!));
      } else if (onStack.has(neighborId)) {
        lowlink.set(nodeId, Math.min(lowlink.get(nodeId)!, indices.get(neighborId)!));
      }
    }

    if (lowlink.get(nodeId) === indices.get(nodeId)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== nodeId);

      if (scc.length > 1) {
        const filePaths = scc.map(id => fileMap.get(id)?.path || id);
        cycles.push({
          cycleId: `cycle_${cycles.length + 1}`,
          path: filePaths,
          fileIds: scc,
          length: scc.length
        });
      }
    }
  }

  files.forEach(f => {
    if (!indices.has(f.id)) {
      strongConnect(f.id);
    }
  });

  return { edges, scores, cycles };
}
