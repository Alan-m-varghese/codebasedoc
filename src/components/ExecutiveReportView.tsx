import React from 'react';
import { RepoManifest } from '../types/repo';
import { Download, FileText, Printer, ShieldCheck } from 'lucide-react';

interface ExecutiveReportViewProps {
  repo: RepoManifest;
  aiReport?: string;
}

export const ExecutiveReportView: React.FC<ExecutiveReportViewProps> = ({ repo, aiReport }) => {
  const handlePrint = () => {
    window.print();
  };

  const criticalRisks = repo.risks.filter((r) => r.severity === 'critical');
  const highRisks = repo.risks.filter((r) => r.severity === 'high');

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-zinc-800 bg-white font-sans border border-zinc-200/80 rounded-2xl my-6 shadow-sm print:border-none print:m-0 print:p-0 print:shadow-none">
      {/* Top Controls */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4 print:hidden">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-[#0d5c3a]" />
          <h2 className="text-base font-bold text-zinc-900">Executive Repository Health Report</h2>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 text-xs font-bold bg-[#0d5c3a] hover:bg-[#0a492e] text-white px-4 py-2.5 rounded-full transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Report Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">{repo.name}</h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              Audit Date: {new Date(repo.lastScannedAt).toLocaleDateString()} | Codebase Doctor Engine v2.4
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-zinc-400 block">HEALTH SCORE</span>
            <span className={`text-4xl font-extrabold font-mono ${repo.healthScore >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {repo.healthScore}/100
            </span>
          </div>
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed font-medium">{repo.description}</p>
      </div>

      {/* High Level Key Metrics Table */}
      <div className="grid grid-cols-4 gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-200/80 font-sans text-xs">
        <div>
          <span className="text-zinc-500 block font-semibold">TOTAL VOLUME</span>
          <span className="text-base font-extrabold text-zinc-900 font-mono">{repo.totalFiles} Files</span>
          <span className="text-zinc-500 text-[11px] block font-mono">{repo.totalLoc} LOC</span>
        </div>
        <div>
          <span className="text-zinc-500 block font-semibold">CIRCULAR LOOPS</span>
          <span className={`text-base font-extrabold font-mono ${repo.cycles.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {repo.cycles.length} Cycles
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block font-semibold">CRITICAL RISKS</span>
          <span className="text-base font-extrabold font-mono text-rose-700">{criticalRisks.length} Issues</span>
        </div>
        <div>
          <span className="text-zinc-500 block font-semibold">LANGUAGES</span>
          <span className="text-base font-extrabold font-mono text-[#0d5c3a]">{Object.keys(repo.languageBreakdown).length} Runtimes</span>
        </div>
      </div>

      {/* AI Architectural Summary */}
      <div className="space-y-3 border-t border-zinc-100 pt-6">
        <h3 className="text-base font-bold text-zinc-900">1. Architectural Diagnosis Overview</h3>
        <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-xs font-mono text-zinc-800 whitespace-pre-wrap leading-relaxed">
          {aiReport || repo.aiArchitectureSummary}
        </div>
      </div>

      {/* Critical Vulnerabilities & Risks */}
      <div className="space-y-3 border-t border-zinc-100 pt-6">
        <h3 className="text-base font-bold text-zinc-900">2. High Severity Findings & Bottlenecks</h3>
        <div className="space-y-2.5 font-mono text-xs">
          {repo.risks.slice(0, 6).map((risk) => (
            <div key={risk.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900">{risk.title}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] uppercase font-bold">
                  {risk.severity}
                </span>
              </div>
              <p className="text-zinc-500 text-[11px]">{risk.filePath}</p>
              <p className="text-zinc-700 font-sans">{risk.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Remediation Action Checklist */}
      <div className="space-y-3 border-t border-zinc-100 pt-6">
        <h3 className="text-base font-bold text-zinc-900">3. Remediation Roadmap Checklist</h3>
        <div className="space-y-2.5 text-xs font-sans text-zinc-700 font-medium">
          {repo.cycles.length > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60">
              <input type="checkbox" className="mt-0.5 rounded accent-[#0d5c3a]" />
              <span>
                <strong>Refactor Circular Dependencies:</strong> Break imports between {repo.cycles[0]?.path.join(' ➔ ')}
              </span>
            </div>
          )}
          {criticalRisks.length > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60">
              <input type="checkbox" className="mt-0.5 rounded accent-[#0d5c3a]" />
              <span>
                <strong>Decompose God Object:</strong> Reduce complexity in {criticalRisks[0]?.filePath}
              </span>
            </div>
          )}
          <div className="flex items-start space-x-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60">
            <input type="checkbox" className="mt-0.5 rounded accent-[#0d5c3a]" />
            <span>
              <strong>Add Unit Tests for Critical Core Modules:</strong> Ensure files with Criticality &gt; 50 have test suites.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
