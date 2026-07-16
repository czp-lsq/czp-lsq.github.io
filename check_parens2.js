const fs = require('fs');
const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

let stack = [];
let regexStart = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inString = false;
  let stringChar = null;
  let escaped = false;
  let inRegex = false;
  let inTemplateExpr = false;
  let templateExprDepth = 0;

  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    const prev = j > 0 ? line[j-1] : '';

    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === stringChar) { inString = false; stringChar = null; }
      if (stringChar === '`' && ch === '$' && j + 1 < line.length && line[j+1] === '{') {
        // template string interpolation
        inTemplateExpr = true;
        templateExprDepth = 1;
        j++;
      }
      continue;
    }

    if (inTemplateExpr) {
      if (ch === '{') templateExprDepth++;
      if (ch === '}') {
        templateExprDepth--;
        if (templateExprDepth === 0) {
          inTemplateExpr = false;
        }
      }
      continue;
    }

    if (inRegex) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '/') { inRegex = false; }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }

    // Detect regex: / after certain chars
    if (ch === '/' && !inRegex) {
      // simple heuristic: if prev is not an identifier char or ) or ]
      const prevIsOp = /[=(,+\-*!&|?:;{}\[]/.test(prev) || prev === '' || prev === ' ' || prev === '>' || prev === '<';
      if (prevIsOp) {
        // check if it's a comment
        if (j + 1 < line.length && line[j+1] === '/') {
          break; // single line comment
        }
        if (j + 1 < line.length && line[j+1] === '*') {
          // skip block comment
          j++;
          while (j < line.length - 1 && !(line[j] === '*' && line[j+1] === '/')) j++;
          j++;
          continue;
        }
        inRegex = true;
        continue;
      }
    }

    if (ch === '/' && j + 1 < line.length && line[j+1] === '/') {
      break;
    }
    if (ch === '/' && j + 1 < line.length && line[j+1] === '*') {
      j++;
      while (j < line.length - 1 && !(line[j] === '*' && line[j+1] === '/')) j++;
      j++;
      continue;
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
}

console.log('Remaining stack:');
stack.slice().reverse().forEach(item => {
  console.log(`  ${item.ch} at line ${item.line}, col ${item.col}`);
});
console.log(`Total unclosed: ${stack.length}`);
