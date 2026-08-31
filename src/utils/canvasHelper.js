/**
 * High-DPI canvas helpers used by WritingQuiz.
 * Coordinates returned by getCanvasPoint are always in CSS pixels, so drawing
 * logic stays identical on normal and Retina/Android high-DPI screens.
 */
export function setupHiDPICanvas(canvas, cssWidth = null, cssHeight = null) {
  if (!canvas) return { width: 0, height: 0, dpr: 1 };

  const rect = canvas.getBoundingClientRect();
  const width = cssWidth ?? rect.width;
  const height = cssHeight ?? rect.height;
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 4));

  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { width, height, dpr };
}

export function getCanvasPoint(event, canvas) {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  const clientX = touch?.clientX ?? event.clientX;
  const clientY = touch?.clientY ?? event.clientY;

  return {
    x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, clientY - rect.top)),
  };
}

export function clearCanvas(canvas, fill = "#fff") {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

export function normalizedPoint(point, width, height) {
  return {
    x: width ? point.x / width : 0,
    y: height ? point.y / height : 0,
  };
}

export function drawCharacterWatermark(canvas, character, opacity = 0.24) {
  if (!canvas || !character) return;
  const rect = canvas.getBoundingClientRect();
  const { width, height } = setupHiDPICanvas(canvas, rect.width || 280, rect.height || 280);
  const ctx = canvas.getContext("2d");
  clearCanvas(canvas, "rgba(255,255,255,0)");

  ctx.save();
  ctx.globalAlpha = Math.max(0.2, Math.min(0.3, opacity));
  ctx.fillStyle = "#9ca3af";
  ctx.font = `${Math.floor(Math.min(width, height) * 0.72)}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(character, width / 2, height / 2 + height * 0.025);
  ctx.restore();
}

export function hasCanvasInk(canvas, alphaThreshold = 18) {
  if (!canvas) return false;
  const ctx = canvas.getContext("2d");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < image.length; i += 4) {
    if (image[i] > alphaThreshold) return true;
  }
  return false;
}

/**
 * Raster similarity score. Returns 0..1. The target glyph is rendered with the
 * browser's Japanese font and compared on a small grid, which makes the check
 * tolerant of small offsets and different screen densities.
 */
export function scoreCanvasAgainstCharacter(canvas, character) {
  if (!canvas || !character) return { score: 0, iou: 0, coverage: 0 };

  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, Math.round(rect.width));
  const cssHeight = Math.max(1, Math.round(rect.height));
  const sample = document.createElement("canvas");
  sample.width = cssWidth;
  sample.height = cssHeight;
  const sctx = sample.getContext("2d", { willReadFrequently: true });
  sctx.fillStyle = "#fff";
  sctx.fillRect(0, 0, cssWidth, cssHeight);

  const src = canvas.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, cssWidth, cssHeight);

  const reference = document.createElement("canvas");
  reference.width = cssWidth;
  reference.height = cssHeight;
  const rctx = reference.getContext("2d", { willReadFrequently: true });
  rctx.fillStyle = "#fff";
  rctx.fillRect(0, 0, cssWidth, cssHeight);
  rctx.fillStyle = "#111";
  rctx.font = `${Math.floor(Math.min(cssWidth, cssHeight) * 0.72)}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif`;
  rctx.textAlign = "center";
  rctx.textBaseline = "middle";
  rctx.fillText(character, cssWidth / 2, cssHeight / 2 + cssHeight * 0.025);

  const u = sctx.getImageData(0, 0, cssWidth, cssHeight).data;
  const r = rctx.getImageData(0, 0, cssWidth, cssHeight).data;
  const grid = 32;
  let both = 0;
  let either = 0;
  let referenceInk = 0;
  let userInk = 0;

  const ink = (data, x, y) => {
    const i = (y * cssWidth + x) * 4;
    return data[i] < 210 || data[i + 1] < 210 || data[i + 2] < 210;
  };

  for (let gy = 0; gy < grid; gy += 1) {
    for (let gx = 0; gx < grid; gx += 1) {
      let ui = false;
      let ri = false;
      for (let sy = 0; sy < 2; sy += 1) {
        for (let sx = 0; sx < 2; sx += 1) {
          const x = Math.min(cssWidth - 1, Math.floor((gx + (sx + 0.5) / 2) * cssWidth / grid));
          const y = Math.min(cssHeight - 1, Math.floor((gy + (sy + 0.5) / 2) * cssHeight / grid));
          ui ||= ink(u, x, y);
          ri ||= ink(r, x, y);
        }
      }
      if (ui) userInk += 1;
      if (ri) referenceInk += 1;
      if (ui && ri) both += 1;
      if (ui || ri) either += 1;
    }
  }

  const iou = either ? both / either : 0;
  const coverage = referenceInk ? both / referenceInk : 0;
  const userCoverage = referenceInk ? Math.min(1, userInk / referenceInk) : 0;
  const score = Math.max(0, Math.min(1, iou * 0.62 + coverage * 0.30 + Math.min(userCoverage, 1) * 0.08));

  return { score, iou, coverage };
}
