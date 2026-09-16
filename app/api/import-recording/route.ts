import { getSession, sameOrigin } from "@/lib/auth";
import { transaction } from "@/db/repository";
import { DemoMnemoNet, generateDraft } from "@/domain/mnemonet";
import type { Proposal, Segment } from "@/types";

export const maxDuration = 60;

const allowedTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/mp4a-latm",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "video/mp4",
  "application/octet-stream",
]);
const maxBytes = 24 * 1024 * 1024;

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "送信元を確認できません。" },
      { status: 403 },
    );
  const session = await getSession();
  if (!session)
    return Response.json({ error: "ログインしてください。" }, { status: 401 });
  const key = process.env.OPENAI_API_KEY;
  if (!key)
    return Response.json(
      { error: "文字起こしの接続設定がまだ完了していません。" },
      { status: 503 },
    );
  if (Number(request.headers.get("content-length") || 0) > maxBytes + 1000000)
    return Response.json(
      { error: "音声ファイルは24MB以内で選択してください。" },
      { status: 413 },
    );
  try {
    const form = await request.formData();
    const file = form.get("file");
    const residentId = String(form.get("residentId") || "");
    if (!(file instanceof File))
      return Response.json(
        { error: "音声ファイルを選択してください。" },
        { status: 400 },
      );
    if (file.size < 1 || file.size > maxBytes)
      return Response.json(
        { error: "音声ファイルは24MB以内で選択してください。" },
        { status: 413 },
      );
    if (file.type && !allowedTypes.has(file.type))
      return Response.json(
        { error: "対応している音声ファイルを選択してください。" },
        { status: 400 },
      );
    const resident = await transaction(session.facilityId, (state) =>
      state.residents.find((r) => r.id === residentId)
        ? state.residents.find((r) => r.id === residentId)!
        : null,
    );
    if (!resident)
      return Response.json(
        { error: "入居者を選択してください。" },
        { status: 400 },
      );
    const transcriptText = await transcribe(file, key);
    if (!transcriptText.trim())
      return Response.json(
        { error: "文字起こしできる会話が見つかりませんでした。" },
        { status: 400 },
      );
    const segments = transcriptToSegments(transcriptText);
    const extracted = await extractProposals({
      key,
      residentName: resident.name,
      transcriptText,
      segments,
    });
    const result = await transaction(session.facilityId, (state) => {
      const latestResident = state.residents.find((r) => r.id === resident.id);
      if (!latestResident) return null;
      const now = new Date().toISOString();
      const id = `SD-${crypto.randomUUID().slice(0, 8)}`;
      state.recordings.unshift({
        id,
        residentId: latestResident.id,
        caregiverId: session.userId,
        createdAt: now,
        duration: 0,
        status: "review",
        stage: 5,
        transcript: segments,
        proposals: extracted.proposals,
        draft: extracted.draft,
        context: extracted.context,
        source: "sd-card",
        sourceName: file.name || "SDカード音声",
        retentionUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
        revision: 1,
      });
      state.audit.push({
        id: crypto.randomUUID(),
        actor: session.userId,
        action: "Imported SD card recording",
        target: id,
        at: now,
      });
      return { id };
    });
    if (!result)
      return Response.json(
        { error: "入居者が見つかりません。" },
        { status: 404 },
      );
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "音声を取り込めませんでした。もう一度お試しください。" },
      { status: 503 },
    );
  }
}

async function transcribe(file: File, key: string) {
  const form = new FormData();
  form.set("file", file, file.name || "recording.webm");
  form.set("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe");
  form.set("language", "ja");
  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(45000),
    },
  );
  if (!response.ok) throw new Error("Transcription failed");
  const result = (await response.json()) as { text?: string };
  return result.text || "";
}

function transcriptToSegments(text: string): Segment[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const chunks = lines.length
    ? lines
    : text.match(/[^。！？!?]+[。！？!?]?/g) || [text];
  return chunks.slice(0, 80).map((chunk, index) => ({
    speaker: "resident",
    start: index * 8,
    end: index * 8 + 7,
    text: chunk.trim(),
  }));
}

async function extractProposals({
  key,
  residentName,
  transcriptText,
  segments,
}: {
  key: string;
  residentName: string;
  transcriptText: string;
  segments: Segment[];
}) {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini",
        store: false,
        max_output_tokens: 1600,
        instructions:
          "あなたは介護記録の下書き作成を支援します。会話から、介護記録に残すべき客観的な内容と、本人の自伝的記憶として今後の会話支援に役立つプロフィールだけを抽出してください。診断、服薬判断、推測はしません。雑談だけの文はignoredにしてください。JSONだけを返してください。",
        input: `対象者: ${residentName}\n会話:\n${transcriptText.slice(0, 12000)}\n\n次のJSON形式で返してください: {"proposals":[{"kind":"care|profile|ignored","category":"短い英語カテゴリ","content":"日本語の短い文","evidence":"根拠の短い抜粋"}],"draft":"介護記録の下書き。careがない場合は空文字","context":[]}`,
      }),
    });
    if (!response.ok) throw new Error("Extraction failed");
    const result = await response.json();
    const text = (result.output || [])
      .flatMap(
        (item: { content?: { type: string; text?: string }[] }) =>
          item.content || [],
      )
      .filter((part: { type: string }) => part.type === "output_text")
      .map((part: { text: string }) => part.text)
      .join("\n")
      .trim();
    const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim()) as {
      proposals?: {
        kind?: string;
        category?: string;
        content?: string;
        evidence?: string;
      }[];
      draft?: string;
      context?: string[];
    };
    const proposals: Proposal[] = (parsed.proposals || [])
      .slice(0, 20)
      .map((item): Proposal => {
        const kind: Proposal["kind"] =
          item.kind === "profile" || item.kind === "ignored"
            ? item.kind
            : "care";
        return {
          id: crypto.randomUUID(),
          kind,
          category: String(item.category || "Observation").slice(0, 80),
          content: String(item.content || "")
            .trim()
            .slice(0, 1500),
          evidence: String(item.evidence || "")
            .trim()
            .slice(0, 1500),
          status: kind === "ignored" ? "rejected" : "pending",
        };
      })
      .filter((item) => item.content);
    return {
      proposals,
      draft:
        typeof parsed.draft === "string"
          ? parsed.draft.slice(0, 5000)
          : generateDraft(proposals),
      context: Array.isArray(parsed.context) ? parsed.context.slice(0, 5) : [],
    };
  } catch {
    return new DemoMnemoNet().extract(segments, []);
  }
}
