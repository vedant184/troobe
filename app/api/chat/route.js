import Anthropic from "@anthropic-ai/sdk";

// Ensure this route runs on the Node.js runtime (not edge), since the
// Anthropic SDK expects Node APIs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPTS = {
  combo:
    "You are Troobe — a helpful assistant that blends the strengths of ChatGPT (conversational, creative, friendly) and Gemini (structured, factual, concise). Give answers that are accurate, clearly organized, and easy to follow. Use headings or bullet points only when they genuinely help. Respond in the same language the user writes in (English, Hindi, or Hinglish).",
  chatgpt:
    "You are Troobe in 'ChatGPT style'. Be conversational, warm, and creative. Feel free to brainstorm, use analogies, and write in a flowing natural tone. Respond in the same language the user writes in (English, Hindi, or Hinglish).",
  gemini:
    "You are Troobe in 'Gemini style'. Be concise, factual, and well-structured. Prefer short paragraphs, bullet points, and direct answers. Cite reasoning when useful. Respond in the same language the user writes in (English, Hindi, or Hinglish).",
};

export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "ANTHROPIC_API_KEY not set. Add it in your .env.local file or Vercel project settings.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages = [], mode = "combo" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided." }, { status: 400 });
    }

    // Convert our message shape to Anthropic's format.
    const anthropicMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: String(m.content ?? ""),
      }));

    const system = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.combo;

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system,
      messages: anthropicMessages,
    });

    const reply =
      response.content
        ?.filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim() || "(No response)";

    return Response.json({ reply, mode });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    const message =
      err?.error?.message || err?.message || "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
