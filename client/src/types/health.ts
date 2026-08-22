export interface HealthStatusResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latencyMs: number;
    };
    blockchain: {
      status: 'synced' | 'unreachable';
      network: string;
      latestBlock: number;
      chainId: number;
    };
    storage: {
      status: 'operational';
    };
  };
}
