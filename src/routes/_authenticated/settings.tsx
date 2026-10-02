import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getModelStatus } from "@/lib/astra/status.functions";
import { MobileMenuButton } from "@/components/astra/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Astra" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const fetchStatus = useServerFn(getModelStatus);
  const { data, isFetching, refetch } = useQuery({ queryKey: ["model-status"], queryFn: () => fetchStatus() });
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"), []);
  function applyTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("astra-theme", t);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex h-12 items-center px-3 md:hidden"><MobileMenuButton /></header>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-14">
        <h1 className="font-display text-4xl">Settings</h1>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="label-mono">Model server</h2>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} /> Check
            </Button>
          </div>
          <div className="mt-2 divide-y rounded-lg border">
            {data?.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cn("size-2 rounded-full", m.reachable ? "bg-success" : m.configured ? "bg-destructive" : "bg-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.detail}
                    {m.modelName ? ` · ${m.modelName}` : ""}
                  </div>
                </div>
              </div>
            ))}
            {!data && <div className="px-4 py-3 text-sm text-muted-foreground">Checking…</div>}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Astra talks to your own server (Ollama, llama.cpp, vLLM, or any OpenAI-compatible endpoint). It must be reachable from the internet.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="label-mono">Appearance</h2>
          <div className="mt-2 inline-flex rounded-md border p-0.5">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} onClick={() => applyTheme(t)} className={cn("rounded px-4 py-1.5 text-sm capitalize", theme === t ? "bg-accent text-foreground" : "text-muted-foreground")}>
                {t}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
