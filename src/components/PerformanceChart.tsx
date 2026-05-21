import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LatencyDatapoint, ServerNode } from '../types';

interface Props {
  data: LatencyDatapoint[];
  nodes: ServerNode[];
  onSetNodeStatus: (nodeId: string, status: ServerNode['status']) => void;
}

const statusStyles: Record<ServerNode['status'], string> = {
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unstable: 'bg-amber-50 text-amber-700 border-amber-200',
  offline: 'bg-red-50 text-red-700 border-red-200',
};

export const PerformanceChart: React.FC<Props> = ({ data, nodes, onSetNodeStatus }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(640);
  const chartHeight = 220;
  const paddingX = 42;
  const paddingY = 30;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 640;
      setChartWidth(Math.max(320, width));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const summary = useMemo(() => {
    if (data.length === 0) return { average: 0, peak: 0, successRate: 0 };
    const average = Math.round(data.reduce((sum, item) => sum + item.latencyMs, 0) / data.length);
    const peak = Math.max(...data.map((item) => item.latencyMs));
    const successRate = data.reduce((sum, item) => sum + item.successRate, 0) / data.length;
    return { average, peak, successRate: +successRate.toFixed(2) };
  }, [data]);

  const latencies = data.map((item) => item.latencyMs);
  const minLatency = Math.max(0, Math.min(...latencies, 80) - 20);
  const maxLatency = Math.max(...latencies, 220) + 20;

  const getCoords = (index: number, latency: number) => {
    const x = paddingX + (index / Math.max(1, data.length - 1)) * (chartWidth - paddingX * 2);
    const ratio = (latency - minLatency) / Math.max(1, maxLatency - minLatency);
    const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
    return { x, y };
  };

  const pathD = data.map((item, index) => {
    const point = getCoords(index, item.latencyMs);
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Services and latency</h2>
          <p className="mt-1 text-sm text-slate-500">Latency trend and node controls.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-sm">
          <div>
            <div className="text-xs text-slate-500">Average</div>
            <div className="font-semibold text-slate-900">{summary.average} ms</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Peak</div>
            <div className="font-semibold text-slate-900">{summary.peak} ms</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Success</div>
            <div className="font-semibold text-slate-900">{summary.successRate}%</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 2xl:grid-cols-[1fr_360px]">
        <div
          ref={containerRef}
          onMouseLeave={() => setActiveIdx(null)}
          className="min-h-[260px] rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <svg width={chartWidth} height={chartHeight} className="max-w-full overflow-visible">
            {[100, 150, 200].map((value) => {
              const y = getCoords(0, value).y;
              return (
                <g key={value}>
                  <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#e2e8f0" />
                  <text x={paddingX - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                    {value}
                  </text>
                </g>
              );
            })}

            <path d={pathD} fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

            {data.map((item, index) => {
              const point = getCoords(index, item.latencyMs);
              return (
                <circle
                  key={`${item.timestamp}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={activeIdx === index ? 5 : 3}
                  fill={activeIdx === index ? '#0f172a' : '#64748b'}
                  onMouseEnter={() => setActiveIdx(index)}
                  className="cursor-crosshair"
                />
              );
            })}

            {data.map((item, index) => {
              if (index % 4 !== 0) return null;
              const point = getCoords(index, item.latencyMs);
              return (
                <text key={item.timestamp} x={point.x} y={chartHeight - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
                  {item.timestamp}
                </text>
              );
            })}
          </svg>

          {activeIdx !== null && (
            <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {data[activeIdx].timestamp}: {data[activeIdx].latencyMs} ms, {data[activeIdx].successRate}% success
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Node</th>
                <th className="px-3 py-2">Load</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {nodes.map((node) => (
                <tr key={node.id}>
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{node.region}</div>
                    <div className="text-xs text-slate-500">{node.name.replace(/Node \d+: /, '')}</div>
                    <div className="mt-1 text-xs text-slate-500">{node.pingMs} ms ping</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-slate-500">CPU {Math.round(node.cpu)}%</div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-slate-600" style={{ width: `${node.cpu}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">RAM {Math.round(node.ram)}%</div>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={node.status}
                      onChange={(event) => onSetNodeStatus(node.id, event.target.value as ServerNode['status'])}
                      className={`w-full rounded-md border px-2 py-1 text-xs font-medium ${statusStyles[node.status]}`}
                    >
                      <option value="healthy">Healthy</option>
                      <option value="unstable">Unstable</option>
                      <option value="offline">Offline</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
