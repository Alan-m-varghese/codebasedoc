import { BlastRadiusResult, DependencyEdge, FileItem, FileScore } from '../types/repo';

export function computeBlastRadius(
  targetFileId: string,
  files: FileItem[],
  edges: DependencyEdge[],
  scores: Record<string, FileScore>
): BlastRadiusResult {
  const targetFile = files.find(f => f.id === targetFileId || f.path === targetFileId);
  if (!targetFile) {
    return {
      targetFileId,
      targetPath: targetFileId,
      blastScore: 0,
      affectedFilesCount: 0,
      totalDependents: 0,
      directDependentsCount: 0,
      transitiveDependentsCount: 0,
      untestedDependentsCount: 0,
      affectedFilePaths: [],
      dependencyTree: []
    };
  }

  // Build reverse adjacency list (target <- source, who depends on target)
  const dependentsMap = new Map<string, string[]>();
  files.forEach(f => dependentsMap.set(f.id, []));

  edges.forEach(e => {
    // e.sourceFileId depends on e.targetFileId
    // so if targetFileId changes, e.sourceFileId is affected!
    const list = dependentsMap.get(e.targetFileId) || [];
    if (!list.includes(e.sourceFileId)) {
      list.push(e.sourceFileId);
      dependentsMap.set(e.targetFileId, list);
    }
  });

  const visited = new Map<string, number>(); // fileId -> depth
  const directDependents = dependentsMap.get(targetFile.id) || [];
  
  // BFS traversal to collect all transitive dependents
  const queue: { id: string; depth: number }[] = [];
  directDependents.forEach(depId => {
    queue.push({ id: depId, depth: 1 });
    visited.set(depId, 1);
  });

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const nextDependents = dependentsMap.get(id) || [];

    for (const nextId of nextDependents) {
      if (!visited.has(nextId) && nextId !== targetFile.id) {
        visited.set(nextId, depth + 1);
        queue.push({ id: nextId, depth: depth + 1 });
      }
    }
  }

  const affectedFilesCount = visited.size;
  const directCount = directDependents.length;
  const transitiveCount = Math.max(0, affectedFilesCount - directCount);

  let untestedCount = 0;
  const affectedFilePaths: string[] = [];
  const dependencyTree: { path: string; depth: number; hasTests: boolean; criticalityScore: number }[] = [];

  visited.forEach((depth, fileId) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      affectedFilePaths.push(file.path);
      if (!file.hasTestFile) untestedCount++;

      const fScore = scores[file.id];
      dependencyTree.push({
        path: file.path,
        depth,
        hasTests: file.hasTestFile,
        criticalityScore: fScore ? fScore.criticalityScore : 10
      });
    }
  });

  // Sort dependency tree by depth then criticality
  dependencyTree.sort((a, b) => a.depth - b.depth || b.criticalityScore - a.criticalityScore);

  // Calculate Blast Score (0 - 100)
  const targetScore = scores[targetFile.id];
  const baseScore = targetScore ? targetScore.blastRadiusScore : 20;
  const blastScore = Math.min(
    Math.round(baseScore + (affectedFilesCount * 8) + (untestedCount * 10)),
    100
  );

  return {
    targetFileId: targetFile.id,
    targetPath: targetFile.path,
    blastScore,
    affectedFilesCount,
    totalDependents: affectedFilesCount,
    directDependentsCount: directCount,
    transitiveDependentsCount: transitiveCount,
    untestedDependentsCount: untestedCount,
    affectedFilePaths,
    dependencyTree
  };
}
