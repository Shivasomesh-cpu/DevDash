import React from 'react';
import { RefreshCw } from 'lucide-react';
import { WebVitalMetric } from '../types';

interface Props {
  metrics: WebVitalMetric[];
  onRefreshMetrics: () => void;
  isRefreshing: boolean;
}

const ratingStyles: Record<WebVitalMetric['rating'], string> = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'needs-improvement': 'border-amber-200 bg-amber-50 text-amber-700',
  poor: 'border-red-200 bg-red-50 text-red-700',
};

const labels: Record<string, string> = {
  LCP: 'Largest paint',
  FID: 'Input delay',
  CLS: 'Layout shift',
  FCP: 'First paint',
  TTFB: 'Server response',
};

export const WebVitalsRings: React.FC<Props> = ({ metrics, onRefreshMetrics, isRefreshing }) => {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Web vitals</h2>
          <p className="mt-1 text-sm text-slate-500">User-facing page performance.</p>
        </div>
        <button
          type="button"
          onClick={onRefreshMetrics}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          Re-scan
        </button>
      </div>

      <div className="divide-y divide-slate-200">
        {metrics.map((metric) => (
          <div key={metric.name} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="font-medium text-slate-900">{metric.name}</div>
              <div className="text-sm text-slate-500">{labels[metric.name] ?? metric.name}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-950">
                {metric.score} {metric.unit}
              </div>
              <div className="mt-1 text-xs text-slate-500">Target {metric.target}</div>
              <span className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${ratingStyles[metric.rating]}`}>
                {metric.rating.replace('-', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
