const parser = require('@babel/parser');
const fs = require('fs');

const code = fs.readFileSync('/workspace/assets/js/pages/rules.js', 'utf8');

// Parse with error recovery to get multiple errors
try {
  const ast = parser.parse(code, {
    sourceType: 'script',
    plugins: ['jsx'],
    errorRecovery: true,
  });
  console.log('Parse completed with recovery');
  if (ast.errors && ast.errors.length > 0) {
    ast.errors.forEach((err, i) => {
      console.error(`Error ${i + 1}:`, err.message);
      console.error(`  at line ${err.loc?.line}, col ${err.loc?.column}`);
      if (err.codeFrame) {
        console.error(err.codeFrame);
      }
    });
  }
} catch (e) {
  console.error('Parse error:', e.message);
  if (e.loc) {
    console.error(`  at line ${e.loc.line}, col ${e.loc.column}`);
  }
}
