/**
 * Normalise une chaîne pour la recherche : minuscules, accents retirés,
 * toute ponctuation ignorée (apostrophes, guillemets, tirets — quelle que
 * soit leur variante typographique). "Alléluia, Le Seigneur règne",
 * "ALLELUIA - le seigneur regne" et "c'est auprès de Dieu" / "c'est auprès
 * de Dieu" (avec une apostrophe différente) deviennent tous équivalents.
 */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les diacritiques (accents)
    .replace(/[\p{P}\p{S}]/gu, " ") // toute ponctuation/symbole -> espace, quelle que soit sa variante Unicode
    .replace(/\s+/g, " ") // espaces multiples -> un seul
    .trim();
}