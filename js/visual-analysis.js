// Análise visual leve no navegador: composição, luminância, complexidade e safe areas.
// A camada semântica decide "o que" a imagem significa; aqui decidimos "onde" o texto pode viver.

const REGION_NAMES = [
  ['upper-left', 'upper', 'upper-right'],
  ['left', 'center', 'right'],
  ['lower-left', 'lower', 'lower-right']
];

const REGION_CENTERS = Object.freeze({
  'upper-left': { x: 1 / 6, y: 1 / 6 },
  upper: { x: 0.5, y: 1 / 6 },
  'upper-right': { x: 5 / 6, y: 1 / 6 },
  left: { x: 1 / 6, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  right: { x: 5 / 6, y: 0.5 },
  'lower-left': { x: 1 / 6, y: 5 / 6 },
  lower: { x: 0.5, y: 5 / 6 },
  'lower-right': { x: 5 / 6, y: 5 / 6 }
});

function clamp(n, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function distance(a = { x: 0.5, y: 0.5 }, b = { x: 0.5, y: 0.5 }) {
  return Math.hypot(Number(a.x) - Number(b.x), Number(a.y) - Number(b.y));
}

export const VISUAL_PIXEL_TIMEOUT_MS = 2500;

async function loadBitmap(
  url,
  timeoutMs = VISUAL_PIXEL_TIMEOUT_MS
) {
  if (!url || typeof Image === 'undefined') return null;

  return await new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let done = false;

    const finish = value => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);
    img.onload = () => finish(img.naturalWidth ? img : null);
    img.onerror = () => finish(null);
    img.src = url;
  });
}

function regionStats(gray, w, h, x0, y0, x1, y1) {
  let sum = 0;
  let sumSq = 0;
  let edges = 0;
  let n = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * w + x;
      const value = gray[i];
      sum += value;
      sumSq += value * value;
      n++;

      if (x + 1 < x1 && Math.abs(value - gray[i + 1]) > 24) edges++;
      if (y + 1 < y1 && Math.abs(value - gray[i + w]) > 24) edges++;
    }
  }

  const mean = n ? sum / n : 0;
  const variance = n ? Math.max(0, sumSq / n - mean * mean) : 0;

  return {
    mean: mean / 255,
    variance: Math.sqrt(variance) / 128,
    edgeDensity: edges / Math.max(1, n * 2)
  };
}

export function inferFocalPointFromRegions(regions = []) {
  if (!regions.length) return { x: 0.5, y: 0.5 };

  const ranked = [...regions].sort((a, b) => {
    const aScore = Number(a.saliencyScore ?? a.saliency ?? 0);
    const bScore = Number(b.saliencyScore ?? b.saliency ?? 0);

    if (Math.abs(bScore - aScore) > 0.0001) return bScore - aScore;

    const center = { x: 0.5, y: 0.5 };
    return distance(
      { x: Number(a.x ?? 0.5), y: Number(a.y ?? 0.5) },
      center
    ) - distance(
      { x: Number(b.x ?? 0.5), y: Number(b.y ?? 0.5) },
      center
    );
  });

  return {
    x: clamp(Number(ranked[0].x ?? 0.5)),
    y: clamp(Number(ranked[0].y ?? 0.5))
  };
}

function estimateSourceFocalPoint(img) {
  if (typeof document === 'undefined') return { x: 0.5, y: 0.5 };

  const width = 96;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { x: 0.5, y: 0.5 };

  try {
    ctx.drawImage(img, 0, 0, width, height);
  } catch {
    return { x: 0.5, y: 0.5 };
  }

  let data;
  try {
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return { x: 0.5, y: 0.5 };
  }

  const gray = new Float32Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] =
      data[i] * 0.2126 +
      data[i + 1] * 0.7152 +
      data[i + 2] * 0.0722;
  }

  const regions = [];

  for (let ry = 0; ry < 3; ry++) {
    for (let rx = 0; rx < 3; rx++) {
      const x0 = Math.floor(rx * width / 3);
      const x1 = Math.floor((rx + 1) * width / 3);
      const y0 = Math.floor(ry * height / 3);
      const y1 = Math.floor((ry + 1) * height / 3);

      const stats = regionStats(gray, width, height, x0, y0, x1, y1);
      const saliencyScore =
        stats.variance * 0.45 +
        stats.edgeDensity * 2.4;

      regions.push({
        name: REGION_NAMES[ry][rx],
        x: (rx + 0.5) / 3,
        y: (ry + 0.5) / 3,
        saliencyScore
      });
    }
  }

  return inferFocalPointFromRegions(regions);
}

function drawCover(ctx, img, width, height, focal = { x: 0.5, y: 0.5 }) {
  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;
  if (!sourceWidth || !sourceHeight) return false;

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const cropWidth = width / scale;
  const cropHeight = height / scale;

  const sx = clamp(
    sourceWidth * Number(focal.x ?? 0.5) - cropWidth / 2,
    0,
    Math.max(0, sourceWidth - cropWidth)
  );
  const sy = clamp(
    sourceHeight * Number(focal.y ?? 0.5) - cropHeight / 2,
    0,
    Math.max(0, sourceHeight - cropHeight)
  );

  ctx.drawImage(
    img,
    sx,
    sy,
    cropWidth,
    cropHeight,
    0,
    0,
    width,
    height
  );

  return true;
}

export function scoreSafeRegions(
  regions = [],
  focalPoint = { x: 0.5, y: 0.5 },
  preferredAreas = []
) {
  const preferred = new Set(preferredAreas || []);

  return regions
    .map(region => {
      const center = REGION_CENTERS[region.name] || { x: 0.5, y: 0.5 };
      const focalDistance = distance(center, focalPoint);
      const subjectPenalty = Math.max(0, 1 - focalDistance / 0.62) * 0.24;
      const lowComplexity = 1 - clamp(region.complexity ?? 0.5);
      const darkness = 1 - clamp(region.luminance ?? 0.5);
      const curatedBonus = preferred.has(region.name) ? 0.14 : 0;

      const safe = clamp(
        lowComplexity * 0.72 +
        darkness * 0.12 +
        curatedBonus -
        subjectPenalty
      );

      return {
        ...region,
        safe,
        focalDistance,
        preferred: preferred.has(region.name)
      };
    })
    .sort((a, b) => {
      if (Math.abs(b.safe - a.safe) > 0.0001) return b.safe - a.safe;
      if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
      return b.focalDistance - a.focalDistance;
    });
}

export function chooseSafeAreas(
  regions = [],
  focalPoint = { x: 0.5, y: 0.5 },
  preferredAreas = [],
  { threshold = 0.5, limit = 4 } = {}
) {
  const ranked = scoreSafeRegions(regions, focalPoint, preferredAreas);
  const accepted = ranked
    .filter(region => region.safe >= threshold)
    .slice(0, limit)
    .map(region => region.name);

  return {
    areas: accepted.length ? accepted : ranked.slice(0, 1).map(region => region.name),
    ranked
  };
}

function analyzeFrame(img, width, height, focalPoint, preferredAreas = []) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    if (!drawCover(ctx, img, width, height, focalPoint)) return null;
  } catch {
    return null;
  }

  let data;
  try {
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }

  const gray = new Float32Array(width * height);
  let total = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g =
      data[i] * 0.2126 +
      data[i + 1] * 0.7152 +
      data[i + 2] * 0.0722;

    gray[p] = g;
    total += g;
  }

  const avg = total / (width * height * 255);
  const rawRegions = [];
  let saliency = { score: -1, x: 0.5, y: 0.5 };

  for (let ry = 0; ry < 3; ry++) {
    for (let rx = 0; rx < 3; rx++) {
      const x0 = Math.floor(rx * width / 3);
      const x1 = Math.floor((rx + 1) * width / 3);
      const y0 = Math.floor(ry * height / 3);
      const y1 = Math.floor((ry + 1) * height / 3);

      const stats = regionStats(gray, width, height, x0, y0, x1, y1);
      const complexity = clamp(
        stats.variance * 0.58 +
        stats.edgeDensity * 2.1
      );

      rawRegions.push({
        name: REGION_NAMES[ry][rx],
        complexity,
        luminance: stats.mean
      });

      const saliencyScore =
        stats.variance * 0.45 +
        stats.edgeDensity * 2.4;

      if (saliencyScore > saliency.score) {
        saliency = {
          score: saliencyScore,
          x: (rx + 0.5) / 3,
          y: (ry + 0.5) / 3
        };
      }
    }
  }

  // Se já existe focal point humano/curado, ele é a melhor aproximação do assunto.
  // Caso contrário, usamos a região mais saliente detectada.
  const subjectPoint = focalPoint || { x: saliency.x, y: saliency.y };
  const safe = chooseSafeAreas(rawRegions, subjectPoint, preferredAreas);
  const bestSafe = safe.ranked[0]?.safe ?? 0.5;
  const globalComplexity =
    rawRegions.reduce((sum, region) => sum + region.complexity, 0) /
    Math.max(1, rawRegions.length);

  const compositionScore = clamp(
    0.48 +
    bestSafe * 0.34 +
    (safe.areas.length >= 2 ? 0.08 : 0) -
    Math.max(0, globalComplexity - 0.72) * 0.16
  );

  return {
    safeTextAreas: safe.areas,
    rankedRegions: safe.ranked,
    saliency,
    averageLuminance: avg,
    complexity: globalComplexity,
    bestSafeArea: safe.ranked[0]?.name || 'center',
    bestSafeScore: bestSafe,
    compositionScore
  };
}

export async function analyzeCandidateVisual(candidate) {
  if (typeof document === 'undefined') return candidate;

  const img = await loadBitmap(candidate.previewUrl || candidate.imageUrl);
  if (!img) return candidate;

  const inferredFocal = candidate.focalPoint || estimateSourceFocalPoint(img);
  const derivedFocal = inferredFocal || { x: 0.5, y: 0.5 };
  const derivedTabletFocal =
    candidate.tabletFocalPoint ||
    candidate.mobileFocalPoint ||
    candidate.focalPoint ||
    inferredFocal ||
    { x: 0.5, y: 0.5 };
  const derivedMobileFocal =
    candidate.mobileFocalPoint ||
    candidate.tabletFocalPoint ||
    candidate.focalPoint ||
    inferredFocal ||
    { x: 0.5, y: 0.5 };

  const desktop = analyzeFrame(
    img,
    96,
    54,
    derivedFocal,
    candidate.curationConfidence ? candidate.safeTextAreas : []
  );

  const tablet = analyzeFrame(
    img,
    72,
    96,
    derivedTabletFocal,
    candidate.tabletSafeTextAreas ||
      (candidate.curationConfidence
        ? candidate.safeTextAreas
        : [])
  );

  const mobile = analyzeFrame(
    img,
    54,
    96,
    derivedMobileFocal,
    candidate.mobileSafeTextAreas || []
  );

  if (!desktop && !tablet && !mobile) return candidate;

  const desktopSafe =
    desktop?.safeTextAreas?.length
      ? desktop.safeTextAreas
      : (candidate.safeTextAreas || ['center']);

  const tabletSafe =
    tablet?.safeTextAreas?.length
      ? tablet.safeTextAreas
      : (
          candidate.tabletSafeTextAreas ||
          candidate.safeTextAreas ||
          desktopSafe
        );

  const mobileSafe =
    mobile?.safeTextAreas?.length
      ? mobile.safeTextAreas
      : (
          candidate.mobileSafeTextAreas ||
          tabletSafe ||
          desktopSafe
        );

  const compositionFrames = [
    [desktop, 0.45],
    [tablet, 0.25],
    [mobile, 0.30]
  ].filter(([frame]) => Boolean(frame));

  const compositionWeight = compositionFrames.reduce(
    (sum, [, weight]) => sum + weight,
    0
  );

  const measuredComposition = compositionFrames.length
    ? compositionFrames.reduce(
        (sum, [frame, weight]) =>
          sum + frame.compositionScore * weight,
        0
      ) / compositionWeight
    : 0.76;

  return {
    ...candidate,
    width: candidate.width || img.naturalWidth,
    height: candidate.height || img.naturalHeight,
    safeTextAreas: desktopSafe,
    tabletSafeTextAreas: tabletSafe,
    mobileSafeTextAreas: mobileSafe,
    focalPoint: derivedFocal,
    tabletFocalPoint: derivedTabletFocal,
    mobileFocalPoint: derivedMobileFocal,
    compositionScore:
      typeof candidate.compositionScore === 'number'
        ? clamp(candidate.compositionScore * 0.42 + measuredComposition * 0.58)
        : measuredComposition,
    technicalAnalysis: {
      focalSource: candidate.focalPoint ? 'provided' : 'source-saliency',
      averageLuminance: desktop?.averageLuminance ?? mobile?.averageLuminance ?? 0.5,
      complexity: desktop?.complexity ?? mobile?.complexity ?? 0.5,
      bestSafeArea: desktop?.bestSafeArea || desktopSafe[0] || 'center',
      bestSafeScore: desktop?.bestSafeScore ?? 0.5,
      desktop: desktop
        ? {
            averageLuminance: desktop.averageLuminance,
            complexity: desktop.complexity,
            bestSafeArea: desktop.bestSafeArea,
            bestSafeScore: desktop.bestSafeScore
          }
        : null,
      tablet: tablet
        ? {
            averageLuminance: tablet.averageLuminance,
            complexity: tablet.complexity,
            bestSafeArea: tablet.bestSafeArea,
            bestSafeScore: tablet.bestSafeScore
          }
        : null,
      mobile: mobile
        ? {
            averageLuminance: mobile.averageLuminance,
            complexity: mobile.complexity,
            bestSafeArea: mobile.bestSafeArea,
            bestSafeScore: mobile.bestSafeScore
          }
        : null
    }
  };
}

export async function analyzeShortlist(candidates, limit = 5) {
  return await Promise.all(
    candidates
      .slice(0, limit)
      .map(candidate => analyzeCandidateVisual(candidate))
  );
}