import React from 'react';
import { Layers, Database, FileText, Download, RotateCcw, Sparkles } from 'lucide-react';
import { ProjectState } from '../types/architect';
import { SAMPLE_PROJECTS } from '../services/templates';

interface HeaderProps {
  project: ProjectState;
  onSelectSample: (sample: typeof SAMPLE_PROJECTS[0]) => void;
  onReset: () => void;
  onToggleMemoryDrawer: () => void;
  isMemoryOpen: boolean;
  onExportJson: () => void;
  onExportMarkdown: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onSelectSample,
  onReset,
  onToggleMemoryDrawer,
  isMemoryOpen,
  onExportJson,
  onExportMarkdown,
}) => {
  const memoryCount =
    (project?.memory?.userDecisions?.length || 0) +
    (project?.memory?.recommendations?.length || 0) +
    (project?.memory?.assumptions?.length || 0) +
    (project?.memory?.exclusions?.length || 0);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Project Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                Software Research & Planning Architect
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">
                {project.review.isConfirmed ? 'v1.0 Confirmed' : 'Draft Spec'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {project.name || 'Untitled Software Idea'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sample Templates Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700 transition-colors"
              title="Load researched software archetypes"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Templates</span>
            </button>
            <div className="absolute right-0 mt-1 w-64 py-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-slate-800">
                Researched Archetypes
              </div>
              {SAMPLE_PROJECTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSample(sample)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="font-medium text-slate-200">{sample.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{sample.initialIdea}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Project Memory Drawer Trigger */}
          <button
            onClick={onToggleMemoryDrawer}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              isMemoryOpen
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Inspect living Project Memory (Decisions, Assumptions, Exclusions)"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Project Memory</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-700 text-slate-300">
              {memoryCount}
            </span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Export Spec or Coding Prompt"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 py-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <button
                onClick={onExportMarkdown}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Prompt (.md)</span>
              </button>
              <button
                onClick={onExportJson}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Spec (.json)</span>
              </button>
            </div>
          </div>

          {/* New / Reset */}
          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
            title="Start new software project"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
