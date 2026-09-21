import type { Information, Proposal, Segment } from "@/types";
export interface MnemoNetProcessor {
  extract(
    segments: Segment[],
    history: Information[],
  ): Promise<{ proposals: Proposal[]; context: string[]; draft: string }>;
}
export function generateDraft(proposals: Proposal[]) {
  return proposals
    .filter((p) => p.kind === "care" && p.status !== "rejected")
    .map((p) => p.content)
    .join(" ");
}
/** Deterministic demonstration rules, not a clinical model. Never infer a diagnosis. */
export class DemoMnemoNet implements MnemoNetProcessor {
  async extract(segments: Segment[], history: Information[]) {
    const proposals: Proposal[] = [];
    const rules = [
      {
        match: /眠れなかった/,
        kind: "care" as const,
        category: "Sleep",
        recordField: "subjective" as const,
        content: "昨夜はよく眠れなかったとの訴えあり。",
      },
      {
        match: /全部食べ/,
        kind: "care" as const,
        category: "Meals",
        recordField: "objective" as const,
        content: "朝食は全量摂取。",
      },
      {
        match: /着替え.*手伝/,
        kind: "care" as const,
        category: "Assistance",
        recordField: "intervention" as const,
        content: "朝の更衣を一部介助。",
      },
      {
        match: /小学校.*先生/,
        kind: "profile" as const,
        category: "Former occupation",
        content: "小学校の教員をしていた。",
      },
      {
        match: /バラ.*育て/,
        kind: "profile" as const,
        category: "Interests",
        content: "園芸、特にバラを育てることが好き。",
      },
      {
        match: /将棋/,
        kind: "profile" as const,
        category: "Interests",
        content: "将棋を楽しむ。",
      },
      {
        match: /編み物/,
        kind: "profile" as const,
        category: "Interests",
        content: "編み物が好き。",
      },
      {
        match: /写真/,
        kind: "profile" as const,
        category: "Interests",
        content: "写真を見ることを楽しむ。",
      },
      {
        match: /歌う/,
        kind: "profile" as const,
        category: "Interests",
        content: "歌うことを楽しむ。",
      },
    ];
    for (const segment of segments) {
      let relevant = false;
      for (const rule of rules)
        if (rule.match.test(segment.text)) {
          proposals.push({
            id: crypto.randomUUID(),
            kind: rule.kind,
            category: rule.category,
            content: rule.content,
            evidence: segment.text,
            status: "pending",
          });
          relevant = true;
        }
      if (!relevant && /天気/.test(segment.text))
        proposals.push({
          id: crypto.randomUUID(),
          kind: "ignored",
          category: "Small talk",
          content: "Weather conversation — no care information retained.",
          evidence: segment.text,
          status: "rejected",
        });
    }
    const categories = new Set(
      proposals.filter((p) => p.kind !== "ignored").map((p) => p.category),
    );
    const context = history
      .filter((i) => i.kind === "profile" && categories.has(i.category))
      .slice(0, 3)
      .map((i) => `${i.category}: ${i.content}`);
    return { proposals, context, draft: generateDraft(proposals) };
  }
}
