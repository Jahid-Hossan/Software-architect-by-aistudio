import { GoogleGenAI } from '@google/genai';
import { AiProvider, AiSettings } from '../types/aiSettings.js';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ExecuteAiRequestParams {
  messages: AiChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  useSearch?: boolean;
  responseMimeType?: string;
  aiSettings?: AiSettings;
}

export interface ResolvedProviderConfig extends AiProvider {
  resolvedModel: string;
}

export function formatModelForGateway(provider: { baseUrl?: string; id?: string }, modelSlug: string): string {
  if (!modelSlug) return '';
  const slug = modelSlug.trim();
  const baseUrl = (provider.baseUrl || '').toLowerCase();
  const id = (provider.id || '').toLowerCase();

  // If already prefixed with provider/ (e.g. google/gemini-..., openai/gpt-...)
  if (slug.includes('/')) {
    return slug;
  }

  // If this is Omni Gateway or OpenRouter style gateway
  if (id.includes('omni') || baseUrl.includes('omni.appshub.app') || baseUrl.includes('openrouter.ai')) {
    if (slug.startsWith('gemini')) {
      return `google/${slug}`;
    }
    if (slug.startsWith('gpt') || slug.startsWith('o1') || slug.startsWith('o3') || slug.startsWith('chatgpt') || slug.startsWith('text-')) {
      return `openai/${slug}`;
    }
    if (slug.startsWith('claude')) {
      return `anthropic/${slug}`;
    }
    if (slug.startsWith('deepseek')) {
      return `deepseek/${slug}`;
    }
    if (slug.startsWith('llama')) {
      return `meta-llama/${slug}`;
    }
    if (slug.startsWith('mistral') || slug.startsWith('mixtral')) {
      return `mistralai/${slug}`;
    }
    if (slug.startsWith('qwen')) {
      return `qwen/${slug}`;
    }
  }

  return slug;
}

export function resolveConfiguredProviders(aiSettings?: AiSettings): ResolvedProviderConfig[] {
  if (!aiSettings || !aiSettings.providers || !aiSettings.routing) {
    // Default fallback to Gemini with environment key
    return [
      {
        id: 'gemini',
        name: 'Google Gemini',
        type: 'gemini-native',
        baseUrl: '',
        apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
        isEnabled: true,
        defaultModelSlug: 'gemini-3.8-flash',
        models: [],
        resolvedModel: 'gemini-3.8-flash',
      },
    ];
  }

  const result: ResolvedProviderConfig[] = [];

  const resolve = (route: { providerId: string; modelSlug: string }) => {
    if (!route || !route.providerId || route.providerId === 'none') {
      return null;
    }
    const provider = aiSettings.providers.find((p) => p.id === route.providerId);
    if (!provider || !provider.isEnabled) {
      return null;
    }

    // Remote OpenAI-compatible providers require an API key to avoid 401 Unauthorized errors
    if (provider.type === 'openai-compatible') {
      const isLocal = provider.baseUrl && (provider.baseUrl.includes('localhost') || provider.baseUrl.includes('127.0.0.1'));
      if (!isLocal && (!provider.apiKey || !provider.apiKey.trim())) {
        return null;
      }
    }

    let rawModel = route.modelSlug || provider.defaultModelSlug || (provider.models[0]?.slug ?? '');
    const resolvedModel = formatModelForGateway(provider, rawModel);
    return {
      ...provider,
      resolvedModel,
    };
  };

  const primary = resolve(aiSettings.routing.primary);
  const fallback = resolve(aiSettings.routing.fallback);

  if (primary) {
    result.push(primary);
  }

  if (
    fallback &&
    (!primary || primary.id !== fallback.id || primary.resolvedModel !== fallback.resolvedModel)
  ) {
    result.push(fallback);
  }

  // If no enabled provider was resolved from routing, add any enabled provider with valid config or default Gemini
  if (result.length === 0) {
    const anyValidEnabled = aiSettings.providers.find((p) => {
      if (!p.isEnabled) return false;
      if (p.type === 'gemini-native') return true;
      const isLocal = p.baseUrl && (p.baseUrl.includes('localhost') || p.baseUrl.includes('127.0.0.1'));
      return isLocal || (p.apiKey && p.apiKey.trim().length > 0);
    });

    if (anyValidEnabled) {
      result.push({
        ...anyValidEnabled,
        resolvedModel: anyValidEnabled.defaultModelSlug || (anyValidEnabled.models[0]?.slug ?? 'gemini-flash-latest'),
      });
    } else {
      result.push({
        id: 'gemini',
        name: 'Google Gemini',
        type: 'gemini-native',
        baseUrl: '',
        apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
        isEnabled: true,
        defaultModelSlug: 'gemini-flash-latest',
        models: [],
        resolvedModel: 'gemini-flash-latest',
      });
    }
  }

  return result;
}

export function sanitizeError(error: any): string {
  if (!error) return 'Unknown error';
  const msg = error.message || String(error);
  // Redact potential API keys (sk-..., AIzaSy...)
  return msg.replace(/(?:sk-[a-zA-Z0-9_-]{20,}|AIzaSy[a-zA-Z0-9_-]{33})/g, '[REDACTED_API_KEY]');
}

async function callGemini(
  params: ExecuteAiRequestParams,
  provider: ResolvedProviderConfig
): Promise<{ text: string; metadata?: any }> {
  const apiKey = (provider.apiKey && provider.apiKey.trim()) || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured (neither in provider settings nor GEMINI_API_KEY environment variable).');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-router',
      },
    },
  });

  const baseModel = provider.resolvedModel || 'gemini-flash-latest';
  // Resilient model fallback: if 503 high demand or temporary spike occurs, fall back to high-availability siblings
  const modelsToTry = [baseModel];
  if (baseModel !== 'gemini-flash-latest') modelsToTry.push('gemini-flash-latest');
  if (baseModel !== 'gemini-3.1-flash-lite') modelsToTry.push('gemini-3.1-flash-lite');
  if (baseModel !== 'gemini-3.8-flash') modelsToTry.push('gemini-3.8-flash');

  // Map messages to Gemini format
  const contents = params.messages.map((m) => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    return {
      role,
      parts: [{ text: m.content }],
    };
  });

  const config: any = {
    temperature: typeof params.temperature === 'number' ? params.temperature : 0.2,
  };

  if (params.systemInstruction) {
    config.systemInstruction = params.systemInstruction;
  }

  if (params.responseMimeType) {
    config.responseMimeType = params.responseMimeType;
  }

  if (params.useSearch) {
    config.googleSearch = {};
  }

  let lastErr: any = null;
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      const text = response.text || '';
      if (!text) {
        throw new Error(`Gemini (${model}) returned an empty response.`);
      }

      return { text, metadata: { modelUsed: model } };
    } catch (err: any) {
      lastErr = err;
      const errMsg = err?.message || String(err);
      const isRetryable =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('404');

      if (isRetryable && model !== modelsToTry[modelsToTry.length - 1]) {
        console.log(`[AI Router Failover] Model "${model}" temporarily busy, automatically routing to ${modelsToTry[modelsToTry.indexOf(model) + 1]}...`);
        continue;
      }
      throw err;
    }
  }

  throw lastErr || new Error('Gemini generation failed.');
}

async function callOpenAICompatible(
  params: ExecuteAiRequestParams,
  provider: ResolvedProviderConfig
): Promise<{ text: string; metadata?: any }> {
  let baseUrl = (provider.baseUrl || '').trim().replace(/\/+$/, '');
  if (!baseUrl) {
    baseUrl = 'https://api.openai.com/v1';
  }

  const url = `${baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider.apiKey && provider.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${provider.apiKey.trim()}`;
  }

  // OpenRouter / Omni optional metadata headers
  headers['HTTP-Referer'] = 'https://ai.google.dev';
  headers['X-Title'] = 'Software Research & Planning Architect';

  const messages: Array<{ role: string; content: string }> = [];

  if (params.systemInstruction) {
    messages.push({
      role: 'system',
      content: params.systemInstruction,
    });
  }

  for (const m of params.messages) {
    messages.push({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content,
    });
  }

  const targetModel = formatModelForGateway(provider, provider.resolvedModel);

  const bodyPayload: any = {
    model: targetModel,
    messages,
    temperature: typeof params.temperature === 'number' ? params.temperature : 0.2,
  };

  if (params.responseMimeType === 'application/json') {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Connection to ${provider.name} (${url}) timed out after 60s.`);
    }
    throw new Error(`Failed to reach ${provider.name} at ${url}: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    let parsedErr = '';
    try {
      const jsonErr = JSON.parse(errorBody);
      parsedErr = jsonErr.error?.message || jsonErr.message || errorBody;
    } catch {
      parsedErr = errorBody;
    }

    // Auto-retry if Omni / gateway complains about missing provider prefix
    if (
      res.status === 400 &&
      parsedErr.includes('Unable to determine provider for model') &&
      !bodyPayload.model.includes('/')
    ) {
      const retryModel = bodyPayload.model.startsWith('gemini')
        ? `google/${bodyPayload.model}`
        : `openai/${bodyPayload.model}`;

      console.log(`[AI Router] Retrying ${provider.name} with auto-prefixed model: "${retryModel}"`);
      bodyPayload.model = retryModel;

      try {
        const retryRes = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const choice = retryData?.choices?.[0];
          const text = choice?.message?.content || choice?.text || '';
          if (text) {
            return { text, metadata: retryData?.usage };
          }
        }
      } catch {
        // Continue to throw main error below
      }
    }

    throw new Error(`${provider.name} error [${res.status}]: ${parsedErr || res.statusText}`);
  }

  const data = await res.json();
  const choice = data?.choices?.[0];
  const text = choice?.message?.content || choice?.text || '';

  if (!text) {
    throw new Error(`${provider.name} returned an empty choice or invalid schema.`);
  }

  return { text, metadata: data?.usage };
}

export async function executeAiRequest(params: ExecuteAiRequestParams): Promise<{ text: string; providerUsed: string }> {
  const configuredProviders = resolveConfiguredProviders(params.aiSettings);
  let lastError: any = null;

  for (const provider of configuredProviders) {
    try {
      if (!provider || provider.isEnabled === false) {
        continue;
      }

      if (provider.type === 'gemini-native') {
        const result = await callGemini(params, provider);
        const actualModel = result.metadata?.modelUsed || provider.resolvedModel;
        return { text: result.text, providerUsed: `${provider.name} (${actualModel})` };
      }

      if (provider.type === 'openai-compatible') {
        const result = await callOpenAICompatible(params, provider);
        return { text: result.text, providerUsed: `${provider.name} (${provider.resolvedModel})` };
      }

      throw new Error(`Unknown provider type: ${(provider as any).type}`);
    } catch (err: any) {
      lastError = err;
      const sanitized = sanitizeError(err);
      console.log(`[AI Router] Provider "${provider.name}" (${provider.resolvedModel}) unavailable (${sanitized.slice(0, 90)}). Trying fallback...`);
      // Loop continues to attempt fallback provider
    }
  }

  // Safety net: if all configured providers failed and native Gemini was not tried, try native Google Gemini with server key
  const geminiAlreadyTried = configuredProviders.some((p) => p.type === 'gemini-native');
  if (!geminiAlreadyTried && (process.env.GEMINI_API_KEY || process.env.API_KEY)) {
    try {
      console.info('[AI Router] Attempting safety net failover to Google Gemini native with server credentials...');
      const fallbackGemini: ResolvedProviderConfig = {
        id: 'gemini',
        name: 'Google Gemini',
        type: 'gemini-native',
        baseUrl: '',
        apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
        isEnabled: true,
        defaultModelSlug: 'gemini-flash-latest',
        models: [],
        resolvedModel: 'gemini-flash-latest',
      };
      const result = await callGemini(params, fallbackGemini);
      const actualModel = result.metadata?.modelUsed || 'gemini-flash-latest';
      return { text: result.text, providerUsed: `Google Gemini (${actualModel})` };
    } catch (e: any) {
      lastError = e;
    }
  }

  throw new Error(`All configured AI providers failed. Last error: ${sanitizeError(lastError)}`);
}

export async function testProviderConnection(provider: AiProvider, modelSlug?: string): Promise<{ success: boolean; message: string }> {
  try {
    if (provider.type === 'openai-compatible') {
      const isLocal = provider.baseUrl && (provider.baseUrl.includes('localhost') || provider.baseUrl.includes('127.0.0.1'));
      if (!isLocal && (!provider.apiKey || !provider.apiKey.trim())) {
        return {
          success: false,
          message: `API Key required: Please configure an API key for ${provider.name} before testing connection.`,
        };
      }
    }

    const rawTargetModel = modelSlug || provider.defaultModelSlug || provider.models[0]?.slug || (provider.type === 'gemini-native' ? 'gemini-3.8-flash' : 'gpt-4o');
    const targetModel = formatModelForGateway(provider, rawTargetModel);
    const resolved: ResolvedProviderConfig = {
      ...provider,
      resolvedModel: targetModel,
    };

    const testPrompt: ExecuteAiRequestParams = {
      messages: [{ role: 'user', content: 'Say "hello" in one word.' }],
      temperature: 0.1,
    };

    if (provider.type === 'gemini-native') {
      const res = await callGemini(testPrompt, resolved);
      return { success: true, message: `Connected successfully! Response: "${res.text.trim().slice(0, 50)}"` };
    } else {
      const res = await callOpenAICompatible(testPrompt, resolved);
      return { success: true, message: `Connected successfully! Response: "${res.text.trim().slice(0, 50)}"` };
    }
  } catch (err: any) {
    return { success: false, message: sanitizeError(err) };
  }
}

export async function fetchProviderModels(provider: AiProvider): Promise<{ success: boolean; models?: Array<{ id: string; name: string; slug: string }>; message?: string }> {
  try {
    if (provider.type === 'gemini-native') {
      const models = [
        { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Default)', slug: 'gemini-3.8-flash' },
        { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (High Availability)', slug: 'gemini-flash-latest' },
        { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (High Speed)', slug: 'gemini-3.1-flash-lite' },
        { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Complex Architecture)', slug: 'gemini-3.1-pro-preview' },
      ];
      return { success: true, models, message: `Loaded ${models.length} Google Gemini models.` };
    }

    const isLocal = provider.baseUrl && (provider.baseUrl.includes('localhost') || provider.baseUrl.includes('127.0.0.1'));
    if (provider.type === 'openai-compatible' && !isLocal && (!provider.apiKey || !provider.apiKey.trim())) {
      return {
        success: false,
        message: `API key required to fetch models from ${provider.name}.`,
      };
    }

    let baseUrl = (provider.baseUrl || '').trim().replace(/\/+$/, '');
    if (!baseUrl) {
      baseUrl = 'https://api.openai.com/v1';
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (provider.apiKey && provider.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${provider.apiKey.trim()}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (baseUrl.includes('11434')) {
        try {
          const rootUrl = baseUrl.replace(/\/v1$/, '');
          const tagRes = await fetch(`${rootUrl}/api/tags`);
          if (tagRes.ok) {
            const tagData = await tagRes.json();
            const models = (tagData.models || []).map((m: any) => ({
              id: m.name,
              name: m.name,
              slug: m.name,
            }));
            return {
              success: true,
              models: models.length ? models : provider.models,
              message: `Retrieved ${models.length} models from Ollama.`
            };
          }
        } catch {
          // ignore fallback error
        }
      }
      throw new Error(`Failed to reach ${baseUrl}/models: ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      throw new Error(`Endpoint returned status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const rawList = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
    const models = rawList.map((m: any) => {
      const slug = typeof m === 'string' ? m : m.id || m.name || 'unknown';
      const name = m.name || slug;
      return {
        id: slug,
        name,
        slug,
      };
    }).filter((m: any) => m.slug && m.slug !== 'unknown');

    if (models.length === 0) {
      return {
        success: false,
        message: 'No models found in the provider response.',
      };
    }

    return {
      success: true,
      models,
      message: `Successfully fetched ${models.length} model(s) from ${provider.name}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: sanitizeError(err),
    };
  }
}

