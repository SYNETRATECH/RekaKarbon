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
  BlockchainHealth,
  BlockchainRetirementCertificate,
  CarbonTokenContract,
  EmissionRegistryContract,
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

  private getConfiguredChainId(): number | undefined {
    const configuredValue =
      process.env.BESU_CHAIN_ID || process.env.CHAIN_ID || '1337';
    const configuredChainId = Number(configuredValue);
    return Number.isInteger(configuredChainId) && configuredChainId > 0
      ? configuredChainId
      : undefined;
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
      const tx = await contract.issueQuota(validAddress, amount, {
        gasPrice: 0,
      });
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
        throw new Error(
          'Laporan emisi untuk tahun ini sudah pernah disubmit atau sedang dalam proses.',
        );
      }
      throw new Error(
        'Failed to process report on-chain: ' + errStr.substring(0, 500),
      );
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
        { gasPrice: 0 },
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
