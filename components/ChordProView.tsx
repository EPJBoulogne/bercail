import { parseChordProLine } from "@/lib/chordpro";

export function ChordProView({ text }: { text: string }) {
  return (
    <div className="font-mono text-xs leading-tight">
      {text.split("\n").map((line, i) => {
        const sectionLabel = line.match(/^\{([^}]+)\}$/);
        if (sectionLabel) {
          return (
            <div key={i} className="font-sans font-semibold text-gray-500 mt-3 mb-1">
              {sectionLabel[1]}
            </div>
          );
        }

        const { chordLine, lyric } = parseChordProLine(line);
        const hasChords = chordLine.trim().length > 0;
        return (
          <div key={i} className="whitespace-pre my-1.5">
            {hasChords && <div className="text-danger font-semibold">{chordLine}</div>}
            <div>{lyric || "\u00A0"}</div>
          </div>
        );
      })}
    </div>
  );
}
