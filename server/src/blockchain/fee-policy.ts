import { ethers } from 'ethers';
import type { BlockchainTransactionOverrides } from './types';

function readWeiEnvironment(name: string): bigint | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a non-negative integer in wei`);
  }
  return BigInt(value);
}

function requirePositiveFee(value: bigint | null, source: string): bigint {
  if (value === null || value <= 0n) {
    throw new Error(
      `Blockchain provider returned no positive transaction fee (${source})`,
    );
  }
  return value;
}

export interface FeePolicyConfig {
  gasPriceWei?: string;
  maxGasPriceWei?: string;
}

/** Resolve a non-zero network fee for every backend-originated transaction. */
export async function getNominalTransactionOverrides(
  provider: ethers.JsonRpcProvider,
  config?: FeePolicyConfig,
): Promise<BlockchainTransactionOverrides> {
  const feeData = await provider.getFeeData();
  const configuredGasPrice = config?.gasPriceWei
    ? BigInt(config.gasPriceWei)
    : readWeiEnvironment('BLOCKCHAIN_GAS_PRICE_WEI');
  const gasPrice =
    configuredGasPrice ?? feeData.gasPrice ?? feeData.maxFeePerGas;
  const positiveGasPrice = requirePositiveFee(
    gasPrice,
    'gasPrice/maxFeePerGas',
  );

  const maximumGasPrice = config?.maxGasPriceWei
    ? BigInt(config.maxGasPriceWei)
    : readWeiEnvironment('BLOCKCHAIN_MAX_GAS_PRICE_WEI');
  if (maximumGasPrice !== undefined && positiveGasPrice > maximumGasPrice) {
    throw new Error(
      `Resolved gas price ${positiveGasPrice} wei exceeds BLOCKCHAIN_MAX_GAS_PRICE_WEI`,
    );
  }

  // The current QBFT deployment uses legacy gasPrice for broad Besu
  // compatibility. Besu may report maxPriorityFeePerGas as 0 on this network;
  // that value is irrelevant for a legacy gasPrice transaction and must not
  // block anchoring or quota issuance.
  return { gasPrice: positiveGasPrice };
}
