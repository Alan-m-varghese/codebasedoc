import React, { useState } from 'react';
import { BlastRadiusResult, FileItem, RepoManifest } from '../types/repo';
import { computeBlastRadius } from '../engine/blastRadius';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  FileCode,
  Layers,
  ShieldAlert,
  Zap
} from 'lucide-react';

interface BlastRadiusViewProps {
  repo: RepoManifest;
  onSelectFile: (file: FileItem) => void;
}

export const BlastRadiusView: React.FC<BlastRadiusViewProps> = ({ repo, onSelectFile }) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(repo.files[0]?.id || '');

  const blastResult: BlastRadiusResult = computeBlastRadius(
    selectedFileId,
    repo.files,
    repo.edges,
    repo.scores
  );

  const selectedFile = repo.files.find((f) => f.id === selectedFileId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans text-zinc-800">
      {/* Title & Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Blast Radius</h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Simulate breaking API signature changes to evaluate transitive downstream impact across dependent modules.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-zinc-500">TARGET MODULE:</label>
          <select
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            className="bg-white border border-zinc-200 text-xs font-mono font-semibold text-zinc-800 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 shadow-sm min-w-[280px] cursor-pointer"
          >
            {repo.files.map((file) => {
              const score = repo.scores[file.id];
              return (
                <option key={file.id} value={file.id}>
                  {file.path} (Blast Score: {score ? score.blastRadiusScore : 0})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Blast Score */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between min-h-[130px]">
          <span className="text-xs font-semibold text-zinc-500">BLAST IMPACT SCORE</span>
          <div className="my-2 flex items-baseline space-x-2">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${blastResult.blastScore > 60 ? 'text-rose-600' : 'text-amber-600'}`}>
              {blastResult.blastScore}
            </span>
            <span className="text-xs text-zinc-400">/ 100</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${blastResult.blastScore > 60 ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${blastResult.blastScore}%` }}
            />
          </div>
        </div>

        {/* Total Dependent Modules */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between min-h-[130px]">
          <span className="text-xs font-semibold text-zinc-500">AFFECTED FILES</span>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-zinc-900">
              {blastResult.affectedFilesCount}
            </span>
            <span className="text-xs text-zinc-400">files</span>
          </div>
          <div className="text-[11px] font-medium text-zinc-500">
            {blastResult.directDependentsCount} direct, {blastResult.transitiveDependentsCount} transitive
          </div>
        </div>

        {/* Untested Impact Count */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between min-h-[130px]">
          <span className="text-xs font-semibold text-zinc-500">UNTESTED DEPENDENTS</span>
          <div className="my-2 flex items-baseline space-x-2">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${blastResult.untestedDependentsCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {blastResult.untestedDependentsCount}
            </span>
            <span className="text-xs text-zinc-400">lacking tests</span>
          </div>
          <div className="text-[11px] font-medium text-zinc-500">
            High risk of undetected breaking regression
          </div>
        </div>

        {/* Target LOC */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between min-h-[130px]">
          <span className="text-xs font-semibold text-zinc-500">TARGET VOLUME</span>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-[#0d5c3a]">
              {selectedFile ? selectedFile.loc : 0}
            </span>
            <span className="text-xs text-zinc-400 font-mono">LOC</span>
          </div>
          <div className="text-[11px] font-medium text-zinc-500">
            {selectedFile ? selectedFile.symbols.length : 0} exported symbols
          </div>
        </div>
      </div>

      {/* Downstream Dependency Tree */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-sm font-sans">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="font-bold text-zinc-900 text-base">Transitive Downstream Ripple Tree</h3>
          <span className="text-xs font-mono font-bold text-zinc-500">{blastResult.dependencyTree.length} Impacted Modules</span>
        </div>

        {blastResult.dependencyTree.length > 0 ? (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {blastResult.dependencyTree.map((item, idx) => {
              const file = repo.files.find((f) => f.path === item.path);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/70 hover:border-zinc-300 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-zinc-400 text-xs font-mono">
                      <span>Depth {item.depth}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-zinc-900 font-bold font-mono text-xs">{item.path}</span>
                    {!item.hasTests && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-mono font-bold">
                        NO TESTS
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-zinc-500 text-xs font-mono">
                      Criticality: <strong className="text-[#0d5c3a] font-bold">{item.criticalityScore}</strong>
                    </span>
                    {file && (
                      <button
                        onClick={() => onSelectFile(file)}
                        className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-full text-xs font-semibold shadow-sm transition"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-700">No downstream dependents detected for this module.</p>
            <p className="text-xs text-zinc-500">Changes here have minimal ripple impact on other files.</p>
          </div>
        )}
      </div>
    </div>
  );
};
