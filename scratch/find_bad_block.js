const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('src/App.jsx', 'utf8');

try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('SUCCESS! App.jsx parsed cleanly without syntax errors!');
} catch (err) {
  console.error('PARSE ERROR:', err.message);
  if (err.loc) {
    const lines = code.split('\n');
    const lineNum = err.loc.line;
    console.error(`Error at line ${lineNum}, col ${err.loc.column}:`);
    for (let i = Math.max(0, lineNum - 10); i < Math.min(lines.length, lineNum + 10); i++) {
      console.error(`${i + 1}: ${lines[i]}`);
    }
  }
}
