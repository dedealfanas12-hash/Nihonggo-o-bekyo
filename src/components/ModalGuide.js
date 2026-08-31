import React, { useEffect, useRef } from "react";
import HanziWriter from "hanzi-writer";
import { getStrokeGuide } from "../strokeGuides.js";

export default function ModalGuide({ character, open, onRetry, onNext }) {
  const writerHostRef = useRef(null);
  const writerRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const guide = getStrokeGuide(character);

  useEffect(() => {
    if (!open || !character || !writerHostRef.current) return undefined;

    writerHostRef.current.innerHTML = "";
    let writer;
    try {
      writer = HanziWriter.create(writerHostRef.current, character, {
        width: 220,
        height: 220,
        padding: 10,
        showCharacter: false,
        showOutline: true,
        strokeAnimationSpeed: 0.8,
        strokeHighlightSpeed: 1.5,
        delayBetweenStrokes: 650,
        strokeColor: "#57534e",
        outlineColor: "#e7e5e4",
        highlightColor: "#dc2626",
        drawingColor: "#b91c1c",
        renderer: "svg",
        onLoadCharDataError: () => {
          if (writerHostRef.current) writerHostRef.current.dataset.fallback = "true";
        },
      });
      writerRef.current = writer;
      writer.animateCharacter({ onComplete: () => {} });
    } catch {
      if (writerHostRef.current) writerHostRef.current.dataset.fallback = "true";
    }

    // Hanzi Writer is designed around Chinese character data. Japanese kana may
    // not exist in its dataset, so the existing project guide is retained as a
    // graceful fallback instead of breaking the modal.
    fallbackTimerRef.current = window.setTimeout(() => {
      if (writerHostRef.current && !writerHostRef.current.querySelector("svg")) {
        writerHostRef.current.dataset.fallback = "true";
      }
    }, 1200);

    return () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
      try { writerRef.current?.cancelQuiz?.(); } catch {}
      writerRef.current = null;
      if (writerHostRef.current) writerHostRef.current.innerHTML = "";
    };
  }, [open, character]);

  if (!open) return null;

  return (
    <div className="writing-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="writing-guide-title">
      <div className="writing-modal">
        <div className="writing-modal-header">
          <div>
            <p className="writing-modal-eyebrow">Stroke Order Guide</p>
            <h2 id="writing-guide-title">Panduan Cara Menulis Huruf {character}</h2>
          </div>
          <span className="writing-modal-character">{character}</span>
        </div>

        <div className="writing-animation-card">
          <div ref={writerHostRef} className="hanzi-writer-host" aria-label={`Animasi urutan goresan ${character}`} />
          <div className="hanzi-fallback" aria-hidden="true">
            <div className="hanzi-fallback-char">{character}</div>
            <p>Ikuti arah dan urutan goresan pada panduan di bawah.</p>
          </div>
        </div>

        {guide?.steps?.length > 0 && (
          <ol className="writing-guide-steps">
            {guide.steps.map((step, index) => (
              <li key={`${character}-${index}`}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        )}

        <div className="writing-modal-actions">
          <button type="button" className="writing-btn writing-btn-secondary" onClick={onRetry}>
            Coba Lagi
          </button>
          <button type="button" className="writing-btn writing-btn-primary" onClick={onNext}>
            Lanjut Soal Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
