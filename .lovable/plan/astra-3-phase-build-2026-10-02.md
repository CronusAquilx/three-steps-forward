# Astra — 3-phase build

Astra runs on **your own model server** (Ollama, llama.cpp, vLLM, or any OpenAI-compatible endpoint), set with `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`. Nothing depends on Lovable AI credits. Anything not configured yet shows a clear "provider not configured" state, never fake output.

**Important:** your model server has to be reachable from the internet (for example a VPS, or a laptop running Ollama behind a Cloudflare Tunnel or ngrok). `localhost` on your own computer will not work from the hosted app.

## Phase 1 — Core: sign-in, chat, Astra, streaming, memory
- Premium dark/light design: sharp edges, distinctive type, clean sidebar, mobile-first layout, command menu (Cmd+K)
- Email + Google sign-in, user profiles
- Threaded chats saved to your account, each with its own page link
- Streaming replies from your model server through a swappable provider layer
- Model registry stored in the database (ID, provider, name, context length, capabilities, enabled, usage multiplier); Astra Local is the default
- Model selector and reasoning selector (Low → Ultra, 1x–16x, editable later)
- Memory: recent conversation context, plus long-term user memories you can view and delete
- Settings page showing whether the model server is connected

## Phase 2 — Agent: tools, search, code/HTML builder, usage
- Agent loop with step limits tied to the reasoning level, and live tool status in chat
- Modular tool system (name, schema, permissions, handler, on/off): calculator, date/time, URL fetch, web search, file reader, memory save/recall
- Web search through a real provider you connect (shows sources); unconfigured state if missing
- File uploads (text, PDF, code) that Astra can read
- HTML/website builder: Astra writes project files, rendered in a sandboxed live preview with fullscreen view on mobile
- Code agent with code blocks, copy, and saved projects
- Usage tracking per message (tokens × model × reasoning multiplier), daily limits per plan

## Phase 3 — Platform: dashboard, roles, extra providers, media
- Admin/developer dashboard (admin role stored separately): users, usage charts, model registry editor, reasoning multipliers, tool on/off, provider status
- Developer API keys so other apps can call Astra
- Optional external providers (OpenAI-compatible, Anthropic, Google) added from the registry, never hard-coded
- Image generation, voice (speech-to-text, read aloud), and video wired to configurable providers, each with an "not configured" state
- Security pass: rate limits, input validation, access rules review

## Technical details
- TanStack Start server functions/routes; Lovable Cloud for auth, Postgres (profiles, user_roles, threads, messages, memories, models, tools, usage_events, api_keys, projects), and file storage
- Provider interface: `chat(messages, tools, opts) -> stream`, implemented by an OpenAI-compatible adapter via the AI SDK (`@ai-sdk/openai-compatible`) pointed at `AI_BASE_URL`
- Code execution in Phase 2 is limited to browser-side sandboxed iframes (HTML/JS); server-side multi-language execution needs an external sandbox provider, added as a configurable integration
- Each phase ends with an end-to-end test against a real configured endpoint

Phase 1 starts after approval. I will need your model server URL, key, and model name to test real replies.
