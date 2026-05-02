// Troobe chat API — supports both Anthropic Claude and Google Gemini.
// Default behavior:
//   - "combo" / "chatgpt" / "gemini" modes ALL use Gemini if GOOGLE_API_KEY is set
//     (free tier — 1500 requests/day on gemini-2.0-flash-exp)
//   - Falls back to Claude if only ANTHROPIC_API_KEY is set
//   - Each mode just changes the system instruction style

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPTS = {
  combo:
    "You are Troobe — a helpful, knowledgeable AI assistant that blends the strengths of ChatGPT (conversational, creative, friendly) and Gemini (structured, factual, concise). You have broad world knowledge and can answer questions about almost any topic — science, history, current events, technology, sports, entertainment, math, coding, business, health, and more. Give answers that are accurate, clearly organized, and easy to follow. Use headings or bullet points only when they genuinely help. Respond in the same language the user writes in (English, Hindi, or Hinglish).",
  chatgpt:
    "You are Troobe in 'ChatGPT style'. Be conversational, warm, creative, and friendly. Feel free to brainstorm, use analogies, write in a flowing natural tone. Answer questions about any topic using your broad world knowledge. Respond in the same language the user writes in (English, Hindi, or Hinglish).",
  gemini:
    "You are Troobe in 'Gemini style'. Be concise, factual, well-structured, and direct. Prefer short paragraphs, bullet points, and direct answers. Cite reasoning when useful. Use your broad world knowledge to answer questions. Respond in the same language the user writes in (English, Hindi, or Hinglish).",
};

async function callGemini(messages, mode) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY not set. Get a free key at https://aistudio.google.com/apikey and add it in Vercel project settings."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.combo,
  });

  // Convert our messages to Gemini history format
  // Gemini uses 'user' and 'model' roles
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  return result.response.text();
}

async function callClaude(messages, mode) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY not set. Add it in your .env.local file or Vercel project settings."
    );
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.combo,
    messages,
  });

  return response.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages = [], mode = "combo" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided." }, { status: 400 });
    }

    const cleanMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content ?? "") }));

    // Decide which provider to use
    // Prefer Gemini (free), fall back to Claude
    const hasGemini = !!process.env.GOOGLE_API_KEY;
    const hasClaude = !!process.env.ANTHROPIC_API_KEY;

    let reply;
    let provider;

    if (hasGemini) {
      reply = await callGemini(cleanMessages, mode);
      provider = "gemini";
    } else if (hasClaude) {
      reply = await callClaude(cleanMessages, mode);
      provider = "claude";
    } else {
      return Response.json(
        {
          error:
            "No API key configured. Add either GOOGLE_API_KEY (free) or ANTHROPIC_API_KEY in Vercel project settings.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      reply: reply || "(No response)",
      mode,
      provider,
    });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    const message =
      err?.error?.message || err?.message || "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
