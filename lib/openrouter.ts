const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content?: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  reasoning_details?: unknown;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  reasoning?: { enabled: boolean };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const {
    model = 'google/gemini-2.5-flash',
    temperature = 0.3,
    max_tokens,
    reasoning,
  } = options;

  // Если max_tokens не задан, используем 2000 для обычных запросов или 4000 для рассуждений
  const actual_max_tokens = max_tokens ? max_tokens : (reasoning ? 4000 : 2000);

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
  };
  if (actual_max_tokens) body.max_tokens = actual_max_tokens;
  if (reasoning) body.reasoning = reasoning;

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sun-proactive.vercel.app',
      'X-Title': 'Sun Proactive',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  // Return the full message object if reasoning is enabled, so it can be passed back in conversation.
  // But to keep backwards compatibility, we can just return the text string normally if reasoning isn't explicitly requested as an object.
  // For simplicity and matching current signature, let's just return content. You can change the return type to ChatMessage if you want to preserve reasoning_details across calls like in your py script.
  return data.choices[0].message.content;
}

// Function that returns full message object including reasoning_details
export async function chatCompletionFull(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatMessage> {
  const {
    model = 'google/gemini-2.5-flash',
    temperature = 0.3,
    max_tokens,
    reasoning,
  } = options;

  // Если max_tokens не задан, используем 2000 для обычных запросов или 4000 для рассуждений
  const actual_max_tokens = max_tokens ? max_tokens : (reasoning ? 4000 : 2000);

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
  };
  if (actual_max_tokens) body.max_tokens = actual_max_tokens;
  if (reasoning) body.reasoning = reasoning;

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sun-proactive.vercel.app',
      'X-Title': 'Sun Proactive',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sun-proactive.vercel.app',
      'X-Title': 'Sun Proactive',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter embedding error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}
