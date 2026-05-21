import React, { useState } from 'react';
import { RefreshCw, Rocket } from 'lucide-react';
import { DeploymentTask } from '../types';

interface Props {
  deployments: DeploymentTask[];
  onTriggerDeploy: (branch: string, commitMsg: string, service: string) => void;
  onReBuild: (id: string) => void;
}

const statusStyles: Record<DeploymentTask['status'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  running: 'border-blue-200 bg-blue-50 text-blue-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
};

export const DeploymentFeedSidebar: React.FC<Props> = ({ deployments, onTriggerDeploy, onReBuild }) => {
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedService, setSelectedService] = useState('api-gateway');

  const branches = ['main', 'release/v2.4.0', 'hotfix/jwt-auth0-sync', 'feat/fuzzy-search-es', 'db/optimize-read-replica'];
  const services = ['api-gateway', 'auth-gateway', 'payment-router', 'search-indexing', 'user-profile-db'];

  const submitDeployment = (event: React.FormEvent) => {
    event.preventDefault();
    const message = commitMessage.trim();
    if (!message) return;
    onTriggerDeploy(selectedBranch, message, selectedService);
    setCommitMessage('');
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Deployments</h2>
        <p className="mt-1 text-sm text-slate-500">Create and rebuild releases.</p>
      </div>

      <form onSubmit={submitDeployment} className="space-y-3 border-b border-slate-200 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-slate-700">
            Service
            <select
              value={selectedService}
              onChange={(event) => setSelectedService(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
            >
              {services.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Branch
            <select
              value={selectedBranch}
              onChange={(event) => setSelectedBranch(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
            >
              {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Change summary
          <input
            value={commitMessage}
            onChange={(event) => setCommitMessage(event.target.value)}
            placeholder="fix(api): validate payload"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </label>

        <button
          type="submit"
          disabled={!commitMessage.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <Rocket className="h-4 w-4" />
          Start deployment
        </button>
      </form>

      <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-200">
        {deployments.map((deploy) => (
          <div key={deploy.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{deploy.id}</span>
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusStyles[deploy.status]}`}>
                    {deploy.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-600">{deploy.service}</div>
              </div>
              <div className="text-right text-xs text-slate-500">{deploy.timestamp}</div>
            </div>

            <p className="mt-2 text-sm text-slate-800">{deploy.commitMessage}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>{deploy.branch}</span>
              <span>{deploy.author}</span>
              <span>{deploy.buildTimeSec}s</span>
            </div>

            {deploy.status !== 'running' && (
              <button
                type="button"
                onClick={() => onReBuild(deploy.id)}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Rebuild
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
