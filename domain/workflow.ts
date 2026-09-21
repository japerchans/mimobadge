import { z } from "zod";
import type { Workspace, Session, Recording } from "@/types";
import { DemoMnemoNet, generateDraft } from "./mnemonet";
import {
  DemoAudioPipeline,
  DemoSpeechToText,
  ManualResidentAssociation,
} from "@/services/providers";
import { rebuildMemoryGraph } from "./memory-graph";
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("transfer"), residentId: z.string().nullable() }),
  z.object({
    type: z.literal("create-resident"),
    name: z.string().trim().min(1).max(80),
    kana: z.string().trim().min(1).max(120),
    age: z.number().int().min(0).max(130),
    room: z.string().trim().min(1).max(20),
    caregiverId: z.string(),
  }),
  z.object({ type: z.literal("process"), id: z.string() }),
  z.object({
    type: z.literal("associate"),
    id: z.string(),
    residentId: z.string(),
  }),
  z.object({
    type: z.literal("review"),
    id: z.string(),
    revision: z.number().int(),
    draft: z.string().max(5000),
    proposals: z
      .array(
        z.object({
          id: z.string(),
          content: z.string().trim().min(1).max(1500),
          status: z.enum(["pending", "edited", "rejected", "approved"]),
        }),
      )
      .max(50),
    approve: z.boolean(),
  }),
  z.object({
    type: z.literal("edit-information"),
    id: z.string(),
    content: z.string().trim().min(1).max(1500),
    updatedAt: z.string(),
  }),
  z.object({
    type: z.literal("delete-information"),
    id: z.string(),
    updatedAt: z.string(),
  }),
  z.object({ type: z.literal("handoff") }),
  z.object({
    type: z.literal("create-family-report"),
    residentId: z.string(),
  }),
  z.object({
    type: z.literal("save-family-report"),
    id: z.string(),
    content: z.string().trim().min(1).max(5000),
  }),
]);
export class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function expireTranscripts(state: Workspace) {
  for (const recording of state.recordings)
    if (recording.retentionUntil < new Date().toISOString()) {
      recording.transcript = [];
      for (const proposal of recording.proposals) proposal.evidence = "";
    }
}
export function handoffText(state: Workspace) {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tokyo",
  });
  return state.residents
    .map((r) => {
      const info = state.information.filter((i) => i.residentId === r.id);
      const care = info.filter(
        (i) =>
          i.kind === "care" &&
          new Date(i.createdAt).toLocaleDateString("en-CA", {
            timeZone: "Asia/Tokyo",
          }) === today,
      );
      return `${r.name} · ${r.room}号室\n今日の記録\n${care.map((i) => `• ${i.content}`).join("\n") || "今日の確定した記録はありません。"}\n対応の参考\n${info
        .filter((i) => i.kind === "profile")
        .slice(0, 3)
        .map((i) => `• ${i.content}`)
        .join("\n")}`;
    })
    .join("\n\n");
}

export function familyReportText(state: Workspace, residentId: string) {
  const resident = state.residents.find((item) => item.id === residentId);
  if (!resident) throw new DomainError("Resident not found.", 404);
  const information = state.information
    .filter((item) => item.residentId === residentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const uniqueByContent = (items: typeof information, limit: number) =>
    items
      .filter(
        (item, index, all) =>
          all.findIndex((candidate) => candidate.content === item.content) ===
          index,
      )
      .slice(0, limit);
  const recentCare = uniqueByContent(
    information.filter((item) => item.kind === "care"),
    3,
  );
  const profile = uniqueByContent(
    information.filter((item) => item.kind === "profile"),
    2,
  );
  if (!recentCare.length && !profile.length)
    throw new DomainError("No approved information for this resident.");
  const paragraphs = [
    "ご家族様へ",
    `${resident.name}さんの最近のご様子をお知らせします。`,
  ];
  if (recentCare.length)
    paragraphs.push(recentCare.map((item) => `・${item.content}`).join("\n"));
  if (profile.length)
    paragraphs.push(
      `会話の中では、${profile.map((item) => item.content.replace(/[。.]$/, "")).join("、")}といったお話もありました。`,
    );
  paragraphs.push(
    "この文面は確認済みの記録から作成した下書きです。送信前に職員が内容を確認してください。",
  );
  return paragraphs.join("\n\n");
}
export async function executeAction(
  state: Workspace,
  input: z.infer<typeof actionSchema>,
  session: Session,
) {
  if (session.facilityId !== state.facility.id || session.role !== "caregiver")
    throw new DomainError("You do not have permission to make changes.", 403);
  const now = new Date().toISOString();
  const audit = (action: string, target: string) =>
    state.audit.push({
      id: crypto.randomUUID(),
      actor: session.userId,
      action,
      target,
      at: now,
    });
  const getRecording = (id: string): Recording => {
    const r = state.recordings.find((r) => r.id === id);
    if (!r) throw new DomainError("Recording not found.", 404);
    return r;
  };
  if (input.type === "create-resident") {
    if (!state.caregivers.some((c) => c.id === input.caregiverId))
      throw new DomainError("Caregiver not found.");
    if (state.residents.some((r) => r.room === input.room))
      throw new DomainError("This room already has a resident.");
    const id = `resident-${crypto.randomUUID().slice(0, 8)}`;
    const uniqueId = state.residents.some((r) => r.id === id)
      ? `${id}-${crypto.randomUUID().slice(0, 4)}`
      : id;
    state.residents.push({
      id: uniqueId,
      name: input.name,
      kana: input.kana,
      age: input.age,
      room: input.room,
      caregiverId: input.caregiverId,
      since: now.slice(0, 10),
      initials: input.name.replace(/\s/g, "").slice(0, 1) || "人",
    });
    audit("Added resident", uniqueId);
    return { id: uniqueId };
  }
  if (input.type === "transfer") {
    if (
      input.residentId &&
      !state.residents.some((r) => r.id === input.residentId)
    )
      throw new DomainError("Resident not found.");
    const id = `MB-${crypto.randomUUID().slice(0, 8)}`;
    state.recordings.unshift({
      id,
      residentId: input.residentId,
      caregiverId: session.userId,
      createdAt: now,
      duration: 152,
      status: "received",
      stage: 0,
      transcript: [],
      proposals: [],
      draft: "",
      context: [],
      source: "demo",
      retentionUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      revision: 0,
    });
    audit("Simulated dock transfer", id);
    return { id };
  }
  if (input.type === "associate") {
    const r = getRecording(input.id);
    if (r.status === "completed")
      throw new DomainError("A finalized recording cannot be reassigned.");
    if (!state.residents.some((x) => x.id === input.residentId))
      throw new DomainError("Resident not found.");
    r.residentId = await new ManualResidentAssociation().associate({
      manualResidentId: input.residentId,
    });
    r.transcript = [];
    r.proposals = [];
    r.draft = "";
    r.context = [];
    r.stage = 0;
    r.status = "received";
    r.revision++;
    audit("Associated interaction with resident", r.id);
    return { id: r.id };
  }
  if (input.type === "process") {
    const r = getRecording(input.id);
    if (r.status === "completed" || r.status === "review") return { id: r.id };
    const resident = state.residents.find((x) => x.id === r.residentId);
    if (!resident)
      throw new DomainError("Select a resident before processing.");
    r.status = "processing";
    const audio = new DemoAudioPipeline();
    if (r.stage === 0) {
      await audio.preprocess(r.id);
      await audio.detect(r.id);
    }
    if (r.stage === 1) await audio.separate(r.id);
    if (r.stage === 2)
      r.transcript = await new DemoSpeechToText().transcribe(r.id, resident);
    if (r.stage === 3) {
      const result = await new DemoMnemoNet().extract(
        r.transcript,
        state.information.filter((i) => i.residentId === resident.id),
      );
      Object.assign(r, result);
    }
    r.stage++;
    r.revision++;
    if (r.stage >= 5) {
      r.status = "review";
      audit("Demo processing completed", r.id);
    }
    return { id: r.id };
  }
  if (input.type === "review") {
    const r = getRecording(input.id);
    if (r.status === "completed" && input.approve) return { id: r.id };
    if (r.status !== "review")
      throw new DomainError("This recording is not ready for review.");
    if (r.revision !== input.revision)
      throw new DomainError(
        "This review changed in another window. Reload before saving.",
        409,
      );
    if (
      input.proposals.length !== r.proposals.length ||
      new Set(input.proposals.map((p) => p.id)).size !== r.proposals.length
    )
      throw new DomainError("Review items do not match.");
    for (const p of r.proposals) {
      const edit = input.proposals.find((x) => x.id === p.id);
      if (!edit) throw new DomainError("Review item not found.");
      if (p.kind === "ignored") continue;
      const changed = edit.content !== p.content;
      if (changed) {
        p.originalContent ??= p.content;
        p.content = edit.content;
      }
      p.status =
        edit.status === "rejected"
          ? "rejected"
          : changed || p.originalContent
            ? "edited"
            : "pending";
    }
    r.draft = input.draft.trim();
    if (input.approve) {
      if (!r.residentId) throw new DomainError("Select a resident first.");
      const reviewedResident = state.residents.find(
        (item) => item.id === r.residentId,
      );
      if (!reviewedResident) throw new DomainError("Resident not found.", 404);
      const accepted = r.proposals.filter(
        (p) => p.kind !== "ignored" && p.status !== "rejected",
      );
      const care = accepted.filter((p) => p.kind === "care");
      if (care.length && !r.draft)
        throw new DomainError("The care record cannot be empty.");
      if (!care.length && r.draft)
        throw new DomainError(
          "Clear the draft when all care information is rejected.",
        );
      for (const p of accepted) {
        const existing =
          p.kind === "profile" &&
          state.information.find(
            (i) =>
              i.residentId === r.residentId &&
              i.kind === "profile" &&
              i.category === p.category,
          );
        if (existing) {
          existing.history.push({
            content: existing.content,
            date: existing.updatedAt,
            source: existing.recordingId,
          });
          Object.assign(existing, {
            content: p.content,
            evidence: p.evidence,
            recordingId: r.id,
            updatedAt: now,
            approvedBy: session.userId,
            status: p.status === "edited" ? "edited" : "approved",
          });
        } else
          state.information.push({
            id: crypto.randomUUID(),
            residentId: r.residentId,
            recordingId: r.id,
            kind: p.kind as "care" | "profile",
            category: p.category,
            content: p.content,
            evidence: p.evidence,
            createdAt: r.createdAt,
            updatedAt: now,
            approvedBy: session.userId,
            status: p.status === "edited" ? "edited" : "approved",
            history: [],
          });
        if (p.status !== "edited") p.status = "approved";
      }
      if (care.length)
        state.records.push({
          id: crypto.randomUUID(),
          residentId: r.residentId,
          recordingId: r.id,
          content: r.draft,
          createdAt: now,
          approvedBy: session.userId,
        });
      if (accepted.length) {
        const reportContent = [
          "ご家族様へ",
          `${reviewedResident.name}さんの本日のご様子をお知らせします。`,
          r.draft,
          accepted.some((item) => item.kind === "profile")
            ? `会話の中では、${accepted
                .filter((item) => item.kind === "profile")
                .map((item) => item.content.replace(/[。.]$/, ""))
                .join("、")}といったお話もありました。`
            : "",
          "送信前に職員が内容を確認してください。",
        ]
          .filter(Boolean)
          .join("\n\n");
        state.handoffs.unshift({
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          createdBy: session.userId,
          content: reportContent,
          kind: "family",
          residentId: reviewedResident.id,
          recordingId: r.id,
        });
      }
      rebuildMemoryGraph(state);
      r.status = "completed";
      // Only the approved evidence excerpts persist; raw conversations are discarded on finalization.
      r.transcript = [];
      r.proposals = r.proposals.map((p) => ({
        ...p,
        evidence: "",
        ...(p.status === "rejected"
          ? {
              content: "Rejected information removed",
              originalContent: undefined,
            }
          : {}),
      }));
      audit("Approved review and finalized selected information", r.id);
    } else audit("Saved review draft", r.id);
    r.revision++;
    return { id: r.id };
  }
  if (
    input.type === "edit-information" ||
    input.type === "delete-information"
  ) {
    const item = state.information.find((i) => i.id === input.id);
    if (!item) throw new DomainError("Information not found.", 404);
    if (item.updatedAt !== input.updatedAt)
      throw new DomainError("This item changed. Reload before editing.", 409);
    if (input.type === "delete-information")
      state.information = state.information.filter((i) => i.id !== input.id);
    else {
      item.history.push({
        content: item.content,
        date: item.updatedAt,
        source: item.recordingId,
      });
      item.content = input.content;
      item.updatedAt = now;
      item.status = "edited";
      item.approvedBy = session.userId;
    }
    rebuildMemoryGraph(state);
    audit(
      input.type === "delete-information"
        ? "Deleted resident information"
        : "Edited resident information",
      input.id,
    );
    return { id: input.id };
  }
  if (input.type === "create-family-report") {
    const report = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      createdBy: session.userId,
      content: familyReportText(state, input.residentId),
      kind: "family" as const,
      residentId: input.residentId,
    };
    state.handoffs.unshift(report);
    audit("Created family report", report.id);
    return { id: report.id };
  }
  if (input.type === "save-family-report") {
    const report = state.handoffs.find(
      (item) => item.id === input.id && item.kind === "family",
    );
    if (!report) throw new DomainError("Family report not found.", 404);
    report.content = input.content;
    report.updatedAt = now;
    audit("Updated family report", report.id);
    return { id: report.id };
  }
  const handoff = {
    id: crypto.randomUUID(),
    createdAt: now,
    createdBy: session.userId,
    content: handoffText(state),
    kind: "handoff" as const,
  };
  state.handoffs.unshift(handoff);
  audit("Generated handoff from approved information", handoff.id);
  return { id: handoff.id };
}
