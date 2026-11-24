import { FileItem, Language, SymbolItem } from '../types/repo';

export function detectLanguage(path: string): Language {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'cpp':
    case 'hpp':
    case 'c':
    case 'h':
    case 'cc':
      return 'cpp';
    default:
      return 'unknown';
  }
}

export function shouldIgnoreFile(path: string): boolean {
  const ignoredPatterns = [
    'node_modules/',
    '.git/',
    'dist/',
    'build/',
    '__pycache__/',
    '.venv/',
    'vendor/',
    'coverage/',
    '.DS_Store',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'go.sum'
  ];
  return ignoredPatterns.some(pattern => path.includes(pattern));
}

export function calculateMetrics(content: string, language: Language) {
  const lines = content.split('\n');
  const loc = lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('#')).length;

  let cyclomaticComplexity = 1;
  let maxNestingDepth = 0;
  let currentIndent = 0;

  const decisionKeywords = [
    'if', 'else if', 'elif', 'for', 'while', 'case', 'catch', '&&', '||', '?', 'switch', 'except', 'try'
  ];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Estimate decision points for cyclomatic complexity
    decisionKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = trimmed.match(regex);
      if (matches) {
        cyclomaticComplexity += matches.length;
      }
    });

    // Estimate indentation nesting depth
    let leadingSpaces = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ' ') leadingSpaces++;
      else if (line[i] === '\t') leadingSpaces += 4;
      else break;
    }
    const depth = Math.floor(leadingSpaces / 2);
    if (depth > maxNestingDepth) {
      maxNestingDepth = depth;
    }
  });

  return {
    loc: Math.max(loc, 1),
    sizeBytes: new TextEncoder().encode(content).length,
    cyclomaticComplexity: Math.min(cyclomaticComplexity, 50),
    maxNestingDepth: Math.min(maxNestingDepth, 15)
  };
}

export function extractSymbolsAndImports(path: string, content: string, language: Language) {
  const fileId = path.replace(/[^a-zA-Z0-9_-]/g, '_');
  const symbols: SymbolItem[] = [];
  const imports: string[] = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Import parsing
    if (language === 'typescript' || language === 'javascript') {
      const importMatch = line.match(/import\s+(?:.*?\s+from\s+)?['"](.*?)['"]/);
      if (importMatch) {
        imports.push(importMatch[1]);
      }
      const requireMatch = line.match(/(?:const|let|var)\s+.*?\s*=\s*require\(['"](.*?)['"]\)/);
      if (requireMatch) {
        imports.push(requireMatch[1]);
      }

      // Function detection
      const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/);
      if (funcMatch) {
        symbols.push({
          id: `${fileId}_func_${funcMatch[1]}`,
          fileId,
          name: funcMatch[1],
          kind: 'function',
          startLine: lineNum,
          endLine: Math.min(lineNum + 20, lines.length),
          signature: trimmed
        });
      }

      // Class / Interface detection
      const classMatch = line.match(/(?:export\s+)?(?:class|interface|type)\s+([a-zA-Z0-9_$]+)/);
      if (classMatch) {
        symbols.push({
          id: `${fileId}_class_${classMatch[1]}`,
          fileId,
          name: classMatch[1],
          kind: line.includes('interface') ? 'interface' : 'class',
          startLine: lineNum,
          endLine: Math.min(lineNum + 30, lines.length),
          signature: trimmed
        });
      }
    } else if (language === 'python') {
      const pyImportMatch = line.match(/(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/);
      if (pyImportMatch) {
        imports.push(pyImportMatch[1] || pyImportMatch[2]);
      }

      const pyDefMatch = line.match(/^\s*(?:async\s+)?def\s+([a-zA-Z0-9_]+)/);
      if (pyDefMatch) {
        symbols.push({
          id: `${fileId}_def_${pyDefMatch[1]}`,
          fileId,
          name: pyDefMatch[1],
          kind: 'function',
          startLine: lineNum,
          endLine: Math.min(lineNum + 20, lines.length),
          signature: trimmed
        });
      }

      const pyClassMatch = line.match(/^\s*class\s+([a-zA-Z0-9_]+)/);
      if (pyClassMatch) {
        symbols.push({
          id: `${fileId}_class_${pyClassMatch[1]}`,
          fileId,
          name: pyClassMatch[1],
          kind: 'class',
          startLine: lineNum,
          endLine: Math.min(lineNum + 30, lines.length),
          signature: trimmed
        });
      }
    } else if (language === 'java' || language === 'cpp') {
      const javaImportMatch = line.match(/import\s+([a-zA-Z0-9_.]+);/);
      if (javaImportMatch) {
        imports.push(javaImportMatch[1]);
      }
      const javaClassMatch = line.match(/(?:public|private|protected)?\s*class\s+([a-zA-Z0-9_]+)/);
      if (javaClassMatch) {
        symbols.push({
          id: `${fileId}_class_${javaClassMatch[1]}`,
          fileId,
          name: javaClassMatch[1],
          kind: 'class',
          startLine: lineNum,
          endLine: Math.min(lineNum + 30, lines.length),
          signature: trimmed
        });
      }
    } else if (language === 'go') {
      const goImportMatch = line.match(/import\s+["'](.*?)["']/);
      if (goImportMatch) {
        imports.push(goImportMatch[1]);
      }
      const goFuncMatch = line.match(/func\s+([a-zA-Z0-9_]+)/);
      if (goFuncMatch) {
        symbols.push({
          id: `${fileId}_func_${goFuncMatch[1]}`,
          fileId,
          name: goFuncMatch[1],
          kind: 'function',
          startLine: lineNum,
          endLine: Math.min(lineNum + 20, lines.length),
          signature: trimmed
        });
      }
    }
  });

  return { symbols, imports };
}

export function parseFile(path: string, content: string): FileItem {
  const language = detectLanguage(path);
  const metrics = calculateMetrics(content, language);
  const { symbols, imports } = extractSymbolsAndImports(path, content, language);

  const fileName = path.split('/').pop() || path;
  const isTest = path.includes('.test.') || path.includes('_test') || path.includes('test_') || path.includes('/tests/');
  const hasDocstring = content.includes('/**') || content.includes('"""') || content.includes('//') || content.includes('#');

  return {
    id: path.replace(/[^a-zA-Z0-9_-]/g, '_'),
    path,
    name: fileName,
    language,
    loc: metrics.loc,
    sizeBytes: metrics.sizeBytes,
    content,
    symbols,
    imports,
    cyclomaticComplexity: metrics.cyclomaticComplexity,
    maxNestingDepth: metrics.maxNestingDepth,
    hasTestFile: isTest,
    hasDocstring
  };
}
