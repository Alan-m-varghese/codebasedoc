import React from 'react';
import { RepoManifest } from '../types/repo';
import { ViewTab } from './Navigation';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Download,
  FileCode2,
  FileText,
  FolderGit2,
  GitFork,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  SearchCode,
  Settings,
  ShieldAlert,
  Upload,
  Workflow,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  repos: RepoManifest[];
  currentRepo: RepoManifest | null;
  onSelectRepo: (repo: RepoManifest) => void;
  onOpenUpload: () => void;
  onRunAiAudit: () => void;
  isAuditing: boolean;
  riskCount: number;
  cycleCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  repos,
  currentRepo,
  onSelectRepo,
  onOpenUpload,
  onRunAiAudit,
  isAuditing,
  riskCount,
  cycleCount,
}) => {
  const menuItems: { id: ViewTab; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'graph', label: 'Dependency Graph', icon: GitFork, badge: cycleCount > 0 ? `${cycleCount}` : undefined },
    { id: 'risks', label: 'Risk Matrix', icon: ShieldAlert, badge: riskCount > 0 ? `${riskCount}` : undefined },
    { id: 'blast', label: 'Blast Radius', icon: Zap },
    { id: 'inspector', label: 'Code Inspector', icon: FileCode2 },
    { id: 'chat', label: 'Ask-AI Assistant', icon: MessageSquare, badge: 'RAG' },
    { id: 'langgraph', label: 'LangGraph Workflow', icon: Workflow, badge: 'Graph' },
    { id: 'report', label: 'Executive Report', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-30 font-sans select-none">
      <div className="p-5 space-y-6 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-[#0d5c3a] text-white flex items-center justify-center shadow-md shadow-[#0d5c3a]/20 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="font-extrabold text-zinc-900 text-lg tracking-tight leading-none">
              Codebase<span className="text-[#0d5c3a]">Doctor</span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">AST Architecture Engine</p>
          </div>
        </div>

        {/* Repository Selector Dropdown */}
        <div className="px-2">
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
            Active Repository
          </label>
          <div className="relative">
            <select
              value={currentRepo?.id || ''}
              onChange={(e) => {
                if (e.target.value === 'upload') {
                  onOpenUpload();
                } else {
                  const found = repos.find((r) => r.id === e.target.value);
                  if (found) onSelectRepo(found);
                }
              }}
              className="w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold py-2.5 pl-3 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 transition truncate"
            >
              {!currentRepo && <option value="">No Repository Selected</option>}
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.totalFiles} files)
                </option>
              ))}
              <option value="upload">+ Upload New (.zip)...</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* MENU Section */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 block mb-2">
            MENU
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-[#0d5c3a] text-white font-semibold shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-200 text-zinc-700 font-semibold'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* GENERAL Section */}
        <div className="space-y-1 pt-2 border-t border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 block mb-2">
            ACTIONS & DATA
          </span>

          <button
            onClick={onOpenUpload}
            className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <Upload className="w-4 h-4 text-zinc-500" />
            <span>Scan Custom (.zip)</span>
          </button>

          <button
            onClick={onRunAiAudit}
            disabled={isAuditing}
            className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition disabled:opacity-50"
          >
            <SearchCode className={`w-4 h-4 ${isAuditing ? 'animate-spin text-[#0d5c3a]' : 'text-[#0d5c3a]'}`} />
            <span>{isAuditing ? 'Auditing...' : 'Run Gemini Audit'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Promo Dark Green Card */}
      <div className="p-4">
        <div className="bg-[#0a472d] text-white p-4 rounded-2xl space-y-3 relative overflow-hidden shadow-md">
          {/* Subtle background graphic */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <span className="text-xs font-bold tracking-tight">AI Architecture Engine</span>
          </div>
          <p className="text-[11px] text-emerald-100/80 leading-snug">
            Stateful graph analysis with LangChain & LangGraph.
          </p>
          <button
            onClick={() => onTabChange('langgraph')}
            className="w-full py-2 bg-white text-[#0a472d] hover:bg-emerald-50 rounded-xl text-xs font-bold transition shadow-sm"
          >
            Open LangGraph DAG
          </button>
        </div>
      </div>
    </aside>
  );
};
