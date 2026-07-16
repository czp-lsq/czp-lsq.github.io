const fs = require('fs');
const { execSync } = require('child_process');

const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

// Test chunk from line 1557 to 6410, with wrapping
const startIdx = 1556; // line 1557
const endIdx = 6410;   // line 6410
const chunk = '(function() {\n' + lines.slice(startIdx, endIdx).join('\n') + '\n})();\n';
fs.writeFileSync('/workspace/chunk.js', chunk);
try {
  execSync('node --check /workspace/chunk.js', { stdio: 'pipe' });
  console.log('Syntax OK for lines 1557-6410');
} catch (e) {
  const msg = e.stderr?.toString() || e.message;
  const match = msg.match(/:(\d+)/);
  const errLine = match ? parseInt(match[1]) : 'unknown';
  console.log(`Syntax error for lines 1557-6410, reported at chunk line ${errLine}`);
}
