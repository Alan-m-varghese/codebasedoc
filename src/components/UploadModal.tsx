import React, { useState } from 'react';
import JSZip from 'jszip';
import { RepoManifest } from '../types/repo';
import { buildManifestFromRawFiles } from '../engine/sampleRepos';
import { shouldIgnoreFile } from '../engine/scanner';
import { FolderUp, Loader2, Upload, X } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoUploaded: (repo: RepoManifest) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onRepoUploaded }) => {
  const [repoName, setRepoName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
        if (['png', 'jpg', 'jpeg', 'gif', 'ico', 'pdf', 'exe', 'dll', 'so', 'zip', 'tar'].includes(ext)) {
          continue;
        }

        const content = await zipEntry.async('string');
        if (content.trim()) {
          rawFiles.push({ path: relativePath, content });
        }
      }

      if (rawFiles.length === 0) {
        setErrorMsg('No readable source code files found in zip archive.');
        setIsProcessing(false);
        return;
      }

      const name = repoName.trim() || file.name.replace(/\.zip$/i, '');
      const manifest = buildManifestFromRawFiles(
        name,
        `Custom repository imported from ${file.name}`,
        rawFiles,
        'custom_zip'
      );

      onRepoUploaded(manifest);
      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      console.error('Error unpacking zip file:', err);
      setErrorMsg('Failed to process zip file. Please check file format.');
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleZipFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2">
            <FolderUp className="w-5 h-5 text-[#0d5c3a]" />
            <h3 className="font-bold text-zinc-900 text-base">Scan Custom Repository (.zip)</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">REPOSITORY NAME (OPTIONAL)</label>
          <input
            type="text"
            placeholder="e.g. my-awesome-backend"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-800 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30"
          />
        </div>

        {/* Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-3 transition ${
            dragActive ? 'border-[#0d5c3a] bg-emerald-50/50' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
          }`}
        >
          <Upload className="w-8 h-8 text-[#0d5c3a] mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-800">Drag & Drop Repository .zip file here</p>
            <p className="text-[11px] text-zinc-500 font-medium">Supports TS, JS, Python, Java, Go, Rust, C++</p>
          </div>

          <label className="inline-block bg-[#0d5c3a] hover:bg-[#0a492e] text-white text-xs font-bold px-4 py-2.5 rounded-full cursor-pointer transition shadow-sm">
            <span>Browse File</span>
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
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 text-xs font-mono font-bold text-[#0d5c3a] py-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#0d5c3a]" />
            <span>Unpacking zip, building dependency graph & calculating PageRank...</span>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-mono text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
};
