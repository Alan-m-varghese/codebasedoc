import React, { useState } from 'react';
import JSZip from 'jszip';
import { RepoManifest } from '../types/repo';
import { buildManifestFromRawFiles, getSampleRepositories } from '../engine/sampleRepos';
import { shouldIgnoreFile } from '../engine/scanner';
import {
  Activity,
  Code2,
  Cpu,
  FileCode,
  FolderGit2,
  FolderUp,
  GitFork,
  Loader2,
  ShieldCheck,
  Upload,
  Workflow
} from 'lucide-react';

interface EmptyWorkspaceLandingProps {
  onRepoUploaded: (repo: RepoManifest) => void;
}

export const EmptyWorkspaceLanding: React.FC<EmptyWorkspaceLandingProps> = ({ onRepoUploaded }) => {
  const [repoName, setRepoName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleZipFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const rawFiles: { path: string; content: string }[] = [];

      for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
        if (zipEntry.dir || shouldIgnoreFile(relativePath)) continue;

        const ext = relativePath.split('.').pop()?.toLowerCase() || '';
        if (['png', 'jpg', 'jpeg', 'gif', 'ico', 'pdf', 'exe', 'dll', 'so', 'zip', 'tar', 'svg', 'woff', 'woff2', 'ttf'].includes(ext)) {
          continue;
        }

        const content = await zipEntry.async('string');
        if (content.trim()) {
          rawFiles.push({ path: relativePath, content });
        }
      }

      if (rawFiles.length === 0) {
        setErrorMsg('No readable source code files found in the ZIP archive.');
        setIsProcessing(false);
        return;
      }

      const name = repoName.trim() || file.name.replace(/\.zip$/i, '');
      const manifest = buildManifestFromRawFiles(
        name,
        `Uploaded repository from ${file.name}`,
        rawFiles,
        'custom_zip'
      );

      onRepoUploaded(manifest);
    } catch (err: any) {
      console.error('Error unpacking zip file:', err);
      setErrorMsg('Failed to process zip file. Please check file format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultipleFiles = async (fileList: FileList) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const rawFiles: { path: string; content: string }[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const relativePath = file.webkitRelativePath || file.name;

        if (shouldIgnoreFile(relativePath)) continue;

        const ext = relativePath.split('.').pop()?.toLowerCase() || '';
        if (['png', 'jpg', 'jpeg', 'gif', 'ico', 'pdf', 'exe', 'dll', 'so', 'zip', 'tar'].includes(ext)) {
          continue;
        }

        const text = await file.text();
        if (text.trim()) {
          rawFiles.push({ path: relativePath, content: text });
        }
      }

      if (rawFiles.length === 0) {
        setErrorMsg('No valid text/code files selected.');
        setIsProcessing(false);
        return;
      }

      const name = repoName.trim() || 'My Uploaded Project';
      const manifest = buildManifestFromRawFiles(
        name,
        `Uploaded codebase containing ${rawFiles.length} files`,
        rawFiles,
        'custom_zip'
      );

      onRepoUploaded(manifest);
    } catch (err: any) {
      console.error('Error parsing files:', err);
      setErrorMsg('Failed to read uploaded files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const firstFile = e.dataTransfer.files[0];
      if (firstFile.name.endsWith('.zip')) {
        handleZipFile(firstFile);
      } else {
        handleMultipleFiles(e.dataTransfer.files);
      }
    }
  };

  const handleLoadSample = () => {
    const samples = getSampleRepositories();
    if (samples.length > 0) {
      onRepoUploaded(samples[0]);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-3xl border border-zinc-200/90 shadow-xl p-8 md:p-12 space-y-8 relative overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0d5c3a]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0d5c3a] text-xs font-extrabold uppercase tracking-wide">
            <Activity className="w-4 h-4" />
            <span>Codebase Architecture Scanner</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
            Upload Your Codebase
          </h1>
          <p className="text-sm text-zinc-600 max-w-xl mx-auto leading-relaxed">
            Upload your project repository to map dependency graphs, detect circular import loops, analyze PageRank criticality scores, and run Gemini AI audits.
          </p>
        </div>

        {/* Optional Custom Name Field */}
        <div className="max-w-md mx-auto space-y-1.5 relative z-10">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Project / Repository Name (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. my-backend-service"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-800 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 focus:border-[#0d5c3a] transition shadow-inner"
          />
        </div>

        {/* Upload Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative z-10 border-2 border-dashed rounded-3xl p-10 text-center space-y-4 transition ${
            dragActive
              ? 'border-[#0d5c3a] bg-emerald-50/60 scale-[1.01]'
              : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/80 hover:bg-zinc-50'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#0d5c3a]/10 text-[#0d5c3a] flex items-center justify-center mx-auto shadow-sm">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">Drag & Drop Your Project (.zip) or Code Files</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Supports TypeScript, JavaScript, Python, Java, Go, Rust, C++, C#, HTML, CSS, JSON & more.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <label className="bg-[#0d5c3a] hover:bg-[#0a492e] text-white text-xs font-bold px-6 py-3 rounded-full cursor-pointer transition shadow-md flex items-center space-x-2">
              <FolderUp className="w-4 h-4" />
              <span>Select .zip Archive</span>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleZipFile(e.target.files[0]);
                  }
                }}
              />
            </label>

            <label className="bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold px-6 py-3 rounded-full cursor-pointer transition shadow-md flex items-center space-x-2">
              <FileCode className="w-4 h-4" />
              <span>Select Code Files</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleMultipleFiles(e.target.files);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="flex items-center justify-center space-x-3 text-xs font-mono font-bold text-[#0d5c3a] bg-emerald-50 border border-emerald-200 p-4 rounded-2xl animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-[#0d5c3a]" />
            <span>Parsing AST AST symbols, indexing modules, and generating graph topology...</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="text-xs font-mono text-rose-700 bg-rose-50 p-4 rounded-2xl border border-rose-200 text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Feature Grid Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 text-left relative z-10">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
            <div className="flex items-center space-x-2 text-[#0d5c3a] font-bold text-xs">
              <GitFork className="w-4 h-4" />
              <span>AST Graphing</span>
            </div>
            <p className="text-[11px] text-zinc-500">Maps function imports, module calls, and export dependencies.</p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
            <div className="flex items-center space-x-2 text-[#0d5c3a] font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>PageRank & Risks</span>
            </div>
            <p className="text-[11px] text-zinc-500">Computes centrality & detects circular import loops automatically.</p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
            <div className="flex items-center space-x-2 text-[#0d5c3a] font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>Gemini RAG</span>
            </div>
            <p className="text-[11px] text-zinc-500">Ask questions with precise file citations and code context.</p>
          </div>
        </div>

        {/* Secondary Sample Option */}
        <div className="text-center pt-2 relative z-10">
          <button
            onClick={handleLoadSample}
            className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-4 transition font-medium"
          >
            Want to test with a sample repository? Click here to load demo code.
          </button>
        </div>
      </div>
    </div>
  );
};
