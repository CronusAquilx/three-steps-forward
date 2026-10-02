import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UIMessage } from "ai";
import { AstraMark } from "./Mark";

export function MessageView({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-rise">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-bubble px-4 py-2.5 text-[15px] text-bubble-foreground">{text}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 animate-rise">
      <AstraMark className="mt-1 size-4 shrink-0" />
      <div className="astra-prose min-w-0 flex-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}

export function Thinking() {
  return (
    <div className="flex items-center gap-3">
      <AstraMark className="size-4" pulsing />
      <span className="text-sm text-muted-foreground">Astra is thinking…</span>
    </div>
  );
}
