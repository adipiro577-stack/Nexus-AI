
import { GoogleGenAI } from '@google/genai';

export type AIProvider =
  | 'gemini'
  | 'nvidia'
  | 'ollama'
  | 'groq'
  | 'mistral'
  | 'openrouter';

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  provider?: AIProvider;
  allowFallback?: boolean;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
}

const providerOrder: AIProvider[] = [
  'gemini',
  'nvidia',
  'ollama',
  'groq',
  'mistral',
  'openrouter',
];

function getProviderConfig(provider: AIProvider) {
  const configs = {
    gemini: {
      key: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    },
    nvidia: {
      key: process.env.NVIDIA_API_KEY,
      model: process.env.NVIDIA_MODEL,
    },
    ollama: {
      key: process.env.OLLAMA_API_KEY,
      model: process.env.OLLAMA_MODEL,
    },
    groq: {
      key: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL,
    },
    mistral: {
      key: process.env.MISTRAL_API_KEY,
      model: process.env.MISTRAL_MODEL,
    },
    openrouter: {
      key: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL,
    },
  };

  return configs[provider];
}

function normalizeUsage(usage: any) {
  const input = Number(
    usage?.prompt_tokens ??
    usage?.input_tokens ??
    usage?.prompt_eval_count
  );

  const output = Number(
    usage?.completion_tokens ??
    usage?.output_tokens ??
    usage?.eval_count
  );

  const total = Number(usage?.total_tokens);

  const validInput = Number.isFinite(input) && input >= 0;
  const validOutput = Number.isFinite(output) && output >= 0;

  return {
    inputTokens: validInput ? input : null,
    outputTokens: validOutput ? output : null,
    totalTokens: Number.isFinite(total) && total >= 0
      ? total
      : validInput && validOutput
        ? input + output
        : null,
  };
}

async function callProvider(
  provider: AIProvider,
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const config = getProviderConfig(provider);

  if (!config.key || !config.model) {
    throw new Error(`${provider} API key or model is not configured.`);
  }

  if (provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.key });

    const result = await ai.models.generateContent({
      model: config.model,
      contents: `${systemPrompt}\n\n${userPrompt}`,
    });

    const text = result.text || '';

    if (!text.trim()) {
      throw new Error('Gemini returned an empty response.');
    }

    const metadata = (result as any).usageMetadata;

    return {
      text,
      provider,
      model: config.model,
      usage: normalizeUsage(metadata ? {
        prompt_tokens: metadata.promptTokenCount,
        completion_tokens: metadata.candidatesTokenCount,
        total_tokens: metadata.totalTokenCount,
      } : null),
    };
  }

  if (provider === 'ollama') {
    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(120000),
    });

    const data: any = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Ollama request failed (${response.status}).`);
    }

    const text = data.message?.content || '';

    if (!text.trim()) {
      throw new Error('Ollama returned an empty response.');
    }

    return {
      text,
      provider,
      model: config.model,
      usage: normalizeUsage({
        input_tokens: data.prompt_eval_count,
        output_tokens: data.eval_count,
      }),
    };
  }

  const endpoints: Record<string, string> = {
    nvidia: (
      process.env.NVIDIA_BASE_URL ||
      'https://integrate.api.nvidia.com/v1'
    ).replace(/\/+$/, '') + '/chat/completions',

    groq: 'https://api.groq.com/openai/v1/chat/completions',

    mistral: 'https://api.mistral.ai/v1/chat/completions',

    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  };

  const response = await fetch(endpoints[provider], {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 5000,
    }),
    signal: AbortSignal.timeout(120000),
  });

  const data: any = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
      data.detail ||
      data.message ||
      `${provider} request failed (${response.status}).`
    );
  }

  const text = data.choices?.[0]?.message?.content || '';

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`${provider} returned an empty response.`);
  }

  return {
    text,
    provider,
    model: config.model,
    usage: normalizeUsage(data.usage),
  };
}

export async function callAI(request: AIRequest): Promise<AIResponse> {
  const preferred = request.provider ||
    (process.env.AI_PROVIDER as AIProvider) ||
    'gemini';

  if (!providerOrder.includes(preferred)) {
    throw new Error(`Unsupported AI provider: ${preferred}`);
  }

  // Check which providers have API credentials configured
  const configuredProviders = providerOrder.filter((provider) => {
    const config = getProviderConfig(provider);
    return Boolean(config.key && config.model);
  });

  // Always try the requested provider first
  const providers = request.allowFallback
    ? [
        preferred,
        ...configuredProviders.filter((item) => item !== preferred),
      ]
    : [preferred];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return await callProvider(
        provider,
        request.systemPrompt,
        request.userPrompt
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Unknown provider error';

      errors.push(`${provider}: ${message}`);

      console.error(`[AI PROVIDER] ${provider} failed: ${message}`);

      if (!request.allowFallback) {
        throw error;
      }
    }
  }

  throw new Error(
    `All available AI providers failed. ${errors.join(' | ')}`
  );
}
