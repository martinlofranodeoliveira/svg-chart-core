import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bar, line, ChartError } from '../src/chart.mjs';

describe('bar', () => {
  it('renders standalone SVG with one rect per value', () => {
    const svg = bar([{ label: 'a', value: 3 }, { label: 'b', value: 7 }], { title: 'T', width: 400, height: 300 });
    assert.ok(svg.startsWith('<svg xmlns='));
    assert.ok(svg.endsWith('</svg>'));
    assert.equal((svg.match(/<rect /g) || []).length, 2);
    assert.ok(svg.includes('>a<') && svg.includes('>b<'));
    assert.ok(svg.includes('T'));
  });
  it('handles zeros and negatives with a zero baseline', () => {
    const svg = bar([{ label: 'n', value: -5 }, { label: 'z', value: 0 }, { label: 'p', value: 5 }]);
    assert.equal((svg.match(/<rect /g) || []).length, 3);
  });
  it('rejects empties and bad numbers', () => {
    assert.throws(() => bar([]), (e) => e.code === 'EMPTY');
    assert.throws(() => bar([{ label: 'x', value: NaN }]), (e) => e.code === 'BAD_NUMBER');
    assert.throws(() => bar([{ label: 'x', value: 1 }], { width: 50 }), (e) => e.code === 'BAD_SIZE');
    assert.ok(new ChartError('X') instanceof Error);
  });
});

describe('line', () => {
  it('draws paths, dots and legends', () => {
    const svg = line([{ label: 's', points: [1, 3, 2] }], { title: 'L' });
    assert.equal((svg.match(/<circle /g) || []).length, 3);
    assert.ok(/<path d="M[^"]*L[^"]*" /.test(svg));
    assert.ok(svg.includes('>s<'));
  });
  it('breaks on nulls and accepts bare arrays', () => {
    const svg = line([1, null, 3]);
    assert.equal((svg.match(/<circle /g) || []).length, 2);
    assert.equal(line([{ points: [5] }]).match(/<circle /g).length, 1);
  });
  it('is deterministic', () => {
    const a = [{ label: 'x', value: 4 }];
    assert.equal(bar(a), bar(structuredClone(a)));
  });
});
