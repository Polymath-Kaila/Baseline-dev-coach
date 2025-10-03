import * as vscode from 'vscode';

type BaselineLevel = 'high' | 'low' | false;
type WFStatus = { baseline: BaselineLevel; baseline_low_date?: string; baseline_high_date?: string };
type WFFeature = { name: string; description?: string; status: WFStatus };
let features: Record<string, WFFeature> | null = null;

async function ensureFeatures() {
  if (features) return;
  try {
    const mod = await import('web-features');
    // @ts-ignore - official export is an object keyed by id
    features = mod.features as Record<string, WFFeature>;
  } catch {
    // Minimal fallback so the extension still demos offline
    features = {
      has: { name: ':has() selector', status: { baseline: 'low', baseline_low_date: '2023-12-19' } },
      subgrid: { name: 'Subgrid', status: { baseline: 'low', baseline_low_date: '2023-09-15' } },
      dialog: { name: '<dialog> element', status: { baseline: 'high', baseline_high_date: '2024-09-14' } },
      'async-clipboard': { name: 'Async Clipboard API', status: { baseline: 'high', baseline_high_date: '2022-08-01' } },
      share: { name: 'Web Share API', status: { baseline: 'low', baseline_low_date: '2020-01-01' } },
      'view-transitions': { name: 'View Transitions API', status: { baseline: false } }
    };
  }
}

function baselineText(level: BaselineLevel, low?: string, high?: string) {
  switch (level) {
    case 'high':
      return `✅ **Baseline: Widely supported**${high ? `\nSince: ${high}` : ''}`;
    case 'low':
      return `⚠️ **Baseline: Newly supported**${low ? `\nSince: ${low}` : ''}`;
    default:
      return `❌ **Baseline: Not yet in Baseline**`;
  }
}

function featureInfo(id: string) {
  const f = features?.[id];
  if (!f) return null;
  return {
    id,
    name: f.name,
    level: f.status.baseline,
    low: f.status.baseline_low_date,
    high: f.status.baseline_high_date
  };
}

function hoverMarkdown(id: string) {
  const info = featureInfo(id);
  if (!info) return null;
  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.appendMarkdown(`### ${info.name}\n\n`);
  md.appendMarkdown(`${baselineText(info.level, info.low, info.high)}\n\n`);
  md.appendMarkdown(`*Source: [\`web-features\`](https://www.npmjs.com/package/web-features)*`);
  return md;
}

/**
 * Find substring match on current line and return a Range that includes it
 * only if the cursor is inside that substring. Returns null otherwise.
 */
function matchOnLine(doc: vscode.TextDocument, pos: vscode.Position, regex: RegExp): vscode.Range | null {
  const text = doc.lineAt(pos.line).text;
  const m = regex.exec(text);
  if (!m || m.index < 0) return null;
  const start = m.index;
  const end = m.index + m[0].length;
  if (pos.character < start || pos.character > end) return null;
  return new vscode.Range(new vscode.Position(pos.line, start), new vscode.Position(pos.line, end));
}

/** CSS-like hovers */
function registerCSSHover(ctx: vscode.ExtensionContext) {
  const cssSelectors: vscode.DocumentSelector = [
    { language: 'css', scheme: 'file' },
    { language: 'scss', scheme: 'file' },
    { language: 'less', scheme: 'file' }
  ];

  ctx.subscriptions.push(
    vscode.languages.registerHoverProvider(cssSelectors, {
      async provideHover(doc, pos) {
        await ensureFeatures();

        // :has(
        let range = matchOnLine(doc, pos, /:has\(/);
        if (range) return new vscode.Hover(hoverMarkdown('has')!, range);

        // subgrid (grid-template-rows/columns: subgrid)
        range = matchOnLine(doc, pos, /\bsubgrid\b/);
        if (range) return new vscode.Hover(hoverMarkdown('subgrid')!, range);

        // @view-transition
        range = matchOnLine(doc, pos, /@view-transition\b/);
        if (range) return new vscode.Hover(hoverMarkdown('view-transitions')!, range);

        return undefined;
      }
    })
  );
}

/** HTML-like hovers */
function registerHTMLHover(ctx: vscode.ExtensionContext) {
  const htmlSelectors: vscode.DocumentSelector = [
    { language: 'html', scheme: 'file' },
    { language: 'handlebars', scheme: 'file' }
  ];

  ctx.subscriptions.push(
    vscode.languages.registerHoverProvider(htmlSelectors, {
      async provideHover(doc, pos) {
        await ensureFeatures();

        // <dialog> or </dialog>
        const range = matchOnLine(doc, pos, /<\/?\s*dialog\b/);
        if (range) return new vscode.Hover(hoverMarkdown('dialog')!, range);

        return undefined;
      }
    })
  );
}

/** JS/TS(-react) hovers */
function registerJSHover(ctx: vscode.ExtensionContext) {
  const jsSelectors: vscode.DocumentSelector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
    { language: 'javascriptreact', scheme: 'file' },
    { language: 'typescriptreact', scheme: 'file' }
  ];

  ctx.subscriptions.push(
    vscode.languages.registerHoverProvider(jsSelectors, {
      async provideHover(doc, pos) {
        await ensureFeatures();

        // navigator.share
        let range = matchOnLine(doc, pos, /navigator\s*\.\s*share\s*\(/);
        if (range) return new vscode.Hover(hoverMarkdown('share')!, range);

        // navigator.clipboard
        range = matchOnLine(doc, pos, /navigator\s*\.\s*clipboard\b/);
        if (range) return new vscode.Hover(hoverMarkdown('async-clipboard')!, range);

        // document.startViewTransition(
        range = matchOnLine(doc, pos, /document\s*\.\s*startViewTransition\s*\(/);
        if (range) return new vscode.Hover(hoverMarkdown('view-transitions')!, range);

        return undefined;
      }
    })
  );
}

export async function activate(context: vscode.ExtensionContext) {
  await ensureFeatures();

  // Status confirmation so you know the dev host is running your latest build
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.text = '$(rocket) Baseline Dev Coach active';
  status.tooltip = 'Hover over modern features to see Baseline status';
  status.show();
  context.subscriptions.push(status);

  registerCSSHover(context);
  registerHTMLHover(context);
  registerJSHover(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('bdc.showInfo', async () => {
      await ensureFeatures();
      vscode.window.showInformationMessage('Baseline Dev Coach is active 🚀');
    })
  );
}

export function deactivate() {}
