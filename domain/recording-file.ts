const supportedMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
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

const supportedExtension = /\.(m4a|mp3|wav|webm|ogg|aac|flac|mp4)$/i;

/**
 * Browsers do not agree on the MIME type for M4A files. Safari commonly uses
 * audio/x-m4a while other upload sources omit it or use a generic binary type.
 * The filename is therefore a valid fallback for the formats accepted by the
 * transcription service.
 */
export function isSupportedRecordingFile(file: {
  name: string;
  type?: string;
}) {
  const type = file.type?.split(";", 1)[0].trim().toLowerCase();
  return Boolean(
    (type && supportedMimeTypes.has(type)) ||
    supportedExtension.test(file.name),
  );
}
