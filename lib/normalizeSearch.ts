/**
 * Normalise une chaîne pour la recherche : minuscules, accents retirés,
 * ponctuation ignorée. "Alléluia, Le Seigneur règne", "ALLELUIA - le
 * seigneur regne" et "alleluia le seigneur regne" deviennent tous
 * équivalents — un espace mal placé ou une virgule oubliée ne doit
 * jamais empêcher un chant de ressortir dans la recherche.
 */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les diacritiques (accents)
    .replace(/[.,;:!?'"()\-–—/\\]/g, " ") // ponctuation -> espace, jamais collée
    .replace(/\s+/g, " ") // espaces multiples -> un seul
    .trim();
}