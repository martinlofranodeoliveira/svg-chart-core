# svg-chart-core

Standalone SVG bar/line charts: axes with ticks, labels, title. Zero
runtime dependencies, Node >= 22.

Part of the LOFRANO TECNOLOGIA open-source lab. MIT.

```js
import { bar } from './src/chart.mjs';
bar([{ label: 'a', value: 3 }, { label: 'b', value: 7 }]); // '<svg …>…'
```

```sh
npm test          # 6 tests, node:test, no dependencies
npm run demo
```

At most 20 series / 1000 points. MIT — see `LICENSE`.
[Versão em português](README.pt-BR.md).
