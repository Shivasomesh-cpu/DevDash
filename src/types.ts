/**
 * Type declarations for DevDash V2 Command Center
 */

export type SeverityType = 'critical' | 'warning' | 'info';

export interface SystemStatus {
  globalScore: number;
  cpuLoad: number;
  memoryUsage: number;
  activeDeployments: number;
  requestRate: number; // requests/sec
}

export interface LatencyDatapoint {
  timestamp: string; // e.g. "14:00"
  latencyMs: number;
  successRate: number; // e.g. 99.95
}

export interface ErrorTrace {
  id: string;
  timestamp: string;
  service: string;
  message: string;
  severity: SeverityType;
  occurrenceCount: number;
  stackTrace: string;
  statusCode: number;
  path: string;
}

export interface WebVitalMetric {
  name: string; // LCP, FID, CLS, FCP, TTFB
  score: number; // 0 - 100 or actual float value
  unit: string; // ms, s, score
  rating: 'good' | 'needs-improvement' | 'poor';
  target: string; // e.g. "< 2.5s"
}

export interface DeploymentTask {
  id: string;
  timestamp: string;
  service: string;
  branch: string;
  author: string;
  buildTimeSec: number;
  status: 'success' | 'running' | 'failed';
  commitMessage: string;
  version: string;
}

export interface ServerNode {
  id: string;
  name: string;
  region: string;
  status: 'healthy' | 'unstable' | 'offline';
  cpu: number;
  ram: number;
  pingMs: number;
}

export interface SecurityThreat {
  id: string;
  timestamp: string;
  sourceIp: string;
  type: string;
  targetEndpoint: string;
  status: 'blocked' | 'investigating' | 'mitigated';
  riskLevel: 'critical' | 'high' | 'medium';
  country: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface DashboardState {
  systemStatus: SystemStatus;
  latencyHistory: LatencyDatapoint[];
  errorTraces: ErrorTrace[];
  webVitals: WebVitalMetric[];
  deployments: DeploymentTask[];
  serverNodes: ServerNode[];
  securityThreats: SecurityThreat[];
  liveLogs: SystemLog[];
  cliLogs: string[];
  serverTime: string;
  version: number;
}
