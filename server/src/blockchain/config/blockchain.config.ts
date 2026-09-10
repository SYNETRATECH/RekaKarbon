import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const blockchainConfigSchema = z.object({
  rpcUrl: z.url().optional(),
  privateKey: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Must be a valid 32-byte hex private key')
    .optional(),
  carbonTokenAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address')
    .optional(),
  emissionRegistryAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address')
    .optional(),
  chainId: z.number().int().positive().default(1338),
  reconciliationWorkerEnabled: z.boolean().default(true),
  reconciliationIntervalMs: z.number().int().positive().default(30000),
  reconciliationBatchSize: z.number().int().positive().default(20),
  gasPriceWei: z.string().regex(/^\d+$/).optional(),
  maxGasPriceWei: z.string().regex(/^\d+$/).optional(),
});

export type BlockchainConfig = z.infer<typeof blockchainConfigSchema>;

export const BLOCKCHAIN_CONFIG_KEY = 'blockchain';

export const blockchainConfig = registerAs(
  BLOCKCHAIN_CONFIG_KEY,
  (): BlockchainConfig => {
    const chainIdRaw =
      process.env.BESU_CHAIN_ID ||
      process.env.QBFT_CHAIN_ID ||
      process.env.CHAIN_ID ||
      '1338';
    const chainIdParsed = parseInt(chainIdRaw.trim(), 10);

    const rawConfig = {
      rpcUrl:
        process.env.BESU_RPC_URL?.trim() ||
        process.env.QBFT_RPC_URL?.trim() ||
        process.env.RPC_URL?.trim() ||
        undefined,
      privateKey: process.env.PRIVATE_KEY?.trim() || undefined,
      carbonTokenAddress:
        process.env.CARBON_TOKEN_CONTRACT_ADDRESS?.trim() ||
        process.env.CONTRACT_ADDRESS?.trim() ||
        undefined,
      emissionRegistryAddress:
        process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS?.trim() || undefined,
      chainId:
        Number.isInteger(chainIdParsed) && chainIdParsed > 0
          ? chainIdParsed
          : 1338,
      reconciliationWorkerEnabled:
        process.env.BLOCKCHAIN_RECONCILIATION_WORKER_ENABLED !== 'false',
      reconciliationIntervalMs: parseInt(
        process.env.BLOCKCHAIN_RECONCILIATION_INTERVAL_MS || '30000',
        10,
      ),
      reconciliationBatchSize: parseInt(
        process.env.BLOCKCHAIN_RECONCILIATION_BATCH_SIZE || '20',
        10,
      ),
      gasPriceWei: process.env.BLOCKCHAIN_GAS_PRICE_WEI?.trim() || undefined,
      maxGasPriceWei:
        process.env.BLOCKCHAIN_MAX_GAS_PRICE_WEI?.trim() || undefined,
    };

    const parsed = blockchainConfigSchema.safeParse(rawConfig);
    if (!parsed.success) {
      // Return raw config with fallback chainId when environment is partially configured
      return rawConfig;
    }

    return parsed.data;
  },
);
