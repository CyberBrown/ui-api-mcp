import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types.ts';
import { createUiMcpHandler } from './mcp.ts';

type AppType = { Bindings: Env };

const app = new Hono<AppType>();

app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'ui-api-mcp',
    version: '1.0.0',
    status: 'healthy',
  });
});

// Bearer token auth middleware for /mcp
app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  if (token !== c.env.BEARER_TOKEN) {
    return c.json({ error: 'Invalid bearer token' }, 403);
  }

  await next();
});

// MCP endpoint
app.all('/mcp', async (c) => {
  const handler = createUiMcpHandler(c.env);
  return handler(c.req.raw, c.env, c.executionCtx);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};
