import { useState, useEffect, useRef, useCallback } from 'react';
import { avFetch, LS_AV_KEY, sleep } from '../lib/avClient';
import { getCached, saveCache, clearCache } from '../lib/jsonbinCache';

const PAGE = 'news-sentiment';

// ── Types ──────────────────────────────────────────────────────────────────

interface ModelInfo {
  id: string;
  label: string;
  size: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number; // 0-100
}

interface Signal { text: string; label: string; score: number }

interface AnalysisResult {
  sentiment: {
    label: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    posScore: number;
    negScore: number;
    net: number;
    chunkCount: number;
    posChunks: number;
    negChunks: number;
    bullishSignals: Signal[];
    bearishSignals: Signal[];
  };
  summary: string;
  wordCount: number;
}

interface AVArticle {
  title: string;
  url: string;
  time_published: string;
  summary: string;
  source: string;
  overall_sentiment_label: string;
  overall_sentiment_score: string;
}

// ── Shared styles ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '10px 14px', color: 'var(--text-h)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h2>
    </div>
  );
}

// ── Model status panel ─────────────────────────────────────────────────────

function ModelPanel({ models, modelsReady, onLoad, autoStarted }: {
  models: Record<string, ModelInfo>;
  modelsReady: boolean;
  onLoad: () => void;
  autoStarted: boolean;
}) {
  const list = Object.values(models);

  return (
    <Card style={{ marginBottom: 20, border: `1px solid ${modelsReady ? '#10b98140' : '#6366f140'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: modelsReady ? '#10b981' : '#818cf8', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            {modelsReady ? '✓ Models ready — running locally in your browser' : 'AI Models'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Downloaded once · cached in browser · no data sent to any server
          </div>
        </div>
        {!autoStarted && !modelsReady && list.length === 0 && (
          <button onClick={onLoad}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            Download Models
          </button>
        )}
      </div>

      {list.length > 0 && (
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {list.map(m => (
            <div key={m.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: m.status === 'ready' ? '#10b981' : '#818cf8', fontWeight: 700 }}>
                    {m.status === 'ready' ? '✓' : '↓'}
                  </span>
                  <span style={{ color: 'var(--text-h)', fontSize: 13 }}>{m.label}</span>
                  <span style={{ color: '#475569', fontSize: 11 }}>{m.size}</span>
                </div>
                <span style={{ color: m.status === 'ready' ? '#10b981' : 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
                  {m.status === 'ready' ? 'Ready' : m.status === 'loading' ? `${m.progress.toFixed(0)}%` : m.status}
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: m.status === 'ready' ? '#10b981' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  width: m.status === 'ready' ? '100%' : `${m.progress}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Sentiment display ──────────────────────────────────────────────────────

function SentimentBadge({ label }: { label: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }) {
  const cfg = {
    BULLISH: { bg: '#10b98120', border: '#10b98150', color: '#10b981', icon: '▲' },
    BEARISH: { bg: '#ef444420', border: '#ef444450', color: '#ef4444', icon: '▼' },
    NEUTRAL: { bg: '#f59e0b20', border: '#f59e0b50', color: '#f59e0b', icon: '●' },
  }[label];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 8, padding: '6px 14px' }}>
      <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.icon}</span>
      <span style={{ color: cfg.color, fontWeight: 700, fontSize: 16, letterSpacing: '0.05em' }}>{label}</span>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</span>
        <span style={{ color, fontSize: 12, fontWeight: 600 }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value * 100}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

// ── AV sentiment label formatting ──────────────────────────────────────────

function avSentimentColor(label: string): string {
  if (!label) return 'var(--text-muted)';
  const l = label.toLowerCase();
  if (l.includes('bullish')) return '#10b981';
  if (l.includes('bearish')) return '#ef4444';
  return '#f59e0b';
}

// ── Main page ──────────────────────────────────────────────────────────────

const SENTIMENT_MODEL_ID = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
const SUMMARY_MODEL_ID = 'Xenova/distilbart-cnn-6-6';

export function NewsSentiment() {
  const workerRef = useRef<Worker | null>(null);

  // Model state
  const [models, setModels] = useState<Record<string, ModelInfo>>({});
  const [modelsReady, setModelsReady] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Input state
  const [inputMode, setInputMode] = useState<'fetch' | 'paste'>('fetch');
  const [ticker, setTicker] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_AV_KEY) ?? '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  const [articles, setArticles] = useState<AVArticle[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [pastedText, setPastedText] = useState('');

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [analyzeChunk, setAnalyzeChunk] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');

  // ── Worker setup ──────────────────────────────────────────────────────

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/nlpWorker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;

      switch (msg.type) {
        case 'LOADING_START':
          setModels(prev => ({
            ...prev,
            [msg.model]: { id: msg.model, label: msg.label, size: msg.size, status: 'loading', progress: 0 },
          }));
          break;

        case 'MODEL_PROGRESS':
          setModels(prev => ({
            ...prev,
            [msg.model]: { ...prev[msg.model], status: 'loading', progress: msg.overall ?? msg.progress },
          }));
          break;

        case 'MODEL_READY':
          setModels(prev => ({
            ...prev,
            [msg.model]: { ...prev[msg.model], status: 'ready', progress: 100 },
          }));
          break;

        case 'MODELS_READY':
          setModelsReady(true);
          break;

        case 'LOAD_ERROR':
          setLoadError(msg.message);
          break;

        case 'ANALYZE_STEP':
          setAnalyzeStep(msg.step);
          setAnalyzeChunk(null);
          break;

        case 'ANALYZE_CHUNK':
          setAnalyzeChunk({ current: msg.current, total: msg.total });
          break;

        case 'ANALYZE_RESULT':
          setResult(msg.result as AnalysisResult);
          setAnalyzing(false);
          setAnalyzeStep('');
          setAnalyzeChunk(null);
          break;

        case 'ANALYZE_ERROR':
          setAnalyzeError(msg.message);
          setAnalyzing(false);
          setAnalyzeStep('');
          break;
      }
    };

    workerRef.current = worker;

    // Auto-start model loading
    setAutoStarted(true);
    setModels({
      [SENTIMENT_MODEL_ID]: { id: SENTIMENT_MODEL_ID, label: 'DistilBERT · Sentiment', size: '67 MB', status: 'loading', progress: 0 },
      [SUMMARY_MODEL_ID]: { id: SUMMARY_MODEL_ID, label: 'DistilBART · Summarization', size: '230 MB', status: 'loading', progress: 0 },
    });
    worker.postMessage({ type: 'LOAD' });

    return () => worker.terminate();
  }, []);

  const loadModels = useCallback(() => {
    setModels({
      [SENTIMENT_MODEL_ID]: { id: SENTIMENT_MODEL_ID, label: 'DistilBERT · Sentiment', size: '67 MB', status: 'loading', progress: 0 },
      [SUMMARY_MODEL_ID]: { id: SUMMARY_MODEL_ID, label: 'DistilBART · Summarization', size: '230 MB', status: 'loading', progress: 0 },
    });
    workerRef.current?.postMessage({ type: 'LOAD' });
  }, []);

  // ── News fetch ────────────────────────────────────────────────────────

  const fetchNews = useCallback(async (forceRefresh = false) => {
    if (!ticker.trim() || !apiKey.trim()) return;
    const symUp = ticker.trim().toUpperCase();
    setNewsLoading(true); setNewsError(''); setArticles([]); setSelectedIdx(null); setResult(null);
    try {
      if (!forceRefresh) {
        const cached = await getCached<AVArticle[]>(PAGE, symUp);
        if (cached) { setArticles(cached); setFromCache(true); return; }
      }
      const data = await avFetch('NEWS_SENTIMENT', symUp, apiKey.trim());
      await sleep(0);
      const feed = (data.feed as AVArticle[] | undefined) ?? [];
      if (!feed.length) throw new Error(`No news found for ${symUp}`);
      const articles = feed.slice(0, 10);
      await saveCache(PAGE, symUp, articles);
      setArticles(articles); setFromCache(false);
    } catch (e) {
      setNewsError((e as Error).message);
    } finally {
      setNewsLoading(false);
    }
  }, [ticker, apiKey]);

  const refreshNews = useCallback(() => {
    clearCache(PAGE, ticker.trim().toUpperCase());
    fetchNews(true);
  }, [ticker, fetchNews]);

  // ── Analyze ───────────────────────────────────────────────────────────

  const analyze = useCallback(() => {
    let text = '';
    if (inputMode === 'fetch' && selectedIdx != null && articles[selectedIdx]) {
      const a = articles[selectedIdx];
      text = `${a.title}. ${a.summary}`;
    } else if (inputMode === 'paste') {
      text = pastedText.trim();
    }
    if (!text || !modelsReady) return;

    setAnalyzing(true); setResult(null); setAnalyzeError('');
    workerRef.current?.postMessage({ type: 'ANALYZE', id: Date.now().toString(), text });
  }, [inputMode, selectedIdx, articles, pastedText, modelsReady]);

  // ── Render ────────────────────────────────────────────────────────────

  const canAnalyze = modelsReady && !analyzing && (
    (inputMode === 'fetch' && selectedIdx != null) ||
    (inputMode === 'paste' && pastedText.trim().split(/\s+/).length >= 20)
  );

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 8px', color: 'var(--text-h)', fontSize: 'clamp(22px,5vw,30px)', fontWeight: 700 }}>
          News Sentiment & Summary
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Analyze financial news and SEC filings with local AI. Models run entirely in your browser — no data leaves your device.
        </p>
      </div>

      {/* Model status */}
      <ModelPanel models={models} modelsReady={modelsReady} onLoad={loadModels} autoStarted={autoStarted} />
      {loadError && (
        <div style={{ marginBottom: 16, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>
          ⚠ Model load failed: {loadError}
        </div>
      )}

      {/* Model info */}
      <Card style={{ marginBottom: 20, background: 'var(--bg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { name: 'DistilBERT-SST2', task: 'Sentiment', desc: 'Binary positive/negative with confidence score. Sentence-level and document-level scoring. Neutral inferred when neither is dominant.', size: '67 MB' },
            { name: 'DistilBART-CNN', task: 'Summarization', desc: 'Abstractive summarization fine-tuned on news articles (CNN/DailyMail). Generates a fluent 2-3 sentence summary from the article body.', size: '230 MB' },
          ].map(m => (
            <div key={m.name}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ background: '#6366f120', color: '#818cf8', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>{m.task.toUpperCase()}</span>
                <span style={{ color: 'var(--text-h)', fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                <span style={{ color: '#475569', fontSize: 11 }}>{m.size}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Input */}
      <div style={{ marginBottom: 24 }}>
        <SectionHeader title="Input" color="#6366f1" />

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['fetch', 'paste'] as const).map(mode => (
            <button key={mode} onClick={() => { setInputMode(mode); setResult(null); setAnalyzeError(''); }}
              style={{
                background: inputMode === mode ? '#6366f120' : 'none',
                border: `1px solid ${inputMode === mode ? '#6366f1' : 'var(--border)'}`,
                borderRadius: 8, padding: '8px 16px', fontSize: 13,
                color: inputMode === mode ? '#818cf8' : 'var(--text-muted)',
                cursor: 'pointer', fontWeight: inputMode === mode ? 600 : 400,
              }}>
              {mode === 'fetch' ? '📰 Fetch News by Ticker' : '📋 Paste Article / Filing'}
            </button>
          ))}
        </div>

        {/* Fetch mode */}
        {inputMode === 'fetch' && (
          <Card>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && fetchNews()}
                placeholder="Ticker symbol (e.g. AAPL)" style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
              {!apiKey && (
                <input placeholder="Alpha Vantage API key" style={{ ...inputStyle, flex: 1, minWidth: 180 }}
                  onChange={e => { setApiKey(e.target.value); localStorage.setItem(LS_AV_KEY, e.target.value); }} />
              )}
              <button onClick={fetchNews} disabled={newsLoading || !ticker.trim() || !apiKey.trim()}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: newsLoading ? 'not-allowed' : 'pointer', opacity: newsLoading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                {newsLoading ? 'Loading…' : 'Fetch News'}
              </button>
              {apiKey && (
                <button onClick={() => setShowKeyInput(v => !v)}
                  style={{ background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, cursor: 'pointer' }}>
                  ⚙ Key
                </button>
              )}
            </div>

            {showKeyInput && (
              <div style={{ marginBottom: 12 }}>
                <input defaultValue={apiKey}
                  onChange={e => { setApiKey(e.target.value); localStorage.setItem(LS_AV_KEY, e.target.value); }}
                  placeholder="Alpha Vantage API key" style={{ ...inputStyle, fontSize: 13 }} />
              </div>
            )}

            {newsError && (
              <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 13, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px' }}>⚠ {newsError}</div>
            )}

            {articles.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                    SELECT AN ARTICLE TO ANALYZE
                  </div>
                  {fromCache && <button onClick={refreshNews} disabled={newsLoading} style={{ background: '#6366f115', color: '#818cf8', border: '1px solid #6366f130', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>cached · refresh</button>}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {articles.map((a, i) => (
                    <button key={i} onClick={() => { setSelectedIdx(i); setResult(null); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                        background: selectedIdx === i ? '#6366f115' : 'var(--bg)',
                        border: `1px solid ${selectedIdx === i ? '#6366f1' : 'var(--border)'}`,
                        borderRadius: 8, padding: '12px 14px', transition: 'all 0.12s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                        <div style={{ color: 'var(--text-h)', fontSize: 13, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{a.title}</div>
                        {a.overall_sentiment_label && (
                          <span style={{ color: avSentimentColor(a.overall_sentiment_label), fontSize: 10, fontWeight: 700, flexShrink: 0, background: avSentimentColor(a.overall_sentiment_label) + '20', padding: '2px 6px', borderRadius: 4 }}>
                            {a.overall_sentiment_label.replace(/-/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {a.source} · {a.time_published?.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                      </div>
                      {selectedIdx === i && a.summary && (
                        <div style={{ marginTop: 8, color: 'var(--text)', fontSize: 12, lineHeight: 1.5 }}>{a.summary}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Paste mode */}
        {inputMode === 'paste' && (
          <Card>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>
              Paste any financial article, earnings release, or SEC filing section (20+ words required)
            </div>
            <textarea value={pastedText} onChange={e => { setPastedText(e.target.value); setResult(null); }}
              placeholder="Paste article text, SEC filing excerpt, earnings release, analyst note…"
              rows={10}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontSize: 13 }} />
            <div style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>
              {pastedText.trim().split(/\s+/).filter(Boolean).length} words
              {pastedText.trim().split(/\s+/).filter(Boolean).length > 800 &&
                <span style={{ color: '#f59e0b', marginLeft: 8 }}>⚠ Long document — only the first ~300 words will be used for the summary</span>}
            </div>
          </Card>
        )}
      </div>

      {/* Analyze button */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={analyze} disabled={!canAnalyze}
          style={{
            background: canAnalyze ? '#6366f1' : 'var(--bg-card-hover)',
            color: canAnalyze ? '#fff' : '#475569',
            border: `1px solid ${canAnalyze ? '#6366f1' : 'var(--border)'}`,
            borderRadius: 10, padding: '12px 32px', fontSize: 15, fontWeight: 700,
            cursor: canAnalyze ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
          {analyzing ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
              {analyzeChunk ? `Chunk ${analyzeChunk.current} / ${analyzeChunk.total}` : analyzeStep || 'Analyzing…'}
            </>
          ) : (
            <>▶ Analyze</>
          )}
        </button>
        {!modelsReady && (
          <div style={{ marginTop: 8, color: '#475569', fontSize: 12 }}>Waiting for models to finish loading…</div>
        )}
        {analyzeError && (
          <div style={{ marginTop: 12, color: '#fca5a5', fontSize: 13, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px' }}>⚠ {analyzeError}</div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'grid', gap: 20 }}>
          <SectionHeader title="Analysis Results" color="#10b981" />

          {/* Top row: sentiment + summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {/* Sentiment card */}
            <Card>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>SENTIMENT</div>
              <div style={{ marginBottom: 16 }}>
                <SentimentBadge label={result.sentiment.label} />
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <ScoreBar label="Bullish signal strength" value={result.sentiment.posScore} color="#10b981" />
                <ScoreBar label="Bearish signal strength" value={result.sentiment.negScore} color="#ef4444" />
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>CHUNKS ANALYZED</div>
                  <div style={{ color: 'var(--text-h)', fontSize: 16, fontWeight: 700 }}>{result.sentiment.chunkCount}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>BULLISH CHUNKS</div>
                  <div style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>{result.sentiment.posChunks}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>BEARISH CHUNKS</div>
                  <div style={{ color: '#ef4444', fontSize: 16, fontWeight: 700 }}>{result.sentiment.negChunks}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>WORD COUNT</div>
                  <div style={{ color: 'var(--text-h)', fontSize: 16, fontWeight: 700 }}>{result.wordCount}</div>
                </div>
              </div>

              {/* AV comparison if available */}
              {inputMode === 'fetch' && selectedIdx != null && articles[selectedIdx]?.overall_sentiment_label && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>ALPHA VANTAGE SENTIMENT</div>
                  <span style={{ color: avSentimentColor(articles[selectedIdx].overall_sentiment_label), fontSize: 13, fontWeight: 600 }}>
                    {articles[selectedIdx].overall_sentiment_label.replace(/-/g, ' ')}
                  </span>
                  <span style={{ color: '#475569', fontSize: 11, marginLeft: 8 }}>score: {Number(articles[selectedIdx].overall_sentiment_score).toFixed(3)}</span>
                </div>
              )}
            </Card>

            {/* Summary card */}
            <Card>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>AI SUMMARY</div>
              <p style={{ color: 'var(--text-h)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
              <div style={{ marginTop: 12, color: '#475569', fontSize: 11 }}>Generated by DistilBART-CNN · abstractive summarization</div>
            </Card>
          </div>

          {/* Key signals */}
          {(result.sentiment.bullishSignals.length > 0 || result.sentiment.bearishSignals.length > 0) && (
            <Card>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 14 }}>KEY SIGNALS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

                {result.sentiment.bullishSignals.length > 0 && (
                  <div>
                    <div style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>BULLISH</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {result.sentiment.bullishSignals.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#10b98108', border: '1px solid #10b98125', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ color: '#10b981', fontSize: 14, flexShrink: 0, marginTop: 1 }}>▲</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--text-h)', fontSize: 13, lineHeight: 1.5 }}>{s.text}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{(s.score * 100).toFixed(0)}% confidence</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.sentiment.bearishSignals.length > 0 && (
                  <div>
                    <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>BEARISH</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {result.sentiment.bearishSignals.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#ef444408', border: '1px solid #ef444425', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ color: '#ef4444', fontSize: 14, flexShrink: 0, marginTop: 1 }}>▼</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--text-h)', fontSize: 13, lineHeight: 1.5 }}>{s.text}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{(s.score * 100).toFixed(0)}% confidence</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Footnote */}
          <div style={{ color: '#334155', fontSize: 11, lineHeight: 1.6 }}>
            Sentiment model: DistilBERT fine-tuned on SST-2 (general English). For best results on SEC filings, use paragraph-length excerpts from the MD&A or risk factor sections. Financial-domain FinBERT model support planned.
          </div>
        </div>
      )}

      {/* CSS for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
