#!/usr/bin/env node
// Demo: fixed charts, asserts structural invariants. --assert exits non-zero on mismatch.
import { bar, line } from '../src/chart.mjs';

let failed = 0;
const b = bar([{ label: 'a', value: 3 }, { label: 'b', value: 7 }], { title: 'Bars' });
const p1 = (b.match(/<rect /g) || []).length === 2 && b.includes('Bars');
console.log(`${p1 ? 'PASS' : 'FAIL'} bars -> 2 rects`);
if (!p1) failed++;
const l = line([{ label: 's', points: [1, 3, 2] }]);
const p2 = (l.match(/<circle /g) || []).length === 3;
console.log(`${p2 ? 'PASS' : 'FAIL'} line -> 3 dots`);
if (!p2) failed++;
if (process.argv.includes('--assert') && failed > 0) process.exit(1);
if (failed > 0) process.exitCode = 1;
console.log(failed === 0 ? 'demo: all cases as expected' : `demo: ${failed} mismatch(es)`);
