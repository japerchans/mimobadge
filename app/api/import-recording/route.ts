import { getSession, sameOrigin } from "@/lib/auth";
import { transaction } from "@/db/repository";
import { DemoMnemoNet, generateDraft } from "@/domain/mnemonet";
import { detectResidentFromIntroduction } from "@/domain/resident-detection";
import { isSupportedRecordingFile } from "@/domain/recording-file";
import {
  assignSpeakerRoles,
  labeledTranscript,
  parseDiarizedSegments,
  plainTranscript,
  type DiarizedSegment,
  type SpeakerRole,
} from "@/domain/speaker-diarization";
import type { Proposal, Segment } from "@/types";

export const maxDuration = 60;

const maxBytes = 24 * 1024 * 1024;
const maxTranscriptCharacters = 120_000;

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
    const mode = String(form.get("mode") || "import");
    const requestedResidentId = String(form.get("residentId") || "auto");
    if (mode === "transcribe-chunk") {
      const validation = validateAudioFile(file);
      if (validation) return validation;
      const result = await transcribe(file as File, key);
      return Response.json({
        transcript: result.text,
        segments: result.segments,
      });
    }

    if (mode !== "import" && mode !== "assemble-chunks")
      return Response.json({ error: "無効な処理です。" }, { status: 400 });
    const suppliedTranscript =
      mode === "assemble-chunks"
        ? String(form.get("transcript") || "").trim()
        : "";
    const suppliedSegments =
      mode === "assemble-chunks"
        ? parseDiarizedSegments(
            JSON.parse(String(form.get("segments") || "[]")),
          )
        : [];
    if (suppliedTranscript.length > maxTranscriptCharacters)
      return Response.json(
        { error: "録音が長すぎます。200MB以内のWAVを選択してください。" },
        { status: 413 },
      );
    if (mode === "assemble-chunks" && !suppliedTranscript)
      return Response.json(
        { error: "文字起こしできる会話が見つかりませんでした。" },
        { status: 400 },
      );
    if (mode === "import") {
      const validation = validateAudioFile(file);
      if (validation) return validation;
    }
    const residents = await transaction(session.facilityId, (state) =>
      structuredClone(state.residents),
    );
    const manuallySelected =
      requestedResidentId !== "auto"
        ? residents.find((resident) => resident.id === requestedResidentId)
        : null;
    if (requestedResidentId !== "auto" && !manuallySelected)
      return Response.json(
        { error: "入居者を選択してください。" },
        { status: 400 },
      );
    const transcription = suppliedTranscript
      ? { text: suppliedTranscript, segments: suppliedSegments }
      : await transcribe(file as File, key);
    const transcriptText =
      transcription.text || plainTranscript(transcription.segments);
    if (!transcriptText.trim())
      return Response.json(
        { error: "文字起こしできる会話が見つかりませんでした。" },
        { status: 400 },
      );
    const resident =
      manuallySelected ||
      detectResidentFromIntroduction(transcriptText, residents);
    if (!resident)
      return Response.json(
        {
          error:
            "録音冒頭から入居者を特定できませんでした。入居者を選択して、もう一度取り込んでください。",
        },
        { status: 422 },
      );
    const preliminarySegments = assignSpeakerRoles(
      transcription.segments.length
        ? transcription.segments
        : fallbackDiarizedSegments(transcriptText),
      resident.name,
    );
    const extracted = await extractProposals({
      key,
      residentName: resident.name,
      transcriptText,
      diarizedSegments: transcription.segments.length
        ? transcription.segments
        : fallbackDiarizedSegments(transcriptText),
      preliminarySegments,
    });
    const segments = assignSpeakerRoles(
      transcription.segments.length
        ? transcription.segments
        : fallbackDiarizedSegments(transcriptText),
      resident.name,
      extracted.speakerRoles,
    );
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
        sourceName:
          String(form.get("sourceName") || "") ||
          (file instanceof File ? file.name : "録音ファイル"),
        residentMatch: manuallySelected ? "manual" : "automatic",
        retentionUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
        revision: 1,
      });
      state.audit.push({
        id: crypto.randomUUID(),
        actor: session.userId,
        action: "Imported recording file",
        target: id,
        at: now,
      });
      return {
        id,
        residentId: latestResident.id,
        residentName: latestResident.name,
        detectedAutomatically: !manuallySelected,
      };
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

function validateAudioFile(file: FormDataEntryValue | null) {
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
  if (!isSupportedRecordingFile(file))
    return Response.json(
      { error: "対応している音声ファイルを選択してください。" },
      { status: 400 },
    );
  return null;
}

async function transcribe(file: File, key: string) {
  const form = new FormData();
  form.set("file", file, file.name || "recording.webm");
  form.set(
    "model",
    process.env.OPENAI_DIARIZE_MODEL || "gpt-4o-transcribe-diarize",
  );
  form.set("language", "ja");
  form.set("response_format", "diarized_json");
  form.set("chunking_strategy", "auto");
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
  const result = (await response.json()) as {
    text?: string;
    segments?: unknown;
  };
  return {
    text: result.text || "",
    segments: parseDiarizedSegments(result.segments),
  };
}

function fallbackDiarizedSegments(text: string): DiarizedSegment[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const chunks = lines.length
    ? lines
    : text.match(/[^。！？!?]+[。！？!?]?/g) || [text];
  return chunks.slice(0, 80).map((chunk, index) => ({
    speaker: "話者A",
    start: index * 8,
    end: index * 8 + 7,
    text: chunk.trim(),
  }));
}

async function extractProposals({
  key,
  residentName,
  transcriptText,
  diarizedSegments,
  preliminarySegments,
}: {
  key: string;
  residentName: string;
  transcriptText: string;
  diarizedSegments: DiarizedSegment[];
  preliminarySegments: Segment[];
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
          "あなたは介護施設の共有知識づくりを支援します。まず話者IDごとに介護職員、入居者、判別不明のいずれかを判断してください。録音冒頭で対象者名を紹介する話者は通常は介護職員です。確信できない話者はunknownとし、その発言を介護記録やプロフィールの根拠に使わないでください。次に会話から、介護記録に残す事実と、本人の生活歴・好み・性格・人間関係・最近の気分・ケア上の注意点を抽出してください。職員の声かけや観察を本人の発言として扱わないでください。介護記録はF=着眼点、S=本人や家族の言葉、O=観察・状態・バイタル等の数値、A=S/Oに基づく職員の判断、I=実際に行った支援・声かけ・介助、P=次の対応に分けます。発言された血圧・体温・脈拍・SpO2・食事量・水分量・排泄は単位を保って抽出してください。診断、服薬判断、根拠のない因果関係や数値の補正はしません。雑談だけの文はignoredにしてください。JSONだけを返してください。",
        input: `対象者: ${residentName}\n話者付き会話:\n${labeledTranscript(diarizedSegments).slice(0, 14000)}\n\n参考用の会話全文:\n${transcriptText.slice(0, 4000)}\n\n次のJSON形式で返してください: {"speakerRoles":[{"speaker":"話者ID","role":"caregiver|resident|unknown"}],"proposals":[{"kind":"care|profile|ignored","category":"Meals|Hydration|Elimination|Vitals|Sleep|Mood|Activity|Assistance|Medication|Pain or discomfort|Avoid or NG|Former occupation|Interests|Family|Life history|Preferences|Personality|Care preferences|Observation","recordField":"focus|subjective|objective|assessment|intervention|plan（careのみ。profile/ignoredは省略）","content":"日本語の短い文","evidence":"根拠の短い抜粋"}],"draft":"介護記録の簡潔な経過要約。careがない場合は空文字","context":[]}`,
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
        recordField?: string;
      }[];
      draft?: string;
      context?: string[];
      speakerRoles?: { speaker?: string; role?: string }[];
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
          recordField:
            kind === "care" &&
            [
              "focus",
              "subjective",
              "objective",
              "assessment",
              "intervention",
              "plan",
            ].includes(String(item.recordField))
              ? (item.recordField as Proposal["recordField"])
              : undefined,
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
      speakerRoles: parseSpeakerRoles(parsed.speakerRoles),
    };
  } catch {
    const fallback = await new DemoMnemoNet().extract(
      preliminarySegments.filter((segment) => segment.speaker !== "unknown"),
      [],
    );
    return {
      ...fallback,
      speakerRoles: {},
    };
  }
}

function parseSpeakerRoles(
  input: { speaker?: string; role?: string }[] | undefined,
) {
  const roles: Record<string, SpeakerRole> = {};
  for (const item of input || []) {
    const speaker = String(item.speaker || "").slice(0, 80);
    const role = item.role;
    if (
      speaker &&
      (role === "caregiver" || role === "resident" || role === "unknown")
    )
      roles[speaker] = role;
  }
  return roles;
}
