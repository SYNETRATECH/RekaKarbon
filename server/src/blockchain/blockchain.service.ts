import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ethers } from 'ethers';
import * as RekaKarbonABI from './config/RekaKarbon.json';
import * as EmissionRegistryABI from './config/EmissionReportRegistry.json';
import type {
  BlockchainEvent,
  CarbonTokenContract,
  EmissionRegistryContract,
} from './types';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private rekaKarbonContract: CarbonTokenContract | null = null;
  private registryContract: EmissionRegistryContract | null = null;

  onModuleInit() {
    const rpcUrl = process.env.BESU_RPC_URL || process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const rekaKarbonAddress =
      process.env.CARBON_TOKEN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;
    const registryAddress = process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !rekaKarbonAddress || !registryAddress) {
      this.logger.warn(
        '⚠️ Blockchain integration missing config. Check BESU_RPC_URL, PRIVATE_KEY, CARBON_TOKEN_CONTRACT_ADDRESS, EMISSION_REGISTRY_CONTRACT_ADDRESS.',
      );
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      this.rekaKarbonContract = new ethers.Contract(
        rekaKarbonAddress,
        RekaKarbonABI.abi,
        this.wallet,
      ) as unknown as CarbonTokenContract;

      this.registryContract = new ethers.Contract(
        registryAddress,
        EmissionRegistryABI.abi,
        this.wallet,
      ) as unknown as EmissionRegistryContract;

      this.logger.log(
        '✅ Connected to Hyperledger Besu Nodes (RekaKarbon & Registry)',
      );
    } catch (error) {
      this.logger.error('❌ Failed to initialize BlockchainService:', error);
    }
  }

  private ensureRekaKarbon() {
    if (!this.rekaKarbonContract)
      throw new InternalServerErrorException(
        'RekaKarbon contract not initialized',
      );
    return this.rekaKarbonContract;
  }

  private ensureRegistry() {
    if (!this.registryContract)
      throw new InternalServerErrorException(
        'Registry contract not initialized',
      );
    return this.registryContract;
  }

  async getCarbonBalance(address: string, tokenId: number): Promise<number> {
    const contract = this.ensureRekaKarbon();
    try {
      const balance = await contract.balanceOf(address, tokenId);
      return Number(balance);
    } catch (error) {
      this.logger.error('Error reading carbon balance:', error);
      throw new InternalServerErrorException('Failed to read balance');
    }
  }

  async mintOffsetCredit(
    toAddress: string,
    amount: number,
    coordinates: string,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    try {
      const tx = await contract.mintOffsetCredit(
        toAddress,
        amount,
        coordinates,
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error) {
      this.logger.error('Error minting offset credit:', error);
      throw new InternalServerErrorException('Failed to mint certificate');
    }
  }

  // --- NEW FASE 1 METHODS ---

  async mintWalletCredit(
    toAddress: string,
    amountIdr: number,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    try {
      const tx = await contract.mintWalletCredit(toAddress, amountIdr);
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error) {
      this.logger.error('Error minting wallet credit:', error);
      throw new InternalServerErrorException('Failed to mint wallet credit');
    }
  }

  async getWalletBalance(address: string): Promise<number> {
    // RKB_CREDIT token ID is 3
    return this.getCarbonBalance(address, 3);
  }

  async getWalletTransactionHistory(address: string) {
    const contract = this.ensureRekaKarbon();
    try {
      const filterIn = contract.filters.TransferSingle(null, null, address);
      const filterOut = contract.filters.TransferSingle(null, address, null);

      const [eventsIn, eventsOut] = await Promise.all([
        contract.queryFilter(filterIn, 0, 'latest'),
        contract.queryFilter(filterOut, 0, 'latest'),
      ]);

      // Combine and parse events
      const allEvents = [...eventsIn, ...eventsOut];

      const history = await Promise.all(
        allEvents.map(async (event: BlockchainEvent) => {
          const isIncoming =
            event.args[2].toLowerCase() === address.toLowerCase();
          const tokenId = Number(event.args[3]);
          const amount = Number(event.args[4]);

          // Filter only RKB_CREDIT (Token ID 3)
          if (tokenId !== 3) return null;

          const block = await event.getBlock();

          return {
            id: event.transactionHash,
            type: isIncoming ? 'DEPOSIT' : 'EXPENSE',
            title: isIncoming ? 'Top-up Xendit' : 'Beli Karbon (DEX)',
            amount: amount,
            date: new Date(block.timestamp * 1000).toISOString(),
            status: 'SUCCESS',
          };
        }),
      );

      // Remove nulls and sort by date descending
      return history
        .filter((item) => item !== null)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    } catch (error) {
      this.logger.error('Error fetching wallet history:', error);
      throw new InternalServerErrorException('Failed to fetch wallet history');
    }
  }

  async executeBursaPurchase(
    buyer: string,
    seller: string,
    assetId: number,
    amountTco2e: number,
    totalCost: number,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    try {
      const tx = await contract.executeBursaPurchase(
        buyer,
        seller,
        assetId,
        amountTco2e,
        totalCost,
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error) {
      this.logger.error('Error executing bursa purchase:', error);
      throw new InternalServerErrorException(
        'Failed to execute purchase on-chain',
      );
    }
  }

  async retireCarbonToken(
    from: string,
    assetId: number,
    amountTco2e: number,
    certNumber: string,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    try {
      const tx = await contract.retireCarbonWithCertificate(
        assetId,
        amountTco2e,
        certNumber,
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error) {
      this.logger.error('Error retiring carbon token:', error);
      throw new InternalServerErrorException('Failed to retire token on-chain');
    }
  }

  async submitEmissionReport(
    year: number,
    rootHash: string,
  ): Promise<{ txHash: string; reportId: number }> {
    const contract = this.ensureRegistry();
    try {
      const tx = await contract.submitReport(year, rootHash);
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');

      // Parse event to get reportId
      const event = receipt.logs.find(
        (log) => log.fragment?.name === 'ReportSubmitted',
      );
      const reportId = event?.args ? Number(event.args[0]) : 0;

      return { txHash: receipt.hash, reportId };
    } catch (error) {
      this.logger.error('Error submitting emission report:', error);
      throw new InternalServerErrorException(
        'Failed to submit report on-chain',
      );
    }
  }
}
