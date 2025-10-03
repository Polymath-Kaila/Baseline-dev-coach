import fs from 'fs';
import { getFeatureInfo } from '../baseline.js';
import type { Finding } from '../types.js';

export async function scanJS(filePath: string): Promise<Finding[]> {
  const text = fs.readFileSync(filePath, 'utf-8');
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);

  // navigator.share
  const shareRe = /navigator\s*\.\s*share\s*\(/;
  // navigator.clipboard
  const clipRe = /navigator\s*\.\s*clipboard\b/;
  // Document.startViewTransition
  const vtRe = /document\s*\.\s*startViewTransition\s*\(/;

  lines.forEach((line, idx) => {
    if (shareRe.test(line)) findings.push(makeFinding(filePath, idx+1, (line.search(shareRe)||0)+1, 'share', line));
    if (clipRe.test(line)) findings.push(makeFinding(filePath, idx+1, (line.search(clipRe)||0)+1, 'async-clipboard', line));
    if (vtRe.test(line)) findings.push(makeFinding(filePath, idx+1, (line.search(vtRe)||0)+1, 'view-transitions', line));
  });

  return await hydrate(findings);
}

function makeFinding(file: string, line: number, column: number, featureId: string, snippet: string): Finding {
  return {
    file, line, column, featureId, featureName: '', baseline: false,
    snippet: snippet.trim().slice(0, 300),
    detector: 'js'
  };
}

async function hydrate(fs_: Finding[]): Promise<Finding[]> {
  const out: Finding[] = [];
  for (const f of fs_) {
    const info = await getFeatureInfo(f.featureId);
    out.push({ ...f, featureName: info?.name ?? f.featureId, baseline: (info?.baseline ?? false), baseline_low_date: info?.baseline_low_date, baseline_high_date: info?.baseline_high_date });
  }
  return out;
}
