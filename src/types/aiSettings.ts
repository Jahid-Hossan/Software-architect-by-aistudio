export interface AiModel {
  id: string;
  name: string;
  slug: string;
  isCustom?: boolean;
}

export type AiProviderType = 'gemini-native' | 'openai-compatible';

export interface AiProvider {
  id: string;
  name: string;
  type: AiProviderType;
  baseUrl: string;
  apiKey: string;
  isEnabled: boolean;
  defaultModelSlug: string;
  models: AiModel[];
}

export interface RouteSelection {
  providerId: string;
  modelSlug: string;
}

export interface AiSettings {
  routing: {
    primary: RouteSelection;
    fallback: RouteSelection;
  };
  providers: AiProvider[];
}

export const AI_SETTINGS_STORAGE_KEY = 'architect_ai_settings_v5';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  routing: {
    primary: {
      providerId: 'gemini',
      modelSlug: 'gemini-flash-latest',
    },
    fallback: {
      providerId: 'none',
      modelSlug: '',
    },
  },
  providers: [
    {
      id: 'gemini',
      name: 'Google Gemini',
      type: 'gemini-native',
      baseUrl: '',
      apiKey: '',
      isEnabled: true,
      defaultModelSlug: 'gemini-flash-latest',
      models: [
        { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (High Availability)', slug: 'gemini-flash-latest' },
        { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (High Speed)', slug: 'gemini-3.1-flash-lite' },
        { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', slug: 'gemini-3.8-flash' },
        { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Complex Reasoning)', slug: 'gemini-3.1-pro-preview' },
      ],
    },
    {
      id: 'omni',
      name: 'Omni Gateway',
      type: 'openai-compatible',
      baseUrl: 'https://omni.appshub.app/v1',
      apiKey: '',
      isEnabled: false,
      defaultModelSlug: 'google/gemini-3.8-flash',
      models: [
        { id: 'omni-gemini-3.8-flash', name: 'Google Gemini 3.8 Flash', slug: 'google/gemini-3.8-flash' },
        { id: 'omni-gpt-4o', name: 'OpenAI GPT-4o', slug: 'openai/gpt-4o' },
        { id: 'omni-claude-3-5-sonnet', name: 'Anthropic Claude 3.5 Sonnet', slug: 'anthropic/claude-3-5-sonnet' },
        { id: 'omni-deepseek-chat', name: 'DeepSeek Chat', slug: 'deepseek/deepseek-chat' },
      ],
    },
    {
      id: 'selfHosted',
      name: 'Self-Hosted / Ollama',
      type: 'openai-compatible',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '',
      isEnabled: false,
      defaultModelSlug: 'llama3',
      models: [
        { id: 'self-llama3', name: 'Llama 3', slug: 'llama3' },
        { id: 'self-mistral', name: 'Mistral 7B', slug: 'mistral' },
        { id: 'self-qwen', name: 'Qwen 2.5 Coder', slug: 'qwen2.5-coder' },
      ],
    },
  ],
};
