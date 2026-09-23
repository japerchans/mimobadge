import { test } from "node:test";
import assert from "node:assert/strict";
import { isSupportedRecordingFile } from "../domain/recording-file";

test("accepts M4A MIME variants used by browsers and recording devices", () => {
  for (const type of [
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4a-latm",
    "application/octet-stream",
    "",
  ]) {
    assert.equal(
      isSupportedRecordingFile({ name: "KOKORON_001.M4A", type }),
      true,
    );
  }
});

test("uses a supported extension when a browser reports an unusual MIME type", () => {
  assert.equal(
    isSupportedRecordingFile({
      name: "recording.m4a",
      type: "video/quicktime",
    }),
    true,
  );
  assert.equal(
    isSupportedRecordingFile({
      name: "recording.exe",
      type: "video/quicktime",
    }),
    false,
  );
});
