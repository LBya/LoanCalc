# LoanCalc

Interactive home loan scenario comparison tool. Compare up to 4 loan repayment strategies side-by-side with live calculations, charts, and plain-English insights.

Built with React, Vite, Recharts, and Tailwind CSS. All computation runs client-side — no backend, no data leaves your browser.

## Features

- **Base amortization** — Standard principal & interest schedule verified against ASIC Moneysmart
- **Offset account simulation** — See how an offset balance reduces interest and shortens your loan
- **Extra repayment modeling** — Recurring extra payments and one-off lump sums
- **FHBSS integration** — First Home Buyer Super Saver Scheme with worst-case tax rates (hard-coded ATO thresholds)
- **Side-by-side comparison table** — Up to 4 scenarios with monthly, fortnightly, or weekly repayment views
- **Balance trajectory chart** — Line chart plotting all scenarios with toggle visibility
- **Dynamic text insights** — Auto-generated highlights comparing interest savings and time saved

## Quick Start

**Prerequisites:** Node.js 18+ and npm.

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
  engine/          Pure calculation functions (no React deps)
    amortization.js   Core amortization schedule
    offset.js         Offset account simulation
    extraRepayments.js Extra/lump-sum repayment modeling
    fhbss.js          FHBSS calculation
    comparison.js     Multi-scenario aggregator
    insights.js       Dynamic text insight generator
    constants.js      ATO thresholds and tax rates
  components/      React UI components
  hooks/           useCalculator — orchestrates engine pipeline
tests/             Unit tests for all engine modules (39 tests)
```

The calculation engine is fully decoupled from the UI — all functions are pure transformations with no side effects, making them easy to test and reason about independently.

## Testing

```bash
npm test
```

Tests cover all engine modules: amortization, offset, extra repayments, FHBSS, comparison, and insights. The test suite uses [Vitest](https://vitest.dev/) with Jest-compatible assertions.

## Deployment

The app is a static SPA, deployable to any static host. A `render.yaml` is included for [Render](https://render.com):

```bash
npm run build    # Output goes to dist/
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Build | Vite 6 |
| UI | React 18 |
| Charts | Recharts |
| Styling | Tailwind CSS 4 |
| Testing | Vitest |
| Engine | Pure JavaScript (ES2022+) |
