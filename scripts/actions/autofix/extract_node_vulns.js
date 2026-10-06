const fs = require('fs');
const path = require('path');

function main() {
  const jsonPath = process.argv[2] || 'pnpm-audit-findings.json';
  if (!fs.existsSync(jsonPath)) {
    console.log('');
    return;
  }

  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);
    const vulns = data.vulnerabilities || {};
    const names = Object.keys(vulns);
    console.log(names.join(' '));
  } catch (err) {
    console.log('');
  }
}

main();
