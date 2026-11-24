import React from 'react';
import {
  AlertTriangle,
  Bot,
  FileCode2,
  FileText,
  GitFork,
  LayoutDashboard,
  Workflow,
  Zap
} from 'lucide-react';

export type ViewTab = 'dashboard' | 'graph' | 'risks' | 'blast' | 'inspector' | 'chat' | 'langgraph' | 'report';

interface NavigationProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  riskCount: number;
  cycleCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  riskCount,
  cycleCount,
}) => {
  const tabs: { id: ViewTab; label: string; icon: React.FC<{ className?: string }>; badge?: number | string; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'graph', label: 'Dependency Graph', icon: GitFork, badge: cycleCount > 0 ? `${cycleCount} cycles` : undefined, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { id: 'risks', label: 'Risk Findings', icon: AlertTriangle, badge: riskCount > 0 ? riskCount : undefined, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { id: 'blast', label: 'Blast Radius', icon: Zap },
    { id: 'inspector', label: 'Code Inspector', icon: FileCode2 },
    { id: 'chat', label: 'Ask-AI Assistant', icon: Bot, badge: 'RAG', badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { id: 'langgraph', label: 'LangGraph Workflow', icon: Workflow, badge: 'LangChain', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { id: 'report', label: 'Executive Report', icon: FileText }
  ];

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/60 px-5 flex items-center space-x-1 overflow-x-auto scrollbar-none text-xs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              isActive
                ? 'border-indigo-500 text-indigo-400 bg-zinc-900/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono border font-semibold ${tab.badgeColor || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
