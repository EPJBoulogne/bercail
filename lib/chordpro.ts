export function stripChordPro(text: string): string {
  return text
    .replace(/^\{([^}]+)\}$/gm, "$1") // garde le nom de la section, sans les accolades
    .replace(/\[([^\]]+)\]/g, "");
}

export function parseChordProLine(line: string) {
  const regex = /\[([^\]]+)\]/g;
  let lyric = "";
  let chordLine = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const before = line.slice(lastIndex, match.index);
    lyric += before;
    chordLine += " ".repeat(before.length);
    chordLine += match[1];
    lastIndex = regex.lastIndex;
  }
  lyric += line.slice(lastIndex);
  return { chordLine, lyric };
}
