# News Sentiment & Summary

**Route:** `/news-sentiment`  
**File:** `src/pages/NewsSentiment.tsx`

---

## Purpose

Fetches recent financial news articles for a ticker from Alpha Vantage and runs local AI sentiment analysis and summarisation on selected articles. All ML inference runs in the browser via a Web Worker — no text is sent to any external server after the initial article fetch.

---

## Architecture Overview

```
Browser
├── Main thread (React UI)
│   ├── fetches articles from Alpha Vantage (AV NEWS_SENTIMENT)
│   └── sends/receives messages to/from Web Worker
└── Web Worker (src/workers/nlpWorker.ts)
    ├── loads Xenova/transformers models from HuggingFace CDN
    │   ├── DistilBERT (sentiment)  ~67 MB
    │   └── DistilBART (summarisation)  ~230 MB
    └── runs inference locally, returns results via postMessage
```

Models are downloaded once and **cached in the browser's Cache Storage** by the `@xenova/transformers` library. Subsequent page loads use the cached models — no re-download required.

---

## Data Sources

### 1. Alpha Vantage — News Feed

**AV function:** `NEWS_SENTIMENT`  
**Key storage:** `localStorage` → `av_api_key`  
**API calls per search:** 1  
**Articles returned:** up to 10 (from the API's `feed[]`, sliced)

```ts
interface AVArticle {
  title: string;
  url: string;
  time_published: string;           // "20241108T143000"
  summary: string;                  // AV-provided article summary
  source: string;                   // e.g. "Reuters"
  overall_sentiment_label: string;  // AV's own label: "Bullish", "Bearish", etc.
  overall_sentiment_score: string;  // AV's numeric score (0–1 range)
}
```

AV provides its own pre-computed `overall_sentiment_label` and `overall_sentiment_score` per article. These are displayed in the article list as a secondary signal — they are **not** the result of the local ML models.

### 2. Local AI Models (Xenova/transformers)

Both models are loaded from HuggingFace Hub via `@xenova/transformers` and run in `nlpWorker.ts`:

| Model | HuggingFace ID | Size | Task |
|-------|---------------|------|------|
| DistilBERT (SST-2) | `Xenova/distilbert-base-uncased-finetuned-sst-2-english` | 67 MB | Binary sentiment (POSITIVE/NEGATIVE) |
| DistilBART CNN | `Xenova/distilbart-cnn-6-6` | 230 MB | Abstractive summarisation |

---

## Worker Message Protocol

### Main → Worker

| Message type | Payload | Effect |
|-------------|---------|--------|
| `LOAD` | (none) | Start downloading and initialising both models |
| `ANALYZE` | `{ id, text }` | Run sentiment + summarisation on `text` |

### Worker → Main

| Message type | Payload | When |
|-------------|---------|------|
| `LOADING_START` | `{ model, label, size }` | Model download begins |
| `MODEL_PROGRESS` | `{ model, progress, overall }` | Download % update |
| `MODEL_READY` | `{ model }` | A model finished loading |
| `MODELS_READY` | (none) | Both models ready — analysis can begin |
| `LOAD_ERROR` | `{ message }` | Download or init failure |
| `ANALYZE_STEP` | `{ step }` | Progress label during inference |
| `ANALYZE_CHUNK` | `{ current, total }` | Chunk-by-chunk progress |
| `ANALYZE_RESULT` | `{ result: AnalysisResult }` | Final analysis output |
| `ANALYZE_ERROR` | `{ message }` | Inference failure |

---

## Analysis Pipeline (`ANALYZE` flow)

The worker receives the article's `title + ". " + summary` as `text` (or user-pasted text in paste mode).

### Step 1 — Chunking

Long text is split into chunks suitable for DistilBERT's 512-token limit. The exact chunking strategy is implemented in the worker.

### Step 2 — Sentiment per chunk

Each chunk is passed through the DistilBERT SST-2 pipeline. Returns `POSITIVE` or `NEGATIVE` with a confidence score (0–1).

Chunk results are aggregated:
- `posScore` = mean confidence of POSITIVE chunks
- `negScore` = mean confidence of NEGATIVE chunks
- `posChunks` / `negChunks` = count of each
- `net` = posScore − negScore

### Step 3 — Final sentiment label

| Condition | Label |
|-----------|-------|
| `net > 0.1` | `BULLISH` |
| `net < −0.1` | `BEARISH` |
| otherwise | `NEUTRAL` |

### Step 4 — Signal extraction

Top bullish signals (POSITIVE chunks above a threshold) and top bearish signals (NEGATIVE chunks above a threshold) are extracted and returned as `{ text, label, score }` for display.

### Step 5 — Summarisation

The full text is passed through DistilBART to generate an abstractive summary sentence.

### Result shape

```ts
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
```

---

## Input Modes

### Fetch mode (default)

1. User enters a ticker + API key → `fetchNews()` is called
2. AV `NEWS_SENTIMENT` returns up to 10 articles
3. User clicks one article from the list to select it
4. Click "Analyze" → worker receives `title + ". " + summary`

### Paste mode

User pastes arbitrary text (minimum 20 words required). The same analysis pipeline runs on the pasted content. No AV call needed.

---

## UI Sections

### Model panel

Shows real-time download progress for both models with progress bars. Auto-starts model loading on page mount (`useEffect` on component init sends `LOAD` immediately).

### Article list (fetch mode)

Up to 10 articles displayed as clickable cards showing:
- Title
- Source + formatted publish time
- AV sentiment label + score (colour-coded: bullish/bearish/neutral)

Selected article highlighted with a purple border.

### Analysis output

Shown after inference completes:

| Section | Content |
|---------|---------|
| Sentiment badge | BULLISH / BEARISH / NEUTRAL with colour |
| Score bars | Bullish score %, Bearish score % |
| Stats | Chunks analysed, positive/negative chunk counts |
| AI Summary | DistilBART abstractive summary |
| Bullish signals | Top POSITIVE-scoring text chunks |
| Bearish signals | Top NEGATIVE-scoring text chunks |

---

## AV Sentiment Label Formatting

AV returns labels like `"Somewhat-Bullish"`, `"Bearish"`, `"Neutral"`. The `avSentimentColor()` function maps these:
- Contains "bullish" → `#10b981` (green)
- Contains "bearish" → `#ef4444` (red)
- Otherwise → `#f59e0b` (amber)

---

## Limitations

- **Model size**: ~300 MB total first load. On slow connections this can take minutes. Subsequent loads are instant (browser cache).
- **DistilBERT SST-2 is not finance-specific**: It was trained on movie reviews (Stanford Sentiment Treebank). Financial-domain sentiment models (e.g. FinBERT) would be more accurate but are larger.
- **DistilBART summarisation quality** may be inconsistent on short or highly technical financial text.
- **AV free tier**: 1 call consumed per ticker search; 25/day limit.
- **Article content**: AV only returns the article summary/snippet, not the full article body. Analysis is on the headline + snippet, not the full piece.
- **No persistence**: Model download progress and analysis results are lost on page refresh (though the model files remain in browser cache storage).
