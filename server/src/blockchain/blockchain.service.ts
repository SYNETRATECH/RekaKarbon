import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ethers } from 'ethers';
import * as RekaKarbonABI from './config/RekaKarbon.json';
import * as EmissionRegistryABI from './config/EmissionReportRegistry.json';
import type {
  BlockchainEvent,
  BlockchainBursaListingResult,
  BlockchainBursaListingState,
  BlockchainBursaQuote,
  BlockchainBursaRevenueRecipients,
  BlockchainHealth,
  BlockchainMintOffsetCreditResult,
  BlockchainRetirementCertificate,
  CarbonTokenContract,
  EmissionRegistryContract,
  BlockchainTransactionReceipt,
} from './types';

const WALLET_HISTORY_BLOCK_CHUNK = 500;

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

  async getHealth(): Promise<BlockchainHealth> {
    const configuredChainId = this.getConfiguredChainId();
    const contractAddress =
      process.env.CARBON_TOKEN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;

    if (
      !this.provider ||
      !this.wallet ||
      !this.rekaKarbonContract ||
      !configuredChainId ||
      !contractAddress
    ) {
      return {
        status: 'unconfigured',
        network: 'Hyperledger Besu / EVM Private Network',
        configuredChainId,
        contractAddress,
        reason: 'RPC, signer, chain ID, or contract address is not configured.',
      };
    }

    try {
      const network = await this.provider.getNetwork();
      const connectedChainId = Number(network.chainId);
      const bytecode = await this.provider.getCode(contractAddress);
      const contractDeployed = bytecode !== '0x';
      const chainMatches = connectedChainId === configuredChainId;

      const reasons: string[] = [];
      if (!chainMatches) {
        reasons.push(
          `Connected chain ID ${connectedChainId} does not match configured chain ID ${configuredChainId}.`,
        );
      }
      if (!contractDeployed) {
        reasons.push(
          'The configured carbon contract has no bytecode at its address.',
        );
      }

      if (!chainMatches || !contractDeployed) {
        return {
          status: 'degraded',
          network: 'Hyperledger Besu / EVM Private Network',
          configuredChainId,
          connectedChainId,
          contractAddress,
          contractDeployed,
          reason: reasons.join(' '),
        };
      }

      const ministryRole = await this.rekaKarbonContract.MINISTRY_ROLE();
      const ministryRoleGrantedToSigner = await this.rekaKarbonContract.hasRole(
        ministryRole,
        this.wallet.address,
      );

      if (ministryRoleGrantedToSigner) {
        return {
          status: 'ready',
          network: 'Hyperledger Besu / EVM Private Network',
          configuredChainId,
          connectedChainId,
          contractAddress,
          contractDeployed,
          ministryRoleGrantedToSigner,
        };
      }

      if (!ministryRoleGrantedToSigner) {
        reasons.push('The backend signer does not have MINISTRY_ROLE.');
      }

      return {
        status: 'degraded',
        network: 'Hyperledger Besu / EVM Private Network',
        configuredChainId,
        connectedChainId,
        contractAddress,
        contractDeployed,
        ministryRoleGrantedToSigner,
        reason: reasons.join(' '),
      };
    } catch (error: unknown) {
      const reason =
        error instanceof Error ? error.message : 'RPC health check failed.';
      return {
        status: 'offline',
        network: 'Hyperledger Besu / EVM Private Network',
        configuredChainId,
        contractAddress,
        reason,
      };
    }
  }

  async getLatestBlockNumber(): Promise<number | null> {
    if (!this.provider) return null;

    try {
      return await this.provider.getBlockNumber();
    } catch {
      return null;
    }
  }

  private getConfiguredChainId(): number | undefined {
    const configuredValue =
      process.env.BESU_CHAIN_ID || process.env.CHAIN_ID || '1338';
    const configuredChainId = Number(configuredValue);
    return Number.isInteger(configuredChainId) && configuredChainId > 0
      ? configuredChainId
      : undefined;
  }

  private async assertWriteTarget(
    contractAddress: string | undefined,
    contractName: string,
  ): Promise<void> {
    if (!this.provider || !contractAddress) {
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'BLOCKCHAIN_TARGET_UNAVAILABLE',
          message: `${contractName} blockchain target is not configured.`,
        },
      });
    }

    const configuredChainId = this.getConfiguredChainId();
    if (!configuredChainId) {
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'BLOCKCHAIN_CHAIN_ID_INVALID',
          message: 'Configured blockchain chain ID is invalid.',
        },
      });
    }

    try {
      const [network, bytecode] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getCode(contractAddress),
      ]);
      const connectedChainId = Number(network.chainId);
      if (connectedChainId !== configuredChainId || bytecode === '0x') {
        throw new ServiceUnavailableException({
          success: false,
          error: {
            code: 'BLOCKCHAIN_TARGET_MISMATCH',
            message: `${contractName} write blocked because the active chain or contract does not match configuration.`,
            details: {
              configuredChainId,
              connectedChainId,
              contractAddress,
              contractDeployed: bytecode !== '0x',
            },
          },
        });
      }
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'BLOCKCHAIN_TARGET_UNAVAILABLE',
          message: `${contractName} write target could not be verified.`,
          details: { reason },
        },
      });
    }
  }

  private async getWriteOverrides(): Promise<{ gasPrice: bigint }> {
    if (!this.provider) {
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'BLOCKCHAIN_TARGET_UNAVAILABLE',
          message: 'Blockchain provider is not initialized.',
        },
      });
    }

    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
    if (gasPrice === null) {
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'BLOCKCHAIN_FEE_UNAVAILABLE',
          message: 'The active QBFT node did not return a usable gas price.',
        },
      });
    }
    return { gasPrice };
  }

  async getCarbonBalance(address: string, tokenId: number): Promise<number> {
    const contract = this.ensureRekaKarbon();
    try {
      const validAddress = this.sanitizeAddress(
        address,
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Fallback to a mock address if invalid
      );
      const balance = await contract.balanceOf(validAddress, tokenId);
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

  async mintOffsetCreditWithTokenId(
    toAddress: string,
    amount: number,
    coordinates: string,
  ): Promise<BlockchainMintOffsetCreditResult> {
    const contract = this.ensureRekaKarbon();
    const validAddress = this.normalizeAddress(toAddress, 'Recipient wallet');
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new BadRequestException(
        'Volume SPE-GRK yang diterbitkan harus berupa bilangan bulat positif.',
      );
    }

    try {
      const tx = await contract.mintOffsetCredit(
        validAddress,
        amount,
        coordinates,
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');

      const tokenId = this.getReceiptEventArg(receipt, 'TransferSingle', 3);
      if (tokenId === null || tokenId > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error('SPE-GRK token ID was not returned by the contract');
      }

      return { tokenId: Number(tokenId), txHash: receipt.hash };
    } catch (error: unknown) {
      this.logger.error('Error minting SPE-GRK with token ID:', error);
      throw new InternalServerErrorException(
        'Gagal menerbitkan SPE-GRK ke blockchain',
      );
    }
  }

  async issueQuota(toAddress: string, quotaTCO2e: number): Promise<string> {
    const contract = this.ensureRekaKarbon();
    if (!Number.isFinite(quotaTCO2e) || quotaTCO2e <= 0) {
      throw new InternalServerErrorException('Invalid PTBAE-PU quota');
    }

    let validAddress: string;
    try {
      validAddress = ethers.getAddress(toAddress);
    } catch {
      throw new InternalServerErrorException(
        'Company wallet address is not a valid EVM address',
      );
    }

    try {
      // PTBAE-PU keeps two decimal places in the database. The ERC-1155
      // quantity is stored in centi-tCO2e units to avoid losing precision.
      const amount = ethers.parseUnits(quotaTCO2e.toFixed(2), 2);
      const tx = await contract.issueQuota(
        validAddress,
        amount,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error: unknown) {
      this.logger.error('Error issuing PTBAE-PU quota:', error);
      throw new InternalServerErrorException(
        'Failed to issue PTBAE-PU quota on-chain',
      );
    }
  }

  // --- NEW FASE 1 METHODS ---

  async mintWalletCredit(
    toAddress: string,
    amountIdr: number,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    await this.assertWriteTarget(
      process.env.CARBON_TOKEN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS,
      'RekaKarbon',
    );
    try {
      const tx = await contract.mintWalletCredit(
        toAddress,
        amountIdr,
        await this.getWriteOverrides(),
      );
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
      if (!this.provider) {
        throw new Error('Blockchain provider not initialized');
      }

      const validAddress = this.sanitizeAddress(
        address,
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      );
      const filterIn = contract.filters.TransferSingle(
        null,
        null,
        validAddress,
      );
      const filterOut = contract.filters.TransferSingle(
        null,
        validAddress,
        null,
      );
      const latestBlock = await this.provider.getBlockNumber();

      const [eventsIn, eventsOut] = await Promise.all([
        this.queryTransferEvents(contract, filterIn, latestBlock),
        this.queryTransferEvents(contract, filterOut, latestBlock),
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

      // A Bursa settlement emits one RKB_CREDIT TransferSingle per revenue
      // recipient. Present those events as one wallet transaction instead of
      // rendering six rows with the same transaction hash.
      const groupedHistory = new Map<
        string,
        NonNullable<(typeof history)[number]>
      >();
      for (const item of history) {
        if (!item) continue;
        const key = `${item.id}:${item.type}`;
        const existing = groupedHistory.get(key);
        if (existing) {
          existing.amount += item.amount;
        } else {
          groupedHistory.set(key, { ...item });
        }
      }

      return [...groupedHistory.values()].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } catch (error) {
      this.logger.error('Error fetching wallet history:', error);
      throw new InternalServerErrorException('Failed to fetch wallet history');
    }
  }

  private async queryTransferEvents(
    contract: CarbonTokenContract,
    filter: unknown,
    latestBlock: number,
  ): Promise<BlockchainEvent[]> {
    const events: BlockchainEvent[] = [];

    for (
      let fromBlock = 0;
      fromBlock <= latestBlock;
      fromBlock += WALLET_HISTORY_BLOCK_CHUNK
    ) {
      const toBlock = Math.min(
        fromBlock + WALLET_HISTORY_BLOCK_CHUNK - 1,
        latestBlock,
      );
      const chunk = await contract.queryFilter(filter, fromBlock, toBlock);
      events.push(...chunk);
    }

    return events;
  }

  private sanitizeAddress(address: string, fallback: string): string {
    try {
      return ethers.getAddress(address.toLowerCase());
    } catch {
      this.logger.warn(`Invalid address detected: ${address}. Using fallback.`);
      return fallback;
    }
  }

  private normalizeAddress(address: string, fieldName: string): string {
    try {
      return ethers.getAddress(address.toLowerCase());
    } catch {
      throw new InternalServerErrorException(
        `${fieldName} must be a valid EVM address`,
      );
    }
  }

  private toPositiveInteger(value: number, fieldName: string): bigint {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new InternalServerErrorException(
        `${fieldName} must be a positive integer`,
      );
    }
    return BigInt(value);
  }

  private getReceiptEventArg(
    receipt: BlockchainTransactionReceipt,
    eventName: string,
    argumentIndex: number,
  ): bigint | null {
    const event = receipt.logs.find((log) => log.fragment?.name === eventName);
    const value = event?.args?.[argumentIndex];
    return typeof value === 'bigint' ? value : null;
  }

  async createBursaListing(
    seller: string,
    assetId: number,
    amountTco2e: number,
    floorPricePerTonIdr: number,
    projectId: string,
    kthGroupId: string,
    projectSnapshotMerkleRoot: string,
  ): Promise<BlockchainBursaListingResult> {
    const contract = this.ensureRekaKarbon();
    const validSeller = this.normalizeAddress(seller, 'Seller wallet');
    const validAssetId = this.toPositiveInteger(assetId, 'Asset ID');
    const validAmount = this.toPositiveInteger(amountTco2e, 'Listing amount');
    const validFloorPrice = this.toPositiveInteger(
      floorPricePerTonIdr,
      'Floor price',
    );
    if (!ethers.isHexString(projectSnapshotMerkleRoot, 32)) {
      throw new InternalServerErrorException(
        'Invalid project snapshot Merkle root',
      );
    }

    try {
      const tx = await contract.createBursaListing(
        validSeller,
        validAssetId,
        validAmount,
        validFloorPrice,
        this.applicationIdToBytes32(projectId),
        this.applicationIdToBytes32(kthGroupId),
        projectSnapshotMerkleRoot,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');

      const listingId = this.getReceiptEventArg(
        receipt,
        'BursaListingCreated',
        0,
      );
      if (listingId === null) {
        throw new Error('Bursa listing ID was not returned by the contract');
      }

      return { listingId: Number(listingId), txHash: receipt.hash };
    } catch (error: unknown) {
      this.logger.error('Error creating Bursa listing:', error);
      throw new InternalServerErrorException(
        'Failed to create Bursa listing on-chain',
      );
    }
  }

  async setBursaListingKthRecipient(
    listingId: number,
    kthRecipient: string,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    const validListingId = this.toPositiveInteger(listingId, 'Listing ID');
    const validKthRecipient = this.normalizeAddress(
      kthRecipient,
      'KTH recipient wallet',
    );

    try {
      const tx = await contract.setBursaListingKthRecipient(
        validListingId,
        validKthRecipient,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error: unknown) {
      this.logger.error('Error configuring Bursa KTH recipient:', error);
      throw new InternalServerErrorException(
        'Failed to configure Bursa KTH recipient on-chain',
      );
    }
  }

  async confirmBursaListing(
    listingId: number,
    kthRepresentative: string,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    const validListingId = this.toPositiveInteger(listingId, 'Listing ID');
    const validRepresentative = this.normalizeAddress(
      kthRepresentative,
      'KTH representative wallet',
    );

    try {
      const tx = await contract.confirmBursaListing(
        validListingId,
        validRepresentative,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error: unknown) {
      this.logger.error('Error confirming Bursa listing:', error);
      throw new InternalServerErrorException(
        'Failed to confirm Bursa listing on-chain',
      );
    }
  }

  async activateBursaListing(listingId: number): Promise<string> {
    const contract = this.ensureRekaKarbon();
    const validListingId = this.toPositiveInteger(listingId, 'Listing ID');

    try {
      const tx = await contract.activateBursaListing(
        validListingId,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error: unknown) {
      this.logger.error('Error activating Bursa listing:', error);
      throw new InternalServerErrorException(
        'Failed to activate Bursa listing on-chain',
      );
    }
  }

  async updateBursaMarketPrice(
    listingId: number,
    marketPricePerTonIdr: number,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    const validListingId = this.toPositiveInteger(listingId, 'Listing ID');
    const validPrice = this.toPositiveInteger(
      marketPricePerTonIdr,
      'Market price',
    );

    try {
      const tx = await contract.updateBursaMarketPrice(
        validListingId,
        validPrice,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error: unknown) {
      this.logger.error('Error updating Bursa market price:', error);
      throw new InternalServerErrorException(
        'Failed to update Bursa market price on-chain',
      );
    }
  }

  async quoteBursaPurchase(
    listingId: number,
    amountTco2e: number,
  ): Promise<BlockchainBursaQuote> {
    const contract = this.ensureRekaKarbon();
    const validListingId = this.toPositiveInteger(listingId, 'Listing ID');
    const validAmount = this.toPositiveInteger(amountTco2e, 'Purchase amount');

    try {
      const [unitPrice, totalCost] = await contract.quoteBursaPurchase(
        validListingId,
        validAmount,
      );
      return {
        unitPricePerTonIdr: Number(unitPrice),
        totalCostRkb: Number(totalCost),
      };
    } catch (error: unknown) {
      this.logger.error('Error quoting Bursa purchase:', error);
      throw new BadRequestException('Unable to quote Bursa purchase');
    }
  }

  async getBursaListingState(
    listingId: number,
  ): Promise<BlockchainBursaListingState> {
    const contract = this.ensureRekaKarbon();
    const validListingId = this.toPositiveInteger(listingId, 'Listing ID');
    try {
      const listing = await contract.bursaListings(validListingId);
      const seller = String(listing[0]);
      if (!ethers.isAddress(seller) || seller === ethers.ZeroAddress) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'BURSA_CHAIN_LISTING_NOT_FOUND',
            message: 'Listing Bursa tidak ditemukan di blockchain aktif.',
            details: { listingId },
          },
        });
      }
      return {
        listingId,
        seller: ethers.getAddress(seller),
        assetId: Number(listing[1]),
        totalAmount: Number(listing[2]),
        soldAmount: Number(listing[3]),
        floorPricePerTonIdr: Number(listing[4]),
        marketPricePerTonIdr: Number(listing[5]),
        kthConfirmedBy: ethers.getAddress(String(listing[9])),
        status: Number(listing[12]),
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error reading Bursa listing ${listingId}:`, reason);
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'BURSA_CHAIN_UNAVAILABLE',
          message: 'Status listing Bursa di blockchain tidak dapat dibaca.',
          details: { listingId, reason },
        },
      });
    }
  }

  async purchaseBursaListing(
    listingId: number,
    buyer: string,
    amountTco2e: number,
    maxTotalCostRkb: number,
  ): Promise<string> {
    const contract = this.ensureRekaKarbon();
    const validListingId = this.toPositiveInteger(listingId, 'Listing ID');
    const validBuyer = this.normalizeAddress(buyer, 'Buyer wallet');
    const validAmount = this.toPositiveInteger(amountTco2e, 'Purchase amount');
    const validMaxCost = this.toPositiveInteger(
      maxTotalCostRkb,
      'Maximum purchase cost',
    );

    try {
      const tx = await contract.purchaseBursaListing(
        validListingId,
        validBuyer,
        validAmount,
        validMaxCost,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error: unknown) {
      this.logger.error('Error settling Bursa purchase:', error);
      throw new BadRequestException('Failed to settle Bursa purchase on-chain');
    }
  }

  async cancelBursaListing(listingId: number): Promise<string> {
    const contract = this.ensureRekaKarbon();
    const validListingId = this.toPositiveInteger(listingId, 'Listing ID');

    try {
      const tx = await contract.cancelBursaListing(
        validListingId,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return receipt.hash;
    } catch (error: unknown) {
      this.logger.error('Error cancelling Bursa listing:', error);
      throw new BadRequestException('Failed to cancel Bursa listing on-chain');
    }
  }

  async getBursaRevenueRecipients(): Promise<BlockchainBursaRevenueRecipients> {
    const contract = this.ensureRekaKarbon();
    const [
      platform,
      restoration,
      maintenance,
      monitoring,
      buffer,
      environmentalIntelligence,
    ] = await Promise.all([
      contract.platformRecipient(),
      contract.restorationRecipient(),
      contract.maintenanceRecipient(),
      contract.monitoringRecipient(),
      contract.bufferRecipient(),
      contract.environmentalIntelligenceRecipient(),
    ]);

    return {
      platform: this.normalizeAddress(platform, 'Platform recipient'),
      restoration: this.normalizeAddress(restoration, 'Restoration recipient'),
      maintenance: this.normalizeAddress(maintenance, 'Maintenance recipient'),
      monitoring: this.normalizeAddress(monitoring, 'Monitoring recipient'),
      buffer: this.normalizeAddress(buffer, 'Buffer recipient'),
      environmentalIntelligence: this.normalizeAddress(
        environmentalIntelligence,
        'Environmental intelligence recipient',
      ),
    };
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
      const validBuyer = this.sanitizeAddress(
        buyer,
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      );
      const validSeller = this.sanitizeAddress(
        seller,
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      );

      const tx = await contract.executeBursaPurchase(
        validBuyer,
        validSeller,
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
      const validFrom = ethers.getAddress(from);
      const tx = await contract.retireCarbonWithCertificateFor(
        validFrom,
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

  async getRetirementCertificateByTransactionHash(
    txHash: string,
  ): Promise<BlockchainRetirementCertificate | null> {
    if (!ethers.isHexString(txHash, 32)) return null;
    if (!this.provider) {
      throw new InternalServerErrorException(
        'Blockchain provider not initialized',
      );
    }

    const contractAddress =
      process.env.CARBON_TOKEN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new InternalServerErrorException(
        'Carbon token contract address is not configured',
      );
    }

    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) return null;

    const contractInterface = new ethers.Interface(RekaKarbonABI.abi);
    const retirementEvent = receipt.logs
      .filter(
        (log) => log.address.toLowerCase() === contractAddress.toLowerCase(),
      )
      .map((log) => {
        try {
          return contractInterface.parseLog({
            topics: log.topics,
            data: log.data,
          });
        } catch {
          return null;
        }
      })
      .find((event) => event?.name === 'RetirementCertificateIssued');

    if (!retirementEvent) return null;

    const block = await this.provider.getBlock(receipt.blockNumber);
    const network = await this.provider.getNetwork();
    const args = retirementEvent.args;

    return {
      certificateId: Number(args[0]),
      retiree: ethers.getAddress(String(args[1])),
      assetId: Number(args[2]),
      amountRetired: Number(args[3]),
      certificateNumber: String(args[4]),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      retiredAt: block ? new Date(block.timestamp * 1000).toISOString() : null,
      chainId: Number(network.chainId),
      contractAddress: ethers.getAddress(contractAddress),
    };
  }

  async getRetirementCertificatesForAddress(
    address: string,
  ): Promise<BlockchainRetirementCertificate[]> {
    if (!this.provider) {
      throw new InternalServerErrorException(
        'Blockchain provider not initialized',
      );
    }

    const contractAddress =
      process.env.CARBON_TOKEN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new InternalServerErrorException(
        'Carbon token contract address is not configured',
      );
    }

    const validAddress = ethers.getAddress(address);
    const contractInterface = new ethers.Interface(RekaKarbonABI.abi);
    const eventFragment = contractInterface.getEvent(
      'RetirementCertificateIssued',
    );
    if (!eventFragment) return [];

    const latestBlock = await this.provider.getBlockNumber();
    const logs: ethers.Log[] = [];
    const logFilter = {
      address: ethers.getAddress(contractAddress),
      topics: [
        eventFragment.topicHash,
        null,
        ethers.zeroPadValue(validAddress, 32),
        null,
      ],
    };

    // Besu limits the block range accepted by eth_getLogs. Querying from
    // block 0 to latest in one request therefore fails once the chain grows.
    for (
      let fromBlock = 0;
      fromBlock <= latestBlock;
      fromBlock += WALLET_HISTORY_BLOCK_CHUNK
    ) {
      const toBlock = Math.min(
        fromBlock + WALLET_HISTORY_BLOCK_CHUNK - 1,
        latestBlock,
      );
      const chunk = await this.provider.getLogs({
        ...logFilter,
        fromBlock,
        toBlock,
      });
      logs.push(...chunk);
    }
    const network = await this.provider.getNetwork();
    const blockTimestamps = new Map<number, string | null>();
    const history: BlockchainRetirementCertificate[] = [];

    for (const log of logs) {
      let event: ethers.LogDescription | null = null;
      try {
        event = contractInterface.parseLog({
          topics: log.topics,
          data: log.data,
        });
      } catch {
        continue;
      }

      if (!event || event.name !== 'RetirementCertificateIssued') continue;

      let retiredAt = blockTimestamps.get(log.blockNumber);
      if (retiredAt === undefined) {
        const block = await this.provider.getBlock(log.blockNumber);
        retiredAt = block
          ? new Date(block.timestamp * 1000).toISOString()
          : null;
        blockTimestamps.set(log.blockNumber, retiredAt);
      }

      const args = event.args;
      history.push({
        certificateId: Number(args[0]),
        retiree: ethers.getAddress(String(args[1])),
        assetId: Number(args[2]),
        amountRetired: Number(args[3]),
        certificateNumber: String(args[4]),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        retiredAt,
        chainId: Number(network.chainId),
        contractAddress: ethers.getAddress(contractAddress),
      });
    }

    return history.sort((left, right) => right.blockNumber - left.blockNumber);
  }

  async submitEmissionReport(
    reporter: string,
    year: number,
    rootHash: string,
  ): Promise<{ txHash: string; reportId: number }> {
    const contract = this.ensureRegistry();
    await this.assertWriteTarget(
      process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS,
      'EmissionReportRegistry',
    );
    let validReporter: string;
    try {
      validReporter = ethers.getAddress(reporter);
    } catch {
      throw new InternalServerErrorException(
        'Emitter wallet address is not a valid EVM address',
      );
    }

    try {
      const tx = await contract.submitReportFor(
        validReporter,
        year,
        rootHash,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');

      // Parse event to get reportId
      const event = receipt.logs.find(
        (log) => log.fragment?.name === 'ReportSubmitted',
      );
      const reportId = event?.args ? Number(event.args[0]) : 0;
      return { txHash: receipt.hash, reportId };
    } catch (error: unknown) {
      this.logger.error('Error submitting emission report:', error);
      const e = error as Record<string, unknown>;
      const errMsg = typeof e?.message === 'string' ? e.message : '';
      const errReason = typeof e?.reason === 'string' ? e.reason : '';
      const errStr =
        errMsg +
        errReason +
        String(error) +
        JSON.stringify(error, Object.getOwnPropertyNames(error || {}));
      if (errStr.includes('Report already approved or pending')) {
        this.logger.warn(
          'Blockchain rejected: Report already submitted for this year.',
        );
        throw new ConflictException(
          'Laporan emisi untuk tahun ini sudah pernah disubmit atau sedang dalam proses.',
        );
      }
      throw new Error(
        'Failed to process report on-chain: ' + errStr.substring(0, 500),
      );
    }
  }

  async auditEmissionReport(
    reportId: number,
    decision: 'approve' | 'request_revision',
    notes: string,
  ): Promise<{ txHash: string }> {
    const contract = this.ensureRegistry();
    await this.assertWriteTarget(
      process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS,
      'EmissionReportRegistry',
    );
    if (!Number.isInteger(reportId) || reportId <= 0) {
      throw new InternalServerErrorException('Invalid blockchain report ID');
    }

    const status = decision === 'approve' ? 2 : 3;

    try {
      const tx = await contract.auditReport(
        reportId,
        status,
        notes,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');
      return { txHash: receipt.hash };
    } catch (error: unknown) {
      this.logger.error('Error auditing emission report:', error);
      const errorRecord = error as Record<string, unknown>;
      const message =
        typeof errorRecord.message === 'string'
          ? errorRecord.message
          : String(error);
      throw new Error(
        `Failed to record emission report audit on-chain: ${message.substring(0, 500)}`,
      );
    }
  }

  async assertEmissionReportAuditable(
    reportId: number,
    reporter: string,
    year: number,
    rootHash: string,
  ): Promise<void> {
    const contract = this.ensureRegistry();
    await this.assertWriteTarget(
      process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS,
      'EmissionReportRegistry',
    );

    const validReporter = this.normalizeAddress(reporter, 'Reporter wallet');
    const chainReport = await contract.reports(reportId);
    const actualReporter = String(chainReport[0]);
    const actualYear = Number(chainReport[1]);
    const actualRoot = String(chainReport[2]);
    const actualStatus = Number(chainReport[3]);
    const matches =
      ethers.isAddress(actualReporter) &&
      ethers.getAddress(actualReporter) === validReporter &&
      actualYear === year &&
      actualRoot.toLowerCase() === rootHash.toLowerCase() &&
      actualStatus === 1;

    if (!matches) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'CHAIN_STATE_MISMATCH',
          message:
            'Emission report blockchain state does not match the submitted database report.',
          details: {
            reportId,
            expected: { reporter: validReporter, year, rootHash, status: 1 },
            actual: {
              reporter: actualReporter,
              year: actualYear,
              rootHash: actualRoot,
              status: actualStatus,
            },
          },
        },
      });
    }
  }

  async anchorPtbaeApplication(
    applicationId: string,
    version: number,
    rootHash: string,
    anchorType: number,
  ): Promise<{
    txHash: string;
    blockNumber: number | null;
    chainId: number | null;
    contractAddress: string;
  }> {
    const contract = this.ensureRegistry();
    const contractAddress = process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS;
    await this.assertWriteTarget(contractAddress, 'EmissionReportRegistry');
    if (!contractAddress) {
      throw new InternalServerErrorException(
        'Emission registry contract address is not configured',
      );
    }
    if (!Number.isInteger(version) || version <= 0) {
      throw new InternalServerErrorException(
        'Invalid PTBAE application version',
      );
    }
    if (!Number.isInteger(anchorType) || anchorType < 0 || anchorType > 3) {
      throw new InternalServerErrorException('Invalid PTBAE anchor type');
    }
    if (!ethers.isHexString(rootHash, 32)) {
      throw new InternalServerErrorException('Invalid PTBAE Merkle root');
    }

    const applicationIdBytes32 = this.applicationIdToBytes32(applicationId);

    try {
      const tx = await contract.anchorPtbaeApplication(
        applicationIdBytes32,
        version,
        rootHash,
        anchorType,
        await this.getWriteOverrides(),
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Transaction receipt was not returned');

      const network = this.provider ? await this.provider.getNetwork() : null;
      return {
        txHash: receipt.hash,
        blockNumber:
          receipt.blockNumber === undefined
            ? null
            : Number(receipt.blockNumber),
        chainId: network ? Number(network.chainId) : null,
        contractAddress,
      };
    } catch (error: unknown) {
      this.logger.error('Error anchoring PTBAE application:', error);
      throw new InternalServerErrorException(
        'Failed to anchor PTBAE application on-chain',
      );
    }
  }

  private applicationIdToBytes32(applicationId: string): string {
    const normalizedId = applicationId.replaceAll('-', '');
    if (!/^[0-9a-f]{32}$/i.test(normalizedId)) {
      throw new InternalServerErrorException(
        'PTBAE application ID must be a valid UUID',
      );
    }
    return `0x${normalizedId.padStart(64, '0')}`;
  }
}
