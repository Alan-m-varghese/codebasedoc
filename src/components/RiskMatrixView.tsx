import React, { useState } from 'react';
import { FileItem, RepoManifest, RiskCategory, RiskFinding, RiskSeverity } from '../types/repo';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Filter,
  Info,
  ShieldAlert,
  Sparkles,
  Wrench,
  X
} from 'lucide-react';

interface RiskMatrixViewProps {
  repo: RepoManifest;
  onSelectFile: (file: FileItem) => void;
}

export const RiskMatrixView: React.FC<RiskMatrixViewProps> = ({ repo, onSelectFile }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [fixingRisk, setFixingRisk] = useState<RiskFinding | null>(null);
  const [aiFixResult, setAiFixResult] = useState<string | null>(null);
  const [isLoadingFix, setIsLoadingFix] = useState(false);

  const filteredRisks = repo.risks.filter((risk) => {
    if (selectedSeverity !== 'all' && risk.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && risk.category !== selectedCategory) return false;
    return true;
  });

  const handleRequestAiFix = async (risk: RiskFinding) => {
    setFixingRisk(risk);
    setAiFixResult(null);
    setIsLoadingFix(true);

    const targetFile = repo.files.find((f) => f.id === risk.fileId || f.path === risk.filePath);

    try {
      const res = await fetch('/api/suggest-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskFinding: risk,
          fileContent: targetFile ? targetFile.content : 'File content unavailable'
        })
      });
      const data = await res.json();
      setAiFixResult(data.suggestion || 'No fix returned');
    } catch (err) {
      setAiFixResult('Error connecting to AI Refactoring service.');
    } finally {
      setIsLoadingFix(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans text-zinc-800">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Risk Matrix</h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Detected {repo.risks.length} potential debt, complexity, and security bottlenecks across codebase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Selector */}
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="text-zinc-500">SEVERITY:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 font-mono text-xs cursor-pointer shadow-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Selector */}
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="text-zinc-500">CATEGORY:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 font-mono text-xs cursor-pointer shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="architecture">Architecture</option>
              <option value="complexity">Complexity</option>
              <option value="maintainability">Maintainability</option>
              <option value="testing">Testing</option>
              <option value="documentation">Documentation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRisks.map((risk) => {
          const targetFile = repo.files.find((f) => f.id === risk.fileId || f.path === risk.filePath);

          const severityBadge =
            risk.severity === 'critical'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : risk.severity === 'high'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : risk.severity === 'medium'
              ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
              : 'bg-zinc-100 text-zinc-700 border-zinc-200';

          return (
            <div
              key={risk.id}
              className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${severityBadge}`}>
                    {risk.severity}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">{risk.category}</span>
                </div>

                <h3 className="font-bold text-zinc-900 text-base leading-snug">{risk.title}</h3>

                <p className="text-xs font-mono text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/70 truncate" title={risk.filePath}>
                  {risk.filePath}
                </p>

                <p className="text-xs text-zinc-600 leading-relaxed font-sans">{risk.description}</p>

                {risk.suggestedFix && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-900 space-y-1 font-sans">
                    <span className="text-[10px] font-mono text-[#0d5c3a] uppercase font-bold">REFACTOR GUIDANCE:</span>
                    <p className="text-xs font-medium">{risk.suggestedFix}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                {targetFile && (
                  <button
                    onClick={() => onSelectFile(targetFile)}
                    className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3.5 py-2 rounded-full transition"
                  >
                    View Code
                  </button>
                )}

                <button
                  onClick={() => handleRequestAiFix(risk)}
                  className="text-xs font-bold bg-[#0d5c3a] hover:bg-[#0a492e] text-white px-4 py-2 rounded-full transition shadow-sm flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>AI Refactor Fix</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Refactor Modal */}
      {fixingRisk && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#0d5c3a]" />
                <h3 className="font-bold text-zinc-900 text-base">AI Refactoring Suggestion</h3>
              </div>
              <button
                onClick={() => setFixingRisk(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-mono text-zinc-500">
              Target File: <span className="text-zinc-900 font-bold">{fixingRisk.filePath}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed">
              {isLoadingFix ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
                  <p className="text-zinc-400 text-xs">Generating refactored code via Gemini...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{aiFixResult}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
