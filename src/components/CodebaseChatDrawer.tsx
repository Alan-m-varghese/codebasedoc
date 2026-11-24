import React, { useState } from 'react';
import { ChatMessage, Citation, FileItem, RepoManifest } from '../types/repo';
import { Send, User, ExternalLink, Code2, MessageSquareCode, Loader2 } from 'lucide-react';

interface CodebaseChatDrawerProps {
  repo: RepoManifest;
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onOpenCitation: (filePath: string, lineStart?: number, lineEnd?: number) => void;
}

export const CodebaseChatDrawer: React.FC<CodebaseChatDrawerProps> = ({
  repo,
  messages,
  onSendMessage,
  isLoading,
  onOpenCitation,
}) => {
  const [inputQuery, setInputQuery] = useState('');

  const promptShortcuts = [
    'Where is authentication & user login handled?',
    'Identify circular dependency loops in this repo',
    'Which modules have the highest Blast Radius risk?',
    'How does payment transaction processing work?'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const renderMessageWithCitations = (text: string) => {
    const citationRegex = /\[([a-zA-Z0-9_\-./]+)(?::(\d+)(?:-(\d+))?)?\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const filePath = match[1];
      const startLine = match[2] ? parseInt(match[2], 10) : undefined;
      const endLine = match[3] ? parseInt(match[3], 10) : startLine;

      parts.push(
        <button
          key={match.index}
          onClick={() => onOpenCitation(filePath, startLine, endLine)}
          className="inline-flex items-center space-x-1 font-mono text-[11px] bg-emerald-50 text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 my-0.5 transition cursor-pointer font-bold"
        >
          <Code2 className="w-3 h-3 text-[#0d5c3a]" />
          <span>{filePath}{startLine ? `:${startLine}${endLine && endLine !== startLine ? `-${endLine}` : ''}` : ''}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </button>
      );

      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 font-sans text-zinc-800">
      {/* Title & Banner */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <MessageSquareCode className="w-5 h-5 text-[#0d5c3a]" />
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Ask-the-Codebase RAG Assistant</h1>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-mono text-[10px] font-bold">
            Gemini 3.6 Flash
          </span>
        </div>
        <p className="text-xs text-zinc-500 font-medium">
          Query codebase architecture, symbol locations, and logic flows. Answers include clickable file:line citations that jump directly to code.
        </p>

        {/* Prompt Shortcuts */}
        <div className="pt-2 flex flex-wrap gap-2">
          {promptShortcuts.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(sc)}
              disabled={isLoading}
              className="text-xs font-mono font-medium bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-full border border-zinc-200 transition disabled:opacity-50"
            >
              "{sc}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 min-h-[420px] max-h-[500px] overflow-y-auto space-y-4 shadow-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 text-xs leading-relaxed ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0d5c3a] shrink-0 font-bold">
                <MessageSquareCode className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl max-w-2xl font-mono whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-[#0d5c3a] text-white rounded-br-none font-sans font-medium shadow-sm'
                  : 'bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-bl-none'
              }`}
            >
              {renderMessageWithCitations(msg.text)}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-700 shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3 text-xs text-[#0d5c3a] font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-[#0d5c3a]" />
            <span>Retrieving symbol context and querying Gemini...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <input
          type="text"
          placeholder="Ask anything about this repository structure, imports, or bugs..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 bg-white border border-zinc-200 text-xs font-sans text-zinc-900 px-5 py-3.5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0d5c3a]/30 shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="bg-[#0d5c3a] hover:bg-[#0a492e] text-white p-3.5 rounded-full transition shadow-sm disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
