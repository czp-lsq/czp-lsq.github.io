const fs = require('fs');
const { execSync } = require('child_process');

const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

// Test chunk from line 271 to various endpoints, appending closing brace
const startIdx = 270; // 0-indexed, line 271

for (let endIdx = lines.length; endIdx > startIdx; endIdx -= 50) {
  const chunk = lines.slice(startIdx, endIdx).join('\n') + '\n};\n';
  fs.writeFileSync('/workspace/chunk.js', chunk);
  try {
    execSync('node --check /workspace/chunk.js', { stdio: 'pipe' });
    console.log(`Syntax OK when ending at line ${endIdx}`);
  } catch (e) {
    const msg = e.stderr?.toString() || e.message;
    const match = msg.match(/:(\d+)/);
    const errLine = match ? parseInt(match[1]) : 'unknown';
    console.log(`Syntax error when ending at line ${endIdx}, reported at line ${errLine}`);
  }
}
