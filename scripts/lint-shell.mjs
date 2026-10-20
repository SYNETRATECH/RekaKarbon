import { globSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const files = globSync('scripts/**/*.sh');
if (files.length === 0) {
  console.log('No shell scripts found to lint.');
  process.exit(0);
}

// Check if shellcheck is available in PATH
const checkTool = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['shellcheck'], {
  stdio: 'pipe',
  shell: true,
});

if (checkTool.status !== 0) {
  console.error('\n❌ ShellCheck is not installed or not found in PATH.');
  console.error(
    'Follow the official ShellCheck installation instructions (https://github.com/koalaman/shellcheck):'
  );
  console.error('  • Windows: winget install koalaman.shellcheck   (or scoop install shellcheck)');
  console.error('  • macOS:   brew install shellcheck');
  console.error('  • Linux:   sudo apt-get install shellcheck\n');
  process.exit(1);
}

console.log(`Running ShellCheck on ${files.length} scripts...`);
const result = spawnSync('shellcheck', files, {
  stdio: 'inherit',
  shell: true,
});

if (result.status === 0) {
  console.log('✅ ShellCheck passed on all shell scripts!');
}

process.exit(result.status ?? 1);
