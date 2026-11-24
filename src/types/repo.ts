export type Language = 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'rust' | 'cpp' | 'unknown';

export interface SymbolItem {
  id: string;
  fileId: string;
  name: string;
  kind: 'function' | 'class' | 'interface' | 'method' | 'variable' | 'type' | 'import' | 'config';
  startLine: number;
  endLine: number;
  signature?: string;
  docstring?: string;
}

export interface FileItem {
  id: string;
  path: string;
  name: string;
  language: Language;
  loc: number;
  sizeBytes: number;
  content: string;
  symbols: SymbolItem[];
  imports: string[];
  cyclomaticComplexity: number;
  maxNestingDepth: number;
  hasTestFile: boolean;
  hasDocstring: boolean;
}

export interface DependencyEdge {
  id: string;
  sourceFileId: string;
  targetFileId: string;
  sourcePath: string;
  targetPath: string;
  type: 'import' | 'call' | 'inheritance';
  symbolsInvolved?: string[];
}

export interface ImportCycle {
  cycleId: string;
  path: string[]; // List of file paths involved in cycle
  fileIds: string[];
  length: number;
}

export interface FileScore {
  fileId: string;
  filePath: string;
  pageRank: number;            // 0 - 1 PageRank score
  betweennessCentrality: number; // 0 - 1 Centrality
  inDegree: number;             // How many rely on this
  outDegree: number;            // How many this relies on
  criticalityScore: number;     // 0 - 100 overall importance
  blastRadiusScore: number;     // 0 - 100 ripple effect impact
  healthScore: number;          // 0 - 100 code quality score
}

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RiskCategory = 'architecture' | 'maintainability' | 'testing' | 'complexity' | 'documentation';

export interface RiskFinding {
  id: string;
  fileId: string;
  filePath: string;
  symbolId?: string;
  rule: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  description: string;
  lineStart?: number;
  lineEnd?: number;
  evidenceSnippet?: string;
  suggestedFix?: string;
  llmReviewed?: boolean;
}

export interface BlastRadiusResult {
  targetFileId: string;
  targetPath: string;
  blastScore: number; // 0 - 100
  affectedFilesCount: number;
  totalDependents: number;
  directDependentsCount: number;
  transitiveDependentsCount: number;
  untestedDependentsCount: number;
  affectedFilePaths: string[];
  dependencyTree: {
    path: string;
    depth: number;
    hasTests: boolean;
    criticalityScore: number;
  }[];
}

export interface RepoManifest {
  id: string;
  name: string;
  description: string;
  source: 'sample' | 'custom_zip' | 'custom_git';
  files: FileItem[];
  edges: DependencyEdge[];
  scores: Record<string, FileScore>;
  cycles: ImportCycle[];
  risks: RiskFinding[];
  healthScore: number; // Overall repo health 0 - 100
  languageBreakdown: Record<string, number>; // language -> LOC
  totalLoc: number;
  totalFiles: number;
  lastScannedAt: string;
  aiArchitectureSummary?: string;
}

export interface Citation {
  filePath: string;
  startLine?: number;
  endLine?: number;
  symbolName?: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  timestamp: string;
  isLoading?: boolean;
}
