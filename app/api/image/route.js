// Free image generation via Pollinations.ai
// No API key needed, no payment, completely free.
// https://pollinations.ai/

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = String(body.prompt ?? "").trim();

    if (!prompt) {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    // Limit prompt length and clean it
    const cleaned = prompt.slice(0, 500);
    const encoded = encodeURIComponent(cleaned);
    const seed = Math.floor(Math.random() * 1000000);

    // Pollinations URL — generates image directly when this URL is loaded
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`;

    return Response.json({
      imageUrl,
      prompt: cleaned,
      reply: `Here's an image of: ${cleaned}`,
    });
  } catch (err) {
    console.error("[/api/image] error:", err);
    const message = err?.message || "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
