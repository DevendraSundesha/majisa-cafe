const fs = require('fs');
const txt = fs.readFileSync('./src/App.jsx', 'utf8');
const lines = txt.split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('admin') || l.includes('पासवर्ड') || l.includes('PIN') || l.includes('lock') || l.includes('modal') || l.includes('secret') || l.includes('auth')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
