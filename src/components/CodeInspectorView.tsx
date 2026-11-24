import React, { useState } from 'react';
import { FileItem, RepoManifest, SymbolItem } from '../types/repo';
import {
  Brain,
  Code2,
  FileCode,
  FileSearch,
  FolderTree,
  Hash,
  Layers,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Terminal,
  X
} from 'lucide-react';

interface CodeInspectorViewProps {
  repo: RepoManifest;
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  highlightLineRange?: { start?: number; end?: number };
  onAskInChat?: (prompt: string) => void;
}

export const CodeInspectorView: React.FC<CodeInspectorViewProps> = ({
  repo,
  selectedFile,
  onSelectFile,
  highlightLineRange,
  onAskInChat,
}) => {
  const [fileSearch, setFileSearch] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showExplanationCard, setShowExplanationCard] = useState(false);

  const currentFile = selectedFile || repo.files[0];
  const currentScore = currentFile ? repo.scores[currentFile.id] : null;

  const filteredFiles = repo.files.filter((f) =>
    f.path.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const lines = currentFile ? currentFile.content.split('\n') : [];

  const handleExplainCode = async () => {
    if (!currentFile) return;
    setIsExplaining(true);
    setShowExplanationCard(true);
    setExplanation(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Provide a clear structural and functional summary of file "${currentFile.path}". Explain its core responsibility, main exports, key dependencies, and complexity.`,
          filesContext: [
            {
              filePath: currentFile.path,
              language: currentFile.language,
              symbols: currentFile.symbols.map((s) => ({ name: s.name, kind: s.kind })),
              contentSnippet: currentFile.content.substring(0, 2000),
            },
          ],
        }),
      });

      const data = await res.json();
      setExplanation(data.answer || 'Unable to generate code explanation.');
    } catch (err) {
      console.error('Failed to explain code:', err);
      setExplanation('Error contacting AI service to generate code explanation.');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans text-zinc-800">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Code Inspector</h1>
        <p className="text-xs text-zinc-500 font-medium mt-1">
          Deep source viewer with symbol extraction, line highlighting, and AI file analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[720px]">
        {/* Left File & Symbol Explorer */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 flex flex-col space-y-4 font-mono text-xs overflow-hidden shadow-sm">
          <div className="flex items-center space-x-2 text-zinc-900 font-bold font-sans border-b border-zinc-100 pb-3">
            <FolderTree className="w-4 h-4 text-[#0d5c3a]" />
            <span>Repository Explorer</span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30"
            />
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 border-b border-zinc-100 pb-3">
            {filteredFiles.map((file) => {
              const isSelected = currentFile?.id === file.id;
              return (
                <button
                  key={file.id}
                  onClick={() => {
                    onSelectFile(file);
                    setShowExplanationCard(false);
                    setExplanation(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition truncate flex items-center justify-between font-mono ${
                    isSelected
                      ? 'bg-[#0d5c3a] text-white font-bold shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                  title={file.path}
                >
                  <span className="truncate">{file.path}</span>
                  <span className={`text-[10px] ml-1 ${isSelected ? 'text-emerald-100' : 'text-zinc-400'}`}>{file.loc}L</span>
                </button>
              );
            })}
          </div>

          {/* Symbol Outline */}
          {currentFile && (
            <div className="space-y-1.5 overflow-y-auto max-h-48 pt-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider font-sans">
                EXPORTS & SYMBOLS ({currentFile.symbols.length})
              </span>
              {currentFile.symbols.length > 0 ? (
                currentFile.symbols.map((sym) => (
                  <div
                    key={sym.id}
                    className="flex items-center justify-between text-[11px] text-zinc-600 hover:text-zinc-900 p-1.5 rounded-lg hover:bg-zinc-50 font-mono"
                  >
                    <span className="truncate">{sym.name}</span>
                    <span className="text-[10px] text-[#0d5c3a] bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase font-bold border border-emerald-200">
                      {sym.kind}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-zinc-400 font-sans">No top-level exports detected</p>
              )}
            </div>
          )}
        </div>

        {/* Right Code Viewer & Metrics */}
        <div className="lg:col-span-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden relative shadow-md">
          {/* Header Bar */}
          {currentFile && (
            <div className="bg-zinc-900 px-5 py-3.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-zinc-100">{currentFile.path}</span>
                <span className="text-zinc-400">({currentFile.loc} lines, {currentFile.language})</span>
              </div>

              <div className="flex items-center space-x-4 text-[11px]">
                <span className="text-zinc-400">
                  Complexity: <strong className="text-amber-400">{currentFile.cyclomaticComplexity}</strong>
                </span>
                <span className="text-zinc-400">
                  Criticality: <strong className="text-emerald-400">{currentScore ? currentScore.criticalityScore : 0}</strong>
                </span>
                <span className="text-zinc-400">
                  Health: <strong className="text-emerald-400">{currentScore ? currentScore.healthScore : 100}%</strong>
                </span>
              </div>
            </div>
          )}

          {/* Main Monospace Code Box */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-300 leading-relaxed bg-zinc-950 select-text relative">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted =
                highlightLineRange &&
                highlightLineRange.start &&
                highlightLineRange.end &&
                lineNum >= highlightLineRange.start &&
                lineNum <= highlightLineRange.end;

              return (
                <div
                  key={idx}
                  className={`flex space-x-4 px-2 py-0.5 rounded ${
                    isHighlighted ? 'bg-emerald-500/20 border-l-2 border-emerald-400 text-emerald-200' : 'hover:bg-zinc-900/60'
                  }`}
                >
                  <span className="w-10 text-right text-zinc-600 select-none">{lineNum}</span>
                  <span className="whitespace-pre flex-1">{line}</span>
                </div>
              );
            })}
          </div>

          {/* Floating 'Explain Code' Button */}
          {currentFile && (
            <div className="absolute bottom-5 right-6 z-20">
              <button
                onClick={handleExplainCode}
                disabled={isExplaining}
                className="flex items-center space-x-2 bg-[#0d5c3a] hover:bg-[#0a492e] text-white font-sans text-xs px-5 py-3 rounded-full shadow-2xl border border-emerald-400/30 transition-all hover:scale-105 disabled:opacity-50"
              >
                {isExplaining ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                ) : (
                  <FileSearch className="w-4 h-4 text-emerald-200" />
                )}
                <span className="font-bold">{isExplaining ? 'Analyzing Code...' : 'Explain Code'}</span>
              </button>
            </div>
          )}

          {/* AI Explanation Card Overlay */}
          {showExplanationCard && currentFile && (
            <div className="absolute inset-x-4 bottom-4 z-30 bg-zinc-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-4 shadow-2xl space-y-3 font-mono text-xs animate-in slide-in-from-bottom-4 duration-200 max-h-[280px] flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold font-sans">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span>AI Code Summary: {currentFile.path}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {onAskInChat && explanation && (
                    <button
                      onClick={() =>
                        onAskInChat(
                          `Can you give me a deeper explanation and refactoring suggestions for ${currentFile.path}?`
                        )
                      }
                      className="flex items-center space-x-1.5 text-[11px] bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/40 transition font-sans font-semibold"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Ask in Chat</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowExplanationCard(false)}
                    className="text-zinc-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap pr-1">
                {isExplaining ? (
                  <div className="flex items-center space-x-2 text-emerald-400 py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini is generating functionality summary...</span>
                  </div>
                ) : (
                  explanation
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
