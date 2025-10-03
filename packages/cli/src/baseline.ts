import type { FeatureInfo, BaselineLevel } from './types.js';

// Lazy import of web-features to keep CLI fast and allow fallback if not installed.
type WFStatus = { baseline: BaselineLevel, baseline_low_date?: string, baseline_high_date?: string };
type WFFeature = { name: string; description?: string; status: WFStatus };
// Features object is a record keyed by id.
let wfFeatures: Record<string, WFFeature> | null = null;

async function loadWebFeatures(): Promise<void> {
  if (wfFeatures) return;
  try {
    const mod = await import('web-features');
    // `features` is an object keyed by id per official docs.
    // @ts-ignore
    wfFeatures = mod.features as Record<string, WFFeature>;
  } catch {
    // Fallback: minimal subset. Install `web-features` for full data.
    wfFeatures = {
      'has': { name: ':has() selector', description: 'CSS :has() pseudo-class', status: { baseline: 'low', baseline_low_date: '2023-12-19' } },
      'subgrid': { name: 'Subgrid', description: 'CSS grid subgrid value', status: { baseline: 'low', baseline_low_date: '2023-09-15' } },
      'dialog': { name: '<dialog> element', description: 'Modal and non-modal dialogs', status: { baseline: 'high', baseline_high_date: '2024-09-14' } },
      'async-clipboard': { name: 'Async Clipboard API', description: 'navigator.clipboard', status: { baseline: 'high', baseline_high_date: '2022-08-01' } },
      'share': { name: 'Web Share API', description: 'navigator.share', status: { baseline: 'low', baseline_low_date: '2020-01-01' } },
      'view-transitions': { name: 'View Transitions API', description: 'Animated page/view transitions', status: { baseline: false } },
    };
  }
}

export async function getFeatureInfo(id: string): Promise<FeatureInfo | null> {
  await loadWebFeatures();
  const f = wfFeatures![id];
  if (!f) return null;
  return {
    id, name: f.name, description: f.description,
    baseline: f.status.baseline,
    baseline_low_date: f.status.baseline_low_date,
    baseline_high_date: f.status.baseline_high_date,
  };
}
