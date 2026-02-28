import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpHandler } from 'agents/mcp';
import type { Env } from './types.ts';
import { UIClient } from './ui-client.ts';

const ERROR_RESULT = (msg: string) => ({
  content: [{ type: 'text' as const, text: `Error: ${msg}` }],
  isError: true as const,
});

function validatePassphrase(provided: string | undefined, expected: string): ReturnType<typeof ERROR_RESULT> | null {
  if (!expected) return null; // no passphrase configured = dev mode
  if (!provided) return ERROR_RESULT('Passphrase required');
  if (provided !== expected) return ERROR_RESULT('Invalid passphrase');
  return null;
}

const passphraseParam = z.string().describe('Authentication passphrase');

export function createUiMcpHandler(env: Env) {
  const server = new McpServer({
    name: 'ui-api-mcp',
    version: '1.0.0',
  });

  const client = new UIClient(env);

  // ========================================
  // HOSTS
  // ========================================

  server.tool(
    'ui_list_hosts',
    'List all UniFi hosts (consoles/controllers) accessible to your account',
    {
      passphrase: passphraseParam,
      pageSize: z.string().optional().describe('Number of items per page (e.g. "10")'),
      nextToken: z.string().optional().describe('Pagination token for next page'),
    },
    async ({ passphrase, pageSize, nextToken }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.listHosts(pageSize, nextToken);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'ui_get_host',
    'Get detailed information about a specific UniFi host by its ID',
    {
      passphrase: passphraseParam,
      id: z.string().describe('Unique identifier of the host'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getHostById(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // SITES
  // ========================================

  server.tool(
    'ui_list_sites',
    'List all UniFi sites with metadata, device statistics, and ISP information',
    {
      passphrase: passphraseParam,
      pageSize: z.string().optional().describe('Number of items per page (e.g. "10")'),
      nextToken: z.string().optional().describe('Pagination token for next page'),
    },
    async ({ passphrase, pageSize, nextToken }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.listSites(pageSize, nextToken);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // DEVICES
  // ========================================

  server.tool(
    'ui_list_devices',
    'List UniFi devices (APs, switches, gateways) managed by hosts where you are owner or super admin',
    {
      passphrase: passphraseParam,
      hostIds: z.array(z.string()).optional().describe('Filter by specific host IDs'),
      time: z.string().optional().describe('Last processed timestamp in RFC3339 format (e.g. "2025-10-30T01:52:51Z")'),
      pageSize: z.string().optional().describe('Number of items per page (e.g. "10")'),
      nextToken: z.string().optional().describe('Pagination token for next page'),
    },
    async ({ passphrase, hostIds, time, pageSize, nextToken }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.listDevices(hostIds, time, pageSize, nextToken);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // ISP METRICS
  // ========================================

  server.tool(
    'ui_get_isp_metrics',
    'Get ISP performance metrics (latency, bandwidth, uptime, packet loss) for all sites. Use "5m" for 5-minute intervals or "1h" for hourly intervals.',
    {
      passphrase: passphraseParam,
      type: z.enum(['5m', '1h']).describe('Metric interval: "5m" (5-minute) or "1h" (1-hour)'),
      beginTimestamp: z.string().optional().describe('Start time in RFC3339 format (e.g. "2024-06-30T13:35:00Z"). Cannot use with duration.'),
      endTimestamp: z.string().optional().describe('End time in RFC3339 format. Cannot use with duration.'),
      duration: z.string().optional().describe('Time range from now: "24h", "7d", or "30d". Cannot use with begin/endTimestamp.'),
    },
    async ({ passphrase, type, beginTimestamp, endTimestamp, duration }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getIspMetrics(type, { beginTimestamp, endTimestamp, duration });
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'ui_query_isp_metrics',
    'Query ISP metrics for specific sites by hostId and siteId. Use "5m" for 5-minute intervals or "1h" for hourly intervals.',
    {
      passphrase: passphraseParam,
      type: z.enum(['5m', '1h']).describe('Metric interval: "5m" (5-minute) or "1h" (1-hour)'),
      sites: z.array(z.object({
        hostId: z.string().describe('Host identifier'),
        siteId: z.string().describe('Site identifier'),
        beginTimestamp: z.string().optional().describe('Start time in RFC3339 format'),
        endTimestamp: z.string().optional().describe('End time in RFC3339 format'),
      })).describe('Array of sites to query metrics for'),
    },
    async ({ passphrase, type, sites }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.queryIspMetrics(type, sites);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  // ========================================
  // SD-WAN
  // ========================================

  server.tool(
    'ui_list_sdwan_configs',
    'List all SD-WAN configurations',
    {
      passphrase: passphraseParam,
    },
    async ({ passphrase }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.listSdwanConfigs();
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'ui_get_sdwan_config',
    'Get detailed SD-WAN configuration including hub/spoke topology, tunnel settings, and routing',
    {
      passphrase: passphraseParam,
      id: z.string().describe('SD-WAN configuration ID (UUID)'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getSdwanConfigById(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  server.tool(
    'ui_get_sdwan_config_status',
    'Get live status of an SD-WAN configuration including tunnel connectivity, WAN status, and errors',
    {
      passphrase: passphraseParam,
      id: z.string().describe('SD-WAN configuration ID (UUID)'),
    },
    async ({ passphrase, id }) => {
      const authErr = validatePassphrase(passphrase, env.WRITE_PASSPHRASE);
      if (authErr) return authErr;
      try {
        const result = await client.getSdwanConfigStatus(id);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return ERROR_RESULT((e as Error).message);
      }
    }
  );

  return createMcpHandler(server);
}
