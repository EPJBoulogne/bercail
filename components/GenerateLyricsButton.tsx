"use client";

import { useState } from "react";

type Item = { title: string; key: string; lyrics: string | null };

export function GenerateLyricsButton({
  setlistName,
  items,
}: {
  setlistName: string;
  items: Item[];
}) {
  const [generating, setGenerating] = useState(false);

  async function handleClick() {
    setGenerating(true);

    const previewWindow = window.open("", "_blank");

    const { jsPDF } = await import("jspdf");

    const fix = (t: string) => t.replace(/œ/g, "oe").replace(/Œ/g, "OE");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 46,
      gap = 26,
      bottom = 40;
    const colW = (pageW - 2 * margin - gap) / 2;
    const leftX = margin,
      rightX = margin + colW + gap;
    const midX = margin + colW + gap / 2;
    const pageCenter = pageW / 2;

    const anyMissing = items.some((i) => !i.lyrics);
    const noteText = anyMissing
      ? "Certains chants n'ont pas encore de paroles enregistrées dans Bercail — non inclus ci-dessous."
      : "Paroles issues de Bercail.";

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(noteText, pageW - 2 * margin);
    const headerTop = 40;
    const titleLineH = 18;
    const titleBlockBottom = headerTop + titleLineH + noteLines.length * 10 + 16;
    const plainTop = 60;

    let pageNum = 0,
      col = 0,
      x = leftX,
      y = 0,
      colTop = 0;

    function drawFurniture(hasTitle: boolean) {
      pageNum++;
      colTop = hasTitle ? titleBlockBottom : plainTop;
      doc.setDrawColor(0);
      doc.setLineWidth(1);
      doc.line(midX, colTop, midX, pageH - bottom);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(String(pageNum), margin, headerTop - 12);
      y = colTop;
      col = 0;
      x = leftX;
    }
    function newPage() {
      doc.addPage();
      drawFurniture(false);
    }
    function ensureSpace(h: number) {
      if (y + h > pageH - bottom) {
        if (col === 0) {
          col = 1;
          x = rightX;
          y = colTop;
        } else newPage();
      }
    }

    // Mesure la hauteur totale qu'un chant va occuper (titre, gamme,
    // toutes ses lignes de paroles), pour pouvoir décider de sauter à
    // la colonne/page suivante AVANT de commencer à l'imprimer, plutôt
    // que de le couper en plein milieu.
    function measureItemHeight(item: Item): number {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const titleLineCount = doc.splitTextToSize(fix(item.title), colW).length;
      let h = titleLineCount * 13 + 4 + 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      (item.lyrics ?? "").split("\n").forEach((rawLine) => {
        const wrappedCount = doc.splitTextToSize(fix(rawLine) || " ", colW).length;
        h += wrappedCount * 13;
      });
      h += 8;
      return h;
    }

    drawFurniture(true);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(fix(setlistName), pageCenter, headerTop, { align: "center" });
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(noteLines, pageCenter, headerTop + titleLineH, { align: "center" });
    doc.setTextColor(0);

    items
      .filter((i) => i.lyrics)
      .forEach((item) => {
        const neededHeight = measureItemHeight(item);
        const columnHeight = pageH - bottom - colTop;

        // Le chant tient dans une colonne fraîche mais pas dans l'espace
        // restant ici : on saute directement plutôt que de le couper.
        if (y + neededHeight > pageH - bottom && neededHeight <= columnHeight) {
          if (col === 0) {
            col = 1;
            x = rightX;
            y = colTop;
          } else {
            newPage();
          }
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        const titleLines: string[] = doc.splitTextToSize(fix(item.title), colW);
        let lastTitleY = y;
        let lastTitleLine = "";
        titleLines.forEach((tLine) => {
          ensureSpace(16);
          doc.text(tLine, x, y);
          lastTitleY = y;
          lastTitleLine = tLine;
          y += 13;
        });
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.line(x, lastTitleY + 3, x + doc.getTextWidth(lastTitleLine), lastTitleY + 3);
        y += 4;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(100);
        ensureSpace(11);
        doc.text("Gamme : " + item.key, x, y);
        y += 12;
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);

        (item.lyrics ?? "").split("\n").forEach((rawLine) => {
          const wrapped: string[] = doc.splitTextToSize(fix(rawLine) || " ", colW);
          wrapped.forEach((wLine) => {
            ensureSpace(13);
            doc.text(wLine, x, y);
            y += 13;
          });
        });
        y += 8;
      });

    const blobUrl = doc.output("bloburl") as unknown as string;

    if (previewWindow) {
      previewWindow.location.href = blobUrl;
    } else {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${setlistName.replace(/[^a-z0-9]+/gi, "_") || "liste"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setGenerating(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={generating}
      className="text-sm bg-accent text-white rounded-md px-3 py-2 disabled:opacity-60"
    >
      {generating ? "Génération…" : "Générer les paroles"}
    </button>
  );
}