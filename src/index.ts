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

// MCP endpoint - auth via passphrase in tool arguments (same pattern as Nexus)
app.all('/mcp', async (c) => {
  const handler = createUiMcpHandler(c.env);
  return handler(c.req.raw, c.env, c.executionCtx);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};
