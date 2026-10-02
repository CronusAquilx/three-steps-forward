import type { FileUIPart } from "ai";

export const MAX_FILES = 15;
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file
const MAX_TEXT_CHARS = 300_000;

export type Attachment =
  | { kind: "text"; name: string; content: string }
  | { kind: "image"; name: string; part: FileUIPart };

async function readPdf(f: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    pages.push(tc.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  return pages.join("\n\n");
}

async function readDocx(f: File) {
  const mammoth = await import("mammoth");
  const res = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
  return res.value;
}

/** Shrinks photos so many can be sent at once. */
async function readImage(f: File): Promise<FileUIPart> {
  const bmp = await createImageBitmap(f);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return { type: "file", mediaType: "image/jpeg", filename: f.name, url: canvas.toDataURL("image/jpeg", 0.82) };
}

export async function readAttachment(f: File): Promise<Attachment> {
  const lower = f.name.toLowerCase();
  if (f.type.startsWith("image/")) return { kind: "image", name: f.name, part: await readImage(f) };
  let content: string;
  if (lower.endsWith(".pdf") || f.type === "application/pdf") content = await readPdf(f);
  else if (lower.endsWith(".docx")) content = await readDocx(f);
  else {
    content = await f.text();
    if (content.includes("\u0000")) throw new Error("This file type can't be read. Try PDF, Word, text, code, CSV or photos.");
  }
  if (content.length > MAX_TEXT_CHARS) content = content.slice(0, MAX_TEXT_CHARS) + "\n…[truncated]";
  return { kind: "text", name: f.name, content };
}
