const fs = require('fs');
const txt = fs.readFileSync('./src/App.jsx', 'utf8');
const lines = txt.split('\n');
lines.forEach((l, i) => {
  if (l.includes('1122') || l.includes('Pin') || l.includes('pin')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
