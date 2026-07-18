const fs = require('fs');
let code = fs.readFileSync('/app/applet/hooks/useGameLogic.ts', 'utf8');

code = code.replace(/lastWeekSchedule: 2,\n/, '');
fs.writeFileSync('/app/applet/hooks/useGameLogic.ts', code);
