const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/event_generators.ts', 'utf8');

const lines = code.split('\n');
// We need to remove from line 3 to 14
lines.splice(2, 12);

fs.writeFileSync('/app/applet/data/event_generators.ts', lines.join('\n'));
