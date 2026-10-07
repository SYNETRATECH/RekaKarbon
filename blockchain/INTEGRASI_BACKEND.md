# Backend Integration Guide (NestJS) - RekaKarbon Blockchain

> **Architecture Notice:** This guide details how the NestJS backend interacts with the RekaKarbon Smart Contract ecosystem deployed on Hyperledger Besu QBFT (Chain ID `1338`). Use the dedicated non-validator RPC endpoint and enforce explicit chain verification. Do not hardcode zero gas prices (`gasPrice: 0`).

This document is specifically tailored for Backend Engineers (NestJS) connecting API services to the RekaKarbon multi-asset Smart Contracts.

---

## 1. Prerequisites & Package Installation

The backend system operates as an authorized **Oracle** (permitted to mint and notarize verified carbon credits) and interacts directly with the private Besu network using **Ethers.js (v6)**.

Install Ethers.js in the backend package:

```bash
pnpm --filter @rekakarbon/server add ethers
```

---

## 2. Artifact Handover & Setup

Obtain or copy the following files from the Blockchain module into the NestJS project (e.g., `server/src/blockchain/`):

1. **Contract Address**: Deployed contract address on the target QBFT network.
2. **ABI Artifact**: Exported ABI file from `blockchain/artifacts/contracts/RekaKarbon.sol/RekaKarbon.json`.

---

## 3. Environment Variables Configuration

Add the following variables to `server/.env`:

```env
# RPC endpoint for the non-validator Besu node
RPC_URL=http://127.0.0.1:8545

# Deployed RekaKarbon ERC-1155 Smart Contract address
CONTRACT_ADDRESS=0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0

# Private Key of the Backend Oracle account (authorized with ORACLE_ROLE)
PRIVATE_KEY=your-secure-private-key

# Expected Chain ID (1338 for local QBFT)
BESU_CHAIN_ID=1338
```

---

## 4. `BlockchainService` Implementation

Create a dedicated NestJS service to manage RPC connections, signing transactions, and interacting with contract methods:

**File: `src/blockchain/blockchain.service.ts`**

```typescript
import { Injectable, OnModuleInit, InternalServerErrorException, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as RekaKarbonABI from './abi/RekaKarbon.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  async onModuleInit() {
    try {
      const rpcUrl = process.env.RPC_URL ?? 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Verify network chain ID matches expectation
      const network = await this.provider.getNetwork();
      const expectedChainId = BigInt(process.env.BESU_CHAIN_ID ?? '1338');
      if (network.chainId !== expectedChainId) {
        throw new Error(
          `Connected chain ID (${network.chainId}) does not match expected (${expectedChainId})`
        );
      }

      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS!,
        RekaKarbonABI.abi,
        this.wallet
      );

      this.logger.log('Connected to Hyperledger Besu QBFT network successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize BlockchainService:', error);
    }
  }

  /**
   * READ: Query carbon token balance for an address and token ID
   */
  async getCarbonBalance(address: string, tokenId: bigint): Promise<bigint> {
    try {
      const balance: bigint = await this.contract.balanceOf(address, tokenId);
      return balance;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to retrieve balance: ${error.message}`);
    }
  }

  /**
   * WRITE: Mint certified carbon offset credits (SPE-GRK, ID >= 2)
   * Authorized only for accounts holding ORACLE_ROLE
   */
  async mintOffsetCredit(toAddress: string, amount: bigint, metadataUri: string): Promise<string> {
    try {
      const feeData = await this.provider.getFeeData();
      const tx = await this.contract.mintOffsetCredit(toAddress, amount, metadataUri, {
        gasPrice: feeData.gasPrice,
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to mint carbon credit on blockchain: ${error.message}`
      );
    }
  }
}
```

---

## 5. Integration Best Practices for Backend Teams

1. **BigInt Precision**: Always use JavaScript native `bigint` or `ethers.BigNumberish` for all token balances and quantities to prevent integer precision loss.
2. **Asynchronous Confirmation**: Blockchain transactions are asynchronous. Wait for block confirmation (`tx.wait()`) and handle network latency gracefully using job queues (such as BullMQ) when processing high-volume requests.
3. **Receipt & Event Logging**: Persist all `transactionHash` values, block numbers, and emitted events in the PostgreSQL database (`Prisma`) as secondary indexed records for fast user querying.
4. **Revert Handling**: Catch transaction reverts and parse custom contract revert errors to return user-friendly HTTP error codes (e.g., HTTP 400 Bad Request if an asset is frozen).
