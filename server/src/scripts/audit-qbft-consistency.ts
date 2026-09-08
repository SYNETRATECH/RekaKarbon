/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  EmissionReportStatus,
  PrismaClient,
  PtbaeBlockchainAnchorStatus,
  PtbaeBlockchainAnchorType,
} from '@prisma/client';
import {
  Contract,
  type ContractTransactionReceipt,
  JsonRpcProvider,
  Wallet,
  ZeroHash,
  getAddress,
  isAddress,
  type InterfaceAbi,
} from 'ethers';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const emissionRegistryArtifact = JSON.parse(
  readFileSync(
    path.resolve(
      process.cwd(),
      'src/blockchain/config/EmissionReportRegistry.json',
    ),
    'utf8',
  ),
) as { abi: InterfaceAbi };

const ANCHOR_TYPE_TO_CHAIN_VALUE: Record<PtbaeBlockchainAnchorType, number> = {
  [PtbaeBlockchainAnchorType.APPLICATION_SUBMISSION]: 0,
  [PtbaeBlockchainAnchorType.AUDIT_DECISION]: 1,
  [PtbaeBlockchainAnchorType.MINISTRY_DECISION]: 2,
  [PtbaeBlockchainAnchorType.REVOCATION]: 3,
};
const EVENT_QUERY_BLOCK_CHUNK = 500;

type Classification =
  | 'MATCHED'
  | 'DB_REFERENCE_STALE'
  | 'CHAIN_ENTRY_MISSING'
  | 'STATUS_MISMATCH'
  | 'CHAIN_CONFLICT'
  | 'INVALID_REFERENCE';

interface AuditItem {
  kind: 'emission_report' | 'ptbae_anchor';
  id: string;
  classification: Classification;
  reason: string;
  databaseReference?: string | null;
  chainReference?: string | null;
}

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Environment ${name} wajib diisi.`);
  return value;
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} harus berupa bilangan bulat positif.`);
  }
  return parsed;
}

function normalizeHex(value: string | null | undefined): string | null {
  return value?.toLowerCase() ?? null;
}

function applicationIdToBytes32(applicationId: string): string {
  const normalizedId = applicationId.replaceAll('-', '');
  if (!/^[0-9a-f]{32}$/iu.test(normalizedId)) {
    throw new Error(`Application ID ${applicationId} bukan UUID yang valid.`);
  }
  return `0x${normalizedId.padStart(64, '0')}`;
}

function expectedReportStatus(status: EmissionReportStatus): number | null {
  if (status === EmissionReportStatus.SUBMITTED) return 1;
  if (status === EmissionReportStatus.APPROVED) return 2;
  if (
    status === EmissionReportStatus.REJECTED ||
    status === EmissionReportStatus.REVISION_REQUIRED
  ) {
    return 3;
  }
  return null;
}

function isApplyMode(): boolean {
  const arguments_ = new Set(process.argv.slice(2));
  const unknown = [...arguments_].filter((value) => value !== '--apply');
  if (unknown.length > 0) {
    throw new Error(`Argumen tidak dikenal: ${unknown.join(', ')}`);
  }
  return arguments_.has('--apply');
}

function requireSuccessfulReceipt(
  receipt: ContractTransactionReceipt | null,
  operation: string,
): ContractTransactionReceipt {
  if (!receipt || receipt.status !== 1) {
    throw new Error(`${operation} tidak menghasilkan receipt sukses.`);
  }
  return receipt;
}

function appendJournal(
  journalPath: string | null,
  entry: Record<string, unknown>,
): void {
  if (!journalPath) return;
  appendFileSync(
    journalPath,
    `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`,
    'utf8',
  );
}

async function getWriteOverrides(
  provider: JsonRpcProvider,
): Promise<{ gasPrice: bigint }> {
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
  if (gasPrice === null) {
    throw new Error(
      'Node QBFT tidak mengembalikan gas price yang dapat digunakan.',
    );
  }
  return { gasPrice };
}

async function findEventTransactionHash(
  registry: Contract,
  provider: JsonRpcProvider,
  filter: unknown,
): Promise<string | null> {
  const latestBlock = await provider.getBlockNumber();
  for (
    let toBlock = latestBlock;
    toBlock >= 0;
    toBlock -= EVENT_QUERY_BLOCK_CHUNK
  ) {
    const fromBlock = Math.max(0, toBlock - EVENT_QUERY_BLOCK_CHUNK + 1);
    const events = await registry.queryFilter(
      filter as Parameters<Contract['queryFilter']>[0],
      fromBlock,
      toBlock,
    );
    if (events.length > 0) return events.at(-1)?.transactionHash ?? null;
  }
  return null;
}

async function main(): Promise<void> {
  const applyMode = isApplyMode();
  const connectionString = requireEnvironment('DATABASE_URL');
  const rpcUrl = requireEnvironment('BESU_RPC_URL');
  const configuredChainId = parsePositiveInteger(
    requireEnvironment('BESU_CHAIN_ID'),
    'BESU_CHAIN_ID',
  );
  const registryAddress = getAddress(
    requireEnvironment('EMISSION_REGISTRY_CONTRACT_ADDRESS'),
  );
  const privateKey = requireEnvironment('PRIVATE_KEY');

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  const registry = new Contract(
    registryAddress,
    emissionRegistryArtifact.abi,
    signer,
  );
  const journalDirectory = path.resolve(
    process.cwd(),
    '..',
    'backups',
    'qbft-reconciliation',
  );
  const journalPath = applyMode
    ? path.join(
        journalDirectory,
        `apply-journal-${new Date().toISOString().replaceAll(/[:.]/gu, '-')}.jsonl`,
      )
    : null;
  if (journalPath) mkdirSync(journalDirectory, { recursive: true });

  try {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== configuredChainId) {
      throw new Error(
        `Chain ID tidak sesuai: ${network.chainId.toString()} != ${configuredChainId}.`,
      );
    }
    if ((await provider.getCode(registryAddress)) === '0x') {
      throw new Error(
        `Bytecode registry tidak ditemukan di ${registryAddress}.`,
      );
    }

    const [reporterRole, auditorRole] = await Promise.all([
      registry.REPORTER_ROLE(),
      registry.AUDITOR_ROLE(),
    ]);
    const [hasReporterRole, hasAuditorRole] = await Promise.all([
      registry.hasRole(reporterRole, signer.address),
      registry.hasRole(auditorRole, signer.address),
    ]);
    if (!hasReporterRole || !hasAuditorRole) {
      throw new Error(
        `Signer tidak memiliki role wajib (reporter=${hasReporterRole}, auditor=${hasAuditorRole}).`,
      );
    }

    const results: AuditItem[] = [];
    const reports = await prisma.emissionReport.findMany({
      include: { company: { include: { user: true } } },
      orderBy: [{ year: 'asc' }, { companyId: 'asc' }],
    });

    for (const report of reports) {
      const walletAddress = report.company.user?.walletAddress;
      if (!walletAddress || !isAddress(walletAddress)) {
        results.push({
          kind: 'emission_report',
          id: report.id,
          classification: 'INVALID_REFERENCE',
          reason: 'Wallet perusahaan kosong atau bukan alamat EVM valid.',
          databaseReference: report.blockchainReportId?.toString() ?? null,
        });
        continue;
      }

      const wallet = getAddress(walletAddress);
      let latestReportId = BigInt(
        await registry.latestReportIdByYear(wallet, report.year),
      );
      if (latestReportId === 0n) {
        const targetStatus = expectedReportStatus(report.status);
        if (applyMode && targetStatus !== null) {
          const submitTransaction = await registry.submitReportFor(
            wallet,
            report.year,
            report.merkleRoot,
            await getWriteOverrides(provider),
          );
          const submitReceipt = requireSuccessfulReceipt(
            await submitTransaction.wait(),
            `Submit report ${report.id}`,
          );
          const parsedEvent = submitReceipt.logs
            .map((log) => {
              try {
                return registry.interface.parseLog(log);
              } catch {
                return null;
              }
            })
            .find((event) => event?.name === 'ReportSubmitted');
          const submittedReportId = parsedEvent?.args?.[0];
          if (typeof submittedReportId !== 'bigint') {
            throw new Error(
              `Event ReportSubmitted untuk ${report.id} tidak ditemukan.`,
            );
          }
          latestReportId = submittedReportId;
          await prisma.emissionReport.update({
            where: { id: report.id },
            data: {
              blockchainReportId: submittedReportId,
              blockchainTxHash: submitReceipt.hash,
            },
          });
          appendJournal(journalPath, {
            kind: 'emission_report_submit',
            id: report.id,
            oldReportId: report.blockchainReportId?.toString() ?? null,
            newReportId: submittedReportId.toString(),
            transactionHash: submitReceipt.hash,
            blockNumber: submitReceipt.blockNumber,
          });
        } else {
          results.push({
            kind: 'emission_report',
            id: report.id,
            classification: 'CHAIN_ENTRY_MISSING',
            reason: `Tidak ada report QBFT untuk ${wallet}/${report.year}.`,
            databaseReference: report.blockchainReportId?.toString() ?? null,
            chainReference: null,
          });
          continue;
        }
      }

      let chainReport = await registry.reports(latestReportId);
      let chainReporter = getAddress(String(chainReport[0]));
      let chainYear = Number(chainReport[1]);
      let chainRoot = String(chainReport[2]);
      let chainStatus = Number(chainReport[3]);
      const identityMatches =
        chainReporter === wallet &&
        chainYear === report.year &&
        normalizeHex(chainRoot) === normalizeHex(report.merkleRoot);

      if (!identityMatches) {
        results.push({
          kind: 'emission_report',
          id: report.id,
          classification: 'CHAIN_CONFLICT',
          reason: `Latest report QBFT ${latestReportId} memiliki wallet/tahun/root berbeda.`,
          databaseReference: report.blockchainReportId?.toString() ?? null,
          chainReference: latestReportId.toString(),
        });
        continue;
      }

      const expectedStatus = expectedReportStatus(report.status);
      if (expectedStatus !== null && chainStatus !== expectedStatus) {
        if (
          applyMode &&
          chainStatus === 1 &&
          (expectedStatus === 2 || expectedStatus === 3)
        ) {
          const auditTransaction = await registry.auditReport(
            latestReportId,
            expectedStatus,
            report.auditorNotes ?? '',
            await getWriteOverrides(provider),
          );
          const auditReceipt = requireSuccessfulReceipt(
            await auditTransaction.wait(),
            `Audit report ${report.id}`,
          );
          await prisma.$transaction(async (transaction) => {
            await transaction.emissionReport.update({
              where: { id: report.id },
              data: {
                auditBlockchainTxHash: auditReceipt.hash,
                auditAnchorStatus: PtbaeBlockchainAnchorStatus.CONFIRMED,
              },
            });
            await transaction.emissionReportAuditEvent.updateMany({
              where: {
                emissionReportId: report.id,
                toStatus: report.status,
              },
              data: { blockchainTxHash: auditReceipt.hash },
            });
          });
          appendJournal(journalPath, {
            kind: 'emission_report_audit',
            id: report.id,
            reportId: latestReportId.toString(),
            transactionHash: auditReceipt.hash,
            blockNumber: auditReceipt.blockNumber,
            status: expectedStatus,
          });
          chainReport = await registry.reports(latestReportId);
          chainReporter = getAddress(String(chainReport[0]));
          chainYear = Number(chainReport[1]);
          chainRoot = String(chainReport[2]);
          chainStatus = Number(chainReport[3]);
        } else {
          results.push({
            kind: 'emission_report',
            id: report.id,
            classification: 'STATUS_MISMATCH',
            reason: `Status database ${report.status} tidak sama dengan status QBFT ${chainStatus}.`,
            databaseReference: report.blockchainReportId?.toString() ?? null,
            chainReference: latestReportId.toString(),
          });
          continue;
        }
      }

      let submitHash = report.blockchainTxHash;
      let transactionReceipt = submitHash
        ? await provider.getTransactionReceipt(submitHash)
        : null;
      if (
        applyMode &&
        (report.blockchainReportId !== latestReportId ||
          transactionReceipt?.status !== 1 ||
          transactionReceipt.to?.toLowerCase() !==
            registryAddress.toLowerCase())
      ) {
        submitHash = await findEventTransactionHash(
          registry,
          provider,
          registry.filters.ReportSubmitted(latestReportId),
        );
        if (!submitHash) {
          throw new Error(
            `Receipt ReportSubmitted ${latestReportId} tidak ditemukan.`,
          );
        }
        transactionReceipt = await provider.getTransactionReceipt(submitHash);
        await prisma.emissionReport.update({
          where: { id: report.id },
          data: {
            blockchainReportId: latestReportId,
            blockchainTxHash: submitHash,
          },
        });
        appendJournal(journalPath, {
          kind: 'emission_report_reference',
          id: report.id,
          reportId: latestReportId.toString(),
          transactionHash: submitHash,
        });
      }
      const referenceMatches =
        (applyMode || report.blockchainReportId === latestReportId) &&
        transactionReceipt?.status === 1 &&
        transactionReceipt.to?.toLowerCase() === registryAddress.toLowerCase();

      results.push({
        kind: 'emission_report',
        id: report.id,
        classification: referenceMatches ? 'MATCHED' : 'DB_REFERENCE_STALE',
        reason: referenceMatches
          ? 'Identitas, status, report ID, dan receipt cocok.'
          : 'State QBFT cocok, tetapi report ID atau transaction receipt database usang.',
        databaseReference: report.blockchainReportId?.toString() ?? null,
        chainReference: latestReportId.toString(),
      });
    }

    const anchors = await prisma.ptbaeBlockchainAnchor.findMany({
      include: { applicationVersion: true },
      orderBy: [{ applicationId: 'asc' }, { createdAt: 'asc' }],
    });

    for (const anchor of anchors) {
      const applicationId = applicationIdToBytes32(anchor.applicationId);
      const version = anchor.applicationVersion.version;
      const chainAnchor = await registry.ptbaeAnchors(applicationId, version);
      const anchoredAt = BigInt(chainAnchor[4]);
      let appliedReceipt: ContractTransactionReceipt | null = null;

      if (
        anchoredAt === 0n ||
        normalizeHex(String(chainAnchor[0])) === normalizeHex(ZeroHash)
      ) {
        if (applyMode) {
          const anchorTransaction = await registry.anchorPtbaeApplication(
            applicationId,
            version,
            anchor.merkleRoot,
            ANCHOR_TYPE_TO_CHAIN_VALUE[anchor.anchorType],
            await getWriteOverrides(provider),
          );
          const anchorReceipt = requireSuccessfulReceipt(
            await anchorTransaction.wait(),
            `Anchor PTBAE ${anchor.id}`,
          );
          appliedReceipt = anchorReceipt;
          await prisma.ptbaeBlockchainAnchor.update({
            where: { id: anchor.id },
            data: {
              status: PtbaeBlockchainAnchorStatus.CONFIRMED,
              transactionHash: anchorReceipt.hash,
              blockNumber: BigInt(anchorReceipt.blockNumber),
              contractAddress: registryAddress,
              chainId: configuredChainId,
              lastError: null,
              nextRetryAt: null,
              submittedAt: new Date(),
              confirmedAt: new Date(),
            },
          });
          appendJournal(journalPath, {
            kind: 'ptbae_anchor',
            id: anchor.id,
            applicationId: anchor.applicationId,
            version,
            transactionHash: anchorReceipt.hash,
            blockNumber: anchorReceipt.blockNumber,
          });
        } else {
          results.push({
            kind: 'ptbae_anchor',
            id: anchor.id,
            classification: 'CHAIN_ENTRY_MISSING',
            reason: `Anchor QBFT tidak ditemukan untuk application/version ${anchor.applicationId}/${version}.`,
            databaseReference: anchor.transactionHash,
            chainReference: null,
          });
          continue;
        }
      }

      const refreshedChainAnchor = await registry.ptbaeAnchors(
        applicationId,
        version,
      );
      const identityMatches =
        normalizeHex(String(refreshedChainAnchor[0])) ===
          normalizeHex(applicationId) &&
        Number(refreshedChainAnchor[1]) === version &&
        normalizeHex(String(refreshedChainAnchor[2])) ===
          normalizeHex(anchor.merkleRoot) &&
        Number(refreshedChainAnchor[3]) ===
          ANCHOR_TYPE_TO_CHAIN_VALUE[anchor.anchorType];

      if (!identityMatches) {
        results.push({
          kind: 'ptbae_anchor',
          id: anchor.id,
          classification: 'CHAIN_CONFLICT',
          reason: `Anchor QBFT application/version memiliki root atau tipe berbeda.`,
          databaseReference: anchor.transactionHash,
          chainReference: `${anchor.applicationId}/${version}`,
        });
        continue;
      }

      let anchorTransactionHash =
        appliedReceipt?.hash ?? anchor.transactionHash;
      let transactionReceipt =
        appliedReceipt ??
        (anchorTransactionHash
          ? await provider.getTransactionReceipt(anchorTransactionHash)
          : null);
      if (
        applyMode &&
        (transactionReceipt?.status !== 1 ||
          transactionReceipt.to?.toLowerCase() !==
            registryAddress.toLowerCase())
      ) {
        anchorTransactionHash = await findEventTransactionHash(
          registry,
          provider,
          registry.filters.PtbaeApplicationAnchored(applicationId, version),
        );
        if (!anchorTransactionHash) {
          throw new Error(
            `Receipt anchor ${anchor.applicationId}/${version} tidak ditemukan.`,
          );
        }
        transactionReceipt = await provider.getTransactionReceipt(
          anchorTransactionHash,
        );
        await prisma.ptbaeBlockchainAnchor.update({
          where: { id: anchor.id },
          data: {
            status: PtbaeBlockchainAnchorStatus.CONFIRMED,
            transactionHash: anchorTransactionHash,
            blockNumber: transactionReceipt
              ? BigInt(transactionReceipt.blockNumber)
              : null,
            contractAddress: registryAddress,
            chainId: configuredChainId,
            lastError: null,
            nextRetryAt: null,
            confirmedAt: new Date(),
          },
        });
        appendJournal(journalPath, {
          kind: 'ptbae_anchor_reference',
          id: anchor.id,
          transactionHash: anchorTransactionHash,
        });
      }
      const metadataMatches =
        (applyMode ||
          anchor.status === PtbaeBlockchainAnchorStatus.CONFIRMED) &&
        (applyMode || anchor.chainId === configuredChainId) &&
        (applyMode ||
          normalizeHex(anchor.contractAddress) ===
            normalizeHex(registryAddress)) &&
        transactionReceipt?.status === 1 &&
        transactionReceipt.to?.toLowerCase() === registryAddress.toLowerCase();

      results.push({
        kind: 'ptbae_anchor',
        id: anchor.id,
        classification: metadataMatches ? 'MATCHED' : 'DB_REFERENCE_STALE',
        reason: metadataMatches
          ? 'Application, version, root, type, metadata, dan receipt cocok.'
          : 'State anchor QBFT cocok, tetapi metadata atau receipt database usang.',
        databaseReference: anchor.transactionHash,
        chainReference: `${anchor.applicationId}/${version}`,
      });
    }

    const summary = results.reduce<Record<string, number>>((counts, item) => {
      const key = `${item.kind}:${item.classification}`;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});

    console.log(
      JSON.stringify(
        {
          mode: applyMode ? 'apply' : 'dry-run',
          chainId: configuredChainId,
          registryAddress,
          signer: signer.address,
          journalPath,
          summary,
          items: results,
        },
        null,
        2,
      ),
    );

    if (results.some((item) => item.classification === 'CHAIN_CONFLICT')) {
      process.exitCode = 2;
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
    provider.destroy();
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error(message);
  process.exitCode = 1;
});
