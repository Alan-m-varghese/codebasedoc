import { FileItem, FileScore, ImportCycle, RiskFinding } from '../types/repo';

export function runRiskHeuristics(
  files: FileItem[],
  scores: Record<string, FileScore>,
  cycles: ImportCycle[]
): RiskFinding[] {
  const risks: RiskFinding[] = [];

  // Check 1: Import Cycles (Architecture Severity: High/Critical)
  cycles.forEach(cycle => {
    cycle.fileIds.forEach(fileId => {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      risks.push({
        id: `risk_cycle_${fileId}_${cycle.cycleId}`,
        fileId,
        filePath: file.path,
        rule: 'ARCH_CIRCULAR_DEPENDENCY',
        category: 'architecture',
        severity: cycle.length > 3 ? 'critical' : 'high',
        title: 'Circular Dependency Detected',
        description: `File participates in a ${cycle.length}-node circular import cycle involving: ${cycle.path.slice(0, 3).join(' ➔ ')}${cycle.path.length > 3 ? '...' : ''}.`,
        suggestedFix: 'Extract shared interfaces or shared utility state into a neutral helper module to break the circular import.'
      });
    });
  });

  files.forEach(file => {
    const score = scores[file.id];

    // Check 2: High Cyclomatic Complexity
    if (file.cyclomaticComplexity >= 20) {
      risks.push({
        id: `risk_cc_crit_${file.id}`,
        fileId: file.id,
        filePath: file.path,
        rule: 'COMPLEXITY_EXTREME_CYCLOMATIC',
        category: 'complexity',
        severity: 'critical',
        title: 'Extreme Cyclomatic Complexity',
        description: `Cyclomatic complexity is ${file.cyclomaticComplexity} (threshold is 15). High density of branching logic makes testing and maintenance hazardous.`,
        suggestedFix: 'Refactor complex conditional branches into strategy patterns or extract sub-routines.'
      });
    } else if (file.cyclomaticComplexity >= 12) {
      risks.push({
        id: `risk_cc_high_${file.id}`,
        fileId: file.id,
        filePath: file.path,
        rule: 'COMPLEXITY_HIGH_BRANCHING',
        category: 'complexity',
        severity: 'medium',
        title: 'High Branching Complexity',
        description: `Cyclomatic complexity is ${file.cyclomaticComplexity}. Multiple nested decisions reduce code readability.`,
        suggestedFix: 'Decompose long methods into smaller single-responsibility functions.'
      });
    }

    // Check 3: Large File / God Object
    if (file.loc > 350) {
      risks.push({
        id: `risk_god_object_${file.id}`,
        fileId: file.id,
        filePath: file.path,
        rule: 'MAINT_GOD_FILE',
        category: 'maintainability',
        severity: 'high',
        title: 'Large File / Monolithic Module',
        description: `File contains ${file.loc} lines of code. Excessively large modules violate the Single Responsibility Principle.`,
        suggestedFix: 'Break down module into domain-specific subcomponents.'
      });
    }

    // Check 4: Deep Nesting Depth
    if (file.maxNestingDepth >= 5) {
      risks.push({
        id: `risk_nesting_${file.id}`,
        fileId: file.id,
        filePath: file.path,
        rule: 'COMPLEXITY_DEEP_NESTING',
        category: 'complexity',
        severity: 'medium',
        title: 'Deep Control Structure Nesting',
        description: `Maximum nesting depth is ${file.maxNestingDepth} levels deep. Hard to follow code execution path.`,
        suggestedFix: 'Use early returns or guard clauses to flatten nested logic.'
      });
    }

    // Check 5: Critical File Lacking Test Coverage
    if (score && score.criticalityScore >= 50 && !file.hasTestFile && !file.path.includes('test')) {
      risks.push({
        id: `risk_untested_crit_${file.id}`,
        fileId: file.id,
        filePath: file.path,
        rule: 'TEST_CRITICAL_UNTESTED',
        category: 'testing',
        severity: 'high',
        title: 'Critical Module Lacks Test Suite',
        description: `File has a high Criticality Score of ${score.criticalityScore}/100 and is heavily depended on, but has no detected test coverage.`,
        suggestedFix: `Create a dedicated test file (e.g. ${file.path.replace(/(\.[a-z]+)$/, '.test$1')}) with unit tests for core exported functions.`
      });
    }

    // Check 6: Missing Documentation on Exported Symbols
    if (file.symbols.length > 3 && !file.hasDocstring) {
      risks.push({
        id: `risk_doc_${file.id}`,
        fileId: file.id,
        filePath: file.path,
        rule: 'DOC_MISSING_EXPLANATION',
        category: 'documentation',
        severity: 'low',
        title: 'Undocumented API surface',
        description: `Module exports ${file.symbols.length} symbols but lacks JSDoc / Docstring comments explaining API behavior.`,
        suggestedFix: 'Add docstring comments describing input parameters, return values, and thrown exceptions.'
      });
    }
  });

  return risks;
}
