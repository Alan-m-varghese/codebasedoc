import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { GoogleGenAI } from '@google/genai';

// LangGraph State Annotation
export const CodebaseAgentState = Annotation.Root({
  query: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  taskType: Annotation<'audit' | 'chat' | 'refactor'>({
    reducer: (x, y) => y ?? x,
    default: () => 'chat',
  }),
  filesContext: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  repoMetadata: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
  retrievedSymbols: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  cycleAnalysis: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  riskAudit: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  stepLogs: Annotation<Array<{ node: string; timestamp: string; detail: string }>>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  finalOutput: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
});

export type CodebaseAgentStateType = typeof CodebaseAgentState.State;

// Robust Gemini Invoker using official @google/genai SDK with required User-Agent header
async function invokeGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Gemini API call with ${modelName} failed:`, err?.message || err);
      lastErr = err;
    }
  }

  // Fallback to LangChain ChatGoogleGenerativeAI if direct SDK call fails
  try {
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey,
      temperature: 0.2,
    });
    const messages = [];
    if (systemInstruction) {
      messages.push(new SystemMessage(systemInstruction));
    }
    messages.push(new HumanMessage(prompt));

    const response = await model.invoke(messages);
    const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    if (text && text.trim().length > 0) {
      return text;
    }
  } catch (err: any) {
    console.warn('LangChain ChatGoogleGenerativeAI fallback failed:', err?.message || err);
  }

  if (lastErr) {
    throw lastErr;
  }
  throw new Error('All Gemini model invocations returned empty response.');
}

// Select files relevant to user query for RAG context
function selectRelevantFilesContext(query: string, filesContext: any[]): any[] {
  if (!filesContext || filesContext.length === 0) return [];
  if (!query || query.trim().length === 0) return filesContext.slice(0, 10);

  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\W+/).filter((k) => k.length > 2);

  const scoredFiles = filesContext.map((f) => {
    let score = 0;
    const pathLower = (f.filePath || '').toLowerCase();
    const snippetLower = (f.contentSnippet || '').toLowerCase();
    const symbolNames = (f.symbols || []).map((s: any) => (s.name || '').toLowerCase()).join(' ');

    for (const kw of keywords) {
      if (pathLower.includes(kw)) score += 10;
      if (symbolNames.includes(kw)) score += 5;
      if (snippetLower.includes(kw)) score += 2;
    }

    return { file: f, score };
  });

  scoredFiles.sort((a, b) => b.score - a.score);
  return scoredFiles.map((sf) => sf.file).slice(0, 12);
}

// Node 1: Context Retriever
async function contextRetrieverNode(state: CodebaseAgentStateType) {
  const now = new Date().toLocaleTimeString();
  const relevantFiles = selectRelevantFilesContext(state.query, state.filesContext || []);

  const logs = [
    {
      node: 'context_retriever',
      timestamp: now,
      detail: `[LangChain Retriever] Indexed ${state.filesContext?.length || 0} files. Selected ${relevantFiles.length} top relevant modules for query "${state.query.substring(0, 40)}..."`,
    },
  ];

  const extractedSymbols = relevantFiles
    .flatMap((f) => (f.symbols || []).map((s: any) => `${f.filePath} -> ${s.name} (${s.kind})`))
    .slice(0, 30);

  return {
    retrievedSymbols: extractedSymbols,
    stepLogs: logs,
  };
}

// Node 2: Cycle & Import Analyzer
async function cycleAnalyzerNode(state: CodebaseAgentStateType) {
  const now = new Date().toLocaleTimeString();
  const cycles = state.repoMetadata?.cycles || [];

  const logs = [
    {
      node: 'cycle_analyzer',
      timestamp: now,
      detail: `[LangGraph Node] Evaluated ${cycles.length} circular dependency graph cycles in target repository.`,
    },
  ];

  if (cycles.length === 0) {
    return {
      cycleAnalysis: 'No circular dependencies detected in the import graph.',
      stepLogs: logs,
    };
  }

  const promptText = `Analyze these circular dependency cycles in the project:
${JSON.stringify(cycles, null, 2)}

Provide a concise 2-3 bullet refactoring strategy to break these dependency loops using dependency inversion, interface abstraction, or event messaging. Cite specific file paths.`;

  try {
    const analysisText = await invokeGemini(
      promptText,
      'You are a software architecture specialist focused on refactoring circular dependency graphs.'
    );

    return {
      cycleAnalysis: analysisText,
      stepLogs: logs,
    };
  } catch (err: any) {
    return {
      cycleAnalysis: `Circular dependency detected in ${cycles.length} loop(s): ${cycles.map((c: any) => c.path?.join(' ➔ ')).join('; ')}.`,
      stepLogs: logs,
    };
  }
}

// Node 3: Risk & Vulnerability Auditor
async function riskAuditorNode(state: CodebaseAgentStateType) {
  const now = new Date().toLocaleTimeString();
  const risks = state.repoMetadata?.risks || [];

  const logs = [
    {
      node: 'risk_auditor',
      timestamp: now,
      detail: `[LangChain Risk Auditor] Evaluated ${risks.length} static code analysis risk findings.`,
    },
  ];

  if (risks.length === 0) {
    return {
      riskAudit: 'No critical risk findings detected by static analysis.',
      stepLogs: logs,
    };
  }

  const promptText = `Review these code risks identified in the repository:
${JSON.stringify(risks.slice(0, 6), null, 2)}

Summarize the key security, complexity, and maintainability implications. Cite file paths.`;

  try {
    const auditText = await invokeGemini(
      promptText,
      'You are a code security auditor identifying architectural and maintainability risks.'
    );

    return {
      riskAudit: auditText,
      stepLogs: logs,
    };
  } catch (err: any) {
    return {
      riskAudit: `Evaluated ${risks.length} risk finding(s) including: ${risks.slice(0, 3).map((r: any) => `${r.title} in ${r.filePath}`).join(', ')}.`,
      stepLogs: logs,
    };
  }
}

// Node 4: Synthesis & Output Generation Node
async function synthesisNode(state: CodebaseAgentStateType) {
  const now = new Date().toLocaleTimeString();
  const logs = [
    {
      node: 'synthesizer',
      timestamp: now,
      detail: `[LangGraph Synthesizer] Compiling final state graph response with Gemini model.`,
    },
  ];

  const relevantFiles = selectRelevantFilesContext(state.query, state.filesContext || []);

  const filesSummaryText = relevantFiles
    .map((f) => {
      const symbolsList = (f.symbols || []).map((s: any) => `${s.name} (${s.kind})`).join(', ');
      return `--- File: ${f.filePath} (${f.language || 'code'}) ---
Exported Symbols: ${symbolsList || 'none'}
Code Snippet:
${(f.contentSnippet || '').substring(0, 1200)}`;
    })
    .join('\n\n');

  try {
    if (state.taskType === 'audit') {
      const prompt = `Repository Name: ${state.repoMetadata?.name || 'Repository'}
Total Files: ${state.repoMetadata?.totalFiles || 0} | Total LOC: ${state.repoMetadata?.totalLoc || 0}

Cycle Analysis:
${state.cycleAnalysis}

Risk Findings:
${state.riskAudit}

Key Source Modules Context:
${filesSummaryText}

Write an Executive Architecture & Health Audit Report in clean Markdown format. Include:
1. Executive Summary & Architectural Overview
2. Structural Debt & Circular Dependency Analysis
3. High Severity Risks & Vulnerabilities
4. Actionable Remediation Roadmap with specific file citations like [filePath]`;

      const output = await invokeGemini(
        prompt,
        'You are Codebase Doctor AI, a Senior Software Architect producing an Executive Codebase Health Report. Always cite specific files using [filePath] syntax.'
      );

      return {
        finalOutput: output,
        stepLogs: logs,
      };
    } else {
      // RAG Chat query or Refactor Query
      const prompt = `User Query: "${state.query}"

Indexed Repository Files & Code Context:
${filesSummaryText || 'No code snippet context available.'}

${state.cycleAnalysis ? `Dependency Cycles Info:\n${state.cycleAnalysis}\n` : ''}

INSTRUCTIONS:
1. Provide a direct, highly accurate answer addressing the user's specific query.
2. Refer directly to the code files, exported symbols, functions, or structures in the repository.
3. ALWAYS cite files using exact markdown citation syntax like [filePath:lineStart-lineEnd] or [filePath] whenever referencing code or files (e.g. [src/engine/blastRadius.ts:15-30]).
4. If asking where a feature is handled, name the exact file path and explain how the logic works.
5. Do NOT give generic boilerplate or irrelevant answers.`;

      const output = await invokeGemini(
        prompt,
        'You are Codebase Doctor AI, an expert AI software architect assisting with codebase analysis. Answer accurately using file citations like [filePath:lineStart-lineEnd].'
      );

      return {
        finalOutput: output,
        stepLogs: logs,
      };
    }
  } catch (err: any) {
    console.error('LangGraph Synthesis Error:', err);

    const errorMessage = err?.message || 'Gemini API call encountered an error.';
    return {
      finalOutput: `### Unable to complete AI synthesis
      
An error occurred while generating the AI response: **${errorMessage}**

Please check that your GEMINI_API_KEY is configured correctly in environment settings and try again.`,
      stepLogs: logs,
    };
  }
}

// Router Function to determine edge transition
function routeWorkflow(state: CodebaseAgentStateType) {
  if (state.taskType === 'audit') {
    return 'cycle_analyzer';
  }
  return 'synthesizer';
}

// Construct and compile the LangGraph workflow
export function createCodebaseLangGraph() {
  const workflow = new StateGraph(CodebaseAgentState)
    .addNode('context_retriever', contextRetrieverNode)
    .addNode('cycle_analyzer', cycleAnalyzerNode)
    .addNode('risk_auditor', riskAuditorNode)
    .addNode('synthesizer', synthesisNode)
    .addEdge(START, 'context_retriever')
    .addConditionalEdges('context_retriever', routeWorkflow, {
      cycle_analyzer: 'cycle_analyzer',
      synthesizer: 'synthesizer',
    })
    .addEdge('cycle_analyzer', 'risk_auditor')
    .addEdge('risk_auditor', 'synthesizer')
    .addEdge('synthesizer', END);

  return workflow.compile();
}

// Helper to run the graph and stream/return execution steps
export async function runLangGraphPipeline(params: {
  query: string;
  taskType: 'audit' | 'chat' | 'refactor';
  filesContext: any[];
  repoMetadata: any;
}) {
  const app = createCodebaseLangGraph();

  const initialState = {
    query: params.query,
    taskType: params.taskType,
    filesContext: params.filesContext || [],
    repoMetadata: params.repoMetadata || {},
    retrievedSymbols: [],
    cycleAnalysis: '',
    riskAudit: '',
    stepLogs: [],
    finalOutput: '',
  };

  const finalResult = await app.invoke(initialState);
  return finalResult;
}
