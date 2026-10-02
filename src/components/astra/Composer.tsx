import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, Square, X } from "lucide-react";
import { toast } from "sonner";
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
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(list: FileList | null) {
    for (const f of Array.from(list ?? [])) {
      if (f.size > 200_000) {
        toast.error(`${f.name} is too large (max 200 KB)`);
        continue;
      }
      const content = await f.text();
      if (content.includes("\u0000")) {
        toast.error(`${f.name} isn't a text file. Text, code, CSV, JSON and Markdown files are supported.`);
        continue;
      }
      setFiles((prev) => [...prev, { name: f.name, content }]);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

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
    if ((!t && !files.length) || busy) return;
    const attached = files.map((f) => `<file name="${f.name.replace(/"/g, "")}">\n${f.content}\n</file>`).join("\n\n");
    onSend(attached ? `${attached}\n\n${t}` : t);
    setText("");
    setFiles([]);
  }

  return (
    <div className="rounded-lg border bg-card shadow-[0_8px_30px_-12px_color-mix(in_oklch,var(--star)_18%,transparent)] focus-within:border-ring/60">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
          {files.map((f, i) => (
            <span key={i} className="flex items-center gap-1 rounded-sm border bg-muted px-2 py-0.5 text-xs">
              {f.name}
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
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
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Attach files">
          <Paperclip className="size-4" />
        </button>
        <ModelPicker modelId={modelId} reasoning={reasoning} onModel={onModel} onReasoning={onReasoning} />
        <div className="flex-1" />
        {busy ? (
          <button onClick={onStop} className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground" aria-label="Stop">
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!text.trim() && !files.length}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md bg-star text-star-foreground transition-opacity",
              !text.trim() && !files.length && "opacity-35",
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
