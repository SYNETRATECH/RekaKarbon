import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const LEGACY_CHAIN_ID = 1337;
const PACKAGE_DIRECTORY = process.cwd();
const DEFAULT_OUTPUT_DIRECTORY = path.join(PACKAGE_DIRECTORY, 'networks', 'legacy-chain-1337');

interface JsonRecord {
  [key: string]: unknown;
}

interface ArchivedFile {
  path: string;
  sha256: string;
  bytes: number;
}

interface LegacyDeploymentInfo {
  rekaKarbonAddress?: string;
  emissionReportRegistryAddress?: string;
  marketOperator?: string;
  network?: string;
  deployer?: string;
  timestamp?: string;
}

interface LegacyArchiveManifest {
  schemaVersion: 1;
  archiveId: 'legacy-chain-1337';
  chainId: 1337;
  archiveMode: 'read-only-reference';
  capturedAt: string;
  sourceFiles: ArchivedFile[];
  deploymentInfo: LegacyDeploymentInfo | null;
  verification: {
    genesisConfigChainId: number;
    genesisFileSha256: string;
    finalBlockNumber: number | null;
    finalBlockHash: string | null;
    genesisHash: string | null;
  };
  notes: string[];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
}

function readOptionalDeploymentInfo(filePath: string): LegacyDeploymentInfo | null {
  if (!fs.existsSync(filePath)) return null;

  const value = readJson(filePath);
  if (!isRecord(value)) throw new Error(`Deployment info legacy tidak valid: ${filePath}`);

  const result: LegacyDeploymentInfo = {};
  const stringFields: Array<keyof LegacyDeploymentInfo> = [
    'rekaKarbonAddress',
    'emissionReportRegistryAddress',
    'marketOperator',
    'network',
    'deployer',
    'timestamp',
  ];

  for (const field of stringFields) {
    const fieldValue = value[field];
    if (typeof fieldValue === 'string') result[field] = fieldValue;
  }

  return result;
}

function sha256File(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function archiveFile(filePath: string, packageDirectory: string): ArchivedFile {
  const fileStat = fs.statSync(filePath);
  return {
    path: path.relative(packageDirectory, filePath).replaceAll(path.sep, '/'),
    sha256: sha256File(filePath),
    bytes: fileStat.size,
  };
}

function getOutputDirectory(): string {
  const outputArgumentIndex = process.argv.indexOf('--output');
  if (outputArgumentIndex === -1) return DEFAULT_OUTPUT_DIRECTORY;

  const outputArgument = process.argv[outputArgumentIndex + 1];
  if (!outputArgument) throw new Error('--output harus diikuti path direktori.');
  return path.resolve(PACKAGE_DIRECTORY, outputArgument);
}

function readLegacyGenesis(genesisPath: string): {
  chainId: number;
  file: ArchivedFile;
} {
  const value = readJson(genesisPath);
  if (!isRecord(value) || !isRecord(value.config)) {
    throw new Error(`Genesis legacy tidak memiliki struktur config: ${genesisPath}`);
  }

  const chainId = value.config.chainId;
  if (typeof chainId !== 'number')
    throw new Error('Genesis legacy tidak memiliki chainId numerik.');
  if (chainId !== LEGACY_CHAIN_ID) {
    throw new Error(
      `Genesis yang diarsipkan harus chain ${LEGACY_CHAIN_ID}, ditemukan ${chainId}.`
    );
  }

  return { chainId, file: archiveFile(genesisPath, PACKAGE_DIRECTORY) };
}

function main(): void {
  const genesisPath = path.join(PACKAGE_DIRECTORY, 'besu-config', 'genesis.json');
  const composePath = path.join(PACKAGE_DIRECTORY, 'docker-compose.yml');
  const deploymentInfoPath = path.join(PACKAGE_DIRECTORY, 'deployment-info.json');

  if (!fs.existsSync(genesisPath))
    throw new Error(`Genesis legacy tidak ditemukan: ${genesisPath}`);
  if (!fs.existsSync(composePath))
    throw new Error(`Compose legacy tidak ditemukan: ${composePath}`);

  const genesis = readLegacyGenesis(genesisPath);
  const sourceFiles = [genesis.file, archiveFile(composePath, PACKAGE_DIRECTORY)];
  if (fs.existsSync(deploymentInfoPath)) {
    sourceFiles.push(archiveFile(deploymentInfoPath, PACKAGE_DIRECTORY));
  }

  const outputDirectory = getOutputDirectory();
  fs.mkdirSync(outputDirectory, { recursive: true });

  const manifest: LegacyArchiveManifest = {
    schemaVersion: 1,
    archiveId: 'legacy-chain-1337',
    chainId: LEGACY_CHAIN_ID,
    archiveMode: 'read-only-reference',
    capturedAt: new Date().toISOString(),
    sourceFiles,
    deploymentInfo: readOptionalDeploymentInfo(deploymentInfoPath),
    verification: {
      genesisConfigChainId: genesis.chainId,
      genesisFileSha256: genesis.file.sha256,
      finalBlockNumber: null,
      finalBlockHash: null,
      genesisHash: null,
    },
    notes: [
      'Manifest ini tidak menyalin private key atau data directory Besu.',
      'Final block, final block hash, dan genesis hash harus diisi dari node legacy saat masih tersedia.',
      'Sumber legacy tidak boleh dipakai untuk menjalankan atau men-deploy jaringan QBFT aktif.',
      'Chain aktif RekaKarbon menggunakan chain ID 1338 dan resource Docker yang berbeda.',
    ],
  };

  const manifestPath = path.join(outputDirectory, 'legacy-chain-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log('✅ Manifest chain legacy berhasil dibuat.');
  console.log(`   Chain ID: ${LEGACY_CHAIN_ID}`);
  console.log(`   Manifest: ${manifestPath}`);
  console.log('   Tidak ada data directory atau private key yang dihapus maupun disalin.');
}

try {
  main();
} catch (error: unknown) {
  console.error('❌ Arsip chain legacy gagal:', error);
  process.exitCode = 1;
}
