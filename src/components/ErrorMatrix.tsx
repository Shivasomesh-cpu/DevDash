import React, { useState } from 'react';
import { Check, Clipboard, Search } from 'lucide-react';
import { ErrorTrace, SeverityType } from '../types';

interface Props {
  errors: ErrorTrace[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

const severityStyles: Record<SeverityType, string> = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

export const ErrorMatrix: React.FC<Props> = ({ errors, onAcknowledge, onResolve }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredErrors = errors.filter((error) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      error.id.toLowerCase().includes(query) ||
      error.service.toLowerCase().includes(query) ||
      error.message.toLowerCase().includes(query);
    const matchesSeverity = severityFilter === 'all' || error.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const copyStackTrace = (error: ErrorTrace) => {
    void navigator.clipboard.writeText(`Exception in ${error.service}: ${error.message}\n${error.stackTrace}`);
    setCopiedId(error.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Incidents</h2>
          <p className="mt-1 text-sm text-slate-500">Open errors and actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search incidents"
              className="w-56 rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as SeverityType | 'all')}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3 text-right">Count</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredErrors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No incidents match the current filters.
                </td>
              </tr>
            ) : (
              filteredErrors.map((error) => {
                const isExpanded = expandedId === error.id;
                return (
                  <React.Fragment key={error.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <button type="button" onClick={() => setExpandedId(isExpanded ? null : error.id)}>
                          {error.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{error.service}</td>
                      <td className="max-w-md px-4 py-3 text-slate-700">{error.message}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${severityStyles[error.severity]}`}>
                          {error.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{error.occurrenceCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onAcknowledge(error.id)}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Acknowledge
                          </button>
                          <button
                            type="button"
                            onClick={() => onResolve(error.id)}
                            className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50 px-4 py-3">
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span>{error.path} - HTTP {error.statusCode}</span>
                            <button
                              type="button"
                              onClick={() => copyStackTrace(error)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 font-medium text-slate-700 hover:bg-white"
                            >
                              {copiedId === error.id ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                              Copy
                            </button>
                          </div>
                          <pre className="max-h-52 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-200">
                            {error.stackTrace}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
