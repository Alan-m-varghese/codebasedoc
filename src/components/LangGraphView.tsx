import React, { useState } from 'react';
import { RepoManifest } from '../types/repo';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  GitCommit,
  Layers,
  Loader2,
  Play,
  Terminal,
  Workflow
} from 'lucide-react';

interface LangGraphViewProps {
  repo: RepoManifest;
}

interface StepLog {
  node: string;
  timestamp: string;
  detail: string;
}

export const LangGraphView: React.FC<LangGraphViewProps> = ({ repo }) => {
  const [taskType, setTaskType] = useState<'audit' | 'chat'>('audit');
  const [queryInput, setQueryInput] = useState('Analyze architecture modularity and circular dependency risks');
  const [isRunning, setIsRunning] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [stepLogs, setStepLogs] = useState<StepLog[]>([]);
  const [outputResult, setOutputResult] = useState<string>('');

  const nodesList = [
    { id: 'START', name: 'START', desc: 'Trigger StateGraph', color: 'text-zinc-600 bg-zinc-100 border-zinc-200' },
    { id: 'context_retriever', name: 'Context Retriever', desc: 'Index code symbols & imports', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
    { id: 'cycle_analyzer', name: 'Cycle Analyzer', desc: 'LangChain Graph DFS Evaluator', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'risk_auditor', name: 'Risk Auditor', desc: 'Code Debt & Complexity Node', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: 'synthesizer', name: 'Gemini Synthesizer', desc: 'ChatGoogleGenerativeAI Final Synthesis', color: 'text-[#0d5c3a] bg-emerald-50 border-emerald-200' },
    { id: 'END', name: 'END', desc: 'Return Final State', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
  ];

  const handleExecuteGraph = async () => {
    setIsRunning(true);
    setActiveNode('context_retriever');
    setStepLogs([
      {
        node: 'context_retriever',
        timestamp: new Date().toLocaleTimeString(),
        detail: `[LangGraph] Initialized Annotation.Root state with ${repo.files.length} indexed files.`,
      },
    ]);
    setOutputResult('');

    try {
      setTimeout(() => setActiveNode('cycle_analyzer'), 600);
      setTimeout(() => setActiveNode('risk_auditor'), 1200);
      setTimeout(() => setActiveNode('synthesizer'), 1800);

      const filesSummary = repo.files.map((f) => ({
        filePath: f.path,
        language: f.language,
        symbols: f.symbols.map((s) => ({ name: s.name, kind: s.kind })),
        contentSnippet: f.content.substring(0, 500),
      }));

      const res = await fetch('/api/langgraph-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryInput,
          taskType,
          filesContext: filesSummary,
          repoMetadata: {
            name: repo.name,
            totalFiles: repo.totalFiles,
            totalLoc: repo.totalLoc,
            cycles: repo.cycles,
            risks: repo.risks,
          },
        }),
      });

      const data = await res.json();
      setActiveNode('END');

      if (data.stepLogs) {
        setStepLogs(data.stepLogs);
      }
      if (data.result) {
        setOutputResult(data.result);
      }
    } catch (err: any) {
      console.error('LangGraph Execution Error:', err);
      setStepLogs((prev) => [
        ...prev,
        {
          node: 'error',
          timestamp: new Date().toLocaleTimeString(),
          detail: `Execution error: ${err.message}`,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans text-zinc-800">
      {/* Title & Banner */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Workflow className="w-6 h-6 text-[#0d5c3a]" />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">LangGraph Pipeline</h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-mono text-[10px] font-bold">
                  @langchain/langgraph
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-1">
                Stateful multi-agent codebase analysis orchestrated with LangGraph state transitions and Gemini bindings.
              </p>
            </div>
          </div>

          <button
            onClick={handleExecuteGraph}
            disabled={isRunning}
            className="flex items-center justify-center space-x-2 bg-[#0d5c3a] hover:bg-[#0a492e] disabled:opacity-50 text-white font-sans text-xs font-bold px-5 py-3 rounded-full shadow-sm transition shrink-0"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin text-emerald-200" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isRunning ? 'Executing Graph Nodes...' : 'Run StateGraph Workflow'}</span>
          </button>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">TASK TYPE</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as any)}
              className="w-full bg-zinc-50 border border-zinc-200 text-xs font-mono font-semibold text-zinc-800 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30"
            >
              <option value="audit">Architecture Audit Workflow</option>
              <option value="chat">RAG Chat Query Workflow</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">GRAPH QUERY / TASK PROMPT</label>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-800 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30"
            />
          </div>
        </div>
      </div>

      {/* Visual State Graph DAG */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-sm font-sans">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#0d5c3a]" />
            <h3 className="font-bold text-zinc-900 text-base">LangGraph Execution Topology (DAG)</h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Active Node: <strong className="text-[#0d5c3a] font-bold">{activeNode || 'Idle'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 py-2 font-mono">
          {nodesList.map((node) => {
            const isActive = activeNode === node.id;
            return (
              <div
                key={node.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${node.color} ${
                  isActive ? 'ring-2 ring-[#0d5c3a] scale-105 shadow-md' : 'opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{node.name}</span>
                  {isActive && <Activity className="w-3.5 h-3.5 animate-pulse text-[#0d5c3a]" />}
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 font-sans">{node.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Logs & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Log Stream */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 space-y-3 font-mono text-xs flex flex-col h-[380px] shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 font-sans">
            <div className="flex items-center space-x-2 text-zinc-900 font-bold">
              <Terminal className="w-4 h-4 text-[#0d5c3a]" />
              <span>LangGraph State Annotation Stream</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">{stepLogs.length} events logged</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {stepLogs.length > 0 ? (
              stepLogs.map((log, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="text-[#0d5c3a] font-bold uppercase">{log.node}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="text-zinc-800 text-[11px] leading-relaxed">{log.detail}</p>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-zinc-400 font-sans">
                Click "Run StateGraph Workflow" to observe live LangGraph execution steps.
              </div>
            )}
          </div>
        </div>

        {/* Synthesized Result */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 space-y-3 font-mono text-xs flex flex-col h-[380px] shadow-sm">
          <div className="flex items-center space-x-2 text-zinc-900 font-bold font-sans border-b border-zinc-100 pb-3">
            <Brain className="w-4 h-4 text-[#0d5c3a]" />
            <span>LangChain Model Output</span>
          </div>

          <div className="flex-1 overflow-y-auto text-zinc-800 leading-relaxed whitespace-pre-wrap p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
            {outputResult || (
              <span className="text-zinc-400 font-sans">
                Workflow output will appear here after state graph synthesis completes.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
