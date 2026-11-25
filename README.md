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

- `tokens/tokens.json`: the design token source (moved here from `docs/design/tokens.json`; edit this file, never the generated ones). `tokens/contrast-pairs.json` lists the text/background pairs the contrast gate checks.
- `src/tokens/tokens.css` and `tokens.ts`: **generated** by `pnpm tokens` (`scripts/build-tokens.mjs`). Themes switch with `<html data-theme="light|dark|highContrast|kds" data-density="touch|desktop" lang="en|ta|ml">`; with no `data-theme`, dark follows the OS. `--hy-touch-target` is 44 px and must not be lowered. `pnpm tokens:check` (also run by `build` and by a test) fails if the committed files are stale.
- `pnpm contrast`: WCAG 2.2 AA gate over every pair in every theme (4.5:1 text, 3:1 borders, focus ring and icons, 7:1 text in `highContrast`). Prints every ratio, exits 1 on a failure, and also runs as a unit test. Re-skinning: edit `brand` in `tokens.json`, run `pnpm tokens && pnpm contrast`.
- `src/theme`: `applyTheme`, `applyDensity`, `applyReduceMotion`, `applyLang`, `createThemeController` (optional storage of the theme choice only).
- `src/i18n`: `createTranslator`, `I18nProvider`, `useI18n`, ui-kit English catalogue (`ui.*` keys). Tamil and Malayalam pending founder confirmation. Components take already-translated strings; only their own fixed labels (close, dismiss, skip link, offline text) use keys.
- `src/components`: `Button`, `Input`, `PasswordField`, `OtpField`, `Dialog` (focus trap and restore; `data-autofocus` picks the first focus), `Toast`, `Banner`, `InlineAlert`, `OfflineBanner`, `StatusBadge`, `EmptyState`, `Card`, `PageHeader`, `AppShell`, `NavBar`, `DataTable` (real table semantics, roving rows, j/k/arrows/Enter, skeleton loading), `Tabs` (arrows, optional Alt+1..9), `Icon`. All forward `data-testid`. State is never colour alone: banners and badges carry an icon and text.
- `src/components` Phase 2 (all presentational, no business logic or API calls, `data-testid` on interactive parts): POS (`TableTile`, `FloorGrid`, `BillTabs`, `SyncStatus`, `ModeBar`, `PrinterStatus`, `PrintJobRow`, `PinPad`, `Numpad`, `AmountField`, `UserTile`, `ApprovalDialog`, `CategoryTabs`, `ItemTile`, `QuickItemGrid`, `ModifierGroup`, `OrderLine`, `OrderPanel`, `SentIndicator`, `ReasonChips`, `LineSelectList`, `OrderTypeToggle`, `HeldOrdersButton`, `TenderTabs`, `QuickAmountChips`, `PaymentRow`, `ShareList`, `CheckSummary`, `PreBillPreview`, `BillRequestList`, `BlindCountForm`, `ChecklistPanel`, `StatTile`, `ExceptionRow`, `SettingsList`, `LockedRow`, `ProgressStepper`, `LateTicketRow`, `ManualBillForm`), KDS (`KdsBoard`, `KdsTicket`, `KdsItemRow`, `KdsAgeBadge`, `BumpButton`, `StationSelect`), admin (`WizardStepper`, `MoneyField`, `BasisPointField`, `DateField`, `DateTimeField`, `AmountBreakdown`, `DiffList`, `RuleGrid`, `InvoiceRefField`, `OneTimeReveal`, `Panel`, `NavMenu`, `FileDrop`), and the primitives `SegmentedControl`, `Stepper`, `CheckRow`. Money fields take and give integer paise (string maths, never floats); rates are integer basis points. Not built yet: `ReportSheet`, `ItemEditor`, `Countdown`, `QrCode` and the other shared-base names in `docs/design/ui-kit.md` that no Phase 2 flow needs first. Layout and styles are in `src/pos.css`.
- Tokens `color.table.state.*` (free, occupied, billed, ready, attention) and `color.kds.ticket.border.*` (fresh none, waiting dashed, late 6 px solid) reuse existing colours and are in the contrast gate; they generate `--hy-table-<state>-{fg,bg}` and `--hy-kds-border-<age>-{style,width,color}`.
- `src/format.ts`: `formatMoney` (integer paise to rupees, Indian grouping), `formatIst` (UTC to IST), `parseRupeesToPaise`, `formatBasisPoints`, `utcToIstInput` / `istInputToUtc` (datetime fields typed in IST).

## Token changes from the design draft (v0.1 to v0.1.1)

The first contrast run found three AA failures in the light theme, fixed in `tokens/tokens.json`: `success` and `sync.synced.fg` `#1B7F3B` to `#1A7A38` (4.46 to 4.76:1 on `successBg`), and `border` `#8A93A1` to `#838C9A` (2.89 to 3.17:1 on `surface`). The planning copy in `docs/design/tokens.json` should take the same values. kds has no brand block and uses the dark brand colours.

## Solid 2 notes

Reads after a write update only after `flush()` (tests call it). `omit` replaces `splitProps`; the context is its own provider (`<I18nProvider value={...}>`); default `For` gives the item as a plain value.
