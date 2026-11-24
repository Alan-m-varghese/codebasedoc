import React, { useState } from 'react';
import { RepoManifest } from '../types/repo';
import {
  Bell,
  CheckCircle2,
  Mail,
  Search,
  ShieldCheck,
  User,
  X
} from 'lucide-react';

interface TopBarProps {
  currentRepo: RepoManifest | null;
  onSearchQuery?: (query: string) => void;
  onOpenReport?: () => void;
  onOpenUpload?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ currentRepo, onSearchQuery, onOpenReport, onOpenUpload }) => {
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMail, setShowMail] = useState(false);

  const healthScore = currentRepo?.healthScore ?? 100;
  const healthColor =
    healthScore >= 80
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
      : healthScore >= 60
      ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
      : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 font-sans">
      {/* Search Input Bar */}
      <div className="flex items-center space-x-3 w-80 md:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search file or symbol across repository..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              if (onSearchQuery) onSearchQuery(e.target.value);
            }}
            className="w-full bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 pl-10 pr-10 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 focus:border-[#0d5c3a] transition shadow-inner"
          />
          {searchValue ? (
            <button
              onClick={() => {
                setSearchValue('');
                if (onSearchQuery) onSearchQuery('');
              }}
              className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-200/60 rounded border border-zinc-300">
              ⌘F
            </span>
          )}
        </div>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center space-x-4 relative">
        {/* Code Health Badge */}
        {currentRepo ? (
          <button
            onClick={onOpenReport}
            className={`hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${healthColor}`}
            title="Click to view Executive Health Report"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Health {currentRepo.healthScore}/100</span>
          </button>
        ) : (
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-[#0d5c3a] bg-emerald-50 text-[#0d5c3a] text-xs font-bold transition cursor-pointer hover:bg-emerald-100"
          >
            <span>+ Upload Codebase</span>
          </button>
        )}

        {/* Mail Icon */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMail(!showMail);
              setShowNotifications(false);
            }}
            className="w-9 h-9 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-600 transition shadow-sm"
            title="Messages"
          >
            <Mail className="w-4 h-4" />
          </button>

          {showMail && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-zinc-200 shadow-xl p-4 z-50 text-xs space-y-2 font-sans animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="font-bold text-zinc-900">Audit Digest</span>
                <button onClick={() => setShowMail(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-zinc-600 leading-relaxed">
                {currentRepo ? (
                  <>Codebase Doctor completed static graph analysis for <strong>{currentRepo.name}</strong>. {currentRepo.risks.length} risk items flagged.</>
                ) : (
                  <>No active repository. Please upload your codebase (.zip) to begin AST analysis.</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Notification Bell Icon */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMail(false);
            }}
            className="w-9 h-9 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-600 transition shadow-sm"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-zinc-200 shadow-xl p-4 z-50 text-xs space-y-3 font-sans animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="font-bold text-zinc-900">Notifications ({currentRepo.cycles.length + currentRepo.risks.length})</span>
                <button onClick={() => setShowNotifications(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {currentRepo.cycles.length > 0 && (
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 font-mono text-[11px]">
                    ⚠️ Detected {currentRepo.cycles.length} circular dependency loop(s).
                  </div>
                )}
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px]">
                  ✅ AST indexing and PageRank computation complete.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center space-x-3 pl-2 border-l border-zinc-200">
          <div className="w-9 h-9 rounded-full bg-[#0d5c3a] text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
            AV
          </div>
          <div className="hidden lg:block text-left">
            <h4 className="text-xs font-bold text-zinc-900 leading-tight">Alan Varghese</h4>
            <p className="text-[11px] text-zinc-400 font-medium leading-none mt-0.5">alanmvarghese123@gmail.com</p>
          </div>
        </div>
      </div>
    </header>
  );
};
