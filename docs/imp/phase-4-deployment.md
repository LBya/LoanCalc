# Phase 4: Deployment & Final Verification

> **Prerequisite:** Phase 3 complete. Full application working locally. All tests passing.
> **Verification Gate:** Application is live on Render. All success criteria from the PRD are verified.

---

## Folder Structure at End of Phase 4

```
LoanCalc/
├── docs/
│   ├── design.md
│   ├── original_prd.md
│   ├── phase-1-foundation.md
│   ├── phase-2-scenarios.md
│   ├── phase-3-visualization.md
│   ├── phase-4-deployment.md     ← You are here
│   └── progress-tracker.md
├── public/
│   └── index.html
├── src/
│   ├── index.css                  # Tailwind directives
│   ├── main.jsx
│   ├── App.jsx
│   ├── engine/
│   │   ├── amortization.js
│   │   ├── constants.js
│   │   ├── offset.js
│   │   ├── extraRepayments.js
│   │   ├── fhbss.js
│   │   ├── comparison.js
│   │   └── insights.js
│   ├── components/
│   │   ├── ScenarioConfig.jsx
│   │   ├── ComparisonTable.jsx
│   │   ├── BalanceChart.jsx
│   │   └── TextInsights.jsx
│   └── hooks/
│       └── useCalculator.js
├── tests/
│   ├── amortization.test.js
│   ├── offset.test.js
│   ├── extraRepayments.test.js
│   ├── fhbss.test.js
│   ├── comparison.test.js
│   └── insights.test.js
├── package.json
├── vite.config.js
├── vitest.config.js
├── render.yaml                    ← NEW: Render deployment config
├── .gitignore
└── agents_kaparthy.md
```

---

## Task 4.1: Initialize Git Repository

### What to do

Set up a Git repository for version control and deployment.

### How

```bash
git init
git add .
git commit -m "Initial commit: LoanCalc MVP with full engine, UI, and tests"
```

### Why Git before deployment?

Render deploys from a Git repository (GitHub, GitLab, or its own internal repo). You need a clean commit history before deploying. This also creates a checkpoint — if deployment breaks something, you can always go back to this working state.

### .gitignore verification

Make sure `.gitignore` includes:
```
node_modules/
dist/
.DS_Store
*.local
```

**Why these entries:**
- `node_modules/` — Can be recreated with `npm install`. Should never be committed (huge, platform-specific).
- `dist/` — The build output. Can be recreated with `npm run build`.
- `.DS_Store` — macOS artifact. Prevents noise in diffs.
- `*.local` — Local environment files. Not needed for this project but good practice.

### Verification

- [ ] `git status` shows a clean working tree
- [ ] `node_modules/` is NOT tracked
- [ ] `dist/` is NOT tracked

---

## Task 4.2: Create Render Configuration

### What to do

Create `render.yaml` in the project root for Render deployment.

### How

```yaml
services:
  - type: web
    name: loancalc
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    headers:
      - path: /assets/*
        name: Cache-Control
        value: public, max-age=31536000, immutable
      - path: /*
        name: Cache-Control
        value: public, max-age=3600
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Why this configuration

**`runtime: static`** — This tells Render it's a static site (no server). Render serves the files directly from its CDN. This is the free tier option.

**`buildCommand: npm install && npm run build`** — Render runs this on every deploy. `npm install` restores dependencies, `npm run build` generates the `dist/` folder.

**`staticPublishPath: dist`** — Vite outputs the built files to `dist/`. Render serves this folder.

**Cache headers:**
- `/assets/*` gets a 1-year cache with `immutable`. Vite hashes asset filenames (e.g., `app-3f2a.js`), so the filename changes when the content changes. Aggressive caching is safe.
- `/*` gets a 1-hour cache. The HTML file itself changes less often but shouldn't be cached forever.

**SPA rewrite rule:** React Router isn't used in this app (it's a single page), but the rewrite rule ensures that any direct URL access serves `index.html`. This is defensive — it costs nothing and prevents potential 404s.

### Verification

- [ ] `render.yaml` exists in project root
- [ ] YAML is valid (no syntax errors)
- [ ] `staticPublishPath` matches Vite's output directory (`dist`)

---

## Task 4.3: Verify Production Build

### What to do

Test that the production build works correctly before deploying.

### How

```bash
npm run build
npm run preview
```

`npm run build` creates an optimized production bundle in `dist/`. `npm run preview` starts a local server serving the production build (not the dev server).

### Why preview before deploy

The dev server and the production build can behave differently:
- Vite may tree-shake differently in production mode
- CSS Modules might have different class names in production
- Asset paths might differ

Previewing the production build catches these issues before they reach the deployed site.

### What to check during preview

1. **Load the app** — Does the page render without errors?
2. **Open browser DevTools console** — Any errors or warnings?
3. **Test a full workflow** — Add 3 scenarios, configure different strategies, verify comparison table, chart, and insights all work.
4. **Check the network tab** — Are assets loading correctly? Any 404s?
5. **Hard refresh (Ctrl+Shift+R)** — Does the app load correctly on a fresh page load?

### Build optimization (if needed)

If the bundle size is unusually large, check what's included:

```bash
npx vite-bundle-visualizer
```

Recharts is the largest dependency. For a hobby project, its size (~200KB gzipped) is acceptable. If it becomes a problem, consider lazy-loading the chart component — but don't optimize prematurely.

### Verification

- [ ] `npm run build` completes without errors
- [ ] `npm run preview` serves a working app
- [ ] All features work in production build: inputs, table, chart, insights
- [ ] No console errors in production build
- [ ] Build output is in `dist/` folder

---

## Task 4.4: Deploy to Render

### What to do

Push the code to GitHub and deploy via Render.

### How

**Option A: Deploy from GitHub (recommended)**

1. Create a GitHub repository:
   ```bash
   gh repo create loancalc --public --source=. --push
   ```
   **Why public?** Render's free tier can deploy from public repos. If you want it private, you'll need to connect Render to GitHub directly.

2. Go to [render.com](https://render.com), sign up/log in with GitHub.

3. Click "New" → "Static Site"

4. Connect your GitHub repository

5. Render will auto-detect `render.yaml` and use those settings

6. Click "Create Static Site"

7. Wait for the build to complete (usually 1-2 minutes)

**Option B: Manual Render setup (if render.yaml isn't detected)**

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

### Post-deployment verification

1. **Open the deployed URL** — Does the page load?
2. **Test the full workflow** — Same as the local production test
3. **Check HTTPS** — Render provides free SSL. Verify the site loads over HTTPS.
4. **Test from an incognito window** — Eliminates any cached local state

### Automatic deploys

Once connected, Render auto-deploys on every push to `main`. This is the desired workflow:
1. Make changes locally
2. Test with `npm run preview`
3. Commit and push
4. Render rebuilds and deploys automatically

### Verification

- [ ] App is accessible at the Render URL
- [ ] All features work on the deployed version
- [ ] HTTPS is active
- [ ] Page loads correctly from an incognito window

---

## Task 4.5: PRD Success Criteria Verification

### What to do

Walk through each success criterion from the original PRD and verify it's met.

### Verification checklist

| # | Requirement | Success Criterion | How to Verify | Status |
|---|-------------|-------------------|---------------|--------|
| 1 | Base Repayment Calculation | Monthly repayments verified against external tools | Enter $500k at 6.5% for 30 years, compare with bank calculator | [ ] |
| 2 | Adjustable Loan Lifetime | User can change loan term, schedule updates dynamically | Change term from 30 to 25 years, verify updated numbers | [ ] |
| 3 | FHBSS Integration | Worst-case tax rate applied, baseline loan adjusted | Enter FHBSS contributions, verify reduced principal and net withdrawal | [ ] |
| 4 | Offset Account | Offset reduces interest and shortens loan lifecycle | Enter $50k offset, verify lower interest and shorter term | [ ] |
| 5 | Extra Repayments | Extra payments update comparative schedule | Enter $500/month extra, verify earlier payoff | [ ] |
| 6 | Side-by-Side Comparison | Table supports 3-4 scenarios simultaneously | Add 4 scenarios, verify table shows all columns | [ ] |
| 7 | Interactive Graph | Line graph plots all active scenario trajectories | Verify chart shows lines for each scenario with correct trajectories | [ ] |
| 8 | Dynamic Text Insights | Accurate text stating differences in cost/timeframe | Verify insights mention correct dollar amounts and time periods | [ ] |

### How to verify against external calculators

Use at least two of these for Req #1 verification:
- ASIC Moneysmart: `https://moneysmart.gov.au/home-loans/mortgage-calculator`
- Figura: `https://figura.com.au/calculators/repayments`
- Any major Australian bank calculator

Test with these inputs:
- $500,000 principal, 6.5%, 30 years → expected ~$3,160.34/month
- $300,000 principal, 5.5%, 25 years → verify against external
- $750,000 principal, 7.0%, 30 years → verify against external

Document which external tools you used and the results in a comment or the progress tracker.

### Verification

- [ ] All 8 success criteria verified and checked off
- [ ] External calculator comparisons documented
- [ ] Any discrepancies investigated and resolved

---

## Task 4.6: Final Review & Cleanup

### What to do

A final pass to clean up any rough edges before considering the project "done."

### Review checklist

**Code quality:**
- [ ] No `console.log` statements in production code (test files are fine)
- [ ] No commented-out code blocks
- [ ] No unused imports
- [ ] No TODO comments that aren't tracked in progress-tracker.md
- [ ] All engine functions have JSDoc comments explaining inputs/outputs

**Test coverage:**
- [ ] All engine modules have corresponding test files
- [ ] Tests cover the happy path and at least 2 edge cases per module
- [ ] `npm test` passes all tests with no warnings

**UI polish:**
- [ ] No layout breaks at 1440px width (primary target)
- [ ] No layout breaks at 1920px width
- [ ] Text is readable (sufficient contrast, reasonable font sizes)
- [ ] Chart is legible (axis labels, legend, tooltip all work)
- [ ] Empty states show helpful messages (not blank space)

**Documentation:**
- [ ] `docs/design.md` accurately reflects the final implementation
- [ ] `docs/progress-tracker.md` is up to date
- [ ] FHBSS constants have source URLs and "update annually" comments

**Deployment:**
- [ ] `render.yaml` is in the repository
- [ ] Deployed app matches local production build
- [ ] Auto-deploys work (push to main triggers rebuild)

### What NOT to do in cleanup

Per `agents_kaparthy.md`:
- Don't refactor working code for aesthetics
- Don't add error handling for impossible scenarios
- Don't extract shared utilities that are only used once
- Don't add comments that restate what the code does

---

## Phase 4 Completion Checklist

- [ ] Git repository initialized with clean history
- [ ] `render.yaml` created and valid
- [ ] Production build tested locally (`npm run preview`)
- [ ] App deployed to Render and accessible
- [ ] All 8 PRD success criteria verified
- [ ] External calculator verification documented
- [ ] Final cleanup pass complete
- [ ] Progress tracker updated to reflect completion
- [ ] `npm test` passes all tests
- [ ] `npm run build` succeeds
- [ ] Deployed app matches local production build

**When every checkbox above is checked, the MVP is complete.**
