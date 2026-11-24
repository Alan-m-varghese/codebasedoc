import React from 'react';
import { FileItem, RepoManifest } from '../types/repo';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Code2,
  Download,
  FileCode,
  FolderUp,
  GitFork,
  Layers,
  Plus,
  SearchCode,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  repo: RepoManifest;
  onSelectFile: (file: FileItem) => void;
  onNavigateTab: (tab: any) => void;
  onRunAiAudit: () => void;
  isAuditing: boolean;
  aiReport?: string;
  onOpenUpload?: () => void;
  onOpenReport?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  repo,
  onSelectFile,
  onNavigateTab,
  onRunAiAudit,
  isAuditing,
  aiReport,
  onOpenUpload,
  onOpenReport,
}) => {
  const sortedFiles = [...repo.files].sort((a, b) => {
    const scoreA = repo.scores[a.id]?.criticalityScore || 0;
    const scoreB = repo.scores[b.id]?.criticalityScore || 0;
    return scoreB - scoreA;
  });

  const criticalRisksCount = repo.risks.filter((r) => r.severity === 'critical').length;
  const highRisksCount = repo.risks.filter((r) => r.severity === 'high').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-zinc-800">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Plan, prioritize, and accomplish your code quality goals with ease.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenUpload}
            className="bg-[#0d5c3a] hover:bg-[#0a492e] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-sm flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Scan Repository</span>
          </button>

          <button
            onClick={onOpenReport}
            className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 text-xs font-semibold px-4 py-2.5 rounded-full shadow-sm flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Donezo-Inspired 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Solid Dark Green Card (Total Files) */}
        <div className="bg-[#0d5c3a] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100">Total Files</span>
            <button
              onClick={() => onNavigateTab('inspector')}
              className="w-8 h-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="my-2">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-white">{repo.totalFiles}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-100 bg-white/10 px-2.5 py-1 rounded-full w-fit border border-white/10">
            <span>Indexed across {Object.keys(repo.languageBreakdown).length} runtimes</span>
          </div>
        </div>

        {/* Card 2: Ended Projects / Import Cycles */}
        <div
          onClick={() => onNavigateTab('graph')}
          className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm hover:border-zinc-300 cursor-pointer transition flex flex-col justify-between min-h-[140px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600">Import Cycles</span>
            <div className="w-8 h-8 rounded-full border border-zinc-200 bg-zinc-50 group-hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${repo.cycles.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {repo.cycles.length}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full w-fit">
            <span>{repo.cycles.length > 0 ? 'Action required in graph' : 'Clean import graph'}</span>
          </div>
        </div>

        {/* Card 3: Running Projects / Total LOC Volume */}
        <div
          onClick={() => onNavigateTab('inspector')}
          className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm hover:border-zinc-300 cursor-pointer transition flex flex-col justify-between min-h-[140px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600">Total Code Volume</span>
            <div className="w-8 h-8 rounded-full border border-zinc-200 bg-zinc-50 group-hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-zinc-900">{repo.totalLoc}</span>
            <span className="text-xs text-zinc-400 font-mono">LOC</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full w-fit">
            <span>Avg {Math.round(repo.totalLoc / (repo.totalFiles || 1))} LOC/file</span>
          </div>
        </div>

        {/* Card 4: Pending Project / Risk Hotspots */}
        <div
          onClick={() => onNavigateTab('risks')}
          className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm hover:border-zinc-300 cursor-pointer transition flex flex-col justify-between min-h-[140px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600">Code Risk Findings</span>
            <div className="w-8 h-8 rounded-full border border-zinc-200 bg-zinc-50 group-hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-zinc-900">{repo.risks.length}</span>
            {criticalRisksCount > 0 && (
              <span className="text-xs font-bold text-rose-600 font-mono">({criticalRisksCount} critical)</span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit border border-amber-200">
            <span>{highRisksCount} high severity issues</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Top Critical Modules Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Top Critical Code Modules</h3>
              <p className="text-xs text-zinc-500 font-medium">Ranked by PageRank Centrality & In-Degree Connectivity</p>
            </div>
            <button
              onClick={() => onNavigateTab('graph')}
              className="text-xs text-[#0d5c3a] font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Explore Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 font-semibold">FILE PATH</th>
                  <th className="pb-3 font-semibold">LOC</th>
                  <th className="pb-3 font-semibold">CRITICALITY</th>
                  <th className="pb-3 font-semibold">BLAST RADIUS</th>
                  <th className="pb-3 font-semibold">HEALTH</th>
                  <th className="pb-3 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {sortedFiles.slice(0, 7).map((file) => {
                  const fScore = repo.scores[file.id];
                  const crit = fScore ? fScore.criticalityScore : 0;
                  const blast = fScore ? fScore.blastRadiusScore : 0;
                  const health = fScore ? fScore.healthScore : 100;

                  return (
                    <tr key={file.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3.5 pr-2 font-semibold text-zinc-900 font-mono max-w-[220px] truncate" title={file.path}>
                        {file.path}
                      </td>
                      <td className="py-3.5 text-zinc-500 font-mono">{file.loc}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono text-[11px]">
                          {crit}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full border font-mono text-[11px] ${blast > 60 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                          {blast}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold font-mono">
                        <span className={health >= 80 ? 'text-emerald-700' : health >= 60 ? 'text-amber-700' : 'text-rose-700'}>
                          {health}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => onSelectFile(file)}
                          className="text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1 rounded-full transition font-semibold text-[11px]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 col): AI Diagnosis & Language Distribution */}
        <div className="space-y-6">
          {/* AI Diagnosis Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-[#0d5c3a]" />
                <h3 className="font-bold text-zinc-900 text-sm">AI Architecture Audit</h3>
              </div>
              <button
                onClick={onRunAiAudit}
                disabled={isAuditing}
                className="text-xs bg-[#0d5c3a] hover:bg-[#0a492e] text-white font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-50"
              >
                {isAuditing ? 'Auditing...' : 'Run Audit'}
              </button>
            </div>

            {aiReport ? (
              <div className="text-xs text-zinc-700 space-y-2 max-h-72 overflow-y-auto pr-1 leading-relaxed border border-zinc-200 rounded-xl p-3.5 bg-zinc-50 font-mono">
                <div className="whitespace-pre-wrap">{aiReport}</div>
              </div>
            ) : (
              <div className="text-xs text-zinc-600 space-y-3 leading-relaxed">
                <p className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/70 font-sans text-xs">{repo.aiArchitectureSummary}</p>
                <button
                  onClick={onRunAiAudit}
                  disabled={isAuditing}
                  className="w-full py-2.5 bg-[#0d5c3a] hover:bg-[#0a492e] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
                >
                  <SearchCode className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Generate Gemini AI Diagnosis</span>
                </button>
              </div>
            )}
          </div>

          {/* Language Breakdown */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-3">
              Language Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(repo.languageBreakdown).map(([lang, rawLoc]) => {
                const loc = Number(rawLoc);
                const pct = Math.round((loc / (repo.totalLoc || 1)) * 100);
                return (
                  <div key={lang} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize text-zinc-800">{lang}</span>
                      <span className="text-zinc-500 font-mono">{loc} LOC ({pct}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0d5c3a] h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
