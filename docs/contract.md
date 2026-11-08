# Contract — svg-chart-core

Pure ESM in `src/chart.mjs`, zero runtime dependencies, Node >= 22.
Standalone `<svg>` (no external refs); labels XML-escaped; coordinates
rounded to 2dp (no scientific notation).

| Export | Result |
| --- | --- |
| `MAX_SERIES` (20) · `MAX_POINTS` (1000) | Hard bounds. |
| `bar(values, opts)` | `[{label, value, color?}]`; baseline at 0; axis spans `min(0,min)..max(0,max)`; value labels on bars; `<title>` tooltips. |
| `line(series, opts)` | `[{label?, color?, points}]` or bare `[y…]`; `null` breaks the path; dots per point; legend entries. |

Options: `width`/`height` (200–2000 int), `title`, `barColor`.
Ticks: 5 even steps across the span.

Errors: `BAD_NUMBER` · `BAD_SIZE` · `EMPTY` · `TOO_MANY` · `BAD_POINT` · `BAD_SERIES`.
