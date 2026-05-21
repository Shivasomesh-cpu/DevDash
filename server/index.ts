import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  dashboardActions,
  getDashboardEtag,
  getDashboardJson,
  getDashboardState,
  hydrateState,
  HttpError,
  startTelemetryEngine,
  subscribeToDashboard,
} from './state';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

function sendDashboard(req: Request, res: Response): void {
  const etag = getDashboardEtag();
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('ETag', etag);
  res.end(getDashboardJson());
}

function route(handler: (req: Request, res: Response) => void | Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    stateVersion: getDashboardState().version,
    serverTime: new Date().toISOString(),
  });
});

app.get('/api/dashboard', route((req, res) => sendDashboard(req, res)));
app.get('/api/dashboard/state', route((req, res) => sendDashboard(req, res)));
app.get('/api/system/status', (_req, res) => res.json(getDashboardState().systemStatus));
app.get('/api/latency', (_req, res) => res.json(getDashboardState().latencyHistory));
app.get('/api/errors', (_req, res) => res.json(getDashboardState().errorTraces));
app.get('/api/deployments', (_req, res) => res.json(getDashboardState().deployments));
app.get('/api/threats', (_req, res) => res.json(getDashboardState().securityThreats));
app.get('/api/logs', (req, res) => {
  const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 100)));
  res.json(getDashboardState().liveLogs.slice(-limit));
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const writeDashboard = (payload: string) => {
    res.write(`event: dashboard\ndata: ${payload}\n\n`);
  };
  const unsubscribe = subscribeToDashboard(writeDashboard);
  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  writeDashboard(getDashboardJson());
  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

app.post('/api/system/refresh', (req, res) => {
  dashboardActions.refreshSystem();
  sendDashboard(req, res);
});

app.post('/api/vitals/refresh', (req, res) => {
  dashboardActions.refreshVitals();
  sendDashboard(req, res);
});

app.post('/api/nodes/:id/toggle', (req, res) => {
  dashboardActions.toggleNode(req.params.id);
  sendDashboard(req, res);
});

app.post('/api/nodes/:id/status', (req, res) => {
  dashboardActions.setNodeStatus(req.params.id, req.body.status);
  sendDashboard(req, res);
});

app.post('/api/errors/:id/acknowledge', (req, res) => {
  dashboardActions.acknowledgeError(req.params.id);
  sendDashboard(req, res);
});

app.delete('/api/errors/:id', (req, res) => {
  dashboardActions.resolveError(req.params.id);
  sendDashboard(req, res);
});

app.post('/api/deployments', (req, res) => {
  dashboardActions.triggerDeployment(req.body);
  sendDashboard(req, res);
});

app.post('/api/deployments/:id/rebuild', (req, res) => {
  dashboardActions.rebuildDeployment(req.params.id);
  sendDashboard(req, res);
});

app.post('/api/cli/execute', (req, res) => {
  dashboardActions.runCliCommand(req.body.command);
  sendDashboard(req, res);
});

app.use('/api', (error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  res.status(statusCode).json({ error: message });
});

await hydrateState();
startTelemetryEngine();

if (isProduction) {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath, {
    etag: true,
    immutable: true,
    maxAge: '1y',
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, host, () => {
  console.log(`[devdash] API and UI ready on http://${host}:${port}`);
});
