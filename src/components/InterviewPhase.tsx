import React, { useState, useRef, useEffect } from 'react';
import {
  InterviewMessage,
  InterviewOption,
  ProjectMemory,
  ProjectState
} from '../types/architect';
import {
  Send,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Database,
  HelpCircle,
  CheckCircle,
  CheckCircle2,
  Info,
  AlertCircle,
  X,
} from 'lucide-react';

interface InterviewPhaseProps {
  project: ProjectState;
  onSendMessage: (text: string, selectedOption?: InterviewOption) => Promise<void>;
  onProceedToReview: () => void;
  isLoading: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const InterviewPhase: React.FC<InterviewPhaseProps> = ({
  project,
  onSendMessage,
  onProceedToReview,
  isLoading,
  error,
  onClearError,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [project.conversation, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    await onSendMessage(text);
  };

  const handleSelectOption = async (option: InterviewOption) => {
    if (isLoading) return;

    // Check machine-readable action first or fallback to label comparison
    if (
      option.action === 'proceed_to_review' ||
      option.label.toLowerCase().includes('proceed to requirements review')
    ) {
      onProceedToReview();
      return;
    }

    if (option.action === 'add_constraint') {
      setInputText('Custom security or compliance constraint: ');
      return;
    }

    const responseText = `${option.label} — ${option.description}`;
    await onSendMessage(responseText, option);
  };

  // Find the last message from architect to see if it has options
  const lastArchitectMsg = [...project.conversation].reverse().find(m => m.sender === 'architect');
  const userTurnsCount = project.conversation.filter(m => m.sender === 'user').length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <span>Stage 2 of 5: Dynamic Technical Interview & Feasibility Research</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Refining {project.name || 'Software Requirements'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Focusing on one high-value architectural decision at a time with real-world trade-offs.
          </p>
        </div>

        {/* Progress & Transition CTA */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-slate-400">Decisions logged: </span>
            <span className="font-semibold text-indigo-400 font-mono">
              {project.memory.userDecisions.length}
            </span>
          </div>
          <button
            onClick={onProceedToReview}
            disabled={userTurnsCount < 1 || isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-md"
            title={userTurnsCount < 1 ? 'Answer at least one question to proceed' : 'Review compiled requirements'}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing requirements...</span>
              </>
            ) : (
              <>
                <span>Proceed to Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Callout if synthesis failed */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 flex items-start justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-100">Review Synthesis Failed</span>
              <span className="text-rose-300">{error}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onProceedToReview}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded font-medium text-xs transition-colors"
            >
              Retry
            </button>
            {onClearError && (
              <button
                onClick={onClearError}
                className="p-1 text-rose-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="space-y-6 mb-8">
        {project.conversation.map((msg, index) => {
          const isArchitect = msg.sender === 'architect';
          const isLatest = index === project.conversation.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isArchitect ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-2 mb-1.5 px-1 text-xs">
                <span className="font-medium text-slate-400">
                  {isArchitect ? 'Software Architect' : 'You'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                  isArchitect
                    ? 'bg-slate-900 border border-slate-800 text-slate-200'
                    : 'bg-indigo-600 text-white shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Feasibility Note Callout if attached */}
                {isArchitect && msg.feasibilityNote && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-amber-300/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/20">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300 block mb-0.5">
                        Feasibility Insight: {msg.feasibilityNote.topic}
                      </span>
                      <span className="text-amber-200/80 leading-normal">
                        {msg.feasibilityNote.detail}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* If this is the latest architect message and has options, display them */}
              {isArchitect && isLatest && Array.isArray(msg.options) && msg.options.length > 0 && !isLoading && (
                <div className="mt-4 w-full max-w-2xl space-y-2.5 pl-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select an Architectural Path or Type Below:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {msg.options.map((opt, optIdx) => {
                      const isProceedOption =
                        opt.action === 'proceed_to_review' ||
                        opt.label.toLowerCase().includes('proceed to requirements review');

                      return (
                        <button
                          key={optIdx}
                          disabled={isLoading}
                          onClick={() => handleSelectOption(opt)}
                          className={`text-left p-3.5 rounded-xl border transition-all ${
                            isProceedOption
                              ? 'bg-emerald-950/30 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/50 text-emerald-100 ring-1 ring-emerald-500/30'
                              : opt.recommended
                              ? 'bg-indigo-950/20 border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-950/40'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs text-slate-100 flex items-center gap-2">
                              {opt.label}
                            </span>
                            {isProceedOption ? (
                              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center gap-1">
                                <span>Transition</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            ) : opt.recommended ? (
                              <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold">
                                Recommended
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-400 mb-1.5">{opt.description}</p>
                          <div className="text-[11px] text-slate-500 flex items-start gap-1">
                            <span className="font-medium text-slate-400">Trade-off:</span>
                            <span>{opt.tradeoff}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-indigo-400 py-3 px-2 animate-pulse">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>Researching technical feasibility & evaluating constraints...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Box */}
      <div className="sticky bottom-4 z-20">
        <form
          onSubmit={handleSend}
          className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-2xl flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Type your decision, preference, or question (e.g. 'I prefer local storage with no cloud login')..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors"
            title="Send response (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

