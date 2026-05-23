const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('./src');
const output = [];

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('AlertsCard') || content.includes('RiskAnalysisCard')) {
    output.push(`Found in ${file}`);
  }
});

fs.writeFileSync('search_results.txt', output.join('\n'));
console.log('Search done');
