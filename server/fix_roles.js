const fs = require('fs');
const path = require('path');

const directory = 'c:/Peyimpanan Pribadi/PROJEK BESAR/RekaKarbon/server/src';

const replacements = {
  'Role.SUPER_ADMIN': 'Role.superadmin',
  'Role.REGULATOR_KLHK': 'Role.regulator',
  'Role.AUDITOR_VERIFIER': 'Role.auditor',
  'Role.CORPORATE_EMITTER': 'Role.emitter',
  'Role.KTH_COMMUNITY': 'Role.kth',
  'Role.PUBLIC_BUYER': 'Role.buyer',
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(directory);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [key, value] of Object.entries(replacements)) {
    if (content.includes(key)) {
      content = content.replace(new RegExp(key.replace('.', '\\.'), 'g'), value);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
