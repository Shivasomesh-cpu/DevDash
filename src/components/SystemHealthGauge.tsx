import React from 'react';
import { Activity, Cpu, HardDrive, RefreshCw, Server } from 'lucide-react';
import { SystemStatus } from '../types';

interface Props {
  status: SystemStatus;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function MetricCard({
  label,
  value,
  helper,
  percent,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  percent?: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-500">
          {icon}
        </div>
      </div>
      {percent !== undefined && (
        <div className="mt-4 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-slate-700 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
      )}
      <div className="mt-3 text-xs text-slate-500">{helper}</div>
    </div>
  );
}

export const SystemHealthGauge: React.FC<Props> = ({ status, onRefresh, isRefreshing }) => {
  const healthLabel = status.globalScore >= 99.9 ? 'Healthy' : status.globalScore >= 99 ? 'Watch' : 'Needs attention';

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">System overview</h2>
          <p className="mt-1 text-sm text-slate-500">Current service health and resource usage.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh telemetry
        </button>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Availability"
          value={`${status.globalScore}%`}
          helper={healthLabel}
          percent={status.globalScore}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="CPU"
          value={`${status.cpuLoad}%`}
          helper="Current compute load"
          percent={status.cpuLoad}
          icon={<Cpu className="h-4 w-4" />}
        />
        <MetricCard
          label="Memory"
          value={`${status.memoryUsage}%`}
          helper="Current memory usage"
          percent={status.memoryUsage}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <MetricCard
          label="Requests"
          value={`${status.requestRate}/s`}
          helper={`${status.activeDeployments} active services`}
          icon={<Server className="h-4 w-4" />}
        />
      </div>
    </section>
  );
};
