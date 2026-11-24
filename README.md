# ui-kit

Shared SolidJS components, design tokens and i18n helpers for every Hostry app. No app forks a component.

Stack (pinned exactly, see `package.json`): Solid 2.0.3 (`solid-js`, `@solidjs/web`), `@solidjs/vite-plugin` 3.0.1 (not `vite-plugin-solid`, which is Solid 1), `@solidjs/testing-library` 1.0.0-rc.2 (the `next` build; never `latest`), Vite 8, Vitest 5, TypeScript 6.0 (typescript-eslint does not yet support 7).

## Run

```
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Output: `dist/index.js` (ES module), `dist/index.css` (tokens + component styles, import as `@hostry/ui-kit/styles.css`), `dist/*.d.ts`.

## Contents

- `src/tokens/tokens.css`: CSS variables. Values are placeholders until ux-designer delivers tokens (`docs/design/`). `--hy-touch-target` is 44 px and must not be lowered.
- `src/i18n`: `createTranslator`, `I18nProvider`, `useI18n`, ui-kit English catalogue (`ui.*` keys). Tamil and Malayalam pending founder confirmation. Components take already-translated strings; only their own fixed labels (close, dismiss) use keys.
- `src/components`: `Button`, `Input`, `Dialog`, `Toast` (`createToastQueue`, `ToastRegion`). All forward `data-testid`.
- `src/format.ts`: `formatMoney` (integer paise to rupees, Indian grouping), `formatIst` (UTC to IST).

## Solid 2 notes

Reads after a write update only after `flush()` (tests call it). `omit` replaces `splitProps`; the context is its own provider (`<I18nProvider value={...}>`); default `For` gives the item as a plain value.
