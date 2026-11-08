// SPDX-License-Identifier: MIT
// Standalone SVG bar/line charts: axes with ticks, labels, title.
// Pure string building, no DOM, no dependencies. Deterministic output.

export const MAX_SERIES = 20;
export const MAX_POINTS = 1000;

export class ChartError extends Error {
  constructor(code, detail = '') {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'ChartError';
    this.code = code;
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = (n) => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
};

function num(v, name) {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ChartError('BAD_NUMBER', name);
  return v;
}

function optsIn(o = {}) {
  const width = o.width ?? 640;
  const height = o.height ?? 360;
  if (!Number.isInteger(width) || width < 200 || width > 2000) throw new ChartError('BAD_SIZE', 'width');
  if (!Number.isInteger(height) || height < 200 || height > 2000) throw new ChartError('BAD_SIZE', 'height');
  return { width, height, title: o.title ?? '', barColor: o.barColor ?? '#4a8be0' };
}

function frame(w, h, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${esc(title || 'chart')}">` +
    (title ? `<text x="${w / 2}" y="24" text-anchor="middle" font-size="16" font-family="sans-serif">${esc(title)}</text>` : '');
}

function axesBottom(g, plot) {
  // plot: {x0,y0,x1,y1} in px; yMin,yMax values; xLabels[]; ticks[]
  let s = `<line x1="${plot.x0}" y1="${plot.y1}" x2="${plot.x1}" y2="${plot.y1}" stroke="#333"/>` +
    `<line x1="${plot.x0}" y1="${plot.y0}" x2="${plot.x0}" y2="${plot.y1}" stroke="#333"/>`;
  for (const t of g.ticks) {
    const y = g.y(t.v);
    s += `<line x1="${plot.x0}" y1="${r2(y)}" x2="${plot.x1}" y2="${r2(y)}" stroke="#ddd"/>` +
      `<text x="${plot.x0 - 6}" y="${r2(y + 4)}" text-anchor="end" font-size="11" font-family="sans-serif">${esc(t.label)}</text>`;
  }
  g.xLabels.forEach((label, i) => {
    const x = g.x(i);
    s += `<text x="${r2(x)}" y="${plot.y1 + 16}" text-anchor="middle" font-size="11" font-family="sans-serif">${esc(label)}</text>`;
  });
  return s;
}

function yTicks(yMin, yMax, count = 5) {
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const step = (yMax - yMin) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const v = yMin + step * i;
    return { v, label: String(r2(Math.round(v * 100) / 100)) };
  });
}

/**
 * Bar chart. values: [{ label, value, color? }].
 * Baseline at 0; axis spans min(0,min)..max(0,max).
 */
export function bar(values, o = {}) {
  if (!Array.isArray(values) || values.length === 0) throw new ChartError('EMPTY');
  if (values.length > MAX_POINTS) throw new ChartError('TOO_MANY');
  const { width, height, title, barColor } = optsIn(o);
  const vs = values.map((p, i) => {
    if (!p || typeof p !== 'object') throw new ChartError('BAD_POINT', `index ${i}`);
    return { label: String(p.label ?? ''), value: num(p.value, `values[${i}]`), color: p.color ?? barColor };
  });
  const lo = Math.min(0, ...vs.map((v) => v.value));
  const hi = Math.max(0, ...vs.map((v) => v.value));
  const pad = { l: 56, r: 16, t: title ? 48 : 16, b: 40 };
  const plot = { x0: pad.l, y0: pad.t, x1: width - pad.r, y1: height - pad.b };
  const span = hi - lo || 1;
  const y = (v) => plot.y1 - ((v - lo) / span) * (plot.y1 - plot.y0);
  const slot = (plot.x1 - plot.x0) / vs.length;
  const bw = Math.max(2, slot * 0.6);
  let s = frame(width, height, title);
  const ticks = yTicks(lo, hi);
  const g = { ticks, xLabels: vs.map((v) => v.label), x: (i) => plot.x0 + slot * i + slot / 2, y };
  s += axesBottom(g, plot);
  vs.forEach((v, i) => {
    const cx = plot.x0 + slot * i + slot / 2;
    const yv = y(v.value);
    const y0 = y(0);
    const top = Math.min(yv, y0);
    const h = Math.max(1, Math.abs(yv - y0));
    s += `<rect x="${r2(cx - bw / 2)}" y="${r2(top)}" width="${r2(bw)}" height="${r2(h)}" fill="${esc(v.color)}"><title>${esc(`${v.label}: ${v.value}`)}</title></rect>`;
    s += `<text x="${r2(cx)}" y="${r2(top - 5)}" text-anchor="middle" font-size="11" font-family="sans-serif">${esc(String(v.value))}</text>`;
  });
  return s + '</svg>';
}

/**
 * Line chart. series: [{ label?, color?, points: [y...] }] or bare [y...].
 * X positions are indices; missing points (null) break the path.
 */
export function line(series, o = {}) {
  const list = Array.isArray(series) && series.length && typeof series[0] === 'number'
    ? [{ points: series }]
    : series;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_SERIES) throw new ChartError('BAD_SERIES');
  const { width, height, title } = optsIn(o);
  const palette = ['#4a8be0', '#e07a4a', '#4ae08b', '#a44ae0', '#e0c44a'];
  const ss = list.map((s, i) => {
    if (!s || !Array.isArray(s.points) || s.points.length === 0) throw new ChartError('BAD_SERIES', `index ${i}`);
    if (s.points.length > MAX_POINTS) throw new ChartError('TOO_MANY');
    s.points.forEach((p, j) => { if (p !== null && (typeof p !== 'number' || !Number.isFinite(p))) throw new ChartError('BAD_NUMBER', `series ${i} point ${j}`); });
    return { label: s.label ?? `s${i + 1}`, color: s.color ?? palette[i % palette.length], points: s.points };
  });
  const all = ss.flatMap((s) => s.points.filter((p) => p !== null));
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const n = Math.max(...ss.map((s) => s.points.length));
  const pad = { l: 56, r: 16, t: title ? 48 : 16, b: 40 };
  const plot = { x0: pad.l, y0: pad.t, x1: width - pad.r, y1: height - pad.b };
  const span = hi - lo || 1;
  const y = (v) => plot.y1 - ((v - lo) / span) * (plot.y1 - plot.y0);
  const x = (i) => (n === 1 ? (plot.x0 + plot.x1) / 2 : plot.x0 + (i / (n - 1)) * (plot.x1 - plot.x0));
  let s = frame(width, height, title);
  const ticks = yTicks(lo, hi);
  const g = { ticks, xLabels: Array.from({ length: n }, (_, i) => String(i + 1)), x, y };
  s += axesBottom(g, plot);
  ss.forEach((ser) => {
    // One subpath per run of non-null points; lone points become dots.
    let path = '';
    let seg = [];
    const flush = () => {
      if (seg.length === 1) path += `M${seg[0]} `;
      else if (seg.length > 1) path += `M${seg[0]} ` + seg.slice(1).map((p) => `L${p}`).join(' ') + ' ';
      seg = [];
    };
    ser.points.forEach((p, i) => {
      if (p === null) flush();
      else seg.push(`${r2(x(i))},${r2(y(p))}`);
    });
    flush();
    s += `<path d="${path.trim()}" fill="none" stroke="${esc(ser.color)}" stroke-width="2"><title>${esc(ser.label)}</title></path>`;
    ser.points.forEach((p, i) => {
      if (p !== null) s += `<circle cx="${r2(x(i))}" cy="${r2(y(p))}" r="3" fill="${esc(ser.color)}"><title>${esc(`${ser.label} #${i + 1}: ${p}`)}</title></circle>`;
    });
    s += `<text x="${plot.x1}" y="${r2(plot.y0 + ss.indexOf(ser) * 16)}" text-anchor="end" font-size="12" font-family="sans-serif" fill="${esc(ser.color)}">${esc(ser.label)}</text>`;
  });
  return s + '</svg>';
}
