import { AiSettings, DEFAULT_AI_SETTINGS, AI_SETTINGS_STORAGE_KEY, AiProvider } from '../types/aiSettings';

export function loadAiSettings(): AiSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_AI_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_AI_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return sanitizeAiSettings(parsed);
  } catch (err) {
    console.warn('[AI Settings] Failed to load settings from localStorage, using defaults:', err);
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAiSettings(settings: AiSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('[AI Settings] Failed to save settings to localStorage:', err);
  }
}

function normalizeGatewayModel(providerId: string, modelSlug: string): string {
  if (!modelSlug) return modelSlug;
  const slug = modelSlug.trim();
  if (slug.includes('/')) return slug;
  if (providerId === 'omni') {
    if (slug.startsWith('gemini')) return `google/${slug}`;
    if (slug.startsWith('gpt')) return `openai/${slug}`;
    if (slug.startsWith('claude')) return `anthropic/${slug}`;
    if (slug.startsWith('deepseek')) return `deepseek/${slug}`;
  }
  return slug;
}

export function sanitizeAiSettings(data: any): AiSettings {
  if (!data || typeof data !== 'object') {
    return DEFAULT_AI_SETTINGS;
  }

  const defaultProviders = DEFAULT_AI_SETTINGS.providers;
  const rawProviders = Array.isArray(data.providers) ? data.providers : [];

  const providers: AiProvider[] = defaultProviders.map((def) => {
    const existing = rawProviders.find((p: any) => p && p.id === def.id);
    if (!existing) return def;
    const defaultModelSlug = normalizeGatewayModel(
      def.id,
      typeof existing.defaultModelSlug === 'string' && existing.defaultModelSlug ? existing.defaultModelSlug : def.defaultModelSlug
    );
    const rawModels = Array.isArray(existing.models) && existing.models.length > 0 ? existing.models : def.models;
    const models = rawModels.map((m: any) => ({
      ...m,
      slug: normalizeGatewayModel(def.id, m.slug),
    }));

    const apiKey = typeof existing.apiKey === 'string' ? existing.apiKey.trim() : def.apiKey;
    let isEnabled = typeof existing.isEnabled === 'boolean' ? existing.isEnabled : def.isEnabled;
    // Remote providers require an API key to be actively enabled
    if (def.type === 'openai-compatible' && !def.baseUrl?.includes('localhost') && !def.baseUrl?.includes('127.0.0.1')) {
      if (!apiKey) {
        isEnabled = false;
      }
    }

    return {
      id: def.id,
      name: typeof existing.name === 'string' && existing.name.trim() ? existing.name : def.name,
      type: existing.type === 'gemini-native' || existing.type === 'openai-compatible' ? existing.type : def.type,
      baseUrl: typeof existing.baseUrl === 'string' ? existing.baseUrl : def.baseUrl,
      apiKey,
      isEnabled,
      defaultModelSlug,
      models,
    };
  });

  // Include user-defined custom providers
  for (const p of rawProviders) {
    if (p && !defaultProviders.some((dp) => dp.id === p.id) && typeof p.id === 'string' && p.id.trim()) {
      const isLocal = p.baseUrl && (p.baseUrl.includes('localhost') || p.baseUrl.includes('127.0.0.1'));
      const hasKey = typeof p.apiKey === 'string' && p.apiKey.trim().length > 0;
      providers.push({
        id: p.id,
        name: typeof p.name === 'string' ? p.name : 'Custom Provider',
        type: p.type === 'gemini-native' ? 'gemini-native' : 'openai-compatible',
        baseUrl: typeof p.baseUrl === 'string' ? p.baseUrl : 'https://api.openai.com/v1',
        apiKey: typeof p.apiKey === 'string' ? p.apiKey : '',
        isEnabled: isLocal || hasKey ? Boolean(p.isEnabled) : false,
        defaultModelSlug: typeof p.defaultModelSlug === 'string' ? p.defaultModelSlug : '',
        models: Array.isArray(p.models) ? p.models : [],
      });
    }
  }

  const routing = data.routing || {};
  const primary = routing.primary || DEFAULT_AI_SETTINGS.routing.primary;
  const fallback = routing.fallback || DEFAULT_AI_SETTINGS.routing.fallback;

  let primaryPid = typeof primary.providerId === 'string' ? primary.providerId : DEFAULT_AI_SETTINGS.routing.primary.providerId;
  let fallbackPid = typeof fallback.providerId === 'string' ? fallback.providerId : DEFAULT_AI_SETTINGS.routing.fallback.providerId;

  // Protect against unauthenticated routing
  const primaryProvider = providers.find((p) => p.id === primaryPid);
  if (primaryProvider?.type === 'openai-compatible') {
    const isLocal = primaryProvider.baseUrl?.includes('localhost') || primaryProvider.baseUrl?.includes('127.0.0.1');
    if (!isLocal && !primaryProvider.apiKey?.trim()) {
      primaryPid = 'gemini';
    }
  }

  const fallbackProvider = providers.find((p) => p.id === fallbackPid);
  if (fallbackProvider?.type === 'openai-compatible') {
    const isLocal = fallbackProvider.baseUrl?.includes('localhost') || fallbackProvider.baseUrl?.includes('127.0.0.1');
    if (!isLocal && !fallbackProvider.apiKey?.trim()) {
      fallbackPid = 'none';
    }
  }

  return {
    routing: {
      primary: {
        providerId: primaryPid,
        modelSlug: normalizeGatewayModel(
          primaryPid,
          typeof primary.modelSlug === 'string' ? primary.modelSlug : DEFAULT_AI_SETTINGS.routing.primary.modelSlug
        ),
      },
      fallback: {
        providerId: fallbackPid,
        modelSlug: normalizeGatewayModel(
          fallbackPid,
          typeof fallback.modelSlug === 'string' ? fallback.modelSlug : DEFAULT_AI_SETTINGS.routing.fallback.modelSlug
        ),
      },
    },
    providers,
  };
}
