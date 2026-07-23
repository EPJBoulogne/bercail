"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { ChordProView } from "@/components/ChordProView";
import { updateReferenceUrl } from "@/app/(app)/repertoire/actions";

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }
    const previous = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (previous) previous();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

export function SongViewButton({
  songId,
  title,
  chords,
  referenceUrl,
  portailRef,
}: {
  songId: string;
  title: string;
  chords: string | null;
  referenceUrl: string | null;
  portailRef?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const [linkValue, setLinkValue] = useState(referenceUrl ?? "");
  const [currentLink, setCurrentLink] = useState(referenceUrl);
  const [pending, startTransition] = useTransition();
  const [isPlaying, setIsPlaying] = useState(false);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const videoId = currentLink ? extractYoutubeId(currentLink) : null;
  const portailUrl = portailRef
    ? "https://portail.yt/accords/songs_detail.php?ref=" + portailRef
    : null;

  useEffect(() => {
    if (!open || !videoId) return;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !playerContainerRef.current) return;
      playerRef.current = new (window as any).YT.Player(playerContainerRef.current, {
        videoId,
        playerVars: { playsinline: 1 },
        events: {
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [open, videoId]);

  if (!chords) return null;

  function togglePlay() {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  function saveLink() {
    const formData = new FormData();
    formData.set("songId", songId);
    formData.set("referenceUrl", linkValue.trim());
    startTransition(async () => {
      await updateReferenceUrl(formData);
      setCurrentLink(linkValue.trim() || null);
      setEditingLink(false);
    });
  }

  function renderReferenceSlot() {
    if (editingLink) {
      return (
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            autoFocus
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          />
          <button
            onClick={saveLink}
            disabled={pending}
            className="text-xs bg-accent text-white rounded-md px-2.5 py-1.5 disabled:opacity-60"
          >
            OK
          </button>
        </div>
      );
    }

    if (!currentLink) {
      return (
        <div className="px-3 py-2">
          <button
            onClick={() => setEditingLink(true)}
            className="text-xs text-accent underline"
          >
            + Ajouter un lien YouTube
          </button>
        </div>
      );
    }

    if (!videoId) {
      return (
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <a
            href={currentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5"
          >
            Ouvrir le lien ↗
          </a>
          <button
            onClick={() => {
              setLinkValue(currentLink);
              setEditingLink(true);
            }}
            className="text-xs text-gray-500 underline"
          >
            Modifier
          </button>
        </div>
      );
    }

    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-md bg-black text-white text-xs flex items-center justify-center flex-shrink-0"
          >
            {isPlaying ? "Pause" : "▶"}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-gray-500 m-0">Vidéo de référence</p>
            <p className="text-xs text-gray-400 m-0">
              {isPlaying ? "En cours" : "En pause"}
            </p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 flex-shrink-0"
          >
            {expanded ? "Reduire" : "Voir"}
          </button>
          <button
            onClick={() => {
              setLinkValue(currentLink);
              setEditingLink(true);
            }}
            className="text-xs text-gray-500 underline flex-shrink-0"
          >
            Modifier
          </button>
        </div>

        <div
          className={
            expanded
              ? "aspect-video rounded-md overflow-hidden bg-black mt-2"
              : "w-0 h-0 overflow-hidden"
          }
        >
          <div ref={playerContainerRef} className="w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={"Ouvrir " + title}
        title={"Ouvrir " + title}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-sm flex-shrink-0"
      >
        ♪
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-display text-lg font-semibold truncate">{title}</h2>
              {portailUrl && (
                <a
                  href={portailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Voir sur portail.yt"
                  title="Voir sur portail.yt"
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-xs flex-shrink-0"
                >
                  ↗
                </a>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              <div className={expanded ? "" : "sticky top-0 z-10 bg-white border-b border-gray-100"}>
                {renderReferenceSlot()}
              </div>
              <div className="bg-gray-50 mx-5 my-4 rounded-md p-3 overflow-x-auto">
                <ChordProView text={chords} />
              </div>
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="bg-accent text-white text-sm rounded-md px-3 py-2"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}