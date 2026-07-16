const fs = require('fs');
const { execSync } = require('child_process');

const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

// Truncate from the end until syntax error disappears
for (let truncateAt = lines.length; truncateAt > 0; truncateAt--) {
  const chunk = lines.slice(0, truncateAt).join('\n') + '\n'; // add trailing newline
  fs.writeFileSync('/workspace/chunk.js', chunk);
  try {
    execSync('node --check /workspace/chunk.js', { stdio: 'pipe' });
    console.log(`Syntax OK when truncated at line ${truncateAt}`);
    // Show the next line that was removed
    if (truncateAt < lines.length) {
      console.log(`Next line (${truncateAt + 1}): ${lines[truncateAt].substring(0, 120)}`);
    }
    break;
  } catch (e) {
    // Still has error
  }
}
