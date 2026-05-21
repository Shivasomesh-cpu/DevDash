import { SystemStatus, LatencyDatapoint, ErrorTrace, WebVitalMetric, DeploymentTask, ServerNode, SecurityThreat, SystemLog } from './types';

export const initialSystemStatus: SystemStatus = {
  globalScore: 99.98,
  cpuLoad: 42.8,
  memoryUsage: 68.2,
  activeDeployments: 4,
  requestRate: 1420
};

export const initialLatencyHistory: LatencyDatapoint[] = [
  { timestamp: '17:00', latencyMs: 142, successRate: 99.99 },
  { timestamp: '18:00', latencyMs: 155, successRate: 99.98 },
  { timestamp: '19:00', latencyMs: 210, successRate: 99.85 },
  { timestamp: '20:00', latencyMs: 180, successRate: 99.94 },
  { timestamp: '21:00', latencyMs: 135, successRate: 100.00 },
  { timestamp: '22:00', latencyMs: 122, successRate: 100.00 },
  { timestamp: '23:00', latencyMs: 128, successRate: 99.99 },
  { timestamp: '00:00', latencyMs: 110, successRate: 100.00 },
  { timestamp: '01:00', latencyMs: 115, successRate: 99.98 },
  { timestamp: '02:00', latencyMs: 108, successRate: 100.00 },
  { timestamp: '03:00', latencyMs: 139, successRate: 99.95 },
  { timestamp: '04:00', latencyMs: 145, successRate: 99.92 },
  { timestamp: '05:00', latencyMs: 160, successRate: 99.89 },
  { timestamp: '06:00', latencyMs: 224, successRate: 99.78 },
  { timestamp: '07:00', latencyMs: 195, successRate: 99.91 },
  { timestamp: '08:00', latencyMs: 154, successRate: 99.99 },
  { timestamp: '09:00', latencyMs: 140, successRate: 100.00 },
  { timestamp: '10:00', latencyMs: 132, successRate: 99.98 },
  { timestamp: '11:00', latencyMs: 148, successRate: 99.94 },
  { timestamp: '12:00', latencyMs: 165, successRate: 99.87 },
  { timestamp: '13:00', latencyMs: 188, successRate: 99.90 },
  { timestamp: '14:00', latencyMs: 172, successRate: 99.96 },
  { timestamp: '15:00', latencyMs: 158, successRate: 99.98 },
  { timestamp: '16:00', latencyMs: 145, successRate: 99.99 }
];

export const initialErrorTraces: ErrorTrace[] = [
  {
    id: 'ERR-309',
    timestamp: '16:32:15',
    service: 'auth-gateway',
    message: 'JWT validation failed: public key cluster offline',
    severity: 'critical',
    occurrenceCount: 142,
    statusCode: 503,
    path: '/api/v1/session/validate',
    stackTrace: 'Error: ConnectionPoolTimeoutException: Timeout waiting for connection to key-distributor-cluster.service.local:8080\n   at AuthGateway.verifyToken(token.ts:44:12)\n   at runNextTicks(node:internal/process/task_queues:60:5)\n   at processImmediate(node:internal/timers:442:21)'
  },
  {
    id: 'ERR-241',
    timestamp: '16:30:08',
    service: 'payment-router',
    message: 'Stripe API Connection timed out after 15000ms',
    severity: 'warning',
    occurrenceCount: 28,
    statusCode: 504,
    path: '/api/v2/transactions/capture',
    stackTrace: 'StripeConnectionException: ReadTimeoutHandler.timeout(StripeClient.java:188)\n   at io.netty.handler.timeout.ReadTimeoutHandler.readTimedOut(ReadTimeoutHandler.java:180)\n   at io.netty.channel.ChannelInboundHandlerAdapter.exceptionCaught(ChannelInboundHandlerAdapter.java:143)'
  },
  {
    id: 'ERR-102',
    timestamp: '16:25:44',
    service: 'user-profile-db',
    message: 'Read database replica-02 lag exceeded 15.4s',
    severity: 'info',
    occurrenceCount: 89,
    statusCode: 200,
    path: '/internal/health',
    stackTrace: 'LagMonitorWarning: Replica lag offset has breached warning threshold of 10.0s\n   at PostgreSQL LagDetector.checkOffset(lag_detector.go:32)\n   at main.runLagCheckLoop(main.go:121)'
  },
  {
    id: 'ERR-415',
    timestamp: '16:11:02',
    service: 'image-optimizer',
    message: 'Out of memory: Heap buffer allocation failed (42MB requested)',
    severity: 'critical',
    occurrenceCount: 12,
    statusCode: 500,
    path: '/v1/optimize/avatar',
    stackTrace: 'FatalError: Native heap limit exceeded: cannot allocate buffer representation\n   at WebPEncoder.compress(webp_encoder.node:12:4)\n   at ImageService.resizeAndCompress(image_service.ts:182:35)'
  },
  {
    id: 'ERR-773',
    timestamp: '15:58:19',
    service: 'search-indexing',
    message: 'Elasticsearch connection refused on port 9200',
    severity: 'warning',
    occurrenceCount: 61,
    statusCode: 502,
    path: '/api/v1/index/refresh',
    stackTrace: 'ConnectException: Connection refused (Connection refused)\n   at java.base/sun.nio.ch.Net.pollConnect(Native Method)\n   at java.base/sun.nio.ch.Net.pollConnectNow(Net.java:672)'
  }
];

export const initialWebVitals: WebVitalMetric[] = [
  { name: 'LCP', score: 1.8, unit: 's', rating: 'good', target: '< 2.5s' },
  { name: 'FID', score: 14, unit: 'ms', rating: 'good', target: '< 100ms' },
  { name: 'CLS', score: 0.08, unit: 'score', rating: 'good', target: '< 0.10' },
  { name: 'FCP', score: 0.9, unit: 's', rating: 'good', target: '< 1.8s' },
  { name: 'TTFB', score: 185, unit: 'ms', rating: 'needs-improvement', target: '< 200ms' }
];

export const initialDeployments: DeploymentTask[] = [
  {
    id: 'D-802',
    timestamp: '16:22:45',
    service: 'api-gateway',
    branch: 'release/v2.4.0',
    author: 'Sarah Jenkins',
    buildTimeSec: 142,
    status: 'success',
    commitMessage: 'feat(api): enable graphql playground dynamic schema stitching',
    version: '2.4.0-build.82'
  },
  {
    id: 'D-801',
    timestamp: '16:15:30',
    service: 'auth-gateway',
    branch: 'hotfix/jwt-auth0-sync',
    author: 'Alex Rivera',
    buildTimeSec: 89,
    status: 'success',
    commitMessage: 'fix(auth): cache JWKS keys locally to bypass third party rate limits',
    version: '2.3.9-hotfix.1'
  },
  {
    id: 'D-800',
    timestamp: '16:04:12',
    service: 'payment-router',
    branch: 'main',
    author: 'System Bot',
    buildTimeSec: 195,
    status: 'failed',
    commitMessage: 'chore: bump dependencies web3.js node_modules packages to latest',
    version: '3.0.0-beta-rc1'
  },
  {
    id: 'D-799',
    timestamp: '15:33:02',
    service: 'search-indexing',
    branch: 'feat/fuzzy-search-es',
    author: 'Marcus Chen',
    buildTimeSec: 210,
    status: 'success',
    commitMessage: 'feat(search): add typo-tolerance model weights inside ES templates',
    version: '1.9.3'
  },
  {
    id: 'D-798',
    timestamp: '15:10:55',
    service: 'user-profile-db',
    branch: 'db/optimize-read-replica',
    author: 'Elena Rostova',
    buildTimeSec: 325,
    status: 'success',
    commitMessage: 'perf: add index on users(email, active_status) for session load paths',
    version: '1.2.14'
  }
];

export const initialServerNodes: ServerNode[] = [
  { id: 'us-east-core', name: 'Node 01: Core Gateway', region: 'us-east-1', status: 'healthy', cpu: 32.4, ram: 54.1, pingMs: 12 },
  { id: 'eu-west-proxy', name: 'Node 02: Edge Proxy', region: 'eu-west-1', status: 'healthy', cpu: 18.9, ram: 42.0, pingMs: 44 },
  { id: 'ap-east-db', name: 'Node 03: Primary DB', region: 'ap-east-1', status: 'healthy', cpu: 56.2, ram: 78.4, pingMs: 82 },
  { id: 'us-west-worker', name: 'Node 04: Queue Worker', region: 'us-west-2', status: 'unstable', cpu: 89.1, ram: 92.5, pingMs: 65 },
  { id: 'sa-east-cache', name: 'Node 05: Redis Storage', region: 'sa-east-1', status: 'healthy', cpu: 14.5, ram: 65.0, pingMs: 110 }
];

// Generates some live variation for continuous visual interest
export function generateSystemPulse(current: SystemStatus): SystemStatus {
  const cpuDelta = (Math.random() - 0.5) * 4;
  const ramDelta = (Math.random() - 0.5) * 1.5;
  const rateDelta = Math.floor((Math.random() - 0.5) * 50);
  
  return {
    globalScore: +(current.globalScore + (Math.random() - 0.5) * 0.01).toFixed(2),
    cpuLoad: Math.max(10, Math.min(98, +(current.cpuLoad + cpuDelta).toFixed(1))),
    memoryUsage: Math.max(20, Math.min(95, +(current.memoryUsage + ramDelta).toFixed(1))),
    activeDeployments: current.activeDeployments,
    requestRate: Math.max(800, Math.min(2200, current.requestRate + rateDelta))
  };
}

export function updateNodesPulse(nodes: ServerNode[]): ServerNode[] {
  return nodes.map(node => {
    // Occasionally toggle Worker nodes between unhealthy states for realistic simulation
    let status = node.status;
    if (node.id === 'us-west-worker') {
      const rand = Math.random();
      status = rand > 0.82 ? 'offline' : rand > 0.4 ? 'unstable' : 'healthy';
    } else {
      // Small chance of non-critical nodes turning warning-level
      const rand = Math.random();
      if (rand > 0.96) {
        status = status === 'healthy' ? 'unstable' : 'healthy';
      }
    }

    const cpuDelta = (Math.random() - 0.5) * 8;
    const ramDelta = (Math.random() - 0.5) * 2;
    const pingDelta = Math.floor((Math.random() - 0.5) * 6);

    return {
      ...node,
      status,
      cpu: Math.max(5, Math.min(99, +(node.cpu + cpuDelta).toFixed(1))),
      ram: Math.max(10, Math.min(98, +(node.ram + ramDelta).toFixed(1))),
      pingMs: Math.max(5, Math.min(300, node.pingMs + pingDelta))
    };
  });
}

export const initialThreats: SecurityThreat[] = [
  { id: 'SEC-001', timestamp: '16:50:12', sourceIp: '185.33.44.12', type: 'DDoS Attempt', targetEndpoint: '/api/v1/auth', status: 'blocked', riskLevel: 'high', country: 'RU' },
  { id: 'SEC-002', timestamp: '16:51:44', sourceIp: '103.44.12.99', type: 'SQL Injection', targetEndpoint: '/api/v1/users/search', status: 'blocked', riskLevel: 'critical', country: 'CN' },
  { id: 'SEC-003', timestamp: '16:53:05', sourceIp: '45.22.19.102', type: 'Brute Force', targetEndpoint: '/admin/login', status: 'mitigated', riskLevel: 'high', country: 'BR' },
];

export const initialLogs: SystemLog[] = [
  { id: 'LOG-001', timestamp: '16:54:01', module: 'AuthService', message: 'User token validated for session X4M.', level: 'success' },
  { id: 'LOG-002', timestamp: '16:54:05', module: 'PaymentRouter', message: 'Stripe webhook received event payment_intent.succeeded.', level: 'info' },
  { id: 'LOG-003', timestamp: '16:54:08', module: 'CacheNode', message: 'Redis memory nearing 80% watermark threshold.', level: 'warn' },
  { id: 'LOG-004', timestamp: '16:54:12', module: 'LoadBalancer', message: 'Routing traffic to us-east-worker due to spike.', level: 'info' },
];

export function generateThreat(): SecurityThreat {
  const ips = ['192.168.1.1', '10.0.0.5', '172.16.0.4', '185.20.1.55', '44.12.19.88'];
  const types = ['DDoS Attempt', 'SQL Injection', 'Brute Force', 'XSS Payload', 'Path Traversal'];
  const endpoints = ['/api/login', '/checkout', '/search', '/graphql', '/api/users'];
  const countries = ['RU', 'CN', 'BR', 'US', 'IN', 'KR'];
  const statuses: ('blocked' | 'investigating' | 'mitigated')[] = ['blocked', 'investigating', 'mitigated'];
  const risks: ('critical' | 'high' | 'medium')[] = ['critical', 'high', 'medium'];

  return {
    id: `SEC-${Math.floor(Math.random() * 900) + 100}`,
    timestamp: new Date().toLocaleTimeString(),
    sourceIp: ips[Math.floor(Math.random() * ips.length)],
    type: types[Math.floor(Math.random() * types.length)],
    targetEndpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    riskLevel: risks[Math.floor(Math.random() * risks.length)],
    country: countries[Math.floor(Math.random() * countries.length)]
  };
}

export function generateLog(): SystemLog {
  const modules = ['AuthService', 'DbReplica', 'ApiGateway', 'ImageOpt', 'JobQueue', 'CacheSvc'];
  const messages = [
    'Cache hit ratio dropped below 90%.',
    'New session established for user.',
    'Job queued successfully.',
    'Rate limit exceeded for IP.',
    'Replication lag detected.',
    'Microservice scaling up.',
    'Health check passed.'
  ];
  const levels: ('info' | 'warn' | 'error' | 'success')[] = ['info', 'info', 'success', 'warn', 'info'];

  return {
    id: `LOG-${Math.floor(Math.random() * 9000) + 1000}`,
    timestamp: new Date().toLocaleTimeString(),
    module: modules[Math.floor(Math.random() * modules.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    level: levels[Math.floor(Math.random() * levels.length)]
  };
}
