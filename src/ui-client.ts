import type { Env } from './types.ts';

interface UIApiResponse {
  httpStatusCode: number;
  traceId?: string;
  data?: unknown;
  nextToken?: string;
  code?: string;
  message?: string;
}

export class UIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(env: Env) {
    this.baseUrl = env.UI_API_BASE;
    this.apiKey = env.UI_API_KEY;
  }

  private async request(
    method: string,
    path: string,
    params?: Record<string, string | string[] | undefined>,
    body?: unknown
  ): Promise<UIApiResponse> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            url.searchParams.append(key, v);
          }
        } else {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Accept': 'application/json',
    };

    const init: RequestInit = { method, headers };

    if (body) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), init);
    const json = await response.json() as UIApiResponse;

    if (!response.ok) {
      const msg = json.message || json.code || `HTTP ${response.status}`;
      throw new Error(`UI API error: ${msg} (status ${response.status}, trace ${json.traceId || 'n/a'})`);
    }

    return json;
  }

  // ========================================
  // HOSTS
  // ========================================

  async listHosts(pageSize?: string, nextToken?: string) {
    return this.request('GET', '/v1/hosts', { pageSize, nextToken });
  }

  async getHostById(id: string) {
    return this.request('GET', `/v1/hosts/${encodeURIComponent(id)}`);
  }

  // ========================================
  // SITES
  // ========================================

  async listSites(pageSize?: string, nextToken?: string) {
    return this.request('GET', '/v1/sites', { pageSize, nextToken });
  }

  // ========================================
  // DEVICES
  // ========================================

  async listDevices(
    hostIds?: string[],
    time?: string,
    pageSize?: string,
    nextToken?: string
  ) {
    const params: Record<string, string | string[] | undefined> = {
      pageSize,
      nextToken,
      time,
    };

    // hostIds[] needs special handling
    const url = new URL(`${this.baseUrl}/v1/devices`);
    if (pageSize) url.searchParams.set('pageSize', pageSize);
    if (nextToken) url.searchParams.set('nextToken', nextToken);
    if (time) url.searchParams.set('time', time);
    if (hostIds) {
      for (const id of hostIds) {
        url.searchParams.append('hostIds[]', id);
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'Accept': 'application/json',
      },
    });
    const json = await response.json() as UIApiResponse;

    if (!response.ok) {
      const msg = json.message || json.code || `HTTP ${response.status}`;
      throw new Error(`UI API error: ${msg} (status ${response.status}, trace ${json.traceId || 'n/a'})`);
    }

    return json;
  }

  // ========================================
  // ISP METRICS
  // ========================================

  async getIspMetrics(
    type: string,
    options?: {
      beginTimestamp?: string;
      endTimestamp?: string;
      duration?: string;
    }
  ) {
    return this.request('GET', `/v1/isp-metrics/${encodeURIComponent(type)}`, {
      beginTimestamp: options?.beginTimestamp,
      endTimestamp: options?.endTimestamp,
      duration: options?.duration,
    });
  }

  async queryIspMetrics(
    type: string,
    sites: Array<{
      hostId: string;
      siteId: string;
      beginTimestamp?: string;
      endTimestamp?: string;
    }>
  ) {
    return this.request(
      'POST',
      `/v1/isp-metrics/${encodeURIComponent(type)}/query`,
      undefined,
      { sites }
    );
  }

  // ========================================
  // SD-WAN
  // ========================================

  async listSdwanConfigs() {
    return this.request('GET', '/v1/sd-wan-configs');
  }

  async getSdwanConfigById(id: string) {
    return this.request('GET', `/v1/sd-wan-configs/${encodeURIComponent(id)}`);
  }

  async getSdwanConfigStatus(id: string) {
    return this.request('GET', `/v1/sd-wan-configs/${encodeURIComponent(id)}/status`);
  }
}
