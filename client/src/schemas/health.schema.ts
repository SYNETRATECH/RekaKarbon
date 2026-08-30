import { z } from 'zod';

export const HealthStatusResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  timestamp: z.string(),
  uptimeSeconds: z.number(),
  environment: z.string(),
  services: z.object({
    database: z.object({
      status: z.enum(['connected', 'disconnected']),
      latencyMs: z.number(),
    }),
    blockchain: z.object({
      status: z.enum(['synced', 'unreachable']),
      network: z.string(),
      latestBlock: z.number(),
      chainId: z.number(),
    }),
    storage: z.object({
      status: z.enum(['operational']),
    }),
  }),
});

export type HealthStatusResponseType = z.infer<typeof HealthStatusResponseSchema>;
