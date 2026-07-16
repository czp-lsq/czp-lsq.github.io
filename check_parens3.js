const fs = require('fs');
const lines = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8').split('\n');

function checkRange(startIdx, endIdx, label) {
  let stack = [];
  for (let i = startIdx; i < endIdx; i++) {
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
        const prevIsOp = /[=(,+\-*!&|?:;{}\[\s]/.test(prev) || prev === '' || prev === '>' || prev === '<';
        if (prevIsOp) {
          if (j + 1 < line.length && line[j+1] === '/') { break; }
          if (j + 1 < line.length && line[j+1] === '*') {
            j++;
            while (j < line.length - 1 && !(line[j] === '*' && line[j+1] === '/')) j++;
            j++;
            continue;
          }
          inRegex = true;
          continue;
        }
      }

      if (ch === '/' && j + 1 < line.length && line[j+1] === '/') { break; }
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
          console.log(`${label}: UNEXPECTED ${ch} at line ${i+1}, col ${j+1}`);
        } else {
          const top = stack.pop();
          if (top.ch !== expected) {
            console.log(`${label}: MISMATCH: expected ${top.ch} (line ${top.line}, col ${top.col}) but got ${ch} at line ${i+1}, col ${j+1}`);
          }
        }
      }
    }
  }
  console.log(`${label}: Remaining unclosed: ${stack.length}`);
  if (stack.length > 0 && stack.length <= 5) {
    stack.slice().reverse().forEach(item => console.log(`  ${item.ch} at line ${item.line}, col ${item.col}`));
  }
}

// Check segments
checkRange(0, 270, 'MapValueEditor+AdvancedRuleConfig def');     // before RulesPage
checkRange(270, 868, 'RulesPage before getStepTypeInfo');         // before internal getStepTypeInfo
checkRange(868, 1330, 'getStepTypeInfo def');                     // getStepTypeInfo
checkRange(1330, 6410, 'getStepTypePreview + helpers');           // getStepTypePreview etc
checkRange(6410, 8004, 'RulesPage return');                       // main return
checkRange(8004, 8005, 'last line');                              // last line

// Full file
checkRange(0, lines.length, 'FULL FILE');
