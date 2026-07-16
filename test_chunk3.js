const fs = require('fs');
const { execSync } = require('child_process');

const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

// Test chunk from line 6411 to end, prepending opening and appending closing
const startIdx = 6410; // 0-indexed, line 6411
const chunk = 'const RulesPage = () => {\n' + lines.slice(startIdx).join('\n') + '\n};\n';
fs.writeFileSync('/workspace/chunk.js', chunk);
try {
  execSync('node --check /workspace/chunk.js', { stdio: 'pipe' });
  console.log('Syntax OK for lines 6411-end');
} catch (e) {
  const msg = e.stderr?.toString() || e.message;
  const match = msg.match(/:(\d+)/);
  const errLine = match ? parseInt(match[1]) : 'unknown';
  console.log(`Syntax error for lines 6411-end, reported at chunk line ${errLine}`);
}
