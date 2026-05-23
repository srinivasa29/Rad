const fs = require('fs');
const content = fs.readFileSync('./src/pages/TraderStockPage.jsx', 'utf8');
const lines = content.split('\n');
const imports = lines.filter(line => line.trim().startsWith('import '));
fs.writeFileSync('imports_results.txt', imports.join('\n'));
