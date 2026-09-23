import type { Segment, Resident } from "@/types";
export interface AudioPreprocessor {
  preprocess(key: string): Promise<string>;
}
export interface VoiceActivityProvider {
  detect(key: string): Promise<{ start: number; end: number }[]>;
}
export interface DiarizationProvider {
  separate(
    key: string,
  ): Promise<{ speaker: string; start: number; end: number }[]>;
}
export interface SpeechToTextProvider {
  transcribe(key: string, resident: Resident): Promise<Segment[]>;
}
export interface ResidentAssociationProvider {
  associate(input: {
    manualResidentId?: string;
    caregiverId: string;
  }): Promise<string | null>;
}
export class ManualResidentAssociation implements ResidentAssociationProvider {
  async associate(input: { manualResidentId?: string }) {
    return input.manualResidentId ?? null;
  }
}
export class DemoSpeechToText implements SpeechToTextProvider {
  async transcribe(_key: string, resident: Resident): Promise<Segment[]> {
    const personal: Record<string, string> = {
      tanaka: "昔は小学校の先生だったの。家ではバラを育てていたわ。",
      suzuki: "午後は将棋をしたいね。",
      sato: "編み物の続きをしたいです。",
      yamamoto: "家族の写真を見るのが好きなんです。",
      kobayashi: "みんなと歌うのが楽しみです。",
    };
    return [
      {
        speaker: "caregiver",
        start: 0,
        end: 5,
        text: `${resident.name.split(" ")[0]}さん、おはようございます。昨夜は眠れましたか？`,
      },
      {
        speaker: "resident",
        start: 6,
        end: 14,
        text: "昨夜はあまり眠れなかったの。でも朝ごはんは全部食べました。",
      },
      {
        speaker: "caregiver",
        start: 15,
        end: 27,
        text: "体温36.5度、血圧128/72、脈拍68回、SpO2は97%。水分は200ml摂取、排尿あり。着替えを一部介助し、朝薬の服用を確認しました。",
      },
      {
        speaker: "resident",
        start: 29,
        end: 47,
        text: personal[resident.id] || "今日はいい天気ですね。",
      },
      {
        speaker: "caregiver",
        start: 49,
        end: 54,
        text: "今日はいい天気ですね。",
      },
    ];
  }
}
export class DemoAudioPipeline
  implements AudioPreprocessor, VoiceActivityProvider, DiarizationProvider
{
  async preprocess(key: string) {
    return key;
  }
  async detect(_key: string) {
    return [{ start: 0, end: 50 }];
  }
  async separate(_key: string) {
    return [
      { speaker: "caregiver", start: 0, end: 5 },
      { speaker: "resident", start: 6, end: 14 },
      { speaker: "caregiver", start: 15, end: 27 },
      { speaker: "resident", start: 29, end: 47 },
      { speaker: "caregiver", start: 49, end: 54 },
    ];
  }
}
export interface AudioStorage {
  put(data: Uint8Array): Promise<string>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}
/** Private filesystem adapter; never put recordings under public/. */
export class LocalAudioStorage implements AudioStorage {
  constructor(private directory: string) {}
  private path(key: string) {
    if (!/^[a-f0-9-]{36}$/.test(key)) throw new Error("Invalid object key");
    return `${this.directory}/${key}`;
  }
  async put(data: Uint8Array) {
    const fs = await import("node:fs/promises");
    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    const key = crypto.randomUUID();
    await fs.writeFile(this.path(key), data, { mode: 0o600 });
    return key;
  }
  async get(key: string) {
    return (await import("node:fs/promises")).readFile(this.path(key));
  }
  async delete(key: string) {
    await (await import("node:fs/promises")).unlink(this.path(key));
  }
}
