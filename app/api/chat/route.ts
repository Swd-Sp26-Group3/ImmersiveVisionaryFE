import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  defaultHeaders: {
    "HTTP-Referer": "https://immersivevisionary.com",
    "X-Title": "Immersive Visionary Support",
  },
});

const SYSTEM_PROMPT =
  "You are a helpful customer support AI for Immersive Visionary, a premium 3D and AR production studio. " +
  "Keep your answers concise, professional, and helpful. " +
  "Guide users on ordering 3D models, requesting quotes, or learning about our services.";

// Extended message type that preserves OpenRouter reasoning_details across turns
type ORMessage = OpenAI.Chat.ChatCompletionMessageParam & {
  reasoning_details?: unknown;
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { messages }: { messages: ORMessage[] } = await req.json();

  // Build conversation: system prompt → history (with reasoning_details preserved) → latest user msg
  const conversation: ORMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    // First completion — reasoning enabled
    const apiResponse = await client.chat.completions.create({
      model: "google/gemma-3-27b-it:free",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: conversation as any,
      max_tokens: 800,
      temperature: 0.7,
    });

    const assistantMsg = apiResponse.choices[0].message as ORMessage;

    return NextResponse.json({
      reply: assistantMsg.content ?? "Sorry, I couldn't generate a response.",
      // Return reasoning_details so the client can pass them back on the next turn
      reasoning_details: assistantMsg.reasoning_details ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI service error";
    console.error("[/api/chat] OpenRouter error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
