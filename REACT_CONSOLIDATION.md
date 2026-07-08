# React Consolidation Status

The public website now uses React routes directly instead of rendering legacy HTML through an iframe or generated page string. The old `.html` URLs are kept as server redirects so bookmarks and deployed links still land on the right React page.

Current rules:

1. Keep the original Veyro visual style in React components.
2. Do not reintroduce `srcDoc`, iframe-rendered pages, or `react/src/legacy/pages`.
3. Add tests for behavior when a React page gains important logic.
4. Keep `.html` compatibility in `server.js` redirects only.

Remaining polish work:

1. Continue matching any page-specific spacing or graphics that differ from the old design.
2. Add React UI tests for the calculator, vault save flow, basketball, and football routes.
3. Keep football's rating formula separate from basketball when it is ready.
