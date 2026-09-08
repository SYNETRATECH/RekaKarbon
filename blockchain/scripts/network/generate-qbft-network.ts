import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { HDNodeWallet, Wallet } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const CHAIN_ID = 1338;
const VALIDATOR_COUNT = 4;
const DEFAULT_BESU_IMAGE = 'hyperledger/besu:26.8.1';
const DEFAULT_BESU_GENERATOR_IMAGE = 'hyperledger/besu:23.4.4';
const DEFAULT_PREFUND_BALANCE = '1000000000000000000000000';

type JsonRecord = Record<string, unknown>;

interface QbftGenesisConfig {
  chainId: number;
  berlinBlock: number;
  londonBlock: number;
  qbft: {
    blockperiodseconds: number;
    epochlength: number;
    requesttimeoutseconds: number;
  };
}

interface QbftConfigTemplate {
  genesis: {
    config: QbftGenesisConfig;
    nonce: string;
    timestamp: string;
    gasLimit: string;
    difficulty: string;
    mixHash: string;
    coinbase: string;
    alloc: JsonRecord;
  };
  blockchain: {
    nodes: {
      generate: boolean;
      count: number;
    };
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQbftConfigTemplate(value: unknown): value is QbftConfigTemplate {
  if (!isRecord(value)) return false;
  const genesis = value.genesis;
  const blockchain = value.blockchain;
  if (!isRecord(genesis) || !isRecord(blockchain)) return false;

  const config = genesis.config;
  const nodes = isRecord(blockchain.nodes) ? blockchain.nodes : null;
  const qbft = isRecord(config) && config.qbft;

  return (
    isRecord(config) &&
    typeof config.chainId === 'number' &&
    typeof config.berlinBlock === 'number' &&
    typeof config.londonBlock === 'number' &&
    isRecord(qbft) &&
    typeof qbft.blockperiodseconds === 'number' &&
    typeof qbft.epochlength === 'number' &&
    typeof qbft.requesttimeoutseconds === 'number' &&
    typeof genesis.nonce === 'string' &&
    typeof genesis.timestamp === 'string' &&
    typeof genesis.gasLimit === 'string' &&
    typeof genesis.difficulty === 'string' &&
    typeof genesis.mixHash === 'string' &&
    typeof genesis.coinbase === 'string' &&
    isRecord(genesis.alloc) &&
    nodes !== null &&
    nodes.generate === true &&
    nodes.count === VALIDATOR_COUNT
  );
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function requirePrivateKey(): Wallet {
  const privateKey = process.env.PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error('PRIVATE_KEY wajib diisi untuk akun prefund deployer lokal.');
  }

  try {
    return new Wallet(privateKey);
  } catch (error: unknown) {
    throw new Error('PRIVATE_KEY bukan private key EVM yang valid.', { cause: error });
  }
}

function createPrefundBalance(): string {
  const configuredBalance = process.env.QBFT_PREFUND_BALANCE?.trim() || DEFAULT_PREFUND_BALANCE;
  try {
    const balance = BigInt(configuredBalance);
    if (balance <= 0n) throw new Error('balance must be positive');
    return `0x${balance.toString(16)}`;
  } catch (error: unknown) {
    throw new Error('QBFT_PREFUND_BALANCE harus berupa bilangan bulat positif dalam wei.', {
      cause: error,
    });
  }
}

function assertGeneratedDirectoryAvailable(generatedDirectory: string, force: boolean): void {
  if (!fs.existsSync(generatedDirectory)) return;

  const generatedEntries = fs.readdirSync(generatedDirectory);
  if (generatedEntries.length === 0) return;
  if (!force) {
    throw new Error(
      `Direktori ${generatedDirectory} sudah berisi hasil generate. ` +
        'Gunakan --force hanya untuk membuat ulang jaringan lokal disposable; volume Docker tidak disentuh.'
    );
  }
}

function runBesuGenerator(
  generatedDirectory: string,
  generatorImage: string,
  outputDirectoryName: string
): void {
  const outputDirectory = path.join(generatedDirectory, outputDirectoryName);
  fs.rmSync(outputDirectory, { recursive: true, force: true });

  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-v',
      `${generatedDirectory}:/network`,
      '-w',
      '/network',
      generatorImage,
      'operator',
      'generate-blockchain-config',
      '--config-file=/network/qbftConfigFile.json',
      `--to=/network/${outputDirectoryName}`,
      '--private-key-file-name=key',
    ],
    { stdio: 'inherit', windowsHide: true }
  );

  if (result.error)
    throw new Error('Docker tidak dapat menjalankan generator Besu.', { cause: result.error });
  if (result.status !== 0) {
    throw new Error(
      `Generator konfigurasi Besu gagal dengan exit code ${result.status ?? 'unknown'}.`
    );
  }
}

function createGeneratorStagingDirectory(generatedDirectory: string): string {
  return fs.mkdtempSync(path.join(path.dirname(generatedDirectory), '.qbft-generator-'));
}

function copyValidatorKeys(generatedDirectory: string): string[] {
  const keysDirectory = path.join(generatedDirectory, 'networkFiles', 'keys');
  const validatorDirectories = fs
    .readdirSync(keysDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (validatorDirectories.length !== VALIDATOR_COUNT) {
    throw new Error(
      `Generator Besu menghasilkan ${validatorDirectories.length} validator; diharapkan ${VALIDATOR_COUNT}.`
    );
  }

  const nodesDirectory = path.join(generatedDirectory, 'nodes');
  fs.mkdirSync(nodesDirectory, { recursive: true });

  validatorDirectories.forEach((validatorDirectory, index) => {
    const sourceDirectory = path.join(keysDirectory, validatorDirectory);
    const targetDirectory = path.join(nodesDirectory, `validator-${index + 1}`);
    fs.mkdirSync(targetDirectory, { recursive: true });

    for (const fileName of ['key', 'key.pub']) {
      const sourcePath = path.join(sourceDirectory, fileName);
      if (!fs.existsSync(sourcePath)) throw new Error(`File ${sourcePath} tidak ditemukan.`);
      fs.copyFileSync(sourcePath, path.join(targetDirectory, fileName));
    }
  });

  return validatorDirectories;
}

function createNodeKey(targetPath: string): HDNodeWallet {
  const wallet = Wallet.createRandom();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${wallet.privateKey.slice(2)}\n`, 'utf8');
  return wallet;
}

function main(): void {
  const force = process.argv.includes('--force');
  const packageDirectory = process.cwd();
  const templatePath = path.join(
    packageDirectory,
    'networks',
    'local-qbft',
    'qbftConfigFile.template.json'
  );
  const generatedDirectory = path.join(packageDirectory, 'networks', 'local-qbft', 'generated');
  const besuImage = process.env.QBFT_BESU_IMAGE?.trim() || DEFAULT_BESU_IMAGE;
  const generatorImage = process.env.QBFT_GENERATOR_IMAGE?.trim() || DEFAULT_BESU_GENERATOR_IMAGE;
  const deployer = requirePrivateKey();
  const prefundBalance = createPrefundBalance();

  if (!fs.existsSync(templatePath))
    throw new Error(`Template QBFT tidak ditemukan: ${templatePath}`);
  const template = readJson(templatePath);
  if (!isQbftConfigTemplate(template))
    throw new Error('Template QBFT tidak sesuai schema yang diharapkan.');
  if (template.genesis.config.chainId !== CHAIN_ID) {
    throw new Error(`Template chain ID harus ${CHAIN_ID}.`);
  }

  assertGeneratedDirectoryAvailable(generatedDirectory, force);

  const config: QbftConfigTemplate = {
    ...template,
    genesis: {
      ...template.genesis,
      alloc: {
        [deployer.address.toLowerCase()]: { balance: prefundBalance },
      },
    },
  };
  const stagingDirectory = createGeneratorStagingDirectory(generatedDirectory);
  const replacementDirectory = createGeneratorStagingDirectory(generatedDirectory);

  try {
    const stagingConfigPath = path.join(stagingDirectory, 'qbftConfigFile.json');
    writeJson(stagingConfigPath, config);
    const stagingOutputDirectoryName = 'generated-network-files';
    runBesuGenerator(stagingDirectory, generatorImage, stagingOutputDirectoryName);

    const stagingNetworkFilesDirectory = path.join(stagingDirectory, stagingOutputDirectoryName);
    const stagingGenesisPath = path.join(stagingNetworkFilesDirectory, 'genesis.json');
    if (!fs.existsSync(stagingGenesisPath))
      throw new Error('Besu tidak menghasilkan genesis.json.');

    writeJson(path.join(replacementDirectory, 'qbftConfigFile.json'), config);
    fs.cpSync(stagingNetworkFilesDirectory, path.join(replacementDirectory, 'networkFiles'), {
      recursive: true,
    });
    fs.copyFileSync(stagingGenesisPath, path.join(replacementDirectory, 'genesis.json'));
    const validatorDirectories = copyValidatorKeys(replacementDirectory);

    const bootnode = createNodeKey(path.join(replacementDirectory, 'nodes', 'bootnode-1', 'key'));
    const rpcNode = createNodeKey(path.join(replacementDirectory, 'nodes', 'rpc-1', 'key'));
    const bootnodePublicKey = bootnode.signingKey.publicKey.slice(4);

    writeJson(path.join(replacementDirectory, 'network-info.json'), {
      chainId: CHAIN_ID,
      besuImage,
      generatorImage,
      validatorCount: VALIDATOR_COUNT,
      validatorKeyDirectories: validatorDirectories,
      deployerAddress: deployer.address,
      bootnodeAddress: bootnode.address,
      rpcNodeAddress: rpcNode.address,
      generatedAt: new Date().toISOString(),
    });
    fs.writeFileSync(
      path.join(replacementDirectory, '.env'),
      [
        `QBFT_BESU_IMAGE=${besuImage}`,
        `QBFT_GENERATOR_IMAGE=${generatorImage}`,
        'QBFT_RPC_URL=http://127.0.0.1:8545',
        `QBFT_CHAIN_ID=${CHAIN_ID}`,
        `BOOTNODE_ENODE=enode://${bootnodePublicKey}@172.30.0.10:30303`,
        'QBFT_RPC_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173',
        '',
      ].join('\n'),
      'utf8'
    );

    if (fs.existsSync(generatedDirectory)) {
      const existingEntries = fs.readdirSync(generatedDirectory);
      if (existingEntries.length > 0 && !force) {
        throw new Error(`Direktori ${generatedDirectory} muncul saat proses generate.`);
      }
      fs.rmSync(generatedDirectory, { recursive: true, force: true });
    }
    fs.renameSync(replacementDirectory, generatedDirectory);
  } finally {
    fs.rmSync(stagingDirectory, { recursive: true, force: true });
    fs.rmSync(replacementDirectory, { recursive: true, force: true });
  }

  console.log('✅ QBFT local network berhasil digenerate.');
  console.log(`   Chain ID: ${CHAIN_ID}`);
  console.log(`   Besu image: ${besuImage}`);
  console.log(`   Generator image: ${generatorImage}`);
  console.log(`   Deployer prefunded: ${deployer.address}`);
  console.log('   Private keys tersimpan hanya di generated/ dan tidak boleh di-commit.');
  console.log('   Jalankan: pnpm network:up lalu pnpm network:check');
}

try {
  main();
} catch (error: unknown) {
  console.error('❌ Gagal generate jaringan QBFT:', error);
  process.exitCode = 1;
}
