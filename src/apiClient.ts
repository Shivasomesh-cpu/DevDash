import { DashboardState, ServerNode } from './types';

type RequestBody = Record<string, unknown>;

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with HTTP ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload.error === 'string') {
        message = payload.error;
      }
    } catch {
      // Keep the status-based fallback when the backend returns no JSON body.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function postDashboard(path: string, body?: RequestBody): Promise<DashboardState> {
  return apiRequest<DashboardState>(path, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

export const dashboardApi = {
  fetchDashboard: () => apiRequest<DashboardState>('/api/dashboard'),
  refreshSystem: () => postDashboard('/api/system/refresh'),
  refreshVitals: () => postDashboard('/api/vitals/refresh'),
  toggleNode: (nodeId: string) => postDashboard(`/api/nodes/${encodeURIComponent(nodeId)}/toggle`),
  setNodeStatus: (nodeId: string, status: ServerNode['status']) =>
    postDashboard(`/api/nodes/${encodeURIComponent(nodeId)}/status`, { status }),
  acknowledgeError: (id: string) => postDashboard(`/api/errors/${encodeURIComponent(id)}/acknowledge`),
  resolveError: (id: string) => apiRequest<DashboardState>(`/api/errors/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  triggerDeployment: (branch: string, commitMessage: string, service: string) =>
    postDashboard('/api/deployments', { branch, commitMessage, service }),
  rebuildDeployment: (id: string) => postDashboard(`/api/deployments/${encodeURIComponent(id)}/rebuild`),
  runCommand: (command: string) => postDashboard('/api/cli/execute', { command }),
};

export function openDashboardStream(
  onDashboard: (state: DashboardState) => void,
  onStatusChange: (connected: boolean) => void,
): EventSource {
  const stream = new EventSource('/api/stream');

  stream.onopen = () => onStatusChange(true);
  stream.onerror = () => onStatusChange(false);
  stream.addEventListener('dashboard', (event) => {
    onStatusChange(true);
    onDashboard(JSON.parse(event.data) as DashboardState);
  });

  return stream;
}
