import React, { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import ModalGuide from "./ModalGuide.js";
import {
  clearCanvas,
  drawCharacterWatermark,
  getCanvasPoint,
  hasCanvasInk,
  normalizedPoint,
  scoreCanvasAgainstCharacter,
  setupHiDPICanvas,
} from "../utils/canvasHelper.js";
import { getStrokeGuide } from "../strokeGuides.js";

const MAX_ATTEMPTS = 3;
const PASS_THRESHOLD = 0.68;

function useCanvasResize(canvasRef, watermarkRef, character) {
  useEffect(() => {
    const resize = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setupHiDPICanvas(canvasRef.current, rect.width, rect.height);
      if (watermarkRef.current) {
        drawCharacterWatermark(watermarkRef.current, character, 0.24);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvasRef.current?.parentElement || canvasRef.current);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef, watermarkRef, character]);
}

export default function WritingQuiz({ current, onAttempt, onNext }) {
  const canvasRef = useRef(null);
  const watermarkRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const strokeStartsRef = useRef([]);
  const [attempt, setAttempt] = useState(1);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [resolved, setResolved] = useState(false);

  const character = current?.correct || current?.char || "";
  const guide = getStrokeGuide(character);

  useCanvasResize(canvasRef, watermarkRef, character);

  const resetCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    clearCanvas(canvasRef.current, "#fff");
    const rect = canvasRef.current.getBoundingClientRect();
    setupHiDPICanvas(canvasRef.current, rect.width, rect.height);
    strokeStartsRef.current = [];
    lastPointRef.current = null;
    setHasDrawn(false);
    setFeedback(null);
  }, []);

  useEffect(() => {
    resetCanvas();
    setAttempt(1);
    setShowWatermark(false);
    setShowGuide(false);
    setChecking(false);
    setResolved(false);
  }, [character, resetCanvas]);

  const startDrawing = (event) => {
    if (checking || resolved || showGuide) return;
    event.preventDefault();
    const point = getCanvasPoint(event, canvasRef.current);
    drawingRef.current = true;
    lastPointRef.current = point;
    strokeStartsRef.current.push(normalizedPoint(point, canvasRef.current.clientWidth, canvasRef.current.clientHeight));
    setHasDrawn(true);
  };

  const moveDrawing = (event) => {
    if (!drawingRef.current || checking || resolved || showGuide) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getCanvasPoint(event, canvas);
    ctx.save();
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = Math.max(7, Math.min(12, canvas.clientWidth * 0.034));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();
    lastPointRef.current = point;
  };

  const endDrawing = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const calculateOrderScore = () => {
    if (!guide?.points?.length || !strokeStartsRef.current.length) return 0.5;
    const starts = strokeStartsRef.current;
    const expected = guide.points;
    const count = Math.min(starts.length, expected.length);
    if (!count) return 0;
    let total = 0;
    for (let i = 0; i < count; i += 1) {
      const dx = starts[i].x - expected[i][0];
      const dy = starts[i].y - expected[i][1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      total += Math.max(0, 1 - distance / 0.32);
    }
    const sequenceScore = total / expected.length;
    const countPenalty = Math.max(0, 1 - Math.abs(starts.length - expected.length) / Math.max(expected.length, 1));
    return sequenceScore * 0.75 + countPenalty * 0.25;
  };

  const celebrate = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      startVelocity: 32,
      origin: { y: 0.65 },
      disableForReducedMotion: true,
    });
  };

  const checkAnswer = async () => {
    if (checking || resolved || !hasDrawn || !hasCanvasInk(canvasRef.current)) return;
    setChecking(true);
    setFeedback(null);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    const raster = scoreCanvasAgainstCharacter(canvasRef.current, character);
    const order = calculateOrderScore();
    const finalScore = raster.score * 0.78 + order * 0.22;
    const isCorrect = finalScore >= PASS_THRESHOLD;
    setChecking(false);

    if (isCorrect) {
      setResolved(true);
      setFeedback({ type: "correct", score: finalScore });
      celebrate();
      onAttempt?.(true, { score: finalScore, attempt });
      return;
    }

    setFeedback({ type: "incorrect", score: finalScore });
    if (attempt === 1) {
      setAttempt(2);
      onAttempt?.(false, { attempt: 1 });
      return;
    }
    if (attempt === 2) {
      setAttempt(3);
      setShowWatermark(true);
      if (watermarkRef.current) drawCharacterWatermark(watermarkRef.current, character, 0.24);
      onAttempt?.(false, { attempt: 2 });
      return;
    }

    onAttempt?.(false, { attempt: 3, capped: true });
    setShowGuide(true);
  };

  const retryFromGuide = () => {
    setShowGuide(false);
    setAttempt(1);
    setShowWatermark(false);
    setResolved(false);
    onAttempt?.(null, { reset: true });
    resetCanvas();
  };

  const nextFromGuide = () => {
    setShowGuide(false);
    onNext?.();
  };

  return (
    <div className="writing-quiz">
      <div className="writing-quiz-status">
        <span className="writing-attempt-badge">Percobaan {attempt} / {MAX_ATTEMPTS}</span>
        <span className="writing-threshold">Akurasi minimum {Math.round(PASS_THRESHOLD * 100)}%</span>
      </div>

      <div className={`writing-canvas-wrap ${showGuide ? "is-locked" : ""}`}>
        <canvas ref={watermarkRef} className={`writing-watermark ${showWatermark ? "is-visible" : ""}`} aria-hidden="true" />
        <canvas
          ref={canvasRef}
          className="writing-draw-canvas"
          onPointerDown={startDrawing}
          onPointerMove={moveDrawing}
          onPointerUp={endDrawing}
          onPointerCancel={endDrawing}
          onPointerLeave={endDrawing}
          aria-label={`Canvas latihan menulis ${character}`}
        />
        <div className="writing-grid" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>

      <p className="writing-hint">
        Tulis <strong>{character}</strong> dengan satu atau beberapa goresan. Usahakan mengikuti bentuk dan arah penulisan.
      </p>

      <div className="writing-actions">
        <button type="button" className="writing-btn writing-btn-secondary" onClick={resetCanvas} disabled={checking || resolved || showGuide}>
          Hapus
        </button>
        <button type="button" className="writing-btn writing-btn-primary" onClick={checkAnswer} disabled={!hasDrawn || checking || resolved || showGuide}>
          {checking ? "Memeriksa..." : "Periksa Jawaban"}
        </button>
      </div>

      {feedback?.type === "incorrect" && attempt === 2 && (
        <div className="writing-toast writing-toast-error">Bentuk atau urutan goresan belum tepat. Silakan coba lagi!</div>
      )}
      {feedback?.type === "incorrect" && attempt === 3 && !showGuide && (
        <div className="writing-toast writing-toast-hint">Hampir tepat! Bayangan penuntun telah ditampilkan di latar canvas.</div>
      )}
      {feedback?.type === "correct" && (
        <div className="writing-toast writing-toast-success">Benar! +XP 🎉</div>
      )}

      <ModalGuide character={character} open={showGuide} onRetry={retryFromGuide} onNext={nextFromGuide} />
    </div>
  );
}

export { MAX_ATTEMPTS, PASS_THRESHOLD };
