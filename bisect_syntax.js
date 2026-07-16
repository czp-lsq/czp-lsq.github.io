const fs = require('fs');
const { execSync } = require('child_process');

const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

// Binary search for syntax error
let low = 0;
let high = lines.length;

while (low < high) {
  const mid = Math.floor((low + high) / 2);
  const chunk = lines.slice(0, mid + 1).join('\n');
  fs.writeFileSync('/workspace/chunk.js', chunk);
  try {
    execSync('node --check /workspace/chunk.js', { stdio: 'pipe' });
    // No error in [0, mid]
    low = mid + 1;
  } catch (e) {
    // Error in [0, mid]
    high = mid;
  }
}

console.log(`First error line: ${low + 1}`);
const chunk = lines.slice(0, low + 1).join('\n');
fs.writeFileSync('/workspace/chunk.js', chunk);
try {
  execSync('node --check /workspace/chunk.js', { stdio: 'inherit' });
} catch (e) {}
