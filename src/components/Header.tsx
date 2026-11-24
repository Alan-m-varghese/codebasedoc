import React from 'react';
import { RepoManifest } from '../types/repo';
import { Activity, Code2, Download, FolderGit2, ShieldAlert, Sparkles, Upload } from 'lucide-react';

interface HeaderProps {
  repos: RepoManifest[];
  currentRepo: RepoManifest;
  onSelectRepo: (repo: RepoManifest) => void;
  onOpenUpload: () => void;
  onRunAiAudit: () => void;
  isAuditing: boolean;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  repos,
  currentRepo,
  onSelectRepo,
  onOpenUpload,
  onRunAiAudit,
  isAuditing,
  onOpenReport,
}) => {
  const healthColor =
    currentRepo.healthScore >= 80
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : currentRepo.healthScore >= 60
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur px-5 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Repo Picker */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-zinc-100 tracking-tight text-base">
                Codebase<span className="text-indigo-400 font-bold">Doctor</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                v2.4 AST
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Multi-Language Architecture & Risk Engine
            </p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-zinc-800 hidden md:block" />

        {/* Repository Switcher */}
        <div className="flex items-center space-x-2">
          <FolderGit2 className="w-4 h-4 text-zinc-400 hidden sm:block" />
          <select
            value={currentRepo.id}
            onChange={(e) => {
              const selected = repos.find((r) => r.id === e.target.value);
              if (selected) onSelectRepo(selected);
            }}
            className="bg-zinc-900 text-zinc-200 text-xs font-mono font-medium py-1.5 px-3 rounded-md border border-zinc-700/70 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.totalFiles} files, {r.totalLoc} LOC)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Health Score Pill */}
        <div className={`hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-mono font-medium ${healthColor}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Health Score: {currentRepo.healthScore}/100</span>
        </div>

        {/* AI Audit Button */}
        <button
          onClick={onRunAiAudit}
          disabled={isAuditing}
          className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-600/90 hover:bg-indigo-500 text-white transition border border-indigo-400/30 shadow-sm disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing...' : 'AI Arch Audit'}</span>
        </button>

        {/* Upload Custom Repo */}
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700"
        >
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Scan Custom Zip</span>
        </button>

        {/* Export Report */}
        <button
          onClick={onOpenReport}
          className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700"
          title="Export Health Report"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Report</span>
        </button>
      </div>
    </header>
  );
};
