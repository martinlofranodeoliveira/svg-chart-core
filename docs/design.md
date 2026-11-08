# Design — svg-chart-core

Layout is arithmetic, not a DOM: fixed padding box, linear value→pixel
maps, one subpath per non-null run. Bars always include the zero line so
negative values hang below it instead of floating. XML validity was
verified with a real parser, including hostile labels (`&<>`) and
null-broken series.

Oracle: rect/dot/path counts, legend and title presence, determinism
(same input → byte-identical output), null breaks. Interactivity,
animation and responsive scaling are out of scope by design.
