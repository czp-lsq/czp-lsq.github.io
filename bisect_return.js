const fs = require('fs');
const { execSync } = require('child_process');

const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

// The return statement is from line 6411 to 8004
// Line 6411 is "return React.createElement(...)"
// We need to find where in this range the syntax error starts

const returnStart = 6410; // 0-indexed, line 6411

// We know the full return has error.
// Let's binary search within the return statement.

let low = returnStart + 1; // at least include line 6411
let high = lines.length; // up to line 8005

// Function to test a chunk ending at endIdx
function testChunk(endIdx) {
  const chunk = 'const RulesPage = () => {\n' + lines.slice(returnStart, endIdx).join('\n') + '\n};\n';
  fs.writeFileSync('/workspace/chunk.js', chunk);
  try {
    execSync('node --check /workspace/chunk.js', { stdio: 'pipe' });
    return true; // OK
  } catch (e) {
    return false; // Error
  }
}

// First verify: full return statement has error
console.log('Full return has error:', !testChunk(lines.length));

// Binary search for the exact line where error appears
while (low < high) {
  const mid = Math.floor((low + high) / 2);
  const ok = testChunk(mid);
  if (ok) {
    low = mid + 1;
  } else {
    high = mid;
  }
}

console.log(`First error line in original file: ${low + 1}`);

// Show context
for (let i = Math.max(0, low - 3); i < Math.min(lines.length, low + 3); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
