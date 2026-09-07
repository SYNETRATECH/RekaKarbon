import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_NAME = 'rekakarbon-qbft';
const COMPOSE_FILE = 'docker-compose.qbft.yml';
const GENERATED_DIRECTORY = path.resolve(__dirname, '../../networks/local-qbft/generated');
const GENERATED_ENV_FILE = path.join(GENERATED_DIRECTORY, '.env');

function hasConfirmation(): boolean {
  return process.argv.includes('--confirm-reset');
}

function runCompose(): void {
  const composeArguments = [
    'compose',
    '-p',
    PROJECT_NAME,
    '--env-file',
    GENERATED_ENV_FILE,
    '-f',
    COMPOSE_FILE,
    'down',
    '--volumes',
  ];

  const result = spawnSync('docker', composeArguments, {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!hasConfirmation()) {
  console.error(
    'Reset QBFT hanya untuk development dan akan menghapus volume bernama rekakarbon_qbft_*. ' +
      'Jalankan ulang dengan --confirm-reset jika target tersebut benar.'
  );
  process.exit(1);
}

if (!fs.existsSync(GENERATED_ENV_FILE)) {
  console.error('File generated/.env belum ada. Jalankan network:generate terlebih dahulu.');
  process.exit(1);
}

runCompose();
console.log('Volume lokal QBFT sudah dihapus. Chain legacy tidak disentuh.');
