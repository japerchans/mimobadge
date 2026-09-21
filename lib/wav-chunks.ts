// Vercel Functions accept request bodies up to 4.5 MB. Keep enough room for
// multipart headers and send larger WAV recordings as a sequence of requests.
export const directRecordingLimit = 4 * 1024 * 1024;
export const largeWavLimit = 200 * 1024 * 1024;
export const wavChunkLimit = directRecordingLimit;

const ascii = (view: DataView, offset: number, length: number) =>
  Array.from({ length }, (_, index) =>
    String.fromCharCode(view.getUint8(offset + index)),
  ).join("");

export function splitWavBuffer(buffer: ArrayBuffer, maxBytes = wavChunkLimit) {
  const view = new DataView(buffer);
  if (
    buffer.byteLength < 44 ||
    ascii(view, 0, 4) !== "RIFF" ||
    ascii(view, 8, 4) !== "WAVE"
  ) {
    throw new Error("WAVファイルの形式を読み取れませんでした。");
  }

  let offset = 12;
  let blockAlign = 0;
  let dataHeaderOffset = -1;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= buffer.byteLength) {
    const id = ascii(view, offset, 4);
    const declaredSize = view.getUint32(offset + 4, true);
    const payloadOffset = offset + 8;
    const availableSize = Math.min(
      declaredSize,
      Math.max(0, buffer.byteLength - payloadOffset),
    );
    if (id === "fmt " && availableSize >= 16)
      blockAlign = view.getUint16(payloadOffset + 12, true);
    if (id === "data") {
      dataHeaderOffset = offset;
      dataOffset = payloadOffset;
      dataSize = availableSize;
      break;
    }
    offset = payloadOffset + declaredSize + (declaredSize % 2);
  }

  if (dataOffset < 0 || dataHeaderOffset < 0 || dataSize < 1 || blockAlign < 1)
    throw new Error("WAVファイルの音声データを読み取れませんでした。");

  const headerSize = dataOffset;
  let payloadLimit =
    Math.floor((maxBytes - headerSize) / blockAlign) * blockAlign;
  while (
    payloadLimit > 0 &&
    headerSize + payloadLimit + (payloadLimit % 2) > maxBytes
  )
    payloadLimit -= blockAlign;
  if (payloadLimit < blockAlign)
    throw new Error("WAVの分割サイズが小さすぎます。");

  const chunks: ArrayBuffer[] = [];
  for (let start = 0; start < dataSize; start += payloadLimit) {
    const payloadSize = Math.min(payloadLimit, dataSize - start);
    const chunk = new Uint8Array(headerSize + payloadSize + (payloadSize % 2));
    chunk.set(new Uint8Array(buffer, 0, headerSize));
    chunk.set(
      new Uint8Array(buffer, dataOffset + start, payloadSize),
      headerSize,
    );
    const chunkView = new DataView(chunk.buffer);
    chunkView.setUint32(4, chunk.byteLength - 8, true);
    chunkView.setUint32(dataHeaderOffset + 4, payloadSize, true);
    chunks.push(chunk.buffer);
  }
  return chunks;
}

export async function splitWavFile(file: File) {
  const chunks = splitWavBuffer(await file.arrayBuffer());
  const baseName = file.name.replace(/\.wav$/i, "");
  return chunks.map(
    (chunk, index) =>
      new File([chunk], `${baseName}-${index + 1}.wav`, {
        type: "audio/wav",
      }),
  );
}
