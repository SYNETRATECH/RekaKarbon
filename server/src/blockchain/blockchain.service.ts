import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ethers } from 'ethers';
import * as RekaKarbonABI from './config/RekaKarbon.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;

  onModuleInit() {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      this.logger.warn(
        '⚠️ Blockchain integration is not fully configured. Please set RPC_URL, PRIVATE_KEY, and CONTRACT_ADDRESS in environment variables.',
      );
      return;
    }

    try {
      // 1. Connect to Hyperledger Besu / Hardhat Dev Node
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // 2. Connect to Wallet (for signing transactions)
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // 3. Initialize Contract
      this.contract = new ethers.Contract(
        contractAddress,
        RekaKarbonABI.abi,
        this.wallet,
      );

      this.logger.log(
        '✅ Success connecting to Ethereum / Besu Node and Contract',
      );
    } catch (error) {
      this.logger.error('❌ Failed to initialize BlockchainService:', error);
    }
  }

  /**
   * READ: Check the carbon certificate balance of an address for a specific token ID
   */
  async getCarbonBalance(address: string, tokenId: number): Promise<number> {
    if (!this.contract) {
      throw new InternalServerErrorException(
        'Blockchain contract is not initialized.',
      );
    }
    try {
      const balance = (await this.contract.balanceOf(
        address,
        tokenId,
      )) as bigint;
      return Number(balance);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error reading carbon balance: ${message}`);
      throw new InternalServerErrorException(
        `Failed to read balance: ${message}`,
      );
    }
  }

  /**
   * WRITE: Mint Carbon Certificate (Offset Credit)
   * Must be called by an account with ORACLE_ROLE
   */
  async mintOffsetCredit(
    toAddress: string,
    amount: number,
    coordinates: string,
  ): Promise<string> {
    if (!this.contract) {
      throw new InternalServerErrorException(
        'Blockchain contract is not initialized.',
      );
    }
    try {
      // gasPrice: 0 because Besu dev networks typically run with zero gas price
      const tx = (await this.contract.mintOffsetCredit(
        toAddress,
        amount,
        coordinates,
        {
          gasPrice: 0,
        },
      )) as ethers.ContractTransactionResponse;

      // Wait until transaction is mined in a block
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt was null.');
      }

      return receipt.hash;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error minting offset credit: ${message}`);
      throw new InternalServerErrorException(
        `Failed to mint certificate: ${message}`,
      );
    }
  }
}
