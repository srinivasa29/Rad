const yf = require('yahoo-finance2');
console.log('yf keys:', Object.keys(yf));
console.log('yf.default keys:', yf.default ? Object.keys(yf.default) : 'undefined');
console.log('yf.default constructor:', yf.default ? yf.default.constructor.name : 'undefined');
console.log('yf constructor:', yf.constructor.name);
