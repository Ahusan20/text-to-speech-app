const extensionsByFormat = new Map([
  ['audio/mpeg', 'mp3'],
  ['audio/wav', 'wav'],
]);

export function getAudioFilename(format) {
  const extension = extensionsByFormat.get(format);
  if (!extension) {
    throw new Error(`Unsupported audio format: ${format || 'unknown'}`);
  }
  return `speech.${extension}`;
}
