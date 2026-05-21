import React from 'react';
import { SecurityThreat } from '../types';

interface Props {
  threats: SecurityThreat[];
}

const riskStyles: Record<SecurityThreat['riskLevel'], string> = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  medium: 'border-blue-200 bg-blue-50 text-blue-700',
};

export const SecurityThreatMonitor: React.FC<Props> = ({ threats }) => {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Security events</h2>
        <p className="mt-1 text-sm text-slate-500">Recent blocked or investigated requests.</p>
      </div>

      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-200">
        {threats.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">No security events.</div>
        ) : (
          threats.map((threat) => (
            <div key={threat.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">{threat.type}</div>
                  <div className="mt-1 text-sm text-slate-500">{threat.sourceIp} - {threat.country}</div>
                </div>
                <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${riskStyles[threat.riskLevel]}`}>
                  {threat.riskLevel}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{threat.targetEndpoint}</span>
                <span>{threat.status}</span>
                <span>{threat.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
