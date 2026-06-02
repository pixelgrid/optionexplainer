import { pipeline, env } from '@xenova/transformers';

// Use browser Cache API — models downloaded once and persisted
env.allowRemoteModels = true;
env.allowLocalModels = false;

const SENTIMENT_MODEL = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
const SUMMARIZATION_MODEL = 'Xenova/distilbart-cnn-6-6';

type AnyPipeline = Awaited<ReturnType<typeof pipeline>>;

let sentimentPipe: AnyPipeline | null = null;
let summaryPipe: AnyPipeline | null = null;

// ── Progress tracking ──────────────────────────────────────────────────────

interface ProgressEvent {
  status: string;
  name: string;
  file: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

const fileProgress: Record<string, Record<string, number>> = {};

function onProgress(event: ProgressEvent) {
  const { status, name, file } = event;

  if (status === 'progress' && event.progress !== undefined) {
    if (!fileProgress[name]) fileProgress[name] = {};
    fileProgress[name][file] = event.progress;
    const values = Object.values(fileProgress[name]);
    const overall = values.reduce((s, v) => s + v, 0) / values.length;
    self.postMessage({ type: 'MODEL_PROGRESS', model: name, file, progress: event.progress, overall });
  }

  if (status === 'initiate') {
    self.postMessage({ type: 'MODEL_FILE_START', model: name, file });
  }

  if (status === 'done') {
    if (!fileProgress[name]) fileProgress[name] = {};
    fileProgress[name][file] = 100;
    self.postMessage({ type: 'MODEL_FILE_DONE', model: name, file });
  }

  if (status === 'ready') {
    self.postMessage({ type: 'MODEL_READY', model: name });
  }
}

// ── Model loading ──────────────────────────────────────────────────────────

async function loadModels() {
  try {
    self.postMessage({ type: 'LOADING_START', model: SENTIMENT_MODEL, label: 'DistilBERT · Sentiment', size: '67 MB' });
    sentimentPipe = await pipeline('text-classification', SENTIMENT_MODEL, {
      progress_callback: onProgress,
      quantized: true,
    });

    self.postMessage({ type: 'LOADING_START', model: SUMMARIZATION_MODEL, label: 'DistilBART · Summarization', size: '230 MB' });
    summaryPipe = await pipeline('summarization', SUMMARIZATION_MODEL, {
      progress_callback: onProgress,
      quantized: true,
    });

    self.postMessage({ type: 'MODELS_READY' });
  } catch (err) {
    self.postMessage({ type: 'LOAD_ERROR', message: (err as Error).message });
  }
}

// ── Text helpers ───────────────────────────────────────────────────────────

// Split text into sentence-aware chunks of ≤ maxWords words
function chunkText(text: string, maxWords = 300): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = (current + ' ' + sentence).trim();
    if (candidate.split(/\s+/).length > maxWords && current) {
      chunks.push(current.trim());
      current = sentence.trim();
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.split(/\s+/).length >= 5);
}

function extractSentences(text: string): string[] {
  return (text.match(/[^.!?\n]+[.!?\n]+/g) ?? [])
    .map(s => s.trim())
    .filter(s => {
      const words = s.split(/\s+/).length;
      return words >= 6 && words <= 60;
    });
}

// ── Core analysis ──────────────────────────────────────────────────────────

async function analyze(id: string, text: string) {
  if (!sentimentPipe || !summaryPipe) {
    self.postMessage({ type: 'ANALYZE_ERROR', id, message: 'Models are not loaded yet.' });
    return;
  }

  try {
    // ── 1. Chunk-level sentiment ────────────────────────────────────────
    self.postMessage({ type: 'ANALYZE_STEP', id, step: 'Analyzing sentiment across document…' });

    const chunks = chunkText(text);
    const chunkResults: { label: string; score: number }[] = [];

    for (let i = 0; i < chunks.length; i++) {
      self.postMessage({ type: 'ANALYZE_CHUNK', id, current: i + 1, total: chunks.length });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (sentimentPipe as any)(chunks[i], { truncation: true });
      const r = (Array.isArray(raw) ? raw[0] : raw) as { label: string; score: number };
      chunkResults.push({ label: r.label, score: r.score });
    }

    // Aggregate: count-weighted positive vs negative
    let posTotal = 0, negTotal = 0;
    for (const r of chunkResults) {
      if (r.label === 'POSITIVE') posTotal += r.score;
      else negTotal += r.score;
    }
    const n = chunkResults.length;
    const posScore = posTotal / n;
    const negScore = negTotal / n;
    const posChunks = chunkResults.filter(r => r.label === 'POSITIVE').length;
    const negChunks = n - posChunks;

    // ── 2. Key signals from sentences ──────────────────────────────────
    self.postMessage({ type: 'ANALYZE_STEP', id, step: 'Extracting key signals…' });

    const allSentences = extractSentences(text);
    // Sample up to 25 sentences spread evenly
    const sampleStep = Math.max(1, Math.ceil(allSentences.length / 25));
    const sampled = allSentences.filter((_, i) => i % sampleStep === 0).slice(0, 25);

    const sentenceScores: { text: string; label: string; score: number }[] = [];
    for (const s of sampled) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (sentimentPipe as any)(s, { truncation: true });
      const r = (Array.isArray(raw) ? raw[0] : raw) as { label: string; score: number };
      sentenceScores.push({ text: s, label: r.label, score: r.score });
    }

    const bullishSignals = sentenceScores
      .filter(s => s.label === 'POSITIVE' && s.score >= 0.78)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const bearishSignals = sentenceScores
      .filter(s => s.label === 'NEGATIVE' && s.score >= 0.78)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    // ── 3. Summarization ───────────────────────────────────────────────
    self.postMessage({ type: 'ANALYZE_STEP', id, step: 'Generating summary…' });

    // Use the first chunk (~300 words) for summary — best section of news/filings
    const textForSummary = chunks[0] ?? text;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summaryRaw = await (summaryPipe as any)(textForSummary, {
      max_new_tokens: 120,
      min_new_tokens: 25,
      truncation: true,
    });
    const summary = (
      Array.isArray(summaryRaw)
        ? (summaryRaw[0] as { summary_text: string }).summary_text
        : (summaryRaw as unknown as { summary_text: string }).summary_text
    );

    // ── Result ─────────────────────────────────────────────────────────
    const net = posScore - negScore;
    const overallLabel = net > 0.12 ? 'BULLISH' : net < -0.12 ? 'BEARISH' : 'NEUTRAL';

    self.postMessage({
      type: 'ANALYZE_RESULT',
      id,
      result: {
        sentiment: {
          label: overallLabel,
          posScore,
          negScore,
          net,
          chunkCount: n,
          posChunks,
          negChunks,
          bullishSignals,
          bearishSignals,
        },
        summary,
        wordCount: text.split(/\s+/).length,
      },
    });
  } catch (err) {
    self.postMessage({ type: 'ANALYZE_ERROR', id, message: (err as Error).message });
  }
}

// ── Message handler ────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
  const { type, id, text } = e.data as { type: string; id?: string; text?: string };
  if (type === 'LOAD') await loadModels();
  if (type === 'ANALYZE' && id && text) await analyze(id, text);
};
