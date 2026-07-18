const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/events_semester2.ts', 'utf8');
code = code.replace(/s\.week === 12/g, 's.week === 14'); // change the conditional ones to 14
// Wait, the fixedWeek: 12 shouldn't be changed.
fs.writeFileSync('/app/applet/data/events_semester2.ts', code);
