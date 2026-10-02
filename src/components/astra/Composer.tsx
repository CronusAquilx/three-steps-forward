import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { ModelPicker } from "./ModelPicker";
import { cn } from "@/lib/utils";

type Props = {
  onSend: (text: string) => void;
  onStop?: () => void;
  busy?: boolean;
  modelId: string;
  reasoning: string;
  onModel: (id: string) => void;
  onReasoning: (id: string) => void;
  autoFocusKey?: unknown;
};

export function Composer({ onSend, onStop, busy, modelId, reasoning, onModel, onReasoning, autoFocusKey }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [autoFocusKey, busy]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);

  function submit() {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText("");
  }

  return (
    <div className="rounded-lg border bg-card shadow-[0_8px_30px_-12px_color-mix(in_oklch,var(--star)_18%,transparent)] focus-within:border-ring/60">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Ask Astra anything…"
        className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-2 px-2 pb-2">
        <ModelPicker modelId={modelId} reasoning={reasoning} onModel={onModel} onReasoning={onReasoning} />
        <div className="flex-1" />
        {busy ? (
          <button onClick={onStop} className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground" aria-label="Stop">
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!text.trim()}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md bg-star text-star-foreground transition-opacity",
              !text.trim() && "opacity-35",
            )}
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
