import type { Resident } from "@/types";
import { ja } from "@/lib/ja";

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[\s、。,.・「」『』（）()]/g, "");

const aliasesFor = (resident: Resident) => {
  // Older demo records keep their reading in English and translate it at the UI
  // boundary. Include that displayed reading so the demo behaves like newly
  // registered residents, whose kana is stored directly in Japanese.
  const names = [resident.name, resident.kana, ja(resident.kana)];
  const aliases = names.flatMap((name) => {
    const parts = name
      .trim()
      .split(/[\s　]+/)
      .filter(Boolean);
    return [name, parts.join(""), parts[0]];
  });
  return [
    ...new Set(aliases.map(normalize).filter((alias) => alias.length >= 2)),
  ].sort((a, b) => b.length - a.length);
};

/**
 * Matches only an explicit introduction near the beginning of a transcript.
 * A surname match is accepted only when it identifies exactly one resident.
 */
export function detectResidentFromIntroduction(
  transcript: string,
  residents: Resident[],
) {
  const introduction = normalize(transcript.slice(0, 220));
  const matched = residents.filter((resident) =>
    aliasesFor(resident).some((alias) =>
      new RegExp(
        `${escapeRegExp(alias)}(?:さん|様)(?:です|でございます|になります)`,
      ).test(introduction),
    ),
  );
  return matched.length === 1 ? matched[0] : null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
