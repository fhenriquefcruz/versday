// js/visualAnalysis.js
// Análise visual leve dos finalistas: luminância, complexidade, safe areas e focal point.
// Não tenta interpretar teologia pela imagem; isso fica na camada semântica.

const REGION_NAMES = [
  ['upper-left','upper','upper-right'],
  ['left','center','right'],
  ['lower-left','lower','lower-right']
];

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

async function loadImage(url, timeoutMs = 4200) {
  if (!url || typeof Image === 'undefined') return null;
  return new Promise(resolve => {
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

function regionStats(gray, width, height, x0, y0, x1, y1) {
  let sum = 0;
  let sumSq = 0;
  let edges = 0;
  let count = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * width + x;
      const value = gray[i];
      sum += value;
      sumSq += value * value;
      count++;

      if (x + 1 < x1 && Math.abs(value - gray[i + 1]) > 24) edges++;
      if (y + 1 < y1 && Math.abs(value - gray[i + width]) > 24) edges++;
    }
  }

  const mean = count ? sum / count : 0;
  const variance = count ? Math.max(0, sumSq / count - mean * mean) : 0;

  return {
    mean: mean / 255,
    variance: Math.sqrt(variance) / 128,
    edgeDensity: edges / Math.max(1, count * 2)
  };
}

function textContrastPotential(luminance) {
  // Fundos muito médios são mais difíceis; extremos permitem texto claro/escuro.
  return clamp(Math.abs(luminance - 0.5) * 1.65 + 0.28);
}

export async function analyzeCandidateVisual(candidate) {
  if (typeof document === 'undefined') return candidate;
  const img = await loadImage(candidate.previewUrl || candidate.imageUrl);
  if (!img) return candidate;

  const width = 96;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently:true });
  if (!ctx) return candidate;

  try {
    ctx.drawImage(img, 0, 0, width, height);
  } catch {
    return candidate;
  }

  let data;
  try {
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return candidate;
  }

  const gray = new Float32Array(width * height);
  let total = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
    gray[p] = g;
    total += g;
  }

  const averageLuminance = total / (width * height * 255);
  const regions = [];
  let saliency = { score:-1, x:0.5, y:0.5 };

  for (let ry = 0; ry < 3; ry++) {
    for (let rx = 0; rx < 3; rx++) {
      const x0 = Math.floor(rx * width / 3);
      const x1 = Math.floor((rx + 1) * width / 3);
      const y0 = Math.floor(ry * height / 3);
      const y1 = Math.floor((ry + 1) * height / 3);
      const stats = regionStats(gray, width, height, x0, y0, x1, y1);
      const complexity = clamp(stats.variance * 0.58 + stats.edgeDensity * 2.1);
      const contrastPotential = textContrastPotential(stats.mean);
      const safe = clamp((1 - complexity) * 0.72 + contrastPotential * 0.28);

      regions.push({
        name: REGION_NAMES[ry][rx],
        safe,
        complexity,
        luminance: stats.mean
      });

      const saliencyScore = stats.variance * 0.42 + stats.edgeDensity * 2.45;
      if (saliencyScore > saliency.score) {
        saliency = {
          score: saliencyScore,
          x: (rx + 0.5) / 3,
          y: (ry + 0.5) / 3
        };
      }
    }
  }

  regions.sort((a,b) => b.safe - a.safe);
  const safeTextAreas = regions.filter(region => region.safe >= 0.58).slice(0, 4).map(region => region.name);
  const bestSafeScore = regions[0]?.safe || 0.5;
  const complexity = regions.reduce((sum, region) => sum + region.complexity, 0) / regions.length;
  const analyzedComposition = clamp(
    0.45 +
    bestSafeScore * 0.37 +
    (safeTextAreas.length >= 2 ? 0.1 : 0) -
    Math.max(0, complexity - 0.72) * 0.24
  );

  const existingComposition = Number(candidate.compositionScore);
  const compositionScore = Number.isFinite(existingComposition)
    ? clamp(existingComposition * 0.42 + analyzedComposition * 0.58)
    : analyzedComposition;

  return {
    ...candidate,
    width: candidate.width || img.naturalWidth,
    height: candidate.height || img.naturalHeight,
    safeTextAreas: safeTextAreas.length ? safeTextAreas : (candidate.safeTextAreas || ['center']),
    focalPoint: candidate.focalPoint || { x:saliency.x, y:saliency.y },
    mobileFocalPoint: candidate.mobileFocalPoint || candidate.focalPoint || { x:saliency.x, y:saliency.y },
    compositionScore,
    technicalAnalysis: {
      averageLuminance,
      complexity,
      bestSafeArea: regions[0]?.name || 'center',
      bestSafeScore,
      analyzedCompositionScore: analyzedComposition
    }
  };
}

export async function analyzeShortlist(candidates, limit = 5) {
  const output = [];
  for (const candidate of candidates.slice(0, limit)) {
    output.push(await analyzeCandidateVisual(candidate));
  }
  return output;
}
