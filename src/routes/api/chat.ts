import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { resolveProvider } from "@/lib/astra/provider.server";

const Body = z.object({
  threadId: z.string().uuid(),
  message: z.object({ id: z.string(), role: z.literal("user"), parts: z.array(z.any()) }),
  modelId: z.string().min(1),
  reasoning: z.string().min(1),
});

const HISTORY_LIMIT = 40;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function userClient(token: string) {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function textOf(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p): p is { type: "text"; text: string } => p?.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return json(401, { error: "Please sign in again." });
        const supabase = userClient(token);
        const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (claimsErr || !userId) return json(401, { error: "Please sign in again." });

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json(400, { error: "Invalid request." });
        const { threadId, message, modelId, reasoning } = parsed.data;

        const { data: thread } = await supabase.from("threads").select("id, title").eq("id", threadId).maybeSingle();
        if (!thread) return json(404, { error: "Conversation not found." });

        const { data: model } = await supabase
          .from("models")
          .select("id, provider, config, display_name, enabled")
          .eq("id", modelId)
          .maybeSingle();
        if (!model || !model.enabled) return json(400, { error: "That model is not available." });

        const resolved = resolveProvider(model);
        if (!resolved.ok) return json(503, { error: `${model.display_name} isn't connected: ${resolved.reason}` });

        const { data: level } = await supabase.from("reasoning_levels").select("*").eq("id", reasoning).maybeSingle();

        const { error: insertErr } = await supabase.from("messages").insert({
          thread_id: threadId,
          user_id: userId,
          ui_id: message.id,
          role: "user",
          parts: message.parts as Json,
        });
        if (insertErr) {
          console.error("save user message", insertErr);
          return json(500, { error: "Could not save your message." });
        }

        const [{ data: rows }, { data: memories }] = await Promise.all([
          supabase
            .from("messages")
            .select("ui_id, id, role, parts")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: false })
            .limit(HISTORY_LIMIT),
          supabase.from("memories").select("content").order("created_at", { ascending: false }).limit(50),
        ]);

        const history: UIMessage[] = (rows ?? []).reverse().map((r) => ({
          id: r.ui_id ?? r.id,
          role: r.role as UIMessage["role"],
          parts: (r.parts as UIMessage["parts"]) ?? [],
        }));

        const memoryBlock = memories?.length
          ? `\n\nThings the user asked you to remember:\n${memories.map((m) => `- ${m.content}`).join("\n")}`
          : "";
        const effort = level
          ? `\n\nEffort level: ${level.label}. ${
              level.multiplier >= 4
                ? "Think carefully and be thorough before answering."
                : "Be direct and efficient."
            }`
          : "";

        const system = `You are Astra, a helpful, precise AI agent. Today is ${new Date().toUTCString()}.
Answer in clear Markdown. Use code blocks with language tags for code. If you don't know something, say so plainly.${effort}${memoryBlock}`;

        if (thread.title === "New chat") {
          const title = textOf(message.parts).replace(/\s+/g, " ").trim().slice(0, 60) || "New chat";
          await supabase.from("threads").update({ title }).eq("id", threadId);
        }

        const result = streamText({
          model: resolved.model,
          system,
          messages: await convertToModelMessages(history),
          abortSignal: request.signal,
        });
        result.consumeStream();

        return result.toUIMessageStreamResponse({
          originalMessages: history,
          sendReasoning: false,
          onError: (err) => {
            console.error("model stream error", err);
            return "Astra couldn't get a reply from the model server. Check that it's running and reachable.";
          },
          onFinish: async ({ responseMessage }) => {
            if (!responseMessage.parts.length) return;
            const { error } = await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: userId,
              ui_id: responseMessage.id,
              role: "assistant",
              parts: responseMessage.parts as Json,
            });
            if (error) console.error("save assistant message", error);
            await supabase.from("threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
          },
        });
      },
    },
  },
});
