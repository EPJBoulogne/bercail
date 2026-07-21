/**
 * Conversion entre le format de portail.yt et le ChordPro de Bercail.
 *
 * Format portail.yt (observé sur de vrais chants via /accords/api/) :
 *   - (Accord)  : accord placé juste avant la syllabe où il se joue
 *   - [Étiquette] : titre de section en clair, ex "[COUPLET A]",
 *     "[ REFRAIN 1 ]" — jamais un accord, portail.yt réserve toujours
 *     les parenthèses aux accords, donc tout ce qui est entre crochets
 *     dans leur texte est structurellement une étiquette, jamais une
 *     ambiguïté à deviner.
 *   - %         : sépare les sections (couplet/refrain)
 *   - \r\n      : retour à la ligne
 *
 * Format ChordPro de Bercail :
 *   - [Accord]  : accord placé juste avant la syllabe où il se joue
 *   - {Étiquette} : titre de section (accolades, pas crochets — pour ne
 *     jamais entrer en conflit avec la syntaxe d'accord ci-dessus)
 *   - une ligne vide sépare les paragraphes/sections
 */
export function convertPortailTextToChordPro(text: string): string {
  const sections = text.split(/\r?\n?%\r?\n?/);

  const blocks = sections.map((section) => {
    const lines = section
      .trim()
      .split(/\r\n|\n|\r/)
      .map((line) => {
        // [Étiquette] -> {Étiquette} en premier : dans le format
        // portail.yt, tout crochet est une étiquette de section, jamais
        // un accord (leurs accords sont toujours entre parenthèses).
        // Fait AVANT la conversion des accords pour ne jamais confondre
        // les deux syntaxes une fois converties.
        let converted = line.replace(/\[([^\]]+)\]/g, "{$1}");
        // (Accord) -> [Accord]. "*" et non "+" : les parenthèses vides
        // "()" (marqueur technique observé sur d'anciens chants) n'ont
        // AUCUN caractère à l'intérieur — "+" (un caractère minimum)
        // les laissait passer inchangées, c'était le bug.
        converted = converted.replace(/\(([^)]*)\)/g, "[$1]");
        // Les parenthèses vides deviennent donc "[]" ci-dessus : on les
        // retire, où qu'elles apparaissent sur la ligne (pas seulement
        // en tout début).
        converted = converted.replace(/\[\]/g, "");
        return converted;
      });
    return lines.join("\n");
  });

  return blocks.join("\n\n").trim();
}
