import React, { useState, useMemo } from 'react';
import { DependencyEdge, FileItem, RepoManifest } from '../types/repo';
import {
  AlertCircle,
  Filter,
  GitFork,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  ShieldAlert,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface DependencyGraphViewProps {
  repo: RepoManifest;
  onSelectFile: (file: FileItem) => void;
}

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({ repo, onSelectFile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [showCyclesOnly, setShowCyclesOnly] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Compute Layout Positions for Nodes
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const count = repo.files.length;
    const radius = Math.max(220, count * 22);
    const centerX = 450;
    const centerY = 350;

    repo.files.forEach((file, index) => {
      const angle = (index / (count || 1)) * 2 * Math.PI;
      const r = radius + (index % 2 === 0 ? 30 : -20);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      map.set(file.id, { x, y });
    });

    return map;
  }, [repo.files]);

  // Set of node IDs in circular import cycles
  const cycleFileIds = useMemo(() => {
    const set = new Set<string>();
    repo.cycles.forEach((c) => c.fileIds.forEach((id) => set.add(id)));
    return set;
  }, [repo.cycles]);

  // Filtered Files
  const filteredFiles = useMemo(() => {
    return repo.files.filter((f) => {
      if (searchQuery && !f.path.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterLanguage !== 'all' && f.language !== filterLanguage) {
        return false;
      }
      if (showCyclesOnly && !cycleFileIds.has(f.id)) {
        return false;
      }
      return true;
    });
  }, [repo.files, searchQuery, filterLanguage, showCyclesOnly, cycleFileIds]);

  const filteredFileIds = useMemo(() => new Set(filteredFiles.map((f) => f.id)), [filteredFiles]);

  const activeNode = repo.files.find((f) => f.id === selectedNodeId);
  const activeScore = activeNode ? repo.scores[activeNode.id] : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans text-zinc-800">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Dependency Graph</h1>
        <p className="text-xs text-zinc-500 font-medium mt-1">
          Interactive AST import graph & circular dependency visualizer.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search file path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 font-mono w-52"
            />
          </div>

          {/* Language Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 font-mono cursor-pointer"
            >
              <option value="all">All Languages</option>
              {Object.keys(repo.languageBreakdown).map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Cycle Toggle */}
          <button
            onClick={() => setShowCyclesOnly(!showCyclesOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition flex items-center space-x-1.5 ${
              showCyclesOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-rose-600" />
            <span>Show Cycles Only ({repo.cycles.length})</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2 bg-zinc-50 p-1 rounded-xl border border-zinc-200">
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            className="p-1 hover:bg-zinc-200 text-zinc-700 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-zinc-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.0))}
            className="p-1 hover:bg-zinc-200 text-zinc-700 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-lg transition"
            title="Reset Zoom"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SVG Canvas Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200/80 p-2 relative overflow-hidden h-[600px] flex items-center justify-center shadow-sm">
          <svg
            className="w-full h-full cursor-grab active:cursor-grabbing"
            viewBox="0 0 900 700"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a1a1aa" />
              </marker>
              <marker
                id="arrow-cycle"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
              </marker>
            </defs>

            {/* Edges */}
            {repo.edges.map((edge) => {
              if (!filteredFileIds.has(edge.sourceFileId) || !filteredFileIds.has(edge.targetFileId)) {
                return null;
              }
              const sourcePos = nodePositions.get(edge.sourceFileId);
              const targetPos = nodePositions.get(edge.targetFileId);
              if (!sourcePos || !targetPos) return null;

              const isCycleEdge = cycleFileIds.has(edge.sourceFileId) && cycleFileIds.has(edge.targetFileId);
              const isSelectedEdge =
                selectedNodeId === edge.sourceFileId || selectedNodeId === edge.targetFileId;

              return (
                <line
                  key={edge.id}
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={isCycleEdge ? '#e11d48' : isSelectedEdge ? '#0d5c3a' : '#cbd5e1'}
                  strokeWidth={isCycleEdge ? 2 : isSelectedEdge ? 2.5 : 1}
                  strokeDasharray={isCycleEdge ? '4,4' : undefined}
                  markerEnd={isCycleEdge ? 'url(#arrow-cycle)' : 'url(#arrow)'}
                  opacity={isSelectedEdge ? 1 : 0.7}
                />
              );
            })}

            {/* Nodes */}
            {filteredFiles.map((file) => {
              const pos = nodePositions.get(file.id);
              if (!pos) return null;

              const isSelected = selectedNodeId === file.id;
              const isCycle = cycleFileIds.has(file.id);
              const score = repo.scores[file.id];
              const criticality = score ? score.criticalityScore : 10;

              const nodeRadius = Math.max(14, Math.min(28, 14 + criticality / 5));

              let fillColor = '#0d5c3a';
              if (file.language === 'typescript') fillColor = '#2563eb';
              else if (file.language === 'python') fillColor = '#d97706';
              else if (file.language === 'go') fillColor = '#0891b2';
              else if (file.language === 'java') fillColor = '#ea580c';

              return (
                <g
                  key={file.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNodeId(file.id)}
                  className="cursor-pointer transition hover:opacity-90"
                >
                  {(isSelected || isCycle) && (
                    <circle
                      r={nodeRadius + 6}
                      fill="none"
                      stroke={isCycle ? '#e11d48' : '#0d5c3a'}
                      strokeWidth="2.5"
                      className={isCycle ? 'animate-pulse' : ''}
                    />
                  )}

                  <circle
                    r={nodeRadius}
                    fill={fillColor}
                    stroke={isSelected ? '#18181b' : '#ffffff'}
                    strokeWidth="2"
                  />

                  <text
                    y={nodeRadius + 14}
                    textAnchor="middle"
                    fill="#27272a"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none select-none"
                  >
                    {file.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Node Inspector Drawer */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 space-y-4 font-mono text-xs shadow-sm flex flex-col justify-between">
          {activeNode && activeScore ? (
            <div className="space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">SELECTED NODE</span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold capitalize">
                    {activeNode.language}
                  </span>
                </div>
                <h4 className="font-bold text-zinc-900 text-sm mt-1 truncate" title={activeNode.path}>
                  {activeNode.name}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{activeNode.path}</p>
              </div>

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-500 text-[10px] font-semibold">CRITICALITY</span>
                  <p className="font-extrabold text-[#0d5c3a] text-base">{activeScore.criticalityScore}/100</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] font-semibold">BLAST RADIUS</span>
                  <p className="font-extrabold text-rose-600 text-base">{activeScore.blastRadiusScore}/100</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] font-semibold">IN-DEGREE</span>
                  <p className="text-zinc-800 font-bold">{activeScore.inDegree} incoming</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] font-semibold">OUT-DEGREE</span>
                  <p className="text-zinc-800 font-bold">{activeScore.outDegree} outgoing</p>
                </div>
              </div>

              {cycleFileIds.has(activeNode.id) && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Circular Dependency Loop</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed font-sans">
                    This file participates in a circular import chain. Refactor shared state out of this file.
                  </p>
                </div>
              )}

              <button
                onClick={() => onSelectFile(activeNode)}
                className="w-full py-2.5 bg-[#0d5c3a] hover:bg-[#0a492e] text-white font-sans font-bold text-xs rounded-xl transition shadow-sm"
              >
                Inspect Source Code
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 space-y-2 py-12">
              <GitFork className="w-8 h-8 text-zinc-300" />
              <p className="text-xs font-sans text-zinc-500">Click on any node in the canvas to view detailed metrics and dependencies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
