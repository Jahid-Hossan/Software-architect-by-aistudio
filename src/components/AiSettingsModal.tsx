import React, { useState } from 'react';
import {
  AiSettings,
  AiProvider,
  AiModel,
  DEFAULT_AI_SETTINGS,
} from '../types/aiSettings';
import { testAiProviderApi, fetchAiProviderModels } from '../services/geminiService';
import {
  X,
  Cpu,
  Check,
  CheckCircle2,
  AlertCircle,
  Key,
  Globe,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  HelpCircle,
  Activity,
  Sliders,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AiSettings;
  onSaveSettings: (settings: AiSettings) => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  onSaveSettings,
}) => {
  const [settings, setSettings] = useState<AiSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<'routing' | 'providers' | 'quota'>('routing');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    initialSettings.routing.primary.providerId || initialSettings.providers[0]?.id || 'gemini'
  );

  // Connection testing state: providerId -> { testing: boolean, result?: { success: boolean; message: string } }
  const [testState, setTestState] = useState<
    Record<string, { testing: boolean; result?: { success: boolean; message: string } }>
  >({});

  // Model fetching state: providerId -> { fetching: boolean; message?: string }
  const [fetchingState, setFetchingState] = useState<
    Record<string, { fetching: boolean; message?: string }>
  >({});

  // Show/hide API key passwords
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  // New model input state per provider
  const [newModelSlug, setNewModelSlug] = useState<string>('');
  const [newModelName, setNewModelName] = useState<string>('');

  // Add custom provider form visibility
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModelSlug, setCustomModelSlug] = useState('');

  // Save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const currentProvider = settings.providers.find((p) => p.id === selectedProviderId) || settings.providers[0];

  const handleUpdateProvider = (id: string, updates: Partial<AiProvider>) => {
    setSettings((prev) => {
      const updatedProviders = prev.providers.map((p) => (p.id === id ? { ...p, ...updates } : p));
      return {
        ...prev,
        providers: updatedProviders,
      };
    });
  };

  const handleToggleProviderEnabled = (id: string) => {
    setSettings((prev) => {
      const updatedProviders = prev.providers.map((p) =>
        p.id === id ? { ...p, isEnabled: !p.isEnabled } : p
      );
      return {
        ...prev,
        providers: updatedProviders,
      };
    });
  };

  const handleAddModel = (providerId: string) => {
    if (!newModelSlug.trim()) return;
    let slug = newModelSlug.trim();
    if (providerId === 'omni' && !slug.includes('/')) {
      if (slug.startsWith('gemini')) slug = `google/${slug}`;
      else if (slug.startsWith('gpt')) slug = `openai/${slug}`;
      else if (slug.startsWith('claude')) slug = `anthropic/${slug}`;
      else if (slug.startsWith('deepseek')) slug = `deepseek/${slug}`;
    }
    const name = newModelName.trim() || slug;

    setSettings((prev) => {
      const updatedProviders = prev.providers.map((p) => {
        if (p.id !== providerId) return p;
        if (p.models.some((m) => m.slug === slug)) return p;
        const newModel: AiModel = {
          id: `${providerId}-${slug}`,
          name,
          slug,
          isCustom: true,
        };
        return {
          ...p,
          models: [...p.models, newModel],
          defaultModelSlug: p.defaultModelSlug || slug,
        };
      });
      return {
        ...prev,
        providers: updatedProviders,
      };
    });

    setNewModelSlug('');
    setNewModelName('');
  };

  const handleRemoveModel = (providerId: string, modelSlug: string) => {
    setSettings((prev) => {
      const updatedProviders = prev.providers.map((p) => {
        if (p.id !== providerId) return p;
        const remaining = p.models.filter((m) => m.slug !== modelSlug);
        let defaultModelSlug = p.defaultModelSlug;
        if (defaultModelSlug === modelSlug) {
          defaultModelSlug = remaining[0]?.slug || '';
        }
        return {
          ...p,
          models: remaining,
          defaultModelSlug,
        };
      });
      return {
        ...prev,
        providers: updatedProviders,
      };
    });
  };

  const handleAddCustomProvider = () => {
    if (!customName.trim()) return;
    const id = `custom-${Date.now()}`;
    const initialSlug = customModelSlug.trim() || 'default-model';
    const newProvider: AiProvider = {
      id,
      name: customName.trim(),
      type: 'openai-compatible',
      baseUrl: customBaseUrl.trim() || 'https://api.openai.com/v1',
      apiKey: customApiKey.trim(),
      isEnabled: true,
      defaultModelSlug: initialSlug,
      models: [
        {
          id: `${id}-${initialSlug}`,
          name: initialSlug,
          slug: initialSlug,
          isCustom: true,
        },
      ],
    };

    setSettings((prev) => ({
      ...prev,
      providers: [...prev.providers, newProvider],
    }));

    setSelectedProviderId(id);
    setIsAddingCustom(false);
    setCustomName('');
    setCustomBaseUrl('');
    setCustomApiKey('');
    setCustomModelSlug('');
  };

  const handleDeleteProvider = (id: string) => {
    if (confirm('Delete this custom provider?')) {
      setSettings((prev) => {
        const filtered = prev.providers.filter((p) => p.id !== id);
        let newPrimary = prev.routing.primary;
        let newFallback = prev.routing.fallback;
        if (newPrimary.providerId === id) {
          newPrimary = {
            providerId: filtered[0]?.id || 'gemini',
            modelSlug: filtered[0]?.defaultModelSlug || '',
          };
        }
        if (newFallback.providerId === id) {
          newFallback = {
            providerId: 'none',
            modelSlug: '',
          };
        }
        return {
          ...prev,
          providers: filtered,
          routing: {
            primary: newPrimary,
            fallback: newFallback,
          },
        };
      });
      setSelectedProviderId(settings.providers[0]?.id || 'gemini');
    }
  };

  const handleTestConnection = async (provider: AiProvider) => {
    const isLocal = provider.baseUrl && (provider.baseUrl.includes('localhost') || provider.baseUrl.includes('127.0.0.1'));
    if (provider.type === 'openai-compatible' && !isLocal && (!provider.apiKey || !provider.apiKey.trim())) {
      setTestState((prev) => ({
        ...prev,
        [provider.id]: {
          testing: false,
          result: {
            success: false,
            message: `API Key required: Please enter an API key for ${provider.name} before testing connection.`,
          },
        },
      }));
      return;
    }

    setTestState((prev) => ({
      ...prev,
      [provider.id]: { testing: true },
    }));

    const result = await testAiProviderApi(provider, provider.defaultModelSlug);

    setTestState((prev) => ({
      ...prev,
      [provider.id]: { testing: false, result },
    }));
  };

  const handleFetchModels = async (provider: AiProvider) => {
    const isLocal = provider.baseUrl && (provider.baseUrl.includes('localhost') || provider.baseUrl.includes('127.0.0.1'));
    if (provider.type === 'openai-compatible' && !isLocal && (!provider.apiKey || !provider.apiKey.trim())) {
      setFetchingState((prev) => ({
        ...prev,
        [provider.id]: {
          fetching: false,
          message: `API key required: Please enter an API key for ${provider.name} to fetch models.`,
        },
      }));
      return;
    }

    setFetchingState((prev) => ({
      ...prev,
      [provider.id]: { fetching: true },
    }));

    const result = await fetchAiProviderModels(provider);

    setFetchingState((prev) => ({
      ...prev,
      [provider.id]: { fetching: false, message: result.message },
    }));

    if (result.success && result.models && result.models.length > 0) {
      setSettings((prev) => {
        const updatedProviders = prev.providers.map((p) => {
          if (p.id !== provider.id) return p;
          // Merge unique models
          const existingSlugs = new Set(p.models.map((m) => m.slug));
          const newModels = [...p.models];
          for (const m of result.models!) {
            if (!existingSlugs.has(m.slug)) {
              newModels.push(m);
            }
          }
          return {
            ...p,
            models: newModels,
            defaultModelSlug: p.defaultModelSlug || newModels[0]?.slug || '',
          };
        });
        return {
          ...prev,
          providers: updatedProviders,
        };
      });
    }
  };

  const handleSave = () => {
    onSaveSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all AI settings to default configurations?')) {
      setSettings(DEFAULT_AI_SETTINGS);
      setSelectedProviderId('gemini');
    }
  };

  const primaryProvider = settings.providers.find((p) => p.id === settings.routing.primary.providerId);
  const fallbackProvider = settings.providers.find((p) => p.id === settings.routing.fallback.providerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  AI Model & API Provider Manager
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950 border border-indigo-800/80 text-indigo-300">
                  Jules Router
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-provider routing, custom base URLs, and automatic quota failover.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Active Route Banner */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-400 font-medium">Active Path:</span>
            <div className="flex items-center gap-1.5 font-mono px-2 py-1 rounded bg-slate-800/90 border border-slate-700 text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>{primaryProvider?.name || 'Primary'}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300">{settings.routing.primary.modelSlug}</span>
            </div>

            {settings.routing.fallback.providerId && settings.routing.fallback.providerId !== 'none' && (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <div className="flex items-center gap-1.5 font-mono px-2 py-1 rounded bg-slate-800/90 border border-slate-700 text-amber-300">
                  <span className="text-slate-400">Failover:</span>
                  <span>{fallbackProvider?.name || 'Fallback'}</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-300">{settings.routing.fallback.modelSlug}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Automatic fallback on 429 quota exhaustion & errors</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-4 sm:px-6 gap-2">
          <button
            onClick={() => setActiveTab('routing')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'routing'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Routing & Failover</span>
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'providers'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Providers & API Keys ({settings.providers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('quota')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'quota'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Quota & Rate Limit Guide</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ROUTING & FAILOVER */}
          {activeTab === 'routing' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Resilient Two-Tier Execution Architecture</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The unified AI Router dispatches all architecture prompts (Interview questions,
                  Feasibility analysis, Requirements review, and Implementation blueprints) to your{' '}
                  <strong className="text-slate-200">Primary Provider</strong>. If rate limits (e.g.{' '}
                  <code>429 Resource Exhausted</code>), network interruptions, or gateway timeouts
                  occur, the request seamlessly transitions to the{' '}
                  <strong className="text-slate-200">Fallback Provider</strong> without losing your
                  conversation progress or state.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* PRIMARY ROUTE SELECTION */}
                <div className="bg-slate-950 p-5 rounded-xl border border-indigo-900/50 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      1. Primary Provider
                    </span>
                    <span className="text-[11px] text-slate-400">First choice</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Selected Provider</label>
                    <select
                      value={settings.routing.primary.providerId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const prov = settings.providers.find((p) => p.id === pid);
                        const model = prov?.defaultModelSlug || prov?.models[0]?.slug || '';
                        setSettings((prev) => ({
                          ...prev,
                          routing: {
                            ...prev.routing,
                            primary: {
                              providerId: pid,
                              modelSlug: model,
                            },
                          },
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {settings.providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {!p.isEnabled ? '(Disabled)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Model</label>
                    <select
                      value={settings.routing.primary.modelSlug}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          routing: {
                            ...prev.routing,
                            primary: {
                              ...prev.routing.primary,
                              modelSlug: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {(primaryProvider?.models || []).map((m) => (
                        <option key={m.slug} value={m.slug}>
                          {m.name} ({m.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Provider Type:</span>
                    <span className="font-mono text-slate-300">
                      {primaryProvider?.type === 'gemini-native' ? 'Google Gemini Native' : 'OpenAI-Compatible'}
                    </span>
                  </div>
                </div>

                {/* FALLBACK ROUTE SELECTION */}
                <div className="bg-slate-950 p-5 rounded-xl border border-amber-900/40 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      2. Fallback Provider
                    </span>
                    <span className="text-[11px] text-slate-400">Triggered on error</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Fallback Provider</label>
                    <select
                      value={settings.routing.fallback.providerId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        if (pid === 'none') {
                          setSettings((prev) => ({
                            ...prev,
                            routing: {
                              ...prev.routing,
                              fallback: {
                                providerId: 'none',
                                modelSlug: '',
                              },
                            },
                          }));
                          return;
                        }
                        const prov = settings.providers.find((p) => p.id === pid);
                        const model = prov?.defaultModelSlug || prov?.models[0]?.slug || '';
                        setSettings((prev) => ({
                          ...prev,
                          routing: {
                            ...prev.routing,
                            fallback: {
                              providerId: pid,
                              modelSlug: model,
                            },
                          },
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="none">None (No automatic failover)</option>
                      {settings.providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {!p.isEnabled ? '(Disabled)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {settings.routing.fallback.providerId !== 'none' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Fallback Model</label>
                      <select
                        value={settings.routing.fallback.modelSlug}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            routing: {
                              ...prev.routing,
                              fallback: {
                                ...prev.routing.fallback,
                                modelSlug: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {(fallbackProvider?.models || []).map((m) => (
                          <option key={m.slug} value={m.slug}>
                            {m.name} ({m.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Status:</span>
                    <span className="font-mono text-slate-300">
                      {settings.routing.fallback.providerId === 'none' ? 'Disabled' : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROVIDERS & API KEYS */}
          {activeTab === 'providers' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Provider List Sidebar */}
              <div className="md:col-span-4 space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Providers
                  </span>
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Custom</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {settings.providers.map((p) => {
                    const isSelected = p.id === selectedProviderId;
                    const isPrimary = settings.routing.primary.providerId === p.id;
                    const isFallback = settings.routing.fallback.providerId === p.id;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProviderId(p.id);
                          setIsAddingCustom(false);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-500/80 shadow-md'
                            : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                            {p.isEnabled ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate font-mono">
                            {p.defaultModelSlug || p.models[0]?.slug || 'No model'}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {isPrimary && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                              Primary
                            </span>
                          )}
                          {isFallback && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                              Fallback
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Provider Config Detail Panel */}
              <div className="md:col-span-8 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-5">
                {isAddingCustom ? (
                  /* Form: Add Custom Provider */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-sm font-semibold text-white">Add Custom AI Provider</span>
                      <button
                        onClick={() => setIsAddingCustom(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Provider Name</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. OpenRouter, LM Studio, vLLM, DeepSeek"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Base URL</label>
                      <input
                        type="text"
                        value={customBaseUrl}
                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                        placeholder="e.g. https://openrouter.ai/api/v1 or http://localhost:1234/v1"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">API Key (Optional)</label>
                      <input
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Initial Model Slug</label>
                      <input
                        type="text"
                        value={customModelSlug}
                        onChange={(e) => setCustomModelSlug(e.target.value)}
                        placeholder="e.g. deepseek/deepseek-chat or mistral-7b"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <button
                      onClick={handleAddCustomProvider}
                      disabled={!customName.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Custom Provider</span>
                    </button>
                  </div>
                ) : currentProvider ? (
                  /* Detail: Existing Provider */
                  <div className="space-y-5">
                    {/* Header Row */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{currentProvider.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {currentProvider.type === 'gemini-native' ? 'Gemini Native' : 'OpenAI-Compatible'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">ID: {currentProvider.id}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <span>{currentProvider.isEnabled ? 'Enabled' : 'Disabled'}</span>
                          <input
                            type="checkbox"
                            checked={currentProvider.isEnabled}
                            onChange={() => handleToggleProviderEnabled(currentProvider.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700"
                          />
                        </label>

                        {currentProvider.id.startsWith('custom-') && (
                          <button
                            onClick={() => handleDeleteProvider(currentProvider.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                            title="Delete custom provider"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Base URL */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>Base URL</span>
                        </label>
                        {currentProvider.type === 'gemini-native' && (
                          <span className="text-[11px] text-slate-500">Managed via official Google SDK</span>
                        )}
                      </div>

                      {currentProvider.type === 'gemini-native' ? (
                        <input
                          type="text"
                          disabled
                          value="https://generativelanguage.googleapis.com (Built-in)"
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono cursor-not-allowed"
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentProvider.baseUrl}
                          onChange={(e) => handleUpdateProvider(currentProvider.id, { baseUrl: e.target.value })}
                          placeholder="e.g. https://omni.appshub.app/v1 or http://localhost:11434/v1"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      )}
                    </div>

                    {/* API Key */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          <span>API Key</span>
                        </label>
                        {currentProvider.type === 'gemini-native' && (
                          <span className="text-[11px] text-slate-400">
                            {currentProvider.apiKey
                              ? 'Custom API Key Specified'
                              : 'Defaults to system GEMINI_API_KEY'}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type={showKey[currentProvider.id] ? 'text' : 'password'}
                          value={currentProvider.apiKey}
                          onChange={(e) =>
                            handleUpdateProvider(currentProvider.id, { apiKey: e.target.value })
                          }
                          placeholder={
                            currentProvider.type === 'gemini-native'
                              ? 'Enter key to override system GEMINI_API_KEY'
                              : currentProvider.id === 'selfHosted'
                              ? 'Optional for local Ollama'
                              : 'sk-...'
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKey((prev) => ({
                              ...prev,
                              [currentProvider.id]: !prev[currentProvider.id],
                            }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showKey[currentProvider.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Models Configuration */}
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-300">Configured Models</span>
                          <p className="text-[11px] text-slate-500">
                            Select the default model or add custom slugs.
                          </p>
                        </div>

                        <button
                          onClick={() => handleFetchModels(currentProvider)}
                          disabled={fetchingState[currentProvider.id]?.fetching}
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          title="Query provider /models endpoint to auto-populate models"
                        >
                          <RefreshCw
                            className={`w-3 h-3 text-indigo-400 ${
                              fetchingState[currentProvider.id]?.fetching ? 'animate-spin' : ''
                            }`}
                          />
                          <span>Fetch Models</span>
                        </button>
                      </div>

                      {fetchingState[currentProvider.id]?.message && (
                        <div className="text-[11px] px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {fetchingState[currentProvider.id]?.message}
                        </div>
                      )}

                      {/* Default Model Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-400">Default Model Slug</label>
                        <select
                          value={currentProvider.defaultModelSlug}
                          onChange={(e) =>
                            handleUpdateProvider(currentProvider.id, {
                              defaultModelSlug: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        >
                          {currentProvider.models.map((m) => (
                            <option key={m.slug} value={m.slug}>
                              {m.name} ({m.slug})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Existing Models Pills */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {currentProvider.models.map((m) => (
                          <div
                            key={m.slug}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                              m.slug === currentProvider.defaultModelSlug
                                ? 'bg-indigo-950/60 border-indigo-700 text-indigo-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="font-mono">{m.slug}</span>
                            {m.slug === currentProvider.defaultModelSlug && (
                              <span className="text-[10px] text-indigo-400 font-semibold">(default)</span>
                            )}
                            {currentProvider.models.length > 1 && (
                              <button
                                onClick={() => handleRemoveModel(currentProvider.id, m.slug)}
                                className="text-slate-500 hover:text-rose-400 transition-colors ml-1"
                                title="Remove model"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Model Input Row */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newModelSlug}
                          onChange={(e) => setNewModelSlug(e.target.value)}
                          placeholder={
                            currentProvider.id === 'omni'
                              ? 'Add Model Slug (e.g. google/gemini-2.5-flash, openai/gpt-4o)'
                              : 'Add Model Slug (e.g. gpt-4o, llama3:8b)'
                          }
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <input
                          type="text"
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          placeholder="Friendly name (optional)"
                          className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddModel(currentProvider.id)}
                          disabled={!newModelSlug.trim()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Test Connection Button & Result */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleTestConnection(currentProvider)}
                          disabled={testState[currentProvider.id]?.testing}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Activity
                            className={`w-3.5 h-3.5 text-emerald-400 ${
                              testState[currentProvider.id]?.testing ? 'animate-spin' : ''
                            }`}
                          />
                          <span>
                            {testState[currentProvider.id]?.testing
                              ? 'Testing Connection...'
                              : 'Test Connection'}
                          </span>
                        </button>

                        <span className="text-[11px] text-slate-500">
                          Pings provider using default model
                        </span>
                      </div>

                      {testState[currentProvider.id]?.result && (
                        <div
                          className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                            testState[currentProvider.id]?.result?.success
                              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                              : 'bg-rose-950/40 border-rose-800 text-rose-300'
                          }`}
                        >
                          {testState[currentProvider.id]?.result?.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <span className="font-semibold block">
                              {testState[currentProvider.id]?.result?.success
                                ? 'Connection Succeeded'
                                : 'Connection Failed'}
                            </span>
                            <span className="text-[11px] leading-relaxed break-words">
                              {testState[currentProvider.id]?.result?.message}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* TAB 3: QUOTA & RATE LIMIT GUIDE */}
          {activeTab === 'quota' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Understanding Gemini 429 Quota Exhaustion</span>
                </div>
                <p className="text-slate-400">
                  Google Gemini Free Tier imposes daily and per-minute request limits (e.g.{' '}
                  <code>generativelanguage.googleapis.com/generate_content_free_tier_requests</code>,
                  limit: 20 per day or 15 RPM). When limits are hit, Google returns HTTP 429.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-white text-xs block">Solution 1: Omni Gateway</span>
                  <p className="text-[11px] text-slate-400">
                    Switch your primary or fallback route to <strong>Omni Gateway</strong>. Omni provides
                    high-capacity OpenAI-compatible proxies that bypass local IP quotas.
                  </p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-white text-xs block">Solution 2: Your Own API Key</span>
                  <p className="text-[11px] text-slate-400">
                    Enter your personal Gemini API key in the <strong>Google Gemini</strong> tab. A pay-as-you-go
                    Tier key receives thousands of RPM with no 20-request daily cap.
                  </p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-white text-xs block">Solution 3: Local Ollama</span>
                  <p className="text-[11px] text-slate-400">
                    Run <code>ollama run llama3</code> or <code>qwen2.5-coder</code> locally. Point the
                    Self-Hosted provider to <code>http://localhost:11434/v1</code> for 100% free, unlimited offline planning!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-20">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
          >
            Reset to Default Providers
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Save & Apply Routing</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
