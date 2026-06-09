import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function buildSystemPrompt(userContext?: any, ordersContext?: any[]) {
  let prompt = `You are a helpful customer support AI for "Immersive Visionary", a premium 3D and AR production studio.
Keep your answers concise, professional, and helpful. Always respond in Vietnamese (tiếng Việt).

GENERAL COMPANY INFORMATION:
- Product/Service: Custom 3D design, AR mobile preview, WebXR experiences, and a marketplace for ready-made models.
- Cancel & Refund Policy: Đổi ý miễn phí trong 24h. Khách hàng có thể tự hủy đơn hàng tùy chỉnh của họ và nhận lại toàn bộ tiền (100% refund) trực tiếp từ Customer Dashboard trong vòng 24 giờ kể từ lúc đặt hàng.
- Workflow Stages (Quy trình sản xuất 4 bước):
  1. Khảo sát & Lên ý tưởng (Stage 1): Thu thập yêu cầu và phác thảo thiết kế.
  2. Dựng hình 3D (Stage 2): Xây dựng hình khối và cấu trúc 3D chi tiết.
  3. Tối ưu hóa AR (Stage 3): Tối ưu vật liệu, ánh sáng và kiểm thử trên thiết bị di động.
  4. Bàn giao sản phẩm (Stage 4): Đóng gói các định dạng chất lượng cao GLB/GLTF/USDZ/OBJ.

`;

  if (userContext) {
    prompt += `CURRENT USER CONTEXT:
- Name: ${userContext.FullName ?? "N/A"}
- Email: ${userContext.Email ?? "N/A"}
- Role: ${userContext.Role ?? "CUSTOMER"}

`;
  } else {
    prompt += `CURRENT USER CONTEXT:
- Anonymous user (not logged in). If they ask about their orders or account, suggest they log in first.

`;
  }

  if (ordersContext && ordersContext.length > 0) {
    prompt += `USER'S ORDERS:
Here are the current orders placed by this user in our system:
${ordersContext.map((o: any, idx: number) => {
  const dateStr = o.CreatedAt ? new Date(o.CreatedAt).toLocaleDateString("vi-VN") : "N/A";
  return `${idx + 1}. Dự án: "${o.ProjectName || "Chưa đặt tên"}"
   - Order ID: ${o.OrderId}
   - Trạng thái: ${o.Status}
   - Giá tiền: ${o.Pricing ? `${o.Pricing.toLocaleString()} VND` : "N/A"}
   - Ngày đặt: ${dateStr}`;
}).join("\n")}

INSTRUCTIONS FOR ORDERS:
- If the user asks about the status or progress of their project, refer to the list above and explain which Stage it is in.
- If the user asks to cancel an order, check the CreatedAt date. If it's within the 24h limit, tell them they can cancel directly by clicking the "Hủy đơn" button in their Customer Dashboard under this project.
- Be precise and use the exact project names from the list above.
`;
  } else if (userContext) {
    prompt += `USER'S ORDERS:
- The user has no active orders in the system currently.
`;
  }

  return prompt;
}

// Free-tier model fallback chain — tried in order on 429 / 404 errors, prioritizing fast/accurate models
const MODEL_FALLBACKS = [
  "google/gemini-2.5-flash:free",                 // Super fast, extremely good at Vietnamese
  "google/gemma-2-9b-it:free",                    // High-quality Gemma 2 9B model
  "meta-llama/llama-3-8b-instruct:free",          // Fast Llama 3 8B
  "openrouter/auto",                              // OpenRouter auto-selects fallback
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

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://immersivevisionary.com",
      "X-Title": "Immersive Visionary Support",
    },
  });

  const { messages, userContext, ordersContext }: { messages: ORMessage[], userContext?: any, ordersContext?: any[] } = await req.json();

  const systemPrompt = buildSystemPrompt(userContext, ordersContext);

  // Build conversation: system prompt → history (with reasoning_details preserved) → latest user msg
  const conversation: ORMessage[] = [
    { role: "system", content: systemPrompt },
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
