const parser = require('@babel/parser');
const fs = require('fs');

const code = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8');

try {
  const ast = parser.parse(code, {
    sourceType: 'script',
    plugins: ['jsx'],
  });
  console.log('Parse successful');
} catch (e) {
  console.error('Parse error:', e.message);
  console.error('Line:', e.loc?.line, 'Column:', e.loc?.column);
}
