import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';

interface Props {
  logs: SystemLog[];
}

const levelStyles: Record<SystemLog['level'], string> = {
  info: 'text-blue-700',
  warn: 'text-amber-700',
  error: 'text-red-700',
  success: 'text-emerald-700',
};

export const LiveLogStream: React.FC<Props> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Logs</h2>
        <p className="mt-1 text-sm text-slate-500">Recent backend and service messages.</p>
      </div>

      <div ref={scrollRef} className="h-80 overflow-y-auto px-4 py-3">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No logs yet.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="grid grid-cols-[74px_92px_1fr] gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                <span className="font-mono text-slate-500">{log.timestamp}</span>
                <span className={`font-medium ${levelStyles[log.level]}`}>{log.level}</span>
                <span className="min-w-0 text-slate-700">
                  <span className="font-medium text-slate-900">{log.module}</span>: {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
