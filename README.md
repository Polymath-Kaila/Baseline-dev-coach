# Baseline Dev Coach 

Baseline Dev Coach (BDC) helps you adopt modern web features with confidence by checking your code against the **Baseline** dataset from the official `web-features` package.

[▶️ Watch the Demo Video](https://youtu.be/YOUR_LINK)


It ships with:

- **CLI** (`@bdc/cli`) — scans your project for selected CSS/HTML/JS patterns and reports Baseline status (Limited / Newly / Widely).
- **VS Code Extension** (`@bdc/vscode-ext`) — inline **hover tips** that show Baseline status for commonly used features.
- **GitHub Action** — runs the CLI on pull requests and posts a summary comment.

> Data source: [`web-features` (official Baseline dataset)](https://www.npmjs.com/package/web-features)

---

## Requirements

- **Node.js 18+ (recommended: 20+)**
- **npm 9+**
- macOS, Linux, or Windows

---

## Quick Start

```bash
# 1) Install deps (from repo root)
npm install

# 2) Build CLI & VS Code extension
npm run build

# 3) Run the CLI on the included demo app
node packages/cli/dist/index.js --path ./demo --format console
```

**Alternative (uses the workspace bin):**
```bash
# Same as above but executes the CLI by its bin name (`bdc`)
npm exec -w @bdc/cli bdc -- --path ./demo --format json
```

You should see findings that include a **Baseline** column like `limited`, `low (newly)`, or `high (widely)` plus a date when available.

---

## CLI Usage

```
bdc --path <dir> [--format console|json] [--fail-on none|limited|newly] [--exts js,ts,css,html]
```

- `--path` (string): directory to scan (default: `.`)
- `--format` (string): `console` (pretty) or `json` (machine-readable)
- `--fail-on` (string):
  - `none` (default): always exit 0
  - `limited`: exit non-zero if any **Limited** features are found
  - `newly`: exit non-zero if **Limited** or **Newly** features are found
- `--exts` (csv): file extensions to scan (default: `js,ts,css,html`)

**Detectors in MVP (expandable):**
- **CSS:** `:has(` → `has`, `subgrid` → `subgrid`, `@view-transition` → `view-transitions`
- **HTML:** `<dialog>` → `dialog`
- **JS:** `navigator.clipboard` → `async-clipboard`, `navigator.share` → `share`

> These map to `web-features` IDs. The tool looks up Baseline status/dates from the dataset and prints them next to each finding.

---

## VS Code Extension (Dev Run)

```bash
# Build (already done in Quick Start, safe to repeat)
npm run -w @bdc/vscode-ext build

# Open the extension folder in VS Code
code packages/vscode-extension

# Press F5 to launch "Extension Development Host"
```

**Try hovers on:**
- CSS: `:has(`, `subgrid`, `@view-transition`
- HTML: `<dialog>`
- JS: `navigator.clipboard`, `navigator.share`

You’ll see a hover with **Baseline** status and (when available) the “since” date.

---

## GitHub Action (CI)

Use the included workflow:

```
.github/workflows/baseline-check.yml
```

This workflow:
1. Checks out the repo.
2. Installs deps and builds the CLI.
3. Runs the scan and captures JSON.
4. Posts a **PR comment** with a concise report.

**Enable it** by committing the file as-is. It runs on each pull request.

---

## Demo App

A small demo is provided at `./demo` that intentionally uses a few modern features.  
Run the CLI against it:

```bash
node packages/cli/dist/index.js --path ./demo --format console
```

---

## Why This Can Win (Judging Fit)

- **Innovation:** Brings Baseline into the tools devs use every day (IDE hovers + CI guardrails), not just docs.
- **Usefulness:** Clear signals to **remove legacy code** and **safely adopt** modern features; actionable in PRs.
- **MVP Completeness:** Installs, runs, and demonstrates value quickly (CLI + VS Code + CI).

---

## Devpost Submission Checklist

-  **Public repo** with **MIT** license (this repo includes `LICENSE`).
-  **README** (this file) with clear run instructions.
-  **Demo video (~3 min)** showing:
  1. CLI scan on `./demo` (console output)
  2. VS Code hover tips
  3. PR comment from GitHub Action
-  (Optional) Screenshots/GIFs added to the README.
-  Add all team members to the Devpost entry.

---

## Troubleshooting

**TypeScript errors like `Cannot find module 'fs'` or `process`:**  
Install Node types for the CLI workspace and rebuild:
```bash
npm install -w @bdc/cli @types/node --save-dev
npm run -w @bdc/cli build
```

**Still failing?**  
- Verify Node: `node -v` (must be 18+).  
- Clean install:  
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

---

## Roadmap (Post-MVP)

- AST-based detectors (JS/CSS) for deeper coverage and fewer false positives  
- Configurable **target browsers** and project-level support matrix  
- SARIF output for code scanning integrations  
- More feature IDs mapped (e.g., CSS Nesting, Container Queries, Scroll-Driven Animations)

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Acknowledgements

- Baseline data via the official `web-features` package.
