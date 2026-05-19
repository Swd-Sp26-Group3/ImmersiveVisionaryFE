import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT =
  "You are a helpful customer support AI for Immersive Visionary, a premium 3D and AR production studio. " +
  "Keep your answers concise, professional, and helpful. " +
  "Guide users on ordering 3D models, requesting quotes, or learning about our services.";

// Free-tier model fallback chain — tried in order on 429 / 404 errors
const MODEL_FALLBACKS = [
  "openrouter/auto",                             // OpenRouter auto-selects best available free model
  "google/gemma-4-31b-it:free",                  // Gemma 4 31B
  "nvidia/llama-3.3-nemotron-super-49b-v1:free", // NVIDIA Nemotron 49B
  "deepseek/deepseek-v3-base:free",              // DeepSeek V3
  "mistralai/mistral-7b-instruct:free",          // Mistral 7B fallback
];

// Extended message type that preserves OpenRouter reasoning_details across turns
type ORMessage = OpenAI.Chat.ChatCompletionMessageParam & {
  reasoning_details?: unknown;
};

function isSkippableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("404") ||
      msg.includes("rate limit") ||
      msg.includes("no endpoints found") ||
      msg.includes("provider returned error")
    );
  }
  return false;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Instantiate client here (inside handler) so it only runs when the key is confirmed present.
  // Initializing at module load with apiKey="" would throw "Missing credentials" on Vercel.
  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://immersivevisionary.com",
      "X-Title": "Immersive Visionary Support",
    },
  });

  const { messages }: { messages: ORMessage[] } = await req.json();

  // Build conversation: system prompt → history (with reasoning_details preserved) → latest user msg
  const conversation: ORMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  let lastError: string = "AI service error";

  for (const model of MODEL_FALLBACKS) {
    try {
      console.log(`[/api/chat] Trying model: ${model}`);
      const apiResponse = await client.chat.completions.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: conversation as any,
        // @ts-expect-error — OpenRouter reasoning extension not in official typedefs
        reasoning: { enabled: true },
        max_tokens: 800,
        temperature: 0.7,
      });

      const assistantMsg = apiResponse.choices[0].message as ORMessage;

      console.log(`[/api/chat] Success with model: ${model}`);
      return NextResponse.json({
        reply: assistantMsg.content ?? "Sorry, I couldn't generate a response.",
        model_used: model,
        // Return reasoning_details so the client can pass them back on the next turn
        reasoning_details: assistantMsg.reasoning_details ?? null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "AI service error";
      lastError = message;

      if (isSkippableError(err)) {
        console.warn(`[/api/chat] Skipping ${model} (${message}), trying next fallback...`);
        continue; // try the next model
      }

      // Unexpected error (auth, bad request, etc.) — fail fast
      console.error(`[/api/chat] Non-retryable error on ${model}:`, message);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // All models exhausted
  console.error("[/api/chat] All models rate-limited:", lastError);
  return NextResponse.json(
    { error: "All AI providers are currently busy. Please try again in a moment." },
    { status: 503 }
  );
}
