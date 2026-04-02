# ui-api-mcp

MCP server for managing UniFi network infrastructure via the [UI Site Manager API](https://developer.ui.com). Deployed as a Cloudflare Worker with passphrase-based auth.

## Tools

### Hosts
- `ui_list_hosts` - List all UniFi hosts (consoles/controllers)
- `ui_get_host` - Get details for a specific host

### Sites
- `ui_list_sites` - List all sites with device stats and ISP info

### Devices
- `ui_list_devices` - List APs, switches, gateways (filterable by host)

### ISP Metrics
- `ui_get_isp_metrics` - Get ISP performance (latency, bandwidth, uptime, packet loss) across all sites
- `ui_query_isp_metrics` - Query ISP metrics for specific sites

### SD-WAN
- `ui_list_sdwan_configs` - List SD-WAN configurations
- `ui_get_sdwan_config` - Get config details (hub/spoke topology, tunnels, routing)
- `ui_get_sdwan_config_status` - Get live tunnel connectivity and WAN status

## Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono + MCP SDK (`@modelcontextprotocol/sdk`)
- **Auth**: Passphrase in tool arguments (same pattern as Nexus MCP)
- **API**: UI Site Manager API (`https://api.ui.com`)

## Setup

```bash
bun install

# Set secrets
bunx wrangler secret put UI_API_KEY
bunx wrangler secret put WRITE_PASSPHRASE

# Dev
bun run dev        # localhost:8788

# Deploy
bun run deploy
```

## MCP Endpoint

`POST /mcp` - Streamable HTTP MCP endpoint

All tools require a `passphrase` parameter for authentication.
