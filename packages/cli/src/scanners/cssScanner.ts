import fs from 'fs';
import { getFeatureInfo } from '../baseline.js';
import type { Finding } from '../types.js';

export async function scanCSS(filePath: string): Promise<Finding[]> {
  const text = fs.readFileSync(filePath, 'utf-8');
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);

  // Detect :has(
  lines.forEach((line, idx) => {
    const col = line.indexOf(':has(');
    if (col !== -1) findings.push(makeFinding(filePath, idx+1, col+1, 'has', line));
  });

  // Detect subgrid usage
  const subgridRe = /(grid-template-(columns|rows))\s*:\s*subgrid/;
  lines.forEach((line, idx) => {
    const m = line.match(subgridRe);
    if (m) findings.push(makeFinding(filePath, idx+1, (m.index||0)+1, 'subgrid', line));
  });

  // Detect view transitions opt-in
  const vtRe = /@view-transition\b/;
  lines.forEach((line, idx) => {
    const m = line.match(vtRe);
    if (m) findings.push(makeFinding(filePath, idx+1, (m.index||0)+1, 'view-transitions', line));
  });

  return await hydrate(findings);
}

function makeFinding(file: string, line: number, column: number, featureId: string, snippet: string): Finding {
  return {
    file, line, column, featureId, featureName: '', baseline: false,
    snippet: snippet.trim().slice(0, 300),
    detector: 'css'
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
