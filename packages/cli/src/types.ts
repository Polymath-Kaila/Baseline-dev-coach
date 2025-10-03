export type BaselineLevel = 'high' | 'low' | false;

export interface FeatureInfo {
  id: string;
  name: string;
  description?: string;
  baseline: BaselineLevel;
  baseline_low_date?: string;
  baseline_high_date?: string;
}

export interface Finding {
  file: string;
  line: number;
  column: number;
  featureId: string;
  featureName: string;
  baseline: BaselineLevel;
  baseline_low_date?: string;
  baseline_high_date?: string;
  snippet?: string;
  detector: string;
}

export interface Report {
  filesScanned: number;
  findings: Finding[];
}
