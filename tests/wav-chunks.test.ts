import { test } from "node:test";
import assert from "node:assert/strict";
import {
  directRecordingLimit,
  splitWavBuffer,
  splitWavFile,
} from "../lib/wav-chunks";

function pcmWav(payloadBytes: number) {
  const bytes = new Uint8Array(44 + payloadBytes);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, value: string) =>
    [...value].forEach((character, index) =>
      view.setUint8(offset + index, character.charCodeAt(0)),
    );
  write(0, "RIFF");
  view.setUint32(4, bytes.byteLength - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16_000, true);
  view.setUint32(28, 32_000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, payloadBytes, true);
  for (let index = 44; index < bytes.length; index++)
    bytes[index] = index % 251;
  return bytes.buffer;
}

test("splits a PCM WAV into independently valid aligned WAV files", () => {
  const chunks = splitWavBuffer(pcmWav(40), 60);
  assert.equal(chunks.length, 3);
  assert.deepEqual(
    chunks.map((chunk) => chunk.byteLength),
    [60, 60, 52],
  );
  for (const chunk of chunks) {
    const view = new DataView(chunk);
    assert.equal(new TextDecoder().decode(chunk.slice(0, 4)), "RIFF");
    assert.equal(view.getUint32(4, true), chunk.byteLength - 8);
    assert.equal(view.getUint32(40, true), chunk.byteLength - 44);
    assert.equal((chunk.byteLength - 44) % 2, 0);
  }
});

test("rejects files that only have a WAV extension", () => {
  assert.throws(
    () => splitWavBuffer(new Uint8Array(60).buffer, 60),
    /WAVファイルの形式/,
  );
});

test("turns a large uploaded WAV into requests below the hosting limit", async () => {
  const source = new File([pcmWav(5 * 1024 * 1024)], "conversation.wav", {
    type: "audio/wav",
  });
  const chunks = await splitWavFile(source);
  assert.equal(chunks.length, 2);
  assert.ok(chunks.every((chunk) => chunk.size <= directRecordingLimit));
  assert.deepEqual(
    chunks.map((chunk) => chunk.name),
    ["conversation-1.wav", "conversation-2.wav"],
  );
});
