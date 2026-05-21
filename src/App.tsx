import React, { useCallback, useEffect, useState } from 'react';
import {
  initialDeployments,
  initialErrorTraces,
  initialLatencyHistory,
  initialLogs,
  initialServerNodes,
  initialSystemStatus,
  initialThreats,
  initialWebVitals,
} from './mockData';
import {
  DashboardState,
  DeploymentTask,
  ErrorTrace,
  LatencyDatapoint,
  SecurityThreat,
  ServerNode,
  SystemLog,
  SystemStatus,
  WebVitalMetric,
} from './types';
import { dashboardApi, openDashboardStream } from './apiClient';
import { DeploymentFeedSidebar } from './components/DeploymentFeedSidebar';
import { ErrorMatrix } from './components/ErrorMatrix';
import { LiveLogStream } from './components/LiveLogStream';
import { PerformanceChart } from './components/PerformanceChart';
import { SecurityThreatMonitor } from './components/SecurityThreatMonitor';
import { SystemHealthGauge } from './components/SystemHealthGauge';
import { WebVitalsRings } from './components/WebVitalsRings';
import { Pause, Play, RefreshCw, Send, Terminal } from 'lucide-react';

export default function App() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [latencyHistory, setLatencyHistory] = useState<LatencyDatapoint[]>(initialLatencyHistory);
  const [errorTraces, setErrorTraces] = useState<ErrorTrace[]>(initialErrorTraces);
  const [webVitals, setWebVitals] = useState<WebVitalMetric[]>(initialWebVitals);
  const [deployments, setDeployments] = useState<DeploymentTask[]>(initialDeployments);
  const [serverNodes, setServerNodes] = useState<ServerNode[]>(initialServerNodes);
  const [securityThreats, setSecurityThreats] = useState<SecurityThreat[]>(initialThreats);
  const [liveLogs, setLiveLogs] = useState<SystemLog[]>(initialLogs);
  const [cliLogs, setCliLogs] = useState<string[]>([]);
  const [cliInput, setCliInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [apiError, setApiError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVitalsRefreshing, setIsVitalsRefreshing] = useState(false);

  const applyDashboardState = useCallback((next: DashboardState) => {
    setSystemStatus(next.systemStatus);
    setLatencyHistory(next.latencyHistory);
    setErrorTraces(next.errorTraces);
    setWebVitals(next.webVitals);
    setDeployments(next.deployments);
    setServerNodes(next.serverNodes);
    setSecurityThreats(next.securityThreats);
    setLiveLogs(next.liveLogs);
    setCliLogs(next.cliLogs);
    setIsBackendConnected(true);
    setApiError(null);
  }, []);

  const runDashboardAction = useCallback(async (action: () => Promise<DashboardState>) => {
    try {
      const next = await action();
      applyDashboardState(next);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Backend request failed');
    }
  }, [applyDashboardState]);

  const fetchDashboard = useCallback(async () => {
    setIsRefreshing(true);
    await runDashboardAction(() => dashboardApi.fetchDashboard());
    setIsRefreshing(false);
  }, [runDashboardAction]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!liveUpdatesEnabled) return;

    const stream = openDashboardStream(
      applyDashboardState,
      setIsBackendConnected,
    );

    return () => stream.close();
  }, [applyDashboardState, liveUpdatesEnabled]);

  const refreshSystem = () => {
    setIsRefreshing(true);
    void runDashboardAction(() => dashboardApi.refreshSystem()).finally(() => setIsRefreshing(false));
  };

  const refreshVitals = () => {
    setIsVitalsRefreshing(true);
    void runDashboardAction(() => dashboardApi.refreshVitals()).finally(() => setIsVitalsRefreshing(false));
  };

  const setNodeStatus = (nodeId: string, status: ServerNode['status']) => {
    void runDashboardAction(() => dashboardApi.setNodeStatus(nodeId, status));
  };

  const runCommand = (command: string) => {
    void runDashboardAction(() => dashboardApi.runCommand(command));
  };

  const submitCommand = (event: React.FormEvent) => {
    event.preventDefault();
    const command = cliInput.trim();
    if (!command) return;
    setCliInput('');
    runCommand(command);
  };

  const statusLabel = !liveUpdatesEnabled
    ? 'Live updates paused'
    : isBackendConnected
      ? 'Connected'
      : 'Reconnecting';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-6">
        <header className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-950">DevDash</h1>
              <p className="mt-1 text-sm text-slate-500">Operations dashboard</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                {statusLabel}
              </span>
              <button
                type="button"
                onClick={() => setLiveUpdatesEnabled((value) => !value)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {liveUpdatesEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {liveUpdatesEnabled ? 'Pause live updates' : 'Resume live updates'}
              </button>
              <button
                type="button"
                onClick={() => void fetchDashboard()}
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                disabled={isRefreshing}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh data
              </button>
              <span className="text-xs text-slate-500">{currentTime}</span>
            </div>
          </div>
          {apiError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </div>
          )}
        </header>

        <main className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <section className="xl:col-span-8">
            <SystemHealthGauge
              status={systemStatus}
              onRefresh={refreshSystem}
              isRefreshing={isRefreshing}
            />
          </section>

          <aside className="xl:col-span-4">
            <DeploymentFeedSidebar
              deployments={deployments}
              onTriggerDeploy={(branch, commitMessage, service) => {
                void runDashboardAction(() => dashboardApi.triggerDeployment(branch, commitMessage, service));
              }}
              onReBuild={(id) => {
                void runDashboardAction(() => dashboardApi.rebuildDeployment(id));
              }}
            />
          </aside>

          <section className="xl:col-span-8">
            <PerformanceChart
              data={latencyHistory}
              nodes={serverNodes}
              onSetNodeStatus={setNodeStatus}
            />
          </section>

          <section className="xl:col-span-4">
            <WebVitalsRings
              metrics={webVitals}
              onRefreshMetrics={refreshVitals}
              isRefreshing={isVitalsRefreshing}
            />
          </section>

          <section className="xl:col-span-8">
            <ErrorMatrix
              errors={errorTraces}
              onAcknowledge={(id) => {
                void runDashboardAction(() => dashboardApi.acknowledgeError(id));
              }}
              onResolve={(id) => {
                void runDashboardAction(() => dashboardApi.resolveError(id));
              }}
            />
          </section>

          <section className="xl:col-span-4">
            <SecurityThreatMonitor threats={securityThreats} />
          </section>

          <section className="xl:col-span-7">
            <LiveLogStream logs={liveLogs} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm xl:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Command log</h2>
              </div>
              <button
                type="button"
                onClick={() => runCommand('clear')}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>

            <div className="h-56 overflow-y-auto bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-200">
              {cliLogs.length === 0 ? (
                <div className="text-slate-500">No command output yet.</div>
              ) : (
                cliLogs.map((log, index) => <div key={`${log}-${index}`}>{log}</div>)
              )}
            </div>

            <div className="space-y-3 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {['Diagnostics', 'nodes-up', 'active-stats'].map((command) => (
                  <button
                    key={command}
                    type="button"
                    onClick={() => runCommand(command)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {command}
                  </button>
                ))}
              </div>
              <form onSubmit={submitCommand} className="flex gap-2">
                <input
                  value={cliInput}
                  onChange={(event) => setCliInput(event.target.value)}
                  placeholder="Run command"
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Send className="h-4 w-4" />
                  Run
                </button>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
