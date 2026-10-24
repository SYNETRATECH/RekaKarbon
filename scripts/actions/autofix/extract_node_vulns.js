import fs from 'node:fs';

function main() {
  const jsonPath = process.argv[2] || 'pnpm-audit-findings.json';
  if (!fs.existsSync(jsonPath)) {
    console.log('');
    return;
  }

  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);

    // Support pnpm 11 advisory schema (data.advisories)
    if (data.advisories && typeof data.advisories === 'object') {
      const advisories = Object.values(data.advisories);
      const names = advisories.map((a) => a.module_name || a.name).filter(Boolean);
      const uniqueNames = [...new Set(names)];
      console.log(uniqueNames.join(' '));
      return;
    }

    // Support standard npm schema (data.vulnerabilities)
    if (data.vulnerabilities && typeof data.vulnerabilities === 'object') {
      const names = Object.keys(data.vulnerabilities);
      const uniqueNames = [...new Set(names)];
      console.log(uniqueNames.join(' '));
      return;
    }

    console.log('');
  } catch {
    console.log('');
  }
}

main();
