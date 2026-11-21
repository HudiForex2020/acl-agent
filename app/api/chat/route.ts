import { NextRequest, NextResponse } from "next/server";

interface ChatRequestBody {
  message?: unknown;
  lastInteractionId?: unknown;
}

interface LumagenApiResponse {
  content?: string;
  interaction_id?: string;
  conversation_id?: string;
  references?: unknown[];
}

async function callLumagenApi(
  apiKey: string,
  query: string,
  interactionId: string | null
) {
  return fetch("https://luma-api-dev.aicreatorlabs.id/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      agent_nickname: "acl.agent",
      query,
      interaction_id: interactionId,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { message, lastInteractionId } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "LUMA_API_KEY belum dikonfigurasi di server environment." },
        { status: 500 }
      );
    }

    const cleanQuery = message.trim();
    const validInteractionId =
      typeof lastInteractionId === "string" && lastInteractionId.trim() !== ""
        ? lastInteractionId
        : null;

    let response = await callLumagenApi(apiKey, cleanQuery, validInteractionId);

    // Auto-retry jika server Lumagen mengalami PARSE_ERROR (400) atau gangguan sementara (500/502/503)
    if (response.status === 400 || response.status >= 500) {
      const firstError = await response.text();
      console.warn(`Percobaan ke-1 gagal (${response.status}), mencoba ulang...`, firstError);
      response = await callLumagenApi(apiKey, cleanQuery, validInteractionId);

      // Jika masih 400 dengan interaction_id lama, coba sebagai sesi baru
      if (response.status === 400 && validInteractionId !== null) {
        console.warn("Mencoba ulang tanpa interaction_id...");
        response = await callLumagenApi(apiKey, cleanQuery, null);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lumagen API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `Gagal berkomunikasi dengan ACL Agent (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as LumagenApiResponse;

    return NextResponse.json({
      reply: data.content || "Maaf, tidak ada respons teks dari ACL Agent.",
      interaction_id: data.interaction_id || null,
      conversation_id: data.conversation_id || null,
      references: Array.isArray(data.references) ? data.references : [],
    });
  } catch (error: unknown) {
    console.error("Internal Server Error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan server internal.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
