import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  generateLog,
  generateSystemPulse,
  generateThreat,
  initialDeployments,
  initialErrorTraces,
  initialLatencyHistory,
  initialLogs,
  initialServerNodes,
  initialSystemStatus,
  initialThreats,
  initialWebVitals,
  updateNodesPulse,
} from '../src/mockData';
import {
  DashboardState,
  DeploymentTask,
  ErrorTrace,
  ServerNode,
  SystemLog,
  WebVitalMetric,
} from '../src/types';

type DashboardListener = (payload: string) => void;
type MutableDashboardState = Omit<DashboardState, 'serverTime'>;

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const MAX_CLI_LINES = 160;
const MAX_LOGS = 100;
const MAX_THREATS = 50;
const PERSISTENCE_DISABLED = process.env.DEVDASH_PERSISTENCE === 'false';
const STATE_FILE = path.resolve(process.cwd(), 'server', 'data', 'devdash-state.json');

const cliBootLogs = [
  'DevDash command log ready.',
  `System established at UTC ${new Date().toISOString()}`,
  'Use the action buttons or type a command.',
];

let state: MutableDashboardState = createInitialState();
let deploymentSequence = nextDeploymentSequence(state.deployments);
let snapshotCache = '';
let telemetryTimer: NodeJS.Timeout | undefined;
let persistTimer: NodeJS.Timeout | undefined;
const listeners = new Set<DashboardListener>();

function createInitialState(): MutableDashboardState {
  return {
    systemStatus: { ...initialSystemStatus },
    latencyHistory: initialLatencyHistory.map((item) => ({ ...item })),
    errorTraces: initialErrorTraces.map((item) => ({ ...item })),
    webVitals: initialWebVitals.map((item) => ({ ...item })),
    deployments: initialDeployments.map((item) => ({ ...item })),
    serverNodes: initialServerNodes.map((item) => ({ ...item })),
    securityThreats: initialThreats.map((item) => ({ ...item })),
    liveLogs: initialLogs.map((item) => ({ ...item })),
    cliLogs: [...cliBootLogs],
    version: 1,
  };
}

function nextDeploymentSequence(deployments: DeploymentTask[]): number {
  const highest = deployments.reduce((max, deploy) => {
    const match = deploy.id.match(/^D-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 802);

  return highest + 1;
}

function nowTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function addCliLog(...lines: string[]): void {
  state.cliLogs = [...state.cliLogs, ...lines].slice(-MAX_CLI_LINES);
}

function addSystemLog(log: SystemLog): void {
  state.liveLogs = [...state.liveLogs, log].slice(-MAX_LOGS);
}

function activeDeploymentCount(): number {
  return new Set(state.deployments.filter((deploy) => deploy.status !== 'failed').map((deploy) => deploy.service)).size;
}

function syncDerivedMetrics(): void {
  state.systemStatus.activeDeployments = activeDeploymentCount();
}

function mutate(update: () => void): DashboardState {
  update();
  syncDerivedMetrics();
  state.version += 1;
  snapshotCache = '';
  schedulePersist();
  broadcastDashboard();
  return getDashboardState();
}

function schedulePersist(): void {
  if (PERSISTENCE_DISABLED) return;

  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    void persistState();
  }, 250);
  persistTimer.unref?.();
}

async function persistState(): Promise<void> {
  try {
    await mkdir(path.dirname(STATE_FILE), { recursive: true });
    await writeFile(STATE_FILE, JSON.stringify(state), 'utf8');
  } catch (error) {
    console.warn('[devdash] Failed to persist dashboard state:', error);
  }
}

function broadcastDashboard(): void {
  if (listeners.size === 0) return;

  const payload = getDashboardJson();
  for (const listener of listeners) {
    listener(payload);
  }
}

export async function hydrateState(): Promise<void> {
  if (PERSISTENCE_DISABLED) return;

  try {
    const raw = await readFile(STATE_FILE, 'utf8');
    const persisted = JSON.parse(raw) as Partial<MutableDashboardState>;
    state = {
      ...createInitialState(),
      ...persisted,
      version: typeof persisted.version === 'number' ? persisted.version : 1,
    };
    deploymentSequence = nextDeploymentSequence(state.deployments);
    snapshotCache = '';
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? (error as NodeJS.ErrnoException).code : undefined;
    if (code !== 'ENOENT') {
      console.warn('[devdash] Could not hydrate persisted state:', error);
    }
  }
}

export function startTelemetryEngine(): void {
  if (telemetryTimer) return;

  telemetryTimer = setInterval(() => {
    mutate(() => {
      state.systemStatus = generateSystemPulse(state.systemStatus);
      state.serverNodes = updateNodesPulse(state.serverNodes);
      state.latencyHistory = state.latencyHistory.map((point) => {
        const jitter = (Math.random() - 0.5) * 6;
        return {
          ...point,
          latencyMs: Math.max(90, Math.min(240, Math.round(point.latencyMs + jitter))),
        };
      });

      if (Math.random() > 0.7) {
        state.securityThreats = [generateThreat(), ...state.securityThreats].slice(0, MAX_THREATS);
      }

      if (Math.random() > 0.3) {
        addSystemLog(generateLog());
      }
    });
  }, 3000);
}

export function subscribeToDashboard(listener: DashboardListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDashboardState(): DashboardState {
  return {
    ...state,
    systemStatus: { ...state.systemStatus },
    latencyHistory: state.latencyHistory.map((item) => ({ ...item })),
    errorTraces: state.errorTraces.map((item) => ({ ...item })),
    webVitals: state.webVitals.map((item) => ({ ...item })),
    deployments: state.deployments.map((item) => ({ ...item })),
    serverNodes: state.serverNodes.map((item) => ({ ...item })),
    securityThreats: state.securityThreats.map((item) => ({ ...item })),
    liveLogs: state.liveLogs.map((item) => ({ ...item })),
    cliLogs: [...state.cliLogs],
    serverTime: new Date().toISOString(),
  };
}

export function getDashboardJson(): string {
  if (!snapshotCache) {
    snapshotCache = JSON.stringify(getDashboardState());
  }

  return snapshotCache;
}

export function getDashboardEtag(): string {
  return `"devdash-${state.version}"`;
}

function findNode(nodeId: string): ServerNode {
  const node = state.serverNodes.find((item) => item.id === nodeId);
  if (!node) {
    throw new HttpError(404, `Node "${nodeId}" was not found`);
  }

  return node;
}

function normalizeNodeStatus(value: unknown): ServerNode['status'] {
  if (value === 'healthy' || value === 'unstable' || value === 'offline') {
    return value;
  }

  throw new HttpError(400, 'status must be one of healthy, unstable, or offline');
}

function findDeployment(id: string): DeploymentTask {
  const deployment = state.deployments.find((item) => item.id === id);
  if (!deployment) {
    throw new HttpError(404, `Deployment "${id}" was not found`);
  }

  return deployment;
}

function normalizeText(value: unknown, field: string, maxLength = 200): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `${field} is required`);
  }

  return value.trim().slice(0, maxLength);
}

function ratingForVital(metric: WebVitalMetric, score: number): WebVitalMetric['rating'] {
  if (metric.name === 'LCP') return score < 2.5 ? 'good' : score < 4 ? 'needs-improvement' : 'poor';
  if (metric.name === 'FID') return score < 100 ? 'good' : score < 300 ? 'needs-improvement' : 'poor';
  if (metric.name === 'CLS') return score < 0.1 ? 'good' : score < 0.25 ? 'needs-improvement' : 'poor';
  if (metric.name === 'FCP') return score < 1.8 ? 'good' : score < 3 ? 'needs-improvement' : 'poor';
  if (metric.name === 'TTFB') return score < 200 ? 'good' : score < 600 ? 'needs-improvement' : 'poor';
  return 'good';
}

export const dashboardActions = {
  refreshSystem(): DashboardState {
    return mutate(() => {
      addCliLog(
        '[refresh] Telemetry refresh started.',
        '[ok] Telemetry refresh completed.',
      );
      state.systemStatus = {
        ...state.systemStatus,
        globalScore: +(99.9 + Math.random() * 0.09).toFixed(2),
        cpuLoad: 25 + Math.round(Math.random() * 30),
        memoryUsage: 50 + Math.round(Math.random() * 20),
        requestRate: 1200 + Math.floor(Math.random() * 400),
      };
    });
  },

  refreshVitals(): DashboardState {
    return mutate(() => {
      addCliLog(
        '[refresh] Web vitals scan started.',
        '[ok] Web vitals updated.',
      );
      state.webVitals = state.webVitals.map((metric) => {
        let score = metric.score;
        if (metric.name === 'LCP') score = +Math.max(1.1, Math.min(2.8, metric.score + (Math.random() - 0.5) * 0.4)).toFixed(2);
        if (metric.name === 'FID') score = Math.max(5, Math.min(80, Math.round(metric.score + (Math.random() - 0.5) * 10)));
        if (metric.name === 'CLS') score = +Math.max(0.01, Math.min(0.14, metric.score + (Math.random() - 0.5) * 0.03)).toFixed(3);
        if (metric.name === 'FCP') score = +Math.max(0.6, Math.min(1.7, metric.score + (Math.random() - 0.5) * 0.2)).toFixed(2);
        if (metric.name === 'TTFB') score = Math.max(120, Math.min(280, Math.round(metric.score + (Math.random() - 0.5) * 40)));

        return { ...metric, score, rating: ratingForVital(metric, score) };
      });
    });
  },

  toggleNode(nodeId: string): DashboardState {
    return mutate(() => {
      findNode(nodeId);
      addCliLog(`[node] "${nodeId}" status changed.`);
      state.serverNodes = state.serverNodes.map((node) => {
        if (node.id !== nodeId) return node;

        const status = node.status === 'healthy' ? 'unstable' : node.status === 'unstable' ? 'offline' : 'healthy';
        return {
          ...node,
          status,
          cpu: status === 'offline' ? 0 : status === 'unstable' ? 95.8 : 31.4,
          pingMs: status === 'offline' ? 300 : status === 'unstable' ? 190 : 15,
        };
      });
    });
  },

  setNodeStatus(nodeId: string, rawStatus: unknown): DashboardState {
    return mutate(() => {
      findNode(nodeId);
      const status = normalizeNodeStatus(rawStatus);
      addCliLog(`[node] "${nodeId}" set to ${status}.`);
      state.serverNodes = state.serverNodes.map((node) => {
        if (node.id !== nodeId) return node;

        return {
          ...node,
          status,
          cpu: status === 'offline' ? 0 : status === 'unstable' ? Math.max(node.cpu, 85) : Math.min(node.cpu, 45),
          pingMs: status === 'offline' ? 300 : status === 'unstable' ? Math.max(node.pingMs, 150) : Math.min(node.pingMs, 45),
        };
      });
    });
  },

  acknowledgeError(id: string): DashboardState {
    return mutate(() => {
      const existing = state.errorTraces.find((error) => error.id === id);
      if (!existing) throw new HttpError(404, `Error "${id}" was not found`);

      addCliLog(`[incident] "${id}" acknowledged.`);
      state.errorTraces = state.errorTraces.map((error) => {
        if (error.id !== id) return error;
        const message = error.message.startsWith('[Escalated]') ? error.message : `[Escalated] ${error.message}`;
        return {
          ...error,
          occurrenceCount: Math.max(1, Math.round(error.occurrenceCount / 2)),
          message,
        };
      });
    });
  },

  resolveError(id: string): DashboardState {
    return mutate(() => {
      const before = state.errorTraces.length;
      state.errorTraces = state.errorTraces.filter((error) => error.id !== id);
      if (state.errorTraces.length === before) throw new HttpError(404, `Error "${id}" was not found`);
      addCliLog(`[ok] Incident "${id}" resolved.`);
    });
  },

  triggerDeployment(payload: Record<string, unknown>): DashboardState {
    return mutate(() => {
      const branch = normalizeText(payload.branch, 'branch', 80);
      const commitMessage = normalizeText(payload.commitMessage, 'commitMessage', 240);
      const service = normalizeText(payload.service, 'service', 80);
      const id = `D-${deploymentSequence++}`;
      const deployment: DeploymentTask = {
        id,
        timestamp: nowTime(),
        service,
        branch,
        author: 'Gateway CLI Admin',
        buildTimeSec: 0,
        status: 'running',
        commitMessage,
        version: `1.0.${Math.floor(Math.random() * 10)}`,
      };

      state.deployments = [deployment, ...state.deployments].slice(0, 40);
      addCliLog(`[deployment] Started "${id}" from branch "${branch}".`);

      setTimeout(() => {
        mutate(() => {
          state.deployments = state.deployments.map((deployment) => {
            if (deployment.id !== id) return deployment;
            return {
              ...deployment,
              status: Math.random() > 0.15 ? 'success' : 'failed',
              buildTimeSec: 85 + Math.floor(Math.random() * 120),
            };
          });
          addCliLog(`[deployment] "${id}" finished.`);
        });
      }, 4000).unref?.();
    });
  },

  rebuildDeployment(id: string): DashboardState {
    return mutate(() => {
      findDeployment(id);
      addCliLog(`[deployment] Rebuild started for "${id}".`);
      state.deployments = state.deployments.map((deployment) => {
        if (deployment.id !== id) return deployment;
        return {
          ...deployment,
          status: 'running',
          timestamp: nowTime(),
          buildTimeSec: 0,
        };
      });

      setTimeout(() => {
        mutate(() => {
          state.deployments = state.deployments.map((deployment) => {
            if (deployment.id !== id) return deployment;
            return {
              ...deployment,
              status: 'success',
              buildTimeSec: 100 + Math.floor(Math.random() * 50),
            };
          });
          addCliLog(`[deployment] Rebuild finished for "${id}".`);
        });
      }, 3000).unref?.();
    });
  },

  runCliCommand(rawCommand: unknown): DashboardState {
    const commandText = normalizeText(rawCommand, 'command', 120);
    const command = commandText.toLowerCase();

    return mutate(() => {
      addCliLog(`> ${commandText}`);

      if (command === 'clear') {
        state.cliLogs = ['Terminal cleared. DevDash V2 ready.'];
        return;
      }

      if (commandText === 'Diagnostics') {
        addCliLog(
          'Running diagnostics...',
          '[database] Latency: 12ms',
          '[worker] Memory: 92.5%',
          'Diagnostics finished. No blocking issues found.',
        );
        return;
      }

      if (commandText === 'DockerPrune') {
        addCliLog(
          'Running Docker cleanup...',
          'Pruning dangling cache layers: freed 14.54 GB.',
          'Deleted 12 stale image references.',
        );
        state.systemStatus.memoryUsage = Math.max(30, state.systemStatus.memoryUsage - 8);
        return;
      }

      if (commandText === 'RestartProxy') {
        addCliLog(
          'Starting proxy restart...',
          'Step 1/3: Start standby routes.',
          'Step 2/3: Switch active ports.',
          'Step 3/3: Drain old routes.',
          'Proxy restart finished.',
        );
        return;
      }

      if (command === 'help') {
        addCliLog(
          'Supported commands:',
          '  help              - Show available commands',
          '  clear             - Clear this log',
          '  nodes-up          - Set all nodes to healthy',
          '  active-stats      - Show current system metrics',
          '  inject-error      - Add a test incident',
        );
        return;
      }

      if (command === 'nodes-up') {
        state.serverNodes = state.serverNodes.map((node) => ({ ...node, status: 'healthy', cpu: 30, pingMs: 14 }));
        addCliLog('[ok] All nodes set to healthy.');
        return;
      }

      if (command === 'active-stats') {
        addCliLog(
          'Current Status Info:',
          `  - Availability: ${state.systemStatus.globalScore}%`,
          `  - CPU: ${state.systemStatus.cpuLoad}%`,
          `  - Memory: ${state.systemStatus.memoryUsage}%`,
          `  - Active services: ${state.systemStatus.activeDeployments}`,
        );
        return;
      }

      if (command === 'inject-error') {
        const newError: ErrorTrace = {
          id: `ERR-${Math.floor(Math.random() * 800 + 100)}`,
          timestamp: nowTime(),
          service: 'user-profile-db',
          message: 'TimeoutException: Read connection timed out looking up token session state',
          severity: 'critical',
          occurrenceCount: 1,
          statusCode: 504,
          path: '/v1/user/lookup',
          stackTrace: 'TimeoutException: connection pool replica exhausted.\n   at PostgresClient.executeWithRetry(client.go:88)\n   at MainSessionRouter(session.go:121)',
        };
        state.errorTraces = [newError, ...state.errorTraces].slice(0, 40);
        addCliLog('[incident] Test incident added.');
        return;
      }

      addCliLog(`Command "${commandText}" not recognized. Type "help" for system keywords.`);
    });
  },
};
