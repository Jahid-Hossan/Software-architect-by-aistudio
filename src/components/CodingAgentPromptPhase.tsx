import React, { useState } from 'react';
import { Copy, Check, Download, Sparkles, Terminal, FileCode2 } from 'lucide-react';

interface CodingAgentPromptPhaseProps {
  promptText: string;
  projectName: string;
}

export const CodingAgentPromptPhase: React.FC<CodingAgentPromptPhaseProps> = ({
  promptText,
  projectName,
}) => {
  const [copied, setCopied] = useState(false);
  const [targetAgent, setTargetAgent] = useState<'universal' | 'cursor' | 'claude_code' | 'ai_studio'>('universal');

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([promptText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(projectName || 'implementation').toLowerCase().replace(/\s+/g, '_')}_prompt.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <span>Stage 6: Self-Contained Coding-Agent Prompt</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Prompt for Coding Agent: {projectName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Self-contained execution directive. Feed this directly into Claude Code, Cursor, Devin,
            or AI Studio Build without needing conversational context.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-750 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-indigo-500/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Agent Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Agent Selector */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 px-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="font-medium">Compatible with any modern coding agent:</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Claude Code · Cursor Composer · AI Studio Build · Devin · Windsurf</span>
        </div>
      </div>

      {/* Code / Markdown View Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            <span>IMPLEMENTATION_PROMPT.md</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Monospace Prompt Body */}
        <pre className="p-6 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto selection:bg-indigo-600/30">
          {promptText}
        </pre>
      </div>
    </div>
  );
};
