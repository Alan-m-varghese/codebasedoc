import React, { useState } from 'react';
import { ChatMessage, FileItem, RepoManifest } from './types/repo';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ViewTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { DependencyGraphView } from './components/DependencyGraphView';
import { RiskMatrixView } from './components/RiskMatrixView';
import { BlastRadiusView } from './components/BlastRadiusView';
import { CodeInspectorView } from './components/CodeInspectorView';
import { CodebaseChatDrawer } from './components/CodebaseChatDrawer';
import { ExecutiveReportView } from './components/ExecutiveReportView';
import { LangGraphView } from './components/LangGraphView';
import { UploadModal } from './components/UploadModal';
import { EmptyWorkspaceLanding } from './components/EmptyWorkspaceLanding';

export default function App() {
  const [repos, setRepos] = useState<RepoManifest[]>([]);
  const [currentRepo, setCurrentRepo] = useState<RepoManifest | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [highlightLineRange, setHighlightLineRange] = useState<{ start?: number; end?: number } | undefined>(undefined);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // AI Architecture Audit State
  const [aiReport, setAiReport] = useState<string | undefined>(undefined);
  const [isAuditing, setIsAuditing] = useState(false);

  // Handle Switching Repos
  const handleSelectRepo = (repo: RepoManifest) => {
    setCurrentRepo(repo);
    setSelectedFile(repo.files[0] || null);
    setAiReport(undefined);
    setChatMessages([
      {
        id: `welcome_${repo.id}`,
        sender: 'assistant',
        text: `Loaded repository "${repo.name}". Indexing complete with ${repo.files.length} files. How can I help you analyze this codebase?`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Handle Custom Repo Upload
  const handleRepoUploaded = (newRepo: RepoManifest) => {
    setRepos((prev) => [newRepo, ...prev.filter((r) => r.id !== newRepo.id)]);
    handleSelectRepo(newRepo);
  };

  // Jump to specific file in Inspector
  const handleSelectFileToInspect = (file: FileItem, lineRange?: { start?: number; end?: number }) => {
    setSelectedFile(file);
    setHighlightLineRange(lineRange);
    setActiveTab('inspector');
  };

  // Jump to file by path string (e.g. from citation click)
  const handleOpenCitation = (filePath: string, lineStart?: number, lineEnd?: number) => {
    if (!currentRepo) return;
    const file = currentRepo.files.find(
      (f) => f.path === filePath || f.path.endsWith(filePath) || filePath.endsWith(f.path)
    );
    if (file) {
      handleSelectFileToInspect(file, { start: lineStart, end: lineEnd });
    }
  };

  // Trigger Gemini AI Architecture Audit
  const handleRunAiAudit = async () => {
    if (!currentRepo) return;
    setIsAuditing(true);
    try {
      const filesSummary = currentRepo.files.map((f) => ({
        path: f.path,
        loc: f.loc,
        language: f.language,
        criticality: currentRepo.scores[f.id]?.criticalityScore || 0,
        complexity: f.cyclomaticComplexity,
        hasTests: f.hasTestFile
      }));

      const res = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentRepo.name,
          totalFiles: currentRepo.totalFiles,
          totalLoc: currentRepo.totalLoc,
          filesSummary,
          cycles: currentRepo.cycles,
          risks: currentRepo.risks
        })
      });

      const data = await res.json();
      if (data.analysis) {
        setAiReport(data.analysis);
      }
    } catch (err) {
      console.error('Failed to run AI Audit:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Handle Chat Queries with Server-side Gemini AI
  const handleSendChatMessage = async (query: string) => {
    if (!currentRepo) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const filesContext = currentRepo.files.map((f) => ({
        filePath: f.path,
        language: f.language,
        symbols: f.symbols.map((s) => ({ name: s.name, kind: s.kind, startLine: s.startLine, endLine: s.endLine })),
        contentSnippet: f.content.substring(0, 1500)
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filesContext,
          history: chatMessages.slice(-4)
        })
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'Sorry, I could not generate an answer.',
        timestamp: new Date().toLocaleTimeString()
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat API Error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'Error communicating with AI service. Please try again.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-zinc-900 flex font-sans selection:bg-emerald-500/20 selection:text-emerald-900 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setHighlightLineRange(undefined);
        }}
        riskCount={currentRepo?.risks.length || 0}
        cycleCount={currentRepo?.cycles.length || 0}
        repos={repos}
        currentRepo={currentRepo}
        onSelectRepo={handleSelectRepo}
        onOpenUpload={() => setIsUploadOpen(true)}
        onRunAiAudit={handleRunAiAudit}
        isAuditing={isAuditing}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar Header */}
        <TopBar
          currentRepo={currentRepo}
          onSearchQuery={(q) => {
            if (q.trim() && currentRepo) {
              const matched = currentRepo.files.find((f) => f.path.toLowerCase().includes(q.toLowerCase()));
              if (matched) {
                setSelectedFile(matched);
                setActiveTab('inspector');
              }
            }
          }}
          onOpenReport={() => setActiveTab('report')}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto">
          {!currentRepo ? (
            <EmptyWorkspaceLanding onRepoUploaded={handleRepoUploaded} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  repo={currentRepo}
                  onSelectFile={(f) => handleSelectFileToInspect(f)}
                  onNavigateTab={setActiveTab}
                  onRunAiAudit={handleRunAiAudit}
                  isAuditing={isAuditing}
                  aiReport={aiReport}
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onOpenReport={() => setActiveTab('report')}
                />
              )}

              {activeTab === 'graph' && (
                <DependencyGraphView
                  repo={currentRepo}
                  onSelectFile={(f) => handleSelectFileToInspect(f)}
                />
              )}

              {activeTab === 'risks' && (
                <RiskMatrixView
                  repo={currentRepo}
                  onSelectFile={(f) => handleSelectFileToInspect(f)}
                />
              )}

              {activeTab === 'blast' && (
                <BlastRadiusView
                  repo={currentRepo}
                  onSelectFile={(f) => handleSelectFileToInspect(f)}
                />
              )}

              {activeTab === 'inspector' && (
                <CodeInspectorView
                  repo={currentRepo}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  highlightLineRange={highlightLineRange}
                  onAskInChat={(query) => {
                    handleSendChatMessage(query);
                    setActiveTab('chat');
                  }}
                />
              )}

              {activeTab === 'chat' && (
                <CodebaseChatDrawer
                  repo={currentRepo}
                  messages={chatMessages}
                  onSendMessage={handleSendChatMessage}
                  isLoading={isChatLoading}
                  onOpenCitation={handleOpenCitation}
                />
              )}

              {activeTab === 'langgraph' && (
                <LangGraphView repo={currentRepo} />
              )}

              {activeTab === 'report' && (
                <ExecutiveReportView repo={currentRepo} aiReport={aiReport} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Upload ZIP Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onRepoUploaded={handleRepoUploaded}
      />
    </div>
  );
}
