const fs = require('fs');

function checkFile(path) {
  const content = fs.readFileSync(path, 'utf8');
  let stack = [];
  let inString = false;
  let stringChar = null;
  let escaped = false;
  let inRegex = false;
  let inTemplateExpr = false;
  let templateExprDepth = 0;
  let line = 1;
  let col = 1;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const prev = i > 0 ? content[i-1] : '';

    if (ch === '\n') { line++; col = 1; }
    else { col++; }

    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === stringChar) { inString = false; stringChar = null; }
      if (stringChar === '`' && ch === '$' && i + 1 < content.length && content[i+1] === '{') {
        inTemplateExpr = true;
        templateExprDepth = 1;
        i++; col++;
      }
      continue;
    }

    if (inTemplateExpr) {
      if (ch === '{') templateExprDepth++;
      if (ch === '}') {
        templateExprDepth--;
        if (templateExprDepth === 0) inTemplateExpr = false;
      }
      continue;
    }

    if (inRegex) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '/') inRegex = false;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '/' && !inRegex) {
      const prevIsOp = /[=(,+\-*!&|?:;{}\[\s\n]/.test(prev) || prev === '' || prev === '>' || prev === '<';
      if (prevIsOp) {
        if (i + 1 < content.length && content[i+1] === '/') {
          while (i < content.length && content[i] !== '\n') i++;
          line++; col = 1;
          continue;
        }
        if (i + 1 < content.length && content[i+1] === '*') {
          i += 2;
          while (i < content.length - 1 && !(content[i] === '*' && content[i+1] === '/')) {
            if (content[i] === '\n') line++;
            i++;
          }
          i++;
          continue;
        }
        inRegex = true;
        continue;
      }
    }

    if (ch === '(') {
      stack.push({ line, col });
    } else if (ch === ')') {
      if (stack.length === 0) {
        console.log(`UNEXPECTED ) at line ${line}, col ${col}`);
      } else {
        stack.pop();
      }
    }
  }

  console.log(`${path}: Total unclosed: ${stack.length}`);
}

// Test on a known good file
checkFile('/workspace/assets/js/core/globals.js');

// Test on a simple synthetic file
fs.writeFileSync('/workspace/test_simple.js', `const a = () => { return 1; };\nconst b = { x: () => {} };\n`);
checkFile('/workspace/test_simple.js');

// Test on rules sub-modules
checkFile('/workspace/assets/js/pages/rules/stepTypes.js');
checkFile('/workspace/assets/js/pages/rules/AddStepModal.js');
