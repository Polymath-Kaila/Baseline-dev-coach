import fs from 'fs';
import path from 'path';
import { scanCSS } from './scanners/cssScanner.js';
import { scanJS } from './scanners/jsScanner.js';
import { scanHTML } from './scanners/htmlScanner.js';
import type { Report, Finding } from './types.js';

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i=2; i<argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.split('=');
      args[k.replace(/^--/, '')] = v ?? (argv[i+1] && !argv[i+1].startsWith('--') ? (argv[++i]) : 'true');
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(process.cwd(), args.path || '.');
  const format = (args.format || 'console') as 'console' | 'json';
  const failOn = (args['fail-on'] || 'none') as 'none' | 'limited' | 'newly';
  const exts = (args.exts || 'js,ts,css,html').split(',');

  const files = listFiles(root, exts);
  let findings: Finding[] = [];

  for (const file of files) {
    if (file.endsWith('.css')) findings = findings.concat(await scanCSS(file));
    else if (file.endsWith('.html') || file.endsWith('.htm')) findings = findings.concat(await scanHTML(file));
    else findings = findings.concat(await scanJS(file));
  }

  const report: Report = { filesScanned: files.length, findings };
  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\n🧭 Baseline Dev Coach — scanned ${report.filesScanned} files`);
    for (const f of report.findings) {
      const when = f.baseline === 'high' ? `(widely since ${f.baseline_high_date})`
                 : f.baseline === 'low' ? `(newly since ${f.baseline_low_date})`
                 : `(not in Baseline)`;
      console.log(`• ${f.file}:${f.line}:${f.column}  ${f.featureName} [${f.featureId}]  Baseline: ${f.baseline} ${when}`);
      if (f.snippet) console.log(`  ↳ ${f.snippet}`);
    }
  }

  // Exit code policy
  if (failOn !== 'none') {
    const hasLimited = report.findings.some(f => f.baseline === false);
    const hasNewly = report.findings.some(f => f.baseline === 'low');
    if (failOn === 'limited' && hasLimited) process.exit(2);
    if (failOn === 'newly' && (hasLimited || hasNewly)) process.exit(3);
  }
}

function listFiles(root: string, exts: string[]): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        walk(p);
      } else {
        const lower = entry.name.toLowerCase();
        if (exts.some(e => lower.endsWith('.'+e))) out.push(p);
      }
    }
  }
  walk(root);
  return out;
}

// Run
main().catch(err => {
  console.error('Baseline Dev Coach failed:', err);
  process.exit(1);
});
