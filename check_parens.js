const fs = require('fs');
const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

// Analyze from line 6411 to 8004
const start = 6410; // 0-indexed
const end = 8004;   // 0-indexed, line 8005 is "};"

let stack = [];
let lineNum = start + 1;
for (let i = start; i < end; i++) {
  const line = lines[i];
  // skip strings roughly
  let inString = false;
  let stringChar = null;
  let escaped = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
        stringChar = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === '/' && j + 1 < line.length && line[j+1] === '/') {
      break; // rest of line is comment
    }
    if (ch === '(' || ch === '{' || ch === '[') {
      stack.push({ ch, line: i + 1, col: j + 1 });
    } else if (ch === ')' || ch === '}' || ch === ']') {
      const expected = ch === ')' ? '(' : ch === '}' ? '{' : '[';
      if (stack.length === 0) {
        console.log(`UNEXPECTED ${ch} at line ${i+1}, col ${j+1}`);
      } else {
        const top = stack.pop();
        if (top.ch !== expected) {
          console.log(`MISMATCH: expected ${top.ch} (line ${top.line}, col ${top.col}) but got ${ch} at line ${i+1}, col ${j+1}`);
        }
      }
    }
  }
  lineNum++;
}

console.log('Remaining stack:');
stack.slice().reverse().forEach(item => {
  console.log(`  ${item.ch} at line ${item.line}, col ${item.col}`);
});
console.log(`Total unclosed: ${stack.length}`);
