import * as vscode from 'vscode';

type BaselineLevel = 'high' | 'low' | false;
type WFStatus = { baseline: BaselineLevel, baseline_low_date?: string, baseline_high_date?: string };
type WFFeature = { name: string; description?: string; status: WFStatus };
let features: Record<string, WFFeature> | null = null;

async function ensureFeatures() {
  if (features) return;
  try {
    const mod = await import('web-features');
    // @ts-ignore
    features = mod.features as Record<string, WFFeature>;
  } catch {
    features = {
      'has': { name: ':has() selector', status: { baseline: 'low', baseline_low_date: '2023-12-19' } },
      'subgrid': { name: 'Subgrid', status: { baseline: 'low', baseline_low_date: '2023-09-15' } },
      'dialog': { name: '<dialog> element', status: { baseline: 'high', baseline_high_date: '2024-09-14' } },
      'async-clipboard': { name: 'Async Clipboard API', status: { baseline: 'high', baseline_high_date: '2022-08-01' } },
      'share': { name: 'Web Share API', status: { baseline: 'low', baseline_low_date: '2020-01-01' } },
      'view-transitions': { name: 'View Transitions API', status: { baseline: false } },
    };
  }
}

function baselineText(level: BaselineLevel, low?: string, high?: string) {
  if (level === 'high') return `**Baseline: Widely available** (since ${high})`;
  if (level === 'low') return `**Baseline: Newly available** (since ${low})`;
  return `**Baseline: Limited availability**`;
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
  md.appendMarkdown(`### ${info.name}\n`);
  md.appendMarkdown(`${baselineText(info.level, info.low, info.high)}\n`);
  md.appendMarkdown(`\n*Source: \`web-features\` dataset*`);
  return md;
}

function registerCSSHover(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.languages.registerHoverProvider('css', {
    async provideHover(doc, pos) {
      await ensureFeatures();
      const range = doc.getWordRangeAtPosition(pos, /:has\(|subgrid|@view-transition/);
      if (!range) return;
      const txt = doc.getText(range);
      if (txt.includes(':has(')) return new vscode.Hover(hoverMarkdown('has')!);
      if (txt.includes('subgrid')) return new vscode.Hover(hoverMarkdown('subgrid')!);
      if (txt.includes('@view-transition')) return new vscode.Hover(hoverMarkdown('view-transitions')!);
    }
  }));
}

function registerHTMLHover(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.languages.registerHoverProvider('html', {
    async provideHover(doc, pos) {
      await ensureFeatures();
      const range = doc.getWordRangeAtPosition(pos, /<\/?dialog/);
      if (!range) return;
      return new vscode.Hover(hoverMarkdown('dialog')!);
    }
  }));
}

function registerJSHover(ctx: vscode.ExtensionContext) {
  const langs = ['javascript', 'typescript'];
  for (const lang of langs) {
    ctx.subscriptions.push(vscode.languages.registerHoverProvider(lang, {
      async provideHover(doc, pos) {
        await ensureFeatures();
        const range = doc.getWordRangeAtPosition(pos, /navigator\.share|navigator\.clipboard|startViewTransition/);
        if (!range) return;
        const txt = doc.getText(range);
        if (txt.includes('navigator.share')) return new vscode.Hover(hoverMarkdown('share')!);
        if (txt.includes('navigator.clipboard')) return new vscode.Hover(hoverMarkdown('async-clipboard')!);
        if (txt.includes('startViewTransition')) return new vscode.Hover(hoverMarkdown('view-transitions')!);
      }
    }));
  }
}

export async function activate(context: vscode.ExtensionContext) {
  await ensureFeatures();
  registerCSSHover(context);
  registerHTMLHover(context);
  registerJSHover(context);

  const disposable = vscode.commands.registerCommand('bdc.showInfo', async () => {
    await ensureFeatures();
    vscode.window.showInformationMessage('Baseline Dev Coach active.');
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}
