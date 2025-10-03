import fs from 'fs';
import { getFeatureInfo } from '../baseline.js';
import type { Finding } from '../types.js';

export async function scanHTML(filePath: string): Promise<Finding[]> {
  const text = fs.readFileSync(filePath, 'utf-8');
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);

  // Detect <dialog>
  const dialogRe = /<\s*dialog\b/i;
  lines.forEach((line, idx) => {
    const m = line.match(dialogRe);
    if (m) findings.push(makeFinding(filePath, idx+1, (m.index||0)+1, 'dialog', line));
  });

  return await hydrate(findings);
}

function makeFinding(file: string, line: number, column: number, featureId: string, snippet: string): Finding {
  return {
    file, line, column, featureId, featureName: '', baseline: false,
    snippet: snippet.trim().slice(0, 300),
    detector: 'html'
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
